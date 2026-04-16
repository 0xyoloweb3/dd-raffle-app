const SAMPLE_PARTICIPANTS = [
  'Ava',
  'Noah',
  'Liam',
  'Mila',
  'Ethan',
  'Sofia',
  'Lucas',
  'Zoe',
  'Mason',
  'Ivy',
  'Leo',
  'Nora',
];

const MODE_META = {
  quick: {
    label: 'Quickbria',
    description: 'Quickbria instantly lands on a winner and keeps the pace moving.',
  },
  roulette: {
    label: 'Stripbria',
    description: 'Stripbria builds suspense with a horizontal run and a clean center stop.',
  },
  wheel: {
    label: 'Wheelbria',
    description: 'Wheelbria turns the draw into a proper stage moment with longer anticipation.',
  },
  multi: {
    label: 'Multibria',
    description: 'Multibria selects several winners at once without repeating the same person.',
  },
  battle: {
    label: 'Battlebria',
    description: 'Battlebria assigns fixed fantasy fighters to your entrants and eliminates them one by one on the arena.',
  },
};

const WHEEL_COLORS = [
  '#6d4a2b', '#83552f', '#4f5a2d', '#7a6331', '#5b3d23',
  '#7f3f2f', '#37533a', '#8a6a3a', '#604122', '#5f4b2d',
  '#7c5130', '#4a3721', '#7f6540', '#6b2f24', '#556338',
];

const BATTLE_CHARACTERS = [
  { id: 'knight', role: 'Knight', avatar: 'рџ›ЎпёЏ', weapon: 'вљ”пёЏ', tint: '#d9c28b' },
  { id: 'archer', role: 'Archer', avatar: 'рџЏ№', weapon: 'рџ—ЎпёЏ', tint: '#87b06f' },
  { id: 'mage', role: 'Mage', avatar: 'рџ§™', weapon: 'вњЁ', tint: '#8ea7d8' },
  { id: 'berserker', role: 'Berserker', avatar: 'рџЄ“', weapon: 'рџ”Ґ', tint: '#c88963' },
  { id: 'rogue', role: 'Rogue', avatar: 'рџҐ·', weapon: 'рџ—ЎпёЏ', tint: '#8b7d9f' },
  { id: 'paladin', role: 'Paladin', avatar: 'рџ›ЎпёЏ', weapon: 'вЂпёЏ', tint: '#d8b86f' },
  { id: 'hunter', role: 'Hunter', avatar: 'рџЄѓ', weapon: 'рџЏ№', tint: '#75a08f' },
  { id: 'warlock', role: 'Warlock', avatar: 'рџ”®', weapon: 'в„пёЏ', tint: '#9a79ae' },
];

let participants = [];
let history = [];
let winnersCount = 3;
let isSpinning = false;
let wheelAngle = 0;
let modeDurations = {
  quick: 10,
  roulette: 10,
  wheel: 10,
  multi: 10,
  battle: 10,
};
let modeTimerVisible = {
  quick: true,
  roulette: true,
  wheel: true,
  multi: true,
  battle: true,
};
let wheelTabActive = false;
let idleAnimId = null;
let currentMode = null;
let brandDragPosition = { x: 0, y: 0 };
let activeBrandDrag = null;
let brandElementState = {
  banner: { x: 0, y: 0, scale: 1 },
  fire: { x: 0, y: 0, scale: 1 },
  title: { x: 0, y: 0, scale: 1 },
};
let activeBrandElementDrag = null;
let woodNormalDecorState = { x: 0, y: 0, scale: 1 };
let activeWoodNormalDecorDrag = null;

const inputName = document.getElementById('input-name');
const btnAdd = document.getElementById('btn-add');
const btnImport = document.getElementById('btn-import');
const btnClearAll = document.getElementById('btn-clear-all');
const btnShuffle = document.getElementById('btn-shuffle');
const btnDedupe = document.getElementById('btn-dedupe');
const inputBulk = document.getElementById('input-bulk');
const participantList = document.getElementById('participant-list');
const participantCount = document.getElementById('participant-count');
const participantStatus = document.getElementById('participant-status');
const historyCount = document.getElementById('history-count');
const activeModeLabel = document.getElementById('active-mode-label');
const modeDescription = document.getElementById('mode-description');
const mainIntro = document.getElementById('main-intro');
const brandBlock = document.getElementById('brand-block');
const brandBannerImage = document.getElementById('brand-banner-image');
const brandBannerOverlay = document.getElementById('brand-banner-overlay');
const brandFireGif = document.getElementById('brand-fire-gif');
const brandLogoImage = document.getElementById('brand-logo-image');
const sitePlaqueDecor = document.getElementById('site-plaque-decor');
const sitePlaqueDecreaseBtn = document.getElementById('site-plaque-decrease');
const sitePlaqueIncreaseBtn = document.getElementById('site-plaque-increase');
const woodNormalDecor = document.getElementById('wood-normal-decor');
const woodNormalDecreaseBtn = document.getElementById('wood-normal-decrease');
const woodNormalIncreaseBtn = document.getElementById('wood-normal-increase');
const participantsTitleArt = document.getElementById('participants-title-art');
const participantsBoard = document.querySelector('.participants-board');
const participantsBoardMovableEls = Array.from(document.querySelectorAll('.participants-board [data-board-move]'));
const participantsBoardTextEls = Array.from(document.querySelectorAll('.participants-board [data-board-text]'));

const btnQuickDraw = document.getElementById('btn-quick-draw');
const quickWinner = document.getElementById('quick-winner');
const quickWinnerName = document.getElementById('quick-winner-name');

const btnSpin = document.getElementById('btn-spin');
const rouletteTrack = document.getElementById('roulette-track');
const rouletteResult = document.getElementById('roulette-result');

const modeWheelPanel = document.getElementById('mode-wheel');
const wheelCanvas = document.getElementById('wheel-canvas');
const wheelCtx = wheelCanvas.getContext('2d');
const btnWheelSpin = document.getElementById('btn-wheel-spin');
const wheelResult = document.getElementById('wheel-result');
const wheelDebugProgress = document.getElementById('wheel-debug-progress');
const wheelDebugVelocity = document.getElementById('wheel-debug-velocity');
const wheelDebugRemaining = document.getElementById('wheel-debug-remaining');

const btnMultiDraw = document.getElementById('btn-multi-draw');
const multiResults = document.getElementById('multi-results');
const winnersCountEl = document.getElementById('winners-count');
const btnWinnersPlus = document.getElementById('btn-winners-plus');
const btnWinnersMinus = document.getElementById('btn-winners-minus');
const btnBattleStart = document.getElementById('btn-battle-start');
const battlefield = document.getElementById('battlefield');
const battleResult = document.getElementById('battle-result');
const battlePrototypeFrame = document.getElementById('battle-prototype-frame');

const historyList = document.getElementById('history-list');
const btnClearHistory = document.getElementById('btn-clear-history');
const winnerPopup = document.getElementById('winner-popup');
const winnerPopupConfetti = document.getElementById('winner-popup-confetti');
const winnerPopupClose = document.getElementById('winner-popup-close');
const winnerPopupKicker = document.getElementById('winner-popup-kicker');
const winnerPopupBody = document.getElementById('winner-popup-body');
const modeTimerEls = {
  quick: document.getElementById('quick-timer'),
  roulette: document.getElementById('roulette-timer'),
  multi: document.getElementById('multi-timer'),
  battle: document.getElementById('battle-timer'),
};
const timerToggleEls = {
  quick: document.querySelector('[data-timer-toggle="quick"]'),
  roulette: document.querySelector('[data-timer-toggle="roulette"]'),
  multi: document.querySelector('[data-timer-toggle="multi"]'),
  battle: document.querySelector('[data-timer-toggle="battle"]'),
};
const activeTimerFrames = {
  quick: null,
  roulette: null,
  wheel: null,
  multi: null,
  battle: null,
};

const DEFAULT_WHEEL_SIZE = { width: 740, height: 360 };
const FOCUS_WHEEL_SIZE = { width: 960, height: 960 };
const DEFAULT_PEAK_VELOCITY = 1180;
const STRIP_ITEMS_PER_SECOND = 5.2;
const WHEEL_BASE_ROTATIONS_PER_SECOND = 0.96;
let activeSpinPlan = null;
const BATTLE_PARTICIPANTS_STORAGE_KEY = 'rollbria-battle-participants';
const BRAND_DRAG_STORAGE_KEY = 'rollbria-brand-drag';
const PARTICIPANTS_BOARD_LAYOUT_KEY = 'rollbria-participants-board-layout';
const PARTICIPANTS_BOARD_LAYOUT_VERSION = 5;
let lastBattleSyncSignature = null;
let winnerThemeAudio = null;
let uiAudioContext = null;
let activeParticipantsBoardDrag = null;
let participantsBoardLayoutState = {};
let participantsBoardTextState = {};
let sitePlaqueDecorState = { x: 0, y: 0, scale: 1 };
let activeSitePlaqueDecorDrag = null;

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

