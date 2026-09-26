const TARGET_SCORE = 5;
const STORAGE_KEY = 'widw-game-v1';

const TASKS = {
  bar: [
    'Gib einer fremden Person ein ehrliches Kompliment.',
    'Lass dir von jemandem in der Bar einen neuen Spitznamen geben.',
    'Bestell dein nächstes alkoholfreies Getränk so dramatisch wie in einem Agentenfilm.',
    'Frag eine fremde Person nach ihrem aktuellen Lieblingssong.',
    'Finde jemanden, der im selben Monat Geburtstag hat wie du.',
    'Bitte eine Person aus einer anderen Gruppe um eine spontane High-Five-Bewertung von 1 bis 10.',
    'Tanz 20 Sekunden so, als wärst du im Finale eines Musikvideos.',
    'Überzeuge jemanden aus eurer Gruppe in 30 Sekunden davon, warum du heute der beste DJ wärst.',
    'Frag eine fremde Person, welchen Drink sie jemandem empfehlen würde, der heute etwas Neues probieren will.',
    'Mach ein Gruppenfoto, auf dem alle absichtlich viel zu ernst schauen.',
    'Finde in zwei Minuten jemanden mit derselben Schuhfarbe wie du und hol dir ein High Five.',
    'Erfinde einen völlig übertriebenen Künstlernamen für dich und stell dich einer Person damit vor.',
    'Bestell an der Bar nur mit Gestik und maximal fünf gesprochenen Wörtern.',
    'Frag jemanden nach der besten spontanen Party-Idee für später am Abend.',
    'Mach einer Person aus eurer Gruppe eine 15-sekündige Oscar-Dankesrede.',
    'Lass eine Person aus eurer Gruppe deinen nächsten Profilbild-Pose bestimmen.',
    'Sprich für die nächsten zwei Minuten so, als würdest du einen Naturfilm kommentieren.',
    'Finde jemanden mit einem auffälligen Kleidungsstück und mach ein ehrliches Kompliment dazu.',
    'Starte mit deiner Gruppe einen fünfsekündigen Mini-Applaus für etwas völlig Banales.',
    'Lass die Gruppe ein harmloses Wort bestimmen, das du in dein nächstes Gespräch einbauen musst.'
  ],
  restaurant: [
    'Lass die Person links von dir entscheiden, welches alkoholfreie Getränk du nehmen würdest.',
    'Erzähle dem Tisch deine peinlichste harmlose Urlaubsgeschichte.',
    'Sprich die nächsten zwei Minuten wie ein übermotivierter Restaurantkritiker.',
    'Mach jeder Person am Tisch ein ehrliches Kompliment.',
    'Lass die Gruppe einen neuen Spitznamen für dich festlegen, der bis zum Ende des Essens gilt.',
    'Erkläre dein aktuelles Gericht in 20 Sekunden so, als wäre es ein Luxusprodukt.',
    'Tausche für drei Minuten den Platz mit der Person gegenüber.',
    'Erfinde eine absurde Hintergrundgeschichte dazu, wie sich zwei Personen am Tisch kennengelernt haben.',
    'Lass die Person rechts von dir drei Fragen stellen, die du jeweils mit nur einem Wort beantworten darfst.',
    'Halte eine 20-sekündige Dankesrede auf etwas völlig Alltägliches auf dem Tisch.',
    'Bestimme für jede Person am Tisch einen Filmtitel, der zu ihrem heutigen Abend passt.',
    'Lass die Gruppe eine berühmte Person auswählen und imitiere sie 20 Sekunden lang.',
    'Beschreibe dein Essen, ohne die drei offensichtlichsten Wörter dafür zu verwenden.',
    'Erfinde einen neuen Namen für das Restaurant und einen passenden Werbeslogan.',
    'Erzähle eine Geschichte aus deinem Leben, in der zwei Details frei erfunden sind. Die anderen müssen raten.',
    'Sprich eine Minute lang nur in Fragen.',
    'Lass die Gruppe ein Thema wählen und halte dazu spontan eine 30-sekündige Mini-Präsentation.',
    'Sag, wer am Tisch in einem Film welche Rolle spielen würde.',
    'Formuliere eine übertrieben höfliche Beschwerde über etwas, das eigentlich völlig in Ordnung ist – nur am eigenen Tisch.',
    'Lass die Gruppe entscheiden, welches Emoji dich heute am besten beschreibt, und verteidige die Wahl.'
  ]
};

