/* =====================================================
   app.js — Math Workout front-end logic
   ===================================================== */

/* ── State ─────────────────────────────────────── */
const STATE = {
  currentGame:    null,
  difficulty:     'easy',
  questionCount:  20,
  questions:      [],
  currentQ:       0,
  userAnswer:     '',
  correct:        0,
  wrong:          0,
  wrongQuestions: new Set(), // tracks unique question indices that had a wrong attempt
  startTime:      null,
  timer:          null,
  elapsed:        0,
  penaltyMs:      0,
  PENALTY_MS:     5000,
  brainDiff:      'low',
  tableNum:       2,
  theme:          'classic',
  soundOn:        false,
  gameActive:     false,
  brainTimerInterval: null,
};

/* ── Themes ─────────────────────────────────────── */
const THEMES = {
  classic:  { bg: '#e8e8e8', card: '#f2f2f2' },
  pink:     { bg: '#f9e0e0', card: '#faeaea' },
  mint:     { bg: '#d6f0e4', card: '#e6f7ee' },
  lavender: { bg: '#e5dff5', card: '#ede8f9' },
  peach:    { bg: '#f5e8d5', card: '#faf0e0' },
  cream:    { bg: '#f5f0d8', card: '#faf7e8' },
  sky:      { bg: '#d5eaf9', card: '#e5f2fb' },
};

/* ── Screen navigation ─────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── Home ──────────────────────────────────────── */
function goHome() {
  clearGameState();
  showScreen('screen-home');
}

/* ── Settings ──────────────────────────────────── */
function openSettings() {
  renderSettingsUI();
  showScreen('screen-settings');
}
function renderSettingsUI() {
  document.querySelectorAll('[data-q]').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.q) === STATE.questionCount));
  document.querySelectorAll('[data-sdifficulty]').forEach(b =>
    b.classList.toggle('active', b.dataset.sdifficulty === STATE.difficulty));
  document.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.theme === STATE.theme));
  document.getElementById('toggle-sound').checked = STATE.soundOn;
}
function setQCount(n) {
  STATE.questionCount = n;
  document.querySelectorAll('[data-q]').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.q) === n));
}
function setGlobalDifficulty(d) {
  STATE.difficulty = d;
  document.querySelectorAll('[data-sdifficulty]').forEach(b =>
    b.classList.toggle('active', b.dataset.sdifficulty === d));
}
function setTheme(t) {
  STATE.theme = t;
  const th = THEMES[t] || THEMES.classic;
  document.documentElement.style.setProperty('--bg', th.bg);
  document.documentElement.style.setProperty('--card-bg', th.card);
  document.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.theme === t));
  const names = {classic:'Classic',pink:'Rose Pink',mint:'Mint Green',
                 lavender:'Lavender',peach:'Peach',cream:'Cream',sky:'Sky Blue'};
  const el = document.getElementById('theme-name');
  if (el) el.textContent = names[t] || t;
}

/* ── Sub-menus ─────────────────────────────────── */
function openSubMenu(game) {
  STATE.currentGame = game;
  const screens = {
    add_sub: 'screen-addsub', mul_div: 'screen-muldiv',
    feeling_clever: 'screen-feeling', times_table: 'screen-times',
    brain_cruncher: 'screen-brain',   mental_math: 'screen-mental',
    brain_age: 'screen-brainAge',
  };
  const target = screens[game];
  if (target) showScreen(target);
}

function startStandardGame(gameType) { startGame(gameType, STATE.difficulty); }