function pickRandomItem(items) {
  if (!items.length) return undefined;
  return items[getCryptoRandomInt(items.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function secureShuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizedName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function hasParticipant(name) {
  const needle = normalizedName(name);
  return participants.some((item) => normalizedName(item) === needle);
}

function setParticipantStatus(text, tone = '') {
  if (!participantStatus) return;
  participantStatus.textContent = text;
  participantStatus.className = 'panel-status';
  if (tone) participantStatus.classList.add(`is-${tone}`);
}

function applyParticipantsTitleArtLayout() {
  if (!participantsTitleArt) return;
  const state = participantsBoardLayoutState['participants-title-art'] || { x: 0, y: 0, scale: 1 };
  participantsTitleArt.style.setProperty('--participants-title-x', `${state.x}px`);
  participantsTitleArt.style.setProperty('--participants-title-y', `${state.y}px`);
  participantsTitleArt.style.setProperty('--participants-title-scale', `${state.scale ?? 1}`);
}

function setupParticipantsTitleArtControl() {
  if (!participantsTitleArt) return;
  const key = 'participants-title-art';
  participantsBoardLayoutState[key] = participantsBoardLayoutState[key] || { x: 0, y: 0, scale: 1 };
  applyParticipantsTitleArtLayout();

  let activeTitleDrag = null;

  participantsTitleArt.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    activeTitleDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: participantsBoardLayoutState[key].x || 0,
      originY: participantsBoardLayoutState[key].y || 0,
    };
    participantsTitleArt.classList.add('is-dragging');
    participantsTitleArt.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  participantsTitleArt.addEventListener('pointermove', (event) => {
    if (!activeTitleDrag || activeTitleDrag.pointerId !== event.pointerId) return;
    participantsBoardLayoutState[key] = {
      ...participantsBoardLayoutState[key],
      x: activeTitleDrag.originX + (event.clientX - activeTitleDrag.startX),
      y: activeTitleDrag.originY + (event.clientY - activeTitleDrag.startY),
    };
    applyParticipantsTitleArtLayout();
  });

  const finishTitleDrag = (event) => {
    if (!activeTitleDrag || activeTitleDrag.pointerId !== event.pointerId) return;
    participantsTitleArt.classList.remove('is-dragging');
    saveParticipantsBoardState();
    activeTitleDrag = null;
  };

  participantsTitleArt.addEventListener('pointerup', finishTitleDrag);
  participantsTitleArt.addEventListener('pointercancel', finishTitleDrag);

  participantsTitleArt.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextScale = Math.min(2.5, Math.max(0.45, (participantsBoardLayoutState[key].scale || 1) + (event.deltaY < 0 ? 0.05 : -0.05)));
    participantsBoardLayoutState[key] = {
      ...participantsBoardLayoutState[key],
      scale: Number(nextScale.toFixed(2)),
    };
    applyParticipantsTitleArtLayout();
    saveParticipantsBoardState();
  }, { passive: false });

  participantsTitleArt.addEventListener('dblclick', (event) => {
    event.preventDefault();
    event.stopPropagation();
    participantsBoardLayoutState[key] = { x: 0, y: 0, scale: 1 };
    applyParticipantsTitleArtLayout();
    saveParticipantsBoardState();
  });
}

function applyBrandDragPosition() {
  if (!brandBannerOverlay || !brandBannerImage) return;
  brandBannerImage.style.setProperty('--brand-banner-x', `${brandElementState.banner.x}px`);
  brandBannerImage.style.setProperty('--brand-banner-y', `${brandElementState.banner.y}px`);
  brandBannerImage.style.setProperty('--brand-banner-scale', `${brandElementState.banner.scale}`);
  brandBannerOverlay.style.setProperty('--brand-drag-x', `${brandDragPosition.x}px`);
  brandBannerOverlay.style.setProperty('--brand-drag-y', `${brandDragPosition.y}px`);
  brandBannerOverlay.style.setProperty('--brand-fire-x', `${brandElementState.fire.x}px`);
  brandBannerOverlay.style.setProperty('--brand-fire-y', `${brandElementState.fire.y}px`);
  brandBannerOverlay.style.setProperty('--brand-fire-scale', `${brandElementState.fire.scale}`);
  brandBannerOverlay.style.setProperty('--brand-title-x', `${brandElementState.title.x}px`);
  brandBannerOverlay.style.setProperty('--brand-title-y', `${brandElementState.title.y}px`);
  brandBannerOverlay.style.setProperty('--brand-title-scale', `${brandElementState.title.scale}`);
}

function saveBrandDragPosition() {
  try {
    localStorage.setItem(BRAND_DRAG_STORAGE_KEY, JSON.stringify({
      overlay: brandDragPosition,
      banner: brandElementState.banner,
      fire: brandElementState.fire,
      title: brandElementState.title,
    }));
  } catch (_) {
    // Ignore storage issues.
  }
}

function resetBrandDragPosition() {
  brandDragPosition = { x: 0, y: 0 };
  applyBrandDragPosition();
  saveBrandDragPosition();
}

function resetBrandElement(key) {
  brandElementState[key] = { x: 0, y: 0, scale: 1 };
  applyBrandDragPosition();
  saveBrandDragPosition();
}

function setupBrandBannerControl() {
  if (!brandBlock || !brandBannerImage) return;

  brandBlock.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (event.target === brandFireGif || event.target === brandLogoImage) return;
    activeBrandElementDrag = {
      key: 'banner',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: brandElementState.banner.x,
      originY: brandElementState.banner.y,
    };
    brandBlock.classList.add('is-dragging');
    brandBlock.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  brandBlock.addEventListener('pointermove', (event) => {
    if (!activeBrandElementDrag || activeBrandElementDrag.pointerId !== event.pointerId || activeBrandElementDrag.key !== 'banner') return;
    brandElementState.banner = {
      ...brandElementState.banner,
      x: activeBrandElementDrag.originX + (event.clientX - activeBrandElementDrag.startX),
      y: activeBrandElementDrag.originY + (event.clientY - activeBrandElementDrag.startY),
    };
    applyBrandDragPosition();
  });

  const finishBannerDrag = (event) => {
    if (!activeBrandElementDrag || activeBrandElementDrag.pointerId !== event.pointerId || activeBrandElementDrag.key !== 'banner') return;
    brandBlock.classList.remove('is-dragging');
    saveBrandDragPosition();
    activeBrandElementDrag = null;
  };

  brandBlock.addEventListener('pointerup', finishBannerDrag);
  brandBlock.addEventListener('pointercancel', finishBannerDrag);

  brandBlock.addEventListener('wheel', (event) => {
    if (event.target === brandFireGif || event.target === brandLogoImage) return;
    event.preventDefault();
    event.stopPropagation();
    const nextScale = Math.min(3, Math.max(0.35, brandElementState.banner.scale + (event.deltaY < 0 ? 0.05 : -0.05)));
    brandElementState.banner = {
      ...brandElementState.banner,
      scale: Number(nextScale.toFixed(2)),
    };
    applyBrandDragPosition();
    saveBrandDragPosition();
  }, { passive: false });

  brandBlock.addEventListener('dblclick', (event) => {
    if (event.target === brandFireGif || event.target === brandLogoImage) return;
    event.preventDefault();
    event.stopPropagation();
    resetBrandElement('banner');
  });
}

function setupBrandElementControl(element, key) {
  if (!element || !brandBannerOverlay) return;
  const minScale = key === 'fire' ? 0.2 : 0.35;
  const maxScale = key === 'fire' ? 5.5 : 3;
  const scaleStep = key === 'fire' ? 0.08 : 0.05;

  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    activeBrandElementDrag = {
      key,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: brandElementState[key].x,
      originY: brandElementState[key].y,
    };
    element.classList.add('is-dragging');
    element.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  element.addEventListener('pointermove', (event) => {
    if (!activeBrandElementDrag || activeBrandElementDrag.pointerId !== event.pointerId || activeBrandElementDrag.key !== key) return;
    brandElementState[key] = {
      ...brandElementState[key],
      x: activeBrandElementDrag.originX + (event.clientX - activeBrandElementDrag.startX),
      y: activeBrandElementDrag.originY + (event.clientY - activeBrandElementDrag.startY),
    };
    applyBrandDragPosition();
  });

  const finishElementDrag = (event) => {
    if (!activeBrandElementDrag || activeBrandElementDrag.pointerId !== event.pointerId || activeBrandElementDrag.key !== key) return;
    element.classList.remove('is-dragging');
    saveBrandDragPosition();
    activeBrandElementDrag = null;
  };

  element.addEventListener('pointerup', finishElementDrag);
  element.addEventListener('pointercancel', finishElementDrag);

  element.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const nextScale = Math.min(maxScale, Math.max(minScale, brandElementState[key].scale + (event.deltaY < 0 ? scaleStep : -scaleStep)));
    brandElementState[key] = {
      ...brandElementState[key],
      scale: Number(nextScale.toFixed(2)),
    };
    applyBrandDragPosition();
    saveBrandDragPosition();
  }, { passive: false });

  element.addEventListener('dblclick', (event) => {
    event.preventDefault();
    event.stopPropagation();
    resetBrandElement(key);
  });

  applyBrandDragPosition();
}

function setupBrandDrag() {
  if (!brandBannerOverlay) return;

  applyBrandDragPosition();
  setupBrandBannerControl();
  setupBrandElementControl(brandFireGif, 'fire');
  setupBrandElementControl(brandLogoImage, 'title');
}

function applySitePlaqueDecorLayout() {
  if (!sitePlaqueDecor) return;
  sitePlaqueDecor.style.setProperty('--site-plaque-x', `${sitePlaqueDecorState.x || 0}px`);
  sitePlaqueDecor.style.setProperty('--site-plaque-y', `${sitePlaqueDecorState.y || 0}px`);
  sitePlaqueDecor.style.setProperty('--site-plaque-scale', `${sitePlaqueDecorState.scale || 1}`);
}

function saveSitePlaqueDecorLayout() {
  try {
    localStorage.setItem('rollbria-site-plaque-layout', JSON.stringify(sitePlaqueDecorState));
  } catch (_) {}
}

function updateSitePlaqueScale(delta) {
  const currentScale = Number.isFinite(sitePlaqueDecorState.scale) ? sitePlaqueDecorState.scale : 1;
  sitePlaqueDecorState = {
    ...sitePlaqueDecorState,
    scale: Number(clamp(currentScale + delta, 0.08, 20).toFixed(3)),
  };
  applySitePlaqueDecorLayout();
  saveSitePlaqueDecorLayout();
}

