import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { BANK } from './questions.js';

// Firebase web configuration (public identifiers, NOT a service-account key).
const firebaseConfig = {
  apiKey: 'AIzaSyBTafT3ckgbGvffwzbRrA6xlzsKPfYcqAM',
  authDomain: 'trig-moon-race.firebaseapp.com',
  projectId: 'trig-moon-race',
  storageBucket: 'trig-moon-race.firebasestorage.app',
  messagingSenderId: '743119701875',
  appId: '1:743119701875:web:b357c18db6e1d93a7e6706'
};
let db = null;
try { db = getFirestore(initializeApp(firebaseConfig)); }
catch (error) { console.error('Firebase initialization failed:', error); }

const $ = id => document.getElementById(id);
const LEVELS = { cadet: '🌱 Cadet', pilot: '🚀 Pilot', commander: '🔥 Commander' };
let selectedLevel = 'cadet';
let level = 'cadet';
let order = [], i = 0, lives = 5, streak = 0, xp = 0, correct = 0;
let locked = false, player = '', startTime = 0, timerHandle = null, finalMs = 0, finishing = false;

function shuffle(array) {
  const result = [...array];
  for (let j = result.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [result[j], result[k]] = [result[k], result[j]];
  }
  return result;
}
function fmt(ms) {
  const s = Math.max(0, ms) / 1000;
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
}
function tick() { $('timer').textContent = fmt(performance.now() - startTime); }
function stats() { $('lives').textContent = lives; $('streak').textContent = streak; $('xp').textContent = xp; }
function move() {
  const p = (i + 1) / 30;
  $('progressText').textContent = Math.round(p * 100) + '%';
  const rocket = $('rocket');
  rocket.style.left = `calc(72px + ${p * 72}%)`;
  rocket.style.bottom = `calc(64px + ${p * 112}px)`;
  rocket.classList.remove('boost');
  void rocket.offsetWidth;
  rocket.classList.add('boost');
}
function zone() {
  const stage = i < 10 ? 'Launch' : i < 20 ? 'Orbit' : 'Lunar Approach';
  return `${LEVELS[level]} • ${stage} • ${i < 10 ? 'Warm-up' : i < 20 ? 'Challenge' : 'Boss Level'}`;
}
function render() {
  locked = false;
  const q = order[i];
  $('qnum').textContent = i + 1;
  $('zone').textContent = zone();
  $('prompt').textContent = q[0];
  $('feedback').textContent = '';
  $('nextBtn').classList.add('hidden');
  const choices = $('choices');
  choices.replaceChildren();
  for (const value of shuffle([q[1], ...q[2]])) {
    const button = document.createElement('button');
    button.textContent = value;
    button.addEventListener('click', () => answer(button, value));
    choices.appendChild(button);
  }
}
function answer(button, value) {
  if (locked) return;
  locked = true;
  const q = order[i];
  const ok = value === q[1];
  for (const b of $('choices').children) {
    b.disabled = true;
    if (b.textContent === q[1]) b.classList.add('correct');
  }
  if (ok) {
    correct++;
    streak++;
    const gain = 100 + Math.min(streak - 1, 5) * 20;
    xp += gain;
    $('feedback').textContent = `🚀 BOOST! +${gain} XP — ${q[3]}`;
  } else {
    lives = Math.max(0, lives - 1);
    streak = 0;
    button.classList.add('wrong');
    $('feedback').textContent = `💥 Missed — ${q[3]}. Correct: ${q[1]}`;
  }
  move();
  stats();
  $('nextBtn').classList.remove('hidden');
  $('nextBtn').textContent = i === 29 ? 'Finish Mission 🌕' : 'Next Challenge →';
}
function next() { if (!locked || finishing) return; if (i === 29) finish(); else { i++; render(); } }
async function finish() {
  if (finishing) return;
  finishing = true;
  clearInterval(timerHandle);
  finalMs = Math.max(1000, Math.round(performance.now() - startTime));
  $('gameScreen').classList.add('hidden');
  $('finishScreen').classList.remove('hidden');
  $('finishTitle').textContent = correct === 30 ? '🌕 Perfect Moon Landing!' : 'Mission Complete!';
  $('finishSummary').textContent = `${player} • ${LEVELS[level]} • ${correct}/30 correct • ${fmt(finalMs)} • ${xp} XP`;
  $('leaderLevel').value = level;
  await save();
  await leaders();
}
async function save() {
  if (!db) { $('dbStatus').textContent = 'Firebase unavailable: score not saved.'; return; }
  try {
    await addDoc(collection(db, 'scores'), {
      name: player, difficulty: level, correct, timeMs: finalMs,
      xp, completedAt: serverTimestamp()
    });
    $('dbStatus').textContent = 'Your score was saved to the class leaderboard.';
  } catch (error) {
    console.error('Score save failed:', error);
    $('dbStatus').textContent = 'Could not save score. Publish the included Firestore rules and try again.';
  }
}
async function leaders() {
  const body = $('leaderboard');
  if (!db) { body.innerHTML = '<tr><td colspan="5">Firebase unavailable.</td></tr>'; return; }
  body.innerHTML = '<tr><td colspan="5">Loading…</td></tr>';
  const view = $('leaderLevel').value;
  try {
    // A small class leaderboard: read all scores, then filter and sort client-side.
    // Older scores have no difficulty field and appear under Classic.
    const snap = await getDocs(collection(db, 'scores'));
    const rows = snap.docs.map(doc => doc.data())
      .filter(s => (s.difficulty || 'legacy') === view)
      .filter(s => Number.isInteger(s.correct) && Number.isFinite(s.timeMs))
      .sort((a, b) => b.correct - a.correct || a.timeMs - b.timeMs || (b.xp || 0) - (a.xp || 0))
      .slice(0, 20);
    body.replaceChildren();
    rows.forEach((s, n) => {
      const tr = document.createElement('tr');
      [n + 1, s.name || 'Anonymous', `${s.correct}/30`, fmt(s.timeMs), s.xp || 0]
        .forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.appendChild(td); });
      body.appendChild(tr);
    });
    if (!rows.length) body.innerHTML = '<tr><td colspan="5">No scores for this level yet. Be the first!</td></tr>';
  } catch (error) {
    console.error('Leaderboard load failed:', error);
    body.innerHTML = '<tr><td colspan="5">Leaderboard unavailable. Check Firestore access.</td></tr>';
  }
}
function chooseLevel(nextLevel) {
  selectedLevel = nextLevel;
  document.querySelectorAll('[data-level]').forEach(button => {
    const active = button.dataset.level === selectedLevel;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('leaderLevel').value = nextLevel;
  leaders();
}
function start() {
  player = $('playerName').value.replace(/[<>]/g, '').trim().slice(0, 30);
  if (!player) { $('playerName').focus(); return; }
  level = selectedLevel;
  // Shuffle questions only within each 10-question stage: difficulty increases during the mission.
  const bank = BANK[level];
  order = [...shuffle(bank.slice(0, 10)), ...shuffle(bank.slice(10, 20)), ...shuffle(bank.slice(20, 30))];
  i = 0; lives = 5; streak = 0; xp = 0; correct = 0; finishing = false;
  $('nameDisplay').textContent = player;
  $('levelDisplay').textContent = LEVELS[level];
  $('startScreen').classList.add('hidden');
  $('finishScreen').classList.add('hidden');
  $('gameScreen').classList.remove('hidden');
  $('rocket').style.left = '72px'; $('rocket').style.bottom = '64px';
  $('progressText').textContent = '0%'; $('timer').textContent = '00:00.0';
  stats(); render();
  startTime = performance.now();
  clearInterval(timerHandle);
  timerHandle = setInterval(tick, 100);
}
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click', () => chooseLevel(button.dataset.level)));
$('startBtn').addEventListener('click', start);
$('playerName').addEventListener('keydown', event => { if (event.key === 'Enter') start(); });
$('nextBtn').addEventListener('click', next);
$('againBtn').addEventListener('click', () => {
  $('finishScreen').classList.add('hidden');
  $('startScreen').classList.remove('hidden');
});
$('refreshBtn').addEventListener('click', leaders);
$('leaderLevel').addEventListener('change', leaders);
chooseLevel('cadet');
