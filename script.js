/* ── State ── */
let participants = [];
let history = [];
let winnersCount = 3;
let isSpinning = false;

/* ── DOM refs ── */
const inputName       = document.getElementById('input-name');
const btnAdd          = document.getElementById('btn-add');
const btnImport       = document.getElementById('btn-import');
const btnClearAll     = document.getElementById('btn-clear-all');
const inputBulk       = document.getElementById('input-bulk');
const participantList = document.getElementById('participant-list');
const participantCount = document.getElementById('participant-count');

const btnQuickDraw    = document.getElementById('btn-quick-draw');
const quickWinner     = document.getElementById('quick-winner');
const quickWinnerName = document.getElementById('quick-winner-name');

const btnSpin         = document.getElementById('btn-spin');
const rouletteTrack   = document.getElementById('roulette-track');
const rouletteResult  = document.getElementById('roulette-result');

const btnMultiDraw    = document.getElementById('btn-multi-draw');
const multiResults    = document.getElementById('multi-results');
const winnersCountEl  = document.getElementById('winners-count');
const btnWinnersPlus  = document.getElementById('btn-winners-plus');
const btnWinnersMinus = document.getElementById('btn-winners-minus');

const historyList     = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');

/* ── Participants ── */
function addParticipant(name) {
  name = name.trim();
  if (!name) return;
  participants.push(name);
  renderParticipants();
  save();
}

function removeParticipant(idx) {
  participants.splice(idx, 1);
  renderParticipants();
  save();
}

function renderParticipants() {
  participantCount.textContent = `${participants.length} participant${participants.length !== 1 ? 's' : ''}`;
  if (participants.length === 0) {
    participantList.innerHTML = '<li class="list-empty">No participants yet</li>';
    return;
  }
  participantList.innerHTML = participants.map((name, i) => `
    <li class="participant-item" data-idx="${i}">
      <span class="idx">${i + 1}</span>
      <span class="name">${escHtml(name)}</span>
      <button class="btn-remove" data-idx="${i}">✕</button>
    </li>
  `).join('');

  participantList.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeParticipant(+btn.dataset.idx);
    });
  });
}

btnAdd.addEventListener('click', () => {
  addParticipant(inputName.value);
  inputName.value = '';
  inputName.focus();
});

inputName.addEventListener('keydown', e => {
  if (e.key === 'Enter') btnAdd.click();
});

btnImport.addEventListener('click', () => {
  const lines = inputBulk.value.split('\n').map(l => l.trim()).filter(Boolean);
  lines.forEach(addParticipant);
  inputBulk.value = '';
});

btnClearAll.addEventListener('click', () => {
  if (!participants.length) return;
  if (confirm('Clear all participants?')) {
    participants = [];
    renderParticipants();
    save();
  }
});

/* ── Mode tabs ── */
document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`mode-${tab.dataset.mode}`).classList.add('active');
  });
});

/* ── Quick Draw ── */
btnQuickDraw.addEventListener('click', () => {
  if (participants.length === 0) return alert('Add participants first!');

  // Shuffle animation
  let ticks = 0;
  const total = 20 + Math.floor(Math.random() * 15);
  let interval = 50;

  const tick = () => {
    const name = participants[Math.floor(Math.random() * participants.length)];
    quickWinnerName.textContent = name;
    quickWinner.classList.remove('win');
    ticks++;
    if (ticks < total) {
      interval = Math.min(interval + 10, 200);
      setTimeout(tick, interval);
    } else {
      const winner = participants[Math.floor(Math.random() * participants.length)];
      quickWinnerName.textContent = winner;
      quickWinner.classList.add('win');
      highlightParticipant(winner);
      addHistory('Quick Draw', [winner]);
    }
  };
  tick();
});