let state = createEmptyState();
let deferredInstallPrompt = null;
let toastTimer = null;

const $ = (id) => document.getElementById(id);
const screens = ['setupScreen', 'gameScreen', 'winnerScreen'];
const steps = ['taskChoiceStep', 'challengeStep', 'voteIntroStep', 'voteStep', 'voteResultStep', 'proofStep', 'roundEndStep'];

function createEmptyState() {
  return {
    started: false,
    mode: 'bar',
    loserStake: 'Bezahlt die nächste Runde',
    players: [],
    activeIndex: 0,
    round: 1,
    currentTask: null,
    currentTaskSource: null,
    voters: [],
    votes: [],
    voteCursor: 0,
    proofPlayerId: null,
    pendingProof: false,
    winnerId: null,
    loserId: null,
    tiedLoserIds: []
  };
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.players?.length) state = parsed;
  } catch (_) {}
}

function setScreen(id) {
  screens.forEach(s => $(s).classList.toggle('active', s === id));
  $('homeBtn').classList.toggle('hidden', id === 'setupScreen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setStep(id) {
  steps.forEach(s => $(s).classList.toggle('active', s === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function escapeHtml(text = '') {
  return text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

function getActivePlayer() { return state.players[state.activeIndex]; }
function getSetterIndex() { return (state.activeIndex - 1 + state.players.length) % state.players.length; }
function getSetter() { return state.players[getSetterIndex()]; }
function getPlayerById(id) { return state.players.find(p => p.id === id); }

function renderSetup() {
  document.querySelectorAll('.mode-card').forEach(btn => btn.classList.toggle('selected', btn.dataset.mode === state.mode));
  $('loserStake').value = state.loserStake || 'Bezahlt die nächste Runde';
  $('playerCount').textContent = state.players.length;
  $('startGameBtn').disabled = state.players.length < 3;
  $('resumeGameBtn').classList.toggle('hidden', !state.started || !!state.winnerId);

  const list = $('playerList');
  if (!state.players.length) {
    list.className = 'player-list empty-state';
    list.textContent = 'Noch keine Spieler hinzugefügt.';
  } else {
    list.className = 'player-list';
    list.innerHTML = state.players.map(p => `
      <div class="player-item">
        <strong>${escapeHtml(p.name)}</strong>
        <button class="remove-player" data-id="${p.id}" aria-label="${escapeHtml(p.name)} entfernen">×</button>
      </div>`).join('');
  }
}

function renderGameHeader() {
  const active = getActivePlayer();
  const setter = getSetter();
  $('scoreStrip').innerHTML = state.players.map((p, i) => `
    <div class="score-chip ${i === state.activeIndex ? 'active' : ''}">
      <span class="name">${escapeHtml(p.name)}</span>
      <span class="pts">${p.score}/${TARGET_SCORE}</span>
      <div class="powers">${p.vetoUsed ? '🛡️×' : '🛡️'} ${p.rerollUsed ? '🔄×' : '🔄'}</div>
    </div>`).join('');
  $('modeBadge').textContent = state.mode === 'bar' ? '🍸 Bar / Club' : '🍝 Restaurant';
  $('roundLabel').textContent = `Runde ${state.round}`;
  $('activePlayerName').textContent = active.name;
  $('setterText').textContent = `${setter.name} stellt die Aufgabe.`;
  $('taskTargetName').textContent = active.name;
  $('voteReceiver').textContent = active.name;
}

function renderChallenge() {
  const active = getActivePlayer();
  $('challengeText').textContent = `„${state.currentTask}“`;
  $('taskSource').textContent = state.currentTaskSource === 'custom' ? `Von ${getSetter().name}` : '✨ App-Vorschlag';
  $('vetoBtn').disabled = active.vetoUsed;
  $('rerollBtn').disabled = active.rerollUsed;
  $('vetoBtn').innerHTML = active.vetoUsed ? '🛡️ Veto <small>verbraucht</small>' : '🛡️ Veto <small>1×</small>';
  $('rerollBtn').innerHTML = active.rerollUsed ? '🔄 Neue Aufgabe <small>verbraucht</small>' : '🔄 Neue Aufgabe <small>1×</small>';
}

function randomTask() {
  const pool = TASKS[state.mode];
  const alternatives = pool.filter(t => t !== state.currentTask);
  return alternatives[Math.floor(Math.random() * alternatives.length)] || pool[0];
}

function addPoint(player, amount) {
  player.score += amount;
  renderGameHeader();
}

function prepareRound() {
  state.currentTask = null;
  state.currentTaskSource = null;
  state.voters = [];
  state.votes = [];
  state.voteCursor = 0;
  state.proofPlayerId = null;
  state.pendingProof = false;
  $('customTaskInput').value = '';
  renderGameHeader();
  setStep('taskChoiceStep');
  saveState();
}

function finishRound(message) {
  $('roundEndTitle').textContent = 'Runde abgeschlossen';
  $('roundEndText').textContent = message;
  setStep('roundEndStep');
  saveState();
}

function checkWinner() {
  const winner = state.players.find(p => p.score >= TARGET_SCORE);
  if (!winner) return false;
  state.winnerId = winner.id;
  const others = state.players.filter(p => p.id !== winner.id);
  const minScore = Math.min(...others.map(p => p.score));
  const tied = others.filter(p => p.score === minScore);
  state.tiedLoserIds = tied.map(p => p.id);
  state.loserId = tied[Math.floor(Math.random() * tied.length)].id;
  state.started = false;
  saveState();
  renderWinner();
  setScreen('winnerScreen');
  return true;
}

function nextRound() {
  if (checkWinner()) return;
  state.activeIndex = (state.activeIndex + 1) % state.players.length;
  state.round += 1;
  prepareRound();
}

function startGame() {
  if (state.players.length < 3) return;
  state.started = true;
  state.winnerId = null;
  state.loserId = null;
  state.tiedLoserIds = [];
  state.activeIndex = 0;
  state.round = 1;
  state.players = state.players.map(p => ({ ...p, score: 0, vetoUsed: false, rerollUsed: false }));
  saveState();
  renderGameHeader();
  setScreen('gameScreen');
  prepareRound();
}

function setupVoting() {
  const active = getActivePlayer();
  state.voters = state.players.filter(p => p.id !== active.id).map(p => p.id);
  state.votes = [];
  state.voteCursor = 0;
  if (!state.voters.length) {
    showToast('Für die Fairness-Abstimmung braucht ihr mindestens 3 Spieler.');
    return;
  }
  $('voterName').textContent = getPlayerById(state.voters[0]).name;
  setStep('voteStep');
}

function recordVote(choice) {
  const voterId = state.voters[state.voteCursor];
  state.votes.push({ voterId, choice });
  state.voteCursor += 1;
  if (state.voteCursor < state.voters.length) {
    $('voterName').textContent = getPlayerById(state.voters[state.voteCursor]).name;
    showToast('Stimme gespeichert. Handy weitergeben.');
  } else {
    resolveVote();
  }
  saveState();
}

function resolveVote() {
  const fairVotes = state.votes.filter(v => v.choice === 'fair');
  const hardVotes = state.votes.filter(v => v.choice === 'hard');
  const active = getActivePlayer();
  const setter = getSetter();
  // Bei Gleichstand gilt die Aufgabe zugunsten des Spielers als zu hart.
  const majorityHard = hardVotes.length >= fairVotes.length;

  if (majorityHard) {
    addPoint(setter, -1);
    $('resultEmoji').textContent = '↩️';
    $('voteResultTitle').textContent = 'Backfire!';
    $('voteResultText').textContent = `Die Gruppe findet die Aufgabe zu hart. ${active.name} bleibt straffrei und ${setter.name} verliert 1 Punkt.`;
    $('proofPotBox').classList.add('hidden');
    state.pendingProof = false;
  } else {
    addPoint(active, -1);
    $('resultEmoji').textContent = '🎯';
    $('voteResultTitle').textContent = 'War wohl doch machbar.';
    $('voteResultText').textContent = `${active.name} verliert 1 Punkt. Jetzt gilt: Wer „war nicht zu hart“ gesagt hat, muss dafür geradestehen.`;

    if (fairVotes.length) {
      const pickedVote = fairVotes[Math.floor(Math.random() * fairVotes.length)];
      state.proofPlayerId = pickedVote.voterId;
      state.pendingProof = true;
      const proof = getPlayerById(state.proofPlayerId);
      $('proofPotBox').innerHTML = `<strong>${escapeHtml(proof.name)}</strong> wurde aus dem „Dann mach du es“-Topf gezogen.`;
      $('proofPotBox').classList.remove('hidden');
    } else {
      state.pendingProof = false;
      $('proofPotBox').classList.add('hidden');
    }
  }
  setStep('voteResultStep');
  saveState();
}

function renderProofStep() {
  const proof = getPlayerById(state.proofPlayerId);
  $('proofPlayerName').textContent = proof.name;
  $('proofChallenge').textContent = state.currentTask;
  setStep('proofStep');
}

function renderWinner() {
  const winner = getPlayerById(state.winnerId);
  const loser = getPlayerById(state.loserId);
  $('winnerName').textContent = winner?.name || '';
  $('loserName').textContent = loser?.name || '';
  $('loserStakeResult').textContent = loser ? `${loser.name}: ${state.loserStake}` : '';
  const tie = state.tiedLoserIds?.length > 1;
  $('tieNote').classList.toggle('hidden', !tie);
  if (tie) $('tieNote').textContent = `Mehrere Spieler waren punktgleich Letzte. Für den Prototypen hat die App ${loser.name} per Los als Verlierer bestimmt.`;
  $('finalScores').innerHTML = `<h3>Endstand</h3>` + [...state.players]
    .sort((a,b) => b.score - a.score)
    .map(p => `<div class="final-score-row"><strong>${escapeHtml(p.name)}</strong><span>${p.score} Punkte</span></div>`).join('');
}

// Setup events
document.querySelectorAll('.mode-card').forEach(btn => btn.addEventListener('click', () => {
  state.mode = btn.dataset.mode;
  renderSetup();
  saveState();
}));

$('playerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('playerName');
  const name = input.value.trim();
  if (!name) return;
  if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    showToast('Den Namen gibt es schon.');
    return;
  }
  state.players.push({ id: uid(), name, score: 0, vetoUsed: false, rerollUsed: false });
  input.value = '';
  renderSetup();
  saveState();
});

$('playerList').addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-player');
  if (!btn || state.started) return;
  state.players = state.players.filter(p => p.id !== btn.dataset.id);
  renderSetup();
  saveState();
});

$('loserStake').addEventListener('input', (e) => {
  state.loserStake = e.target.value.trim() || 'Bezahlt die nächste Runde';
  saveState();
});

$('startGameBtn').addEventListener('click', startGame);
$('resumeGameBtn').addEventListener('click', () => {
  setScreen('gameScreen');
  renderGameHeader();
  prepareRound();
});

// Round events
$('useCustomTaskBtn').addEventListener('click', () => {
  const task = $('customTaskInput').value.trim();
  if (!task) {
    showToast('Erst eine Aufgabe eingeben – oder Vorschlag wählen.');
    return;
  }
  state.currentTask = task;
  state.currentTaskSource = 'custom';
  renderChallenge();
  setStep('challengeStep');
  saveState();
});

$('suggestTaskBtn').addEventListener('click', () => {
  state.currentTask = randomTask();
  state.currentTaskSource = 'suggested';
  renderChallenge();
  setStep('challengeStep');
  saveState();
});

$('vetoBtn').addEventListener('click', () => {
  const active = getActivePlayer();
  if (active.vetoUsed) return;
  active.vetoUsed = true;
  finishRound(`${active.name} nutzt das Veto. Keine Diskussion, keine Strafe.`);
});

$('rerollBtn').addEventListener('click', () => {
  const active = getActivePlayer();
  if (active.rerollUsed) return;
  active.rerollUsed = true;
  state.currentTask = randomTask();
  state.currentTaskSource = 'suggested';
  renderChallenge();
  showToast('Neue App-Aufgabe gezogen.');
  saveState();
});

$('completeBtn').addEventListener('click', () => {
  const active = getActivePlayer();
  addPoint(active, 1);
  if (checkWinner()) return;
  finishRound(`${active.name} bekommt 1 Punkt.`);
});

$('refuseBtn').addEventListener('click', () => setStep('voteIntroStep'));
$('startVoteBtn').addEventListener('click', setupVoting);
$('voteFairBtn').addEventListener('click', () => recordVote('fair'));
$('voteHardBtn').addEventListener('click', () => recordVote('hard'));

$('continueAfterVoteBtn').addEventListener('click', () => {
  if (state.pendingProof && state.proofPlayerId) renderProofStep();
  else finishRound('Die Entscheidung der Gruppe steht.');
});

$('proofCompleteBtn').addEventListener('click', () => {
  const proof = getPlayerById(state.proofPlayerId);
  addPoint(proof, 1);
  state.pendingProof = false;
  if (checkWinner()) return;
  finishRound(`${proof.name} hat es bewiesen und bekommt 1 Punkt.`);
});

$('proofSkipBtn').addEventListener('click', () => {
  const proof = getPlayerById(state.proofPlayerId);
  state.pendingProof = false;
  addPoint(proof, -2);
  finishRound(`${proof.name} hat gesagt, die Aufgabe sei nicht zu hart, sie dann aber verweigert: −2 Punkte.`);
});

$('nextRoundBtn').addEventListener('click', nextRound);

// Navigation / reset
$('homeBtn').addEventListener('click', () => {
  if (confirm('Zum Startbildschirm? Dein laufendes Spiel bleibt gespeichert.')) {
    renderSetup();
    setScreen('setupScreen');
  }
});

$('playAgainBtn').addEventListener('click', () => {
  state.players = state.players.map(p => ({ ...p, score: 0, vetoUsed: false, rerollUsed: false }));
  state.started = true;
  state.activeIndex = 0;
  state.round = 1;
  state.winnerId = null;
  state.loserId = null;
  state.tiedLoserIds = [];
  saveState();
  setScreen('gameScreen');
  prepareRound();
});

$('backToSetupBtn').addEventListener('click', () => {
  const mode = state.mode;
  const stake = state.loserStake;
  state = createEmptyState();
  state.mode = mode;
  state.loserStake = stake;
  localStorage.removeItem(STORAGE_KEY);
  renderSetup();
  setScreen('setupScreen');
});

// PWA install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  $('installBtn').classList.remove('hidden');
});

$('installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $('installBtn').classList.add('hidden');
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

loadState();
renderSetup();
if (state.winnerId) {
  renderWinner();
  setScreen('winnerScreen');
}