function setupSitePlaqueDecorControl() {
  if (!sitePlaqueDecor) return;
  applySitePlaqueDecorLayout();

  sitePlaqueDecor.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    activeSitePlaqueDecorDrag = {
      pointerId: event.pointerId,
      mode: event.shiftKey ? 'scale' : 'move',
      startX: event.clientX,
      startY: event.clientY,
      originX: sitePlaqueDecorState.x || 0,
      originY: sitePlaqueDecorState.y || 0,
      originScale: Number.isFinite(sitePlaqueDecorState.scale) ? sitePlaqueDecorState.scale : 1,
    };
    sitePlaqueDecor.classList.add('is-dragging');
    sitePlaqueDecor.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  sitePlaqueDecor.addEventListener('pointermove', (event) => {
    if (!activeSitePlaqueDecorDrag || activeSitePlaqueDecorDrag.pointerId !== event.pointerId) return;
    if (activeSitePlaqueDecorDrag.mode === 'scale') {
      const delta = ((event.clientX - activeSitePlaqueDecorDrag.startX) - (event.clientY - activeSitePlaqueDecorDrag.startY)) * 0.01;
      sitePlaqueDecorState = {
        ...sitePlaqueDecorState,
        scale: Number(clamp(activeSitePlaqueDecorDrag.originScale + delta, 0.08, 20).toFixed(3)),
      };
      applySitePlaqueDecorLayout();
      return;
    }
    sitePlaqueDecorState = {
      ...sitePlaqueDecorState,
      x: activeSitePlaqueDecorDrag.originX + (event.clientX - activeSitePlaqueDecorDrag.startX),
      y: activeSitePlaqueDecorDrag.originY + (event.clientY - activeSitePlaqueDecorDrag.startY),
    };
    applySitePlaqueDecorLayout();
  });

  const finishSitePlaqueDecorDrag = (event) => {
    if (!activeSitePlaqueDecorDrag || activeSitePlaqueDecorDrag.pointerId !== event.pointerId) return;
    sitePlaqueDecor.classList.remove('is-dragging');
    saveSitePlaqueDecorLayout();
    activeSitePlaqueDecorDrag = null;
  };

  sitePlaqueDecor.addEventListener('pointerup', finishSitePlaqueDecorDrag);
  sitePlaqueDecor.addEventListener('pointercancel', finishSitePlaqueDecorDrag);
  sitePlaqueDecor.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    updateSitePlaqueScale(event.deltaY < 0 ? 0.02 : -0.02);
  }, { passive: false });
  sitePlaqueDecor.addEventListener('dblclick', (event) => {
    event.preventDefault();
    sitePlaqueDecorState = { x: 0, y: 0, scale: 1 };
    applySitePlaqueDecorLayout();
    saveSitePlaqueDecorLayout();
  });

  if (sitePlaqueDecreaseBtn) {
    sitePlaqueDecreaseBtn.addEventListener('click', (event) => {
      event.preventDefault();
      updateSitePlaqueScale(-0.02);
    });
  }

  if (sitePlaqueIncreaseBtn) {
    sitePlaqueIncreaseBtn.addEventListener('click', (event) => {
      event.preventDefault();
      updateSitePlaqueScale(0.02);
    });
  }
}

function applyWoodNormalDecorLayout() {
  if (!woodNormalDecor) return;
  woodNormalDecor.style.setProperty('--wood-normal-x', `${woodNormalDecorState.x || 0}px`);
  woodNormalDecor.style.setProperty('--wood-normal-y', `${woodNormalDecorState.y || 0}px`);
  woodNormalDecor.style.setProperty('--wood-normal-scale', `${woodNormalDecorState.scale || 1}`);
}

function saveWoodNormalDecorLayout() {
  try {
    localStorage.setItem('rollbria-wood-normal-layout', JSON.stringify(woodNormalDecorState));
  } catch (_) {}
}

function updateWoodNormalScale(delta) {
  const currentScale = Number.isFinite(woodNormalDecorState.scale) ? woodNormalDecorState.scale : 1;
  woodNormalDecorState = {
    ...woodNormalDecorState,
    scale: Number(clamp(currentScale + delta, 0.08, 20).toFixed(3)),
  };
  applyWoodNormalDecorLayout();
  saveWoodNormalDecorLayout();
}

function setupWoodNormalDecorControl() {
  if (!woodNormalDecor) return;
  applyWoodNormalDecorLayout();

  woodNormalDecor.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    activeWoodNormalDecorDrag = {
      pointerId: event.pointerId,
      mode: event.shiftKey ? 'scale' : 'move',
      startX: event.clientX,
      startY: event.clientY,
      originX: woodNormalDecorState.x || 0,
      originY: woodNormalDecorState.y || 0,
      originScale: Number.isFinite(woodNormalDecorState.scale) ? woodNormalDecorState.scale : 1,
    };
    woodNormalDecor.classList.add('is-dragging');
    woodNormalDecor.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  woodNormalDecor.addEventListener('pointermove', (event) => {
    if (!activeWoodNormalDecorDrag || activeWoodNormalDecorDrag.pointerId !== event.pointerId) return;
    if (activeWoodNormalDecorDrag.mode === 'scale') {
      const delta = ((event.clientX - activeWoodNormalDecorDrag.startX) - (event.clientY - activeWoodNormalDecorDrag.startY)) * 0.01;
      woodNormalDecorState = {
        ...woodNormalDecorState,
        scale: Number(clamp(activeWoodNormalDecorDrag.originScale + delta, 0.08, 20).toFixed(3)),
      };
      applyWoodNormalDecorLayout();
      return;
    }
    woodNormalDecorState = {
      ...woodNormalDecorState,
      x: activeWoodNormalDecorDrag.originX + (event.clientX - activeWoodNormalDecorDrag.startX),
      y: activeWoodNormalDecorDrag.originY + (event.clientY - activeWoodNormalDecorDrag.startY),
    };
    applyWoodNormalDecorLayout();
  });

  const finishWoodNormalDecorDrag = (event) => {
    if (!activeWoodNormalDecorDrag || activeWoodNormalDecorDrag.pointerId !== event.pointerId) return;
    woodNormalDecor.classList.remove('is-dragging');
    saveWoodNormalDecorLayout();
    activeWoodNormalDecorDrag = null;
  };

  woodNormalDecor.addEventListener('pointerup', finishWoodNormalDecorDrag);
  woodNormalDecor.addEventListener('pointercancel', finishWoodNormalDecorDrag);
  woodNormalDecor.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    updateWoodNormalScale(event.deltaY < 0 ? 0.08 : -0.08);
  }, { passive: false });
  woodNormalDecor.addEventListener('dblclick', (event) => {
    event.preventDefault();
    woodNormalDecorState = { x: 0, y: 0, scale: 1 };
    applyWoodNormalDecorLayout();
    saveWoodNormalDecorLayout();
  });

  if (woodNormalDecreaseBtn) {
    woodNormalDecreaseBtn.addEventListener('click', (event) => {
      event.preventDefault();
      updateWoodNormalScale(-0.12);
    });
  }

  if (woodNormalIncreaseBtn) {
    woodNormalIncreaseBtn.addEventListener('click', (event) => {
      event.preventDefault();
      updateWoodNormalScale(0.12);
    });
  }
}

function saveParticipantsBoardState() {
  try {
    localStorage.setItem(
      PARTICIPANTS_BOARD_LAYOUT_KEY,
      JSON.stringify({
        version: PARTICIPANTS_BOARD_LAYOUT_VERSION,
        layout: participantsBoardLayoutState,
        text: participantsBoardTextState,
      })
    );
  } catch (_) {
    // Ignore storage issues.
  }
}

function applyParticipantsBoardLayout() {
  participantsBoardMovableEls.forEach((element) => {
    const key = element.dataset.boardMove;
    const state = participantsBoardLayoutState[key] || { x: 0, y: 0, scale: 1 };
    element.style.setProperty('--board-offset-x', `${state.x}px`);
    element.style.setProperty('--board-offset-y', `${state.y}px`);
    element.style.setProperty('--board-scale', `${state.scale ?? 1}`);
  });
}

function getParticipantsBoardTextValue(element) {
  return element.dataset.boardTextType === 'placeholder'
    ? element.getAttribute('placeholder') || ''
    : element.textContent || '';
}

function applyParticipantsBoardText() {
  participantsBoardTextEls.forEach((element) => {
    const key = element.dataset.boardText;
    const nextValue = Object.prototype.hasOwnProperty.call(participantsBoardTextState, key)
      ? participantsBoardTextState[key]
      : element.dataset.defaultBoardText || '';

    if (element.dataset.boardTextType === 'placeholder') {
      element.setAttribute('placeholder', nextValue);
    } else {
      element.textContent = nextValue;
      element.classList.toggle('board-text-hidden', !nextValue.trim());
    }
  });
}

function resetParticipantsBoardState() {
  participantsBoardLayoutState = {};
  participantsBoardTextState = {};
  applyParticipantsBoardLayout();
  applyParticipantsBoardText();
  saveParticipantsBoardState();
}

function ensureParticipantsBoardElementVisible(key) {
  if (!participantsBoard) return;
  const element = participantsBoardMovableEls.find((item) => item.dataset.boardMove === key);
  if (!element) return;
  const boardRect = participantsBoard.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const outside =
    elementRect.right < boardRect.left + 12 ||
    elementRect.left > boardRect.right - 12 ||
    elementRect.bottom < boardRect.top + 12 ||
    elementRect.top > boardRect.bottom - 12;
  if (!outside) return;
  participantsBoardLayoutState[key] = { x: 0, y: 0, scale: 1 };
  applyParticipantsBoardLayout();
  saveParticipantsBoardState();
}

