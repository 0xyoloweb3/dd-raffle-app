const canvas = document.getElementById('battle-canvas');
const ctx = canvas.getContext('2d');
const btnStart = document.getElementById('btn-battle-start');
const btnShuffle = document.getElementById('btn-battle-shuffle');
const btnReset = document.getElementById('btn-battle-reset');
const btnModeNormal = document.getElementById('btn-battle-mode-normal');
const btnModeMass = document.getElementById('btn-battle-mode-mass');
const btnHitSound = document.getElementById('btn-battle-hit-sound');
const btnHitSoundStage = document.getElementById('btn-battle-hit-sound-stage');
const statusEl = document.getElementById('battle-status');
const feedEl = document.getElementById('battle-feed');
const participantsEl = document.getElementById('battle-participants');
const winnerModalEl = document.getElementById('battle-winner-modal');
const aliveCounterEl = document.getElementById('battle-alive-count');
const winnerKickerEl = document.querySelector('.battle-winner-kicker');
const winnerNameEl = document.getElementById('battle-winner-name');
const winnerSubtitleEl = document.querySelector('.battle-winner-subtitle');
const EMBEDDED_MODE = new URLSearchParams(window.location.search).get('embedded') === '1';

const TEST_NAMES = ['Ava', 'Noah', 'Liam', 'Mila', 'Ethan', 'Sofia', 'Lucas', 'Zoe', 'Kai', 'Nova', 'Ezra', 'Ruby'];
const MAX_FIGHTERS = 150;
const ARENA_PADDING = 72;
const SPRITE_SIZE = 64;
const BASE_DAMAGE_MIN = 9;
const BASE_DAMAGE_MAX = 15;
const BASE_ATTACK_COOLDOWN_MIN = 0.74;
const BASE_ATTACK_COOLDOWN_MAX = 1.62;
const WINNER_MODAL_DELAY = 3;
const CORPSE_FADE_DELAY = 1;
const BATTLE_PARTICIPANTS_STORAGE_KEY = 'rollbria-battle-participants';
const BATTLE_HIT_SOUND_STORAGE_KEY = 'rollbria-battle-hit-sound-enabled';

function seqPaths(base, count) {
  return Array.from({ length: count }, (_, index) => `${base}/${String(index + 1).padStart(2, '0')}.png`);
}

function seqSheet(path, count, columns, rows) {
  return Array.from({ length: count }, (_, index) => ({
    path,
    index,
    columns,
    rows,
  }));
}

function sheetFrames(path, indexes, columns, rows) {
  return indexes.map((index) => ({
    path,
    index,
    columns,
    rows,
  }));
}

const ANIMATION_ASSETS = {
  front: {
    idle: sheetFrames('generated-run-test/1-removebg-preview.png', [0, 7], 2, 4),
    run: seqSheet('generated-run-test/1-removebg-preview.png', 8, 2, 4),
    attack: seqPaths('battle-assets/front/attack', 7),
    hit: seqPaths('battle-assets/front/hit', 4),
    death: seqPaths('generated-death-cut/front', 8),
    victory: seqSheet('generated-run-test/Gemini_Generated_Image_4534zf4534zf4534-removebg-preview.png', 6, 3, 2),
    flip: false,
  },
  back: {
    idle: sheetFrames('generated-run-test/2-removebg-preview.png', [0, 7], 2, 4),
    run: seqSheet('generated-run-test/2-removebg-preview.png', 8, 2, 4),
    attack: seqPaths('battle-assets/back/attack', 9),
    hit: seqPaths('battle-assets/back/hit', 4),
    death: seqPaths('generated-death-cut/back', 9),
    flip: false,
  },
  left: {
    idle: sheetFrames('generated-run-test/3-removebg-preview.png', [0, 7], 2, 4),
    run: seqSheet('generated-run-test/3-removebg-preview.png', 8, 2, 4),
    attack: seqPaths('battle-assets/side/attack', 5),
    hit: seqPaths('battle-assets/side/hit', 4),
    death: seqPaths('generated-death-cut/side', 7),
    flip: true,
  },
  right: {
    idle: sheetFrames('generated-run-test/3-removebg-preview.png', [0, 7], 2, 4),
    run: seqSheet('generated-run-test/3-removebg-preview.png', 8, 2, 4),
    attack: seqPaths('battle-assets/side/attack', 5),
    hit: seqPaths('battle-assets/side/hit', 4),
    death: seqPaths('generated-death-cut/side', 7),
    flip: false,
  },
};
const loadedSprites = {};
let fighters = [];
let running = false;
let lastTime = 0;
let eliminationLog = [];
let victoryState = null;
let combatTexts = [];
let battleStartAudio = null;
let winnerThemeAudio = null;
let lastParticipantsSignature = null;
let lastExternalParticipantsSignature = null;
let battleHitAudio = null;
let battleCritAudio = null;
let battleMode = 'normal';
let hitSoundEnabled = true;

function getCryptoRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }

  const limit = 0x100000000;
  const threshold = limit - (limit % maxExclusive);
  const buffer = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < threshold) {
      return buffer[0] % maxExclusive;
    }
  }
}

function getCryptoRandomFloat() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0x100000000;
}

function randomChance(probability) {
  return getCryptoRandomFloat() < probability;
}

function updateBattleModeButtons() {
  if (btnModeNormal) {
    btnModeNormal.classList.toggle('is-active', battleMode === 'normal');
  }
  if (btnModeMass) {
    btnModeMass.classList.toggle('is-active', battleMode === 'mass');
  }
}

function persistHitSoundSetting() {
  try {
    localStorage.setItem(BATTLE_HIT_SOUND_STORAGE_KEY, JSON.stringify(hitSoundEnabled));
  } catch (_) {
    // Ignore storage issues for local sound preference.
  }
}

function updateHitSoundButtons() {
  const label = `Hit Sound: ${hitSoundEnabled ? 'On' : 'Off'}`;
  if (btnHitSound) {
    btnHitSound.textContent = label;
    btnHitSound.classList.toggle('is-active', hitSoundEnabled);
  }
  if (btnHitSoundStage) {
    btnHitSoundStage.textContent = label;
    btnHitSoundStage.classList.toggle('is-active', hitSoundEnabled);
  }
}

function setHitSoundEnabled(nextValue) {
  hitSoundEnabled = Boolean(nextValue);
  updateHitSoundButtons();
  persistHitSoundSetting();
}

function loadHitSoundSetting() {
  try {
    const raw = localStorage.getItem(BATTLE_HIT_SOUND_STORAGE_KEY);
    if (raw == null) return;
    hitSoundEnabled = JSON.parse(raw) !== false;
  } catch (_) {
    hitSoundEnabled = true;
  }
}

function updateBattleReadyStatus() {
  const totalNames = (participantsEl?.value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean).length;

  if (totalNames < 2) {
    statusEl.textContent = 'Add at least 2 participants to start the battle.';
    return;
  }

  if (totalNames > MAX_FIGHTERS) {
    statusEl.textContent = `Arena updated. ${fighters.length} fighters are ready in ${battleMode} mode. ${totalNames - MAX_FIGHTERS} names are outside the global cap of ${MAX_FIGHTERS}.`;
    return;
  }

  statusEl.textContent = `Arena updated. ${fighters.length} fighters are ready in ${battleMode} mode.`;
}

function updateAliveCounter() {
  if (!aliveCounterEl) return;
  aliveCounterEl.textContent = String(getAliveFighters().length);
}

function setBattleMode(nextMode) {
  const resolvedMode = nextMode === 'mass' ? 'mass' : 'normal';
  if (battleMode === resolvedMode) return;
  battleMode = resolvedMode;
  updateBattleModeButtons();
  running = false;
  spawnFighters();
  updateBattleReadyStatus();
}

function notifyParent(message) {
  if (!EMBEDDED_MODE || window.parent === window) return;
  window.parent.postMessage({ source: 'battle-prototype', ...message }, '*');
}

function buildParticipantsSignature(names) {
  if (!Array.isArray(names)) return '';
  return names.map((name) => String(name).trim()).join('\n');
}

function applyParticipantsFromParent(names) {
  if (!participantsEl) return;
  const nextValue = Array.isArray(names) ? names.join('\n') : '';
  const nextSignature = buildParticipantsSignature(Array.isArray(names) ? names : []);
  if (
    lastExternalParticipantsSignature === nextSignature
    && lastParticipantsSignature === nextSignature
    && participantsEl.value === nextValue
  ) {
    return;
  }
  lastExternalParticipantsSignature = nextSignature;
  participantsEl.value = nextValue;
  syncParticipantsPreview();
}

function syncParticipantsFromStorage() {
  if (!EMBEDDED_MODE) return;

  try {
    const raw = localStorage.getItem(BATTLE_PARTICIPANTS_STORAGE_KEY);
    if (raw == null) return;
    const names = JSON.parse(raw);
    if (!Array.isArray(names)) return;
    applyParticipantsFromParent(names);
  } catch (_) {
    // Ignore malformed storage payloads.
  }
}

window.rollbriaBattle = {
  setParticipants(names) {
    applyParticipantsFromParent(names);
  },
};

function randomBetween(min, max) {
  return min + getCryptoRandomFloat() * (max - min);
}

function getBattleStartAudio() {
  if (!battleStartAudio) {
    battleStartAudio = new Audio('battle-assets/sounds/battle-start.mp4');
    battleStartAudio.preload = 'auto';
    battleStartAudio.volume = 0.9;
  }
  return battleStartAudio;
}