/* ── Times Table ───────────────────────────────── */
function selectTable(n) {
  STATE.tableNum = n;
  document.querySelectorAll('.table-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.table) === n));
}
function startTimesGame() { startGame('times_table', STATE.difficulty); }

/* ── Brain Cruncher ────────────────────────────── */
function selectBrainDiff(d) {
  STATE.brainDiff = d;
  document.querySelectorAll('[data-bdiff]').forEach(b =>
    b.classList.toggle('active', b.dataset.bdiff === d));
}

// Brain Cruncher has its OWN question count per difficulty
// (does NOT use the global Settings count)
const BRAIN_COUNTS = { low: 10, medium: 20, high: 30 };

function startBrainGame() {
  const count = BRAIN_COUNTS[STATE.brainDiff] || 10;
  startGame('brain_cruncher', STATE.brainDiff, count);
}
function startMentalGame() { startGame('mental_math', STATE.difficulty); }
function startBrainAge()   { STATE.currentGame = 'brain_age'; startGame('feeling_clever', 'easy', 10); }

/* ── Core game start ───────────────────────────── */
async function startGame(gameType, diff, countOverride) {
  STATE.currentGame = gameType;
  STATE.difficulty  = diff;
  const count = countOverride || STATE.questionCount;

  const params = new URLSearchParams({ difficulty: diff, count, table: STATE.tableNum });
  const resp = await fetch(`/api/questions/${gameType}?${params}`);
  const data = await resp.json();

  STATE.questions     = data.questions;
  STATE.currentQ      = 0;
  STATE.userAnswer    = '';
  STATE.correct       = 0;
  STATE.wrong         = 0;
  STATE.penaltyMs     = 0;
  STATE.wrongQuestions = new Set();
  STATE.gameActive    = false; // locked until countdown finishes

  // Show 3-2-1 countdown with game-specific title, then launch
  const diffLabels = { low:'LOW PRESSURE', medium:'MEDIUM PRESSURE', high:'HIGH PRESSURE',
                       easy:'EASY', medium:'MEDIUM', hard:'HARD', very_hard:'VERY HARD' };
  const gameNames = {
    brain_cruncher: 'Get Ready',
    mental_math:    'Get Ready',
    add_sub:        'Get Ready',
    mul_div:        'Get Ready',
    feeling_clever: 'Get Ready',
    times_table:    'Get Ready',
    brain_age:      'Brain Age Check',
  };
  const gameSubs = {
    brain_cruncher: `${(diffLabels[STATE.brainDiff]||'LOW PRESSURE')} BRAIN CRUNCHER`,
    mental_math:    'MENTAL MATH MASTER',
    brain_age:      'FEELING CLEVER',
  };
  runCountdown(() => {
    if (gameType === 'brain_cruncher') {
      startChain();
    } else if (gameType === 'mental_math') {
      STATE.gameActive = true;
      showScreen('screen-game-mental');
      renderMentalQuestion();
      startMsTimer('mental-timer-display');
    } else {
      STATE.gameActive = true;
      showScreen('screen-game');
      renderQuestion();
      startMsTimer('timer-display');
    }
  }, gameNames[gameType] || 'Get Ready', gameSubs[gameType] || '');
}

/** Show 3 → 2 → 1 → GO! countdown screen, then call cb
 * @param {Function} cb  - callback after GO!
 * @param {string} title - big title in card, e.g. "Get Ready"
 * @param {string} sub   - subtitle, e.g. "LOW PRESSURE BRAIN CRUNCHER"
 */
function runCountdown(cb, title = 'Get Ready', sub = '') {
  const titleEl = document.getElementById('countdown-game-title');
  const subEl   = document.getElementById('countdown-game-sub');
  if (titleEl) titleEl.textContent = title;
  if (subEl)   subEl.textContent   = sub;

  showScreen('screen-countdown');
  const el = document.getElementById('countdown-num');
  let n = 3;
  el.textContent = n;
  el.classList.remove('go', 'pop');
  void el.offsetWidth;
  el.classList.add('pop');

  const tick = setInterval(() => {
    n--;
    if (n > 0) {
      el.textContent = n;
      el.classList.remove('pop', 'go'); void el.offsetWidth; el.classList.add('pop');
    } else {
      clearInterval(tick);
      el.textContent = 'GO!';
      el.classList.remove('pop'); void el.offsetWidth;
      el.classList.add('go');
      setTimeout(cb, 700);
    }
  }, 1000);
}

/* ════════════════════════════════════════════════
   MILLISECOND TIMER (requestAnimationFrame)
   ════════════════════════════════════════════════ */
function startMsTimer(elId) {
  STATE.startTime = performance.now();
  if (STATE.timer) cancelAnimationFrame(STATE.timer);

  function tick() {
    STATE.elapsed = performance.now() - STATE.startTime;
    const el = document.getElementById(elId);
    if (el) el.textContent = formatMs(STATE.elapsed);
    STATE.timer = requestAnimationFrame(tick);
  }
  STATE.timer = requestAnimationFrame(tick);
}

function stopMsTimer() {
  if (STATE.timer) { cancelAnimationFrame(STATE.timer); STATE.timer = null; }
  // Capture final elapsed
  if (STATE.startTime) STATE.elapsed = performance.now() - STATE.startTime;
}

/** Format ms → mm:ss.ms  e.g.  00:59.949 */
function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes  = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const seconds  = (totalSec % 60).toString().padStart(2, '0');
  const millis   = Math.floor(ms % 1000).toString().padStart(3, '0');
  return `${minutes}:${seconds}.${millis}`;
}