function setupParticipantsBoardEditor() {
  if (!participantsBoard) return;

  participantsBoardMovableEls.forEach((element) => {
    const key = element.dataset.boardMove;
    participantsBoardLayoutState[key] = participantsBoardLayoutState[key] || { x: 0, y: 0, scale: 1 };

    const focusTarget = element.querySelector('input, textarea');
    if (focusTarget) {
      focusTarget.addEventListener('pointerdown', (event) => {
        if (event.shiftKey && key === 'input-shell') return;
        event.stopPropagation();
      });
      focusTarget.addEventListener('click', (event) => {
        if (event.shiftKey && key === 'input-shell') return;
        event.stopPropagation();
        focusTarget.focus();
      });
    }

    const canDragBoardElement = key === 'input-shell';
    if (!canDragBoardElement) return;

    let activeBoardElementDrag = null;

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !event.shiftKey) return;
      activeBoardElementDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: participantsBoardLayoutState[key]?.x || 0,
        originY: participantsBoardLayoutState[key]?.y || 0,
      };
      element.classList.add('is-dragging');
      event.preventDefault();
      event.stopPropagation();
      element.setPointerCapture(event.pointerId);
    });

    element.addEventListener('pointermove', (event) => {
      if (!activeBoardElementDrag || activeBoardElementDrag.pointerId !== event.pointerId) return;
      participantsBoardLayoutState[key] = {
        ...participantsBoardLayoutState[key],
        x: activeBoardElementDrag.originX + (event.clientX - activeBoardElementDrag.startX),
        y: activeBoardElementDrag.originY + (event.clientY - activeBoardElementDrag.startY),
      };
      applyParticipantsBoardLayout();
    });

    const finishBoardElementDrag = (event) => {
      if (!activeBoardElementDrag || activeBoardElementDrag.pointerId !== event.pointerId) return;
      element.classList.remove('is-dragging');
      saveParticipantsBoardState();
      activeBoardElementDrag = null;
    };

    element.addEventListener('pointerup', finishBoardElementDrag);
    element.addEventListener('pointercancel', finishBoardElementDrag);
  });

  participantsBoardTextEls.forEach((element) => {
    element.dataset.defaultBoardText = getParticipantsBoardTextValue(element);
    element.addEventListener('dblclick', (event) => {
      if (!event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const textKey = element.dataset.boardText;
      const currentValue = getParticipantsBoardTextValue(element);
      const nextValue = window.prompt('Edit text. Leave empty to clear it.', currentValue);
      if (nextValue === null) return;
      participantsBoardTextState[textKey] = nextValue;
      applyParticipantsBoardText();
      saveParticipantsBoardState();
    });
  });

  applyParticipantsBoardLayout();
  applyParticipantsBoardText();
  ensureParticipantsBoardElementVisible('btn-add');
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

function getUiAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!uiAudioContext) {
    uiAudioContext = new AudioCtx();
  }
  return uiAudioContext;
}

function playQuickSwapClick() {
  const audioContext = getUiAudioContext();
  if (!audioContext) return;

  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(1140, now);
  oscillator.frequency.exponentialRampToValueAtTime(860, now + 0.045);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, now);
  filter.Q.setValueAtTime(0.9, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.07);
}

function extractNamesFromOcrText(text) {
  const seen = new Set();
  const names = [];
  const lines = String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    let candidate = line
      .replace(/^[#@]\s*/, '')
      .replace(/^\d+[\).\-\s]+/, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[|\\/~^`"вЂњвЂќвЂвЂ™<>[\]{}]+/g, '')
      .trim();

    if (!candidate) return;
    if (candidate.length < 2 || candidate.length > 40) return;
    if (!/[\p{L}]/u.test(candidate)) return;
    if (/^\d+$/.test(candidate)) return;
    if (/[!?=:;%]/.test(candidate)) return;

    candidate = candidate
      .replace(/^[^\p{L}0-9_]+/gu, '')
      .replace(/[^\p{L}0-9_.\-\s]+$/gu, '')
      .trim();

    if (!candidate) return;
    const lower = candidate.toLowerCase();
    if (OCR_IGNORE_TERMS.has(lower)) return;
    if (lower.includes('http') || lower.includes('www.')) return;

    const key = lower;
    if (seen.has(key)) return;
    seen.add(key);
    names.push(candidate);
  });

  return names;
}

function syncBattlePrototypeParticipants() {
  const nextSignature = participants.join('\n');

  try {
    localStorage.setItem(BATTLE_PARTICIPANTS_STORAGE_KEY, JSON.stringify(participants));
  } catch (_) {
    // Ignore storage issues and continue with direct sync.
  }

  if (!battlePrototypeFrame) return;
  if (lastBattleSyncSignature === nextSignature) return;

  try {
    const battleApi = battlePrototypeFrame.contentWindow?.rollbriaBattle;
    if (battleApi?.setParticipants) {
      battleApi.setParticipants([...participants]);
      lastBattleSyncSignature = nextSignature;
      return;
    }

    battlePrototypeFrame.contentWindow?.postMessage({
      source: 'rollbria-parent',
      type: 'participants-sync',
      names: [...participants],
    }, '*');
    lastBattleSyncSignature = nextSignature;
  } catch (_) {
    // Ignore iframe sync issues until the embedded arena is ready.
  }
}

function updateHeaderStats() {
  participantCount.textContent =
    `${participants.length} participant${participants.length !== 1 ? 's' : ''}`;
  historyCount.textContent =
    `${history.length} draw${history.length !== 1 ? 's' : ''}`;
  activeModeLabel.textContent = currentMode ? MODE_META[currentMode].label : 'Not selected';
  modeDescription.textContent = currentMode
    ? MODE_META[currentMode].description
    : 'Choose a raffle mode to see how this draw works and start the game.';
  mainIntro.classList.toggle('main-intro--idle', !currentMode);
}

function launchWinnerConfetti() {
  if (!winnerPopupConfetti) return;

  winnerPopupConfetti.innerHTML = '';
  const colors = ['#ff5f5f', '#ffd36b', '#ff8c42', '#ffe7a8', '#f05a7e'];
  const pieces = 28;

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('span');
    piece.className = 'winner-popup-confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.28}s`;
    piece.style.animationDuration = `${1.55 + Math.random() * 0.75}s`;
    piece.style.setProperty('--confetti-x', `${(Math.random() * 42) - 21}vw`);
    piece.style.setProperty('--confetti-rotate', `${320 + Math.round(Math.random() * 420)}deg`);
    piece.style.width = `${8 + Math.round(Math.random() * 5)}px`;
    piece.style.height = `${14 + Math.round(Math.random() * 10)}px`;
    winnerPopupConfetti.appendChild(piece);
  }

  setTimeout(() => {
    if (winnerPopupConfetti) winnerPopupConfetti.innerHTML = '';
  }, 2600);
}

function showWinnerPopup(winners) {
  winnerPopupKicker.textContent = 'CONGRATSBRIA!';
  winnerPopupBody.innerHTML = winners.map((name) => `<div>${escHtml(name)}</div>`).join('');
  launchWinnerConfetti();
  winnerPopup.hidden = false;
  playWinnerTheme();
}

function hideWinnerPopup() {
  winnerPopup.hidden = true;
  stopWinnerTheme();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mapSegment(t, fromT, toT, fromV, toV) {
  const local = (t - fromT) / (toT - fromT);
  return fromV + smoothStep(local) * (toV - fromV);
}

function getVelocityFactor(t) {
  if (t <= 0) return 1;
  if (t >= 1) return 0.0025;

  if (t < 0.6) {
    return 1;
  }

  if (t < 0.8) {
    return lerp(1, 0.88, easeOutCubic((t - 0.6) / 0.2));
  }

  if (t < 0.78) {
    return lerp(0.88, 0.26, easeOutQuart((t - 0.72) / 0.06));
  }

  const u = (t - 0.78) / 0.22;
  const drag = (u * 0.22) + (Math.log1p(9 * u) / Math.log(10)) * 0.78;
  return lerp(0.26, 0.0025, drag);
}

function buildLookupFromFactor(factorFn, steps = 2400) {
  const values = [{ t: 0, area: 0 }];
  let area = 0;
  let prevFactor = factorFn(0);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const factor = factorFn(t);
    area += ((prevFactor + factor) * 0.5) / steps;
    values.push({ t, area });
    prevFactor = factor;
  }

  return { values, totalArea: area };
}

function getProgressFromLookup(lookup, normalizedTime) {
  if (normalizedTime <= 0) return 0;
  if (normalizedTime >= 1) return 1;

  const values = lookup.values;
  const scaledIndex = normalizedTime * (values.length - 1);
  const baseIndex = Math.floor(scaledIndex);
  const fraction = scaledIndex - baseIndex;
  const base = values[baseIndex];
  const next = values[Math.min(baseIndex + 1, values.length - 1)];
  const area = lerp(base.area, next.area, fraction);
  return area / lookup.totalArea;
}

function getPhaseFactor(normalizedTime) {
  if (normalizedTime <= 0) return 1;
  if (normalizedTime >= 1) return 0.015;

  if (normalizedTime < 0.6) {
    return 1;
  }

  if (normalizedTime < 0.8) {
    return lerp(1, 0.82, easeOutCubic((normalizedTime - 0.6) / 0.2));
  }

  if (normalizedTime < 0.93) {
    return lerp(0.82, 0.26, easeOutQuart((normalizedTime - 0.8) / 0.13));
  }

  const tail = (normalizedTime - 0.93) / 0.07;
  const drag = (tail * 0.42) + (Math.log1p(9 * tail) / Math.log(10)) * 0.58;
  return lerp(0.26, 0.015, drag);
}

function buildTimerSchedule(totalDurationMs, factorFn = getPhaseFactor) {
  const totalSeconds = Math.max(1, Math.ceil(totalDurationMs / 1000));
  const schedule = [{ second: 0, factor: 1, cumulative: 0 }];
  let cumulative = 0;

  for (let second = 1; second <= totalSeconds; second++) {
    const midpoint = (second - 0.5) / totalSeconds;
    const factor = factorFn(midpoint);
    cumulative += factor;
    schedule.push({ second, factor, cumulative });
  }

  return { totalSeconds, totalArea: cumulative, steps: schedule };
}

function getWheelVelocityFactor(normalizedTime) {
  if (normalizedTime <= 0) return 1;
  if (normalizedTime >= 1) return 0.0000015;

  if (normalizedTime < 0.44) {
    return 1;
  }

  if (normalizedTime < 0.7) {
    return mapSegment(normalizedTime, 0.44, 0.7, 1, 0.74);
  }

  if (normalizedTime < 0.8) {
    return mapSegment(normalizedTime, 0.7, 0.8, 0.74, 0.48);
  }

  return mapSegment(normalizedTime, 0.8, 1, 0.48, 0.0000015);
}

function getStripVelocityFactor(normalizedTime) {
  if (normalizedTime <= 0) return 1;
  if (normalizedTime >= 1) return 0.012;

  if (normalizedTime < 0.48) {
    return 1;
  }

  if (normalizedTime < 0.76) {
    return mapSegment(normalizedTime, 0.48, 0.76, 1, 0.68);
  }

  if (normalizedTime < 0.92) {
    return mapSegment(normalizedTime, 0.76, 0.92, 0.68, 0.22);
  }

  return mapSegment(normalizedTime, 0.92, 1, 0.22, 0.012);
}

function updateWheelDebug(progress = 0, velocity = 0, remainingDeg = 0) {
  if (!wheelDebugProgress || !wheelDebugVelocity || !wheelDebugRemaining) return;
  wheelDebugProgress.textContent = `P ${Math.round(progress * 100)}%`;
  wheelDebugVelocity.textContent = `V ${Math.round(velocity)} deg/s`;
  wheelDebugRemaining.textContent = `R ${Math.max(0, Math.round(remainingDeg))} deg`;
}

function getProgressFromSchedule(schedule, elapsedTime, totalDuration) {
  if (elapsedTime <= 0) return 0;
  if (elapsedTime >= totalDuration) return 1;

  const secondFloat = elapsedTime / 1000;
  const wholeSeconds = Math.floor(secondFloat);
  const fraction = secondFloat - wholeSeconds;
  const safeIndex = Math.min(wholeSeconds, schedule.steps.length - 1);
  const base = schedule.steps[safeIndex];
  const next = schedule.steps[Math.min(safeIndex + 1, schedule.steps.length - 1)];
  const interpolated = base.cumulative + (next.factor * fraction);
  return interpolated / schedule.totalArea;
}

function getAngularVelocity(elapsedTime, totalDuration) {
  if (activeSpinPlan?.lookup && activeSpinPlan?.factorFn) {
    const t = getNormalizedProgress(elapsedTime, totalDuration);
    return activeSpinPlan.peakVelocity * activeSpinPlan.factorFn(t);
  }

  const peakVelocity = activeSpinPlan?.peakVelocity ?? DEFAULT_PEAK_VELOCITY;
  const schedule = activeSpinPlan?.schedule ?? buildTimerSchedule(totalDuration);
  const secondFloat = Math.min(elapsedTime / 1000, schedule.totalSeconds);
  const wholeSeconds = Math.floor(secondFloat);
  const fraction = secondFloat - wholeSeconds;
  const base = schedule.steps[Math.min(wholeSeconds, schedule.steps.length - 1)];
  const next = schedule.steps[Math.min(wholeSeconds + 1, schedule.steps.length - 1)];
  const factor = lerp(base.factor, next.factor, fraction);
  return peakVelocity * factor;
}

function getTimerDrivenProgress(elapsedTime, totalDuration) {
  return getProgressFromSchedule(buildTimerSchedule(totalDuration), elapsedTime, totalDuration);
}

function getUnifiedMotionProgress(t) {
  return t;
}

function getNormalizedProgress(elapsed, duration) {
  if (duration <= 0) return 1;
  return Math.min(Math.max(elapsed / duration, 0), 1);
}

function getQuickSwapDelay(progress) {
  return 26 + getUnifiedMotionProgress(progress) * 420;
}

function getSuspenseRevealFractions(count) {
  if (count <= 1) return [1];
  const fractions = [];
  for (let i = 1; i <= count; i++) {
    fractions.push(getUnifiedMotionProgress(i / count));
  }
  fractions[fractions.length - 1] = 1;
  return fractions;
}

function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function renderModeTimer(mode, seconds = modeDurations[mode]) {
  const el = modeTimerEls[mode];
  if (!el) return;
  el.hidden = !modeTimerVisible[mode];
  if (!modeTimerVisible[mode]) return;
  el.textContent = formatClock(seconds);
}

function syncTimerToggle(mode) {
  const btn = timerToggleEls[mode];
  if (!btn) return;
  btn.textContent = modeTimerVisible[mode] ? 'Hide timer' : 'Show timer';
  renderModeTimer(mode);
}

function stopModeTimer(mode) {
  if (activeTimerFrames[mode]) {
    cancelAnimationFrame(activeTimerFrames[mode]);
    activeTimerFrames[mode] = null;
  }
  renderModeTimer(mode, modeDurations[mode]);
}

function startModeTimer(mode, durationMs) {
  stopModeTimer(mode);
  const start = performance.now();

  function frame(now) {
    const remainingMs = Math.max(0, durationMs - (now - start));
    renderModeTimer(mode, remainingMs / 1000);
    if (remainingMs > 0) {
      activeTimerFrames[mode] = requestAnimationFrame(frame);
      return;
    }
    activeTimerFrames[mode] = null;
  }

  activeTimerFrames[mode] = requestAnimationFrame(frame);
}

function normalizeAngleRad(angle) {
  return ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

function buildWheelSpinPlan(startAngleRad, winnerIdx, count, totalDurationMs) {
  const durationSec = totalDurationMs / 1000;
  const sliceDeg = 360 / count;
  const pointerDeg = 180;
  const winnerCenterDeg = winnerIdx * sliceDeg + sliceDeg / 2;
  const startDeg = normalizeAngleRad(startAngleRad) * 180 / Math.PI;
  const landingOffsetDeg = ((pointerDeg - winnerCenterDeg - startDeg) % 360 + 360) % 360;
  const factorFn = getWheelVelocityFactor;
  const lookupSteps = Math.max(2400, Math.round(durationSec * 360));
  const lookup = buildLookupFromFactor(factorFn, lookupSteps);
  const suggestedRotations = Math.max(12, Math.round(durationSec * WHEEL_BASE_ROTATIONS_PER_SECOND));
  const totalRotationDeg = suggestedRotations * 360 + landingOffsetDeg;
  const peakVelocity = totalRotationDeg / Math.max(lookup.totalArea, 0.001);

  return {
    mode: 'wheel',
    factorFn,
    lookup,
    peakVelocity,
    winnerIdx,
    sliceDeg,
    landingOffsetDeg,
    totalRotationDeg,
    targetAngleRad: normalizeAngleRad(startAngleRad + (totalRotationDeg * Math.PI / 180)),
  };
}

function addParticipant(name, options = {}) {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean) return { added: false, reason: 'empty' };
  if (hasParticipant(clean)) return { added: false, reason: 'duplicate' };
  participants.unshift(clean);
  if (!options.silent) {
    renderParticipants();
    save();
  }
  return { added: true, value: clean };
}

function parseParticipantBatch(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function addParticipantsBatch(text) {
  const entries = parseParticipantBatch(text);
  let added = 0;
  let duplicates = 0;

  entries.forEach((entry) => {
    const result = addParticipant(entry, { silent: true });
    if (result.added) added++;
    else if (result.reason === 'duplicate') duplicates++;
  });

  return { entries, added, duplicates };
}

function removeParticipant(idx) {
  participants.splice(idx, 1);
  renderParticipants();
  save();
  setParticipantStatus('Participant removed.', 'warn');
}

function renderParticipants() {
  updateHeaderStats();
  if (!participants.length) {
    participantList.innerHTML = '<li class="list-empty">No participants yet</li>';
    if (wheelTabActive && !isSpinning) drawWheel();
    syncBattlePrototypeParticipants();
    return;
  }

  participantList.innerHTML = participants.map((name, i) => `
    <li class="participant-item" data-idx="${i}">
      <span class="idx">${i + 1}</span>
      <span class="name">${escHtml(name)}</span>
      <button class="btn-remove" data-idx="${i}" aria-label="Remove ${escHtml(name)}">x</button>
    </li>
  `).join('');

  participantList.querySelectorAll('.btn-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeParticipant(Number(btn.dataset.idx));
    });
  });

  if (wheelTabActive && !isSpinning) drawWheel();
  syncBattlePrototypeParticipants();
}