function playBattleStartBell() {
  const audio = getBattleStartAudio();
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function getBattleHitAudio() {
  if (!battleHitAudio) {
    battleHitAudio = new Audio('battle-assets/sounds/battle-hit.mp3');
    battleHitAudio.preload = 'auto';
    battleHitAudio.volume = 0.32;
  }
  return battleHitAudio;
}

function getBattleCritAudio() {
  if (!battleCritAudio) {
    battleCritAudio = new Audio('battle-assets/sounds/battle-crit.mp3');
    battleCritAudio.preload = 'auto';
    battleCritAudio.volume = 0.42;
  }
  return battleCritAudio;
}

function playBattleHitSound(isCritical = false) {
  if (!hitSoundEnabled) return;
  const sourceAudio = isCritical ? getBattleCritAudio() : getBattleHitAudio();
  const playback = sourceAudio.cloneNode();
  playback.volume = sourceAudio.volume;
  playback.play().catch(() => {});
}

function getWinnerThemeAudio() {
  if (!winnerThemeAudio) {
    winnerThemeAudio = new Audio('battle-assets/sounds/winner-theme.mp4');
    winnerThemeAudio.preload = 'auto';
    winnerThemeAudio.volume = 1;
  }
  return winnerThemeAudio;
}

function playWinnerTheme() {
  const audio = getWinnerThemeAudio();
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function stopWinnerTheme() {
  const audio = getWinnerThemeAudio();
  audio.pause();
  audio.currentTime = 0;
}

function createAppearanceVariant() {
  const palette = [
    { hue: 0, saturate: 1, brightness: 1 },
    { hue: -18, saturate: 1.08, brightness: 0.98 },
    { hue: 22, saturate: 1.1, brightness: 1.02 },
    { hue: 48, saturate: 1.12, brightness: 1.04 },
    { hue: 92, saturate: 1.08, brightness: 1.01 },
    { hue: 148, saturate: 1.06, brightness: 1.03 },
    { hue: 210, saturate: 1.08, brightness: 1.02 },
    { hue: 286, saturate: 1.07, brightness: 1.02 },
  ];
  return palette[getCryptoRandomInt(palette.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildSpawnPoints(count) {
  const points = [];
  const minDistance = count <= 8
    ? 96
    : count <= 16
      ? 82
      : count <= 32
        ? 66
        : count <= 64
          ? 48
          : count <= 96
            ? 38
            : 30;
  const maxAttempts = Math.max(1200, count * 40);
  let attempts = 0;

  while (points.length < count && attempts < maxAttempts) {
    attempts += 1;
    const point = {
      x: randomBetween(ARENA_PADDING, canvas.width - ARENA_PADDING),
      y: randomBetween(ARENA_PADDING, canvas.height - ARENA_PADDING),
    };

    const overlaps = points.some((existing) => Math.hypot(existing.x - point.x, existing.y - point.y) < minDistance);
    if (!overlaps) {
      points.push(point);
    }
  }

  while (points.length < count) {
    points.push({
      x: randomBetween(ARENA_PADDING, canvas.width - ARENA_PADDING),
      y: randomBetween(ARENA_PADDING, canvas.height - ARENA_PADDING),
    });
  }

  return shuffle(points);
}

function getBattleVisualConfig(count) {
  if (count >= 120) {
    return {
      spriteSize: 40,
      shadowWidth: 11,
      shadowHeight: 4,
      nameFont: 15,
      nameY: -28,
      nameStroke: 3,
      hpWidth: 26,
      hpHeight: 5,
      hpY: -19,
    };
  }
  if (count >= 90) {
    return {
      spriteSize: 46,
      shadowWidth: 12,
      shadowHeight: 5,
      nameFont: 17,
      nameY: -31,
      nameStroke: 3,
      hpWidth: 30,
      hpHeight: 5,
      hpY: -22,
    };
  }
  if (count >= 60) {
    return {
      spriteSize: 54,
      shadowWidth: 14,
      shadowHeight: 5,
      nameFont: 22,
      nameY: -37,
      nameStroke: 4,
      hpWidth: 36,
      hpHeight: 6,
      hpY: -27,
    };
  }
  if (count >= 30) {
    return {
      spriteSize: 68,
      shadowWidth: 16,
      shadowHeight: 6,
      nameFont: 30,
      nameY: -45,
      nameStroke: 5,
      hpWidth: 46,
      hpHeight: 7,
      hpY: -33,
    };
  }

  return {
    spriteSize: 88,
    shadowWidth: 20,
    shadowHeight: 8,
    nameFont: 42,
    nameY: -54,
    nameStroke: 6,
    hpWidth: 56,
    hpHeight: 8,
    hpY: -38,
  };
}

function getBattlePerformanceProfile(count) {
  if (battleMode === 'mass') {
    return {
      drawArenaGrid: false,
      useSpriteFilter: false,
      useHitGlow: count <= 28,
      drawAttackArc: count <= 48,
      drawNames: true,
      drawHpBars: true,
      drawCombatTexts: count <= 32,
      verboseStatus: count <= 16,
    };
  }

  return {
    drawArenaGrid: count <= 120,
    useSpriteFilter: count <= 96,
    useHitGlow: false,
    drawAttackArc: count <= 120,
    drawNames: true,
    drawHpBars: true,
    drawCombatTexts: count <= 96,
    verboseStatus: count <= 72,
  };
}

function getParticipantNames() {
  const raw = (participantsEl?.value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const names = raw.length ? raw : (EMBEDDED_MODE ? [] : TEST_NAMES);
  return names.slice(0, MAX_FIGHTERS);
}

function spawnFighters() {
  const names = getParticipantNames();
  lastParticipantsSignature = buildParticipantsSignature(names);
  const shuffledNames = shuffle(names);
  const count = shuffledNames.length;
  if (!count) {
    fighters = [];
    eliminationLog = [];
    victoryState = null;
    combatTexts = [];
    updateWinnerModal(null);
    renderFeed();
    updateAliveCounter();
    statusEl.textContent = 'Add at least 2 participants to start the battle.';
    return;
  }

  const spawnPoints = buildSpawnPoints(names.length);

  fighters = shuffledNames.map((name, index) => ({
    id: index + 1,
    name,
    x: spawnPoints[index].x,
    y: spawnPoints[index].y,
    vx: 0,
    vy: 0,
    hp: 100,
    alive: true,
    attackCooldown: randomBetween(0.2, 0.8),
    hitFlash: 0,
    deathTimer: 0,
    corpseTimer: 0,
    targetId: null,
    facing: 1,
    walkCycle: randomBetween(0, Math.PI * 2),
    attackSwing: 0,
    attackWindup: 0,
    attackLunge: 0,
    state: 'idle',
    stateTime: 0,
    view: 'front',
    appearance: createAppearanceVariant(),
  }));

  eliminationLog = [];
  victoryState = null;
  combatTexts = [];
  updateWinnerModal(null);
  renderFeed();
  updateAliveCounter();
}

function shuffleFighterPositions() {
  if (!fighters.length) {
    spawnFighters();
    return;
  }

  const alive = fighters.filter((fighter) => fighter.alive);
  const fallen = fighters.filter((fighter) => !fighter.alive);
  const aliveSpawnPoints = buildSpawnPoints(alive.length);

  alive.forEach((fighter, index) => {
    const point = aliveSpawnPoints[index];
    fighter.x = point.x;
    fighter.y = point.y;
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.targetId = null;
    fighter.view = 'front';
    fighter.facing = 1;
    fighter.attackSwing = 0;
    fighter.attackWindup = 0;
    fighter.attackLunge = 0;
    fighter.hitFlash = 0;
    fighter.appearance = createAppearanceVariant();
    if (fighter.alive) {
      setFighterState(fighter, 'idle');
    }
  });

  fallen.forEach((fighter) => {
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.targetId = null;
  });
  victoryState = null;
  combatTexts = [];
  updateWinnerModal(null);
  updateAliveCounter();
}

function syncParticipantsPreview() {
  running = false;
  spawnFighters();
  updateBattleReadyStatus();
}

function addCombatText(fighter, text, color = '#fff0c5') {
  combatTexts.push({
    fighterId: fighter.id,
    text,
    color,
    time: 0,
    duration: 0.8,
    xJitter: randomBetween(-8, 8),
  });
}

function updateWinnerModal(winner) {
  if (!winner) {
    winnerModalEl.hidden = true;
    stopWinnerTheme();
    winnerKickerEl.textContent = 'Victory';
    winnerNameEl.textContent = 'Winner';
    winnerSubtitleEl.textContent = 'stands alone in the arena';
    return;
  }

  if (winner.draw) {
    winnerKickerEl.textContent = 'Result';
    winnerNameEl.textContent = 'DRAW';
    winnerSubtitleEl.textContent = 'both fighters fell at the same time';
  } else {
    winnerKickerEl.textContent = 'Victory';
    winnerNameEl.textContent = winner.name;
    winnerSubtitleEl.textContent = 'stands alone in the arena';
    playWinnerTheme();
  }
  winnerModalEl.hidden = false;
  notifyParent({ type: 'battle-finish' });
}

function resolveView(dx, dy) {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absY > absX * 1.15) {
    return dy > 0 ? 'front' : 'back';
  }

  return dx >= 0 ? 'right' : 'left';
}

function resolveMoveView(dx) {
  return dx >= 0 ? 'right' : 'left';
}

function getSpriteDirection(view) {
  if (view === 'back') return 'back';
  if (view === 'left') return 'left';
  if (view === 'right') return 'right';
  return 'front';
}

function getAnimationKey(fighter) {
  if (!fighter.alive) return 'death';
  if (fighter.state === 'victory') return 'victory';
  if (fighter.state === 'hit' && fighter.hitFlash > 0.16) return 'hit';
  if (fighter.state === 'attack' || fighter.attackSwing > 0 || fighter.attackWindup > 0) return 'attack';
  if (Math.hypot(fighter.vx, fighter.vy) > 2) return 'run';
  return 'idle';
}

function getAnimationFrame(fighter) {
  const directionKey = getSpriteDirection(fighter.view);
  const animationKey = getAnimationKey(fighter);
  const pack = ANIMATION_ASSETS[directionKey] || ANIMATION_ASSETS.front;
  const frames = pack[animationKey];
  let frameIndex = 0;

  if (animationKey === 'run') {
    frameIndex = Math.floor((fighter.walkCycle * 0.82) % frames.length);
  } else if (animationKey === 'idle') {
    frameIndex = Math.floor((fighter.stateTime * 4) % frames.length);
  } else if (animationKey === 'attack') {
    const attackProgress = clamp(1 - ((fighter.attackSwing + fighter.attackWindup) / 2), 0, 0.999);
    frameIndex = Math.min(frames.length - 1, Math.floor(attackProgress * frames.length));
  } else if (animationKey === 'hit') {
    const hitProgress = clamp(1 - fighter.hitFlash, 0, 0.999);
    frameIndex = Math.min(frames.length - 1, Math.floor(hitProgress * frames.length));
  } else if (animationKey === 'death') {
    const deathProgress = 1 - fighter.deathTimer;
    frameIndex = Math.min(frames.length - 1, Math.max(0, Math.floor(deathProgress * frames.length)));
  } else if (animationKey === 'victory') {
    frameIndex = Math.min(frames.length - 1, Math.floor((fighter.stateTime * 8) % frames.length));
  }

  const frame = frames[frameIndex];
  if (typeof frame === 'string') {
    return { image: loadedSprites[frame], flip: pack.flip, source: null };
  }

  const image = loadedSprites[frame.path];
  if (!image) return { image: null, flip: pack.flip, source: null };

  const frameWidth = image.width / frame.columns;
  const frameHeight = image.height / frame.rows;
  const sx = (frame.index % frame.columns) * frameWidth;
  const sy = Math.floor(frame.index / frame.columns) * frameHeight;

  return {
    image,
    flip: pack.flip,
    source: {
      sx: Math.round(sx),
      sy: Math.round(sy),
      sw: Math.max(1, Math.round(frameWidth)),
      sh: Math.max(1, Math.round(frameHeight)),
    },
  };
}

function preloadSprites() {
  const paths = new Set();
  Object.values(ANIMATION_ASSETS).forEach((pack) => {
    Object.values(pack).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((frame) => {
          if (typeof frame === 'string') {
            paths.add(frame);
          } else if (frame?.path) {
            paths.add(frame.path);
          }
        });
      }
    });
  });

  return Promise.all([...paths].map((path) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      loadedSprites[path] = image;
      resolve();
    };
    image.onerror = reject;
    image.src = path;
  })));
}