/** Shorter mm:ss for display where ms isn't needed */
function formatSec(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

/* ════════════════════════════════════════════════
   STANDARD GAME QUESTION RENDER
   ════════════════════════════════════════════════ */
function renderQuestion() {
  const q = STATE.questions[STATE.currentQ];
  if (!q) return;
  const total = STATE.questions.length;
  const idx   = STATE.currentQ + 1;

  document.getElementById('progress-label').textContent = `${idx} / ${total}`;
  document.getElementById('progress-bar').style.width   = `${(idx / total) * 100}%`;
  document.getElementById('question-text').textContent  = q.question;

  const ad = document.getElementById('answer-display');
  ad.textContent = '?'; ad.className = 'answer-display';

  const fb = document.getElementById('feedback-overlay');
  fb.className = 'feedback-overlay'; fb.textContent = '';

  STATE.userAnswer = '';
}

/* ── Numpad input ──────────────────────────────── */
function numPress(val) {
  if (!STATE.gameActive) return;
  if (val === 'DEL') STATE.userAnswer = STATE.userAnswer.slice(0, -1);
  else if (val === 'C') STATE.userAnswer = '';
  else { if (STATE.userAnswer.length >= 6) return; STATE.userAnswer += val; }

  const el = document.getElementById('answer-display');
  if (el) {
    el.textContent = STATE.userAnswer || '?';
    el.className   = 'answer-display' + (STATE.userAnswer ? ' has-value' : '');
  }
  if (STATE.userAnswer) autoCheck();
}

function autoCheck() {
  const q        = STATE.questions[STATE.currentQ];
  if (!q) return;
  const expected = String(q.answer);
  const typed    = STATE.userAnswer;
  // Exact match → submit correct
  if (typed === expected) { submitAnswer(); return; }
  // Typed same number of digits but wrong, or more digits → submit
  if (typed.length >= expected.length) submitAnswer();
}

function submitAnswer() {
  if (!STATE.gameActive) return;
  const q = STATE.questions[STATE.currentQ];
  if (!q) return;
  const correct = parseInt(STATE.userAnswer, 10) === q.answer;

  STATE.gameActive = false; // block input during feedback

  if (correct) {
    // ✅ Correct — show tick, then move to next question
    STATE.correct++;
    showFeedback(true);
    setTimeout(() => {
      STATE.currentQ++;
      if (STATE.currentQ >= STATE.questions.length) finishGame();
      else { STATE.gameActive = true; renderQuestion(); }
    }, 600);
  } else {
    // ❌ Wrong — add penalty, show ✗, clear input, wait for correct answer
    STATE.wrong++;
    STATE.wrongQuestions.add(STATE.currentQ); // mark this question
    STATE.penaltyMs += STATE.PENALTY_MS;
    showFeedback(false);
    showPenaltyFlash('penalty-flash');
    setTimeout(() => {
      // Reset answer display
      STATE.userAnswer = '';
      const ad = document.getElementById('answer-display');
      if (ad) { ad.textContent = '?'; ad.className = 'answer-display'; }
      // Clear the ✗ feedback overlay
      const fb = document.getElementById('feedback-overlay');
      if (fb) { fb.className = 'feedback-overlay'; fb.textContent = ''; }
      // Re-enable input so user can try again on the SAME question
      STATE.gameActive = true;
    }, 800);
  }
}

/** Brief red toast showing +5s penalty */
function showPenaltyFlash(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('hidden');
  el.style.animation = 'none';          // reset
  void el.offsetWidth;                  // reflow
  el.style.animation = '';             // restart
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.add('hidden'), 1400);
}