function importParticipants(text) {
  const { entries, added, duplicates } = addParticipantsBatch(text);

  if (!entries.length) {
    setParticipantStatus('Nothing to import yet.', 'warn');
    return;
  }

  renderParticipants();
  save();

  if (added && duplicates) {
    setParticipantStatus(`Imported ${added} names. Skipped ${duplicates} duplicate${duplicates !== 1 ? 's' : ''}.`, 'success');
  } else if (added) {
    setParticipantStatus(`Imported ${added} participant${added !== 1 ? 's' : ''}.`, 'success');
  } else {
    setParticipantStatus('All imported names were already in the pool.', 'warn');
  }
}

function dedupeParticipants() {
  const seen = new Set();
  const next = [];

  participants.forEach((name) => {
    const key = normalizedName(name);
    if (seen.has(key)) return;
    seen.add(key);
    next.push(name);
  });

  const removed = participants.length - next.length;
  participants = next;
  renderParticipants();
  save();

  if (removed) {
    setParticipantStatus(`Removed ${removed} duplicate entr${removed === 1 ? 'y' : 'ies'}.`, 'success');
  } else {
    setParticipantStatus('No duplicates found.', 'warn');
  }
}

btnAdd.addEventListener('click', () => {
  const { entries, added, duplicates } = addParticipantsBatch(inputName.value);

  if (!entries.length) {
    setParticipantStatus('Enter a name first.', 'warn');
  } else if (added) {
    renderParticipants();
    save();
    if (added === 1 && entries.length === 1) {
      setParticipantStatus(`Added ${entries[0]}.`, 'success');
    } else if (duplicates) {
      setParticipantStatus(`Added ${added} users. Skipped ${duplicates} duplicate${duplicates !== 1 ? 's' : ''}.`, 'success');
    } else {
      setParticipantStatus(`Added ${added} users.`, 'success');
    }
    inputName.value = '';
  } else {
    setParticipantStatus('All entered users already exist.', 'warn');
  }
  inputName.focus();
});

inputName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    btnAdd.click();
  }
});

btnImport.addEventListener('click', () => {
  importParticipants(inputBulk.value);
  inputBulk.value = '';
});

inputBulk.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') btnImport.click();
});

btnDedupe.addEventListener('click', dedupeParticipants);