function getAliveFighters() {
  return fighters.filter((fighter) => fighter.alive);
}

function hasPendingDeathAnimation() {
  return fighters.some((fighter) => !fighter.alive && fighter.deathTimer > 0);
}

function updateFallenFighters(dt) {
  fighters.forEach((fighter) => {
    if (fighter.alive) return;

    if (fighter.deathTimer > 0) {
      fighter.deathTimer = Math.max(0, fighter.deathTimer - dt);
      if (fighter.deathTimer === 0 && fighter.corpseTimer <= 0) {
        fighter.corpseTimer = CORPSE_FADE_DELAY;
      }
      return;
    }

    if (fighter.corpseTimer > 0) {
      fighter.corpseTimer = Math.max(0, fighter.corpseTimer - dt);
    }
  });
}

function setFighterState(fighter, nextState) {
  if (fighter.state !== nextState) {
    fighter.state = nextState;
    fighter.stateTime = 0;
  }
}

function pickTarget(fighter) {
  const alive = getAliveFighters().filter((candidate) => candidate.id !== fighter.id);
  if (!alive.length) return null;

  let best = alive[0];
  let bestDist = Infinity;

  alive.forEach((candidate) => {
    const dx = candidate.x - fighter.x;
    const dy = candidate.y - fighter.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  });

  return best;
}

