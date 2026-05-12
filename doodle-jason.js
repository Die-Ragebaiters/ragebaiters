import {
  initPage,
  getSessionUser,
  getProfile,
  buildScopedUrl,
  supabase
} from './auth.js?v=2026-04-23-1';

await initPage('secret-game');

const user = await getSessionUser();
if (!user) {
  location.href = buildScopedUrl('login.html');
  throw new Error('redirecting-to-login');
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameTitleEl = document.getElementById('gameTitle');
const gameIntroEl = document.getElementById('gameIntro');
const gameMetaKickerEl = document.getElementById('gameMetaKicker');
const gameMetaTitleEl = document.getElementById('gameMetaTitle');
const gameRulesEl = document.getElementById('gameRules');
const statusTextEl = document.getElementById('gameStatusText');
const touchButtons = [...document.querySelectorAll('[data-touch]')];
const selectorButtons = [...document.querySelectorAll('[data-game]')];
const playerAvatarCard = document.getElementById('playerAvatarCard');
const playerAvatarPreview = document.getElementById('playerAvatarPreview');
const playerAvatarName = document.getElementById('playerAvatarName');
const playerAvatarHint = document.getElementById('playerAvatarHint');
const scoreboardTitleEl = document.getElementById('scoreboardTitle');
const myBestScoreEl = document.getElementById('myBestScore');
const globalBestScoreEl = document.getElementById('globalBestScore');
const leaderboardListEl = document.getElementById('leaderboardList');

const FIXED_STEP = 1000 / 60;
const GAME_STATE_MENU = 0;
const GAME_STATE_PLAYING = 1;
const GAME_STATE_GAME_OVER = 2;
const GAME_STATE_WIN = 3;
const DEFAULT_PLAYER_SPRITE = 'images/doodle-jason-face.png';

const PLAYER_BY_USER_ID = {
  '0126bc68-2349-48f9-a9e8-6fa7b052697f': { key: 'jason', label: 'Jason', sprite: 'images/jason.png' },
  'c67579e7-6643-4a1a-920d-616f4352210c': { key: 'tobi', label: 'Tobi', sprite: 'images/doodletobi.png' },
  'a4bb0f6e-e0f3-4741-95b8-b12d82ce17b0': { key: 'nils', label: 'Nils', sprite: 'images/doodlenils.png' },
  '943a0797-2509-46a3-9259-834242cefb23': { key: 'michael', label: 'Micha', sprite: 'images/doodlemicha.png' },
  'dbb35b2a-c1c0-4e54-bdc6-3ff9a8b0527a': { key: 'ben', label: 'Yotzek', sprite: 'images/doodleben.png' }
};

const PLAYER_BY_LOGIN_ID = {
  jason: { key: 'jason', label: 'Jason', sprite: 'images/jason.png' },
  sneiper0: { key: 'jason', label: 'Jason', sprite: 'images/jason.png' },
  nils: { key: 'nils', label: 'Nils', sprite: 'images/doodlenils.png' },
  disccave: { key: 'nils', label: 'Nils', sprite: 'images/doodlenils.png' },
  michael: { key: 'michael', label: 'Michael', sprite: 'images/doodlemicha.png' },
  mundmbrothers: { key: 'michael', label: 'Michael', sprite: 'images/doodlemicha.png' },
  michi: { key: 'michael', label: 'Michael', sprite: 'images/doodlemicha.png' },
  nathan: { key: 'nathan', label: 'Nathan', sprite: 'images/doodlenathan.png' },
  nathangoldstein: { key: 'nathan', label: 'Nathan', sprite: 'images/doodlenathan.png' },
  goldstein: { key: 'nathan', label: 'Nathan', sprite: 'images/doodlenathan.png' },
  ben: { key: 'ben', label: 'Ben', sprite: 'images/doodleben.png' },
  yotzek: { key: 'ben', label: 'Ben', sprite: 'images/doodleben.png' },
  benluca: { key: 'benluca', label: 'Benluca', sprite: 'images/doodlebenluca.png' },
  tobi: { key: 'tobi', label: 'Tobi', sprite: 'images/doodletobi.png' },
  tobias: { key: 'tobi', label: 'Tobi', sprite: 'images/doodletobi.png' }
};

const GAME_CONFIGS = {
  doodle_jason: {
    key: 'doodle_jason',
    title: 'Doodle Jason',
    intro: 'Spring mit dem Gesicht des eingeloggten Users so hoch wie moeglich und knack den persoenlichen sowie globalen Rekord.',
    metaKicker: 'Steuerung',
    metaTitle: 'Springender Kopf',
    scoreboardTitle: 'Doodle Jason Highscores',
    canvasWidth: 400,
    canvasHeight: 700,
    displayWidth: 560,
    canvasLabel: 'Doodle Jason Spielbereich',
    showAvatarCard: true,
    touchActions: ['left', 'right'],
    touchLabels: { left: 'Links', right: 'Rechts' },
    avatarTitle: identity => `${identity.label} ist der springende Kopf`,
    avatarHint: identity => `Im Spiel huepft direkt ${identity.assetLabel} als Avatar herum.`,
    rules: [
      { title: 'Bewegen', copy: 'Mit den Pfeiltasten oder den Touch-Buttons links und rechts steuern.' },
      { title: 'Starten', copy: 'Im Menue auf SPIELEN klicken oder `Enter` bzw. `Leertaste` druecken.' },
      { title: 'Ueberleben', copy: 'Normale Plattformen tragen dich, blaue bewegen sich und braune brechen weg.' },
      { title: 'Bonus', copy: 'Federn geben Superspruenge, Jetpacks schieben dich kurz brutal nach oben.' }
    ]
  },
  space_invaders: {
    key: 'space_invaders',
    title: 'Space Invaders Klone',
    intro: 'Ein klassischer Ragebaiters-Arcade-Modus: Aliens abschiessen, ausweichen und den globalen Highscore verteidigen.',
    metaKicker: 'Steuerung',
    metaTitle: 'Retro-Feuerkampf',
    scoreboardTitle: 'Space Invaders Klone Highscores',
    canvasWidth: 800,
    canvasHeight: 600,
    displayWidth: 1080,
    canvasLabel: 'Space Invaders Klone Spielbereich',
    showAvatarCard: false,
    touchActions: ['left', 'fire', 'right'],
    touchLabels: { left: 'Links', fire: 'Feuer', right: 'Rechts' },
    rules: [
      { title: 'Bewegen', copy: 'Mit Pfeiltasten oder den Touch-Buttons links und rechts manoevrieren.' },
      { title: 'Schiessen', copy: 'Mit `Leertaste` oder dem Feuer-Button gruene Schuesse auf die Alien-Reihe abgeben.' },
      { title: 'Ueberleben', copy: 'Rote Alien-Schuesse ausweichen. Sobald dich ein Treffer erwischt, ist der Lauf vorbei.' },
      { title: 'Neustart', copy: 'Nach Niederlage oder Sieg `R`, `Enter` oder die Menue-Schaltflaeche nutzen.' }
    ]
  },
  superjason: {
    key: 'superjason',
    title: 'SuperJason',
    intro: 'Ein seitlich scrollender Platformer mit Coins, Power-ups, Lava, Bosskampf und einem separaten globalen Rekord fuer jeden eingeloggten Spieler.',
    metaKicker: 'Steuerung',
    metaTitle: 'Arcade-Jump-and-Run',
    scoreboardTitle: 'SuperJason Highscores',
    canvasWidth: 1280,
    canvasHeight: 720,
    displayWidth: 1320,
    canvasLabel: 'SuperJason Spielbereich',
    showAvatarCard: true,
    touchActions: ['left', 'fire', 'right'],
    touchLabels: { left: 'Links', fire: 'Sprung', right: 'Rechts' },
    avatarTitle: identity => `${identity.label} ist SuperJason`,
    avatarHint: identity => `Das Gesicht ${identity.assetLabel} steckt hier im Jump-and-Run-Helden.`,
    rules: [
      { title: 'Laufen', copy: 'Mit A/D, den Pfeiltasten oder den Touch-Buttons links und rechts ueber die Karte rennen.' },
      { title: 'Springen', copy: 'Mit W, Pfeil hoch, `Leertaste` oder dem Sprung-Button Huerden, Gegner und Schluchten ueberwinden.' },
      { title: 'Sammeln', copy: 'Coins, Herzen, Stern und Super-Power bringen Extrapunkte, Schutz oder mehr Leben.' },
      { title: 'Fortschritt', copy: 'Nach jedem Level `Enter` oder `N` druecken. Im Endschloss wartet der Boss auf dich.' }
    ]
  },
  monkeykong: {
    key: 'monkeykong',
    title: 'MonkeyKong',
    intro: 'Eine Donkey-Kong-inspirierte 5-Level-Kampagne mit Leitern, Faessern, Bosskampf und einem eigenen globalen Highscore.',
    metaKicker: 'Steuerung',
    metaTitle: 'Faesser und Leitern',
    scoreboardTitle: 'MonkeyKong Highscores',
    canvasWidth: 960,
    canvasHeight: 640,
    displayWidth: 1180,
    canvasLabel: 'MonkeyKong Spielbereich',
    showAvatarCard: true,
    touchActions: ['left', 'fire', 'right'],
    touchLabels: { left: 'Links', fire: 'Sprung', right: 'Rechts' },
    avatarTitle: identity => `${identity.label} klettert durch MonkeyKong`,
    avatarHint: identity => `Dein Gesicht ${identity.assetLabel} ist auch hier die Spielfigur auf den Plattformen.`,
    rules: [
      { title: 'Laufen', copy: 'Mit A/D, den Pfeiltasten oder Touch links und rechts ueber die Plattformen rennen.' },
      { title: 'Springen und Klettern', copy: 'Mit W, Pfeil hoch oder `Leertaste` springen. An Leitern bringt dieselbe Aktion dich nach oben.' },
      { title: 'Ausweichen', copy: 'Ueber Faesser springen, sonst verlierst du Leben. Das Bosslevel wird mit jeder Welle hektischer.' },
      { title: 'Ziel', copy: 'Erreiche in den ersten vier Levels das Ziel. Im Finale musst du den Boss von oben treffen.' }
    ]
  },
  oblock: {
    key: 'oblock',
    title: 'O-Block',
    intro: 'Ein schneller Block-Stacker mit steigender Geschwindigkeit, Ghost-Piece, Hard-Drop und eigenem globalen Highscore.',
    metaKicker: 'Steuerung',
    metaTitle: 'Stack und Clear',
    scoreboardTitle: 'O-Block Highscores',
    canvasWidth: 516,
    canvasHeight: 616,
    displayWidth: 920,
    canvasLabel: 'O-Block Spielbereich',
    showAvatarCard: false,
    touchActions: ['left', 'fire', 'right'],
    touchLabels: { left: 'Links', fire: 'Dreh', right: 'Rechts' },
    rules: [
      { title: 'Bewegen', copy: 'Mit A/D oder Pfeil links und rechts den Stein verschieben.' },
      { title: 'Drehen', copy: 'Mit W, Pfeil hoch oder dem Dreh-Button die Form rotieren.' },
      { title: 'Tempo', copy: 'Mit S oder Pfeil runter weich fallen lassen, mit Leertaste direkt hard droppen.' },
      { title: 'Punkte', copy: 'Linien loeschen, Level hochschrauben und den Stack moeglichst lange sauber halten.' }
    ]
  }
};

const userProfile = await getProfile(user.id);
const playerIdentity = resolvePlayerIdentity(user, userProfile);
const playerImg = new Image();
playerImg.src = playerIdentity.sprite;

let activeGameKey = normalizeGameKey(localStorage.getItem('ragebaiters:arcade:selected-game')) || 'doodle_jason';
let activeGame = null;
let activeHighScore = 0;
let activeLeaderboardEntries = [];
const submittingScores = new Set();
let leaderboardLoadToken = 0;

setupSelector();
setupSharedInput();
await selectGame(activeGameKey);

let lastTime = performance.now();
let accumulator = 0;
requestAnimationFrame(loop);

function setupSelector() {
  selectorButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const nextGame = normalizeGameKey(button.dataset.game);
      if (!nextGame || nextGame === activeGameKey) return;
      await selectGame(nextGame);
    });
  });
}

function setupSharedInput() {
  window.addEventListener('keydown', event => {
    activeGame?.handleKeyDown?.(event);
  });

  window.addEventListener('keyup', event => {
    activeGame?.handleKeyUp?.(event);
  });

  canvas.addEventListener('pointerdown', event => {
    activeGame?.handlePointerDown?.(getCanvasPoint(event));
  });

  canvas.addEventListener('pointermove', event => {
    activeGame?.handlePointerMove?.(getCanvasPoint(event));
  });

  canvas.addEventListener('pointerleave', () => {
    activeGame?.handlePointerLeave?.();
  });

  touchButtons.forEach(button => {
    const action = button.dataset.touch;
    const setPressed = pressed => {
      button.classList.toggle('is-active', pressed);
      activeGame?.handleTouchAction?.(action, pressed);
    };

    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      setPressed(true);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
      button.addEventListener(type, () => setPressed(false));
    });
  });
}

async function selectGame(gameKey) {
  const normalized = normalizeGameKey(gameKey) || 'doodle_jason';
  const config = GAME_CONFIGS[normalized];
  if (!config) return;

  activeGameKey = normalized;
  localStorage.setItem('ragebaiters:arcade:selected-game', normalized);

  selectorButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.game === normalized);
  });

  applyGameUi(config);
  configureCanvas(config.canvasWidth, config.canvasHeight, config.canvasLabel, config.displayWidth);
  configureTouchButtons(config.touchActions, config.touchLabels);

  if (normalized === 'space_invaders') {
    activeGame = createSpaceInvadersGame({
      onStatus: setStatus,
      onScore: points => submitArcadeScore(normalized, points)
    });
  } else if (normalized === 'superjason') {
    activeGame = createSuperJasonGame({
      onStatus: setStatus,
      onScore: points => submitArcadeScore(normalized, points),
      sprite: playerImg,
      label: playerIdentity.label
    });
  } else if (normalized === 'monkeykong') {
    activeGame = createMonkeyKongGame({
      onStatus: setStatus,
      onScore: points => submitArcadeScore(normalized, points),
      sprite: playerImg,
      label: playerIdentity.label
    });
  } else if (normalized === 'oblock') {
    activeGame = createOBlockGame({
      onStatus: setStatus,
      onScore: points => submitArcadeScore(normalized, points)
    });
  } else {
    activeGame = createDoodleGame({
      onStatus: setStatus,
      onScore: points => submitArcadeScore(normalized, points),
      sprite: playerImg,
      label: playerIdentity.label
    });
  }

  await refreshScoreboard(normalized);
  activeGame.onActivate?.();
}

function applyGameUi(config) {
  if (gameTitleEl) gameTitleEl.textContent = config.title;
  if (gameIntroEl) gameIntroEl.textContent = config.intro;
  if (gameMetaKickerEl) gameMetaKickerEl.textContent = config.metaKicker;
  if (gameMetaTitleEl) gameMetaTitleEl.textContent = config.metaTitle;
  if (scoreboardTitleEl) scoreboardTitleEl.textContent = config.scoreboardTitle;
  if (canvas) canvas.setAttribute('aria-label', config.canvasLabel);

  renderRules(config.rules);

  if (playerAvatarCard) {
    playerAvatarCard.hidden = !config.showAvatarCard;
  }

  if (config.showAvatarCard) {
    if (playerAvatarPreview) {
      playerAvatarPreview.src = playerIdentity.sprite;
      playerAvatarPreview.alt = `${playerIdentity.label} Spielfigur`;
    }
    if (playerAvatarName) {
      playerAvatarName.textContent = typeof config.avatarTitle === 'function'
        ? config.avatarTitle(playerIdentity)
        : (config.avatarTitle || `${playerIdentity.label} ist der springende Kopf`);
    }
    if (playerAvatarHint) {
      playerAvatarHint.textContent = typeof config.avatarHint === 'function'
        ? config.avatarHint(playerIdentity)
        : (config.avatarHint || `Im Spiel huepft direkt ${playerIdentity.assetLabel} als Avatar herum.`);
    }
  }
}

function renderRules(rules) {
  if (!gameRulesEl) return;
  gameRulesEl.innerHTML = (rules || [])
    .map((rule, index) => `
      <div class="game-rule">
        <div class="game-rule-badge">${index + 1}</div>
        <div class="game-rule-copy">
          <strong>${escapeHtml(rule.title)}</strong>
          <span>${escapeHtml(rule.copy)}</span>
        </div>
      </div>`)
    .join('');
}

function configureCanvas(width, height, label, displayWidth = width) {
  canvas.width = width;
  canvas.height = height;
  canvas.style.setProperty('--game-canvas-max-width', `${displayWidth}px`);
  if (label) canvas.setAttribute('aria-label', label);
}

function configureTouchButtons(visibleActions, labels = {}) {
  const allowed = new Set(visibleActions || []);
  touchButtons.forEach(button => {
    button.classList.toggle('is-hidden', !allowed.has(button.dataset.touch));
    if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent;
    button.textContent = labels[button.dataset.touch] || button.dataset.defaultLabel;
  });
}

function loop(now) {
  accumulator += Math.min(80, now - lastTime);
  lastTime = now;

  while (accumulator >= FIXED_STEP) {
    activeGame?.tick?.();
    accumulator -= FIXED_STEP;
  }

  activeGame?.render?.();
  requestAnimationFrame(loop);
}

function setStatus(text) {
  if (statusTextEl) statusTextEl.textContent = text;
}

async function refreshScoreboard(gameKey) {
  const token = ++leaderboardLoadToken;
  const localKey = buildLocalHighscoreKey(gameKey);
  let localScore = Number(localStorage.getItem(localKey) || 0) || 0;
  let leaderboardMessage = '';

  try {
    const [{ data: myData, error: myError }, { data: leaderboardData, error: leaderboardError }] = await Promise.all([
      supabase.rpc('get_arcade_my_highscore', { p_game_key: gameKey }),
      supabase.rpc('get_arcade_leaderboard', { p_game_key: gameKey })
    ]);

    if (myError) {
      console.error('[Arcade] Eigener Highscore konnte nicht geladen werden:', myError);
      leaderboardMessage = 'Highscore konnte gerade nicht geladen werden.';
    } else {
      localScore = Math.max(localScore, Number(myData || 0) || 0);
      localStorage.setItem(localKey, String(localScore));
    }

    if (leaderboardError) {
      console.error('[Arcade] Leaderboard konnte nicht geladen werden:', leaderboardError);
      if (!leaderboardMessage) leaderboardMessage = 'Leaderboard konnte gerade nicht geladen werden.';
      activeLeaderboardEntries = [];
    } else {
      activeLeaderboardEntries = Array.isArray(leaderboardData) ? leaderboardData : [];
    }
  } catch (error) {
    console.error('[Arcade] Leaderboard-Request fehlgeschlagen:', error);
    activeLeaderboardEntries = [];
    leaderboardMessage = 'Leaderboard konnte gerade nicht geladen werden.';
  }

  if (token !== leaderboardLoadToken) return;
  activeHighScore = localScore;
  updateScoreUi();
  renderLeaderboard(leaderboardMessage);
}

async function submitArcadeScore(gameKey, points) {
  const safePoints = Math.max(0, Math.floor(Number(points) || 0));
  if (!safePoints) return;
  if (submittingScores.has(gameKey)) return;

  submittingScores.add(gameKey);
  try {
    const { data, error } = await supabase.rpc('submit_arcade_score', {
      p_game_key: gameKey,
      p_score: safePoints
    });

    if (error) {
      console.error('[Arcade] Highscore konnte nicht gespeichert werden:', error);
      return;
    }

    const best = Math.max(safePoints, Number(data || 0) || 0);
    activeHighScore = Math.max(activeHighScore, best);
    localStorage.setItem(buildLocalHighscoreKey(gameKey), String(activeHighScore));

    if (activeGameKey === gameKey) {
      await refreshScoreboard(gameKey);
    }
  } finally {
    submittingScores.delete(gameKey);
  }
}

function updateScoreUi() {
  if (myBestScoreEl) myBestScoreEl.textContent = String(activeHighScore || 0);

  if (globalBestScoreEl) {
    const champion = activeLeaderboardEntries[0];
    globalBestScoreEl.textContent = champion
      ? `${champion.username || 'Unbekannt'} · ${champion.best_score || 0}`
      : '-';
  }
}