function showFeedback(correct, elId = 'feedback-overlay') {
  const fb = document.getElementById(elId);
  if (!fb) return;
  fb.className   = `feedback-overlay ${correct ? 'correct' : 'wrong'} show`;
  fb.textContent = correct ? '✓' : '✗';
}

/* ════════════════════════════════════════════════
   MENTAL MATH
   ════════════════════════════════════════════════ */
function renderMentalQuestion() {
  const q = STATE.questions[STATE.currentQ];
  if (!q) return;
  const total = STATE.questions.length;
  const idx   = STATE.currentQ + 1;

  document.getElementById('mental-progress-label').textContent = `${idx} / ${total}`;
  document.getElementById('mental-progress-bar').style.width   = `${(idx / total) * 100}%`;

  const ad = document.getElementById('mental-answer-display');
  ad.textContent = '?'; ad.className = 'answer-display';

  const fb = document.getElementById('mental-feedback');
  if (fb) { fb.className = 'feedback-overlay'; fb.textContent = ''; }

  STATE.userAnswer = '';
  speakQuestion(q.question);
}

function speakQuestion(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.85; utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}
function replayAudio() {
  const q = STATE.questions[STATE.currentQ];
  if (q) speakQuestion(q.question);
}

function mentalNumPress(val) {
  if (!STATE.gameActive) return;
  if (val === 'DEL') STATE.userAnswer = STATE.userAnswer.slice(0, -1);
  else if (val === 'C') STATE.userAnswer = '';
  else { if (STATE.userAnswer.length >= 6) return; STATE.userAnswer += val; }

  const el = document.getElementById('mental-answer-display');
  if (el) {
    el.textContent = STATE.userAnswer || '?';
    el.className   = 'answer-display' + (STATE.userAnswer ? ' has-value' : '');
  }
  if (STATE.userAnswer) mentalAutoCheck();
}

function mentalAutoCheck() {
  const q = STATE.questions[STATE.currentQ];
  if (!q) return;
  const typed = STATE.userAnswer, expected = String(q.answer);
  // Exact match → submit correct
  if (typed === expected) { mentalSubmit(); return; }
  // Typed same number of digits but wrong, or more digits → submit
  if (typed.length >= expected.length) mentalSubmit();
}

function mentalSubmit() {
  if (!STATE.gameActive) return;
  const q = STATE.questions[STATE.currentQ];
  if (!q) return;
  const correct = parseInt(STATE.userAnswer, 10) === q.answer;

  if (correct) {
    // ✅ Correct — advance
    STATE.correct++;
    showFeedback(correct, 'mental-feedback');
    STATE.gameActive = false;
    setTimeout(() => {
      STATE.currentQ++;
      if (STATE.currentQ >= STATE.questions.length) finishGame();
      else { STATE.gameActive = true; renderMentalQuestion(); }
    }, 700);
  } else {
    // ❌ Wrong — penalty, stay on question
    STATE.wrong++;
    STATE.wrongQuestions.add(STATE.currentQ); // mark this question
    STATE.penaltyMs += STATE.PENALTY_MS;
    showFeedback(correct, 'mental-feedback');
    showPenaltyFlash('mental-penalty-flash');
    setTimeout(() => {
      STATE.userAnswer = '';
      const ad = document.getElementById('mental-answer-display');
      if (ad) { ad.textContent = '?'; ad.className = 'answer-display'; }
      const fb = document.getElementById('mental-feedback');
      if (fb) { fb.className = 'feedback-overlay'; fb.textContent = ''; }
    }, 800);
  }
}