function logEvent(text) {
  eliminationLog.unshift(text);
  eliminationLog = eliminationLog.slice(0, 6);
  renderFeed();
}

function startVictoryCelebration(winner) {
  winner.vx = 0;
  winner.vy = 0;
  winner.view = 'front';
  winner.facing = 1;
  winner.attackSwing = 0;
  winner.attackWindup = 0;
  winner.attackLunge = 0;
  setFighterState(winner, 'victory');

  victoryState = {
    mode: 'winner',
    winnerId: winner.id,
    time: 0,
    modalShown: false,
  };
}

function startDrawCelebration() {
  victoryState = {
    mode: 'draw',
    winnerId: null,
    time: 0,
    modalShown: false,
  };
}

function updateVictoryCelebration(dt) {
  if (!victoryState) return;
  victoryState.time += dt;

  if (victoryState.mode === 'draw') {
    if (!victoryState.modalShown && victoryState.time >= WINNER_MODAL_DELAY) {
      victoryState.modalShown = true;
      updateWinnerModal({ draw: true });
    }
    return;
  }

  const winner = fighters.find((fighter) => fighter.id === victoryState.winnerId);
  if (!winner) return;

  winner.view = 'front';
  winner.facing = 1;
  winner.stateTime += dt;

  if (!victoryState.modalShown && victoryState.time >= WINNER_MODAL_DELAY) {
    victoryState.modalShown = true;
    updateWinnerModal(winner);
  }
}