btnClearAll.addEventListener('click', () => {
  if (!participants.length) return;
  if (confirm('Clear all participants?')) {
    participants = [];
    multiResults.innerHTML = '';
    quickWinnerName.textContent = '-';
    rouletteResult.textContent = '';
    wheelResult.textContent = '';
    renderParticipants();
    save();
    setParticipantStatus('Participant pool cleared.', 'warn');
  }
});

btnShuffle.addEventListener('click', () => {
  if (participants.length < 2) return;
  for (let i = participants.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }
  renderParticipants();
  save();
  setParticipantStatus('Participant order shuffled.', 'success');
});

function startIdleAnim() {
  if (idleAnimId) return;
  function loop() {
    if (!isSpinning) drawWheel(wheelAngle);
    idleAnimId = wheelTabActive ? requestAnimationFrame(loop) : null;
  }
  idleAnimId = requestAnimationFrame(loop);
}

function stopIdleAnim() {
  wheelTabActive = false;
  if (idleAnimId) {
    cancelAnimationFrame(idleAnimId);
    idleAnimId = null;
  }
}

function resizeWheelCanvas(expanded) {
  const size = expanded ? FOCUS_WHEEL_SIZE : DEFAULT_WHEEL_SIZE;
  wheelCanvas.width = size.width;
  wheelCanvas.height = size.height;
}

function setWheelFocus(expanded) {
  document.body.classList.toggle('wheel-focus', expanded);
  resizeWheelCanvas(expanded);
  drawWheel(wheelAngle);
}

function setBattleFocus(expanded) {
  document.body.classList.toggle('battle-focus', expanded);
}

if (battlePrototypeFrame) {
  battlePrototypeFrame.addEventListener('load', () => {
    lastBattleSyncSignature = null;
    syncBattlePrototypeParticipants();
  });
}

window.addEventListener('message', (event) => {
  if (event.data?.source !== 'battle-prototype') return;

  if (event.data.type === 'battle-ready') {
    lastBattleSyncSignature = null;
    syncBattlePrototypeParticipants();
    return;
  }

  if (event.data.type === 'battle-start') {
    setBattleFocus(true);
    return;
  }

  if (event.data.type === 'battle-finish') {
    return;
  }

  if (event.data.type === 'battle-exit') {
    setBattleFocus(false);
  }
});

document.querySelectorAll('.mode-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    currentMode = tab.dataset.mode;
    document.querySelectorAll('.mode-tab').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('.mode-panel').forEach((panel) => panel.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`mode-${currentMode}`).classList.add('active');
    updateHeaderStats();
    if (currentMode === 'wheel') {
      wheelTabActive = true;
      startIdleAnim();
    } else {
      stopIdleAnim();
      setWheelFocus(false);
    }
    if (currentMode === 'battle') {
      syncBattlePrototypeParticipants();
    } else {
      setBattleFocus(false);
    }
  });
});

function requireParticipants() {
  hideWinnerPopup();
  if (participants.length) return true;
  alert('Add participants first.');
  return false;
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function assignBattleCharacters(names) {
  const pool = shuffleArray(BATTLE_CHARACTERS);
  return names.map((name, index) => ({
    name,
    character: pool[index % pool.length],
  }));
}

function buildBattlePositions(count) {
  const positions = [];
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))));
  const rows = Math.max(1, Math.ceil(count / cols));

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 12 + (col * (76 / Math.max(cols - 1, 1)));
    const y = 16 + (row * (58 / Math.max(rows - 1, 1)));
    positions.push({
      x,
      y,
      delay: ((i % cols) * 80) + (row * 60),
    });
  }

  return shuffleArray(positions);
}