/* ════════════════════════════════════════════════
   BRAIN CRUNCHER CHAIN
   ════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════
   BRAIN CRUNCHER — VIDEO-ACCURATE FLOW
   1. startChain():   shows steps one-at-a-time with spinning ring countdown
   2. showBrainAnswer(): transitions to answer screen with progress bar
   3. brainSubmit():  correct → next round | wrong → Incorrect! screen
   ════════════════════════════════════════════════ */
const BC_STEP_MS  = 3000; // ms each step is shown
const BC_CIRC     = 2 * Math.PI * 95; // circumference for r=95 ring

function startChain() {
  const q = STATE.questions[STATE.currentQ];
  if (!q) return;

  // Build the full sequence: [{label, bold}, ...]
  const opLabel = { '+': 'Add', '-': 'Subtract', '×': 'Multiply by', '÷': 'Divide by' };
  const seq = [
    { label: 'Start with', bold: String(q.start) },
    ...q.steps.map(s => ({ label: opLabel[s.op] || s.op, bold: String(s.num) }))
  ];

  // Show screen-chain for step-reveal
  showScreen('screen-chain');

  let stepIdx = 0;
  const ringArc = document.getElementById('bc-ring-arc');
  const stepTxt = document.getElementById('bc-step-text');
  const stepNum = document.getElementById('bc-step-num');

  function showStep(idx) {
    if (idx >= seq.length) {
      // All steps shown — go to answer screen
      if (STATE.brainTimerInterval) { clearInterval(STATE.brainTimerInterval); STATE.brainTimerInterval = null; }
      showBrainAnswer();
      return;
    }
    const { label, bold } = seq[idx];
    // Update text
    stepTxt.innerHTML = `${label}<br><strong>${bold}</strong>`;
    // Reset ring to full
    if (ringArc) {
      ringArc.style.transition = 'none';
      ringArc.style.strokeDashoffset = '0';
      void ringArc.getBoundingClientRect(); // force reflow
      ringArc.style.transition = `stroke-dashoffset ${BC_STEP_MS}ms linear`;
      ringArc.style.strokeDashoffset = String(BC_CIRC);
    }
    // Advance after BC_STEP_MS
    if (STATE.brainTimerInterval) clearInterval(STATE.brainTimerInterval);
    STATE.brainTimerInterval = setTimeout(() => showStep(idx + 1), BC_STEP_MS);
  }

  // Tiny delay so screen transition finishes first
  setTimeout(() => showStep(0), 200);
}

function showBrainAnswer() {
  showScreen('screen-game-brain');
  STATE.gameActive = true;
  STATE.userAnswer = '';

  // Reset answer display
  const ad = document.getElementById('brain-answer-display');
  if (ad) { ad.textContent = '?'; ad.className = 'bc-answer-display'; }

  // Label
  const lbl = document.getElementById('bc-answer-label');
  if (lbl) lbl.textContent = 'What is the answer?';

  // Progress bar
  const pb = document.getElementById('bc-progress-bar');
  if (pb) { pb.style.transition = 'none'; pb.style.width = '0%'; }

  // Clear feedback
  const fb = document.getElementById('brain-feedback');
  if (fb) { fb.className = 'feedback-overlay'; fb.textContent = ''; }

  // Start ms timer if first question
  if (!STATE.startTime) startMsTimer('brain-timer-display');
}