/* ── Roulette ── */
btnSpin.addEventListener('click', () => {
  if (isSpinning) return;
  if (participants.length === 0) return alert('Add participants first!');

  isSpinning = true;
  rouletteResult.textContent = '';
  btnSpin.disabled = true;

  // Build repeated items list (at least 40 items)
  const repeated = [];
  while (repeated.length < 60) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    repeated.push(...shuffled);
  }

  // Render items
  rouletteTrack.innerHTML = repeated.map((name, i) =>
    `<div class="roulette-item" data-idx="${i}">${escHtml(name)}</div>`
  ).join('');

  // Reset position
  rouletteTrack.style.transition = 'none';
  rouletteTrack.style.transform = 'translateX(0)';

  // Pick winner index near end
  const winnerIdx = 45 + Math.floor(Math.random() * 10);
  const items = rouletteTrack.querySelectorAll('.roulette-item');
  const itemW = items[0].offsetWidth + 8;
  const trackWrap = rouletteTrack.parentElement;
  const center = trackWrap.offsetWidth / 2;
  const targetX = -(winnerIdx * itemW - center + itemW / 2);

  // Force reflow then animate
  void rouletteTrack.offsetWidth;
  rouletteTrack.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)';
  rouletteTrack.style.transform = `translateX(${targetX}px)`;

  setTimeout(() => {
    items.forEach(el => el.classList.remove('selected'));
    items[winnerIdx].classList.add('selected');
    const winner = repeated[winnerIdx];
    rouletteResult.textContent = `🏆 ${winner}`;
    highlightParticipant(winner);
    addHistory('Roulette', [winner]);
    isSpinning = false;
    btnSpin.disabled = false;
  }, 4100);
});

/* ── Multi Pick ── */
btnWinnersPlus.addEventListener('click', () => {
  winnersCount = Math.min(winnersCount + 1, participants.length || 1);
  winnersCountEl.textContent = winnersCount;
});
btnWinnersMinus.addEventListener('click', () => {
  winnersCount = Math.max(winnersCount - 1, 1);
  winnersCountEl.textContent = winnersCount;
});

btnMultiDraw.addEventListener('click', () => {
  if (participants.length === 0) return alert('Add participants first!');
  const count = Math.min(winnersCount, participants.length);
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, count);

  multiResults.innerHTML = winners.map((name, i) => `
    <div class="multi-winner-item">
      <div class="rank">${i + 1}</div>
      <div class="winner-name">${escHtml(name)}</div>
    </div>
  `).join('');

  winners.forEach(w => highlightParticipant(w));
  addHistory('Multi Pick', winners);
});

/* ── History ── */
function addHistory(mode, names) {
  const entry = { mode, names, time: new Date().toLocaleTimeString() };
  history.unshift(entry);
  if (history.length > 50) history.pop();
  renderHistory();
  save();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<li class="list-empty">No draws yet</li>';
    return;
  }
  historyList.innerHTML = history.map(h => `
    <li class="history-item">
      <div class="h-mode">${h.mode}</div>
      <div class="h-names">${h.names.map(escHtml).join(', ')}</div>
      <div class="h-time">${h.time}</div>
    </li>
  `).join('');
}

btnClearHistory.addEventListener('click', () => {
  history = [];
  renderHistory();
  save();
});

/* ── Highlight participant in list ── */
function highlightParticipant(name) {
  document.querySelectorAll('.participant-item').forEach(el => {
    el.classList.remove('highlight');
    const elName = el.querySelector('.name')?.textContent;
    if (elName === name) {
      el.classList.add('highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

/* ── Persist ── */
function save() {
  localStorage.setItem('raffle_participants', JSON.stringify(participants));
  localStorage.setItem('raffle_history', JSON.stringify(history));
  localStorage.setItem('raffle_winners_count', winnersCount);
}

function load() {
  try {
    const p = localStorage.getItem('raffle_participants');
    const h = localStorage.getItem('raffle_history');
    const w = localStorage.getItem('raffle_winners_count');
    if (p) participants = JSON.parse(p);
    if (h) history = JSON.parse(h);
    if (w) winnersCount = +w;
  } catch {}
}

/* ── Utils ── */
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Init ── */
load();
renderParticipants();
renderHistory();
winnersCountEl.textContent = winnersCount;