function updateCombatTexts(dt) {
  combatTexts.forEach((item) => {
    item.time += dt;
  });
  combatTexts = combatTexts.filter((item) => item.time < item.duration);
  if (fighters.length > 64 && combatTexts.length > 18) {
    combatTexts = combatTexts.slice(-18);
  }
}

function renderFeed() {
  feedEl.innerHTML = eliminationLog
    .map((item) => `<div class="battle-feed-item">${item}</div>`)
    .join('');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveAttack(attacker, target) {
  const attackerHealth = clamp(attacker.hp / 100, 0, 1);
  const targetHealth = clamp(target.hp / 100, 0, 1);
  const attackerDesperation = 1 - attackerHealth;
  const targetDesperation = 1 - targetHealth;
  const missChance = 0.08 + (attackerDesperation * 0.05);

  if (randomChance(missChance)) {
    return {
      hit: false,
      damage: 0,
      crit: false,
      cooldown: randomBetween(0.28, 0.54),
      label: 'misses',
    };
  }

  const dodgeChance = 0.06 + (targetDesperation * 0.14);
  if (randomChance(dodgeChance)) {
    return {
      hit: false,
      damage: 0,
      crit: false,
      cooldown: randomBetween(0.24, 0.48),
      label: 'dodges',
    };
  }

  const critChance = 0.1 + (attackerDesperation * 0.26);
  const guardChance = 0.05 + (targetDesperation * 0.16);
  const crit = randomChance(critChance);
  const guarded = randomChance(guardChance);

  let damage = randomBetween(BASE_DAMAGE_MIN, BASE_DAMAGE_MAX);
  damage *= 0.92 + (attackerDesperation * 0.4);

  if (crit) {
    damage *= 1.55;
  }

  if (guarded) {
    damage *= 0.58;
  }

  damage = Math.max(6, damage);

  const cooldownBase = randomBetween(BASE_ATTACK_COOLDOWN_MIN, BASE_ATTACK_COOLDOWN_MAX);
  const cooldown = Math.max(0.3, cooldownBase * (1 - attackerDesperation * 0.2));

  return {
    hit: true,
    damage,
    crit,
    guarded,
    cooldown,
    label: crit ? 'lands a critical hit on' : (guarded ? 'clips' : 'strikes'),
  };
}

function updateBattle(dt) {
  const alive = getAliveFighters();
  if (alive.length <= 1) {
    const pendingDeathAnimation = hasPendingDeathAnimation();
    running = pendingDeathAnimation;
    updateFallenFighters(dt);

    if (pendingDeathAnimation) {
      return;
    }

    if (!victoryState) {
      if (alive[0]) {
        statusEl.textContent = `${alive[0].name} wins the arena.`;
        logEvent(`Winner: ${alive[0].name}`);
        startVictoryCelebration(alive[0]);
      } else {
        statusEl.textContent = 'Draw. No fighter survived the arena.';
        logEvent('Result: DRAW');
        startDrawCelebration();
      }
    }
    return;
  }

  alive.forEach((fighter) => {
    fighter.attackCooldown -= dt;
    fighter.hitFlash = Math.max(0, fighter.hitFlash - dt * 3);
    fighter.attackSwing = Math.max(0, fighter.attackSwing - dt * 4.8);
    fighter.attackWindup = Math.max(0, fighter.attackWindup - dt * 3.2);
    fighter.attackLunge = Math.max(0, fighter.attackLunge - dt * 5.4);
    fighter.stateTime += dt;

    const target = pickTarget(fighter);
    fighter.targetId = target?.id ?? null;
    if (!target) return;

    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const moveSpeed = 48;
    const attackRange = 48;
    if (dist > attackRange) {
      fighter.vx = (dx / dist) * moveSpeed;
      fighter.vy = (dy / dist) * moveSpeed;
      fighter.facing = fighter.vx >= 0 ? 1 : -1;
      fighter.view = resolveMoveView(fighter.vx);
      const stepX = fighter.vx * dt;
      const stepY = fighter.vy * dt;
      fighter.x += stepX;
      fighter.y += stepY;
      fighter.walkCycle += Math.hypot(stepX, stepY) / 8.8;
      setFighterState(fighter, 'run');
    } else {
      fighter.vx = 0;
      fighter.vy = 0;
      fighter.facing = dx >= 0 ? 1 : -1;
      fighter.view = resolveView(dx, dy);
      if (fighter.state !== 'hit' && fighter.state !== 'attack') {
        setFighterState(fighter, 'idle');
      }

      if (fighter.attackCooldown <= 0) {
        const attackResult = resolveAttack(fighter, target);
        fighter.attackCooldown = attackResult.cooldown;
        fighter.attackWindup = 1;
        fighter.attackSwing = 1;
        fighter.attackLunge = 1;
        setFighterState(fighter, 'attack');
        if (getBattlePerformanceProfile(fighters.length).verboseStatus) {
          statusEl.textContent = `${fighter.name} ${attackResult.label} ${target.name}.`;
        }

        if (attackResult.hit) {
          target.hp -= attackResult.damage;
          target.hitFlash = 1;
          setFighterState(target, 'hit');
          playBattleHitSound(attackResult.crit);

          if (attackResult.crit && fighter.hp < 45) {
            fighter.hp = Math.min(100, fighter.hp + attackResult.damage * 0.12);
          }

          if (target.hp <= 0 && target.alive) {
            target.alive = false;
            target.deathTimer = 1;
            target.corpseTimer = 0;
            setFighterState(target, 'death');
            updateAliveCounter();
            logEvent(`${target.name} was eliminated by ${fighter.name}`);
          }
        }
        if (!attackResult.hit) {
          const text = attackResult.label === 'dodges' ? 'dodge' : 'miss';
          const sourceFighter = attackResult.label === 'dodges' ? target : fighter;
          const color = attackResult.label === 'dodges' ? '#b7e1ff' : '#ffd3a8';
          addCombatText(sourceFighter, text, color);
        }
      }
    }

    if (fighter.state === 'hit' && fighter.hitFlash <= 0.16) {
      setFighterState(fighter, 'idle');
    }
    if (fighter.state === 'attack' && fighter.attackSwing <= 0.05 && fighter.attackWindup <= 0.05) {
      setFighterState(fighter, 'idle');
    }

    fighter.x = Math.max(ARENA_PADDING, Math.min(canvas.width - ARENA_PADDING, fighter.x));
    fighter.y = Math.max(ARENA_PADDING, Math.min(canvas.height - ARENA_PADDING, fighter.y));
  });

  updateFallenFighters(dt);
}

function drawArena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const perf = getBattlePerformanceProfile(fighters.length);
  if (!perf.drawArenaGrid) return;

  ctx.strokeStyle = 'rgba(241, 221, 179, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 40; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 40; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawFighter(fighter) {
  const visual = getBattleVisualConfig(fighters.length);
  const perf = getBattlePerformanceProfile(fighters.length);
  const size = visual.spriteSize;
  if (!fighter.alive && fighter.deathTimer <= 0 && fighter.corpseTimer <= 0) return;

  const corpseAlpha = fighter.deathTimer > 0
    ? (0.52 + fighter.deathTimer * 0.32)
    : (fighter.corpseTimer / CORPSE_FADE_DELAY) * 0.52;
  const alpha = fighter.alive ? 1 : corpseAlpha;
  if (alpha <= 0) return;

  const lungeOffset = 0;
  const swingProgress = 1 - fighter.attackSwing;
  const windupTilt = fighter.attackWindup > 0 ? fighter.attackWindup * -0.28 * fighter.facing : 0;
  const frame = getAnimationFrame(fighter);
  const appearance = fighter.appearance || createAppearanceVariant();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(fighter.x + lungeOffset), Math.round(fighter.y));

  if (perf.useHitGlow && fighter.hitFlash > 0) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 220, 160, 0.9)';
  }

  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 24, visual.shadowWidth, visual.shadowHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(windupTilt);
  if (frame.flip) {
    ctx.scale(-1, 1);
  }
  if (frame.image) {
    const sourceWidth = frame.source?.sw ?? frame.image.width;
    const sourceHeight = frame.source?.sh ?? frame.image.height;
    const drawHeight = size;
    const drawWidth = drawHeight * (sourceWidth / sourceHeight);
    if (perf.useSpriteFilter) {
      ctx.filter = `hue-rotate(${appearance.hue}deg) saturate(${appearance.saturate}) brightness(${appearance.brightness})`;
    }
    if (frame.source) {
      ctx.drawImage(
        frame.image,
        frame.source.sx,
        frame.source.sy,
        frame.source.sw,
        frame.source.sh,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
      );
    } else {
      ctx.drawImage(frame.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    }
    if (perf.useSpriteFilter) {
      ctx.filter = 'none';
    }
  }
  ctx.restore();

  if (perf.drawAttackArc && fighter.attackSwing > 0) {
    ctx.save();
    ctx.globalAlpha = 0.22 * fighter.attackSwing;
    ctx.strokeStyle = 'rgba(255, 225, 170, 0.55)';
    ctx.lineWidth = Math.max(2, Math.round(size * 0.045));
    ctx.beginPath();
    const slashAngle = (-1.3 + (swingProgress * 2.35)) * fighter.facing;
    ctx.arc(0, -2, Math.max(14, size * 0.32), slashAngle - 0.55, slashAngle + 0.18);
    ctx.stroke();
    ctx.restore();
  }

  if (fighter.alive && perf.drawNames) {
    ctx.font = `bold ${visual.nameFont}px Cinzel`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5e6c8';
    ctx.strokeStyle = 'rgba(24, 14, 8, 0.88)';
    ctx.lineWidth = visual.nameStroke;
    ctx.strokeText(fighter.name, 0, visual.nameY);
    ctx.fillText(fighter.name, 0, visual.nameY);
  }

  if (fighter.alive && perf.drawHpBars) {
    ctx.strokeStyle = 'rgba(20, 8, 8, 0.9)';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(45, 10, 10, 0.82)';
    ctx.fillRect(-visual.hpWidth / 2, visual.hpY, visual.hpWidth, visual.hpHeight);
    ctx.strokeRect(-visual.hpWidth / 2, visual.hpY, visual.hpWidth, visual.hpHeight);
    ctx.fillStyle = '#d92d20';
    ctx.fillRect(-visual.hpWidth / 2, visual.hpY, Math.max(0, (fighter.hp / 100) * visual.hpWidth), visual.hpHeight);
  }

  ctx.restore();
}