function brainNumPress(val) {
  if (!STATE.gameActive) return;
  if (val === 'DEL' || val === 'C') STATE.userAnswer = '';
  else { if (STATE.userAnswer.length >= 8) return; STATE.userAnswer += val; }

  const el = document.getElementById('brain-answer-display');
  if (el) {
    el.textContent = STATE.userAnswer || '?';
    el.className = 'bc-answer-display' + (STATE.userAnswer ? ' has-value' : '');
  }

  // Auto-check when answer length matches expected
  const q = STATE.questions[STATE.currentQ];
  if (q && STATE.userAnswer.length >= String(q.answer).length) {
    const userNum = parseInt(STATE.userAnswer, 10);
    if (!isNaN(userNum)) brainSubmit();
  }
}

function brainSubmit() {
  if (!STATE.gameActive) return;
  STATE.gameActive = false;

  const q = STATE.questions[STATE.currentQ];
  if (!q) return;
  const userNum = parseInt(STATE.userAnswer, 10);
  const correct = userNum === q.answer;

  if (correct) {
    STATE.correct++;
  } else {
    STATE.wrong++;
    STATE.wrongQuestions.add(STATE.currentQ);
    STATE.penaltyMs += STATE.PENALTY_MS;
  }

  // Show tick/cross feedback, then ALWAYS go to the review screen
  showFeedback(correct, 'brain-feedback');
  setTimeout(() => showBrainReview(correct), 900);
}

/* Build & show the step-by-step review for the current question.
   Called after every answer — correct or wrong. */
function showBrainReview(wasCorrect) {
  const q = STATE.questions[STATE.currentQ];
  if (!q) { goHome(); return; }

  const opLabel = { '+': 'Add', '-': 'Subtract', '×': 'Multiply by', '÷': 'Divide by' };
  const list    = document.getElementById('bc-review-list');
  if (!list) { goHome(); return; }

  // ── Build step rows ──
  const rows = [
    { text: 'Starting Number', value: q.start, isFinal: false, isStart: true },
    ...q.steps.map(s => ({
      text: `${opLabel[s.op] || s.op} ${s.num}`,
      value: s.running_total,
      isFinal: false,
      isStart: false,
    })),
    { text: 'Final Answer', value: q.answer, isFinal: true, isStart: false },
  ];

  list.innerHTML = rows.map(r => `
    <div class="bc-review-row ${r.isFinal ? 'bc-review-final' : ''} ${r.isStart ? 'bc-review-start' : ''}">
      <span class="bc-review-step-text">${r.text}</span>
      <span class="bc-review-equals"> = </span>
      <span class="bc-review-total">${r.value}</span>
    </div>
  `).join('');

  // ── Result badge (✓ Correct / ✗ Wrong) ──
  const badge = document.getElementById('bc-review-result');
  if (badge) {
    badge.textContent = wasCorrect ? '✓ Correct!' : '✗ Wrong!';
    badge.className   = `bc-review-result ${wasCorrect ? 'correct' : 'wrong'}`;
  }

  // ── Progress counter ──
  const prog = document.getElementById('bc-review-progress');
  const total = STATE.questions.length;
  const idx   = STATE.currentQ + 1;
  if (prog) prog.textContent = `${idx} / ${total}`;

  // ── Next button label: NEXT QUESTION vs FINISH ──
  const nextBtn = document.getElementById('bc-review-next-btn');
  const isLast  = STATE.currentQ >= STATE.questions.length - 1;
  if (nextBtn) nextBtn.textContent = isLast ? 'FINISH' : 'NEXT QUESTION';

  showScreen('screen-bc-review');
}

/* Called when user taps NEXT QUESTION or FINISH on the review screen */
function continueFromBrainReview() {
  STATE.currentQ++;
  if (STATE.currentQ >= STATE.questions.length) {
    finishGame();
  } else {
    startChain();
  }
}

/* Legacy hook: REVIEW button on old Incorrect screen → same review screen */
function reviewBrainCruncher() {
  showBrainReview(false);
}

/* ════════════════════════════════════════════════
   FINISH GAME — results screen
   ════════════════════════════════════════════════ */