function renderLeaderboard(message = '') {
  if (!leaderboardListEl) return;

  if (!activeLeaderboardEntries.length) {
    leaderboardListEl.innerHTML = `<div class="game-scoreboard-empty">${escapeHtml(message || 'Noch kein globaler Highscore verfuegbar.')}</div>`;
    return;
  }

  leaderboardListEl.innerHTML = activeLeaderboardEntries
    .map((entry, index) => {
      const username = escapeHtml(entry.username || 'Unbekannt');
      const scoreValue = Number(entry.best_score || 0) || 0;
      const isCurrentUser = Boolean(entry.is_current_user);

      return `
        <div class="game-scoreboard-row ${isCurrentUser ? 'is-current-user' : ''}">
          <div class="game-scoreboard-rank">${index + 1}</div>
          <div class="game-scoreboard-name">
            <strong>${username}</strong>
            <span>${isCurrentUser ? 'Das bist du' : 'Globaler Bestwert'}</span>
          </div>
          <div class="game-scoreboard-value">${scoreValue}</div>
        </div>`;
    })
    .join('');
}

function buildLocalHighscoreKey(gameKey) {
  return `ragebaiters:arcade-highscore:${gameKey}:${playerIdentity.key}:${user.id}`;
}

function createDoodleGame({ onStatus, onScore, sprite, label }) {
  const WIDTH = 400;
  const HEIGHT = 700;
  const GRAVITY = 0.45;
  const JUMP_FORCE = -11.5;
  const SUPER_JUMP = -18.0;
  const MOVE_SPEED = 5.5;
  const PLAYER_W = 50;
  const PLAYER_H = 50;
  const PLATFORM_W = 70;
  const PLATFORM_H = 14;
  const JETPACK_DUR = 120;

  let state = GAME_STATE_MENU;
  let frame = 0;
  let menuBounce = 0;
  let px = WIDTH / 2;
  let py = HEIGHT - 120;
  let vx = 0;
  let vy = 0;
  let cam = 0;
  let keyLeft = false;
  let keyRight = false;
  let facingRight = true;
  let score = 0;
  let scoreSent = false;
  let jetpack = false;
  let jetpackTimer = 0;
  let clouds = createDoodleClouds();
  let platforms = [];
  let powerUps = [];
  let particles = [];
  const pointer = { x: -9999, y: -9999 };

  function onActivate() {
    state = GAME_STATE_MENU;
    menuBounce = 0;
    frame = 0;
    clouds = createDoodleClouds();
    resetRound();
    onStatus(`${label} ist fuer Doodle Jason bereit.`);
  }

  function resetRound() {
    platforms = [];
    powerUps = [];
    particles = [];
    px = WIDTH / 2;
    py = HEIGHT - 120;
    vx = 0;
    vy = 0;
    cam = 0;
    score = 0;
    scoreSent = false;
    jetpack = false;
    jetpackTimer = 0;
    keyLeft = false;
    keyRight = false;
    facingRight = true;

    platforms.push({ x: WIDTH / 2, y: HEIGHT - 60, type: 0, dir: 0, alive: true });
    let y = HEIGHT - 160;
    while (y > -HEIGHT * 3) {
      const x = rand(PLATFORM_W / 2 + 5, WIDTH - PLATFORM_W / 2 - 5);
      let type = 0;
      const roll = Math.random();
      if (y < HEIGHT - 400 && roll < 0.10) type = 2;
      else if (y < HEIGHT - 250 && roll < 0.22) type = 1;

      platforms.push({
        x,
        y,
        type,
        dir: Math.random() > 0.5 ? 1 : -1,
        alive: true
      });

      if (type === 0 && Math.random() < 0.07) {
        powerUps.push({
          x,
          y: y - 25,
          type: Math.random() < 0.72 ? 0 : 1,
          active: true
        });
      }

      y -= rand(55, 90);
    }
  }

  function startGame() {
    state = GAME_STATE_PLAYING;
    resetRound();
    onStatus(`${label} ist unterwegs.`);
  }

  function finishGame() {
    if (scoreSent) return;
    scoreSent = true;
    void onScore(score);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keyLeft = true;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keyRight = true;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (state !== GAME_STATE_PLAYING) startGame();
    }
  }

  function handleKeyUp(event) {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keyLeft = false;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keyRight = false;
  }

  function handlePointerDown(point) {
    pointer.x = point.x;
    pointer.y = point.y;
    if (state === GAME_STATE_MENU && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 40, 210, 54)) {
      startGame();
    } else if (state === GAME_STATE_GAME_OVER && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 85, 200, 48)) {
      startGame();
    }
  }

  function handlePointerMove(point) {
    pointer.x = point.x;
    pointer.y = point.y;
  }

  function handlePointerLeave() {
    pointer.x = -9999;
    pointer.y = -9999;
  }

  function handleTouchAction(action, pressed) {
    if (action === 'left') keyLeft = pressed;
    if (action === 'right') keyRight = pressed;
  }

  function tick() {
    frame += 1;
    if (state === GAME_STATE_MENU) {
      menuBounce += 0.04;
      return;
    }
    if (state !== GAME_STATE_PLAYING) return;

    if (keyLeft) {
      vx = -MOVE_SPEED;
      facingRight = false;
    } else if (keyRight) {
      vx = MOVE_SPEED;
      facingRight = true;
    } else {
      vx *= 0.82;
    }

    if (jetpack) {
      jetpackTimer -= 1;
      vy = -8.5;
      spawnJetpackParticles();
      if (jetpackTimer <= 0) jetpack = false;
    } else {
      vy += GRAVITY;
    }

    px += vx;
    py += vy;

    if (px < -PLAYER_W / 2) px = WIDTH + PLAYER_W / 2;
    if (px > WIDTH + PLAYER_W / 2) px = -PLAYER_W / 2;

    platforms.forEach(platform => {
      if (platform.type === 1 && platform.alive) {
        platform.x += platform.dir * 1.5;
        if (platform.x < PLATFORM_W / 2 || platform.x > WIDTH - PLATFORM_W / 2) {
          platform.dir *= -1;
        }
      }
    });

    if (vy >= 0 && !jetpack) {
      for (let i = platforms.length - 1; i >= 0; i -= 1) {
        const platform = platforms[i];
        if (!platform.alive) continue;

        const overlapX = px + PLAYER_W * 0.4 > platform.x - PLATFORM_W / 2
          && px - PLAYER_W * 0.4 < platform.x + PLATFORM_W / 2;
        const overlapY = py + PLAYER_H / 2 >= platform.y - PLATFORM_H / 2
          && py + PLAYER_H / 2 <= platform.y + PLATFORM_H / 2 + vy + 2;

        if (!overlapX || !overlapY) continue;

        if (platform.type === 2) {
          platform.alive = false;
          spawnBreakParticles(platform.x, platform.y);
        } else {
          py = platform.y - PLATFORM_H / 2 - PLAYER_H / 2;
          vy = JUMP_FORCE;
          spawnLandParticles();
        }
        break;
      }
    }

    powerUps.forEach(powerUp => {
      if (!powerUp.active) return;
      if (distance(px, py, powerUp.x, powerUp.y) < PLAYER_W / 2 + 18) {
        powerUp.active = false;
        if (powerUp.type === 0) {
          vy = SUPER_JUMP;
          spawnSpringParticles();
        } else {
          jetpack = true;
          jetpackTimer = JETPACK_DUR;
        }
      }
    });

    const target = py - HEIGHT * 0.35;
    if (target < cam) {
      cam += (target - cam) * 0.12;
    }

    const climbed = Math.trunc(-(py - (HEIGHT - 120)));
    if (climbed > score) score = climbed;

    generatePlatforms();
    cleanUp();
    updateParticles();

    if (py > cam + HEIGHT + 150) {
      state = GAME_STATE_GAME_OVER;
      finishGame();
      onStatus(score > 0 ? `${label} ist abgestuerzt. ${score} Punkte.` : `${label} ist abgestuerzt.`);
    }
  }

  function render() {
    drawDoodleSky(ctx, WIDTH, HEIGHT);
    drawDoodleClouds(ctx, clouds, state === GAME_STATE_MENU ? 0 : cam, HEIGHT);

    if (state === GAME_STATE_MENU) {
      drawDoodleMenu();
      return;
    }

    ctx.save();
    ctx.translate(0, -cam);

    platforms.forEach(platform => {
      const visibleY = platform.y - cam;
      if (platform.alive && visibleY > -60 && visibleY < HEIGHT + 60) drawPlatform(platform);
    });

    powerUps.forEach(powerUp => {
      if (powerUp.active) drawPowerUp(powerUp);
    });

    drawParticles();
    drawPlayer();

    ctx.restore();
    drawDoodleHud(ctx, WIDTH, score, activeHighScore, jetpack, jetpackTimer, JETPACK_DUR);

    if (state === GAME_STATE_GAME_OVER) drawDoodleGameOver();
  }

  function drawDoodleMenu() {
    const bounce = Math.sin(menuBounce) * 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('DOODLE', WIDTH / 2 + 2, HEIGHT / 4 - 26 + bounce + 2);
    ctx.fillText(label.toUpperCase(), WIDTH / 2 + 2, HEIGHT / 4 + 32 + bounce + 2);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('DOODLE', WIDTH / 2, HEIGHT / 4 - 26 + bounce);
    ctx.fillStyle = '#32CD32';
    ctx.fillText(label.toUpperCase(), WIDTH / 2, HEIGHT / 4 + 32 + bounce);
    ctx.fillStyle = '#505050';
    ctx.font = '16px Arial';
    ctx.fillText('Spring so hoch wie moeglich', WIDTH / 2, HEIGHT / 4 + 78);
    drawButton(ctx, pointer, WIDTH / 2, HEIGHT / 2 + 40, 210, 54, 'SPIELEN', '#2EAE2E', '#4ADE4A');
    if (activeHighScore > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Rekord: ${activeHighScore}`, WIDTH / 2, HEIGHT / 2 + 95);
    }
    ctx.fillStyle = '#666';
    ctx.fillText('Pfeiltasten oder Touch-Buttons zum Steuern', WIDTH / 2, HEIGHT - 55);
    ctx.fillText('Enter oder Klick startet den Lauf', WIDTH / 2, HEIGHT - 32);
  }

  function drawDoodleGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.66)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    roundedRect(ctx, WIDTH / 2 - 155, HEIGHT / 2 - 160, 310, 300, 16, 'rgba(35,35,55,0.92)');
    ctx.strokeStyle = '#FF5555';
    ctx.lineWidth = 3;
    pathRoundedRect(ctx, WIDTH / 2 - 155, HEIGHT / 2 - 160, 310, 300, 16);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF6666';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 105);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Punkte: ${score}`, WIDTH / 2, HEIGHT / 2 - 45);
    ctx.fillStyle = '#FFD700';
    ctx.font = '18px Arial';
    ctx.fillText(`Rekord: ${activeHighScore}`, WIDTH / 2, HEIGHT / 2 + 20);
    drawButton(ctx, pointer, WIDTH / 2, HEIGHT / 2 + 85, 200, 48, 'NOCHMAL', '#2EAE2E', '#4ADE4A');
  }

  function drawPlatform(platform) {
    if (platform.type === 0) {
      roundedRect(ctx, platform.x - PLATFORM_W / 2, platform.y - PLATFORM_H / 2, PLATFORM_W, PLATFORM_H, 6, '#22A822');
      roundedRect(ctx, platform.x - (PLATFORM_W - 6) / 2, platform.y - PLATFORM_H / 2 - 2, PLATFORM_W - 6, PLATFORM_H - 5, 5, '#3CD83C');
      return;
    }

    if (platform.type === 1) {
      roundedRect(ctx, platform.x - PLATFORM_W / 2, platform.y - PLATFORM_H / 2, PLATFORM_W, PLATFORM_H, 6, '#2878C8');
      roundedRect(ctx, platform.x - (PLATFORM_W - 6) / 2, platform.y - PLATFORM_H / 2 - 2, PLATFORM_W - 6, PLATFORM_H - 5, 5, '#48A8F0');
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const arrowX = platform.dir > 0 ? platform.x + PLATFORM_W / 2 - 6 : platform.x - PLATFORM_W / 2 + 6;
      const dir = platform.dir > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(arrowX, platform.y);
      ctx.lineTo(arrowX - dir * 7, platform.y - 4);
      ctx.lineTo(arrowX - dir * 7, platform.y + 4);
      ctx.closePath();
      ctx.fill();
      return;
    }

    roundedRect(ctx, platform.x - PLATFORM_W / 2, platform.y - PLATFORM_H / 2, PLATFORM_W, PLATFORM_H, 6, '#8B5E3C');
    roundedRect(ctx, platform.x - (PLATFORM_W - 6) / 2, platform.y - PLATFORM_H / 2 - 2, PLATFORM_W - 6, PLATFORM_H - 5, 5, '#A97B50');
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(platform.x - 18, platform.y - 3);
    ctx.lineTo(platform.x + 4, platform.y + 4);
    ctx.moveTo(platform.x + 8, platform.y - 4);
    ctx.lineTo(platform.x - 6, platform.y + 3);
    ctx.stroke();
  }

  function drawPowerUp(powerUp) {
    ctx.save();
    ctx.translate(powerUp.x, powerUp.y);
    if (powerUp.type === 0) {
      roundedRect(ctx, -11, 7, 22, 7, 2, '#DD3333');
      ctx.strokeStyle = '#DD3333';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const top = -6 + Math.sin(frame * 0.12) * 3;
      let started = false;
      for (let sy = 7; sy > top; sy -= 3) {
        const sx = Math.sin(sy * 1.2) * 8;
        if (!started) {
          ctx.moveTo(sx, sy);
          started = true;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
      ctx.fillStyle = '#FF6666';
      ctx.beginPath();
      ctx.ellipse(0, top - 2, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      roundedRect(ctx, -10, -14, 20, 28, 5, '#606878');
      roundedRect(ctx, -7, -12, 14, 18, 3, '#7888A0');
      const flameHeight = 10 + Math.sin(frame * 0.35) * 5;
      ctx.fillStyle = 'rgba(255, 153, 0, 0.82)';
      ctx.beginPath();
      ctx.ellipse(-5, 16, 4.5, flameHeight / 2, 0, 0, Math.PI * 2);
      ctx.ellipse(5, 16, 4.5, flameHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 221, 0, 0.82)';
      ctx.beginPath();
      ctx.ellipse(-5, 15, 2.5, flameHeight * 0.275, 0, 0, Math.PI * 2);
      ctx.ellipse(5, 15, 2.5, flameHeight * 0.275, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFDD44';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('J', 0, -3);
    }
    ctx.restore();
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(px, py);
    if (!facingRight) ctx.scale(-1, 1);

    if (sprite.complete && sprite.naturalWidth > 0) {
      const bounceScaleY = 1 + Math.min(Math.abs(vy) / 40, 0.08);
      const bounceScaleX = 1 - Math.min(Math.abs(vy) / 60, 0.05);
      const radius = 34;
      ctx.save();
      ctx.scale(bounceScaleX, bounceScaleY);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 34, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'rgba(255,255,255,0.28)';
      ctx.shadowBlur = 18;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(sprite, -radius, -radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.82)';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = '#3090FF';
      ctx.beginPath();
      ctx.ellipse(0, 0, PLAYER_W / 2, PLAYER_H / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (jetpack) {
      const flameHeight = 18 + Math.sin(frame * 0.35) * 10;
      ctx.fillStyle = 'rgba(255, 136, 0, 0.82)';
      ctx.beginPath();
      ctx.ellipse(-18, PLAYER_H / 2 + 2, 7, flameHeight / 2, 0, 0, Math.PI * 2);
      ctx.ellipse(18, PLAYER_H / 2 + 2, 7, flameHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 204, 0, 0.82)';
      ctx.beginPath();
      ctx.ellipse(-18, PLAYER_H / 2 + 1, 3.5, flameHeight * 0.275, 0, 0, Math.PI * 2);
      ctx.ellipse(18, PLAYER_H / 2 + 1, 3.5, flameHeight * 0.275, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function spawnLandParticles() {
    for (let i = 0; i < 6; i += 1) {
      particles.push({
        x: px + rand(-12, 12),
        y: py + PLAYER_H / 2,
        vx: rand(-2, 2),
        vy: rand(-3, -0.5),
        life: rand(12, 25),
        color: [255, 255, 255]
      });
    }
  }

  function spawnBreakParticles(x, y) {
    for (let i = 0; i < 10; i += 1) {
      particles.push({
        x: x + rand(-PLATFORM_W / 2, PLATFORM_W / 2),
        y,
        vx: rand(-3.5, 3.5),
        vy: rand(-2, 5),
        life: rand(25, 45),
        color: [139, 90, 43]
      });
    }
  }

  function spawnSpringParticles() {
    for (let i = 0; i < 12; i += 1) {
      particles.push({
        x: px + rand(-18, 18),
        y: py + PLAYER_H / 2,
        vx: rand(-3.5, 3.5),
        vy: rand(-5, -1),
        life: rand(20, 40),
        color: [50, 210, 50]
      });
    }
  }

  function spawnJetpackParticles() {
    for (let i = 0; i < 3; i += 1) {
      particles.push({
        x: px + rand(-14, 14),
        y: py + PLAYER_H / 2 + 5,
        vx: rand(-1.8, 1.8),
        vy: rand(2, 5.5),
        life: rand(18, 35),
        color: [255, rand(120, 220), 0]
      });
    }
  }

  function updateParticles() {
    particles = particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 1;
      return particle.life > 0;
    });
  }

  function drawParticles() {
    particles.forEach(particle => {
      const alpha = clamp(mapRange(particle.life, 0, 40, 0, 1), 0, 1);
      ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(particle.x, particle.y, 2.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function generatePlatforms() {
    let highest = Number.POSITIVE_INFINITY;
    platforms.forEach(platform => {
      if (platform.alive && platform.y < highest) highest = platform.y;
    });

    const diff = clamp(score / 6000, 0, 1);
    const maxGap = 90 + diff * 50;
    const breakChance = 0.06 + diff * 0.12;
    const moveChance = 0.12 + diff * 0.12;

    while (highest > cam - 400) {
      const newY = highest - rand(50, maxGap);
      const newX = rand(PLATFORM_W / 2 + 5, WIDTH - PLATFORM_W / 2 - 5);
      let type = 0;
      const roll = Math.random();
      if (roll < breakChance) type = 2;
      else if (roll < breakChance + moveChance) type = 1;

      platforms.push({
        x: newX,
        y: newY,
        type,
        dir: Math.random() > 0.5 ? 1 : -1,
        alive: true
      });

      if (type === 0 && Math.random() < 0.065) {
        powerUps.push({
          x: newX,
          y: newY - 25,
          type: Math.random() < 0.7 ? 0 : 1,
          active: true
        });
      }

      highest = newY;
    }
  }

  function cleanUp() {
    const bottom = cam + HEIGHT + 200;
    platforms = platforms.filter(platform => platform.alive && platform.y <= bottom);
    powerUps = powerUps.filter(powerUp => powerUp.active && powerUp.y <= bottom);
  }

  return {
    onActivate,
    handleKeyDown,
    handleKeyUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleTouchAction,
    tick,
    render
  };

  function createDoodleClouds() {
    const nextClouds = [];
    for (let i = 0; i < 10; i += 1) {
      nextClouds.push({
        x: rand(0, WIDTH),
        y: rand(-2000, HEIGHT),
        size: rand(60, 130),
        speed: rand(0.15, 0.45)
      });
    }
    return nextClouds;
  }
}

function createSpaceInvadersGame({ onStatus, onScore }) {
  const WIDTH = 800;
  const HEIGHT = 600;
  const pointer = { x: -9999, y: -9999 };
  const alienTexture = createAlienTexture();

  let state = GAME_STATE_MENU;
  let score = 0;
  let scoreSent = false;
  let leftPressed = false;
  let rightPressed = false;
  let firePressed = false;
  let fireCooldown = 0;
  let player = null;
  let playerBullets = [];
  let alienBullets = [];
  let aliens = [];
  let stars = [];

  function onActivate() {
    state = GAME_STATE_MENU;
    score = 0;
    scoreSent = false;
    leftPressed = false;
    rightPressed = false;
    firePressed = false;
    fireCooldown = 0;
    setupRound();
    onStatus('Space Invaders Klone ist bereit.');
  }

  function setupRound() {
    player = { x: WIDTH / 2, w: 40, h: 20 };
    playerBullets = [];
    alienBullets = [];
    aliens = [];
    stars = [];
    score = 0;
    scoreSent = false;
    fireCooldown = 0;

    for (let i = 0; i < 150; i += 1) {
      stars.push({
        x: rand(0, WIDTH),
        y: rand(0, HEIGHT),
        size: rand(1, 3)
      });
    }

    for (let i = 0; i < 10; i += 1) {
      for (let j = 0; j < 5; j += 1) {
        aliens.push({
          x: i * 60 + 80,
          y: j * 50 + 50,
          r: 15,
          imgSize: 36,
          xdir: 1,
          speed: 2
        });
      }
    }
  }

  function startGame() {
    state = GAME_STATE_PLAYING;
    setupRound();
    onStatus('Aliens gesichtet. Feuer frei.');
  }

  function finishGame(nextState, message) {
    if (state !== GAME_STATE_PLAYING) return;
    state = nextState;
    if (!scoreSent) {
      scoreSent = true;
      void onScore(score);
    }
    onStatus(message);
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') leftPressed = true;
    if (event.key === 'ArrowRight' || key === 'd') rightPressed = true;

    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      firePressed = true;
      if (state === GAME_STATE_MENU) {
        startGame();
        return;
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (state !== GAME_STATE_PLAYING) {
        startGame();
      }
    }

    if (key === 'r' && state !== GAME_STATE_PLAYING) {
      startGame();
    }
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') leftPressed = false;
    if (event.key === 'ArrowRight' || key === 'd') rightPressed = false;
    if (event.key === ' ' || event.key === 'Spacebar') firePressed = false;
  }

  function handlePointerDown(point) {
    pointer.x = point.x;
    pointer.y = point.y;
    if (state === GAME_STATE_MENU && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 45, 240, 56)) {
      startGame();
    } else if (state !== GAME_STATE_PLAYING && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 90, 240, 52)) {
      startGame();
    }
  }

  function handlePointerMove(point) {
    pointer.x = point.x;
    pointer.y = point.y;
  }

  function handlePointerLeave() {
    pointer.x = -9999;
    pointer.y = -9999;
  }

  function handleTouchAction(action, pressed) {
    if (action === 'left') leftPressed = pressed;
    if (action === 'right') rightPressed = pressed;
    if (action === 'fire') {
      firePressed = pressed;
      if (pressed && state !== GAME_STATE_PLAYING) {
        startGame();
      }
    }
  }

  function tick() {
    updateStars();

    if (state === GAME_STATE_MENU || state === GAME_STATE_GAME_OVER || state === GAME_STATE_WIN) return;
    if (state !== GAME_STATE_PLAYING) return;

    if (leftPressed) player.x -= 5;
    if (rightPressed) player.x += 5;
    player.x = clamp(player.x, player.w / 2, WIDTH - player.w / 2);

    if (fireCooldown > 0) fireCooldown -= 1;
    if (firePressed) firePlayerBullet();

    for (let i = playerBullets.length - 1; i >= 0; i -= 1) {
      const bullet = playerBullets[i];
      bullet.y += bullet.vy;

      let hit = false;
      for (let j = aliens.length - 1; j >= 0; j -= 1) {
        const alien = aliens[j];
        if (distance(bullet.x, bullet.y, alien.x, alien.y) < bullet.r + alien.r) {
          aliens.splice(j, 1);
          score += 10;
          hit = true;
          break;
        }
      }

      if (hit || bullet.y < 0) {
        playerBullets.splice(i, 1);
      }
    }

    for (let i = alienBullets.length - 1; i >= 0; i -= 1) {
      const bullet = alienBullets[i];
      bullet.y += bullet.vy;

      if (hitsPlayerShip(bullet, player)) {
        finishGame(GAME_STATE_GAME_OVER, `Getroffen. Endstand ${score}.`);
        return;
      }

      if (bullet.y > HEIGHT) {
        alienBullets.splice(i, 1);
      }
    }

    let edgeHit = false;
    aliens.forEach(alien => {
      alien.x += alien.xdir * alien.speed;

      if (Math.random() * 1000 < 1.5) {
        alienBullets.push({ x: alien.x, y: alien.y + alien.r, vy: 5, r: 3 });
      }

      if (alien.x > WIDTH - alien.r || alien.x < alien.r) edgeHit = true;
      if (alien.y > HEIGHT - player.h - alien.r) {
        finishGame(GAME_STATE_GAME_OVER, 'Die Aliens haben die Verteidigung durchbrochen.');
      }
    });

    if (state !== GAME_STATE_PLAYING) return;

    if (edgeHit) {
      aliens.forEach(alien => {
        alien.xdir *= -1;
        alien.y += 20;
      });
    }

    if (!aliens.length) {
      finishGame(GAME_STATE_WIN, `Sieg! Endstand ${score}.`);
    }
  }

  function render() {
    drawSpaceBackground();
    drawStars();

    if (state === GAME_STATE_MENU) {
      drawSpaceMenu();
      return;
    }

    drawPlayerShip();
    drawPlayerBullets();
    drawAlienBullets();
    drawAliens();
    drawSpaceHud();

    if (state === GAME_STATE_GAME_OVER) drawSpaceEndScreen('GAME OVER', '#ff5050', `Endstand: ${score}`);
    if (state === GAME_STATE_WIN) drawSpaceEndScreen('SIEG!', '#5dff7f', `Endstand: ${score}`);
  }

  function firePlayerBullet() {
    if (fireCooldown > 0 || state !== GAME_STATE_PLAYING) return;
    playerBullets.push({ x: player.x, y: HEIGHT - 30, vy: -7, r: 3 });
    fireCooldown = 10;
  }

  function updateStars() {
    stars.forEach(star => {
      star.y += star.size * 0.5;
      if (star.y > HEIGHT) {
        star.y = 0;
        star.x = rand(0, WIDTH);
      }
    });
  }

  function drawSpaceBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawStars() {
    stars.forEach(star => {
      const brightness = rand(150, 255);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.beginPath();
      ctx.ellipse(star.x, star.y, star.size, star.size, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPlayerShip() {
    ctx.save();
    ctx.translate(player.x, HEIGHT - player.h / 2 - 10);
    ctx.fillStyle = '#00ff66';
    ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
    ctx.fillRect(-5, -player.h / 2 - 15, 10, 15);
    ctx.restore();
  }

  function drawPlayerBullets() {
    playerBullets.forEach(bullet => drawSpaceBullet(bullet, '#00ff66'));
  }

  function drawAlienBullets() {
    alienBullets.forEach(bullet => drawSpaceBullet(bullet, '#ff4545'));
  }

  function drawSpaceBullet(bullet, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(bullet.x, bullet.y, bullet.r * 2, bullet.r * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAliens() {
    aliens.forEach(alien => {
      ctx.drawImage(alienTexture, alien.x - alien.imgSize / 2, alien.y - alien.imgSize / 2, alien.imgSize, alien.imgSize);
    });
  }

  function drawSpaceHud() {
    roundedRect(ctx, 12, 12, 170, 44, 12, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Score: ${score}`, 24, 34);

    if (activeHighScore > 0) {
      ctx.font = '16px Arial';
      const label = `Rekord: ${activeHighScore}`;
      const boxWidth = ctx.measureText(label).width + 28;
      roundedRect(ctx, WIDTH - boxWidth - 12, 12, boxWidth, 36, 12, 'rgba(0,0,0,0.55)');
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd86a';
      ctx.fillText(label, WIDTH - 24, 30);
    }
  }

  function drawSpaceMenu() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5dff7f';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('SPACE', WIDTH / 2, HEIGHT / 2 - 140);
    ctx.fillText('INVADERS', WIDTH / 2, HEIGHT / 2 - 82);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Arial';
    ctx.fillText('KLONE', WIDTH / 2, HEIGHT / 2 - 28);
    drawButton(ctx, pointer, WIDTH / 2, HEIGHT / 2 + 45, 240, 56, 'STARTEN', '#2EAE2E', '#4ADE4A');
    ctx.fillStyle = '#9aa4b2';
    ctx.font = '18px Arial';
    ctx.fillText('Links / Rechts bewegen, Leertaste feuert', WIDTH / 2, HEIGHT - 70);
    ctx.fillText('Aliens abschiessen und roten Schuessen ausweichen', WIDTH / 2, HEIGHT - 40);
  }

  function drawSpaceEndScreen(title, accentColor, subtitle) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    roundedRect(ctx, WIDTH / 2 - 190, HEIGHT / 2 - 140, 380, 280, 18, 'rgba(16, 18, 32, 0.94)');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 48px Arial';
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 76);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 - 16);
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffd86a';
    ctx.fillText(`Rekord: ${activeHighScore}`, WIDTH / 2, HEIGHT / 2 + 20);
    drawButton(ctx, pointer, WIDTH / 2, HEIGHT / 2 + 90, 240, 52, 'NOCHMAL', '#2EAE2E', '#4ADE4A');
  }

  function createAlienTexture() {
    const offscreen = document.createElement('canvas');
    offscreen.width = 16;
    offscreen.height = 16;
    const off = offscreen.getContext('2d');
    const pattern = [
      [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
      [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
      [0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
      [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0],
      [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0]
    ];
    off.clearRect(0, 0, 16, 16);
    off.fillStyle = '#00ff66';

    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        if (pattern[y][x] === 1) {
          off.fillRect(x, y, 1, 1);
          off.fillRect(x, 15 - y, 1, 1);
        }
      }
    }

    return offscreen;
  }

  return {
    onActivate,
    handleKeyDown,
    handleKeyUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleTouchAction,
    tick,
    render
  };
}

function createSuperJasonGame({ onStatus, onScore, sprite, label }) {
  const WIDTH = 1280;
  const HEIGHT = 720;
  const LEVEL_CLEAR_STATE = 4;
  const GRAVITY = 0.82;
  const pointer = { x: -9999, y: -9999 };
  const totalLevels = 9;
  const levelNames = [
    '1-1 Gruene Wiese',
    '1-2 Rohrtal',
    '1-3 Schlossgraben',
    '2-1 Huegelpfad',
    '2-2 Wolkenbruecken',
    '2-3 Feuerhalle',
    '3-1 Pilzpark',
    '3-2 Festungsmauer',
    '3-3 Endschloss'
  ];

  let state = GAME_STATE_MENU;
  let frame = 0;
  let score = 0;
  let lives = 3;
  let currentLevel = 1;
  let carriedPowerLevel = 0;
  let cameraX = 0;
  let levelEndX = 2400;
  let spawnX = 140;
  let spawnY = 180;
  let currentTheme = 'overworld';
  let scoreSent = false;
  let moveLeft = false;
  let moveRight = false;
  let jumpPressed = false;
  let levelCleared = false;
  let platforms = [];
  let coins = [];
  let enemies = [];
  let hazards = [];
  let powerUps = [];
  let projectiles = [];
  let player = null;
  let bossEnemy = null;
  let bossGate = null;

  function onActivate() {
    state = GAME_STATE_MENU;
    frame = 0;
    resetRunState();
    onStatus('SuperJason ist bereit.');
  }

  function resetRunState() {
    score = 0;
    lives = 3;
    currentLevel = 1;
    carriedPowerLevel = 0;
    scoreSent = false;
    moveLeft = false;
    moveRight = false;
    jumpPressed = false;
    cameraX = 0;
    levelCleared = false;
    player = null;
    bossEnemy = null;
    bossGate = null;
    platforms = [];
    coins = [];
    enemies = [];
    hazards = [];
    powerUps = [];
    projectiles = [];
  }

  function startGame() {
    resetRunState();
    loadLevel(1);
    state = GAME_STATE_PLAYING;
    onStatus(`${label} startet in SuperJason.`);
  }

  function loadLevel(levelNumber) {
    currentLevel = levelNumber;
    currentTheme = isCastleLevel(levelNumber) ? 'castle' : 'overworld';
    levelCleared = false;
    moveLeft = false;
    moveRight = false;
    jumpPressed = false;
    cameraX = 0;
    bossEnemy = null;
    bossGate = null;
    platforms = [];
    coins = [];
    enemies = [];
    hazards = [];
    powerUps = [];
    projectiles = [];
    buildLevel(levelNumber);
    player = createPlayer(spawnX, spawnY);
    setPlayerPowerLevel(player, carriedPowerLevel);
  }

  function isCastleLevel(levelNumber) {
    return levelNumber === 3 || levelNumber === 6 || levelNumber === 8 || levelNumber === 9;
  }

  function difficultyScale() {
    return 1 + Math.max(0, currentLevel - 1) * 0.09;
  }

  function buildLevel(levelNumber) {
    spawnX = 140;
    spawnY = 180;

    switch (levelNumber) {
      case 1:
        levelEndX = 2550;
        addGroundStrip(-256, levelEndX + 600);
        addPlatformBlock(320, 540, 180, 'brick');
        addPlatformBlock(650, 470, 180, 'brick');
        addPlatformBlock(980, 410, 140, 'question');
        addPlatformBlock(1270, 340, 220, 'brick');
        addPlatformBlock(1660, 500, 160, 'pipe');
        addPlatformBlock(1960, 430, 180, 'brick');
        addCoinsLine(350, 490, 3, 50);
        addCoinsArc(670, 420, 4, 42);
        addCoinsLine(1010, 360, 3, 46);
        addCoinsArc(1310, 290, 4, 42);
        addCoinsLine(1990, 380, 3, 46);
        addPowerUp(1000, 365, 'super');
        addEnemy(760, HEIGHT - 122, 700, 860, 'walker');
        addEnemy(1490, HEIGHT - 122, 1420, 1650, 'walker');
        addEnemy(2190, HEIGHT - 122, 2050, 2380, 'walker');
        break;
      case 2:
        levelEndX = 2780;
        addGroundStrip(-256, 960);
        addGroundStrip(1120, 560);
        addGroundStrip(1820, 960);
        addPlatformBlock(300, 520, 120, 'pipe');
        addPlatformBlock(520, 460, 140, 'pipe');
        addPlatformBlock(760, 400, 160, 'pipe');
        addPlatformBlock(1260, 500, 180, 'brick');
        addPlatformBlock(1580, 430, 200, 'question');
        addPlatformBlock(2060, 360, 180, 'brick');
        addPlatformBlock(2380, 300, 180, 'question');
        addCoinsLine(320, 460, 2, 42);
        addCoinsLine(540, 400, 3, 42);
        addCoinsArc(1280, 450, 4, 40);
        addCoinsArc(1610, 380, 4, 40);
        addCoinsLine(2090, 310, 3, 46);
        addCoinsLine(2410, 250, 3, 46);
        addPowerUp(1600, 385, 'star');
        addEnemy(980, HEIGHT - 122, 900, 1060, 'walker');
        addEnemy(1730, HEIGHT - 122, 1520, 1780, 'walker');
        addEnemy(2290, HEIGHT - 122, 1900, 2580, 'spike');
        break;
      case 3:
        levelEndX = 2500;
        addCastleFloor(-256, 820);
        addCastleFloor(980, 420);
        addCastleFloor(1560, 940);
        addLava(820, HEIGHT - 48, 160, 48);
        addLava(1400, HEIGHT - 48, 160, 48);
        addPlatformBlock(340, 500, 180, 'castle');
        addPlatformBlock(620, 410, 150, 'steel');
        addPlatformBlock(1080, 460, 160, 'castle');
        addPlatformBlock(1320, 360, 140, 'steel');
        addPlatformBlock(1760, 470, 180, 'castle');
        addPlatformBlock(2060, 360, 160, 'steel');
        addCoinsLine(360, 450, 3, 44);
        addCoinsArc(630, 360, 3, 40);
        addCoinsLine(1095, 410, 3, 44);
        addCoinsLine(1785, 420, 3, 44);
        addPowerUp(1330, 315, 'super');
        addEnemy(700, HEIGHT - 122, 620, 760, 'armor');
        addEnemy(1200, HEIGHT - 122, 1040, 1340, 'armor');
        addEnemy(1930, HEIGHT - 122, 1760, 2080, 'armor');
        break;
      case 4:
        levelEndX = 3050;
        addGroundStrip(-256, levelEndX + 500);
        addPlatformBlock(300, 520, 200, 'brick');
        addPlatformBlock(640, 450, 180, 'question');
        addPlatformBlock(960, 380, 180, 'brick');
        addPlatformBlock(1310, 310, 180, 'brick');
        addPlatformBlock(1700, 470, 180, 'pipe');
        addPlatformBlock(2020, 400, 160, 'question');
        addPlatformBlock(2320, 340, 200, 'brick');
        addPlatformBlock(2640, 280, 160, 'question');
        addCoinsLine(330, 470, 3, 46);
        addCoinsArc(660, 400, 4, 40);
        addCoinsArc(980, 330, 4, 40);
        addCoinsLine(2040, 350, 3, 44);
        addCoinsLine(2350, 290, 3, 44);
        addCoinsLine(2670, 230, 3, 44);
        addPowerUp(2060, 355, 'super');
        addEnemy(820, HEIGHT - 122, 740, 920, 'walker');
        addEnemy(1560, HEIGHT - 122, 1400, 1680, 'walker');
        addEnemy(2440, HEIGHT - 122, 2260, 2580, 'spike');
        addEnemy(2890, HEIGHT - 122, 2740, 3000, 'walker');
        break;
      case 5:
        levelEndX = 2880;
        addGroundStrip(-256, 980);
        addGroundStrip(2360, 620);
        addPlatformBlock(760, 520, 170, 'cloud');
        addPlatformBlock(1020, 450, 170, 'cloud');
        addPlatformBlock(1290, 380, 170, 'cloud');
        addPlatformBlock(1560, 310, 170, 'cloud');
        addPlatformBlock(1850, 380, 170, 'cloud');
        addPlatformBlock(2120, 450, 170, 'cloud');
        addCoinsLine(785, 470, 3, 42);
        addCoinsLine(1045, 400, 3, 42);
        addCoinsLine(1315, 330, 3, 42);
        addCoinsLine(1585, 260, 3, 42);
        addCoinsLine(1875, 330, 3, 42);
        addCoinsLine(2145, 400, 3, 42);
        addPowerUp(1600, 255, 'star');
        addEnemy(1120, 410, 1040, 1160, 'walker');
        addEnemy(1430, 340, 1320, 1460, 'flyer');
        addEnemy(1670, 270, 1600, 1710, 'spike');
        addEnemy(1950, 340, 1860, 2020, 'flyer');
        addEnemy(2210, 410, 2140, 2260, 'walker');
        break;
      case 6:
        levelEndX = 3040;
        addCastleFloor(-256, 940);
        addCastleFloor(1220, 520);
        addCastleFloor(1960, 1080);
        addLava(940, HEIGHT - 48, 280, 48);
        addLava(1740, HEIGHT - 48, 220, 48);
        addPlatformBlock(320, 520, 160, 'castle');
        addPlatformBlock(620, 450, 160, 'steel');
        addPlatformBlock(920, 380, 160, 'castle');
        addPlatformBlock(1360, 430, 160, 'steel');
        addPlatformBlock(1660, 330, 160, 'castle');
        addPlatformBlock(2080, 460, 160, 'steel');
        addPlatformBlock(2360, 360, 170, 'castle');
        addPlatformBlock(2660, 280, 170, 'steel');
        addCoinsLine(345, 470, 3, 44);
        addCoinsLine(645, 400, 3, 44);
        addCoinsArc(940, 330, 3, 42);
        addCoinsArc(1385, 380, 3, 42);
        addCoinsLine(1685, 280, 3, 44);
        addCoinsLine(2385, 310, 3, 44);
        addCoinsLine(2685, 230, 3, 44);
        addPowerUp(2370, 315, 'super');
        addEnemy(760, HEIGHT - 122, 660, 860, 'armor');
        addEnemy(1520, HEIGHT - 122, 1320, 1700, 'armor');
        addEnemy(2240, HEIGHT - 122, 2040, 2440, 'armor');
        addEnemy(2760, HEIGHT - 122, 2620, 2880, 'spike');
        break;
      case 7:
        levelEndX = 3220;
        addGroundStrip(-256, levelEndX + 500);
        addPlatformBlock(260, 520, 160, 'question');
        addPlatformBlock(540, 450, 160, 'brick');
        addPlatformBlock(840, 380, 160, 'question');
        addPlatformBlock(1160, 310, 160, 'brick');
        addPlatformBlock(1530, 470, 180, 'pipe');
        addPlatformBlock(1850, 400, 160, 'question');
        addPlatformBlock(2140, 330, 160, 'brick');
        addPlatformBlock(2450, 260, 160, 'question');
        addPlatformBlock(2740, 400, 180, 'brick');
        addPlatformBlock(2990, 320, 160, 'question');
        addCoinsLine(285, 470, 3, 42);
        addCoinsLine(565, 400, 3, 42);
        addCoinsLine(865, 330, 3, 42);
        addCoinsLine(1185, 260, 3, 42);
        addCoinsArc(1875, 350, 4, 38);
        addCoinsLine(2475, 210, 3, 42);
        addCoinsLine(3015, 270, 3, 42);
        addPowerUp(1860, 355, 'heart');
        addPowerUp(3010, 275, 'star');
        addEnemy(730, HEIGHT - 122, 630, 820, 'walker');
        addEnemy(1080, HEIGHT - 122, 980, 1200, 'spike');
        addEnemy(1460, HEIGHT - 122, 1320, 1500, 'spike');
        addEnemy(1960, HEIGHT - 122, 1800, 2060, 'walker');
        addEnemy(2310, HEIGHT - 122, 2140, 2480, 'walker');
        addEnemy(2870, HEIGHT - 122, 2700, 2980, 'spike');
        break;
      case 8:
        levelEndX = 3140;
        addCastleFloor(-256, 760);
        addCastleFloor(960, 420);
        addCastleFloor(1580, 1460);
        addLava(760, HEIGHT - 48, 200, 48);
        addLava(1380, HEIGHT - 48, 200, 48);
        addPlatformBlock(280, 500, 180, 'castle');
        addPlatformBlock(560, 410, 160, 'steel');
        addPlatformBlock(1040, 470, 160, 'castle');
        addPlatformBlock(1280, 370, 150, 'steel');
        addPlatformBlock(1760, 500, 160, 'castle');
        addPlatformBlock(2050, 420, 160, 'steel');
        addPlatformBlock(2340, 340, 160, 'castle');
        addPlatformBlock(2620, 260, 160, 'steel');
        addCoinsLine(305, 450, 3, 44);
        addCoinsArc(585, 360, 3, 40);
        addCoinsLine(1065, 420, 3, 44);
        addCoinsLine(1785, 450, 3, 44);
        addCoinsLine(2075, 370, 3, 44);
        addCoinsLine(2365, 290, 3, 44);
        addCoinsLine(2645, 210, 3, 44);
        addPowerUp(1285, 325, 'star');
        addPowerUp(2370, 295, 'super');
        addEnemy(670, HEIGHT - 122, 560, 720, 'armor');
        addEnemy(1180, HEIGHT - 122, 1020, 1320, 'armor');
        addEnemy(1530, HEIGHT - 122, 1400, 1550, 'spike');
        addEnemy(1960, HEIGHT - 122, 1760, 2200, 'armor');
        addEnemy(2530, HEIGHT - 122, 2360, 2680, 'armor');
        addEnemy(2860, HEIGHT - 122, 2720, 3000, 'spike');
        break;
      case 9:
        levelEndX = 3500;
        addCastleFloor(-256, 940);
        addCastleFloor(1300, 460);
        addCastleFloor(1980, 1600);
        addLava(940, HEIGHT - 48, 360, 48);
        addLava(1760, HEIGHT - 48, 220, 48);
        addPlatformBlock(280, 520, 180, 'castle');
        addPlatformBlock(580, 440, 160, 'steel');
        addPlatformBlock(860, 350, 160, 'castle');
        addPlatformBlock(1380, 430, 170, 'steel');
        addPlatformBlock(1700, 330, 170, 'castle');
        addPlatformBlock(2120, 480, 170, 'steel');
        addPlatformBlock(2400, 390, 170, 'castle');
        addPlatformBlock(2700, 300, 170, 'steel');
        addPlatformBlock(3140, 360, 170, 'steel');
        addCoinsLine(305, 470, 3, 44);
        addCoinsLine(605, 390, 3, 44);
        addCoinsLine(885, 300, 3, 44);
        addCoinsLine(1405, 380, 3, 44);
        addCoinsLine(1725, 280, 3, 44);
        addCoinsLine(2145, 430, 3, 44);
        addCoinsLine(2425, 340, 3, 44);
        addCoinsLine(2725, 250, 3, 44);
        addCoinsLine(3165, 310, 3, 44);
        addPowerUp(1410, 385, 'super');
        addPowerUp(2725, 255, 'heart');
        addPowerUp(3165, 315, 'star');
        addEnemy(720, HEIGHT - 122, 600, 860, 'armor');
        addEnemy(1540, HEIGHT - 122, 1380, 1680, 'armor');
        addEnemy(2280, HEIGHT - 122, 2120, 2400, 'armor');
        bossEnemy = addEnemy(2920, HEIGHT - 132, 2740, 3240, 'boss');
        bossGate = newPlatform(3340, HEIGHT - 220, 30, 132, 'gate');
        bossGate.solid = true;
        platforms.push(bossGate);
        break;
      default:
        levelEndX = 2200;
        addGroundStrip(-256, levelEndX + 500);
        break;
    }
  }

  function addGroundStrip(x, widthAmount) {
    platforms.push(newPlatform(x, HEIGHT - 88, widthAmount, 88, 'ground'));
  }

  function addCastleFloor(x, widthAmount) {
    platforms.push(newPlatform(x, HEIGHT - 88, widthAmount, 88, 'castleFloor'));
  }

  function addPlatformBlock(x, y, widthAmount, style) {
    let h = 24;
    if (style === 'pipe') h = 88;
    else if (style === 'cloud') h = 22;
    else if (style === 'gate') h = 132;
    platforms.push(newPlatform(x, y, widthAmount, h, style));
  }

  function addCoinsLine(startX, y, count, spacing) {
    for (let i = 0; i < count; i += 1) {
      coins.push({ x: startX + i * spacing, y, collected: false, bobOffset: Math.random() * Math.PI * 2 });
    }
  }

  function addCoinsArc(startX, y, count, spacing) {
    for (let i = 0; i < count; i += 1) {
      const lift = Math.abs(i - (count - 1) * 0.5) * -16;
      coins.push({ x: startX + i * spacing, y: y + lift, collected: false, bobOffset: Math.random() * Math.PI * 2 });
    }
  }

  function addEnemy(x, y, minX, maxX, type) {
    const enemy = createEnemy(x, y, minX, maxX, type);
    enemies.push(enemy);
    return enemy;
  }

  function addLava(x, y, w, h) {
    hazards.push({ x, y, w, h, type: 'lava', active: true });
  }

  function addPowerUp(x, y, type) {
    powerUps.push({ x, y, homeY: y, type, collected: false, bobOffset: Math.random() * Math.PI * 2 });
  }

  function createPlayer(startX, startY) {
    return {
      x: startX,
      y: startY,
      w: 46,
      h: 58,
      vx: 0,
      vy: 0,
      onGround: false,
      invincibleFrames: 0,
      starFrames: 0,
      powerLevel: 0
    };
  }

  function setPlayerPowerLevel(playerRef, newLevel) {
    const oldH = playerRef.h;
    playerRef.powerLevel = clamp(newLevel, 0, 1);
    if (playerRef.powerLevel > 0) {
      playerRef.w = 52;
      playerRef.h = 72;
    } else {
      playerRef.w = 46;
      playerRef.h = 58;
    }
    playerRef.y -= (playerRef.h - oldH) * 0.5;
  }

  function givePlayerStar() {
    player.starFrames = 360;
    player.invincibleFrames = Math.max(player.invincibleFrames, 60);
  }

  function createEnemy(x, y, minX, maxX, type) {
    const enemy = {
      x,
      y,
      w: 42,
      h: 34,
      vx: 1.6,
      minX,
      maxX,
      bobOffset: Math.random() * Math.PI * 2,
      type,
      defeated: false,
      bossHealth: 5,
      bossMaxHealth: 5,
      hitCooldown: 0,
      shootTimer: 70
    };

    const scale = difficultyScale();
    if (type === 'spike') enemy.vx = 2.0 * scale;
    else if (type === 'armor') enemy.vx = 1.35 * scale;
    else if (type === 'flyer') {
      enemy.vx = 2.15 * scale;
      enemy.y -= 70;
    } else if (type === 'boss') {
      enemy.vx = 2.2;
      enemy.w = 88;
      enemy.h = 66;
      enemy.shootTimer = 80;
    } else {
      enemy.vx = 1.65 * scale;
    }

    return enemy;
  }

  function newPlatform(x, y, w, h, style) {
    return { x, y, w, h, style, solid: true };
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (event.key === 'ArrowLeft' || key === 'a') moveLeft = true;
    if (event.key === 'ArrowRight' || key === 'd') moveRight = true;
    if (event.key === 'ArrowUp' || key === 'w' || key === ' ') {
      event.preventDefault();
      jumpPressed = true;
    }

    if (state === GAME_STATE_MENU && (event.key === 'Enter' || key === ' ' || key === 'r')) {
      event.preventDefault();
      startGame();
      return;
    }

    if ((key === 'r') && state !== GAME_STATE_PLAYING) {
      startGame();
      return;
    }

    if ((key === 'n' || event.key === 'Enter') && state === LEVEL_CLEAR_STATE) {
      event.preventDefault();
      loadLevel(currentLevel + 1);
      state = GAME_STATE_PLAYING;
      onStatus(`${levelNames[currentLevel - 1]} gestartet.`);
      return;
    }

    if (event.key === 'Enter' && (state === GAME_STATE_GAME_OVER || state === GAME_STATE_WIN)) {
      event.preventDefault();
      startGame();
    }
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') moveLeft = false;
    if (event.key === 'ArrowRight' || key === 'd') moveRight = false;
    if (event.key === 'ArrowUp' || key === 'w' || key === ' ') jumpPressed = false;
  }

  function handlePointerDown(point) {
    pointer.x = point.x;
    pointer.y = point.y;

    if (state === GAME_STATE_MENU && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 85, 280, 58)) {
      startGame();
      return;
    }

    if (state === LEVEL_CLEAR_STATE && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 74, 320, 54)) {
      loadLevel(currentLevel + 1);
      state = GAME_STATE_PLAYING;
      onStatus(`${levelNames[currentLevel - 1]} gestartet.`);
      return;
    }

    if ((state === GAME_STATE_GAME_OVER || state === GAME_STATE_WIN) && hitButton(point.x, point.y, WIDTH / 2, HEIGHT / 2 + 88, 260, 54)) {
      startGame();
    }
  }

  function handlePointerMove(point) {
    pointer.x = point.x;
    pointer.y = point.y;
  }

  function handlePointerLeave() {
    pointer.x = -9999;
    pointer.y = -9999;
  }

  function handleTouchAction(action, pressed) {
    if (action === 'left') moveLeft = pressed;
    if (action === 'right') moveRight = pressed;
    if (action === 'fire') {
      jumpPressed = pressed;
      if (pressed && state === GAME_STATE_MENU) {
        startGame();
      } else if (pressed && state === LEVEL_CLEAR_STATE) {
        loadLevel(currentLevel + 1);
        state = GAME_STATE_PLAYING;
      } else if (pressed && (state === GAME_STATE_GAME_OVER || state === GAME_STATE_WIN)) {
        startGame();
      }
    }
  }

  function tick() {
    frame += 1;
    if (state !== GAME_STATE_PLAYING) return;
    updatePlayer();
    updateCoins();
    updatePowerUps();
    updateEnemies();
    updateProjectiles();
    updateHazards();
    updateGoal();
    cameraX = clamp(player.x - WIDTH * 0.35, 0, Math.max(0, levelEndX - WIDTH * 0.45));
  }

  function updatePlayer() {
    const moveSpeed = player.powerLevel > 0 ? 5.9 : 5.5;
    const boostedMoveSpeed = player.starFrames > 0 ? moveSpeed + 0.5 : moveSpeed;
    let targetSpeed = 0;
    if (moveLeft) targetSpeed -= boostedMoveSpeed;
    if (moveRight) targetSpeed += boostedMoveSpeed;

    player.vx = mix(player.vx, targetSpeed, player.onGround ? 0.24 : 0.13);
    if (!moveLeft && !moveRight && Math.abs(player.vx) < 0.15) player.vx = 0;

    if (jumpPressed && player.onGround) {
      player.vy = player.powerLevel > 0 ? -16.5 : -15.6;
      player.onGround = false;
    }

    player.vy = clamp(player.vy + GRAVITY, -18, 18);

    const prevX = player.x;
    player.x += player.vx;
    resolveHorizontal(prevX);

    const prevY = player.y;
    player.y += player.vy;
    resolveVertical(prevY);

    player.x = Math.max(player.x, -128);

    if (player.y > HEIGHT + 260) {
      loseLife();
      return;
    }

    if (player.invincibleFrames > 0) player.invincibleFrames -= 1;
    if (player.starFrames > 0) player.starFrames -= 1;
  }

  function resolveHorizontal(prevX) {
    platforms.forEach(platform => {
      if (!platform.solid || !overlapsPlayerRect(platform.x, platform.y, platform.w, platform.h)) return;

      if (prevX + player.w * 0.5 <= platform.x) {
        player.x = platform.x - player.w * 0.5;
      } else if (prevX - player.w * 0.5 >= platform.x + platform.w) {
        player.x = platform.x + platform.w + player.w * 0.5;
      } else if (player.vx > 0) {
        player.x = platform.x - player.w * 0.5;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.w + player.w * 0.5;
      }
      player.vx = 0;
    });
  }

  function resolveVertical(prevY) {
    player.onGround = false;
    platforms.forEach(platform => {
      if (!platform.solid || !overlapsPlayerRect(platform.x, platform.y, platform.w, platform.h)) return;

      if (prevY + player.h * 0.5 <= platform.y) {
        player.y = platform.y - player.h * 0.5;
        player.onGround = true;
      } else if (prevY - player.h * 0.5 >= platform.y + platform.h) {
        player.y = platform.y + platform.h + player.h * 0.5;
      } else if (player.vy > 0) {
        player.y = platform.y - player.h * 0.5;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = platform.y + platform.h + player.h * 0.5;
      }
      player.vy = 0;
    });
  }

  function overlapsPlayerRect(rx, ry, rw, rh) {
    return player.x + player.w * 0.5 > rx
      && player.x - player.w * 0.5 < rx + rw
      && player.y + player.h * 0.5 > ry
      && player.y - player.h * 0.5 < ry + rh;
  }

  function updateCoins() {
    coins.forEach(coin => {
      if (!coin.collected && overlapsPlayerRect(coin.x - 15, coin.y - 15, 30, 30)) {
        coin.collected = true;
        score += 100;
      }
    });
  }

  function updatePowerUps() {
    powerUps.forEach(powerUp => {
      if (powerUp.collected) return;
      powerUp.y = powerUp.homeY + Math.sin(frame * 0.08 + powerUp.bobOffset) * 4;
      if (overlapsPlayerRect(powerUp.x - 20, powerUp.y - 20, 40, 40)) {
        powerUp.collected = true;
        if (powerUp.type === 'super') {
          setPlayerPowerLevel(player, 1);
          carriedPowerLevel = player.powerLevel;
          score += 200;
        } else if (powerUp.type === 'star') {
          givePlayerStar();
          score += 200;
        } else if (powerUp.type === 'heart') {
          lives = Math.min(9, lives + 1);
          score += 300;
        }
      }
    });
  }

  function updateEnemies() {
    for (const enemy of enemies) {
      if (enemy.defeated) continue;

      if (enemy.hitCooldown > 0) enemy.hitCooldown -= 1;

      if (enemy.type === 'flyer') {
        enemy.x += enemy.vx;
        enemy.y += Math.sin(frame * 0.12 + enemy.bobOffset) * 0.8;
        if (enemy.x < enemy.minX || enemy.x > enemy.maxX) enemy.vx *= -1;
      } else {
        enemy.x += enemy.vx;
        if (enemy.x < enemy.minX || enemy.x > enemy.maxX) enemy.vx *= -1;
      }

      if (enemy.type === 'boss') {
        enemy.shootTimer -= 1;
        if (enemy.shootTimer <= 0) {
          spawnBossFire(enemy);
          enemy.shootTimer = Math.max(22, 82 - (enemy.bossMaxHealth - enemy.bossHealth) * 10);
        }
      }

      if (!rectsOverlap(player.x - player.w * 0.5, player.y - player.h * 0.5, player.w, player.h, enemy.x - enemy.w * 0.5, enemy.y - enemy.h * 0.5, enemy.w, enemy.h)) {
        continue;
      }

      if (player.starFrames > 0) {
        if (enemy.type === 'boss') {
          if (takeBossHit(enemy)) {
            score += 600;
            player.vy = -13.5;
            if (enemy.defeated) {
              unlockBossGate();
              score += 2000;
            }
          }
        } else {
          enemy.defeated = true;
          score += 300;
        }
      } else if (player.vy > 2 && player.y + player.h * 0.5 < enemy.y - 2) {
        if (enemy.type === 'boss') {
          if (takeBossHit(enemy)) {
            player.vy = -13.5;
            score += 600;
            if (enemy.defeated) {
              unlockBossGate();
              score += 2000;
            }
          }
        } else {
          enemy.defeated = true;
          player.vy = -12;
          score += 250;
        }
      } else if (player.invincibleFrames === 0) {
        takeDamage();
        return;
      }
    }
  }

  function spawnBossFire(enemy) {
    const dir = player.x < enemy.x ? -1 : 1;
    const speed = 5.8 + (enemy.bossMaxHealth - enemy.bossHealth) * 0.5;
    projectiles.push({
      x: enemy.x + dir * 44,
      y: enemy.y - 10,
      vx: dir * speed,
      vy: rand(-0.5, 0.8),
      w: 22,
      h: 18,
      type: 'fireball',
      active: true,
      phase: Math.random() * Math.PI * 2
    });
  }

  function takeBossHit(enemy) {
    if (enemy.hitCooldown > 0) return false;
    enemy.bossHealth -= 1;
    enemy.hitCooldown = 45;
    enemy.vx *= -1;
    enemy.vx += enemy.vx > 0 ? 0.35 : -0.35;
    if (enemy.bossHealth <= 0) enemy.defeated = true;
    return true;
  }

  function unlockBossGate() {
    if (!bossGate) return;
    bossGate.solid = false;
    bossGate.style = 'gateOpen';
  }

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = projectiles[i];
      if (!projectile.active) {
        projectiles.splice(i, 1);
        continue;
      }

      projectile.x += projectile.vx;
      projectile.y += projectile.vy;
      if (projectile.type === 'fireball') {
        projectile.y += Math.sin(frame * 0.22 + projectile.phase) * 1.2;
      }

      if (projectile.x < cameraX - 120 || projectile.x > cameraX + WIDTH + 220 || projectile.y < -100 || projectile.y > HEIGHT + 140) {
        projectile.active = false;
        projectiles.splice(i, 1);
        continue;
      }

      if (overlapsPlayerRect(projectile.x - projectile.w * 0.5, projectile.y - projectile.h * 0.5, projectile.w, projectile.h)) {
        if (player.starFrames > 0) {
          projectile.active = false;
          projectiles.splice(i, 1);
        } else {
          takeDamage();
          return;
        }
      }
    }
  }

  function updateHazards() {
    for (const hazard of hazards) {
      if (hazard.active && overlapsPlayerRect(hazard.x, hazard.y, hazard.w, hazard.h)) {
        if (player.starFrames === 0) {
          loseLife();
          return;
        }
      }
    }
  }

  function updateGoal() {
    if (bossEnemy && bossEnemy.defeated) unlockBossGate();

    if (player.x <= levelEndX) return;

    if (currentLevel === totalLevels) {
      if (!bossEnemy || bossEnemy.defeated) {
        score += 1200 + lives * 250;
        finishRun(GAME_STATE_WIN, `SuperJason abgeschlossen. Endstand ${score}.`);
      }
      return;
    }

    score += 500 + lives * 100;
    carriedPowerLevel = player.powerLevel;
    levelCleared = true;
    state = LEVEL_CLEAR_STATE;
    onStatus(`Level geschafft. Weiter zu ${levelNames[currentLevel]}.`);
  }

  function takeDamage() {
    if (player.starFrames > 0 || player.invincibleFrames > 0) return;

    if (player.powerLevel > 0) {
      setPlayerPowerLevel(player, player.powerLevel - 1);
      player.invincibleFrames = 110;
      player.vx *= -0.4;
      score = Math.max(0, score - 100);
      carriedPowerLevel = player.powerLevel;
    } else {
      loseLife();
    }
  }

  function loseLife() {
    lives -= 1;
    carriedPowerLevel = 0;
    score = Math.max(0, score - 200);
    if (lives <= 0) {
      finishRun(GAME_STATE_GAME_OVER, `Game Over. Endstand ${score}.`);
      return;
    }

    loadLevel(currentLevel);
    player.invincibleFrames = 90;
    state = GAME_STATE_PLAYING;
    onStatus(`Noch ${lives} Leben uebrig.`);
  }

  function finishRun(nextState, message) {
    state = nextState;
    levelCleared = false;
    if (!scoreSent) {
      scoreSent = true;
      void onScore(score);
    }
    onStatus(message);
  }

  function render() {
    drawSuperSky();
    pushWorld();
    drawSuperBackdrop();
    hazards.forEach(drawHazard);
    platforms.forEach(drawPlatform);
    drawGoal();
    coins.forEach(drawCoin);
    powerUps.forEach(drawPowerUp);
    enemies.forEach(drawEnemy);
    projectiles.forEach(drawProjectile);
    if (player) drawPlayer();
    popWorld();
    drawHud();

    if (state === GAME_STATE_MENU) {
      drawMenuOverlay();
    } else if (state === LEVEL_CLEAR_STATE) {
      drawOverlay(`Level geschafft!`, `Druecke N oder Enter fuer ${currentLevel < totalLevels ? levelNames[currentLevel] : 'den Abspann'}`, `Aktueller Score: ${score}`, 'WEITER');
    } else if (state === GAME_STATE_GAME_OVER) {
      drawOverlay('GAME OVER', 'Die Leben sind aufgebraucht.', `Endstand: ${score}`, 'NEUSTART', '#ff6b6b');
    } else if (state === GAME_STATE_WIN) {
      drawOverlay('SIEG!', 'SuperJason besiegt den Koenig der Festung.', `Endstand: ${score}`, 'NOCHMAL', '#ffd86a');
    }
  }

  function pushWorld() {
    ctx.save();
    ctx.translate(-cameraX, 0);
  }

  function popWorld() {
    ctx.restore();
  }

  function drawSuperSky() {
    if (currentTheme === 'castle') {
      ctx.fillStyle = '#212436';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'rgba(82, 86, 110, 0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f8c354';
      ctx.beginPath();
      ctx.ellipse(WIDTH - 140, 120, 45, 45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#6ebeff';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      drawCloud(ctx, 180 - cameraX * 0.18, 110, 110);
      drawCloud(ctx, 520 - cameraX * 0.18, 170, 90);
      drawCloud(ctx, 920 - cameraX * 0.18, 95, 120);
      drawCloud(ctx, 1220 - cameraX * 0.18, 150, 100);
    }
  }

  function drawSuperBackdrop() {
    ctx.save();
    if (currentTheme === 'castle') {
      ctx.fillStyle = '#353848';
      ctx.fillRect(-200, HEIGHT - 170, levelEndX + 700, 90);

      for (let i = -1; i < 16; i += 1) {
        const towerX = i * 300;
        ctx.fillStyle = '#4b4e63';
        ctx.fillRect(towerX, 180, 140, HEIGHT - 268);
        for (let w = 0; w < 3; w += 1) {
          ctx.fillStyle = 'rgba(251, 197, 91, 0.9)';
          roundedRect(ctx, towerX + 24 + w * 34, 230, 18, 42, 6, 'rgba(251, 197, 91, 0.9)');
        }
        ctx.fillStyle = '#64677c';
        ctx.beginPath();
        ctx.moveTo(towerX - 10, 180);
        ctx.lineTo(towerX + 70, 110);
        ctx.lineTo(towerX + 150, 180);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#6bc352';
      ctx.fillRect(-200, HEIGHT - 140, levelEndX + 500, 70);

      ctx.fillStyle = '#51a844';
      drawHill(260, HEIGHT - 90, 340, 220);
      drawHill(980, HEIGHT - 110, 420, 260);
      drawHill(1820, HEIGHT - 100, 360, 240);
      drawHill(2760, HEIGHT - 105, 400, 250);
      drawHill(3380, HEIGHT - 95, 360, 230);

      ctx.fillStyle = '#f4d472';
      drawMountain(120, HEIGHT - 88, 230, 390, 340, HEIGHT - 88);
      drawMountain(780, HEIGHT - 88, 930, 330, 1080, HEIGHT - 88);
      drawMountain(1670, HEIGHT - 88, 1820, 350, 1970, HEIGHT - 88);
      drawMountain(2620, HEIGHT - 88, 2780, 320, 2940, HEIGHT - 88);
      drawMountain(3240, HEIGHT - 88, 3380, 340, 3520, HEIGHT - 88);

      ctx.fillStyle = '#d0eb70';
      drawHill(240, HEIGHT - 120, 100, 120);
      drawHill(980, HEIGHT - 138, 120, 140);
      drawHill(1830, HEIGHT - 132, 118, 138);
      drawHill(2810, HEIGHT - 142, 122, 150);
      drawHill(3380, HEIGHT - 128, 116, 134);
    }
    ctx.restore();
  }

  function drawHill(x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMountain(x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }

  function drawGoal() {
    if (currentTheme === 'castle') {
      roundedRect(ctx, levelEndX + 20, HEIGHT - 250, 150, 162, 10, '#46424a');
      ctx.fillStyle = '#6a6670';
      ctx.beginPath();
      ctx.moveTo(levelEndX - 10, HEIGHT - 250);
      ctx.lineTo(levelEndX + 95, HEIGHT - 360);
      ctx.lineTo(levelEndX + 200, HEIGHT - 250);
      ctx.closePath();
      ctx.fill();
      roundedRect(ctx, levelEndX + 72, HEIGHT - 195, 46, 58, 6, '#ffc860');
      ctx.fillStyle = '#e45c28';
      ctx.beginPath();
      ctx.moveTo(levelEndX + 95, HEIGHT - 290);
      ctx.lineTo(levelEndX + 160, HEIGHT - 260);
      ctx.lineTo(levelEndX + 95, HEIGHT - 228);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.strokeStyle = '#ebebeb';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(levelEndX, 150);
      ctx.lineTo(levelEndX, HEIGHT - 88);
      ctx.stroke();
      roundedRect(ctx, levelEndX - 20, 130, 40, 20, 8, '#ffe655');
      ctx.fillStyle = '#d41a1c';
      ctx.beginPath();
      ctx.moveTo(levelEndX, 155);
      ctx.lineTo(levelEndX + 120, 195);
      ctx.lineTo(levelEndX, 235);
      ctx.closePath();
      ctx.fill();
      roundedRect(ctx, levelEndX + 170, HEIGHT - 250, 120, 162, 10, '#7e4d2e');
      ctx.fillStyle = '#a76941';
      ctx.beginPath();
      ctx.moveTo(levelEndX + 150, HEIGHT - 250);
      ctx.lineTo(levelEndX + 230, HEIGHT - 340);
      ctx.lineTo(levelEndX + 310, HEIGHT - 250);
      ctx.closePath();
      ctx.fill();
      roundedRect(ctx, levelEndX + 202, HEIGHT - 205, 56, 48, 6, '#fff2aa');
    }
  }

  function powerLabel() {
    if (player.starFrames > 0) return 'STAR';
    if (player.powerLevel > 0) return 'SUPER';
    return 'NORMAL';
  }

  function drawHud() {
    roundedRect(ctx, 24, 20, 560, 120, 18, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('SUPERJASON', 44, 34);
    ctx.font = '18px Arial';
    ctx.fillText(`Level: ${levelNames[currentLevel - 1] || 'Arcade'}`, 44, 68);
    ctx.fillText(`Score: ${score}`, 44, 94);
    ctx.fillText(`Rekord: ${activeHighScore}`, 200, 94);
    ctx.fillText(`Leben: ${lives}`, 392, 94);
    ctx.fillText(`Power: ${player ? powerLabel() : 'NORMAL'}`, 490, 94);

    roundedRect(ctx, WIDTH - 430, 20, 382, 120, 18, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = '#fff6b7';
    ctx.fillText('A/D oder Pfeile bewegen', WIDTH - 404, 34);
    ctx.fillText('W, hoch oder Leertaste springen', WIDTH - 404, 59);
    ctx.fillText('N/Enter weiter, R Neustart', WIDTH - 404, 84);
    ctx.fillText('Sammle Coins und hol den Boss runter', WIDTH - 404, 109);

    if (bossEnemy && !bossEnemy.defeated) {
      roundedRect(ctx, WIDTH * 0.5 - 220, 18, 440, 58, 18, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = '#ffd25a';
      ctx.textAlign = 'center';
      ctx.font = '20px Arial';
      ctx.fillText('Festungskoenig HP', WIDTH * 0.5, 28);
      roundedRect(ctx, WIDTH * 0.5 - 150, 50, 300, 12, 8, '#5a241a');
      roundedRect(ctx, WIDTH * 0.5 - 150, 50, 300 * (bossEnemy.bossHealth / bossEnemy.bossMaxHealth), 12, 8, '#e45c28');
    }
  }

  function drawMenuOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    roundedRect(ctx, WIDTH / 2 - 330, HEIGHT / 2 - 190, 660, 380, 26, 'rgba(18, 22, 34, 0.9)');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff4bf';
    ctx.font = 'bold 58px Arial';
    ctx.fillText('SUPERJASON', WIDTH / 2, HEIGHT / 2 - 110);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`${label} kaempft sich durch 9 Level bis ins Endschloss.`, WIDTH / 2, HEIGHT / 2 - 44);
    ctx.fillText('Coins sammeln, Power-ups holen und den Boss im letzten Abschnitt legen.', WIDTH / 2, HEIGHT / 2 - 10);
    drawButton(ctx, pointer, WIDTH / 2, HEIGHT / 2 + 85, 280, 58, 'STARTEN', '#2EAE2E', '#4ADE4A');
    ctx.fillStyle = '#d8dfeb';
    ctx.font = '18px Arial';
    ctx.fillText('Touch: links, Sprung, rechts', WIDTH / 2, HEIGHT / 2 + 142);
  }

  function drawOverlay(title, subtitle, scoreLine, buttonLabel, accentColor = '#ffe682') {
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    roundedRect(ctx, WIDTH / 2 - 340, HEIGHT / 2 - 150, 680, 300, 24, 'rgba(20, 24, 36, 0.94)');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 52px Arial';
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 - 20);
    ctx.fillStyle = '#ffe682';
    ctx.fillText(scoreLine, WIDTH / 2, HEIGHT / 2 + 22);
    drawButton(ctx, pointer, WIDTH / 2, HEIGHT / 2 + 88, currentLevel < totalLevels && state === LEVEL_CLEAR_STATE ? 320 : 260, 54, buttonLabel, '#2EAE2E', '#4ADE4A');
  }

  function drawPlatform(platform) {
    if (platform.style === 'ground') {
      ctx.fillStyle = '#9f6036';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#704328';
      ctx.fillRect(platform.x, platform.y + 20, platform.w, platform.h - 20);
      ctx.strokeStyle = '#5e341d';
      ctx.lineWidth = 1;
      for (let px = platform.x; px < platform.x + platform.w; px += 24) {
        ctx.beginPath();
        ctx.moveTo(px, platform.y + 18);
        ctx.lineTo(px + 14, platform.y + platform.h - 10);
        ctx.stroke();
      }
      return;
    }

    if (platform.style === 'brick') {
      roundedRect(ctx, platform.x, platform.y, platform.w, platform.h, 3, '#c27a36');
      ctx.strokeStyle = '#975622';
      for (let py = platform.y + 12; py < platform.y + platform.h; py += 12) {
        ctx.beginPath();
        ctx.moveTo(platform.x, py);
        ctx.lineTo(platform.x + platform.w, py);
        ctx.stroke();
      }
      for (let px = platform.x + 20; px < platform.x + platform.w; px += 40) {
        ctx.beginPath();
        ctx.moveTo(px, platform.y);
        ctx.lineTo(px, platform.y + platform.h);
        ctx.stroke();
      }
      return;
    }

    if (platform.style === 'question') {
      roundedRect(ctx, platform.x, platform.y, platform.w, platform.h, 4, '#f6c63f');
      roundedRect(ctx, platform.x + 12, platform.y + 6, platform.w - 24, platform.h - 12, 4, '#c08812');
      ctx.fillStyle = '#fff7db';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', platform.x + platform.w * 0.5, platform.y + platform.h * 0.52);
      return;
    }

    if (platform.style === 'pipe') {
      roundedRect(ctx, platform.x, platform.y - 36, platform.w, platform.h + 36, 8, '#24a138');
      roundedRect(ctx, platform.x - 12, platform.y - 54, platform.w + 24, 20, 8, '#38c253');
      roundedRect(ctx, platform.x + platform.w * 0.62, platform.y - 54, 14, platform.h + 54, 5, '#127022');
      return;
    }

    if (platform.style === 'castle') {
      roundedRect(ctx, platform.x, platform.y, platform.w, platform.h, 3, '#6a6774');
      ctx.fillStyle = '#54515d';
      for (let py = platform.y + 12; py < platform.y + platform.h; py += 12) {
        ctx.fillRect(platform.x, py, platform.w, 2);
      }
      for (let px = platform.x + 18; px < platform.x + platform.w; px += 36) {
        ctx.fillRect(px, platform.y, 3, platform.h);
      }
      return;
    }

    if (platform.style === 'steel') {
      roundedRect(ctx, platform.x, platform.y, platform.w, platform.h, 3, '#9197a3');
      roundedRect(ctx, platform.x + 6, platform.y + 6, platform.w - 12, platform.h - 12, 3, '#585f6c');
      for (let px = platform.x + 18; px < platform.x + platform.w; px += 34) {
        ctx.fillStyle = '#d2d6de';
        ctx.beginPath();
        ctx.ellipse(px, platform.y + platform.h * 0.5, 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (platform.style === 'cloud') {
      roundedRect(ctx, platform.x, platform.y + 6, platform.w, platform.h - 6, 18, 'rgba(255,255,255,0.96)');
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      ctx.beginPath();
      ctx.ellipse(platform.x + 20, platform.y + 10, 18, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(platform.x + 52, platform.y, 22, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(platform.x + 88, platform.y + 6, 19, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(platform.x + platform.w - 30, platform.y + 10, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (platform.style === 'castleFloor') {
      ctx.fillStyle = '#4a4954';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#37353f';
      ctx.fillRect(platform.x, platform.y + 18, platform.w, platform.h - 18);
      for (let px = platform.x; px < platform.x + platform.w; px += 30) {
        ctx.fillStyle = '#74717f';
        ctx.fillRect(px, platform.y, 18, 12);
      }
      return;
    }

    if (platform.style === 'gate') {
      roundedRect(ctx, platform.x, platform.y, platform.w, platform.h, 5, '#947834');
      ctx.fillStyle = '#523e1c';
      for (let py = platform.y + 12; py < platform.y + platform.h; py += 18) {
        ctx.fillRect(platform.x + 4, py, platform.w - 8, 4);
      }
      return;
    }

    if (platform.style === 'gateOpen') {
      ctx.strokeStyle = 'rgba(255, 215, 120, 0.42)';
      ctx.lineWidth = 3;
      pathRoundedRect(ctx, platform.x, platform.y, platform.w, platform.h, 5);
      ctx.stroke();
    }
  }

  function drawCoin(coin) {
    if (coin.collected) return;
    const bob = Math.sin(frame * 0.12 + coin.bobOffset) * 5;
    ctx.strokeStyle = '#e0a000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#ffde3a';
    ctx.beginPath();
    ctx.ellipse(coin.x, coin.y + bob, 13, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(coin.x, coin.y + bob - 12);
    ctx.lineTo(coin.x, coin.y + bob + 12);
    ctx.stroke();
  }

  function drawPowerUp(powerUp) {
    if (powerUp.collected) return;
    ctx.save();
    ctx.translate(powerUp.x, powerUp.y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (powerUp.type === 'super') {
      ctx.fillStyle = '#e46044';
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      roundedRect(ctx, -15, 2, 30, 12, 8, '#ffecc4');
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-8, -4, 3, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(8, -4, 3, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (powerUp.type === 'star') {
      ctx.fillStyle = '#ffe05c';
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const radius = i % 2 === 0 ? 18 : 8;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (powerUp.type === 'heart') {
      ctx.fillStyle = '#ff545e';
      ctx.beginPath();
      ctx.ellipse(-6, -4, 8, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(6, -4, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, 0);
      ctx.lineTo(0, 22);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEnemy(enemy) {
    if (enemy.defeated) return;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.noStroke = true;

    if (enemy.type === 'armor') {
      ctx.fillStyle = '#707684';
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.w / 2, enemy.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#40454f';
      roundedRect(ctx, -enemy.w * 0.38, enemy.h * 0.12, enemy.w * 0.28, enemy.h * 0.26, 4, '#40454f');
      roundedRect(ctx, enemy.w * 0.1, enemy.h * 0.12, enemy.w * 0.28, enemy.h * 0.26, 4, '#40454f');
      drawEnemyEyes(enemy);
      ctx.fillStyle = '#a4aab6';
      drawHorn(-enemy.w * 0.16);
      drawHorn(enemy.w * 0.16);
    } else if (enemy.type === 'boss') {
      ctx.fillStyle = enemy.hitCooldown > 0 && frame % 6 < 3 ? '#ffd878' : '#a04824';
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.w / 2, enemy.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#74c448';
      ctx.beginPath();
      ctx.ellipse(0, -8, enemy.w * 0.45, enemy.h * 0.4, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      roundedRect(ctx, -28, 4, 56, 18, 10, '#f6daa0');
      drawEnemyEyes(enemy, 12, 14);
      ctx.fillStyle = '#f8eebc';
      drawHorn(-22);
      drawHorn(22);
      roundedRect(ctx, -34, 16, 20, 14, 5, '#78381c');
      roundedRect(ctx, 14, 16, 20, 14, 5, '#78381c');
    } else if (enemy.type === 'spike') {
      ctx.fillStyle = '#567834';
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.w / 2, enemy.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dee6b4';
      drawSpike(-12);
      drawSpike(2);
      drawEnemyEyes(enemy);
    } else if (enemy.type === 'flyer') {
      ctx.fillStyle = '#a4622c';
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.w / 2, (enemy.h - 6) / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff8dc';
      drawWing(-12);
      drawWing(12, true);
      drawEnemyEyes(enemy);
    } else {
      ctx.fillStyle = '#7e4d2e';
      ctx.beginPath();
      ctx.ellipse(0, 0, enemy.w / 2, enemy.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      roundedRect(ctx, -18, 8, 14, 12, 4, '#60381d');
      roundedRect(ctx, 4, 8, 14, 12, 4, '#60381d');
      drawEnemyEyes(enemy);
      ctx.strokeStyle = '#5c2b14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 3, 8, 0, Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawEnemyEyes(enemy, eyeW = 10, eyeH = 12) {
    roundedRect(ctx, -enemy.w * 0.26, -enemy.h * 0.2, eyeW, eyeH, 2, '#ffffff');
    roundedRect(ctx, enemy.w * 0.02, -enemy.h * 0.2, eyeW, eyeH, 2, '#ffffff');
    roundedRect(ctx, -enemy.w * 0.22, -enemy.h * 0.14, 4, 5, 1, '#1e1e1e');
    roundedRect(ctx, enemy.w * 0.06, -enemy.h * 0.14, 4, 5, 1, '#1e1e1e');
  }

  function drawHorn(x) {
    ctx.beginPath();
    ctx.moveTo(x - 8, -24);
    ctx.lineTo(x, -44);
    ctx.lineTo(x + 8, -24);
    ctx.closePath();
    ctx.fill();
  }

  function drawSpike(x) {
    ctx.beginPath();
    ctx.moveTo(x, -14);
    ctx.lineTo(x + 8, -28);
    ctx.lineTo(x + 16, -14);
    ctx.closePath();
    ctx.fill();
  }

  function drawWing(x, mirror = false) {
    ctx.beginPath();
    ctx.moveTo(x, -2);
    ctx.lineTo(x + (mirror ? 16 : -16), -18);
    ctx.lineTo(x + (mirror ? 8 : -8), 4);
    ctx.closePath();
    ctx.fill();
  }

  function drawHazard(hazard) {
    if (!hazard.active || hazard.type !== 'lava') return;
    ctx.fillStyle = '#b92c10';
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    ctx.fillStyle = '#ff801c';
    for (let px = hazard.x + 10; px < hazard.x + hazard.w; px += 36) {
      ctx.beginPath();
      ctx.ellipse(px, hazard.y + 18 + Math.sin(frame * 0.16 + px * 0.05) * 6, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawProjectile(projectile) {
    if (!projectile.active) return;
    if (projectile.type === 'fireball') {
      ctx.fillStyle = '#ffb63e';
      ctx.beginPath();
      ctx.ellipse(projectile.x, projectile.y, projectile.w / 2, projectile.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e44812';
      ctx.beginPath();
      ctx.ellipse(projectile.x, projectile.y, projectile.w * 0.275, projectile.h * 0.275, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer() {
    if (player.invincibleFrames > 0 && player.starFrames === 0 && frame % 8 < 4) return;

    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.starFrames > 0) {
      ctx.fillStyle = 'rgba(255, 246, 124, 0.42)';
      ctx.beginPath();
      ctx.ellipse(0, -4, (player.w + 18) / 2, (player.h + 20) / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (sprite.complete && sprite.naturalWidth > 0) {
      const headRadius = player.powerLevel > 0 ? 24 : 21;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -20 - player.powerLevel * 4, headRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(sprite, -headRadius, -20 - player.powerLevel * 4 - headRadius, headRadius * 2, headRadius * 2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.82)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -20 - player.powerLevel * 4, headRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffd6b0';
      ctx.beginPath();
      ctx.ellipse(0, -20 - player.powerLevel * 4, 21, 21, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    roundedRect(ctx, -21, 4 - player.powerLevel * 3, 42, 22 + player.powerLevel * 6, 4, '#3aaa92');
    roundedRect(ctx, -9, 8 - player.powerLevel * 3, 18, 8, 4, '#f2e1bb');
    roundedRect(ctx, -22, 2 - player.powerLevel * 3, 8, 22, 4, '#f1b240');
    roundedRect(ctx, 14, 2 - player.powerLevel * 3, 8, 22, 4, '#f1b240');
    roundedRect(ctx, -20, 24, 14, 26 + player.powerLevel * 3, 4, '#425466');
    roundedRect(ctx, 6, 24, 14, 26 + player.powerLevel * 3, 4, '#425466');
    roundedRect(ctx, -22, 47 + player.powerLevel * 3, 16, 8, 3, '#f0f0f0');
    roundedRect(ctx, 6, 47 + player.powerLevel * 3, 16, 8, 3, '#f0f0f0');
    ctx.restore();
  }

  return {
    onActivate,
    handleKeyDown,
    handleKeyUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleTouchAction,
    tick,
    render
  };

  function mix(start, end, amount) {
    return start + (end - start) * amount;
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
}

function createMonkeyKongGame({ onStatus, onScore, sprite, label }) {
  const WIDTH = 960;
  const HEIGHT = 640;
  const STATE_MENU = 0;
  const STATE_PLAYING = 1;
  const STATE_LEVEL_CLEAR = 2;
  const STATE_GAME_OVER = 3;
  const STATE_CAMPAIGN_CLEAR = 4;
  const pointer = { x: -9999, y: -9999 };

  let platforms = [];
  let ladders = [];
  let barrels = [];
  let sparks = [];
  let floatingTexts = [];
  let levels = [];
  let player = null;
  let boss = null;
  let goal = null;
  let leftPressed = false;
  let rightPressed = false;
  let upPressed = false;
  let downPressed = false;
  let gameState = STATE_MENU;
  let score = 0;
  let highScore = 0;
  let currentLevelIndex = 0;
  let lives = 3;
  let lastSpawnFrame = 0;
  let barrelInterval = 90;
  let barrelFloor = 52;
  let levelClearFrame = -1;
  let soundEnabled = true;
  let frame = 0;
  let scoreSent = false;

  function onActivate() {
    levels = buildLevels();
    score = 0;
    highScore = Math.max(activeHighScore || 0, 0);
    currentLevelIndex = 0;
    lives = 3;
    leftPressed = false;
    rightPressed = false;
    upPressed = false;
    downPressed = false;
    gameState = STATE_MENU;
    scoreSent = false;
    frame = 0;
    loadLevel(currentLevelIndex, true);
    onStatus('MonkeyKong ist bereit.');
  }

  function buildLevels() {
    return [
      makeLevel(
        [
          [60, 560, 840, 26, 1],
          [110, 458, 700, 22, -1],
          [155, 356, 700, 22, 1],
          [110, 254, 700, 22, -1],
          [160, 152, 700, 22, 1],
          [90, 70, 250, 18, 0]
        ],
        [
          [220, 480, 80],
          [730, 378, 80],
          [260, 276, 80],
          [710, 174, 80],
          [250, 88, 64]
        ],
        100, 520, 190, 18, 250, 22,
        92, 60, 3.0, 0.10, 'Docks', [96, 178, 214], [20, 24, 44]
      ),
      makeLevel(
        [
          [50, 560, 860, 26, -1],
          [135, 468, 670, 22, 1],
          [85, 376, 690, 22, -1],
          [190, 284, 620, 22, 1],
          [120, 192, 670, 22, -1],
          [220, 98, 220, 18, 0]
        ],
        [
          [710, 482, 78],
          [210, 390, 78],
          [670, 298, 78],
          [255, 206, 78],
          [330, 116, 76]
        ],
        820, 520, 250, 22, 360, 48,
        80, 50, 3.7, 0.16, 'Factory', [245, 161, 75], [58, 26, 28]
      ),
      makeLevel(
        [
          [45, 564, 870, 24, 1],
          [180, 482, 620, 22, -1],
          [90, 400, 640, 22, 1],
          [245, 318, 560, 22, -1],
          [135, 236, 620, 22, 1],
          [290, 154, 490, 22, -1],
          [160, 82, 250, 18, 0]
        ],
        [
          [250, 492, 72],
          [660, 410, 72],
          [300, 328, 72],
          [620, 246, 72],
          [365, 164, 72],
          [250, 100, 60]
        ],
        90, 522, 130, 26, 235, 34,
        68, 42, 4.3, 0.24, 'Summit', [145, 224, 188], [24, 30, 62]
      ),
      makeLevel(
        [
          [36, 568, 888, 24, -1],
          [130, 500, 690, 20, 1],
          [60, 432, 700, 20, -1],
          [215, 364, 590, 20, 1],
          [120, 296, 640, 20, -1],
          [270, 228, 520, 20, 1],
          [170, 160, 590, 20, -1],
          [310, 92, 260, 18, 0]
        ],
        [
          [715, 510, 66],
          [220, 442, 66],
          [660, 374, 66],
          [265, 306, 66],
          [615, 238, 66],
          [305, 170, 66],
          [400, 108, 62]
        ],
        830, 526, 310, 14, 435, 42,
        56, 34, 5.0, 0.34, 'Panic', [243, 116, 90], [35, 14, 18]
      ),
      makeLevel(
        [
          [44, 568, 872, 24, 0],
          [100, 486, 290, 20, 1],
          [560, 486, 300, 20, -1],
          [210, 394, 250, 20, -1],
          [510, 394, 250, 20, 1],
          [300, 302, 360, 20, 0],
          [220, 210, 520, 20, 0],
          [300, 118, 360, 18, 0]
        ],
        [
          [312, 488, 84],
          [612, 488, 84],
          [350, 396, 84],
          [572, 396, 84],
          [452, 304, 84],
          [452, 212, 84],
          [452, 120, 74]
        ],
        96, 526, 390, 52, -500, -500,
        52, 30, 5.4, 0.44, 'Throne', [112, 58, 36], [16, 10, 14],
        true, 6, 320, 520
      )
    ];
  }

  function makeLevel(platformData, ladderData, playerStartX, playerStartY, bossX, bossY, goalX, goalY, startInterval, minInterval, barrelSpeed, extraSpawnChance, name, skyTop, skyBottom, bossFight = false, bossHealth = 0, bossArenaMinX = bossX, bossArenaMaxX = bossX) {
    return {
      platformData,
      ladderData,
      playerStartX,
      playerStartY,
      bossX,
      bossY,
      goalX,
      goalY,
      startInterval,
      minInterval,
      barrelSpeed,
      extraSpawnChance,
      name,
      skyTop,
      skyBottom,
      bossFight,
      bossHealth,
      bossArenaMinX,
      bossArenaMaxX
    };
  }

  function startCampaign() {
    score = 0;
    highScore = Math.max(highScore, activeHighScore || 0);
    lives = 3;
    currentLevelIndex = 0;
    scoreSent = false;
    loadLevel(currentLevelIndex, true);
    gameState = STATE_PLAYING;
    onStatus(`${label} startet MonkeyKong.`);
  }

  function loadLevel(levelIndex, resetPlayerState) {
    const level = levels[levelIndex];
    platforms = level.platformData.map(data => createPlatform(...data));
    ladders = level.ladderData.map(data => createLadder(...data));
    barrels = [];
    sparks = [];
    floatingTexts = [];
    player = createPlayer(level.playerStartX, level.playerStartY);
    boss = createMonkeyBoss(level.bossX, level.bossY, level);
    goal = createGoal(level.goalX, level.goalY);

    if (resetPlayerState) {
      player.vx = 0;
      player.vy = 0;
    }

    barrelInterval = level.startInterval;
    barrelFloor = level.minInterval;
    lastSpawnFrame = frame;
    levelClearFrame = -1;
  }

  function createPlatform(x, y, w, h, slope) {
    return { x, y, w, h, slope };
  }

  function platformTopYAt(platform, px) {
    const t = clamp((px - platform.x) / platform.w, 0, 1);
    return platform.y + mapRange(t, 0, 1, 12 * platform.slope, -12 * platform.slope);
  }

  function createLadder(x, y, h) {
    return { x, y, h, w: 36 };
  }

  function createGoal(x, y) {
    return { x, y, w: 82, h: 48 };
  }

  function createMonkeyBoss(x, y, level) {
    return {
      x,
      y,
      baseY: y,
      arenaMinX: level.bossArenaMinX,
      arenaMaxX: level.bossArenaMaxX,
      moveSpeed: 1.5,
      dir: 1,
      hurtFrames: 0,
      health: level.bossFight ? Math.max(1, level.bossHealth) : 1,
      maxHealth: level.bossFight ? Math.max(1, level.bossHealth) : 1,
      bossFight: level.bossFight
    };
  }

  function bossDefeated() {
    return boss.bossFight && boss.health <= 0;
  }

  function updateBoss() {
    if (!boss.bossFight || bossDefeated()) return;
    if (boss.hurtFrames > 0) boss.hurtFrames -= 1;
    boss.x += boss.dir * boss.moveSpeed;
    if (boss.x < boss.arenaMinX) {
      boss.x = boss.arenaMinX;
      boss.dir = 1;
    } else if (boss.x > boss.arenaMaxX) {
      boss.x = boss.arenaMaxX;
      boss.dir = -1;
    }
    boss.y = boss.baseY + Math.sin(frame * 0.08) * 4;
  }

  function bossCollidesWithPlayer() {
    if (bossDefeated()) return false;
    const bx = boss.x + 24;
    const by = boss.y + 12;
    const bw = 92;
    const bh = 64;
    return player.x < bx + bw && player.x + player.w > bx && player.y < by + bh && player.y + player.h > by;
  }

  function bossCanBeStompedByPlayer() {
    if (!boss.bossFight || boss.hurtFrames > 0 || bossDefeated()) return false;
    const bx = boss.x + 28;
    const bw = 84;
    const top = boss.y + 16;
    const feet = player.y + player.h;
    return player.vy > 0
      && player.x + player.w > bx
      && player.x < bx + bw
      && feet >= top - 10
      && feet <= top + 22
      && player.y < top - 2;
  }

  function bossTakeHit() {
    if (!boss.bossFight || boss.hurtFrames > 0) return;
    boss.health -= 1;
    boss.hurtFrames = 40;
    boss.dir *= -1;
    boss.moveSpeed = Math.min(boss.moveSpeed + 0.12, 2.5);
  }

  function createPlayer(x, y) {
    return {
      x,
      y,
      w: 30,
      h: 42,
      vx: 0,
      vy: 0,
      grounded: false,
      climbing: false,
      ladderExitFrames: 0
    };
  }

  function updatePlayer() {
    let move = 0;
    if (leftPressed) move -= 1;
    if (rightPressed) move += 1;
    player.vx = move * 3.2;

    let ladder = touchingLadder(player.x, player.y, player.w, player.h);
    if (!ladder && (upPressed || downPressed)) {
      ladder = ladderForClimbInput(player.x, player.y, player.w, player.h);
    }

    let exitPlatform = platformAtFeet(player.x, player.y, player.w, player.h, 24, 22);
    player.climbing = Boolean(ladder && (upPressed || downPressed));

    if (player.climbing) {
      player.ladderExitFrames = 8;
      player.vy = 0;
      if (upPressed) player.y -= 2.6;
      if (downPressed) player.y += 2.6;
      player.x = lerpValue(player.x, ladder.x + ladder.w * 0.5 - player.w * 0.5, 0.28);

      exitPlatform = platformAtFeet(player.x, player.y, player.w, player.h, 24, 22);
      const nearLadderTop = player.y <= ladder.y + 6;
      if (upPressed && nearLadderTop && exitPlatform) {
        player.y = platformTopYAt(exitPlatform, player.x + player.w * 0.5) - player.h;
        player.vy = 0;
        player.grounded = true;
        player.climbing = false;
      }
    } else {
      if (player.ladderExitFrames > 0) {
        const supportPlatform = platformAtFeet(player.x, player.y, player.w, player.h, 28, 26);
        if (supportPlatform) {
          const top = platformTopYAt(supportPlatform, player.x + player.w * 0.5);
          player.y = top - player.h;
          player.vy = 0;
          player.grounded = true;
        } else {
          player.vy += 0.42;
        }
        player.ladderExitFrames -= 1;
      } else {
        player.vy += 0.42;
      }

      if (player.vy > 8) player.vy = 8;
    }

    player.x += player.vx;
    player.x = clamp(player.x, 20, WIDTH - player.w - 20);
    player.y += player.vy;

    player.grounded = false;
    if (!player.climbing) {
      const landingPlatform = platformAtFeet(player.x, player.y, player.w, player.h, 24, 22);
      if (landingPlatform && player.vy >= 0) {
        const top = platformTopYAt(landingPlatform, player.x + player.w * 0.5);
        player.y = top - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }
  }

  function playerTryJump() {
    if (player.grounded && !player.climbing) {
      player.vy = -8.8;
      player.grounded = false;
    }
  }

  function playerBounceAfterStomp() {
    player.vy = -7.2;
    player.grounded = false;
  }

  function snapPlayerToLadder(ladder) {
    player.x = ladder.x + ladder.w * 0.5 - player.w * 0.5;
    if (Math.abs(player.vy) < 1.5) {
      player.vy = 0;
    }
  }

  function playerHitsBarrel(barrel) {
    return player.x < barrel.x + barrel.size
      && player.x + player.w > barrel.x
      && player.y < barrel.y + barrel.size
      && player.y + player.h > barrel.y;
  }

  function playerReachedGoal() {
    return player.x + player.w > goal.x + 10
      && player.x < goal.x + goal.w - 10
      && player.y < goal.y + goal.h
      && player.y + player.h > goal.y;
  }

  function createBarrel(x, y, speed) {
    const barrel = {
      x,
      y,
      size: 24,
      vx: speed,
      targetSpeed: speed,
      spin: 0,
      jumpAwarded: false
    };
    const platform = platformUnder(barrel.x, barrel.y + 12);
    if (platform && platform.slope < 0) {
      barrel.vx = -barrel.vx;
    }
    return barrel;
  }

  function updateBarrel(barrel) {
    const platform = platformUnder(barrel.x + barrel.size * 0.5, barrel.y + barrel.size + 8);
    if (platform) {
      const centerX = barrel.x + barrel.size * 0.5;
      const top = platformTopYAt(platform, centerX);
      barrel.y = top - barrel.size;
      const dir = platform.slope === 0 ? 1 : -platform.slope;
      barrel.vx = lerpValue(barrel.vx, dir * barrel.targetSpeed, 0.08);
    } else {
      barrel.y += 6.2;
    }

    barrel.x += barrel.vx;
    barrel.spin += barrel.vx * 0.15;
  }

  function barrelOffscreen(barrel) {
    return barrel.y > HEIGHT + 60 || barrel.x < -80 || barrel.x > WIDTH + 80;
  }

  function spawnBarrel() {
    const level = levels[currentLevelIndex];
    barrels.push(createBarrel(boss.x + 90, boss.y + 38, level.barrelSpeed));
  }

  function explode(x, y, color) {
    for (let i = 0; i < 24; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.5, 5.0);
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(20, 40),
        color
      });
    }
  }

  function addScore(amount, x, y, text) {
    score = Math.max(0, score + amount);
    highScore = Math.max(highScore, score, activeHighScore || 0);
    floatingTexts.push({ x, y, life: 50, label: text });
  }

  function platformUnder(px, py) {
    let best = null;
    let bestY = Number.POSITIVE_INFINITY;
    platforms.forEach(platform => {
      if (px >= platform.x - 8 && px <= platform.x + platform.w + 8) {
        const top = platformTopYAt(platform, px);
        if (top >= py - 10 && top < bestY) {
          bestY = top;
          best = platform;
        }
      }
    });
    return best;
  }

  function platformAtFeet(px, py, pw, ph, aboveTolerance, belowTolerance) {
    const footX = px + pw * 0.5;
    for (const platform of platforms) {
      if (footX >= platform.x && footX <= platform.x + platform.w) {
        const top = platformTopYAt(platform, footX);
        const feet = py + ph;
        if (feet >= top - aboveTolerance && feet <= top + belowTolerance) {
          return platform;
        }
      }
    }
    return null;
  }

  function ladderForClimbInput(px, py, pw, ph) {
    for (const ladder of ladders) {
      const centerX = px + pw * 0.5;
      const feetY = py + ph;
      const ladderCenterX = ladder.x + ladder.w * 0.5;
      const closeInX = Math.abs(centerX - ladderCenterX) <= 18;
      const closeInY = feetY >= ladder.y - 18 && py <= ladder.y + ladder.h + 10;
      if (closeInX && closeInY) {
        return ladder;
      }
    }
    return null;
  }

  function touchingLadder(px, py, pw, ph) {
    for (const ladder of ladders) {
      const centerX = px + pw * 0.5;
      const ladderCenterX = ladder.x + ladder.w * 0.5;
      const closeInX = Math.abs(centerX - ladderCenterX) <= 9;
      const closeInY = py + ph > ladder.y + 4 && py < ladder.y + ladder.h - 4;
      if (closeInX && closeInY) {
        return ladder;
      }
    }
    return null;
  }

  function updateSparks() {
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.08;
      spark.life -= 1;
      if (spark.life <= 0) {
        sparks.splice(i, 1);
      }
    }
  }

  function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
      const text = floatingTexts[i];
      text.y -= 0.7;
      text.life -= 1;
      if (text.life <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  function updateGame() {
    const level = levels[currentLevelIndex];

    updateBoss();

    if (frame - lastSpawnFrame >= barrelInterval) {
      spawnBarrel();
      lastSpawnFrame = frame;
      if (barrelInterval > barrelFloor) barrelInterval -= 1;
    }

    updatePlayer();

    if (level.bossFight && bossCanBeStompedByPlayer()) {
      bossTakeHit();
      playerBounceAfterStomp();
      addScore(300, boss.x + 70, boss.y - 10, '+300');
      if (bossDefeated()) {
        explode(boss.x + 70, boss.y + 40, [255, 120, 90]);
        addScore(2500, boss.x + 70, boss.y - 34, '+2500');
        gameState = STATE_LEVEL_CLEAR;
        levelClearFrame = frame;
        onStatus('Boss besiegt. Die Kampagne ist fast durch.');
        return;
      }
    } else if (level.bossFight && bossCollidesWithPlayer()) {
      playerHit();
      return;
    }

    for (let i = barrels.length - 1; i >= 0; i -= 1) {
      const barrel = barrels[i];
      updateBarrel(barrel);

      if (barrelOffscreen(barrel)) {
        barrels.splice(i, 1);
        addScore(5, barrel.x, Math.min(barrel.y, HEIGHT - 40), '+5');
        continue;
      }

      if (!barrel.jumpAwarded
        && player.vy > 0
        && player.y + player.h < barrel.y + 8
        && Math.abs((player.x + player.w * 0.5) - (barrel.x + barrel.size * 0.5)) < 22) {
        barrel.jumpAwarded = true;
        addScore(25, barrel.x, barrel.y - 12, '+25');
      }

      if (playerHitsBarrel(barrel)) {
        playerHit();
        return;
      }
    }

    updateSparks();
    updateFloatingTexts();

    if (!level.bossFight && playerReachedGoal()) {
      explode(goal.x + goal.w * 0.5, goal.y + goal.h * 0.5, [120, 255, 190]);
      const reward = 1000 + currentLevelIndex * 250;
      addScore(reward, goal.x + goal.w * 0.5, goal.y - 8, `+${reward}`);
      gameState = STATE_LEVEL_CLEAR;
      levelClearFrame = frame;
      onStatus(`Level ${currentLevelIndex + 1} geschafft.`);
      return;
    }

    if (!level.bossFight && Math.random() < level.extraSpawnChance / 60) {
      spawnBarrel();
    } else if (level.bossFight && Math.random() < level.extraSpawnChance / 75) {
      spawnBarrel();
    }
  }

  function playerHit() {
    explode(player.x + player.w * 0.5, player.y + player.h * 0.5, [255, 210, 90]);
    lives -= 1;

    if (lives <= 0) {
      gameState = STATE_GAME_OVER;
      finishScoreSubmission();
      onStatus(`Game Over mit ${score} Punkten.`);
    } else {
      addScore(-50, player.x, player.y - 10, '-50');
      loadLevel(currentLevelIndex, true);
      gameState = STATE_PLAYING;
      onStatus(`Autsch. Noch ${lives} Leben uebrig.`);
    }
  }

  function advanceLevel() {
    currentLevelIndex += 1;
    if (currentLevelIndex >= levels.length) {
      gameState = STATE_CAMPAIGN_CLEAR;
      highScore = Math.max(highScore, score);
      finishScoreSubmission();
      onStatus(`MonkeyKong abgeschlossen. Endstand ${score}.`);
      return;
    }

    loadLevel(currentLevelIndex, true);
    gameState = STATE_PLAYING;
    onStatus(`Level ${currentLevelIndex + 1} startet: ${levels[currentLevelIndex].name}.`);
  }

  function finishScoreSubmission() {
    if (scoreSent) return;
    scoreSent = true;
    void onScore(score);
  }

  function tick() {
    frame += 1;

    if (gameState === STATE_PLAYING) {
      updateGame();
    } else if (gameState === STATE_LEVEL_CLEAR && levelClearFrame > 0 && frame - levelClearFrame > 90) {
      advanceLevel();
    } else {
      updateSparks();
      updateFloatingTexts();
    }
  }

  function render() {
    drawBackdrop();

    if (gameState === STATE_MENU) {
      drawTitleScreen();
      return;
    }

    drawWorld();
    drawHud();

    if (gameState === STATE_LEVEL_CLEAR) {
      drawOverlay('LEVEL GESCHAFFT', "Weiter geht's gleich...");
    } else if (gameState === STATE_GAME_OVER) {
      drawOverlay('GAME OVER', 'Druecke R oder Enter fuer einen Neustart', true);
    } else if (gameState === STATE_CAMPAIGN_CLEAR) {
      drawOverlay('MONKEYKONG SIEGT', 'Alle Level geschafft. Druecke R oder Enter', true);
    }
  }

  function drawWorld() {
    platforms.forEach(drawPlatform);
    ladders.forEach(drawLadder);
    if (!levels[currentLevelIndex].bossFight) drawGoal();
    drawBoss();
    barrels.forEach(drawBarrel);
    drawPlayer();
    sparks.forEach(drawSpark);
    floatingTexts.forEach(drawFloatingText);
  }

  function drawBackdrop() {
    const level = levels[currentLevelIndex];
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, rgb(level.skyTop));
    gradient.addColorStop(1, rgb(level.skyBottom));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(780, 90, 65, 65, 0, 0, Math.PI * 2);
    ctx.ellipse(820, 90, 40, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    drawCloud(ctx, 140, 120, 77);
    drawCloud(ctx, 340, 80, 56);
    drawCloud(ctx, 620, 150, 91);

    ctx.fillStyle = '#263a34';
    ctx.fillRect(0, 586, WIDTH, 54);
    for (let i = 0; i < WIDTH; i += 18) {
      ctx.fillStyle = `rgb(${48 + (i % 36)}, 80, 64)`;
      ctx.fillRect(i, 592, 10, 48);
    }
  }

  function drawTitleScreen() {
    drawWorldPreview();

    ctx.fillStyle = 'rgba(12, 18, 24, 0.72)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe362';
    ctx.font = 'bold 44px Arial';
    ctx.fillText('MONKEYKONG', WIDTH * 0.5, 150);

    ctx.fillStyle = '#ececec';
    ctx.font = '18px Arial';
    ctx.fillText('Startmenue', WIDTH * 0.5, 198);
    ctx.fillText('5 Level, mehr Tempo, mehr Faesser und ein Bossfight-Finale', WIDTH * 0.5, 230);
    ctx.fillText('Laufen: A/D oder Pfeile   Springen: W, Pfeil hoch oder Leertaste', WIDTH * 0.5, 270);
    ctx.fillText('Leitern: hoch an der Leiter, Touch-Button startet dort den Aufstieg', WIDTH * 0.5, 298);
    ctx.fillText(`ENTER startet die Kampagne   M schaltet Sound ${soundEnabled ? 'AUS' : 'AN'}`, WIDTH * 0.5, 340);
    ctx.fillText('Level 1: Docks   Level 2: Factory   Level 3: Summit   Level 4: Panic   Level 5: Throne', WIDTH * 0.5, 380);
    ctx.fillText('Im letzten Level triffst du den Boss von oben, statt nur das Ziel zu erreichen', WIDTH * 0.5, 408);
    ctx.fillText(`Highscore: ${highScore}`, WIDTH * 0.5, 452);
    drawButton(ctx, pointer, WIDTH * 0.5, 530, 260, 56, 'STARTEN', '#2EAE2E', '#4ADE4A');
  }

  function drawWorldPreview() {
    platforms.forEach(drawPlatform);
    ladders.forEach(drawLadder);
    if (!levels[currentLevelIndex].bossFight) drawGoal();
    drawBoss();
    drawPlayer();
    const previewBarrel = createBarrel(boss.x + 75, boss.y + 38, levels[currentLevelIndex].barrelSpeed);
    previewBarrel.vx = levels[currentLevelIndex].barrelSpeed;
    drawBarrel(previewBarrel);
  }

  function drawHud() {
    roundedRect(ctx, 12, 10, 420, 82, 10, 'rgba(10,14,18,0.72)');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '18px Arial';
    ctx.fillText(`Punkte: ${score}`, 26, 28);
    ctx.fillText(`Highscore: ${highScore}`, 26, 50);
    ctx.fillText(`Leben: ${lives}`, 220, 28);
    ctx.fillText(`Level ${currentLevelIndex + 1} / ${levels.length} - ${levels[currentLevelIndex].name}`, 220, 50);
    ctx.fillText(`Sound: ${soundEnabled ? 'AN' : 'AUS'}`, 26, 72);
    if (levels[currentLevelIndex].bossFight) {
      ctx.fillText(`Boss HP: ${boss.health} / ${boss.maxHealth}`, 220, 72);
    }
  }

  function drawOverlay(title, subtitle, showButton = false) {
    ctx.fillStyle = 'rgba(8,10,14,0.78)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffeb72';
    ctx.font = 'bold 44px Arial';
    ctx.fillText(title, WIDTH * 0.5, 250);
    ctx.fillStyle = '#f4f4f4';
    ctx.font = '18px Arial';
    ctx.fillText(subtitle, WIDTH * 0.5, 302);
    if (showButton) {
      drawButton(ctx, pointer, WIDTH * 0.5, 380, 280, 54, 'NOCHMAL', '#2EAE2E', '#4ADE4A');
    }
  }

  function drawPlatform(platform) {
    ctx.strokeStyle = '#4c2816';
    ctx.fillStyle = '#aa5826';
    ctx.beginPath();
    ctx.moveTo(platform.x, platformTopYAt(platform, platform.x));
    ctx.lineTo(platform.x + platform.w, platformTopYAt(platform, platform.x + platform.w));
    ctx.lineTo(platform.x + platform.w, platform.y + platform.h);
    ctx.lineTo(platform.x, platform.y + platform.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 1;
    for (let i = 0; i < platform.w; i += 28) {
      const bx = platform.x + i;
      const by = platformTopYAt(platform, bx + 14);
      roundedRect(ctx, bx, by + 2, 22, platform.h - 4, 4, '#be6c38');
      roundedRect(ctx, bx + 2, by + 5, 18, 4, 2, 'rgba(122,57,28,0.72)');
      roundedRect(ctx, bx + 2, by + 12, 18, 3, 2, 'rgba(222,145,86,0.72)');
    }
  }

  function drawLadder(ladder) {
    ctx.strokeStyle = '#eed078';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ladder.x + 8, ladder.y);
    ctx.lineTo(ladder.x + 8, ladder.y + ladder.h);
    ctx.moveTo(ladder.x + ladder.w - 8, ladder.y);
    ctx.lineTo(ladder.x + ladder.w - 8, ladder.y + ladder.h);
    for (let yy = ladder.y + 8; yy < ladder.y + ladder.h; yy += 14) {
      ctx.moveTo(ladder.x + 8, yy);
      ctx.lineTo(ladder.x + ladder.w - 8, yy);
    }
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  function drawGoal() {
    roundedRect(ctx, goal.x, goal.y, goal.w, goal.h, 6, '#daa44a');
    roundedRect(ctx, goal.x + 8, goal.y + 8, goal.w - 16, goal.h - 16, 4, '#9a6220');
    ctx.fillStyle = '#ffe65a';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(goal.x + 16 + i * 16, goal.y + 20 + Math.sin(frame * 0.08 + i) * 3, 8, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(goal.x + 22 + i * 15, goal.y + 28 + Math.cos(frame * 0.07 + i) * 2, 6.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBoss() {
    if (bossDefeated()) return;
    ctx.fillStyle = boss.hurtFrames > 0 ? '#be5440' : '#7a4e2a';
    roundedRect(ctx, boss.x + 30, boss.y + 20, 78, 56, 20, boss.hurtFrames > 0 ? '#be5440' : '#7a4e2a');
    ctx.beginPath();
    ctx.ellipse(boss.x + 44, boss.y + 30, 15, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(boss.x + 94, boss.y + 30, 15, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(boss.x + 69, boss.y + 44, 41, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    roundedRect(ctx, boss.x + 45, boss.y + 34, 48, 36, 18, '#e8c694');
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.ellipse(boss.x + 58, boss.y + 46, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(boss.x + 80, boss.y + 46, 2.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#141414';
    ctx.beginPath();
    ctx.moveTo(boss.x + 62, boss.y + 59);
    ctx.lineTo(boss.x + 76, boss.y + 59);
    ctx.stroke();
    ctx.fillStyle = '#c32c2c';
    ctx.beginPath();
    ctx.moveTo(boss.x + 116, boss.y + 34);
    ctx.lineTo(boss.x + 145, boss.y + 46);
    ctx.lineTo(boss.x + 120, boss.y + 59);
    ctx.closePath();
    ctx.fill();
    roundedRect(ctx, boss.x + 108, boss.y + 60, 48, 12, 6, '#ffe04e');

    if (boss.bossFight) {
      roundedRect(ctx, 640, 18, 250, 22, 8, 'rgba(12,18,24,0.7)');
      const hpWidth = mapRange(boss.health, 0, boss.maxHealth, 0, 238);
      roundedRect(ctx, 646, 24, hpWidth, 10, 4, '#ff5e46');
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = '18px Arial';
      ctx.fillText('Boss', 646, 14);
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    roundedRect(ctx, 6, 9, 18, 14, 4, '#e62e3e');
    roundedRect(ctx, 4, 18, 22, 18, 4, '#2260d4');
    roundedRect(ctx, 5, 35, 7, 7, 2, '#623616');
    roundedRect(ctx, 18, 35, 7, 7, 2, '#623616');
    roundedRect(ctx, 3, 2, 24, 7, 3, '#ffc44e');

    if (sprite.complete && sprite.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(15, 10, 9, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(sprite, 6, 1, 18, 18);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(15, 10, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.fillStyle = '#ffd6b0';
      ctx.ellipse(15, 10, 9, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    roundedRect(ctx, 8, 20, 4, 5, 2, '#ffffff');
    roundedRect(ctx, 18, 20, 4, 5, 2, '#ffffff');
    ctx.restore();
  }

  function drawBarrel(barrel) {
    ctx.save();
    ctx.translate(barrel.x + barrel.size * 0.5, barrel.y + barrel.size * 0.5);
    ctx.rotate(barrel.spin);
    ctx.fillStyle = '#a2562a';
    ctx.beginPath();
    ctx.ellipse(0, 0, barrel.size * 0.5, barrel.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#72321a';
    ctx.beginPath();
    ctx.ellipse(0, 0, (barrel.size - 6) * 0.5, (barrel.size - 6) * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0b65c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(8, 2);
    ctx.moveTo(-2, -8);
    ctx.lineTo(2, 8);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.restore();
  }

  function drawSpark(spark) {
    const alpha = clamp(mapRange(spark.life, 0, 40, 0, 1), 0, 1);
    ctx.fillStyle = rgba(spark.color, alpha);
    ctx.beginPath();
    ctx.ellipse(spark.x, spark.y, 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFloatingText(text) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '18px Arial';
    ctx.fillStyle = `rgba(255, 240, 120, ${clamp(mapRange(text.life, 0, 50, 0, 1), 0, 1)})`;
    ctx.fillText(text.label, text.x, text.y);
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') {
      event.preventDefault();
      leftPressed = true;
    }
    if (event.key === 'ArrowRight' || key === 'd') {
      event.preventDefault();
      rightPressed = true;
    }
    if (event.key === 'ArrowUp' || key === 'w') {
      event.preventDefault();
      upPressed = true;
      if (gameState === STATE_PLAYING) {
        const climbLadder = ladderForClimbInput(player.x, player.y, player.w, player.h);
        if (climbLadder) snapPlayerToLadder(climbLadder);
        else playerTryJump();
      }
    }
    if (event.key === 'ArrowDown' || key === 's') {
      event.preventDefault();
      downPressed = true;
      if (gameState === STATE_PLAYING) {
        const climbLadder = ladderForClimbInput(player.x, player.y, player.w, player.h);
        if (climbLadder) snapPlayerToLadder(climbLadder);
      }
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (gameState === STATE_PLAYING) {
        playerTryJump();
      }
    }
    if (key === 'm') {
      soundEnabled = !soundEnabled;
      onStatus(`MonkeyKong Sound ${soundEnabled ? 'AN' : 'AUS'}.`);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (gameState === STATE_MENU) {
        startCampaign();
      } else if (gameState !== STATE_PLAYING) {
        startCampaign();
      }
    }
    if (key === 'r' && gameState !== STATE_PLAYING) {
      startCampaign();
    }
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') leftPressed = false;
    if (event.key === 'ArrowRight' || key === 'd') rightPressed = false;
    if (event.key === 'ArrowUp' || key === 'w') upPressed = false;
    if (event.key === 'ArrowDown' || key === 's') downPressed = false;
  }

  function handlePointerDown(point) {
    pointer.x = point.x;
    pointer.y = point.y;
    if (gameState === STATE_MENU && hitButton(point.x, point.y, WIDTH * 0.5, 530, 260, 56)) {
      startCampaign();
    } else if (gameState !== STATE_PLAYING && hitButton(point.x, point.y, WIDTH * 0.5, 380, 280, 54)) {
      startCampaign();
    }
  }

  function handlePointerMove(point) {
    pointer.x = point.x;
    pointer.y = point.y;
  }

  function handlePointerLeave() {
    pointer.x = -9999;
    pointer.y = -9999;
  }

  function handleTouchAction(action, pressed) {
    if (action === 'left') leftPressed = pressed;
    if (action === 'right') rightPressed = pressed;
    if (action === 'fire') {
      upPressed = pressed;
      if (!pressed) return;

      if (gameState === STATE_MENU || gameState === STATE_GAME_OVER || gameState === STATE_CAMPAIGN_CLEAR) {
        startCampaign();
        return;
      }

      if (gameState === STATE_PLAYING) {
        const climbLadder = ladderForClimbInput(player.x, player.y, player.w, player.h);
        if (climbLadder) snapPlayerToLadder(climbLadder);
        else playerTryJump();
      }
    }
  }

  return {
    onActivate,
    handleKeyDown,
    handleKeyUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleTouchAction,
    tick,
    render
  };

  function lerpValue(start, end, amount) {
    return start + (end - start) * amount;
  }

  function rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }

  function rgba(color, alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  }
}

function createOBlockGame({ onStatus, onScore }) {
  const GAME_NAME = 'O-Block';
  const COLS = 10;
  const ROWS = 20;
  const CELL = 28;
  const BOARD_X = 28;
  const BOARD_Y = 28;
  const PANEL_W = 180;
  const EMPTY = -1;
  const BASE_FALL_INTERVAL = 700;
  const MIN_FALL_INTERVAL = 120;
  const SPEED_STEP = 55;
  const TIME_LEVEL_MS = 25000;
  const pointer = { x: -9999, y: -9999 };
  const palette = [
    [255, 99, 97],
    [255, 179, 71],
    [255, 235, 59],
    [102, 187, 106],
    [77, 208, 225],
    [92, 107, 192],
    [171, 71, 188]
  ];
  const SHAPES = [
    [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
      ]
    ],
    [
      [
        [1, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0]
      ]
    ],
    [
      [
        [0, 0, 1, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ]
    ],
    [
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]
    ],
    [
      [
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0]
      ]
    ],
    [
      [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ]
    ],
    [
      [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
      ]
    ]
  ];

  let board = [];
  let currentPiece = null;
  let nextPiece = null;
  let score = 0;
  let totalLines = 0;
  let level = 1;
  let gameOver = false;
  let paused = false;
  let fallInterval = BASE_FALL_INTERVAL;
  let elapsedMs = 0;
  let fallAccumulator = 0;
  let softDropHold = false;
  let moveLeftHold = false;
  let moveRightHold = false;
  let horizontalRepeatMs = 0;
  let softDropRepeatMs = 0;
  let scoreSent = false;

  function onActivate() {
    resetGame();
    onStatus('O-Block ist bereit.');
  }

  function resetGame() {
    board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY));
    score = 0;
    totalLines = 0;
    level = 1;
    gameOver = false;
    paused = false;
    fallInterval = BASE_FALL_INTERVAL;
    elapsedMs = 0;
    fallAccumulator = 0;
    softDropHold = false;
    moveLeftHold = false;
    moveRightHold = false;
    horizontalRepeatMs = 0;
    softDropRepeatMs = 0;
    scoreSent = false;
    currentPiece = randomPiece();
    nextPiece = randomPiece();
  }

  function randomPiece() {
    return {
      type: Math.floor(Math.random() * SHAPES.length),
      rotation: 0,
      x: 3,
      y: -1
    };
  }

  function isValidPosition(newX, newY, rotation, type) {
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (SHAPES[type][rotation][r][c] === 0) continue;
        const boardX = newX + c;
        const boardY = newY + r;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
        if (boardY >= 0 && board[boardY][boardX] !== EMPTY) return false;
      }
    }
    return true;
  }

  function stepDown() {
    if (!currentPiece) return;
    if (isValidPosition(currentPiece.x, currentPiece.y + 1, currentPiece.rotation, currentPiece.type)) {
      currentPiece.y += 1;
    } else {
      lockPiece();
      clearLines();
      spawnNextPiece();
    }
  }

  function spawnNextPiece() {
    currentPiece = nextPiece;
    currentPiece.x = 3;
    currentPiece.y = -1;
    currentPiece.rotation = 0;
    nextPiece = randomPiece();
    if (!isValidPosition(currentPiece.x, currentPiece.y, currentPiece.rotation, currentPiece.type)) {
      gameOver = true;
      finishScoreSubmission();
      onStatus(`O-Block vorbei. Endstand ${score}.`);
    }
  }

  function lockPiece() {
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (SHAPES[currentPiece.type][currentPiece.rotation][r][c] === 1) {
          const boardX = currentPiece.x + c;
          const boardY = currentPiece.y + r;
          if (boardY >= 0) {
            board[boardY][boardX] = currentPiece.type;
          }
        }
      }
    }
  }

  function clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r -= 1) {
      let full = true;
      for (let c = 0; c < COLS; c += 1) {
        if (board[r][c] === EMPTY) {
          full = false;
          break;
        }
      }
      if (full) {
        linesCleared += 1;
        for (let row = r; row > 0; row -= 1) {
          for (let c = 0; c < COLS; c += 1) {
            board[row][c] = board[row - 1][c];
          }
        }
        for (let c = 0; c < COLS; c += 1) {
          board[0][c] = EMPTY;
        }
        r += 1;
      }
    }
    if (linesCleared > 0) {
      totalLines += linesCleared;
      score += calculateScore(linesCleared);
      updateDifficulty();
    }
  }

  function calculateScore(linesCleared) {
    if (linesCleared === 1) return 100 * level;
    if (linesCleared === 2) return 300 * level;
    if (linesCleared === 3) return 500 * level;
    if (linesCleared >= 4) return 800 * level;
    return 0;
  }

  function attemptMove(dx, dy, rewardSoftDrop = false) {
    if (!currentPiece || gameOver || paused) return false;
    const nextX = currentPiece.x + dx;
    const nextY = currentPiece.y + dy;
    if (isValidPosition(nextX, nextY, currentPiece.rotation, currentPiece.type)) {
      currentPiece.x = nextX;
      currentPiece.y = nextY;
      if (rewardSoftDrop && dy > 0) score += 1;
      return true;
    }
    if (dy > 0 && !rewardSoftDrop) {
      stepDown();
    }
    return false;
  }

  function attemptRotate() {
    if (!currentPiece || gameOver || paused) return;
    const nextRotation = (currentPiece.rotation + 1) % 4;
    const kicks = [-1, 1, -2, 2];
    if (isValidPosition(currentPiece.x, currentPiece.y, nextRotation, currentPiece.type)) {
      currentPiece.rotation = nextRotation;
      return;
    }
    for (const kick of kicks) {
      if (isValidPosition(currentPiece.x + kick, currentPiece.y, nextRotation, currentPiece.type)) {
        currentPiece.x += kick;
        currentPiece.rotation = nextRotation;
        return;
      }
    }
  }

  function hardDrop() {
    if (!currentPiece || gameOver || paused) return;
    let dropDistance = 0;
    while (isValidPosition(currentPiece.x, currentPiece.y + 1, currentPiece.rotation, currentPiece.type)) {
      currentPiece.y += 1;
      dropDistance += 1;
    }
    score += dropDistance * 2;
    lockPiece();
    clearLines();
    spawnNextPiece();
    fallAccumulator = 0;
  }

  function updateDifficulty() {
    if (gameOver) return;
    const timeLevel = Math.floor(elapsedMs / TIME_LEVEL_MS);
    const lineLevel = Math.floor(totalLines / 10);
    level = 1 + Math.max(timeLevel, lineLevel);
    fallInterval = Math.max(MIN_FALL_INTERVAL, BASE_FALL_INTERVAL - (level - 1) * SPEED_STEP);
  }

  function getElapsedGameMillis() {
    return Math.max(0, Math.floor(elapsedMs));
  }

  function formatTime(elapsedMillis) {
    const totalSeconds = Math.floor(elapsedMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function tick() {
    if (!gameOver && !paused) {
      elapsedMs += FIXED_STEP;
      fallAccumulator += FIXED_STEP;
      updateDifficulty();
      handleHeldControls();
      if (fallAccumulator >= fallInterval) {
        stepDown();
        fallAccumulator = 0;
      }
    }
  }

  function handleHeldControls() {
    horizontalRepeatMs += FIXED_STEP;
    softDropRepeatMs += FIXED_STEP;

    if (moveLeftHold && !moveRightHold && horizontalRepeatMs >= 110) {
      attemptMove(-1, 0);
      horizontalRepeatMs = 0;
    } else if (moveRightHold && !moveLeftHold && horizontalRepeatMs >= 110) {
      attemptMove(1, 0);
      horizontalRepeatMs = 0;
    }

    if (softDropHold && softDropRepeatMs >= 48) {
      if (attemptMove(0, 1, true)) {
        fallAccumulator = 0;
      }
      softDropRepeatMs = 0;
    }
  }

  function render() {
    drawBackground();
    drawFrame();
    drawBoard();
    drawGhost();
    drawPiece(currentPiece);
    drawSidePanel();
    drawOverlay();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0e1223');
    gradient.addColorStop(1, '#1c2f4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.18, canvas.height * 0.2, 110, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.82, canvas.height * 0.72, 130, 130, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFrame() {
    roundedRect(ctx, BOARD_X - 12, BOARD_Y - 12, COLS * CELL + 24, ROWS * CELL + 24, 18, 'rgba(10,16,30,0.74)');
    roundedRect(ctx, BOARD_X, BOARD_Y, COLS * CELL, ROWS * CELL, 12, 'rgba(16,24,44,0.9)');
  }

  function drawBoard() {
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const x = BOARD_X + c * CELL;
        const y = BOARD_Y + r * CELL;
        roundedRect(ctx, x, y, CELL, CELL, 5, 'rgba(255,255,255,0.04)');
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
        if (board[r][c] !== EMPTY) {
          drawBlock(x, y, palette[board[r][c]], false);
        }
      }
    }
  }

  function drawGhost() {
    if (!currentPiece || gameOver) return;
    let ghostY = currentPiece.y;
    while (isValidPosition(currentPiece.x, ghostY + 1, currentPiece.rotation, currentPiece.type)) {
      ghostY += 1;
    }
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (SHAPES[currentPiece.type][currentPiece.rotation][r][c] === 1) {
          const px = BOARD_X + (currentPiece.x + c) * CELL;
          const py = BOARD_Y + (ghostY + r) * CELL;
          drawBlock(px, py, palette[currentPiece.type], true);
        }
      }
    }
  }

  function drawPiece(piece) {
    if (!piece) return;
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (SHAPES[piece.type][piece.rotation][r][c] === 1) {
          const boardY = piece.y + r;
          if (boardY >= 0) {
            const px = BOARD_X + (piece.x + c) * CELL;
            const py = BOARD_Y + boardY * CELL;
            drawBlock(px, py, palette[piece.type], false);
          }
        }
      }
    }
  }

  function drawBlock(x, y, baseColor, ghost) {
    const blockColor = ghost ? `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.28)` : rgb(baseColor);
    roundedRect(ctx, x + 2, y + 2, CELL - 4, CELL - 4, 6, blockColor);

    if (ghost) {
      ctx.strokeStyle = 'rgba(255,255,255,0.44)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, CELL - 10, CELL - 10);
      ctx.lineWidth = 1;
      return;
    }

    roundedRect(ctx, x + 5, y + 5, CELL - 12, 7, 4, 'rgba(255,255,255,0.28)');
    roundedRect(ctx, x + 5, y + 5, 7, CELL - 12, 4, 'rgba(255,255,255,0.28)');
    roundedRect(ctx, x + 9, y + CELL - 12, CELL - 18, 4, 3, 'rgba(0,0,0,0.16)');
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 12);
    ctx.lineTo(x + CELL - 8, y + CELL - 8);
    ctx.moveTo(x + CELL - 12, y + 8);
    ctx.lineTo(x + 8, y + CELL - 12);
    ctx.stroke();
  }

  function drawSidePanel() {
    const panelX = BOARD_X + COLS * CELL + 28;
    const panelY = BOARD_Y;
    roundedRect(ctx, panelX, panelY, PANEL_W - 20, 250, 18, 'rgba(11,19,36,0.74)');
    ctx.fillStyle = '#f5f5f5';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(GAME_NAME, panelX + 18, panelY + 38);

    ctx.fillStyle = '#b4d2ff';
    ctx.font = '14px Arial';
    ctx.fillText('Score', panelX + 18, panelY + 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(String(score), panelX + 18, panelY + 102);

    ctx.fillStyle = '#b4d2ff';
    ctx.font = '14px Arial';
    ctx.fillText('Lines', panelX + 18, panelY + 132);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(String(totalLines), panelX + 18, panelY + 158);

    ctx.fillStyle = '#b4d2ff';
    ctx.font = '14px Arial';
    ctx.fillText('Level', panelX + 18, panelY + 186);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(String(level), panelX + 18, panelY + 212);

    ctx.fillStyle = '#b4d2ff';
    ctx.font = '14px Arial';
    ctx.fillText('Time', panelX + 92, panelY + 186);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(formatTime(getElapsedGameMillis()), panelX + 92, panelY + 212);

    roundedRect(ctx, panelX, panelY + 272, PANEL_W - 20, 148, 18, 'rgba(11,19,36,0.70)');
    ctx.fillStyle = '#b4d2ff';
    ctx.font = '16px Arial';
    ctx.fillText('Next', panelX + 18, panelY + 302);
    drawNextPiece(panelX + 26, panelY + 324);

    roundedRect(ctx, panelX, panelY + 438, PANEL_W - 20, 150, 18, 'rgba(11,19,36,0.70)');
    ctx.fillStyle = '#b4d2ff';
    ctx.font = '15px Arial';
    ctx.fillText('Steuerung', panelX + 18, panelY + 468);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px Arial';
    ctx.fillText('Links/Rechts  bewegen', panelX + 18, panelY + 495);
    ctx.fillText('Oben          drehen', panelX + 18, panelY + 517);
    ctx.fillText('Unten         schneller', panelX + 18, panelY + 539);
    ctx.fillText('Leertaste     Drop', panelX + 18, panelY + 561);
    ctx.fillText('P             Pause', panelX + 18, panelY + 583);

    if (activeHighScore > 0) {
      ctx.fillStyle = '#ffd86a';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Rekord: ${activeHighScore}`, panelX + 18, panelY + 235);
    }
  }

  function drawNextPiece(startX, startY) {
    if (!nextPiece) return;
    const previewCell = 22;
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        if (SHAPES[nextPiece.type][0][r][c] === 1) {
          const x = startX + c * previewCell;
          const y = startY + r * previewCell;
          roundedRect(ctx, x, y, previewCell - 2, previewCell - 2, 5, 'rgba(255,255,255,0.04)');
          drawPreviewBlock(x, y, previewCell, palette[nextPiece.type]);
        }
      }
    }
  }

  function drawPreviewBlock(x, y, previewCell, baseColor) {
    roundedRect(ctx, x + 1, y + 1, previewCell - 3, previewCell - 3, 5, rgb(baseColor));
    roundedRect(ctx, x + 3, y + 3, previewCell - 8, 5, 3, 'rgba(255,255,255,0.28)');
    roundedRect(ctx, x + 3, y + 3, 5, previewCell - 8, 3, 'rgba(255,255,255,0.28)');
  }

  function drawOverlay() {
    if (!paused && !gameOver) return;
    roundedRect(ctx, BOARD_X, BOARD_Y, COLS * CELL, ROWS * CELL, 12, 'rgba(4,8,16,0.72)');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(gameOver ? 'Game Over' : 'Pause', BOARD_X + COLS * CELL / 2, BOARD_Y + ROWS * CELL / 2 - 28);
    ctx.font = '16px Arial';
    ctx.fillText(gameOver ? 'Druecke R oder Enter fuer Neustart' : 'Druecke P zum Fortsetzen', BOARD_X + COLS * CELL / 2, BOARD_Y + ROWS * CELL / 2 + 12);
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (key === 'r') {
      event.preventDefault();
      resetGame();
      onStatus('O-Block neu gestartet.');
      return;
    }
    if (key === 'p') {
      event.preventDefault();
      if (!gameOver) {
        paused = !paused;
        onStatus(paused ? 'O-Block pausiert.' : 'O-Block fortgesetzt.');
      }
      return;
    }
    if (gameOver || paused) {
      if (event.key === 'Enter') {
        event.preventDefault();
        resetGame();
      }
      return;
    }
    if (event.key === 'ArrowLeft' || key === 'a') {
      event.preventDefault();
      moveLeftHold = true;
      moveRightHold = false;
      horizontalRepeatMs = 0;
      attemptMove(-1, 0);
    } else if (event.key === 'ArrowRight' || key === 'd') {
      event.preventDefault();
      moveRightHold = true;
      moveLeftHold = false;
      horizontalRepeatMs = 0;
      attemptMove(1, 0);
    } else if (event.key === 'ArrowDown' || key === 's') {
      event.preventDefault();
      softDropHold = true;
      softDropRepeatMs = 0;
      if (attemptMove(0, 1, true)) {
        fallAccumulator = 0;
      }
    } else if (event.key === 'ArrowUp' || key === 'w') {
      event.preventDefault();
      attemptRotate();
    } else if (event.key === ' ') {
      event.preventDefault();
      hardDrop();
    }
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowLeft' || key === 'a') moveLeftHold = false;
    if (event.key === 'ArrowRight' || key === 'd') moveRightHold = false;
    if (event.key === 'ArrowDown' || key === 's') softDropHold = false;
  }

  function handlePointerDown(point) {
    pointer.x = point.x;
    pointer.y = point.y;
    if (gameOver) {
      resetGame();
      return;
    }
    if (paused) {
      paused = false;
      return;
    }
    if (point.y < BOARD_Y || point.y > BOARD_Y + ROWS * CELL || point.x < BOARD_X || point.x > BOARD_X + COLS * CELL) {
      return;
    }
    const localX = point.x - BOARD_X;
    const localY = point.y - BOARD_Y;
    if (localY > ROWS * CELL * 0.72) {
      hardDrop();
    } else if (localX < COLS * CELL * 0.33) {
      attemptMove(-1, 0);
    } else if (localX > COLS * CELL * 0.66) {
      attemptMove(1, 0);
    } else {
      attemptRotate();
    }
  }

  function handlePointerMove(point) {
    pointer.x = point.x;
    pointer.y = point.y;
  }

  function handlePointerLeave() {
    pointer.x = -9999;
    pointer.y = -9999;
  }

  function handleTouchAction(action, pressed) {
    if (!pressed) {
      if (action === 'left') moveLeftHold = false;
      if (action === 'right') moveRightHold = false;
      return;
    }

    if (gameOver) {
      resetGame();
      return;
    }

    if (paused) {
      paused = false;
      return;
    }

    if (action === 'left') {
      moveLeftHold = true;
      moveRightHold = false;
      horizontalRepeatMs = 0;
      attemptMove(-1, 0);
    } else if (action === 'right') {
      moveRightHold = true;
      moveLeftHold = false;
      horizontalRepeatMs = 0;
      attemptMove(1, 0);
    } else if (action === 'fire') {
      attemptRotate();
    }
  }

  function finishScoreSubmission() {
    if (scoreSent) return;
    scoreSent = true;
    void onScore(score);
  }

  return {
    onActivate,
    handleKeyDown,
    handleKeyUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleTouchAction,
    tick,
    render
  };

  function rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
}

function resolvePlayerIdentity(currentUser, profile) {
  const userId = normalizeUserId(currentUser?.id);
  const username = resolveUsername(currentUser, profile);
  const loginId = normalizeLookupKey(username);
  const found = PLAYER_BY_USER_ID[userId] || PLAYER_BY_LOGIN_ID[loginId];

  if (found) {
    return {
      ...found,
      username,
      assetLabel: found.sprite.split('/').pop() || found.sprite
    };
  }

  return {
    key: loginId || 'default',
    label: beautifyUsername(username),
    sprite: DEFAULT_PLAYER_SPRITE,
    username,
    assetLabel: DEFAULT_PLAYER_SPRITE.split('/').pop() || DEFAULT_PLAYER_SPRITE
  };
}

function resolveUsername(currentUser, profile) {
  return String(
    profile?.username
      || currentUser?.user_metadata?.username
      || currentUser?.email?.split('@')[0]
      || 'mitglied'
  ).trim();
}

function normalizeLookupKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeUserId(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeGameKey(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized in GAME_CONFIGS ? normalized : '';
}

function beautifyUsername(value) {
  const cleaned = String(value || 'Mitglied').trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : 'Mitglied';
}

function drawDoodleSky(targetCtx, width, height) {
  const gradient = targetCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#D6EEFF');
  targetCtx.fillStyle = gradient;
  targetCtx.fillRect(0, 0, width, height);
}

function drawDoodleClouds(targetCtx, clouds, camOffset, height) {
  targetCtx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  clouds.forEach(cloud => {
    let y = (cloud.y - camOffset * cloud.speed) % (height + 200);
    if (y < -100) y += height + 300;
    drawCloud(targetCtx, cloud.x, y, cloud.size);
  });
}

function drawCloud(targetCtx, x, y, size) {
  targetCtx.beginPath();
  targetCtx.ellipse(x, y, size / 2, size * 0.25, 0, 0, Math.PI * 2);
  targetCtx.ellipse(x - size * 0.3, y + 5, size * 0.35, size * 0.175, 0, 0, Math.PI * 2);
  targetCtx.ellipse(x + size * 0.35, y + 5, size * 0.3, size * 0.15, 0, 0, Math.PI * 2);
  targetCtx.fill();
}

function drawDoodleHud(targetCtx, width, score, highScore, jetpack, jetpackTimer, jetpackDuration) {
  roundedRect(targetCtx, 10, 10, 160, 42, 10, 'rgba(0,0,0,0.5)');
  targetCtx.fillStyle = '#fff';
  targetCtx.font = 'bold 24px Arial';
  targetCtx.textAlign = 'left';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(`Punkte: ${score}`, 22, 31);

  if (highScore > 0) {
    targetCtx.font = '16px Arial';
    const label = `Rekord: ${highScore}`;
    const boxWidth = targetCtx.measureText(label).width + 26;
    roundedRect(targetCtx, width - boxWidth - 10, 10, boxWidth, 34, 10, 'rgba(0,0,0,0.5)');
    targetCtx.textAlign = 'right';
    targetCtx.fillStyle = '#FFD700';
    targetCtx.fillText(label, width - 18, 27);
  }

  if (jetpack) {
    const barWidth = 130;
    const barHeight = 26;
    const pct = jetpackTimer / jetpackDuration;
    roundedRect(targetCtx, width / 2 - (barWidth + 10) / 2, 58 - (barHeight + 6) / 2, barWidth + 10, barHeight + 6, 8, 'rgba(0,0,0,0.5)');
    roundedRect(targetCtx, width / 2 - barWidth / 2, 58 - barHeight / 2, barWidth * pct, barHeight, 6, '#FF8800');
    targetCtx.fillStyle = '#fff';
    targetCtx.font = '13px Arial';
    targetCtx.textAlign = 'center';
    targetCtx.fillText('JETPACK', width / 2, 58);
  }
}

function drawButton(targetCtx, pointer, x, y, width, height, label, baseColor, hoverColor) {
  const hovered = hitButton(pointer.x, pointer.y, x, y, width, height);
  roundedRect(targetCtx, x - width / 2, y - height / 2, width, height, 14, hovered ? hoverColor : baseColor);
  roundedRect(targetCtx, x - (width - 10) / 2, y - height / 2, width - 10, height / 2 - 2, 12, 'rgba(255,255,255,0.22)');
  targetCtx.fillStyle = '#fff';
  targetCtx.font = 'bold 24px Arial';
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText(label, x, y - 1);
}

function roundedRect(targetCtx, x, y, width, height, radius, fillStyle) {
  targetCtx.fillStyle = fillStyle;
  pathRoundedRect(targetCtx, x, y, width, height, radius);
  targetCtx.fill();
}

function pathRoundedRect(targetCtx, x, y, width, height, radius) {
  targetCtx.beginPath();
  targetCtx.moveTo(x + radius, y);
  targetCtx.lineTo(x + width - radius, y);
  targetCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
  targetCtx.lineTo(x + width, y + height - radius);
  targetCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  targetCtx.lineTo(x + radius, y + height);
  targetCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
  targetCtx.lineTo(x, y + radius);
  targetCtx.quadraticCurveTo(x, y, x + radius, y);
  targetCtx.closePath();
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function hitButton(x, y, bx, by, bw, bh) {
  return x > bx - bw / 2 && x < bx + bw / 2 && y > by - bh / 2 && y < by + bh / 2;
}

function hitsPlayerShip(bullet, player) {
  return bullet.x > player.x - player.w / 2
    && bullet.x < player.x + player.w / 2
    && bullet.y > canvas.height - player.h - 20
    && bullet.y < canvas.height;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  const ratio = (value - inMin) / (inMax - inMin || 1);
  return outMin + ratio * (outMax - outMin);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