function drawCombatTexts() {
  const perf = getBattlePerformanceProfile(fighters.length);
  if (!perf.drawCombatTexts) return;

  combatTexts.forEach((item) => {
    const fighter = fighters.find((candidate) => candidate.id === item.fighterId);
    if (!fighter) return;

    const progress = item.time / item.duration;
    const rise = 22 + progress * 26;
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px Cinzel';
    ctx.strokeStyle = 'rgba(25, 15, 8, 0.78)';
    ctx.lineWidth = 4;
    ctx.fillStyle = item.color;
    const x = fighter.x + item.xJitter;
    const y = fighter.y - 54 - rise;
    ctx.strokeText(item.text, x, y);
    ctx.fillText(item.text, x, y);
    ctx.restore();
  });
}

function render() {
  drawArena();
  fighters.forEach(drawFighter);
  drawCombatTexts();
}

function loop(now) {
  if (!lastTime) lastTime = now;
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  if (running || hasPendingDeathAnimation()) {
    updateBattle(dt);
  }

  updateVictoryCelebration(dt);
  updateCombatTexts(dt);

  render();
  requestAnimationFrame(loop);
}

btnStart.addEventListener('click', () => {
  if (getParticipantNames().length < 2) {
    statusEl.textContent = 'Add at least 2 participants to start the battle.';
    return;
  }

  if (!fighters.length) {
    spawnFighters();
  }

  playBattleStartBell();
  notifyParent({ type: 'battle-start' });
  running = true;
  statusEl.textContent = `Battle started. ${fighters.length} fighters are hunting each other.`;
});