function finishGame() {
  stopMsTimer();

  const rawMs   = STATE.elapsed;
  const finalMs = rawMs + STATE.penaltyMs;
  const total   = STATE.questions.length;

  // Score = questions answered correctly on FIRST attempt
  const firstCorrect = total - STATE.wrongQuestions.size;
  const pct   = Math.round((firstCorrect / total) * 100);
  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '😊' : '💪';
  const title = pct === 100 ? 'Perfect!' : pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Job!' : 'Keep Going!';

  const penSec = (STATE.penaltyMs / 1000).toFixed(3);

  document.getElementById('result-emoji').textContent         = emoji;
  document.getElementById('result-title').textContent         = title;
  document.getElementById('result-wrong-count').textContent   = STATE.wrong;
  document.getElementById('result-penalty').textContent       = `+ ${penSec}s`;
  document.getElementById('result-final-time').textContent    = formatMs(finalMs);
  document.getElementById('result-correct-stat').textContent  = firstCorrect;  // first-attempt correct
  document.getElementById('result-wrong-stat').textContent    = STATE.wrong;   // total wrong attempts
  document.getElementById('result-raw-time').textContent      = formatMs(rawMs);
  document.getElementById('result-pct').textContent           = `${pct}%`;

  if (STATE.currentGame === 'brain_age') {
    const age = Math.max(20, 50 - Math.round(pct / 5));
    document.getElementById('result-title').textContent = 'Brain Age Result';
    document.getElementById('brain-age-value').textContent = age;
    document.getElementById('brain-age-row').classList.remove('hidden');
  } else {
    document.getElementById('brain-age-row').classList.add('hidden');
  }

  document.getElementById('penalty-block').style.opacity = STATE.wrong > 0 ? '1' : '0.35';

  saveScore(finalMs);
  showScreen('screen-result');
}

async function saveScore(finalMs) {
  await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      game: STATE.currentGame, difficulty: STATE.difficulty,
      correct: STATE.correct,  total: STATE.questions.length,
      wrong: STATE.wrong,      penalty_ms: STATE.penaltyMs,
      final_ms: finalMs,
    }),
  });
}

function replayGame() {
  const g = STATE.currentGame, d = STATE.difficulty;
  clearGameState();
  startGame(g, d);
}

function clearGameState() {
  stopMsTimer();
  if (STATE.brainTimerInterval) { clearInterval(STATE.brainTimerInterval); STATE.brainTimerInterval = null; }
  STATE.questions      = []; STATE.currentQ = 0; STATE.userAnswer = '';
  STATE.correct        = 0;  STATE.wrong = 0;
  STATE.penaltyMs      = 0;  STATE.elapsed = 0;
  STATE.wrongQuestions = new Set();
  STATE.gameActive     = false; STATE.startTime = null;
}

/* ── Keyboard support ──────────────────────────── */
document.addEventListener('keydown', e => {
  const active = document.querySelector('.screen.active');
  if (!active) return;
  const id = active.id;
  if (id === 'screen-game') {
    if (e.key >= '0' && e.key <= '9') numPress(e.key);
    else if (e.key === 'Backspace')   numPress('DEL');
    else if (e.key === 'Escape')      numPress('C');
  } else if (id === 'screen-game-mental') {
    if (e.key >= '0' && e.key <= '9') mentalNumPress(e.key);
    else if (e.key === 'Backspace')   mentalNumPress('DEL');
    else if (e.key === 'Escape')      mentalNumPress('C');
  } else if (id === 'screen-game-brain') {
    if (e.key >= '0' && e.key <= '9') brainNumPress(e.key);
    else if (e.key === 'Backspace')   brainNumPress('DEL');
    else if (e.key === 'Enter')       brainSubmit();
    else if (e.key === 'Escape')      brainNumPress('C');
  }
});

/* ── On load ───────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  goHome();
  document.querySelectorAll('.table-btn[data-table="2"]').forEach(b =>
    b.classList.add('active'));
});