function renderBattlefield(fighters) {
  if (!battlefield) return;
  if (!fighters.length) {
    battlefield.innerHTML = '<div class="battlefield-empty">Load participants to launch Battlebria.</div>';
    return;
  }

  battlefield.innerHTML = fighters.map((fighter, index) => {
    const style = `left:${fighter.x}%;top:${fighter.y}%;--fighter-tint:${fighter.character.tint};animation-delay:${fighter.delay}ms;`;
    const classes = [
      'battle-fighter',
      fighter.state === 'targeted' ? 'is-targeted' : '',
      fighter.state === 'eliminated' ? 'is-eliminated' : '',
      fighter.state === 'winner' ? 'is-winner' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${classes}" style="${style}" data-battle-index="${index}">
        <div class="battle-fighter-sprite">${fighter.character.avatar}</div>
        <div class="battle-fighter-weapon">${fighter.character.weapon}</div>
        <div class="battle-fighter-name">${escHtml(fighter.name)}</div>
        <div class="battle-fighter-role">${escHtml(fighter.character.role)}</div>
      </div>
    `;
  }).join('');
}

btnQuickDraw.addEventListener('click', () => {
  if (!requireParticipants()) return;
  if (isSpinning) return;
  isSpinning = true;
  btnQuickDraw.disabled = true;
  const duration = modeDurations.quick * 1000;
  const winner = pickRandomItem(participants);
  const displayPool = [...participants];
  const start = performance.now();
  let lastSwap = 0;
  let lastDisplayedName = '';
  let winnerRevealed = false;
  startModeTimer('quick', duration);
  const quickSchedule = buildTimerSchedule(duration);

  function tick(now) {
    const elapsed = now - start;
    const progress = getNormalizedProgress(elapsed, duration);
    const timedProgress = getProgressFromSchedule(quickSchedule, elapsed, duration);
    const swapDelay = getQuickSwapDelay(timedProgress);

    if (now - lastSwap > swapDelay) {
      let nextName = pickRandomItem(displayPool);
      if (displayPool.length > 1 && nextName === lastDisplayedName) {
        const alternatives = displayPool.filter((name) => name !== lastDisplayedName);
        nextName = pickRandomItem(alternatives);
      }
      quickWinnerName.textContent = nextName;
      lastDisplayedName = nextName;
      playQuickSwapClick();
      lastSwap = now;
    }
    quickWinner.classList.remove('win');

    if (elapsed < duration) {
      requestAnimationFrame(tick);
      return;
    }

    quickWinnerName.textContent = winner;
    if (!winnerRevealed) {
      winnerRevealed = true;
      setTimeout(() => {
        quickWinner.classList.remove('quick-winner--dramatic');
        void quickWinner.offsetWidth;
        quickWinner.classList.add('quick-winner--dramatic');
        quickWinner.classList.add('win');
        highlightParticipant(winner);
        addHistory('Quickbria', [winner]);
        setTimeout(() => {
          showWinnerPopup([winner]);
          isSpinning = false;
          btnQuickDraw.disabled = false;
          stopModeTimer('quick');
        }, 1300);
      }, 900);
      return;
    }
  }

  requestAnimationFrame(tick);
});

btnSpin.addEventListener('click', () => {
  if (isSpinning) return;
  if (!requireParticipants()) return;

  isSpinning = true;
  rouletteResult.textContent = '';
  btnSpin.disabled = true;
  const rouletteDuration = modeDurations.roulette * 1000;
  const rouletteSeconds = rouletteDuration / 1000;
  startModeTimer('roulette', rouletteDuration);

  const repeated = [];
  const targetStripItems = Math.max(60, Math.round(STRIP_ITEMS_PER_SECOND * rouletteSeconds));
  while (repeated.length < targetStripItems + participants.length + 12) {
    repeated.push(...secureShuffle(participants));
  }

  rouletteTrack.innerHTML = repeated.map((name, i) =>
    `<div class="roulette-item" data-idx="${i}">${escHtml(name)}</div>`
  ).join('');

  rouletteTrack.style.transition = 'none';
  rouletteTrack.style.transform = 'translateX(0)';

  const winnerIdx = targetStripItems + getCryptoRandomInt(Math.max(participants.length, 1));
  const items = rouletteTrack.querySelectorAll('.roulette-item');
  const wrapRect = rouletteTrack.parentElement.getBoundingClientRect();
  const winnerItem = items[winnerIdx];
  const itemCenter = winnerItem.offsetLeft + winnerItem.offsetWidth / 2;
  const targetX = wrapRect.width / 2 - itemCenter;
  const startTime = performance.now();
  const stripLookup = buildLookupFromFactor(getStripVelocityFactor, Math.max(1600, Math.round(rouletteSeconds * 240)));
  let lastStripClickStep = 0;

  function finishStrip() {
    items.forEach((item) => item.classList.remove('selected'));
    items[winnerIdx].classList.add('selected');
    const winner = repeated[winnerIdx];
    rouletteResult.textContent = `Winner: ${winner}`;
    rouletteResult.classList.remove('wheel-result--dramatic');
    void rouletteResult.offsetWidth;
    rouletteResult.classList.add('wheel-result--dramatic');
    highlightParticipant(winner);
    addHistory('Stripbria', [winner]);
    setTimeout(() => {
      showWinnerPopup([winner]);
      isSpinning = false;
      btnSpin.disabled = false;
      stopModeTimer('roulette');
    }, 1400);
  }

  function animateStrip(now) {
    const elapsed = now - startTime;
    const progress = getNormalizedProgress(elapsed, rouletteDuration);
    const currentX = targetX * getProgressFromLookup(stripLookup, progress);
    rouletteTrack.style.transform = `translateX(${currentX}px)`;

    const stripClickStep = Math.floor(Math.abs(currentX) / 36);
    if (stripClickStep > lastStripClickStep) {
      playQuickSwapClick();
      lastStripClickStep = stripClickStep;
    }

    if (progress < 1) {
      requestAnimationFrame(animateStrip);
      return;
    }

    rouletteTrack.style.transform = `translateX(${targetX}px)`;
    finishStrip();
  }

  requestAnimationFrame(animateStrip);
});

function drawWheel(angle = wheelAngle) {
  const W = wheelCanvas.width;
  const H = wheelCanvas.height;
  const R = Math.min(W, H) / 2 - 4;
  const cx = W / 2;
  const cy = H / 2;

  wheelCtx.clearRect(0, 0, W, H);

  wheelCtx.save();
  wheelCtx.beginPath();
  wheelCtx.arc(cx, cy, R, 0, Math.PI * 2);
  wheelCtx.clip();

  if (!participants.length) {
    wheelCtx.fillStyle = '#4b311d';
    wheelCtx.fillRect(cx - R, cy - R, R * 2, R * 2);
    wheelCtx.restore();
    wheelCtx.fillStyle = '#dbc18e';
    wheelCtx.font = 'bold 14px system-ui';
    wheelCtx.textAlign = 'center';
    wheelCtx.textBaseline = 'middle';
    wheelCtx.fillText('Add participants', cx, cy);
  } else {
    const count = participants.length;
    const slice = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const start = angle + i * slice;
      const end = start + slice;
      wheelCtx.beginPath();
      wheelCtx.moveTo(cx, cy);
      wheelCtx.arc(cx, cy, R, start, end);
      wheelCtx.closePath();
      wheelCtx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      wheelCtx.fill();
      wheelCtx.strokeStyle = '#2a170b';
      wheelCtx.lineWidth = 2;
      wheelCtx.stroke();

      const segmentShade = wheelCtx.createRadialGradient(cx - 20, cy - 20, 20, cx, cy, R);
      segmentShade.addColorStop(0, 'rgba(255, 231, 173, 0.10)');
      segmentShade.addColorStop(1, 'rgba(46, 25, 12, 0.22)');
      wheelCtx.fillStyle = segmentShade;
      wheelCtx.fill();

      wheelCtx.save();
      wheelCtx.translate(cx, cy);
      wheelCtx.rotate(start + slice / 2);
      wheelCtx.textAlign = 'right';
      wheelCtx.textBaseline = 'middle';
      wheelCtx.fillStyle = '#f3dfb2';
      wheelCtx.strokeStyle = 'rgba(48, 24, 10, 0.8)';
      wheelCtx.lineWidth = 3;
      wheelCtx.font = `bold ${Math.max(18, Math.min(34, 420 / count))}px Georgia`;
      const maxLen = Math.max(8, Math.floor(R * 0.55 / 7));
      let label = participants[i];
      if (label.length > maxLen) label = `${label.slice(0, maxLen - 1)}...`;
      wheelCtx.strokeText(label, R - 10, 0);
      wheelCtx.fillText(label, R - 10, 0);
      wheelCtx.restore();
    }
    wheelCtx.restore();
  }

  wheelCtx.beginPath();
  wheelCtx.arc(cx, cy, R, 0, Math.PI * 2);
  const rim = wheelCtx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rim.addColorStop(0, '#f0ddb0');
  rim.addColorStop(0.35, '#d2a255');
  rim.addColorStop(0.7, '#8d5b2d');
  rim.addColorStop(1, '#f3e2bb');
  wheelCtx.strokeStyle = rim;
  wheelCtx.lineWidth = 9;
  wheelCtx.stroke();

  wheelCtx.beginPath();
  wheelCtx.arc(cx, cy, R - 8, 0, Math.PI * 2);
  wheelCtx.strokeStyle = 'rgba(53, 28, 11, 0.65)';
  wheelCtx.lineWidth = 3;
  wheelCtx.stroke();

  wheelCtx.beginPath();
  wheelCtx.arc(cx, cy, 18, 0, Math.PI * 2);
  wheelCtx.fillStyle = '#462a15';
  wheelCtx.fill();
  wheelCtx.strokeStyle = '#ddb76c';
  wheelCtx.lineWidth = 4;
  wheelCtx.stroke();

  if (!document.body.classList.contains('wheel-focus')) {
    const pointerLength = Math.max(40, Math.round(R * 0.145));
    const pointerInset = Math.max(16, Math.round(R * 0.03));
    const pointerHalfHeight = Math.max(22, Math.round(R * 0.07));
    const pointerCurveOffset = Math.max(14, Math.round(R * 0.042));
    const pointerHubRadius = Math.max(10, Math.round(R * 0.03));
    const pointerCoreRadius = Math.max(4, Math.round(R * 0.012));
    const pointerStrokeWidth = Math.max(4, Math.round(R * 0.01));
    const pointerBaseX = cx - R - pointerInset;
    const pointerTipX = cx - R + pointerLength;
    const pointerGradient = wheelCtx.createLinearGradient(pointerBaseX - pointerHubRadius, cy, pointerTipX, cy);
    pointerGradient.addColorStop(0, '#5f1714');
    pointerGradient.addColorStop(0.3, '#9e241f');
    pointerGradient.addColorStop(0.62, '#efc66c');
    pointerGradient.addColorStop(1, '#fff1bf');

    wheelCtx.save();
    wheelCtx.shadowColor = 'rgba(82, 16, 12, 0.42)';
    wheelCtx.shadowBlur = Math.max(16, Math.round(R * 0.05));
    wheelCtx.shadowOffsetX = -2;
    wheelCtx.shadowOffsetY = 4;

    wheelCtx.fillStyle = pointerGradient;
    wheelCtx.beginPath();
    wheelCtx.moveTo(pointerBaseX, cy - pointerHalfHeight);
    wheelCtx.quadraticCurveTo(pointerBaseX + pointerCurveOffset, cy - 6, pointerBaseX, cy);
    wheelCtx.quadraticCurveTo(pointerBaseX + pointerCurveOffset, cy + 6, pointerBaseX, cy + pointerHalfHeight);
    wheelCtx.lineTo(pointerTipX, cy);
    wheelCtx.closePath();
    wheelCtx.fill();

    wheelCtx.strokeStyle = '#551611';
    wheelCtx.lineWidth = pointerStrokeWidth;
    wheelCtx.stroke();

    wheelCtx.beginPath();
    wheelCtx.arc(pointerBaseX - pointerHubRadius, cy, pointerHubRadius, 0, Math.PI * 2);
    wheelCtx.fillStyle = '#5c1713';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#f0c76e';
    wheelCtx.lineWidth = Math.max(3, Math.round(R * 0.008));
    wheelCtx.stroke();

    wheelCtx.beginPath();
    wheelCtx.arc(pointerBaseX - pointerHubRadius, cy, pointerCoreRadius, 0, Math.PI * 2);
    wheelCtx.fillStyle = '#ffd7a6';
    wheelCtx.fill();
    wheelCtx.restore();
  }
}

document.querySelectorAll('.duration-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.modeDuration;
    document.querySelectorAll(`.duration-btn[data-mode-duration="${mode}"]`).forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');
    modeDurations[mode] = Number(btn.dataset.duration);
    renderModeTimer(mode);
    save();
  });
});

document.querySelectorAll('[data-timer-toggle]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.timerToggle;
    modeTimerVisible[mode] = !modeTimerVisible[mode];
    syncTimerToggle(mode);
    save();
  });
});

btnWheelSpin.addEventListener('click', () => {
  if (isSpinning) return;
  if (!requireParticipants()) return;

    isSpinning = true;
    setWheelFocus(true);
    btnWheelSpin.disabled = true;
    wheelResult.textContent = '';

  const duration = modeDurations.wheel * 1000;
  startModeTimer('wheel', duration);
  const count = participants.length;
  const slice = (Math.PI * 2) / count;
  const winnerIdx = getCryptoRandomInt(count);
  const startAngle = wheelAngle;
  activeSpinPlan = buildWheelSpinPlan(startAngle, winnerIdx, count, duration);
  updateWheelDebug(0, activeSpinPlan.peakVelocity, activeSpinPlan.totalRotationDeg);
  const startTime = performance.now();
  const wheelClickStepSize = Math.max(0.16, slice * 0.24);
  let lastWheelClickStep = -1;

  function frame(now) {
    const elapsed = now - startTime;
    const progress = getNormalizedProgress(elapsed, duration);
    const motionProgress = getProgressFromLookup(activeSpinPlan.lookup, progress);
      const rotationDeg = activeSpinPlan.totalRotationDeg * motionProgress;
    const currentVelocity = getAngularVelocity(elapsed, duration);
    const remainingDeg = Math.max(0, activeSpinPlan.totalRotationDeg - rotationDeg);
    const current = normalizeAngleRad(startAngle + (rotationDeg * Math.PI / 180));

    const wheelClickStep = Math.floor(rotationDeg * Math.PI / 180 / wheelClickStepSize);
    if (wheelClickStep > lastWheelClickStep) {
      playQuickSwapClick();
      lastWheelClickStep = wheelClickStep;
    }

    drawWheel(current);
    updateWheelDebug(progress, currentVelocity, remainingDeg);

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    wheelAngle = activeSpinPlan.targetAngleRad;
    drawWheel(wheelAngle);
    updateWheelDebug(1, 0, 0);

    const winner = participants[activeSpinPlan.winnerIdx];

    wheelResult.textContent = `Winner: ${winner}`;
    wheelResult.classList.remove('wheel-result--dramatic');
    void wheelResult.offsetWidth;
    wheelResult.classList.add('wheel-result--dramatic');
    highlightParticipant(winner);
    addHistory('Wheelbria', [winner]);

    setTimeout(() => {
      showWinnerPopup([winner]);
      isSpinning = false;
      btnWheelSpin.disabled = false;
      stopModeTimer('wheel');
      activeSpinPlan = null;
      setWheelFocus(false);
    }, 2200);
  }

  requestAnimationFrame(frame);
});

btnWinnersPlus.addEventListener('click', () => {
  winnersCount = Math.min(winnersCount + 1, participants.length || 1);
  winnersCountEl.textContent = winnersCount;
  save();
});

btnWinnersMinus.addEventListener('click', () => {
  winnersCount = Math.max(winnersCount - 1, 1);
  winnersCountEl.textContent = winnersCount;
  save();
});

btnMultiDraw.addEventListener('click', () => {
  if (!requireParticipants()) return;
  if (isSpinning) return;
  isSpinning = true;
  const count = Math.min(winnersCount, participants.length);
  const winners = secureShuffle(participants).slice(0, count);
  const totalDuration = modeDurations.multi * 1000;
  startModeTimer('multi', totalDuration);
  const revealFractions = getSuspenseRevealFractions(winners.length);
  multiResults.innerHTML = '';

  winners.forEach((name, i) => {
    setTimeout(() => {
      multiResults.insertAdjacentHTML('beforeend', `
        <div class="multi-winner-item">
          <div class="rank">${i + 1}</div>
          <div class="winner-name">${escHtml(name)}</div>
        </div>
      `);
      highlightParticipant(name);
        if (i === winners.length - 1) {
          addHistory('Multibria', winners);
          showWinnerPopup(winners);
          isSpinning = false;
          stopModeTimer('multi');
        }
    }, Math.floor(totalDuration * revealFractions[i]));
  });
});

if (btnBattleStart && battlefield && battleResult) {
  btnBattleStart.addEventListener('click', () => {
    if (!requireParticipants()) return;
    if (isSpinning) return;

    isSpinning = true;
    btnBattleStart.disabled = true;
    battleResult.textContent = '';

    const duration = modeDurations.battle * 1000;
    startModeTimer('battle', duration);

    const assigned = assignBattleCharacters(participants);
    const positions = buildBattlePositions(assigned.length);
    const fighters = assigned.map((entry, index) => ({
      ...entry,
      ...positions[index],
      state: 'alive',
    }));

    renderBattlefield(fighters);

    const eliminationOrder = shuffleArray(fighters.map((_, index) => index));
    const winnerIndex = eliminationOrder[eliminationOrder.length - 1];
    const eliminationFractions = getSuspenseRevealFractions(Math.max(1, fighters.length - 1));

    eliminationOrder.slice(0, -1).forEach((fighterIndex, step) => {
      const targetDelay = Math.floor(duration * eliminationFractions[step]);
      setTimeout(() => {
        fighters[fighterIndex].state = 'targeted';
        battleResult.textContent = `${fighters[fighterIndex].name} is on the brink...`;
        renderBattlefield(fighters);

        setTimeout(() => {
          fighters[fighterIndex].state = 'eliminated';
          battleResult.textContent = `${fighters[fighterIndex].name} has fallen.`;
          renderBattlefield(fighters);
        }, 450);
      }, targetDelay);
    });

    setTimeout(() => {
      const winner = fighters[winnerIndex];
      winner.state = 'winner';
      battleResult.textContent = `Winner: ${winner.name}`;
      renderBattlefield(fighters);
      highlightParticipant(winner.name);
      addHistory('Battlebria', [winner.name]);

      setTimeout(() => {
        showWinnerPopup([winner.name]);
        isSpinning = false;
        btnBattleStart.disabled = false;
        stopModeTimer('battle');
      }, 1800);
    }, duration);
  });
}

function addHistory(mode, names) {
  history.unshift({
    mode,
    names,
    time: new Date().toLocaleTimeString(),
  });
  if (history.length > 50) history.pop();
  renderHistory();
  save();
}

function renderHistory() {
  updateHeaderStats();
  if (!history.length) {
    historyList.innerHTML = '<li class="list-empty">No draws yet</li>';
    return;
  }

  historyList.innerHTML = history.map((entry) => `
    <li class="history-item">
      <div class="h-mode">${entry.mode}</div>
      <div class="h-names">${entry.names.map(escHtml).join(', ')}</div>
      <div class="h-time">${entry.time}</div>
    </li>
  `).join('');
}

btnClearHistory.addEventListener('click', () => {
  history = [];
  renderHistory();
  save();
});

function highlightParticipant(name) {
  document.querySelectorAll('.participant-item').forEach((el) => {
    el.classList.remove('highlight');
    if (el.querySelector('.name')?.textContent === name) {
      el.classList.add('highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function save() {
  localStorage.setItem('raffle_participants', JSON.stringify(participants));
  localStorage.setItem('raffle_history', JSON.stringify(history));
  localStorage.setItem('raffle_winners_count', String(winnersCount));
  localStorage.setItem('raffle_mode_durations', JSON.stringify(modeDurations));
  localStorage.setItem('raffle_mode_timer_visible', JSON.stringify(modeTimerVisible));
}

function load() {
  try {
    const storedParticipants = localStorage.getItem('raffle_participants');
    const storedHistory = localStorage.getItem('raffle_history');
    const storedWinnersCount = localStorage.getItem('raffle_winners_count');
    const storedDurations = localStorage.getItem('raffle_mode_durations');
    const storedTimerVisible = localStorage.getItem('raffle_mode_timer_visible');
    const storedBrandDrag = localStorage.getItem(BRAND_DRAG_STORAGE_KEY);
    const storedParticipantsBoardState = localStorage.getItem(PARTICIPANTS_BOARD_LAYOUT_KEY);

    if (storedParticipants) participants = JSON.parse(storedParticipants);
    if (storedHistory) history = JSON.parse(storedHistory);
    if (storedWinnersCount) winnersCount = Number(storedWinnersCount);
    if (storedDurations) {
      modeDurations = { ...modeDurations, ...JSON.parse(storedDurations) };
      document.querySelectorAll('.duration-btn').forEach((btn) => {
        btn.classList.toggle(
          'active',
          Number(btn.dataset.duration) === modeDurations[btn.dataset.modeDuration]
        );
      });
    }
    if (storedTimerVisible) {
      modeTimerVisible = { ...modeTimerVisible, ...JSON.parse(storedTimerVisible) };
    }
    if (storedBrandDrag) {
      const parsedBrandDrag = JSON.parse(storedBrandDrag);
      if (Number.isFinite(parsedBrandDrag?.overlay?.x) && Number.isFinite(parsedBrandDrag?.overlay?.y)) {
        brandDragPosition = { x: parsedBrandDrag.overlay.x, y: parsedBrandDrag.overlay.y };
      } else if (Number.isFinite(parsedBrandDrag?.x) && Number.isFinite(parsedBrandDrag?.y)) {
        brandDragPosition = { x: parsedBrandDrag.x, y: parsedBrandDrag.y };
      }
      if (Number.isFinite(parsedBrandDrag?.fire?.x) && Number.isFinite(parsedBrandDrag?.fire?.y) && Number.isFinite(parsedBrandDrag?.fire?.scale)) {
        brandElementState.fire = {
          x: parsedBrandDrag.fire.x,
          y: parsedBrandDrag.fire.y,
          scale: parsedBrandDrag.fire.scale,
        };
      }
      if (Number.isFinite(parsedBrandDrag?.banner?.x) && Number.isFinite(parsedBrandDrag?.banner?.y) && Number.isFinite(parsedBrandDrag?.banner?.scale)) {
        brandElementState.banner = {
          x: parsedBrandDrag.banner.x,
          y: parsedBrandDrag.banner.y,
          scale: parsedBrandDrag.banner.scale,
        };
      }
      if (Number.isFinite(parsedBrandDrag?.title?.x) && Number.isFinite(parsedBrandDrag?.title?.y) && Number.isFinite(parsedBrandDrag?.title?.scale)) {
        brandElementState.title = {
          x: parsedBrandDrag.title.x,
          y: parsedBrandDrag.title.y,
          scale: parsedBrandDrag.title.scale,
        };
      }
    }
    if (storedParticipantsBoardState) {
      const parsedParticipantsBoardState = JSON.parse(storedParticipantsBoardState);
      const storedBoardVersion = Number(parsedParticipantsBoardState?.version || 0);
      if (parsedParticipantsBoardState?.layout && typeof parsedParticipantsBoardState.layout === 'object') {
        participantsBoardLayoutState = parsedParticipantsBoardState.layout;
      }
      if (parsedParticipantsBoardState?.text && typeof parsedParticipantsBoardState.text === 'object') {
        participantsBoardTextState = parsedParticipantsBoardState.text;
      }
      if (storedBoardVersion < PARTICIPANTS_BOARD_LAYOUT_VERSION) {
        if (!participantsBoardLayoutState['input-shell'] && participantsBoardLayoutState['input-name']) {
          participantsBoardLayoutState['input-shell'] = participantsBoardLayoutState['input-name'];
        }
        delete participantsBoardLayoutState['input-name'];
        delete participantsBoardLayoutState['participants-title-art'];
      }
    }
    const storedSitePlaqueDecorLayout = localStorage.getItem('rollbria-site-plaque-layout');
    if (storedSitePlaqueDecorLayout) {
      const parsedSitePlaqueDecorLayout = JSON.parse(storedSitePlaqueDecorLayout);
      if (Number.isFinite(parsedSitePlaqueDecorLayout?.x) && Number.isFinite(parsedSitePlaqueDecorLayout?.y)) {
        sitePlaqueDecorState = {
          x: parsedSitePlaqueDecorLayout.x,
          y: parsedSitePlaqueDecorLayout.y,
          scale: Number.isFinite(parsedSitePlaqueDecorLayout?.scale) ? parsedSitePlaqueDecorLayout.scale : 1,
        };
      }
    }

    const storedWoodNormalDecorLayout = localStorage.getItem('rollbria-wood-normal-layout');
    if (storedWoodNormalDecorLayout) {
      const parsedWoodNormalDecorLayout = JSON.parse(storedWoodNormalDecorLayout);
      if (Number.isFinite(parsedWoodNormalDecorLayout?.x) && Number.isFinite(parsedWoodNormalDecorLayout?.y)) {
        woodNormalDecorState = {
          x: parsedWoodNormalDecorLayout.x,
          y: parsedWoodNormalDecorLayout.y,
          scale: Number.isFinite(parsedWoodNormalDecorLayout?.scale) ? parsedWoodNormalDecorLayout.scale : 1,
        };
      }
    }
  } catch {}
}

winnerPopupClose.addEventListener('click', hideWinnerPopup);
winnerPopup.addEventListener('click', (e) => {
  if (e.target === winnerPopup) hideWinnerPopup();
});

load();
setupBrandDrag();
setupSitePlaqueDecorControl();
setupWoodNormalDecorControl();
setupParticipantsBoardEditor();
setupParticipantsTitleArtControl();
Object.keys(modeTimerEls).forEach((mode) => syncTimerToggle(mode));
renderParticipants();
renderHistory();
winnersCountEl.textContent = winnersCount;
updateHeaderStats();
setParticipantStatus(
  participants.length
    ? 'Pool restored from your last session.'
    : 'Ready to build your pool.',
  participants.length ? 'success' : ''
);
drawWheel();