btnShuffle.addEventListener('click', () => {
  if (getParticipantNames().length < 2) {
    statusEl.textContent = 'Add at least 2 participants to shuffle the arena.';
    return;
  }

  if (!fighters.length) {
    spawnFighters();
  } else {
    shuffleFighterPositions();
  }

  statusEl.textContent = running
    ? 'Arena shuffled. Fighters are re-engaging from new positions.'
    : 'Arena shuffled. Fighters have new random starting positions.';
});

btnModeNormal?.addEventListener('click', () => {
  setBattleMode('normal');
});

btnModeMass?.addEventListener('click', () => {
  setBattleMode('mass');
});

btnHitSound?.addEventListener('click', () => {
  setHitSoundEnabled(!hitSoundEnabled);
});

btnHitSoundStage?.addEventListener('click', () => {
  setHitSoundEnabled(!hitSoundEnabled);
});

participantsEl.addEventListener('input', () => {
  syncParticipantsPreview();
});

window.addEventListener('message', (event) => {
  if (event.data?.source !== 'rollbria-parent') return;
  if (event.data.type === 'participants-sync') {
    applyParticipantsFromParent(event.data.names);
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === BATTLE_PARTICIPANTS_STORAGE_KEY) {
    syncParticipantsFromStorage();
  }
});

btnReset.addEventListener('click', () => {
  spawnFighters();
  running = false;
  notifyParent({ type: 'battle-exit' });
  updateBattleReadyStatus();
});

preloadSprites().then(() => {
  updateBattleModeButtons();
  loadHitSoundSetting();
  updateHitSoundButtons();
  if (EMBEDDED_MODE) {
    document.body.classList.add('battle-embedded');
    if (participantsEl) {
      participantsEl.value = '';
    }
    syncParticipantsFromStorage();
    notifyParent({ type: 'battle-ready' });
  }
  spawnFighters();
  updateBattleReadyStatus();
  render();
  requestAnimationFrame(loop);
}).catch(() => {
  statusEl.textContent = 'Failed to load battle sprites.';
});
