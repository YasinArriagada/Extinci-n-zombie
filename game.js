'use strict';

/* =========================================================================
   ZOMBIE EXTINCTION — motor 2D en Canvas puro (sin librerías externas)
   Estructura pensada para poder ampliar personajes, armas, mapas,
   enemigos, vehículos y misiones sin tocar el resto del motor.
   ========================================================================= */

/* ---------------------------- UTILIDADES -------------------------------- */
const rand   = (a, b) => a + Math.random() * (b - a);
const randi  = (a, b) => Math.floor(rand(a, b + 1));
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const dist   = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const lerp   = (a, b, t) => a + (b - a) * t;
const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
const choice = arr => arr[randi(0, arr.length - 1)];

/* ------------------------------- DATOS ----------------------------------- */

const CHARACTERS = [
  { id: 'male',   name: 'RECLUTA MASCULINO', color: '#7d8c72', accent: '#c9d6bd', desc: 'Equilibrado. Puntería estable.', img: 'Aspectos/personaje-hombre.png' },
  { id: 'female', name: 'RECLUTA FEMENINA',  color: '#c07a2e', accent: '#f0c98a', desc: 'Ágil. Recarga más rápida.', img: 'Aspectos/personaje-mujer.png' },
];

const WEAPONS = [
  { id: 'm1903',   name: 'M1903',         dmg: 46, fireRate: 620, spread: 0.02, speed: 900,  color: '#e9e6d6', maxAmmo: 5,  regenMs: 260, pellets: 1 },
  { id: 'ak47',    name: 'AK-47',         dmg: 15, fireRate: 110, spread: 0.09, speed: 950,  color: '#c07a2e', maxAmmo: 30, regenMs: 55,  pellets: 1 },
  { id: 'flamer',  name: 'LANZALLAMAS',   dmg: 6,  fireRate: 45,  spread: 0.28, speed: 480,  color: '#d1272d', maxAmmo: 80, regenMs: 22,  pellets: 1, short: true },
  { id: 'rifle',   name: 'RIFLE',         dmg: 26, fireRate: 260, spread: 0.02, speed: 1050, color: '#9dfb4c', maxAmmo: 12, regenMs: 140, pellets: 1 },
  { id: 'beretta', name: 'BERETTA NANO',  dmg: 13, fireRate: 150, spread: 0.06, speed: 880,  color: '#9aa694', maxAmmo: 15, regenMs: 90,  pellets: 1 },
  { id: 'shotgun', name: 'ESCOPETA',      dmg: 11, fireRate: 520, spread: 0.24, speed: 780,  color: '#b5651d', maxAmmo: 6,  regenMs: 420, pellets: 5 },
];

const VEHICLE_SETS = {
  dino: [
    { id: 'raptor',   name: 'VELOCIRRAPTOR', hp: 130, speed: 235, desc: 'Rápido pero frágil.', kind: 'dino', pal: ['#3f7a34', '#274d20'] },
    { id: 'trex',     name: 'T-REX',         hp: 200, speed: 175, desc: 'Equilibrio entre fuerza y velocidad.', kind: 'dino', pal: ['#6a5a2b', '#3f341a'] },
    { id: 'tricera',  name: 'TRICERATOPS',   hp: 270, speed: 140, desc: 'Lento pero muy resistente.', kind: 'dino', pal: ['#4a6b6b', '#2c4141'] },
  ],
  tank: [
    { id: 'beute', name: 'BEUTEPANZER', hp: 260, speed: 118, desc: 'Blindaje capturado, versátil.', kind: 'tank', pal: ['#4a4f3f', '#2c2f26'] },
    { id: 'tiger', name: 'TIGER I',     hp: 340, speed: 95,  desc: 'Blindaje pesado, muy lento.', kind: 'tank', pal: ['#514a3a', '#332e24'] },
    { id: 'kv1',   name: 'KV-1',        hp: 300, speed: 105, desc: 'Sólido todoterreno soviético.', kind: 'tank', pal: ['#41493f', '#262c24'] },
  ],
  absurd: [
    { id: 'shoe', name: 'ZAPATILLA GIGANTE', hp: 190, speed: 195, desc: 'Camina sobre patas improvisadas.', kind: 'shoe', pal: ['#c0472e', '#7a2a1a'] },
    { id: 'ball', name: 'AUTO-PELOTA',       hp: 150, speed: 245, desc: 'Rueda con gracia balonesca.', kind: 'ball', pal: ['#e9e6d6', '#20281c'] },
    { id: 'case', name: 'ESTUCHE CAMINANTE', hp: 210, speed: 165, desc: 'Avanza sobre lápices-pata.', kind: 'case', pal: ['#3a6ea8', '#1e3a5c'] },
  ],
  animal: [
    { id: 'horse',  name: 'CABALLO',                 hp: 140, speed: 255, desc: 'No puede repararse. Sin miedo.', kind: 'horse', pal: ['#6b4a2c', '#3a2818'] },
    { id: 'donkey', name: 'BURRO',                   hp: 175, speed: 195, desc: 'No puede repararse. Terco y firme.', kind: 'horse', pal: ['#7d7a72', '#48453f'] },
    { id: 'cat2',   name: 'GATO GIGANTE DE DOS CABEZAS', hp: 165, speed: 225, desc: 'No puede repararse. Doble mordida.', kind: 'cat2', pal: ['#d99b3e', '#7a5620'] },
  ],
};

const COMPANIONS = [
  { id: 'tralalero', name: 'TRALALERO TRALALA', desc: 'Ataque giratorio de área cada pocos segundos.', color: '#3a6ea8', ability: 'spin' },
  { id: 'triplet',    name: 'TRIPLE T',          desc: 'Dispara tres proyectiles a distancia.', color: '#c07a2e', ability: 'triple' },
  { id: 'bobrito',    name: 'BOBRITO BANDITO',   desc: 'Aura curativa periódica para el jugador.', color: '#9dfb4c', ability: 'heal' },
];

/* Configuración de las 5 etapas */
const STAGES = [
  {
    id: 1, key: 'dino', name: 'DINOSAURIO',
    vehicleSet: 'dino', vehicleLabel: 'MONTURA', requireWeapons: true,
    resource: { name: 'MEDICINA', icon: '✚', color: '#d1272d' },
    canRepair: true,
    objectiveType: 'rescue', rescueTarget: 5,
    zombieTypes: ['walker'],
    palette: { ground: '#1c2417', accent: '#243020' },
    objectiveText: 'Rescata a los 5 supervivientes (presiona E) y luego dirígete a la zona segura.',
  },
  {
    id: 2, key: 'tank', name: 'TANQUES',
    vehicleSet: 'tank', vehicleLabel: 'TANQUE', requireWeapons: false,
    resource: { name: 'CASCO', icon: '⛨', color: '#c07a2e' },
    canRepair: true,
    objectiveType: 'findNPC', npcName: 'CIENTÍFICO',
    zombieTypes: ['walker', 'gunner'],
    palette: { ground: '#20211c', accent: '#2a2a22' },
    objectiveText: 'Encuentra al científico perdido y escóltalo a la zona segura.',
  },
  {
    id: 3, key: 'absurd', name: 'VEHÍCULOS ABSURDOS',
    vehicleSet: 'absurd', vehicleLabel: 'VEHÍCULO', requireWeapons: false,
    resource: { name: 'MONEDA', icon: '●', color: '#e0b13f' },
    canRepair: true,
    objectiveType: 'airBoss',
    zombieTypes: ['walker', 'gunner'],
    palette: { ground: '#1a2130', accent: '#232c40' },
    objectiveText: 'Sobrevive a los helicópteros (algunos zombies también disparan) y derrota al helicóptero principal. Luego recoge la poción (presiona E) y dirígete a la zona segura.',
  },
  {
    id: 4, key: 'animal', name: 'ANIMALES',
    vehicleSet: 'animal', vehicleLabel: 'CRIATURA', requireWeapons: false,
    resource: null, canRepair: false,
    objectiveType: 'survive', surviveKillTarget: 50, surviveKillTargetMP: 100,
    zombieTypes: ['rider'],
    palette: { ground: '#241c14', accent: '#302418' },
    objectiveText: 'Elimina 50 zombies (100 en multijugador) para llenar la barra al 100% y luego dirígete a la zona segura. La criatura no puede repararse.',
  },
  {
    id: 5, key: 'final', name: 'BATALLA FINAL',
    vehicleSet: null, requireWeapons: false, onFoot: true, companionSelect: true,
    resource: null, canRepair: false,
    objectiveType: 'boss',
    zombieTypes: ['walker', 'gunner'],
    palette: { ground: '#15120f', accent: '#221c17' },
    objectiveText: 'Avanza junto a tu ayudante y derrota al jefe final.',
  },
  // BATALLA DEFINITIVA (solo multijugador): se activa cuando, tras derrotar al
  // jefe robot de la etapa 5, el Admin responde "NO". No aparece en el salto de
  // fase (hidden) ni en el flujo normal de etapas. Ajusta la dificultad aquí.
  {
    id: 6, key: 'finalx', name: 'BATALLA DEFINITIVA', hidden: true,
    vehicleSet: null, requireWeapons: false, onFoot: true, companionSelect: true,
    resource: null, canRepair: false,
    objectiveType: 'finalBattle',
    // zombies de las etapas 1, 2, 3 y 5 (walker y gunner). Sin 'rider' (etapa 4).
    zombieTypes: ['walker', 'gunner'],
    difficulty: {
      bossHp: 2.2,      // vida de los 2 jefes (x2.2)
      escortHp: 1.6,    // vida de mini aviones, mini robots y helicópteros comunes
      speed: 1.3,       // los enemigos se mueven/disparan un 30% más rápido
      dmg: 1.5,         // daño que reciben los jugadores (x1.5)
      zombieHp: 1.5,    // vida de los zombies
      zombies: 40,      // zombies simultáneos (en la etapa 5 son 26)
      patrols: 3,       // helicópteros comunes de la etapa 3 sueltos por el mapa
      escortPlanes: 12, // mini aviones del helicóptero jefe (en la etapa 3 son 10)
      escortRobots: 8,  // mini robots del jefe robot (en la etapa 5 son 5)
      shipHp: 9000,     // vida del tercer jefe: zombie con lentes en su nave (más que cualquier otro jefe)
      // SEGUNDO zombie con lentes: aparece cuando el primero baja a la mitad de su vida.
      // "El doble de difícil": el doble de vida y de cadencia de disparo, más daño y más velocidad.
      ship2: { hp: 2, rate: 2, dmg: 1.5, speed: 1.25 },
    },
    palette: { ground: '#1c0f0f', accent: '#2a1414' },
    objectiveText: 'Derrota a los dos jefes a la vez: el helicóptero principal y el zombie robótico. Después aparecerá el zombie con lentes en su nave espacial y, cuando llegue a la mitad de su vida, un segundo zombie con lentes el doble de difícil. Todos sus enemigos están de vuelta, más fuertes.',
  },
  // MODO ESPECIAL "RECOLECCIÓN DE BAJAS" (solitario y multijugador). Se accede desde SALTO DE FASE.
  // Sin meta ni zona segura: se acumulan bajas de zombies hasta caer (en multijugador, hasta que
  // cae todo el equipo). Con el tiempo aparecen más zombies, más fuertes y de más tipos
  // (ver updateKillStreak y killStreakTypes).
  {
    id: 7, key: 'kills', name: 'RECOLECCIÓN DE BAJAS', special: true,
    vehicleSet: null, requireWeapons: false, onFoot: true, companionSelect: false, // sin compañero
    resource: null, canRepair: false,
    objectiveType: 'killStreak',
    zombieTypes: ['walker'],
    difficulty: { zombies: 18, speed: 1, dmg: 1, zombieHp: 1 }, // valores iniciales; suben con el tiempo
    palette: { ground: '#1a1010', accent: '#261414' },
    objectiveText: 'Elimina a todos los zombies que puedas hasta que caigas. Con el tiempo llegan más, más rápidos y más fuertes. En multijugador termina cuando cae todo el equipo.',
  },
];

// Familia a rescatar en la Etapa 2 cuando es multijugador: la cantidad de
// integrantes a rescatar depende de cuántos jugadores hay en la partida
// (2=científico+hermano, 3=+mamá, 4=+papá, 5=+gato). En solitario siempre
// es solo el científico (comportamiento original).
const STAGE2_FAMILY = [
  { kind: 'scientist', name: 'CIENTÍFICO' },
  { kind: 'brother', name: 'HERMANO' },
  { kind: 'mother', name: 'MAMÁ' },
  { kind: 'father', name: 'PAPÁ' },
  { kind: 'cat', name: 'GATO' },
];

/* ------------------------------ ESTADO GLOBAL ---------------------------- */

const GAME = {
  screen: 'menu',
  settings: { sfx: 70, music: 50, shake: true, touch: false },
  selection: { character: null, vehicle: null, weapons: [], companion: null },
  stageIndex: 0,
  run: { rescued: 0, kills: 0, totalKills: 0 },
  level: null,     // objeto de nivel activo
  input: { keys: {}, mouse: { x: 0, y: 0, down: false }, touch: { move: { x: 0, y: 0 }, fire: false, aiming: false, aimAngle: 0 } },
  paused: false,
  rafId: null,
  phaseSkip: false,       // true mientras se viene del flujo "SALTO DE FASE"
  phaseSkipTarget: 0,     // índice de etapa elegido en la pantalla de salto de fase
};

/* --------------------------------- AUDIO ---------------------------------- */

// Música específica por etapa: agrega aquí más entradas si quieres música
// en otras fases (la clave es el "key" de la etapa, ver STAGES más arriba).
const STAGE_MUSIC = {
  absurd: 'Musica/Avion.mp3',        // Fase 3 — VEHÍCULOS ABSURDOS
  animal: 'Musica/Etapa 4.mp3',      // Fase 4 — ANIMALES
  final: 'Musica/Music_robot.mp3',   // Fase 5 — BATALLA FINAL
  finalx: 'Musica/Music_robot.mp3',  // BATALLA DEFINITIVA (tras el "NO" del Admin)
  kills: 'Musica/Modo Especial.mp3', // MODO ESPECIAL — RECOLECCIÓN DE BAJAS (suena hasta que cae el último jugador)
};

const MUSIC = new Audio();
MUSIC.loop = true;
MUSIC.volume = GAME.settings.music / 100;
let musicStarted = false;
let LOW_FX = false; // teléfonos/tablets: sin brillos (shadowBlur), es lo que más pesa al dibujar
let currentMusicKey = null;

// Arranca la música correspondiente a la etapa (si tiene una asignada en
// STAGE_MUSIC); si la etapa no tiene música propia, detiene la que sonaba.
function startBossMusic(stageKey) {
  const track = STAGE_MUSIC[stageKey];
  if (!track) { stopBossMusic(); return; }
  if (currentMusicKey !== stageKey) {
    MUSIC.src = track;
    currentMusicKey = stageKey;
  }
  musicStarted = true;
  MUSIC.currentTime = 0;
  MUSIC.play().catch(() => {
    // el navegador bloqueó el audio (necesita un gesto): se reintenta en el próximo toque/tecla
    const retry = () => { if (musicStarted && MUSIC.paused) MUSIC.play().catch(() => {}); };
    window.addEventListener('pointerdown', retry, { once: true });
    window.addEventListener('keydown', retry, { once: true });
  });
}
// Si el archivo de música no se encuentra o no se puede decodificar, se avisa en la consola (F12)
MUSIC.addEventListener('error', () => console.warn('[música] No se pudo cargar: ' + MUSIC.src + ' — revisa que el archivo esté en la misma carpeta que index.html y que el nombre coincida exactamente.'));

function stopBossMusic() {
  musicStarted = false;
  currentMusicKey = null;
  MUSIC.pause();
  MUSIC.currentTime = 0;
}

const MENU_MUSIC = new Audio('Musica/Menu.mp3');
MENU_MUSIC.loop = true;
MENU_MUSIC.volume = GAME.settings.music / 100;

function startMenuMusic() {
  if (!MENU_MUSIC.paused) return;
  MENU_MUSIC.currentTime = 0;
  MENU_MUSIC.play().catch(() => { /* se reintenta en el primer toque/click, ver más abajo */ });
}

function stopMenuMusic() {
  MENU_MUSIC.pause();
  MENU_MUSIC.currentTime = 0;
}

function updateMusicVolume() {
  MUSIC.volume = clamp(GAME.settings.music, 0, 100) / 100;
  MENU_MUSIC.volume = clamp(GAME.settings.music, 0, 100) / 100;
}

/* ------------------------------ MULTIJUGADOR -------------------------------
   PASO 1: solo conexión y sala de espera (crear sala / unirse con código,
   hasta 5 jugadores, entre compu y celular). Todavía NO sincroniza la
   partida en sí — eso es el siguiente paso a construir sobre esta base. */

const MP_PREFIX = 'extzmb-'; // prefijo para no chocar con otras apps que usen PeerJS
const MP_COLORS = ['#ff5050', '#4c9dfb', '#9dfb4c', '#fbd94c', '#c74cfb', '#fb8f4c', '#4cfbe0', '#ffffff'];
const MP = {
  peer: null,
  isHost: false,
  code: null,
  conns: [],       // DataConnections a cada invitado (solo en el host)
  hostConn: null,  // DataConnection al host (solo en invitados)
  players: [],     // [{ id, name, isHost }]
  myName: '',
  readyChoices: {}, // (host) { playerId: { character, vehicle, color, weapons } }
  takenColors: {},  // { playerId: color } — quién eligió qué color de montura
  stageDone: {},    // (host) { playerId: true } — quién ya llegó a su zona segura
  remoteStates: {}, // { playerId: {x,y,angle,vehicleDef,vehicleColor,charColor,charAccent,name} }
  mode: 'normal',   // modo de la sala: 'friendship' | 'chaos' | 'normal' (lo elige el Admin al crearla)
};

// MODOS DE SALA (multijugador). El Admin elige uno en MULTIJUGADOR, debajo de CREAR SALA; el modo
// viaja a todos los invitados (lista de jugadores y comienzo de la selección) y se muestra en la
// sala de espera. Cualquier parte del juego puede consultarlo con roomModeKey().
// MODO AMISTAD (efecto): quien cae NO puede revivir; mira a sus compañeros como espectador durante
// el resto de la fase y vuelve a jugar en la siguiente. Si caen TODOS, se acaba el juego.
// MODO CAOS (efecto): si cae UN solo jugador, todos pierden y hay que reiniciar desde la etapa 1.
const ROOM_MODES = {
  friendship: { label: 'MODO AMISTAD' },
  chaos:      { label: 'MODO CAOS' },
  normal:     { label: 'MODO NORMAL' },
};
// SALTO DE FASE -> Recolección de bajas en multijugador: NO usa modos de sala (ni Amistad, ni Caos, ni Normal);
// esa fase siempre funciona con sus propias reglas de siempre.
function mpKillsNoModes() {
  const st = STAGES[GAME.stageIndex];
  return !!(GAME.phaseSkip && st && st.objectiveType === 'killStreak');
}
function roomModeKey() { return mpKillsNoModes() ? 'normal' : (ROOM_MODES[MP.mode] ? MP.mode : 'normal'); }
// true solo en una sala multijugador en curso con el Modo amistad elegido
function mpFriendMode() { return !!MP.peer && roomModeKey() === 'friendship'; }
// true solo en una sala multijugador en curso con el Modo caos elegido.
// MODO CAOS (efecto): si UN jugador cae, TODOS pierden al instante. Para volver a jugar hay que
// empezar de nuevo desde la etapa 1 (solo el Admin puede reiniciar la partida para todos).
function mpChaosMode() { return !!MP.peer && roomModeKey() === 'chaos'; }
// ¿este jugador (ya eliminado) no puede volver a jugar en esta fase?
function mpNoRevive(level) { return !!level && (level.stage.objectiveType === 'killStreak' || mpFriendMode() || mpChaosMode()); }
// ¿está en modo espectador (eliminado, sin revivir, en multijugador)?
function mpSpectating(level) { return !!level && level.dead && !!MP.peer && mpNoRevive(level); }
function updateRoomModeUI() {
  const cur = roomModeKey();
  document.querySelectorAll('.room-mode-btn').forEach(b => b.classList.toggle('selected', b.dataset.mode === cur));
  const lobby = document.getElementById('mp-room-mode');
  if (lobby) lobby.textContent = ROOM_MODES[cur].label;
  // Recolección de bajas (salto de fase): se ocultan los modos de sala. Los invitados lo saben por el aviso del Admin.
  const hide = mpKillsNoModes() || !!MP._killsNoModes;
  document.querySelectorAll('.room-mode-picker').forEach(el => { el.style.display = hide ? 'none' : ''; });
  if (lobby && lobby.parentElement) lobby.parentElement.style.display = hide ? 'none' : '';
}

function mpMyId() { return MP.isHost ? 'host' : (MP.peer ? MP.peer.id : null); }

function mpIsActive() { return !!MP.peer; }

/* ---- Internet: el modo solitario funciona sin conexión; el multijugador la necesita ---- */
const PEERJS_URL = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
const MP_MSG_OFFLINE = 'El multijugador necesita conexión a internet. Puedes jugar en solitario sin conexión.';
const MP_MSG_NOLIB = 'No se pudo conectar con el servicio multijugador. Revisa tu conexión a internet e inténtalo de nuevo.';
const MP_MSG_LOST = 'Se perdió la conexión a internet. El multijugador la necesita para funcionar.';

function mpIsOnline() { return navigator.onLine !== false; }

// PeerJS se descarga solo cuando hace falta (así el juego en solitario nunca depende de internet).
let _peerLibLoading = null;
function mpEnsurePeerLib() {
  if (typeof Peer !== 'undefined') return Promise.resolve(true);
  if (_peerLibLoading) return _peerLibLoading;
  _peerLibLoading = new Promise(resolve => {
    const sc = document.createElement('script');
    let done = false;
    const finish = ok => { if (done) return; done = true; if (!ok) sc.remove(); resolve(ok); };
    sc.src = PEERJS_URL;
    sc.onload = () => finish(typeof Peer !== 'undefined');
    sc.onerror = () => finish(false);
    setTimeout(() => finish(typeof Peer !== 'undefined'), 12000);
    document.head.appendChild(sc);
  }).then(ok => { _peerLibLoading = null; return ok; });
  return _peerLibLoading;
}

// Devuelve '' si se puede jugar en línea, o el mensaje de error a mostrar.
async function mpCheckOnline() {
  if (!mpIsOnline()) return MP_MSG_OFFLINE;
  const ok = await mpEnsurePeerLib();
  return ok ? '' : (mpIsOnline() ? MP_MSG_NOLIB : MP_MSG_OFFLINE);
}

function mpErrText(err) {
  const t = err && err.type;
  if (t === 'peer-unavailable') return 'No existe ninguna sala con ese código.';
  if (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed' || !mpIsOnline()) return MP_MSG_OFFLINE;
  return 'Error de conexión: ' + t;
}

// Control de congestión: el estado se manda completo ~20 veces por segundo, así que
// si la conexión de un teléfono está saturada se salta ese envío (el siguiente trae
// el estado más nuevo). Sin esto los mensajes se acumulaban y ese jugador veía la
// batalla con varios segundos de retraso respecto a los demás.
function mpCanSend(c) {
  try { const dc = c.dataChannel; return !dc || dc.bufferedAmount < 65536; } catch (e) { return true; }
}

function mpGenerateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I, para que no se confundan al leerlo
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function mpGetName() {
  const input = document.getElementById('mp-name-input');
  const name = (input ? input.value : '').trim();
  return (name || 'Jugador').slice(0, 14);
}

function mpUpdateLobbyUI() {
  const list = document.getElementById('mp-player-list');
  if (list) {
    list.innerHTML = '';
    MP.players.forEach(p => {
      const row = document.createElement('div');
      row.className = 'mp-player-row' + (p.isHost ? ' is-host' : '');
      row.textContent = p.name + (p.isHost ? ' — Admin' : '');
      list.appendChild(row);
    });
  }
  const codeEl = document.getElementById('mp-room-code');
  if (codeEl) codeEl.textContent = MP.code || '—';
  updateRoomModeUI();
  // Solo el Admin ve el botón, y solo se activa con 2 jugadores o más en la sala.
  const startBtn = document.getElementById('btn-mp-start');
  const enough = MP.players.length >= 2;
  if (startBtn) { startBtn.style.display = MP.isHost ? '' : 'none'; startBtn.disabled = !(MP.isHost && enough); }
  const hintEl = document.getElementById('mp-start-hint');
  if (hintEl) hintEl.textContent = MP.isHost
    ? (enough ? 'Todo listo. Presiona INICIAR PARTIDA cuando quieras.' : 'Necesitas al menos 2 jugadores para iniciar la partida.')
    : 'Esperando a que el Admin inicie la partida...';
  const statusEl = document.getElementById('mp-status');
  if (statusEl) statusEl.textContent = `${MP.players.length} / 5 jugadores conectados`;
}

function mpBroadcastPlayerList() {
  MP.conns.forEach(c => { try { c.send({ type: 'players', players: MP.players, mode: roomModeKey(), noModes: mpKillsNoModes() }); } catch (e) { /* noop */ } });
  mpUpdateLobbyUI();
}

function mpCreateRoom() {
  mpResetState();
  MP.isHost = true;
  MP.code = mpGenerateCode();
  MP.myName = mpGetName();
  MP.players = [{ id: 'host', name: MP.myName, isHost: true }];
  showScreen('screen-mp-lobby');
  mpUpdateLobbyUI();
  document.getElementById('mp-status').textContent = 'Creando sala...';
  MP.peer = new Peer(MP_PREFIX + MP.code);
  MP.peer.on('open', () => { mpUpdateLobbyUI(); });
  MP.peer.on('connection', conn => {
    if (MP.players.length >= 5) {
      conn.on('open', () => { conn.send({ type: 'full' }); setTimeout(() => conn.close(), 300); });
      return;
    }
    MP.conns.push(conn);
    conn.on('data', data => {
      if (data.type === 'join') {
        MP.players.push({ id: conn.peer, name: data.name, isHost: false });
        mpBroadcastPlayerList();
      }
      if (data.type === 'ready') {
        MP.readyChoices[conn.peer] = data.choices;
        mpBroadcastWaitingStatus();
        mpCheckAllReady();
      }
      if (data.type === 'color-pick') {
        mpClaimColor(conn.peer, data.color);
      }
      if (data.type === 'stage-done') {
        mpHostReceiveStageDone(conn.peer);
      }
      if (data.type === 'pos') {
        // copia limpia ANTES de mpStoreRemote (que consume los disparos y agrega campos internos)
        const relay = { ...data };
        mpStoreRemote(data);
        if (data.dead) { mpFriendCheck(); mpChaosCheck(); } // Modo amistad: ¿cayeron todos? · Modo caos: ¿cayó alguien?
        if (!MP._peerRelay) MP._peerRelay = {};
        const prevRelay = MP._peerRelay[relay.id];
        if (prevRelay && prevRelay.shots) relay.shots = relay.shots ? prevRelay.shots.concat(relay.shots) : prevRelay.shots;
        relay._fresh = true;
        MP._peerRelay[relay.id] = relay;
        // Etapa 2: este invitado está escoltando a un familiar, se actualiza
        // su posición en la copia del Admin (que es la que se reenvía).
        if (data.ownedNpc) {
          const level = GAME.level;
          if (level && level.npcs) {
            const n = level.npcs.find(nn => nn.id === data.ownedNpc.id && nn.rescuedBy === data.id);
            if (n) { n.x = data.ownedNpc.x; n.y = data.ownedNpc.y; if (data.ownedNpc.delivered) n.delivered = true; }
          }
        }
      }
      if (data.type === 'zombie-hit') {
        const level = GAME.level;
        if (level) {
          const z = level.zombies.find(zz => zz.id === data.zombieId);
          if (z) { z.hp -= data.dmg; z.hit = 0.12; z.lastHit = conn.peer; } // el invitado que lo golpeó
        }
      }
      if (data.type === 'ehit') {
        const level = GAME.level;
        if (level) {
          if (data.kind === 'boss' && level.boss && !level.boss.invulnerable) { level.boss.hp -= data.dmg; level.boss.hit = 0.12; }
          if (data.kind === 'heli' && level.heli && !(level.heli.isBoss && level.heli.shielded)) {
            const tough = level.heli.isBoss && level.heli.hp <= level.heli.maxHp * 0.5;
            level.heli.hp -= tough ? data.dmg / 3 : data.dmg;
            level.heli.hit = 0.12;
          }
          if (data.kind === 'minirobot' && level.miniRobots) {
            const m = level.miniRobots.find(mm => mm.id === data.id);
            if (m && m.alive !== false) { m.hp -= data.dmg; m.hit = 0.12; }
          }
          if (data.kind === 'ship' && level.ship && !level.ship.invulnerable && !level.ship.defeated) { level.ship.hp -= data.dmg; level.ship.hit = 0.12; }
          if (data.kind === 'ship2' && level.ship2 && !level.ship2.invulnerable && !level.ship2.defeated) { level.ship2.hp -= data.dmg; level.ship2.hit = 0.12; }
          if (data.kind === 'miniplane' && level.miniPlanes) {
            const m = level.miniPlanes.find(mm => mm.id === data.id);
            if (m) { m.hp -= data.dmg; m.hit = 0.12; }
          }
        }
      }
      // Etapa 1: un invitado pide que se le acredite el rescate de un
      // superviviente puntual (el Admin valida y es quien manda la verdad).
      if (data.type === 'rescue-survivor') {
        const level = GAME.level;
        if (level) mpClaimSurvivor(level, data.id);
      }
      // Etapa 2: un invitado pide rescatar a un familiar puntual.
      if (data.type === 'rescue-npc') {
        const level = GAME.level;
        if (level) mpClaimNpc(level, data.id, conn.peer);
      }
      // Etapa 2: un invitado murió escoltando a un familiar sin entregarlo.
      if (data.type === 'release-npc') {
        const level = GAME.level;
        if (level) mpReleaseNpc(level, data.id);
      }
      // Etapa 3: un invitado pide agarrar la poción del jefe helicóptero.
      if (data.type === 'take-potion') {
        const level = GAME.level;
        if (level) mpClaimPotion(level, conn.peer);
      }
    });
    conn.on('close', () => {
      MP.players = MP.players.filter(p => p.id !== conn.peer);
      MP.conns = MP.conns.filter(c => c !== conn);
      delete MP.remoteStates[conn.peer];
      if (MP._peerRelay) delete MP._peerRelay[conn.peer];
      mpBroadcastPlayerList();
      // Si ya empezó la selección o la partida y el Admin se queda solo, no se puede seguir jugando
      if (MP.isHost && MP.peer && MP.players.length < 2 && !['screen-menu', 'screen-mp-join', 'screen-mp-lobby'].includes(GAME.screen)) { mpNotEnoughPlayers(); return; }
      mpFriendCheck();
    });
  });
  MP.peer.on('error', err => { mpShowJoinError(mpErrText(err)); });
}

function mpJoinRoom(code) {
  mpResetState();
  MP._lastSeq = 0;
  MP.isHost = false;
  MP.myName = mpGetName();
  showScreen('screen-mp-lobby');
  document.getElementById('mp-status').textContent = 'Conectando a la sala...';
  MP.peer = new Peer();
  MP.peer.on('open', () => {
    const conn = MP.peer.connect(MP_PREFIX + code.toUpperCase());
    MP.hostConn = conn;
    conn.on('open', () => { conn.send({ type: 'join', name: MP.myName }); });
    const handleHostData = data => {
      // El Admin abandonó la partida: se corta todo y aparece el aviso de pérdida de señal.
      if (data.type === 'host-left') { mpHostLeft(); return; }
      // Estado de otra etapa (p. ej. del jefe final mientras aquí aún no empezó la
      // batalla definitiva): se ignora para no mezclar jefes de distintas fases.
      if (data.sid !== undefined && (data.type === 'zombies' || data.type === 'enemies' || data.type === 'objective')) {
        if (!GAME.level || GAME.level.stage.id !== data.sid) return;
      }
      // El Admin da la señal para que la batalla definitiva empiece a la vez en todos.
      if (data.type === 'final-battle-start') { if (GAME.screen === 'screen-challenge') startFinalBattle(); }
      if (data.type === 'players') { MP.code = code.toUpperCase(); MP.players = data.players; if (ROOM_MODES[data.mode]) MP.mode = data.mode; MP._killsNoModes = !!data.noModes; mpUpdateLobbyUI(); }
      if (data.type === 'full') { mpShowJoinError('Esa sala ya tiene 5 jugadores.'); mpLeaveRoom(); }
      if (data.type === 'begin-selection') {
        MP.takenColors = {};
        if (ROOM_MODES[data.roomMode]) MP.mode = data.roomMode;
        if (KILL_DIFFS[data.killDiff]) GAME.killDifficulty = data.killDiff;
        // el Admin puede arrancar en otra etapa (modo especial "Recolección de bajas")
        if (typeof data.stageIndex === 'number' && data.stageIndex > 0 && STAGES[data.stageIndex]) {
          GAME.phaseSkip = true; GAME.stageIndex = data.stageIndex; GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
        } else {
          GAME.phaseSkip = false;
          if (mpChaosMode()) {
            // solo Modo caos (reinicio tras perder): de nuevo desde la etapa 1 y con la selección limpia
            GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
            GAME.paused = false; MP.remoteStates = {}; MP._doneIds = [];
            mpFreshSelection();
          }
        }
        GAME.charBack = null; buildCharacterGrid(); showScreen('screen-character');
      }
      if (data.type === 'friend-over') { mpFriendGameOver(); }
      if (data.type === 'chaos-over') { mpChaosGameOver(data.who); }
      if (data.type === 'kills-over') {
        const lv = GAME.level;
        if (lv && lv.stage.objectiveType === 'killStreak') killStreakFinish(lv, data.kills, data.time, data.board);
      }
      if (data.type === 'waiting-status') { mpUpdateWaitingUI(data.readyIds); }
      if (data.type === 'colors-taken') { MP.takenColors = data.taken; mpApplyTakenColorsToUI(); }
      if (data.type === 'begin-stage') { mpStartStageForAll(); }
      if (data.type === 'stage-progress') { mpUpdateStageWaitUI(data.doneIds); }
      if (data.type === 'advance-stage') { advanceStage(); }
      if (data.type === 'pos') {
        if (data.id !== mpMyId()) {
          mpStoreRemote(data);
          // Etapa 2: otro jugador está escoltando a un familiar; se
          // actualiza su posición en nuestra copia local.
          if (data.ownedNpc) {
            const level = GAME.level;
            if (level && level.npcs) {
              const n = level.npcs.find(nn => nn.id === data.ownedNpc.id && nn.rescuedBy === data.id);
              if (n) { n.x = data.ownedNpc.x; n.y = data.ownedNpc.y; if (data.ownedNpc.delivered) n.delivered = true; }
            }
          }
        }
      }
      if (data.type === 'zombies') {
        const level = GAME.level;
        if (level) {
          const ZT = ['walker', 'gunner', 'rider'];
          level.zombies = mpMergeSmooth(level.zombies, data.list.map(a => ({ id: a[0], x: a[1], y: a[2], angle: a[3] / 100, type: ZT[a[4]], hp: a[5], maxHp: a[6], hit: a[7] ? 0.12 : 0 })));
          GAME.run.kills = data.kills; GAME.run.totalKills = data.totalKills;
          level.killsThisStage = data.killsThisStage;
          if (data.killsBy) level.killsBy = data.killsBy;
          // Se ven volar las balas enemigas (antes solo las veía el Admin);
          // acá solo se dibujan/mueven, el daño lo sigue resolviendo el Admin.
          if (data.enemyBullets) level.enemyBullets = data.enemyBullets.map(a => ({ x: a[0], y: a[1], vx: a[2], vy: a[3], life: a[4] / 100 }));
        }
      }
      if (data.type === 'enemies') {
        const level = GAME.level;
        if (level) {
          // Etapa 5: en cuanto el Admin derrota al jefe final, se dispara la
          // MISMA cutscene local para este jugador (cada uno la ve a su
          // propio ritmo, la decisión final llega aparte, ver 'ending').
          const bossJustDefeated = level.stage.objectiveType === 'boss' && data.boss && data.boss.defeated && level.subPhase === 'play' && !(level.boss && level.boss.defeated);
          level.heli = mpMergeSmoothOne(level.heli, data.heli);
          level.miniPlanes = mpMergeSmooth(level.miniPlanes, data.miniPlanes);
          level.boss = mpMergeSmoothOne(level.boss, data.boss);
          level.miniRobots = mpMergeSmooth(level.miniRobots, data.miniRobots);
          level.airBossDone = data.airBossDone;
          if (data.finalPhase && data.finalPhase !== level.finalPhase) { level.finalPhase = data.finalPhase; level.shakeT = 0.25; }
          level.ship = mpMergeSmoothOne(level.ship, data.ship || null);
          level.ship2 = mpMergeSmoothOne(level.ship2, data.ship2 || null);
          // Etapa 3: la poción del jefe helicóptero es compartida — solo el
          // Admin la crea/valida, acá solo se refleja su estado.
          if (data.potion) {
            let pk = level.pickups.find(p => p.kind === 'potion');
            if (!pk) { pk = { x: data.potion.x, y: data.potion.y, kind: 'potion', taken: data.potion.taken, r: 20 }; level.pickups.push(pk); }
            else { pk.taken = data.potion.taken; }
          }
          level.potionEligible = data.potionEligible || null;
          level.potionHolder = data.potionHolder || null;
          if (level.potionHolder === mpMyId()) level.hasPotion = true;
          if (bossJustDefeated) { level.subPhase = 'bossDefeatedCutscene'; level.cutsceneT = 0; }
        }
      }
      if (data.type === 'objective') {
        const level = GAME.level;
        if (level) {
          if (data.survivors) { level.survivors = data.survivors; level.rescuedThisStage = data.rescuedThisStage; }
          if (data.runRescued !== undefined) GAME.run.rescued = data.runRescued;
          if (data.npcs) {
            const myId = mpMyId();
            const mine = level.npcs.find(n => n.rescuedBy != null && n.rescuedBy === myId);
            // Al familiar que YO estoy escoltando lo sigo moviendo con mi
            // propia física local (más fluida, sin el retraso ida-y-vuelta
            // por el Admin); solo se toma la copia del Admin para el resto.
            level.npcs = data.npcs.map(n => (mine && n.id === mine.id && n.rescuedBy === myId)
              ? { ...n, x: mine.x, y: mine.y, delivered: mine.delivered || n.delivered }
              : n);
          }
        }
      }
      if (data.type === 'damage') {
        if (data.targetId && data.targetId !== mpMyId()) { /* no era para mí, se ignora */ }
        else { const level = GAME.level; if (level) damagePlayerOrVehicle(level, data.dmg); }
      }
      // Etapa 5: el Admin ya decidió el final — pasamos a esa misma
      // pantalla nosotros también, estemos donde estemos (jugando, leyendo
      // el papel, o ya esperando en la pantalla de decisión).
      if (data.type === 'ending') { resolveEnding(data.yes); }
      // Batalla definitiva: el Admin derrotó al zombie con lentes en su nave.
      if (data.type === 'final-victory') { showFinalVictory(); }
    };
    conn.on('data', data => {
      if (data.type === 'bj') { try { data = JSON.parse(data.j); } catch (err) { return; } }
      if (data.type === 'batch') {
        if (data.seq !== undefined) { if (data.seq <= (MP._lastSeq || 0)) return; MP._lastSeq = data.seq; }
        if (data.sid !== undefined && (!GAME.level || GAME.level.stage.id !== data.sid)) return;
        for (const m of data.msgs) { try { handleHostData(m); } catch (err) { console.error('mp msg error', err); } }
        if (data.peers) for (const m of data.peers) { try { handleHostData(m); } catch (err) { console.error('mp msg error', err); } }
      } else { try { handleHostData(data); } catch (err) { console.error('mp msg error', err); } }
    });
    conn.on('error', () => { mpShowJoinError('No se pudo conectar. Revisá el código.'); mpLeaveRoom(); });
    // Si la conexión con el Admin se cierra estando ya dentro de la sala (cerró la pestaña, se cayó, etc.)
    conn.on('close', () => { if (!MP.isHost && MP.hostConn === conn && MP.code) mpHostLeft(); });
  });
  MP.peer.on('error', err => {
    mpShowJoinError(mpErrText(err));
    mpLeaveRoom();
  });
}

function mpShowJoinError(msg) {
  showScreen('screen-mp-join');
  const el = document.getElementById('mp-join-error');
  if (el) el.textContent = msg;
}

function mpResetState(delayDestroy) {
  if (MP.peer) {
    const oldPeer = MP.peer;
    // con delayDestroy se espera un instante para que el aviso "host-left" alcance a llegar a los invitados
    if (delayDestroy) setTimeout(() => { try { oldPeer.destroy(); } catch (e) { /* noop */ } }, 500);
    else { try { oldPeer.destroy(); } catch (e) { /* noop */ } }
  }
  MP.peer = null; MP.isHost = false; MP.code = null;
  MP.conns = []; MP.hostConn = null; MP.players = [];
  MP._killsNoModes = false;
}

function mpLeaveRoom() {
  GAME.phaseSkip = false;
  const wasHost = MP.isHost;
  // Si sale el Admin, todos los invitados pierden la señal y ya no pueden jugar ni elegir nada
  if (wasHost) MP.conns.forEach(c => { try { c.send({ type: 'host-left' }); } catch (e) { /* noop */ } });
  mpResetState(wasHost);
  showScreen('screen-menu');
}

// Ventana de aviso genérica (multijugador): bloquea la pantalla hasta que se presiona el botón.
function mpShowNotice(title, text, sub, btnLabel) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('mp-notice-title', title); set('mp-notice-text', text); set('mp-notice-sub', sub); set('mp-notice-btn', btnLabel);
  const ov = document.getElementById('mp-notice-overlay');
  if (ov) ov.classList.add('show');
}

// Admin: todos los invitados se fueron y no quedan jugadores suficientes.
function mpNotEnoughPlayers() {
  fullReset();
  mpResetState();
  showScreen('screen-menu');
  mpShowNotice('NO HAY SUFICIENTES JUGADORES', 'No hay suficientes jugadores para poder jugar.', 'El resto de los jugadores abandonó la partida.', 'IR A LA PANTALLA DE INICIO');
}

// Salir al menú desde la selección o desde la partida. Si quien sale es un invitado, ve un aviso.
function mpExitToMenu() {
  const wasGuest = mpIsActive() && !MP.isHost && !!MP.code;
  mpLeaveRoom();
  if (wasGuest) mpShowNotice('HAS ABANDONADO LA PARTIDA', 'Has abandonado la partida.', 'Ya no participas en esta sala.', 'ACEPTAR');
}

// Invitados: el Admin abandonó la sala/partida. Se corta la conexión y se muestra un aviso
// que bloquea toda la pantalla, con un único botón para volver al inicio.
function mpHostLeft() {
  if (!MP.peer || MP.isHost) return;
  fullReset();
  mpResetState();
  showScreen('screen-menu');
  const ov = document.getElementById('host-left-overlay');
  if (ov) ov.classList.add('show');
}

// Si el internet se cae y sigue caído unos segundos en pleno multijugador, se sale de
// la sala con un aviso (una microcaída de un par de segundos no expulsa a nadie).
window.addEventListener('offline', () => {
  if (!mpIsActive()) return;
  clearTimeout(MP._offlineT);
  MP._offlineT = setTimeout(() => {
    if (mpIsActive() && !mpIsOnline()) { fullReset(); mpResetState(); mpShowJoinError(MP_MSG_LOST); }
  }, 4000);
});
window.addEventListener('online', () => clearTimeout(MP._offlineT));

/* --- Colores de montura: el host arbitra quién eligió cada color --- */

function mpClaimColor(playerId, color) {
  // Si alguien más ya lo tiene, no se reasigna (evita pisadas por carrera).
  const alreadyTakenByOther = Object.entries(MP.takenColors).some(([id, c]) => id !== playerId && c === color);
  if (alreadyTakenByOther) { mpBroadcastTakenColors(); return; }
  MP.takenColors[playerId] = color;
  mpBroadcastTakenColors();
}

function mpBroadcastTakenColors() {
  MP.conns.forEach(c => { try { c.send({ type: 'colors-taken', taken: MP.takenColors }); } catch (e) { /* noop */ } });
  mpApplyTakenColorsToUI();
}

function mpApplyTakenColorsToUI() {
  const row = document.getElementById('color-swatch-row');
  if (!row) return;
  const myId = mpMyId();
  const myColor = MP.takenColors[myId] || null;
  GAME.selection.vehicleColor = myColor;
  row.querySelectorAll('.color-swatch').forEach(sw => {
    const color = sw.dataset.color;
    const ownerId = Object.keys(MP.takenColors).find(id => MP.takenColors[id] === color);
    sw.classList.toggle('selected', ownerId === myId);
    sw.classList.toggle('taken', !!ownerId && ownerId !== myId);
  });
  const btn = document.getElementById('btn-vehicle-next');
  if (btn) btn.disabled = !GAME.selection.vehicle || !myColor;
}

/* --- Selección sincronizada: todos eligen y arrancan la fase 1 juntos --- */

function mpBeginSelectionForAll() {
  MP.readyChoices = {};
  MP.takenColors = {};
  MP.stageDone = {};
  MP.remoteStates = {};
  MP.conns.forEach(c => { try { c.send({ type: 'begin-selection', stageIndex: GAME.phaseSkip ? GAME.stageIndex : 0, killDiff: killDiffKey(), roomMode: roomModeKey() }); } catch (e) { /* noop */ } });
  if (!GAME.phaseSkip) { GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 }; }
  GAME.charBack = null;
  buildCharacterGrid();
  showScreen('screen-character');
}

function mpMarkReady() {
  const choices = {
    character: GAME.selection.character,
    vehicle: GAME.selection.vehicle,
    companion: GAME.selection.companion,
    vehicleColor: GAME.selection.vehicleColor,
    weapons: GAME.selection.weapons,
  };
  if (MP.isHost) {
    MP.readyChoices.host = choices;
    mpBroadcastWaitingStatus();
    mpUpdateWaitingUI(Object.keys(MP.readyChoices));
    if (mpCheckAllReady()) return; // ya arrancó la fase para todos; no pisar esa pantalla
    showScreen('screen-mp-waiting');
  } else {
    MP.hostConn.send({ type: 'ready', choices });
    mpUpdateWaitingUI([]); // se actualiza en cuanto llegue el próximo 'waiting-status'
    showScreen('screen-mp-waiting');
  }
}

function mpBroadcastWaitingStatus() {
  const readyIds = Object.keys(MP.readyChoices);
  MP.conns.forEach(c => { try { c.send({ type: 'waiting-status', readyIds }); } catch (e) { /* noop */ } });
  mpUpdateWaitingUI(readyIds);
}

function mpUpdateWaitingUI(readyIds) {
  const list = document.getElementById('mp-waiting-list');
  if (!list) return;
  list.innerHTML = '';
  MP.players.forEach(p => {
    const isReady = readyIds.includes(p.isHost ? 'host' : p.id);
    const row = document.createElement('div');
    row.className = 'mp-player-row' + (isReady ? ' is-host' : '');
    row.textContent = p.name + (p.isHost ? ' — Admin' : '') + (isReady ? ' ✔' : ' — eligiendo...');
    list.appendChild(row);
  });
}

function mpCheckAllReady() {
  if (Object.keys(MP.readyChoices).length !== MP.players.length) return false;
  MP.conns.forEach(c => { try { c.send({ type: 'begin-stage' }); } catch (e) { /* noop */ } });
  mpStartStageForAll();
  return true;
}

function mpStartStageForAll() {
  beginStageIntro();
  const continueBtn = document.querySelector('#screen-stage-intro [data-action="stage-intro-continue"]');
  if (continueBtn) continueBtn.style.visibility = 'hidden';
  const targetScreen = 'screen-stage-intro';
  setTimeout(() => {
    if (continueBtn) continueBtn.style.visibility = '';
    if (GAME.screen === targetScreen) startStageGameplay();
  }, 1800);
}

/* --- Avance de fase sincronizado: nadie pasa hasta que todos llegaron a su zona segura --- */

function mpMarkStageDone() {
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  showScreen('screen-mp-stage-wait');
  if (MP.isHost) {
    mpHostReceiveStageDone('host');
  } else {
    MP.hostConn.send({ type: 'stage-done' });
    mpUpdateStageWaitUI([]);
  }
}

function mpHostReceiveStageDone(playerId) {
  MP.stageDone[playerId] = true;
  const doneIds = Object.keys(MP.stageDone);
  MP.conns.forEach(c => { try { c.send({ type: 'stage-progress', doneIds }); } catch (e) { /* noop */ } });
  mpUpdateStageWaitUI(doneIds);
  mpHostTryAdvance();
}

// ¿este jugador está eliminado ahora mismo? (el Admin lo sabe por el estado que envía cada invitado)
function mpPlayerIsDead(id) {
  if (id === 'host') return !!(GAME.level && GAME.level.dead);
  const s = MP.remoteStates[id];
  return !!(s && s.dead);
}

// Solo el Admin. La fase avanza cuando todos llegaron a la zona segura; en Modo amistad los
// jugadores eliminados no cuentan (miran la fase y vuelven a jugar en la siguiente), pero tiene
// que haber llegado al menos uno.
function mpHostTryAdvance() {
  const ids = MP.players.map(p => (p.isHost ? 'host' : p.id));
  const doneIds = Object.keys(MP.stageDone);
  const ready = mpFriendMode()
    ? doneIds.length > 0 && ids.every(id => MP.stageDone[id] || mpPlayerIsDead(id))
    : doneIds.length === MP.players.length;
  if (!ready) return;
  MP.stageDone = {};
  MP.conns.forEach(c => { try { c.send({ type: 'advance-stage' }); } catch (e) { /* noop */ } });
  advanceStage();
}

// Solo el Admin, en Modo amistad: si cayeron TODOS se acaba el juego; si no, comprueba si los que
// siguen vivos ya terminaron la fase. Se llama cuando alguien cae o se desconecta.
function mpFriendCheck() {
  if (!mpFriendMode() || !MP.isHost) return;
  const level = GAME.level;
  if (!level || level._friendOver) return;
  // (Recolección de bajas ya termina sola cuando cae el último jugador, ver updateKillStreak)
  if (level.stage.objectiveType !== 'killStreak' && GAME.screen === 'screen-game' && level.dead) {
    const ids = MP.players.map(p => (p.isHost ? 'host' : p.id));
    if (ids.every(id => mpPlayerIsDead(id))) {
      MP.conns.forEach(c => { try { c.send({ type: 'friend-over' }); } catch (e) { /* noop */ } });
      mpFriendGameOver();
      return;
    }
  }
  mpHostTryAdvance();
}

// Fin del juego en Modo amistad (todos cayeron): pantalla para todos. Igual que en el Modo caos, solo el
// Admin puede reiniciar la partida (desde la etapa 1 para todos); los invitados esperan o salen de la sala.
function mpFriendGameOver() {
  const lv = GAME.level;
  if (lv) { if (lv._friendOver) return; lv._friendOver = true; lv.subPhase = 'complete'; }
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  const overlay = document.getElementById('hud-dead-overlay');
  if (overlay) overlay.classList.remove('show');
  document.getElementById('stage-fail-title').textContent = 'FIN DEL JUEGO';
  document.getElementById('stage-fail-sub').textContent = 'MODO AMISTAD: todos los jugadores cayeron. ' +
    (MP.isHost ? 'Si vuelven a jugar, empezarán desde la etapa 1.' : 'Esperando a que el Admin reinicie la partida desde la etapa 1...');
  stageFailButtons('chaos'); // mismos botones que el Modo caos: VOLVER A JUGAR (ETAPA 1) solo para el Admin
  showScreen('screen-stage-fail');
}

// Solo el Admin, en Modo caos: si cualquier jugador cayó, TODOS pierden. Se llama cuando alguien cae.
function mpChaosCheck() {
  if (!mpChaosMode() || !MP.isHost) return;
  const level = GAME.level;
  if (!level || level._chaosOver) return;
  if (level.stage.objectiveType === 'killStreak') return; // esa fase termina sola en updateKillStreak (con su tabla de bajas)
  const ids = MP.players.map(p => (p.isHost ? 'host' : p.id));
  const fallenId = ids.find(id => mpPlayerIsDead(id));
  if (fallenId === undefined) return;
  const fallen = MP.players.find(p => (p.isHost ? 'host' : p.id) === fallenId);
  const who = fallen ? fallen.name : '';
  MP.conns.forEach(c => { try { c.send({ type: 'chaos-over', who }); } catch (e) { /* noop */ } });
  mpChaosGameOver(who);
}

// Fin del juego en Modo caos: pantalla de derrota para todos. Solo el Admin puede reiniciar (desde la etapa 1).
function mpChaosGameOver(who) {
  const lv = GAME.level;
  if (lv) { if (lv._chaosOver) return; lv._chaosOver = true; lv.subPhase = 'complete'; }
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  const overlay = document.getElementById('hud-dead-overlay');
  if (overlay) overlay.classList.remove('show');
  document.getElementById('stage-fail-title').textContent = 'FIN DEL JUEGO';
  document.getElementById('stage-fail-sub').textContent = 'MODO CAOS: ' + (who || 'un jugador') + ' cayó y todos pierden. ' +
    (MP.isHost ? 'Si vuelven a jugar, empezarán desde la etapa 1.' : 'Esperando a que el Admin reinicie la partida desde la etapa 1...');
  stageFailButtons('chaos');
  showScreen('screen-stage-fail');
}

// Deja la selección de personaje/vehículo en blanco (nueva partida desde la etapa 1).
function mpFreshSelection() {
  GAME.selection = { character: null, vehicle: null, weapons: [], companion: null };
  const b = document.getElementById('btn-char-next');
  if (b) b.disabled = true;
}

// Botones de la pantalla de fracaso: normal (reintentar / menú), fin del Modo amistad (solo salir de la sala)
// o fin del Modo caos / Modo amistad (el Admin puede volver a jugar desde la etapa 1; los invitados esperan o salen).
function stageFailButtons(kind) {
  const friendOver = kind === true || kind === 'friend';
  const chaos = kind === 'chaos';
  const retry = document.getElementById('btn-stage-retry');
  const menu = document.getElementById('btn-stage-menu');
  if (retry) {
    retry.style.display = friendOver || (chaos && !MP.isHost) ? 'none' : '';
    retry.dataset.action = chaos ? 'chaos-again' : 'restart-stage';
    retry.textContent = chaos ? 'VOLVER A JUGAR (ETAPA 1)' : 'REINTENTAR ETAPA';
  }
  if (menu) {
    const leave = friendOver || chaos;
    menu.dataset.action = leave ? 'kills-exit' : 'quit-menu'; // kills-exit: reinicia y sale de la sala
    menu.textContent = leave ? 'SALIR DE LA SALA' : 'MENÚ PRINCIPAL';
  }
}

function mpUpdateStageWaitUI(doneIds) {
  MP._doneIds = doneIds || []; // los espectadores dejan de seguir a quien ya terminó la fase
  const list = document.getElementById('mp-stage-wait-list');
  if (!list) return;
  list.innerHTML = '';
  MP.players.forEach(p => {
    const id = p.isHost ? 'host' : p.id;
    const isDone = doneIds.includes(id);
    const row = document.createElement('div');
    row.className = 'mp-player-row' + (isDone ? ' is-host' : '');
    row.textContent = p.name + (p.isHost ? ' — Admin' : '') + (isDone ? ' ✔ en zona segura' : (mpFriendMode() && mpPlayerIsDead(id)) ? ' ☠ eliminado — espectador' : ' — jugando...');
    list.appendChild(row);
  });
}

/* --- Mundo compartido: ver a los demás jugadores moverse en tiempo real --- */

// Arma el paquete de posición/estado propio, incluyendo si este jugador
// ya fue eliminado (dead) para que el resto (y el Admin, si no lo es)
// sepan que ya no debe recibir ataques ni contar como blanco.
// Disparos propios pendientes de enviar (jugador, compañero y aliados), en todas
// las etapas. Los demás los dibujan como balas
// visuales: el daño real lo sigue aplicando quien dispara, no cambia.
function mpQueueShot(level, b) {
  if (!mpIsActive()) return;
  if (!MP._shots) MP._shots = [];
  if (MP._shots.length > 60) return; // tope por si hay muchísimos disparos juntos
  MP._shots.push({ x: Math.round(b.x), y: Math.round(b.y), vx: Math.round(b.vx), vy: Math.round(b.vy), c: b.color, l: +b.life.toFixed(2), r: b.r, t: performance.now() });
}

function mpBuildPosPayload(level) {
  const ownedNpc = level.npcs ? level.npcs.find(n => n.rescuedBy === mpMyId() && !n.delivered) : null;
  return {
    type: 'pos',
    id: mpMyId(),
    name: MP.myName,
    x: Math.round(level.vehicle ? level.vehicle.x : level.player.x),
    y: Math.round(level.vehicle ? level.vehicle.y : level.player.y),
    angle: +(level.vehicle ? level.vehicle.angle : level.player.angle).toFixed(2),
    aimAngle: +level.player.angle.toFixed(2),
    fa: +(level.player.moveAngle || 0).toFixed(2), // hacia dónde quiere ir (para dibujar el volteo de la montura)
    vehicleDef: level.vehicle ? level.vehicle.def : null,
    vehicleColor: level.vehicle ? level.vehicle.mpColor : null,
    charId: GAME.selection.character ? GAME.selection.character.id : null,
    charColor: GAME.selection.character ? GAME.selection.character.color : '#e9e6d6',
    charAccent: GAME.selection.character ? GAME.selection.character.accent : '#5f8f2e',
    dead: !!level.dead,
    hp: level.vehicle ? level.vehicle.hp : level.player.hp,
    // Etapa 5 / batalla definitiva: mi compañero, mis aliados (Tralalero) y los
    // disparos hechos desde el último envío, para que todos los vean.
    companion: level.companion ? { x: Math.round(level.companion.x), y: Math.round(level.companion.y), color: level.companion.def.color, ability: level.companion.def.ability } : null,
    allies: level.allies ? level.allies.map(a => ({ x: Math.round(a.x), y: Math.round(a.y) })) : null,
    shots: MP._shots && MP._shots.length ? MP._shots.splice(0).map(s => ({ ...s, t: undefined, age: +((performance.now() - s.t) / 1000).toFixed(3) })) : null,
    // Etapa 2 en multijugador: si este jugador está escoltando a un
    // familiar, se manda su posición actual para que el resto (y el Admin,
    // si no lo es) lo vean moverse en tiempo real.
    ownedNpc: ownedNpc ? { id: ownedNpc.id, x: ownedNpc.x, y: ownedNpc.y, delivered: ownedNpc.delivered } : null,
  };
}

// Envía el estado propio ya mismo, sin esperar al próximo tick periódico
// (se usa justo al morir, para que los demás se enteren cuanto antes).
function mpSendMyStateNow(level) {
  const payload = mpBuildPosPayload(level);
  if (MP.isHost) {
    MP.conns.forEach(c => { try { c.send(payload); } catch (e) { /* noop */ } });
  } else if (MP.hostConn) {
    try { MP.hostConn.send(payload); } catch (e) { /* noop */ }
  }
}

function mpBroadcastMyState(level, dt) {
  MP._sendAcc = (MP._sendAcc || 0) + dt;
  // 20 envíos/s con 2 jugadores; menos a medida que hay más gente, para que la
  // red de los teléfonos (y el Admin, que manda a todos) no se sature.
  const nPl = MP.players ? MP.players.length : 2;
  const interval = nPl <= 2 ? 0.05 : nPl === 3 ? 0.06 : nPl === 4 ? 0.07 : 0.08;
  if (MP._sendAcc < interval) return;
  MP._sendAcc = 0;
  const payload = mpBuildPosPayload(level);
  if (MP.isHost) {
    const zPayload = {
      type: 'zombies', sid: level.stage.id,
      list: level.zombies.map(z => [z.id, Math.round(z.x), Math.round(z.y), Math.round(z.angle * 100), z.type === 'gunner' ? 1 : z.type === 'rider' ? 2 : 0, Math.round(z.hp), z.maxHp, z.hit > 0 ? 1 : 0]),
      kills: GAME.run.kills, totalKills: GAME.run.totalKills, killsThisStage: level.killsThisStage, killsBy: level.killsBy || null,
      // Balas de zombies/helicópteros/jefe: se mandan para que TODOS vean
      // que le están disparando a quien sea (no solo al Admin). No se manda
      // el targetRef: solo el Admin aplica el daño real (ver updateBullets),
      // el resto únicamente las dibuja volar.
      enemyBullets: level.enemyBullets.slice(-160).map(b => [Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), Math.round(b.life * 100)]),
    };
    MP._tick = (MP._tick || 0) + 1;
    const msgs = MP._tick % 2 === 0 ? [payload, zPayload, mpBuildEnemiesPayload(level)] : [payload, mpBuildEnemiesPayload(level)];
    // Etapas 1 y 2: misión de rescate compartida (supervivientes/familia).
    if (stageHasSharedObjective(level.stage)) msgs.push(mpBuildObjectivePayload(level));
    // seq: los invitados descartan paquetes viejos que lleguen desordenados.
    // sid: etapa a la que pertenece el estado (nunca se mezcla con otra etapa).
    const batch = { type: 'batch', seq: (MP._batchSeq = (MP._batchSeq || 0) + 1), sid: level.stage.id, msgs };
    // posiciones frescas de los invitados: el Admin las junta en el mismo paquete
    // (antes reenviaba cada mensaje por separado a todos: con 5 jugadores eran cientos por segundo)
    if (MP._peerRelay) {
      const fresh = Object.values(MP._peerRelay).filter(r => r._fresh);
      if (fresh.length) batch.peers = fresh.map(r => { const o = { ...r }; delete o._fresh; return o; });
      Object.values(MP._peerRelay).forEach(r => { r._fresh = false; r.shots = null; });
    }
    const wire = { type: 'bj', j: JSON.stringify(batch) };
    MP.conns.forEach(c => { if (mpCanSend(c)) { try { c.send(wire); } catch (e) { /* noop */ } } });
  } else if (MP.hostConn) {
    try { MP.hostConn.send(payload); } catch (e) { /* noop */ }
  }
}

function stageHasSharedObjective(stage) {
  return stage.objectiveType === 'rescue' || stage.objectiveType === 'findNPC';
}

function mpBuildEnemiesPayload(level) {
  const potionPk = level.pickups.find(pk => pk.kind === 'potion');
  return {
    type: 'enemies', sid: level.stage.id,
    heli: level.heli ? { x: Math.round(level.heli.x), y: Math.round(level.heli.y), hp: Math.round(level.heli.hp), maxHp: level.heli.maxHp, isBoss: level.heli.isBoss, active: level.heli.active, shielded: level.heli.shielded, hit: level.heli.hit } : null,
    miniPlanes: level.miniPlanes ? level.miniPlanes.map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), angle: +m.angle.toFixed(2), hp: Math.round(m.hp), maxHp: m.maxHp, hit: m.hit > 0 ? 0.12 : 0, alive: true })) : null,
    boss: level.boss ? { x: Math.round(level.boss.x), y: Math.round(level.boss.y), angle: +level.boss.angle.toFixed(2), hp: Math.round(level.boss.hp), maxHp: level.boss.maxHp, active: level.boss.active, defeated: level.boss.defeated, coreDefeated: level.boss.coreDefeated, invulnerable: level.boss.invulnerable, phase: level.boss.phase, hit: level.boss.hit, big: level.boss.big, scale: level.boss.scale } : null,
    miniRobots: level.miniRobots ? level.miniRobots.map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), angle: +m.angle.toFixed(2), hp: Math.round(m.hp), maxHp: m.maxHp, hit: m.hit > 0 ? 0.12 : 0, alive: true })) : null,
    airBossDone: level.airBossDone || false,
    // Batalla definitiva: fase (1 = helicóptero + robot, 2 = nave) y el tercer jefe.
    finalPhase: level.finalPhase || 0,
    ship: level.ship ? { x: Math.round(level.ship.x), y: Math.round(level.ship.y), angle: +level.ship.angle.toFixed(2), hp: Math.round(level.ship.hp), maxHp: level.ship.maxHp, phase: level.ship.phase, entering: level.ship.entering, invulnerable: level.ship.invulnerable, defeated: level.ship.defeated, hit: level.ship.hit } : null,
    ship2: level.ship2 ? { x: Math.round(level.ship2.x), y: Math.round(level.ship2.y), angle: +level.ship2.angle.toFixed(2), hp: Math.round(level.ship2.hp), maxHp: level.ship2.maxHp, phase: level.ship2.phase, entering: level.ship2.entering, invulnerable: level.ship2.invulnerable, defeated: level.ship2.defeated, hit: level.ship2.hit } : null,
    // Etapa 3: la poción que suelta el jefe helicóptero, quién puede
    // agarrarla (más vida) y quién ya la tiene en mano.
    potion: potionPk ? { x: potionPk.x, y: potionPk.y, taken: potionPk.taken } : null,
    potionEligible: level.potionEligible || null,
    potionHolder: level.potionHolder || null,
  };
}

function mpBuildObjectivePayload(level) {
  const payload = { type: 'objective', sid: level.stage.id };
  if (level.stage.objectiveType === 'rescue') {
    payload.survivors = level.survivors.map(s => ({ id: s.id, x: s.x, y: s.y, rescued: s.rescued }));
    payload.rescuedThisStage = level.rescuedThisStage;
    payload.runRescued = GAME.run.rescued;
  }
  if (level.stage.objectiveType === 'findNPC') {
    payload.npcs = level.npcs.map(n => ({ id: n.id, kind: n.kind, name: n.name, x: n.x, y: n.y, found: n.found, following: n.following, delivered: n.delivered, rescuedBy: n.rescuedBy }));
  }
  return payload;
}

// El Admin es quien decide la verdad de la misión compartida: valida el
// pedido (que no esté ya rescatado) y, si es válido, lo aplica y avisa a
// todos de inmediato (además del reenvío periódico ya existente).
function mpClaimSurvivor(level, id) {
  const s = level.survivors.find(sv => sv.id === id);
  if (!s || s.rescued) return;
  s.rescued = true;
  level.rescuedThisStage++;
  GAME.run.rescued++;
  if (mpIsActive() && MP.isHost) MP.conns.forEach(c => { try { c.send(mpBuildObjectivePayload(level)); } catch (e) { /* noop */ } });
}

// Etapa 2: cada jugador puede rescatar a un solo familiar. El Admin valida
// que el familiar exista, no esté ya encontrado, y que quien lo pide no
// tenga ya otro familiar a cargo.
function mpClaimNpc(level, id, requesterId) {
  const n = level.npcs.find(nn => nn.id === id);
  if (!n || n.found) return;
  const alreadyHasOne = level.npcs.some(nn => nn.rescuedBy != null && nn.rescuedBy === requesterId);
  if (alreadyHasOne) return;
  n.found = true;
  n.following = true;
  n.rescuedBy = requesterId;
  if (mpIsActive() && MP.isHost) MP.conns.forEach(c => { try { c.send(mpBuildObjectivePayload(level)); } catch (e) { /* noop */ } });
}

// Si quien lo estaba escoltando muere ANTES de entregarlo, el familiar
// vuelve a donde estaba cuando lo encontraron y queda libre para que
// cualquiera (el mismo jugador al reaparecer, u otro) tenga que ir a
// rescatarlo de nuevo.
function mpReleaseNpc(level, id) {
  const n = level.npcs.find(nn => nn.id === id);
  if (!n || n.delivered) return; // ya entregado: no se libera
  n.found = false;
  n.following = false;
  n.rescuedBy = null;
  n.x = n.spawnX;
  n.y = n.spawnY;
  if (mpIsActive() && MP.isHost) MP.conns.forEach(c => { try { c.send(mpBuildObjectivePayload(level)); } catch (e) { /* noop */ } });
}

// Etapa 3: solo puede agarrar la poción quien tenga más vida en la partida
// en el momento en que el jefe helicóptero la soltó (level.potionEligible,
// calculado una sola vez ahí). Si nadie es "más elegible" que otro
// (empate), potionEligible queda null y cualquiera puede tomarla.
function mpClaimPotion(level, id) {
  if (level.potionHolder) return;
  if (mpIsActive() && level.potionEligible && !level.potionEligible.includes(id)) return;
  const potion = level.pickups.find(pk => pk.kind === 'potion' && !pk.taken);
  if (!potion) return;
  potion.taken = true;
  level.potionHolder = id;
  if (id === mpMyId()) level.hasPotion = true;
  if (mpIsActive() && MP.isHost) MP.conns.forEach(c => { try { c.send(mpBuildEnemiesPayload(level)); } catch (e) { /* noop */ } });
}

/* ---- Suavizado (interpolacion) de lo que llega por red ---- */
function mpStoreRemote(data) {
  const prev = MP.remoteStates[data.id];
  data.rx = prev && prev.rx !== undefined ? prev.rx : data.x;
  data.ry = prev && prev.ry !== undefined ? prev.ry : data.y;
  data.ra = prev && prev.ra !== undefined ? prev.ra : data.angle;
  data.rAim = prev && prev.rAim !== undefined ? prev.rAim : (data.aimAngle !== undefined ? data.aimAngle : data.angle);
  data.rComp = prev ? prev.rComp : null;
  data.rAllies = prev ? prev.rAllies : null;
  MP.remoteStates[data.id] = data;
  // disparos del otro jugador: se agregan como balas solo visuales (sin daño)
  const level = GAME.level;
  if (data.shots && level && level.remoteBullets) {
    data.shots.forEach(s => {
      const age = Math.min(0.25, s.age || 0); // compensa el retraso de red
      level.remoteBullets.push({ x: s.x + s.vx * age, y: s.y + s.vy * age, vx: s.vx, vy: s.vy, color: s.c, life: s.l - age, r: s.r });
    });
    if (level.remoteBullets.length > 250) level.remoteBullets.splice(0, level.remoteBullets.length - 250);
    data.shots = null;
  }
}

// Conserva la posicion visible anterior y guarda la nueva como objetivo (tx,ty);
// cada frame se acerca a ella (mpSmoothStep) en vez de "teletransportarse".
function mpMergeSmoothOne(old, inc) {
  if (!inc) return inc;
  inc.tx = inc.x; inc.ty = inc.y; inc.ta = inc.angle;
  if (old && old.x !== undefined && dist(old.x, old.y, inc.x, inc.y) < 260) {
    inc.x = old.x; inc.y = old.y;
    if (inc.angle !== undefined && old.angle !== undefined) inc.angle = old.angle;
  }
  return inc;
}
function mpMergeSmooth(oldList, incList) {
  if (!incList) return incList;
  const byId = new Map();
  (oldList || []).forEach(o => byId.set(o.id, o));
  return incList.map(n => mpMergeSmoothOne(byId.get(n.id), n));
}
function mpSmoothStep(level, dt) {
  const k = 1 - Math.exp(-dt * 22);
  const step = e => {
    if (!e || e.tx === undefined) return;
    e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k;
    if (e.ta !== undefined && e.angle !== undefined) e.angle = lerpAngle(e.angle, e.ta, k);
  };
  level.zombies.forEach(step);
  step(level.heli); step(level.boss); step(level.ship); step(level.ship2);
  if (level.miniPlanes) level.miniPlanes.forEach(step);
  if (level.miniRobots) level.miniRobots.forEach(step);
}

function mpDrawRemotePlayers(ctx) {
  const myId = mpMyId();
  const k = 1 - Math.exp(-(GAME.frameDt || 0.016) * 22);
  Object.values(MP.remoteStates).forEach(s => {
    if (s.id === myId) return;
    if (dist(s.rx, s.ry, s.x, s.y) > 300) { s.rx = s.x; s.ry = s.y; }
    else { s.rx += (s.x - s.rx) * k; s.ry += (s.y - s.ry) * k; }
    s.ra = lerpAngle(s.ra, s.angle, k);
    { const mv = Math.hypot(s.rx - (s._lx === undefined ? s.rx : s._lx), s.ry - (s._ly === undefined ? s.ry : s._ly));
      s._lx = s.rx; s._ly = s.ry;
      s._sp = (s._sp || 0) + ((mv > 0.15 ? 1 : 0) - (s._sp || 0)) * 0.2;
      s._ph = (s._ph || 0) + mv * 0.16;
      stepVisualHeading(s._anim || (s._anim = {}), s.fa !== undefined ? s.fa : s.angle, 0.25, 0.3); } // animación de los demás jugadores según lo que se mueven en pantalla
    s.rAim = lerpAngle(s.rAim, s.aimAngle !== undefined ? s.aimAngle : s.angle, k);
    ctx.save();
    if (s.dead) ctx.globalAlpha = 0.35; // cuerpo apagado para el jugador eliminado
    if (s.vehicleDef) {
      const remoteRider = { id: s.charId, color: s.charColor, accent: s.charAccent, aimAngle: s.rAim };
      drawVehicle(ctx, s.rx, s.ry, s.ra, s.vehicleDef, 1, s.vehicleColor, remoteRider, Object.assign(s._anim || (s._anim = {}), { ph: s._ph || 0, sp: s._sp || 0 }));
    }
    else drawHuman(ctx, s.rx, s.ry, s.ra, s.charColor, s.charAccent, 1, s.charId);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = s.dead ? '#d1272d' : '#e9e6d6';
    ctx.font = s.dead ? 'bold 11px sans-serif' : '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
    const holdsPotion = GAME.level && GAME.level.potionHolder === s.id;
    const label = s.dead ? `☠ ${s.name || ''} — ELIMINADO` : `${s.name || ''}${holdsPotion ? ' 🧪' : ''}`;
    ctx.fillText(label, s.rx, s.ry - 46);
    ctx.restore();
    // compañero y aliados del otro jugador (con el mismo suavizado)
    ctx.save();
    if (s.dead) ctx.globalAlpha = 0.35;
    if (s.companion) {
      if (!s.rComp || dist(s.rComp.x, s.rComp.y, s.companion.x, s.companion.y) > 300) s.rComp = { x: s.companion.x, y: s.companion.y };
      else { s.rComp.x += (s.companion.x - s.rComp.x) * k; s.rComp.y += (s.companion.y - s.rComp.y) * k; }
      drawCompanion(ctx, s.rComp.x, s.rComp.y, { color: s.companion.color }, 1.4);
    }
    if (s.allies) {
      if (!s.rAllies || s.rAllies.length !== s.allies.length) s.rAllies = s.allies.map(a => ({ x: a.x, y: a.y }));
      s.allies.forEach((a, i) => {
        const r = s.rAllies[i];
        if (dist(r.x, r.y, a.x, a.y) > 300) { r.x = a.x; r.y = a.y; } else { r.x += (a.x - r.x) * k; r.y += (a.y - r.y) * k; }
        drawCompanion(ctx, r.x, r.y, { color: ALLY_COLOR }, 1.3);
      });
    }
    ctx.restore();
  });
}

/* ---------------------------------------------------------------------- */

/* ------------------------------ NAVEGACIÓN UI ----------------------------- */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  GAME.screen = id;
  if (id === 'screen-menu') startMenuMusic(); else stopMenuMusic();
  // Botones VOLVER de la selección: solo aparecen si hay una pantalla anterior a la que regresar
  const setBack = (btnId, visible) => { const b = document.getElementById(btnId); if (b) b.style.display = visible ? '' : 'none'; };
  if (id === 'screen-character') setBack('btn-char-back', true); // ATRÁS siempre disponible (también en multijugador)
  if (id === 'screen-character') { const nb = document.getElementById('btn-char-next'); if (nb) nb.disabled = !GAME.selection.character; } // CONTINUAR bloqueado hasta elegir personaje
  if (id === 'screen-vehicle') setBack('btn-vehicle-back', !!GAME.vehBack);
  if (id === 'screen-weapons') setBack('btn-weapons-back', !!GAME.weaponsBack);
}

function bindMenuActions() {
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    requestGameFullscreen();
    const action = btn.dataset.action;
    handleAction(action, btn);
  });
}

function handleAction(action, btn) {
  switch (action) {
    case 'kills-diff':
      if (btn && KILL_DIFFS[btn.dataset.diff]) { GAME.killDifficulty = btn.dataset.diff; updateKillsDiffUI(); }
      break;
    case 'room-mode':
      if (btn && ROOM_MODES[btn.dataset.mode]) { MP.mode = btn.dataset.mode; updateRoomModeUI(); }
      break;
    case 'goto-character': GAME.skipEntry = false; GAME.charBack = 'screen-mode-select'; buildCharacterGrid(); showScreen('screen-character'); break;
    case 'goto-settings': showScreen('screen-settings'); break;
    case 'goto-controls': showScreen('screen-controls'); break;
    case 'goto-credits': showScreen('screen-credits'); break;
    case 'goto-mode-select': GAME.phaseSkip = false; GAME.skipEntry = false; updateKillsDiffUI(); showScreen('screen-mode-select'); break; // JUGAR siempre empieza desde la etapa 1
    case 'goto-mp-join': {
      const modeErr = document.getElementById('mode-select-error');
      if (!mpIsOnline()) { if (modeErr) modeErr.textContent = MP_MSG_OFFLINE; break; } // sin internet no se entra
      if (modeErr) modeErr.textContent = '';
      document.getElementById('mp-join-error').textContent = '';
      updateRoomModeUI();
      showScreen('screen-mp-join');
      mpEnsurePeerLib(); // se va descargando mientras el jugador escribe su nombre
      break;
    }
    case 'mp-create':
      if (!document.getElementById('mp-name-input').value.trim()) { document.getElementById('mp-join-error').textContent = 'Escribí tu nombre antes de crear la sala.'; break; }
      document.getElementById('mp-join-error').textContent = 'Comprobando conexión...';
      mpCheckOnline().then(msg => {
        document.getElementById('mp-join-error').textContent = msg;
        if (!msg) mpCreateRoom();
      });
      break;
    case 'mp-join': {
      if (!document.getElementById('mp-name-input').value.trim()) { document.getElementById('mp-join-error').textContent = 'Escribí tu nombre antes de unirte.'; break; }
      const code = document.getElementById('mp-code-input').value.trim();
      if (!code) { document.getElementById('mp-join-error').textContent = 'Ingresá un código de sala.'; break; }
      document.getElementById('mp-join-error').textContent = 'Comprobando conexión...';
      mpCheckOnline().then(msg => {
        document.getElementById('mp-join-error').textContent = msg;
        if (!msg) mpJoinRoom(code);
      });
      break;
    }
    case 'mp-leave': mpLeaveRoom(); break;
    case 'revive-player': reviveLocalPlayer(GAME.level); break;
    case 'spectate-prev': mpSpectateCycle(GAME.level, -1); break;
    case 'spectate-next': mpSpectateCycle(GAME.level, 1); break;
    case 'mp-start':
      // solo el Admin, y solo con 2 jugadores o más en la sala
      if (MP.isHost && MP.players.length >= 2) mpBeginSelectionForAll();
      break;
    case 'goto-phase-select': buildPhaseGrid(); showScreen('screen-phase-select'); break;
    case 'phase-select-continue':
      GAME.phaseSkip = true; GAME.skipEntry = true; // desde aquí la partida es con salto de fase: no desbloquea etapas
      GAME.stageIndex = GAME.phaseSkipTarget;
      GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
      if (STAGES[GAME.stageIndex].special) {
        // Recolección de bajas: se puede jugar en solitario o en multijugador
        const modeErr = document.getElementById('mode-select-error'); if (modeErr) modeErr.textContent = '';
        updateKillsDiffUI(); // aquí se elige la dificultad, para solitario y multijugador
        showScreen('screen-mode-select');
        break;
      }
      GAME.charBack = 'screen-phase-select';
      buildCharacterGrid();
      showScreen('screen-character');
      break;
    case 'back-character':
      // ATRÁS: vuelve directo al menú de inicio; en multijugador además sale de la sala
      if (mpIsActive()) mpExitToMenu(); else { GAME.phaseSkip = false; showScreen('screen-menu'); }
      break;
    case 'back-vehicle':
      GAME.phaseSkip = !!GAME.skipEntry; // se deshace lo que hizo CONTINUAR, para poder volver a avanzar
      showScreen('screen-character');
      break;
    case 'back-weapons':
      if (GAME.weaponsBack === 'screen-character') GAME.phaseSkip = !!GAME.skipEntry;
      if (GAME.weaponsBack) showScreen(GAME.weaponsBack);
      break;
    case 'back-menu': GAME.phaseSkip = false; showScreen('screen-menu'); break;
    case 'goto-vehicle':
      if (!GAME.selection.character) break; // es obligatorio elegir personaje antes de pasar a la montura
      GAME.skipEntry = GAME.phaseSkip; GAME.vehBack = true;
      if (!GAME.phaseSkip) { GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 }; }
      GAME.phaseSkip = false;
      openVehicleSelectForCurrentStage();
      break;
    case 'vehicle-next': GAME.weaponsBack = 'screen-vehicle'; afterVehicleSelected(); break;
    case 'start-stage':
      if (mpIsActive()) mpMarkReady(); else beginStageIntro();
      break;
    case 'stage-intro-continue': startStageGameplay(); break;
    case 'resume-game': togglePause(false); break;
    case 'restart-stage':
      togglePause(false);
      // Modo amistad: un jugador eliminado no puede revivir reiniciando la etapa desde la pausa
      if (mpFriendMode() && GAME.level && GAME.level.dead) break;
      startStageGameplay();
      break;
    case 'quit-menu': fullReset(); if (mpIsActive()) mpExitToMenu(); else showScreen('screen-menu'); break;
    case 'retry-run': fullReset(); if (mpIsActive()) mpExitToMenu(); else showScreen('screen-menu'); break;
    case 'mp-notice-close': {
      const ov2 = document.getElementById('mp-notice-overlay');
      if (ov2) ov2.classList.remove('show');
      showScreen('screen-menu');
      break;
    }
    case 'host-left-home': {
      const ov = document.getElementById('host-left-overlay');
      if (ov) ov.classList.remove('show');
      mpResetState(); fullReset(); showScreen('screen-menu');
      break;
    }
    case 'controller-reveal-continue': showPotionChoiceScreen(); break;
    case 'potion-yes': mpChooseEnding(true); break;
    case 'potion-no': mpChooseEnding(false); break;
    case 'final-victory-continue': showGoodEnd(); break; // solo local: cada jugador pasa al final bueno a su ritmo
    case 'kills-again':
      GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
      if (mpIsActive()) {
        if (!MP.isHost) break; // solo el Admin vuelve a empezar para todos
        GAME.phaseSkip = true;
        GAME.stageIndex = STAGES.findIndex(st => st.objectiveType === 'killStreak');
        mpBeginSelectionForAll();
      } else startStageGameplay();
      break;
    case 'chaos-again':
      // Modo caos: solo el Admin reinicia, y siempre desde la etapa 1 para todos
      if (!mpIsActive() || !MP.isHost) break;
      GAME.phaseSkip = false; GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
      GAME.paused = false; MP._doneIds = [];
      mpFreshSelection();
      mpBeginSelectionForAll();
      break;
    case 'kills-exit': {
      const wasMp = mpIsActive();
      fullReset();
      if (wasMp) mpExitToMenu(); else showScreen('screen-menu');
      break;
    }
    case 'force-fullscreen': requestGameFullscreen(true); break;
  }
}

function fullReset() {
  cancelAnimationFrame(GAME.rafId);
  GAME.selection = { character: null, vehicle: null, weapons: [], companion: null };
  GAME.stageIndex = 0;
  GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
  GAME.level = null;
  GAME.paused = false;
  GAME.phaseSkip = false;
  stopBossMusic();
}

/* ---------------------------- SALTO DE FASE --------------------------------- */

// Etapas superadas SOLO durante esta sesión: al cerrar la pestaña o la app instalada se vuelven a
// bloquear (sessionStorage se borra al cerrar). Si el navegador no permite sessionStorage, se usa memoria.
const UNLOCK_KEY = 'ez_stages_cleared_v2'; // clave nueva: ignora lo que guardaron versiones anteriores con reglas distintas
let _clearedMem = [];
try { localStorage.removeItem('ez_stages_cleared'); sessionStorage.removeItem('ez_stages_cleared'); } catch (e) { /* borra datos de versiones anteriores */ }
function clearedStages() {
  try { const a = JSON.parse(sessionStorage.getItem(UNLOCK_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return _clearedMem; }
}
function markStageCleared(stage) {
  if (!stage || stage.special || stage.hidden) return;
  // Solo cuenta en partida normal (JUGAR, empezando desde la etapa 1) y en solitario:
  // lo jugado tras un salto de fase o en multijugador no desbloquea nada.
  if (mpIsActive() || GAME.skipEntry) return;
  const a = clearedStages().slice();
  if (a.includes(stage.id)) return;
  a.push(stage.id);
  _clearedMem = a;
  try { sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(a)); } catch (e) { /* queda en memoria */ }
}
function isStageUnlocked(stage) {
  return !!stage.special || clearedStages().includes(stage.id);
}

function buildPhaseGrid() {
  const grid = document.getElementById('phase-grid');
  grid.innerHTML = '';
  document.getElementById('btn-phase-next').disabled = true;
  STAGES.forEach((stage, i) => {
    if (stage.hidden) return; // la batalla definitiva solo se alcanza con el "NO" del Admin
    const unlocked = isStageUnlocked(stage);
    const card = document.createElement('div');
    card.className = 'pick-card' + (unlocked ? '' : ' locked');
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${stage.special ? 'MODO ESPECIAL' : 'ETAPA ' + stage.id} — ${stage.name}</div>
      <div class="pick-card-desc">${stage.objectiveText}</div>
      <div class="pick-check">✔ SELECCIONADA</div>
      ${unlocked ? '' : '<div class="pick-lock"><span class="pick-lock-icon">🔒</span><span class="pick-lock-text">Supera esta etapa jugando para desbloquearla</span></div>'}`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => {
      if (stage.special) {
        drawZombie(c, 55, 62, 0.4, 'walker', 0); drawZombie(c, 125, 62, 2.7, 'gunner', 0); drawZombie(c, 90, 46, 1.6, 'walker', 0);
      } else if (stage.onFoot) {
        drawBoss(c, 90, 55, 1, 0, 0.95, false);
      } else {
        const v = VEHICLE_SETS[stage.vehicleSet][0];
        drawVehicle(c, 90, 55, 0, v, 1.1);
      }
    });
    card.addEventListener('click', () => {
      if (!unlocked) return; // etapa bloqueada: no se puede elegir
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.phaseSkipTarget = i;
      document.getElementById('btn-phase-next').disabled = false;
    });
    grid.appendChild(card);
  });
}

/* ---------------------------- SELECCIÓN: PERSONAJE ------------------------ */

function buildCharacterGrid() {
  const grid = document.getElementById('character-grid');
  grid.innerHTML = '';
  // Cada vez que se abre esta pantalla hay que elegir personaje de nuevo: sin elección no se puede continuar.
  GAME.selection.character = null;
  const nextBtn = document.getElementById('btn-char-next');
  if (nextBtn) nextBtn.disabled = true;
  CHARACTERS.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<img class="pick-card-img" src="${ch.img}" alt="${ch.name}" draggable="false">
      <div class="pick-card-name">${ch.name}</div>
      <div class="pick-card-desc">${ch.desc}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.selection.character = ch;
      document.getElementById('btn-char-next').disabled = false;
    });
    grid.appendChild(card);
  });
}

/* ---------------------------- SELECCIÓN: VEHÍCULO -------------------------- */

function openVehicleSelectForCurrentStage() {
  const stage = STAGES[GAME.stageIndex];
  if (stage.onFoot) {
    if (stage.companionSelect) { buildCompanionGrid(); showScreen('screen-vehicle'); return; }
    GAME.selection.companion = null; // etapas a pie sin compañero (Recolección de bajas)
    GAME.weaponsBack = GAME.vehBack ? 'screen-character' : null; // no hubo pantalla de montura: se vuelve al personaje
    afterVehicleSelected();
    return;
  }
  buildVehicleGrid(stage);
  showScreen('screen-vehicle');
}

function buildVehicleGrid(stage) {
  document.getElementById('vehicle-title').textContent = `ELIGE TU ${stage.vehicleLabel}`;
  document.getElementById('vehicle-sub').textContent = `Etapa ${stage.id} — ${stage.name}`;
  const grid = document.getElementById('vehicle-grid');
  grid.innerHTML = '';
  GAME.selection.vehicle = null;
  document.getElementById('btn-vehicle-next').disabled = true;
  GAME.selection.vehicleColor = mpIsActive() ? (MP.takenColors[mpMyId()] || null) : null;
  const colorPicker = document.getElementById('vehicle-color-picker');
  const checkNextEnabled = () => {
    const ok = !!GAME.selection.vehicle && (!mpIsActive() || !!GAME.selection.vehicleColor);
    document.getElementById('btn-vehicle-next').disabled = !ok;
  };
  if (mpIsActive()) {
    colorPicker.style.display = '';
    const row = document.getElementById('color-swatch-row');
    row.innerHTML = '';
    MP_COLORS.forEach(color => {
      const sw = document.createElement('div');
      sw.className = 'color-swatch';
      sw.dataset.color = color;
      sw.style.background = color;
      sw.addEventListener('click', () => {
        if (sw.classList.contains('taken')) return; // ya lo eligió otro jugador
        const myId = mpMyId();
        if (MP.isHost) { mpClaimColor(myId, color); } else { MP.hostConn.send({ type: 'color-pick', color }); }
      });
      row.appendChild(sw);
    });
    mpApplyTakenColorsToUI();
  } else {
    colorPicker.style.display = 'none';
  }
  DINO_REPAINT.clear();
  VEHICLE_SETS[stage.vehicleSet].forEach(v => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${v.name}</div>
      <div class="pick-card-desc">${v.desc}<br>Vida ${v.hp} · Vel ${v.speed}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    const paintCard = () => drawPreview(cv, c => drawVehicle(c, 90, 55, 0, v, 1.15));
    paintCard(); DINO_REPAINT.add(paintCard);
    card.addEventListener('click', () => {
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.selection.vehicle = v;
      checkNextEnabled();
    });
    grid.appendChild(card);
  });
}

function buildCompanionGrid() {
  document.getElementById('vehicle-title').textContent = 'ELIGE TU AYUDANTE';
  const cst = STAGES[GAME.stageIndex];
  document.getElementById('vehicle-sub').textContent = cst && cst.special ? `Modo especial — ${cst.name}` : 'Etapa 5 — Batalla final';
  const grid = document.getElementById('vehicle-grid');
  grid.innerHTML = '';
  GAME.selection.companion = null;
  document.getElementById('btn-vehicle-next').disabled = true;
  COMPANIONS.forEach(c0 => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${c0.name}</div>
      <div class="pick-card-desc">${c0.desc}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawCompanion(c, 90, 60, c0, 1.7));
    card.addEventListener('click', () => {
      grid.querySelectorAll('.pick-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      GAME.selection.companion = c0;
      document.getElementById('btn-vehicle-next').disabled = false;
    });
    grid.appendChild(card);
  });
}

function afterVehicleSelected() {
  buildWeaponGrid();
  showScreen('screen-weapons');
}

/* ---------------------------- SELECCIÓN: ARMAS ----------------------------- */

function buildWeaponGrid() {
  const previous = GAME.selection.weapons || [];
  GAME.selection.weapons = [];
  document.getElementById('weapon-count').textContent = String(previous.length);
  const grid = document.getElementById('weapon-grid');
  grid.innerHTML = '';
  document.getElementById('btn-weapons-next').disabled = previous.length !== 3;
  WEAPONS.forEach(w => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    const wasSelected = previous.some(x => x.id === w.id);
    if (wasSelected) { card.classList.add('selected'); GAME.selection.weapons.push(w); }
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${w.name}</div>
      <div class="pick-card-desc">Daño ${w.dmg} · Cadencia ${Math.round(1000/w.fireRate*10)/10}/s</div>
      <div class="pick-check">✔ SELECCIONADA</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawWeaponIcon(c, 90, 55, w));
    card.addEventListener('click', () => {
      const idx = GAME.selection.weapons.findIndex(x => x.id === w.id);
      if (idx >= 0) {
        GAME.selection.weapons.splice(idx, 1);
        card.classList.remove('selected');
      } else {
        if (GAME.selection.weapons.length >= 3) return;
        GAME.selection.weapons.push(w);
        card.classList.add('selected');
      }
      document.getElementById('weapon-count').textContent = GAME.selection.weapons.length;
      document.getElementById('btn-weapons-next').disabled = GAME.selection.weapons.length !== 3;
    });
    grid.appendChild(card);
  });
}

/* ---------------------------- INTRO DE ETAPA -------------------------------- */

// En multijugador, las etapas 1 y 2 cambian de objetivo (15 supervivientes
// compartidos; familia según cantidad de jugadores), así que el texto de
// introducción se arma dinámicamente en vez de usar siempre el texto fijo.
function stageObjectiveText(stage) {
  if (stage.objectiveType === 'rescue' && mpIsActive()) {
    return 'Entre todo el equipo deben rescatar a 15 supervivientes (presiona E cerca de cada uno; el conteo es compartido) y luego dirigirse a la zona segura.';
  }
  if (stage.objectiveType === 'findNPC' && mpIsActive()) {
    const count = clamp(MP.players.length, 1, STAGE2_FAMILY.length);
    const names = STAGE2_FAMILY.slice(0, count).map(f => f.name.charAt(0) + f.name.slice(1).toLowerCase());
    return count > 1
      ? `Encuentren a la familia perdida (${names.join(', ')}) — cada jugador rescata a uno solo y lo escolta a la zona segura.`
      : stage.objectiveText;
  }
  if (stage.objectiveType === 'survive' && mpIsActive()) {
    return 'Entre todo el equipo deben eliminar 100 zombies (el conteo es compartido) para llenar la barra al 100% y luego dirigirse a la zona segura. La criatura no puede repararse.';
  }
  return stage.objectiveText;
}

function beginStageIntro() {
  const stage = STAGES[GAME.stageIndex];
  document.getElementById('stage-intro-num').textContent = stage.special ? 'MODO ESPECIAL' : `ETAPA ${stage.id}`;
  document.getElementById('stage-intro-title').textContent = stage.name;
  document.getElementById('stage-intro-obj').textContent = stageObjectiveText(stage);
  showScreen('screen-stage-intro');
}

/* =========================================================================
   RENDERIZADO DE SPRITES (procedural, sin imágenes)
   ========================================================================= */

function drawPreview(canvas, fn) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createRadialGradient(90, 55, 4, 90, 55, 90);
  g.addColorStop(0, 'rgba(157,251,76,0.10)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  fn(ctx);
}

// Imágenes de los personajes (Aspectos/): se cargan una sola vez. Si aún no cargaron, se usa el dibujo simple.
const CHAR_IMGS = {};
function charImage(id) {
  if (!id) return null;
  let img = CHAR_IMGS[id];
  if (!img) {
    const def = CHARACTERS.find(c => c.id === id);
    if (!def || !def.img) return null;
    img = CHAR_IMGS[id] = new Image();
    img.src = def.img;
  }
  return (img.complete && img.naturalWidth > 0) ? img : null;
}
CHARACTERS.forEach(c => charImage(c.id)); // precarga
// Escala de la montura que se está dibujando (antes de espejarla), para poder dibujar al jinete derecho.
let CUR_Z = null;
// Deja el lienzo sin giro ni espejo, conservando posición y escala: lo que se dibuje queda derecho en pantalla.
function uprightFrame(ctx) {
  const m = ctx.getTransform();
  const z = CUR_Z || Math.hypot(m.a, m.b);
  ctx.setTransform(z, 0, 0, z, m.e, m.f);
}
// Dibuja el personaje siempre derecho (sin girar con la montura): bottomY = donde apoyan los pies, h = alto.
function drawChibiUpright(ctx, charId, h, bottomY, tilt, sx, crop) {
  const img = charImage(charId);
  if (!img) return false;
  ctx.save();
  uprightFrame(ctx);
  const w = h * img.naturalWidth / img.naturalHeight;
  if (crop) { ctx.beginPath(); ctx.rect(-w, bottomY - h - 4, w * 2, h * (1 - crop) + 4); ctx.clip(); } // sentado: las piernas quedan ocultas tras la montura
  ctx.translate(0, bottomY - h * (crop || 0));
  if (tilt) ctx.rotate(tilt); // se inclina desde la cintura
  if (sx !== undefined) ctx.scale(sx, 1); // gira (de frente a un lado y al otro) igual que la montura
  ctx.drawImage(img, -w / 2, -h * (1 - (crop || 0)), w, h);
  ctx.restore();
  return true;
}

function drawHuman(ctx, x, y, angle, bodyColor, accent, scale, charId) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (charImage(charId)) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 15, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    drawChibiUpright(ctx, charId, 50, 19);
    // arma apuntando hacia donde se dispara
    ctx.rotate(angle);
    ctx.strokeStyle = '#20241c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(22, 2); ctx.stroke();
    ctx.restore();
    return;
  }
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 14, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  // piernas
  ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-5, 14); ctx.moveTo(3, 4); ctx.lineTo(5, 14); ctx.stroke();
  // cuerpo
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  // cabeza
  ctx.fillStyle = '#e9c9a0';
  ctx.beginPath(); ctx.arc(0, -14, 6, 0, Math.PI * 2); ctx.fill();
  // arma (línea en dirección angle)
  ctx.rotate(angle);
  ctx.strokeStyle = '#20241c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(18, 0); ctx.stroke();
  ctx.restore();
}

function drawZombie(ctx, x, y, angle, type, hitFlash) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 13, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  const base = hitFlash > 0 ? '#e9e6d6' : (type === 'gunner' ? '#4a6b3a' : type === 'rider' ? '#5c6b3a' : '#527a3a');
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hitFlash > 0 ? '#fff' : '#3d5c2a';
  ctx.beginPath(); ctx.arc(0, -13, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d1272d';
  ctx.beginPath(); ctx.arc(-2, -14, 1.4, 0, Math.PI * 2); ctx.arc(2, -14, 1.4, 0, Math.PI * 2); ctx.fill();
  // brazos extendidos
  ctx.strokeStyle = base; ctx.lineWidth = 4; ctx.lineCap = 'round';
  const flail = Math.sin(Date.now() / 120 + x) * 4;
  ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(-14, 4 + flail); ctx.moveTo(7, -2); ctx.lineTo(14, 4 - flail); ctx.stroke();
  if (type === 'gunner') { ctx.strokeStyle = '#20241c'; ctx.lineWidth = 2; ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(15, 0); ctx.stroke(); }
  ctx.restore();
}

function drawRiderZombie(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 12, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5c4630';
  ctx.beginPath(); ctx.ellipse(0, 4, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(15, 0, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawZombie(ctx, x, y - 8, angle, 'rider', 0);
}

// Dibuja al personaje (el que elegiste: hombre o mujer) montado/asomado en el
// vehículo. Se llama ya posicionado y rotado en el punto donde debe ir sentado;
// su propia rotación local ya viene alineada con la dirección de puntería.
// Sombra bajo el torso para que se vea sentado sobre la montura (derecha en pantalla, sin girar).
function drawSeatShade(ctx, y, rx, ry) {
  ctx.save();
  uprightFrame(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(0, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawRiderFigure(ctx, bodyColor, accent, charId, tilt, sx, aim) {
  ctx.save();
  if (charImage(charId)) {
    drawChibiUpright(ctx, charId, 38, 9, tilt, sx, 0.3);
    drawSeatShade(ctx, -2, 9.5, 3.2);
    // arma en las manos, a la altura del pecho, apuntando hacia donde se dispara
    const m = ctx.getTransform(), z = CUR_Z || Math.hypot(m.a, m.b);
    ctx.setTransform(z, 0, 0, z, m.e, m.f - 13 * z); ctx.rotate(aim || 0);
    ctx.strokeStyle = '#20241c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(17, 0); ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
  // cuerpo/torso asomado
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.ellipse(0, 0, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  // cabeza
  ctx.fillStyle = '#e9c9a0';
  ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); ctx.fill();
  // detalle de acento (casco/pañuelo), distingue al personaje elegido
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(0, -13, 2.4, 0, Math.PI * 2); ctx.fill();
  // arma en la mano, apuntando hacia donde se dispara
  ctx.strokeStyle = '#20241c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(17, -1); ctx.stroke();
  ctx.restore();
}

// Dirección visual de la montura. En vez de girar 180° pasando por "hacia abajo" al cambiar de izquierda a derecha,
// la montura se VOLTEA como un espejo: th = ángulo ya reflejado (siempre cerca de la horizontal) y F = lado (+1 derecha, -1 izquierda).
function stepVisualHeading(A, face, t, tF) {
  const c = Math.cos(face);
  if (Math.abs(c) > 0.2 || A.dir === undefined) A.dir = c >= 0 ? 1 : -1;
  const norm = a => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const thT = norm(A.dir > 0 ? face : Math.PI - face);
  if (A.th === undefined) { A.th = thT; A.F = A.dir; A.turn = 0; }
  const d = norm(thT - A.th);
  A.th = norm(A.th + d * t);
  A.F += (A.dir - A.F) * tF;
  A.turn = (A.turn || 0) + (d - (A.turn || 0)) * 0.3;
}

/* ---- Velocirraptor con imágenes (Aspectos/raptor-*.png): una vista por dirección ---- */
const RAPTOR_K = 0.25; // píxeles del juego por píxel de imagen
// cx,cy = punto de la imagen que queda en el centro de la montura; sx,sy = donde va sentado el jinete (la silla)
const RAPTOR_VIEWS = {
  izquierda: { src: 'Aspectos/raptor-izquierda.png', w: 354, h: 189, cx: 177, cy: 100, sx: 147, sy: 50 },
  derecha:   { src: 'Aspectos/raptor-derecha.png',   w: 344, h: 188, cx: 172, cy: 100, sx: 203, sy: 50 },
  arriba:    { src: 'Aspectos/raptor-arriba.png',    w: 90,  h: 234, cx: 45,  cy: 117, sx: 45,  sy: 66 },
  abajo:     { src: 'Aspectos/raptor-abajo.png',     w: 151, h: 325, cx: 76,  cy: 163, sx: 76,  sy: 200 },
};

// Imágenes del T-Rex incrustadas en el código (WebP con transparencia): así no dependen de la carpeta Aspectos/ ni de nombres de archivo.
const TREX_IMG = {
  izquierda: 'data:image/webp;base64,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',
  derecha: 'data:image/webp;base64,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',
  arriba: 'data:image/webp;base64,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',
  abajo: 'data:image/webp;base64,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',
};
/* ---- T-Rex con imágenes (Aspectos/trex-*.png): mismas 4 vistas que el velocirraptor ---- */
// (las imágenes ya están reducidas: 416 px de ancho en vista lateral -> unos 104 px en el juego)
const TREX_VIEWS = {
  izquierda: { src: TREX_IMG.izquierda, w: 416, h: 235, cx: 208, cy: 125, sx: 214, sy: 46 },
  derecha:   { src: TREX_IMG.derecha,   w: 418, h: 235, cx: 209, cy: 125, sx: 202, sy: 46 },
  arriba:    { src: TREX_IMG.arriba,    w: 179, h: 300, cx: 89,  cy: 150, sx: 91,  sy: 128 },
  abajo:     { src: TREX_IMG.abajo,     w: 177, h: 432, cx: 88,  cy: 205, sx: 88,  sy: 216 }, // mira hacia abajo, vista desde arriba
};
// Aspectos de montura con imágenes: k = escala, shV/shS = tamaño de la sombra (vista vertical / lateral)
const DINO_SKINS = {
  raptor: { k: RAPTOR_K, views: RAPTOR_VIEWS, shV: [13, 26], shS: 36 },
  trex:   { k: 0.25,     views: TREX_VIEWS,   shV: [20, 40], shS: 50 },
};
const DINO_IMGS = {};
const DINO_REPAINT = new Set(); // vistas previas (selección de vehículo) que se repintan cuando una imagen termina de cargar
function dinoImg(skin, name) {
  const view = skin.views[name], src = view.src;
  let i = DINO_IMGS[src];
  if (!i) {
    i = DINO_IMGS[src] = new Image();
    // si no existe el archivo con el nombre principal, se prueba con el alternativo
    i.onerror = () => { if (view.alt && !i._triedAlt) { i._triedAlt = true; i.src = view.alt; } };
    i.onload = () => DINO_REPAINT.forEach(f => { try { f(); } catch (e) {} });
    i.src = src;
  }
  return (i.complete && i.naturalWidth > 0) ? i : null;
}
Object.keys(DINO_SKINS).forEach(id => Object.keys(DINO_SKINS[id].views).forEach(n => dinoImg(DINO_SKINS[id], n))); // precarga

// Dibuja una montura con imágenes (raptor o T-Rex) y a su jinete sentado en la silla. Devuelve false si las imágenes aún no cargaron.
function drawDinoMount(ctx, A, aDefault, rider, skin) {
  const Fv = A.F === undefined ? 1 : A.F, Fs = Fv < 0 ? -1 : 1;
  const aT = A.th !== undefined ? (A.dir > 0 ? A.th : Math.PI - A.th) : aDefault; // hacia dónde mira
  const sA = Math.sin(aT);
  const vert = (A.rv === 'v') ? Math.abs(sA) > 0.62 : Math.abs(sA) > 0.78; // vista de arriba/abajo solo si va casi vertical
  A.rv = vert ? 'v' : 's';
  const name = vert ? (sA < 0 ? 'arriba' : 'abajo') : (Fs > 0 ? 'derecha' : 'izquierda');
  const img = dinoImg(skin, name);
  if (!img) return false;
  const d = skin.views[name], K = skin.k;
  const sp = A.sp || 0, sw = Math.sin(A.ph || 0);
  const bob = Math.sin(Date.now() / 420) * 0.7 * (1 - sp) - Math.abs(sw) * sp * 1.2;
  const sqz = vert ? 1 : (Math.abs(Fv) < 1 ? Math.max(Math.abs(Fv), 0.25) : 1); // al cambiar de lado se voltea de golpe, sin girar por abajo
  ctx.save();
  ctx.translate(0, bob);
  if (!vert) ctx.rotate(sw * 0.03 * sp); // leve balanceo al correr
  // sombra en el suelo
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  if (vert) ctx.ellipse(2, 4, skin.shV[0], skin.shV[1], 0, 0, Math.PI * 2); else ctx.ellipse(0, (d.h - d.cy) * K - 2, skin.shS * sqz, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save(); ctx.scale(sqz, 1); ctx.drawImage(img, -d.cx * K, -d.cy * K, d.w * K, d.h * K); ctx.restore();
  if (rider) {
    ctx.save();
    ctx.translate((d.sx - d.cx) * K * sqz, (d.sy - d.cy) * K + 2);
    if (!charImage(rider.id)) ctx.rotate(rider.aimAngle); // sin imagen del personaje: el dibujo simple apunta con la rotación
    drawRiderFigure(ctx, rider.color, rider.accent, rider.id, clamp((A.turn || 0) * 0.2, -0.14, 0.14), Math.abs(Fv) < 0.6 ? Fs * 0.6 : Fv, rider.aimAngle);
    ctx.restore();
  }
  ctx.restore();
  return true;
}

function drawVehicle(ctx, x, y, angle, v, scale, mpColor, rider, anim) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (mpColor) {
    // Anillo de color para diferenciar de quién es cada montura en multijugador.
    ctx.strokeStyle = mpColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = mpColor;
    ctx.shadowBlur = LOW_FX ? 0 : 10;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // El casco/cuerpo del vehículo rota según la dirección de movimiento (WASD).
  const A = anim || { ph: 0, sp: 0 };
  const mirrored = A.th !== undefined;
  const thv = mirrored ? A.th : angle;              // giro del casco (ya reflejado si hay espejo)
  const Fv = mirrored ? A.F : 1;                    // -1 = mirando a la izquierda (volteado como espejo)
  const Fs = Fv < 0 ? -1 : 1;
  const aTrue = Fs > 0 ? thv : Math.PI - thv;       // hacia dónde mira realmente la montura
  const m0 = ctx.getTransform(); CUR_Z = Math.hypot(m0.a, m0.b);
  if (DINO_SKINS[v.id] && drawDinoMount(ctx, A, angle, rider, DINO_SKINS[v.id])) { CUR_Z = null; ctx.restore(); return; }
  ctx.save();
  ctx.scale(Math.abs(Fv) < 0.25 ? Fs * 0.25 : Fv, 1); // al voltearse se angosta un instante, nunca desaparece
  ctx.rotate(thv);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 16, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  const [c1, c2] = v.pal;
  // Animación de marcha: A.ph = fase del paso (avanza con la distancia recorrida), A.sp = 0 parado .. 1 en marcha.
  const sp = A.sp || 0, sw = Math.sin(A.ph);
  const idle = Math.sin(Date.now() / 420) * 0.7 * (1 - sp); // respiración al estar quieto
  const bobAmt = idle - Math.abs(sw) * sp * (v.kind === 'tank' ? 0.4 : v.kind === 'ball' ? 0.7 : 1.2); // rebote vertical (en pantalla)
  const swing = sw * 5 * sp; // balanceo de patas
  const lean = clamp((A.turn || 0) * 0.2, -0.14, 0.14); // el jinete se inclina suavemente al girar
  // Hacia qué lado mira el jinete: solo izquierda o derecha. Al ir hacia arriba/abajo conserva el último lado
  // (nunca desaparece), y al cambiar de lado se voltea con una animación corta, sin hacerse más angosto que un mínimo.
  const faceOf = (key, ang) => {
    const c = Math.cos(ang);
    if (Math.abs(c) > 0.25 || A[key + 'D'] === undefined) A[key + 'D'] = c >= 0 ? 1 : -1;
    const f = A[key + 'F'] === undefined ? A[key + 'D'] : A[key + 'F'];
    A[key + 'F'] = f + (A[key + 'D'] - f) * 0.3;
    const fv = A[key + 'F'];
    return Math.abs(fv) < 0.6 ? (fv >= 0 ? 0.6 : -0.6) : fv;
  };
  ctx.translate(Math.sin(thv) * bobAmt, Math.cos(thv) * bobAmt); // el rebote siempre es vertical en pantalla
  let riderSpot = null; // posición local (dentro del casco) donde va sentado el personaje
  switch (v.kind) {
    case 'dino':
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.moveTo(-30, 6); ctx.quadraticCurveTo(-10, -16, 20, -6); ctx.quadraticCurveTo(30, -2, 26, 8);
      ctx.quadraticCurveTo(0, 14, -30, 6); ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.ellipse(24, -8, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d1272d';
      ctx.beginPath(); ctx.arc(28, -10, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c1; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, 4); ctx.lineTo(-24 + swing, 16); ctx.moveTo(-8, 6); ctx.lineTo(-8 - swing, 18); ctx.stroke();
      riderSpot = { dx: -2, dy: -9 };
      break;
    case 'tank':
      // Solo el casco y las orugas: la torreta (con el artillero) se dibuja
      // aparte más abajo, con su propia rotación hacia la puntería.
      ctx.fillStyle = c2; ctx.fillRect(-26, -14, 52, 28);
      ctx.fillStyle = c1; ctx.fillRect(-22, -10, 44, 20);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      const tr = (A.ph * 4) % 8; // las orugas avanzan al moverse
      ctx.save(); ctx.beginPath(); ctx.rect(-26, -22, 52, 44); ctx.clip();
      for (let i = -28; i <= 28; i += 8) { ctx.beginPath(); ctx.arc(i + tr, -16, 4, 0, Math.PI * 2); ctx.arc(i + tr, 16, 4, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      if (!rider) {
        // Vista previa (menú de selección): sin jugador aún, torreta fija al frente.
        ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#20241c'; ctx.fillRect(0, -3, 26, 6);
      }
      break;
    case 'shoe':
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.moveTo(-28, 10); ctx.quadraticCurveTo(-28, -14, 0, -14); ctx.quadraticCurveTo(30, -14, 28, 4);
      ctx.quadraticCurveTo(20, 12, -28, 10); ctx.fill();
      ctx.fillStyle = c2; ctx.fillRect(-24, 6, 48, 6);
      ctx.strokeStyle = c2; ctx.lineWidth = 4; ctx.lineCap = 'round';
      let k = 0; for (let i = -18; i <= 14; i += 12, k++) { const sg = (k % 2 ? -swing : swing); ctx.beginPath(); ctx.moveTo(i, 10); ctx.lineTo(i - 3 + sg, 20); ctx.stroke(); }
      riderSpot = { dx: 0, dy: -15 };
      break;
    case 'ball':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = 2;
      const roll = A.ph * 0.9; // la pelota rueda al avanzar
      for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a + roll) * 18, Math.sin(a + roll) * 18); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
      riderSpot = { dx: 0, dy: -17 };
      break;
    case 'case':
      ctx.fillStyle = c1; ctx.fillRect(-26, -12, 52, 24);
      ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.strokeRect(-26, -12, 52, 24);
      ctx.fillStyle = c2; ctx.fillRect(-4, -12, 8, 24);
      ctx.strokeStyle = '#e0b13f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      let kc = 0; for (let i = -20; i <= 20; i += 10, kc++) { const sg = (kc % 2 ? -swing : swing) * 0.8; ctx.beginPath(); ctx.moveTo(i, 12); ctx.lineTo(i + sg, 22); ctx.stroke(); }
      riderSpot = { dx: 0, dy: -16 };
      break;
    case 'horse':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(22, -6, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-14 + swing, 20); ctx.moveTo(-8, 8); ctx.lineTo(-8 - swing, 20); ctx.moveTo(6, 8); ctx.lineTo(6 - swing, 20); ctx.moveTo(10, 8); ctx.lineTo(10 + swing, 20); ctx.stroke();
      riderSpot = { dx: -4, dy: -9 };
      break;
    case 'cat2':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 2, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(16, -8, 8, 0, Math.PI * 2); ctx.arc(-2, -12, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(16, -22); ctx.lineTo(20, -14); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(-2, -26); ctx.lineTo(2, -18); ctx.fill();
      riderSpot = { dx: 3, dy: -4 };
      break;
  }
  if (rider) {
    if (v.kind === 'tank') {
      // Torreta con cañón: rota de forma independiente al casco, siempre
      // apuntando hacia donde apunta el mouse/joystick de puntería. Así, si
      // quieres disparar a un costado, el cañón (la "cosa larga") se ve
      // apuntando exactamente hacia ese lado, no hacia donde te mueves.
      ctx.save();
      ctx.rotate(Fs * (rider.aimAngle - aTrue));
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20241c'; ctx.fillRect(0, -3, 27, 6);
      // el artillero (tu personaje) asomado por la escotilla de la torreta
      if (!charImage(rider.id)) {
        ctx.fillStyle = rider.color; ctx.beginPath(); ctx.arc(-3, 0, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rider.accent; ctx.beginPath(); ctx.arc(-3, -3, 1.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (charImage(rider.id)) { ctx.save(); drawChibiUpright(ctx, rider.id, 33, 8, lean, faceOf('t', rider.aimAngle), 0.3); drawSeatShade(ctx, -1.5, 8.5, 3); ctx.restore(); }
    } else if (riderSpot) {
      ctx.save();
      ctx.translate(riderSpot.dx, riderSpot.dy);
      // El personaje mantiene su lugar sobre la montura, pero su cuerpo/arma
      // se orienta hacia la puntería real (mouse), no hacia el movimiento.
      ctx.rotate(Fs * (rider.aimAngle - aTrue));
      drawRiderFigure(ctx, rider.color, rider.accent, rider.id, lean, Math.abs(Fv) < 0.6 ? Fs * 0.6 : Fv, rider.aimAngle);
      ctx.restore();
    }
  }
  CUR_Z = null;
  ctx.restore(); // fin rotación del casco
  ctx.restore(); // fin save exterior
}

function drawCompanion(ctx, x, y, comp, scale) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 11, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = comp.color; ctx.shadowBlur = LOW_FX ? 0 : 10;
  ctx.fillStyle = comp.color;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0a0f0a';
  ctx.beginPath(); ctx.arc(-2.5, -1, 1.3, 0, Math.PI * 2); ctx.arc(2.5, -1, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawWeaponIcon(ctx, x, y, w) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = w.color; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.shadowColor = w.color; ctx.shadowBlur = LOW_FX ? 0 : 8;
  ctx.beginPath(); ctx.moveTo(-30, 6); ctx.lineTo(30, -6); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-10, 16); ctx.stroke();
  ctx.restore();
}

function drawHeli(ctx, x, y, t, hit, isBoss, shielded) {
  ctx.save(); ctx.translate(x, y);
  const scale = isBoss ? 2.4 : 1;
  ctx.scale(scale, scale);
  if (isBoss) {
    // aura roja pulsante para que se note que es el jefe
    const pulse = 1 + Math.sin(t * 4) * 0.08;
    ctx.strokeStyle = 'rgba(209,39,45,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2); ctx.stroke();
  }
  if (shielded) {
    // escudo azul mientras sigan vivos los aviones mini escolta
    const shieldPulse = 1 + Math.sin(Date.now() / 180) * 0.06;
    ctx.strokeStyle = 'rgba(120,190,255,0.65)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 44 * shieldPulse, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 60, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hit > 0 ? '#fff' : (isBoss ? '#4a2224' : '#3a4038');
  ctx.beginPath(); ctx.ellipse(0, 0, isBoss ? 22 : 16, isBoss ? 11 : 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-2, -2, isBoss ? 30 : 22, isBoss ? 5 : 4);
  ctx.strokeStyle = '#20241c'; ctx.lineWidth = isBoss ? 3 : 2;
  ctx.save(); ctx.rotate(t * 18);
  const bl = isBoss ? 32 : 24;
  ctx.beginPath(); ctx.moveTo(-bl, 0); ctx.lineTo(bl, 0); ctx.moveTo(0, -bl); ctx.lineTo(0, bl); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#d1272d'; ctx.beginPath(); ctx.arc(isBoss ? 19 : 14, 0, isBoss ? 3 : 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBoss(ctx, x, y, hpPct, hit, scale, invulnerable) {
  scale = scale || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  if (invulnerable) {
    const pulse = 1 + Math.sin(Date.now() / 180) * 0.06;
    ctx.strokeStyle = 'rgba(120,190,255,0.55)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 52 * pulse, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 46, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
  const c = hit > 0 ? '#fff' : '#4a4f46';
  ctx.fillStyle = c; ctx.fillRect(-34, -34, 68, 68);
  ctx.fillStyle = '#2c2f28'; ctx.fillRect(-34, -34, 68, 14);
  ctx.fillStyle = hpPct > 0.5 ? '#9dfb4c' : hpPct > 0.2 ? '#e0b13f' : '#d1272d';
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = LOW_FX ? 0 : 12;
  ctx.beginPath(); ctx.arc(-14, -10, 6, 0, Math.PI * 2); ctx.arc(14, -10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.strokeRect(-34, -34, 68, 68);
  ctx.fillStyle = '#20241c';
  for (let i = -24; i <= 24; i += 16) ctx.fillRect(i - 3, 20, 6, 20);
  ctx.restore();
}

function drawPickup(ctx, x, y, kind, color) {
  ctx.save(); ctx.translate(x, y);
  const bob = Math.sin(Date.now() / 260 + x) * 3;
  ctx.translate(0, bob);
  ctx.shadowColor = color; ctx.shadowBlur = LOW_FX ? 0 : 14;
  ctx.fillStyle = color;
  if (kind === 'coin') { ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); }
  else if (kind === 'potion') {
    ctx.beginPath(); ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-2, -10, 4, 6);
  } else {
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#0a0f0a'; ctx.fillRect(-1.5, -5, 3, 10); ctx.fillRect(-5, -1.5, 10, 3);
  }
  ctx.restore();
}

function drawSurvivor(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 12, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9d6bd';
  ctx.beginPath(); ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e9c9a0'; ctx.beginPath(); ctx.arc(0, -12, 5.5, 0, Math.PI * 2); ctx.fill();
  const wave = Math.sin(Date.now() / 200) * 8;
  ctx.strokeStyle = '#c9d6bd'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(12, -14 + wave); ctx.stroke();
  ctx.restore();
}

function drawScientist(ctx, x, y) {
  drawFamilyMember(ctx, x, y, 'scientist');
}

// Dibuja al familiar de la etapa 2: mismo cuerpo base (drawSurvivor) con un
// distintivo de color/forma según a quién representa.
function drawFamilyMember(ctx, x, y, kind) {
  drawSurvivor(ctx, x, y);
  ctx.save(); ctx.translate(x, y);
  const badgeColor = {
    scientist: '#d1272d', brother: '#4c9dfb', mother: '#fb4cae', father: '#c07a2e', cat: '#e0b13f',
  }[kind] || '#d1272d';
  if (kind === 'cat') {
    // silueta simple de un gato sentado junto al superviviente
    ctx.fillStyle = badgeColor;
    ctx.beginPath(); ctx.ellipse(11, 7, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7, 1); ctx.lineTo(9, -6); ctx.lineTo(11, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(13, 1); ctx.lineTo(16, -5); ctx.lineTo(16, 2); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = badgeColor; ctx.fillRect(-2, -4, 4, 4);
  }
  ctx.restore();
}

/* =========================================================================
   NIVEL / GAMEPLAY
   ========================================================================= */

const WORLD = { w: 2600, h: 1900 };

function makeWeaponState(w) { return { def: w, ammo: w.maxAmmo, cd: 0, regenAcc: 0 }; }

function startStageGameplay() {
  const stage = STAGES[GAME.stageIndex];
  const canvas = document.getElementById('game-canvas');

  const player = {
    x: WORLD.w / 2, y: WORLD.h / 2, angle: 0, hp: 100, maxHp: 100,
    speed: 190, r: 12, invuln: 0,
  };

  const vehicle = stage.onFoot ? null : {
    def: GAME.selection.vehicle, hp: GAME.selection.vehicle.hp, maxHp: GAME.selection.vehicle.hp,
    x: player.x, y: player.y, angle: 0, r: 30,
    mpColor: mpIsActive() ? GAME.selection.vehicleColor : null,
  };

  const weaponStates = GAME.selection.weapons.length
    ? GAME.selection.weapons.map(makeWeaponState)
    : [makeWeaponState(WEAPONS[1])];

  const safeZone = { x: WORLD.w - 160, y: WORLD.h - 160, r: 110 };

  const level = {
    stage,
    player, vehicle,
    weaponStates, activeWeapon: 0,
    bullets: [], remoteBullets: [], enemyBullets: [], zombies: [], survivors: [], pickups: [], particles: [],
    npcs: [], companion: null,
    safeZone,
    decor: generateDecor(stage),
    camera: { x: player.x, y: player.y },
    // Etapa 1: en multijugador se rescatan 15 personas en vez de 5, y el
    // conteo/las posiciones son compartidas entre todos (ver mpClaimSurvivor).
    rescueTarget: (mpIsActive() && stage.objectiveType === 'rescue') ? 15 : stage.rescueTarget,
    rescuedThisStage: 0,
    rescuedBase: GAME.run.rescued, // contador de rescatados con el que empieza la etapa (etapa 2 multijugador)
    killsThisStage: 0,
    distanceTravelled: 0,
    boss: null,
    bossDefeated: false,
    subPhase: 'play', // play | bossIntro | bossDefeatedCutscene | complete
    time: 0,
    shakeT: 0,
    interactTarget: null,
    dead: false, // true cuando ESTE jugador (local) fue eliminado, en multijugador
    potionEligible: null, potionHolder: null, // etapa 3: quién puede/ya agarró la poción
    diff: stage.difficulty ? { ...stage.difficulty } : null, // multiplicadores de dificultad (batalla definitiva y recolección de bajas)
  };

  if (stage.onFoot && stage.companionSelect) {
    level.companion = {
      def: GAME.selection.companion, x: player.x - 40, y: player.y, hp: 140, maxHp: 140,
      cd: 0, angle: 0,
    };
    // Tralalero Tralala invoca a 3 aliados azules que ayudan a limpiar zombies
    // (nunca disparan al jefe robot, solo a los zombies comunes).
    if (GAME.selection.companion && GAME.selection.companion.id === 'tralalero') {
      level.allies = [0, 1, 2].map(i => ({
        x: player.x - 50 + i * 30, y: player.y + 40, angle: 0, cd: rand(0, 0.4), orbit: i,
      }));
    }
  }

  if (stage.objectiveType === 'killStreak') {
    level.killDiff = killDiffKey();
    const K = KILL_DIFFS[level.killDiff];
    level.diff.zombies = Math.round(level.diff.zombies * K.count);
    level.diff.speed = K.speed; level.diff.dmg = K.dmg; level.diff.zombieHp = K.hp;
  }
  seedLevelEntities(level);
  GAME.level = level;
  GAME.paused = false;
  showScreen('screen-game');
  resizeCanvas(canvas);
  document.getElementById('touch-controls').classList.toggle('show', GAME.settings.touch);
  document.getElementById('hud-vehicle-block').style.display = stage.onFoot ? 'none' : 'block';
  document.getElementById('hud-boss').classList.remove('show');
  const deadOverlay = document.getElementById('hud-dead-overlay');
  if (deadOverlay) deadOverlay.classList.remove('show');
  MP._doneIds = [];
  updateWeaponSlotsUI();
  updateObjectiveUI();

  if (STAGE_MUSIC[stage.key]) startBossMusic(stage.key); else stopBossMusic();

  let last = performance.now();
  cancelAnimationFrame(GAME.rafId);
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    GAME.frameDt = dt;
    // En multijugador, pausar es solo para vos (ver el menú): el mundo
    // compartido sigue corriendo y te pueden seguir atacando. En solitario,
    // pausar sí detiene todo como siempre.
    if (!GAME.paused || mpIsActive()) { update(dt); render(); }
    GAME.rafId = requestAnimationFrame(loop);
  }
  GAME.rafId = requestAnimationFrame(loop);
}

function generateDecor(stage) {
  const decor = [];
  const kinds = stage.key === 'dino' ? ['house', 'tree', 'road']
    : stage.key === 'tank' ? ['rubble', 'house', 'road']
    : stage.key === 'absurd' ? ['cloud', 'road']
    : stage.key === 'animal' ? ['tree', 'rock']
    : ['ruin', 'rubble'];
  for (let i = 0; i < 46; i++) {
    decor.push({
      kind: choice(kinds),
      x: rand(80, WORLD.w - 80), y: rand(80, WORLD.h - 80),
      s: rand(0.7, 1.6), rot: rand(0, Math.PI * 2),
    });
  }
  return decor;
}

function seedLevelEntities(level) {
  const { stage } = level;
  const zombieCount = (level.diff && level.diff.zombies) || { dino: 18, tank: 22, absurd: 16, animal: 24, final: 26 }[stage.key];
  for (let i = 0; i < zombieCount; i++) spawnZombie(level);

  if (stage.objectiveType === 'rescue') {
    // Las posiciones de los supervivientes deben ser IGUALES para todos
    // (es una misión compartida): solo el Admin (o en solitario) las genera;
    // los invitados arrancan vacíos y las reciben del Admin (ver 'objective').
    if (!mpIsActive() || MP.isHost) {
      for (let i = 0; i < level.rescueTarget; i++) {
        level.survivors.push({ id: i, x: rand(150, WORLD.w - 150), y: rand(150, WORLD.h - 150), rescued: false, following: false });
      }
    }
  }
  if (stage.objectiveType === 'findNPC') {
    // En multijugador se rescata a un familiar por jugador (científico,
    // hermano, mamá, papá, gato — en ese orden); en solitario solo al
    // científico, igual que antes. Solo el Admin (o en solitario) genera
    // las posiciones; los invitados las reciben (ver 'objective').
    const familyCount = mpIsActive() ? clamp(MP.players.length, 1, STAGE2_FAMILY.length) : 1;
    if (!mpIsActive() || MP.isHost) {
      level.npcs = STAGE2_FAMILY.slice(0, familyCount).map((f, i) => {
        const x = rand(200, WORLD.w - 200), y = rand(200, WORLD.h - 200);
        return {
          id: i, kind: f.kind, name: f.name,
          x, y, spawnX: x, spawnY: y, // spawnX/Y: a dónde vuelve si quien lo escoltaba muere
          found: false, following: false, delivered: false, rescuedBy: null,
        };
      });
    }
  }
  if (stage.objectiveType === 'airBoss') {
    level.heliTimer = 3;
    level.helisSpawned = 0;
  }
  if (stage.objectiveType === 'boss') {
    // el jefe aparece al final del mapa; se activa cuando el jugador se acerca
    // MULTIJUGADOR: robot GIGANTE (1.8x de tamaño), con 5 veces más vida, 8 escoltas,
    // disparos más rápidos y más densos, y llama refuerzos de zombies (ver updateBoss).
    // En solitario el jefe se mantiene igual que siempre.
    // SOLITARIO: también es un robot grande (1.6x), con 3 veces más vida (4500), 6 escoltas y
    // muchas más balas (ver updateBoss), pero sin refuerzos de zombies y con balas no tan rápidas
    // para que siga siendo esquivable.
    const MULTI = mpIsActive();
    const BIG = true;
    const bossHp = MULTI ? 7500 : 4500;
    const escortN = MULTI ? 8 : 6;
    const orbitMul = MULTI ? 1.7 : 1.45;
    level.boss = {
      x: WORLD.w / 2, y: 220, hp: bossHp, maxHp: bossHp, phase: 1, active: false,
      angle: 0, cd: 0, moveT: 0, defeated: false, coreDefeated: false,
      big: BIG, solo: !MULTI, scale: MULTI ? 1.8 : 1.6, summonT: 10,
    };
    // mini robots que lo escoltan y disparan también al jugador
    level.miniRobots = Array.from({ length: escortN }, (_, i) => {
      const orbitAngle = (i / escortN) * Math.PI * 2;
      return {
        id: i, x: level.boss.x + Math.cos(orbitAngle) * 100 * orbitMul, y: level.boss.y + Math.sin(orbitAngle) * 100 * orbitMul,
        hp: 80, maxHp: 80, orbitAngle, orbitSpeed: rand(0.5, 0.9) * (Math.random() < 0.5 ? 1 : -1),
        orbitR: rand(85, 120) * orbitMul, angle: 0, cd: rand(0, 1), hit: 0, alive: true,
      };
    });
  }
  if (stage.objectiveType === 'finalBattle') {
    // Los DOS jefes a la vez, desde el primer segundo: el helicóptero de la
    // etapa 3 (con escudo hasta eliminar a sus mini aviones) y el robot de la
    // etapa 5 (invulnerable hasta eliminar a sus mini robots).
    const D = level.diff;
    level.helisSpawned = 5; level.heliTimer = 0; // sin oleadas: el jefe ya está en el mapa
    const heliHp = Math.round(1300 * D.bossHp);
    level.heli = {
      x: WORLD.w * 0.22, y: 420, hp: heliHp, maxHp: heliHp,
      isBoss: true, active: true, cd: 1.5, hit: 0, vx: rand(-40, 40), vy: rand(-40, 40), shielded: true,
    };
    level.miniPlanes = Array.from({ length: D.escortPlanes }, (_, i) => {
      const orbitAngle = (i / D.escortPlanes) * Math.PI * 2;
      const hp = Math.round(35 * D.escortHp);
      return {
        id: i, x: level.heli.x + Math.cos(orbitAngle) * 130, y: level.heli.y + Math.sin(orbitAngle) * 130,
        hp, maxHp: hp, orbitAngle, orbitSpeed: rand(0.6, 1.0) * (Math.random() < 0.5 ? 1 : -1),
        orbitR: rand(110, 165), angle: 0, cd: rand(0, 1.2), hit: 0, alive: true,
      };
    });
    const robotHp = Math.round(1500 * D.bossHp);
    level.boss = {
      x: WORLD.w * 0.72, y: 260, hp: robotHp, maxHp: robotHp, phase: 1, active: true,
      angle: 0, cd: 1.5, moveT: 0, defeated: false, coreDefeated: false,
    };
    level.miniRobots = Array.from({ length: D.escortRobots }, (_, i) => {
      const orbitAngle = (i / D.escortRobots) * Math.PI * 2;
      const hp = Math.round(80 * D.escortHp);
      return {
        id: i, x: level.boss.x + Math.cos(orbitAngle) * 100, y: level.boss.y + Math.sin(orbitAngle) * 100,
        hp, maxHp: hp, orbitAngle, orbitSpeed: rand(0.5, 0.9) * (Math.random() < 0.5 ? 1 : -1),
        orbitR: rand(85, 120), angle: 0, cd: rand(0, 1), hit: 0, alive: true,
      };
    });
    // helicópteros comunes de la etapa 3, sueltos por el mapa (se reponen solos)
    level.patrolTimer = 6;
    for (let i = 0; i < D.patrols; i++) spawnPatrolHeli(level);
  }
  if (stage.resource) {
    for (let i = 0; i < 9; i++) {
      level.pickups.push({ x: rand(100, WORLD.w - 100), y: rand(100, WORLD.h - 100), kind: 'resource', taken: false });
    }
  }
}

// Meta de bajas de la etapa 'survive': 50 en solitario, 100 en multijugador.
function surviveGoal(stage) {
  return (mpIsActive() && stage.surviveKillTargetMP) ? stage.surviveKillTargetMP : stage.surviveKillTarget;
}

function spawnZombie(level) {
  const type = choice(level.stage.objectiveType === 'killStreak' ? killStreakTypes(level) : level.stage.zombieTypes);
  const edge = randi(0, 3);
  let x, y;
  if (edge === 0) { x = rand(0, WORLD.w); y = 0; }
  else if (edge === 1) { x = rand(0, WORLD.w); y = WORLD.h; }
  else if (edge === 2) { x = 0; y = rand(0, WORLD.h); }
  else { x = WORLD.w; y = rand(0, WORLD.h); }
  level.nextZombieId = (level.nextZombieId || 0) + 1;
  const zhp = level.diff ? level.diff.zombieHp : 1;
  level.zombies.push({
    id: level.nextZombieId,
    x, y, type, hp: Math.round((type === 'rider' ? 60 : 42) * zhp), maxHp: Math.round((type === 'rider' ? 60 : 42) * zhp),
    speed: type === 'rider' ? rand(175, 225) : rand(48, 82),
    angle: 0, cd: rand(0, 1), hit: 0, alive: true,
  });
}

/* ------------------------------- INPUT ------------------------------------ */

function setupInput() {
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && GAME.screen === 'screen-game') e.preventDefault();
    GAME.input.keys[e.code] = true;
    if (e.code === 'Escape' && GAME.screen === 'screen-game') togglePause(!GAME.paused);
    if (['Digit1', 'Digit2', 'Digit3'].includes(e.code) && GAME.level) {
      const idx = Number(e.code.slice(-1)) - 1;
      if (idx < GAME.level.weaponStates.length) { GAME.level.activeWeapon = idx; updateWeaponSlotsUI(); }
    }
    if (e.code === 'KeyE' && GAME.level) tryInteract();
  });
  window.addEventListener('keyup', e => { GAME.input.keys[e.code] = false; });

  const canvas = document.getElementById('game-canvas');
  canvas.style.touchAction = 'none';

  function updateMousePos(e) {
    const r = canvas.getBoundingClientRect();
    GAME.input.mouse.x = e.clientX - r.left; GAME.input.mouse.y = e.clientY - r.top;
  }

  // Pointer Events (en vez de mousedown/mousemove/mouseup) + captura de puntero:
  // así el disparo nunca se "pierde" aunque el mouse se mueva rápido o salga
  // del canvas mientras se mantiene el click apretado (algo que sí puede pasar
  // con mousedown/mouseup normales, sobre todo mientras te mueves con WASD).
  canvas.addEventListener('pointermove', updateMousePos);
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; // solo click izquierdo dispara
    e.preventDefault();
    updateMousePos(e);
    canvas.setPointerCapture(e.pointerId);
    GAME.input.mouse.down = true;
  });
  const releaseFire = e => {
    if (e.button !== undefined && e.button !== 0) return;
    GAME.input.mouse.down = false;
  };
  canvas.addEventListener('pointerup', releaseFire);
  canvas.addEventListener('pointercancel', releaseFire);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Si la ventana pierde el foco (alt-tab, click fuera, etc.) soltamos todo
  // para que ninguna tecla o el click queden "pegados" como presionados.
  window.addEventListener('blur', () => {
    GAME.input.keys = {};
    GAME.input.mouse.down = false;
  });

  // En celulares el evento 'resize' del navegador no siempre se dispara al
  // ocultarse/mostrarse la barra de direcciones, al rotar la pantalla, o al
  // entrar/salir de pantalla completa — cosas que pasan constantemente en
  // una partida. Si el canvas (buffer de dibujo) se queda con un tamaño
  // viejo mientras su caja CSS ya cambió, todo el mundo se ve estirado o
  // corrido: personajes, zombies, helicópteros aparecen en lugares que no
  // corresponden al toque/clic real. ResizeObserver sí detecta CUALQUIER
  // cambio real de tamaño del propio canvas, sea cual sea la causa.
  const canvasResizeObserver = new ResizeObserver(() => { if (GAME.screen === 'screen-game') resizeCanvas(canvas); });
  canvasResizeObserver.observe(canvas);
  window.addEventListener('resize', () => { if (GAME.screen === 'screen-game') resizeCanvas(canvas); });

  // touch stick
  const stick = document.getElementById('touch-stick');
  const nub = document.getElementById('touch-stick-nub');
  let stickActive = false, stickId = null, center = { x: 0, y: 0 };
  stick.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0]; stickId = t.identifier; stickActive = true;
    const r = stick.getBoundingClientRect(); center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  window.addEventListener('touchmove', e => {
    if (!stickActive) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== stickId) continue;
      let dx = t.clientX - center.x, dy = t.clientY - center.y;
      const m = Math.hypot(dx, dy), max = 40;
      if (m > max) { dx = dx / m * max; dy = dy / m * max; }
      nub.style.left = 32 + dx + 'px'; nub.style.top = 32 + dy + 'px';
      GAME.input.touch.move.x = dx / max; GAME.input.touch.move.y = dy / max;
    }
  }, { passive: false });
  window.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) { stickActive = false; nub.style.left = '32px'; nub.style.top = '32px'; GAME.input.touch.move = { x: 0, y: 0 }; }
    }
  });

  // joystick de apuntar/disparar: queda SIEMPRE fijo en su lugar (abajo a la
  // derecha); tocar en cualquier parte de la zona derecha empieza a disparar,
  // y arrastrar desde ahí define el ángulo de disparo sin soltar.
  const aimZone = document.getElementById('touch-aim-zone');
  const aimStick = document.getElementById('touch-aim-stick');
  const aimNub = document.getElementById('touch-aim-nub');
  let aimId = null, aimCenter = { x: 0, y: 0 };
  aimZone.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    aimId = t.identifier;
    const r = aimStick.getBoundingClientRect();
    aimCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    aimStick.classList.add('show');
    aimNub.style.left = '35px'; aimNub.style.top = '35px';
    GAME.input.touch.fire = true;
    // si el toque inicial ya trae un ángulo claro (dedo lejos del centro fijo),
    // apuntamos ahí mismo en vez de esperar a que arrastre.
    let dx0 = t.clientX - aimCenter.x, dy0 = t.clientY - aimCenter.y;
    if (Math.hypot(dx0, dy0) > 6) { GAME.input.touch.aimAngle = Math.atan2(dy0, dx0); GAME.input.touch.aiming = true; }
  }, { passive: false });
  window.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== aimId) continue;
      let dx = t.clientX - aimCenter.x, dy = t.clientY - aimCenter.y;
      const m = Math.hypot(dx, dy), max = 45;
      if (m > max) { dx = dx / m * max; dy = dy / m * max; }
      aimNub.style.left = (35 + dx) + 'px'; aimNub.style.top = (35 + dy) + 'px';
      if (m > 6) { GAME.input.touch.aimAngle = Math.atan2(dy, dx); GAME.input.touch.aiming = true; }
    }
  }, { passive: false });
  window.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === aimId) {
        aimId = null; aimStick.classList.remove('show');
        aimNub.style.left = '35px'; aimNub.style.top = '35px';
        GAME.input.touch.fire = false; GAME.input.touch.aiming = false;
      }
    }
  });

  document.getElementById('touch-interact').addEventListener('touchstart', e => { e.preventDefault(); tryInteract(); });
  document.getElementById('touch-pause').addEventListener('touchstart', e => {
    e.preventDefault();
    if (GAME.screen === 'screen-game') togglePause(!GAME.paused);
  });
  document.getElementById('touch-weapon').addEventListener('touchstart', e => {
    e.preventDefault();
    if (!GAME.level) return;
    GAME.level.activeWeapon = (GAME.level.activeWeapon + 1) % GAME.level.weaponStates.length;
    updateWeaponSlotsUI();
  });

  document.getElementById('opt-touch').addEventListener('change', e => { GAME.settings.touch = e.target.checked; });
  document.getElementById('opt-shake').addEventListener('change', e => { GAME.settings.shake = e.target.checked; });
  document.getElementById('opt-music').addEventListener('input', e => {
    GAME.settings.music = Number(e.target.value);
    updateMusicVolume();
  });
  document.getElementById('opt-sfx').addEventListener('input', e => { GAME.settings.sfx = Number(e.target.value); });

  // Al volver a la pestaña, si el navegador pausó la música, la retomamos.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && musicStarted) MUSIC.play().catch(() => {});
  });

  // Detecta automáticamente si es un dispositivo táctil (celular/tablet)
  // y activa los controles táctiles por defecto, sin que el jugador tenga
  // que ir a buscar la opción en Configuración.
  const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  LOW_FX = isTouchDevice;
  if (isTouchDevice) {
    GAME.settings.touch = true;
    document.getElementById('opt-touch').checked = true;
  }
  const fsBtn = document.getElementById('btn-fullscreen');
  if (fsBtn && isTouchDevice) fsBtn.style.display = '';
}

function resizeCanvas(canvas) {
  canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
}

function togglePause(p) {
  GAME.paused = p;
  document.getElementById('screen-pause').classList.toggle('active', p);
  const hasStageMusic = GAME.level && STAGE_MUSIC[GAME.level.stage.key] && GAME.level.subPhase === 'play';
  if (hasStageMusic) { if (p) MUSIC.pause(); else MUSIC.play().catch(() => {}); }
}

/* ------------------------------ INTERACCIÓN -------------------------------- */

function tryInteract() {
  const level = GAME.level; if (!level) return;
  const p = level.player;
  const stage = level.stage;
  const myId = mpMyId();

  if (stage.objectiveType === 'rescue') {
    const s = level.survivors.find(sv => !sv.rescued && dist(p.x, p.y, sv.x, sv.y) < 46);
    if (s) {
      if (!mpIsActive() || MP.isHost) mpClaimSurvivor(level, s.id);
      else if (MP.hostConn) { try { MP.hostConn.send({ type: 'rescue-survivor', id: s.id }); } catch (e) { /* noop */ } }
    }
  }
  if (stage.objectiveType === 'findNPC') {
    // Cada jugador puede rescatar solo a UN familiar (ver mpClaimNpc).
    const alreadyHasOne = level.npcs.some(n => n.rescuedBy != null && n.rescuedBy === myId);
    if (!alreadyHasOne) {
      const n = level.npcs.find(nn => !nn.found && dist(p.x, p.y, nn.x, nn.y) < 46);
      if (n) {
        if (!mpIsActive() || MP.isHost) mpClaimNpc(level, n.id, myId);
        else if (MP.hostConn) { try { MP.hostConn.send({ type: 'rescue-npc', id: n.id }); } catch (e) { /* noop */ } }
      }
    }
  }
  if (stage.objectiveType === 'airBoss' && !level.hasPotion && !level.potionHolder) {
    const potion = level.pickups.find(pk => pk.kind === 'potion' && !pk.taken);
    if (potion && dist(p.x, p.y, potion.x, potion.y) < 46) {
      if (!mpIsActive() || MP.isHost) mpClaimPotion(level, myId);
      else if (MP.hostConn) { try { MP.hostConn.send({ type: 'take-potion' }); } catch (e) { /* noop */ } }
    }
  }
}

/* --------------------------------- UPDATE ---------------------------------- */

function update(dt) {
  const level = GAME.level; const stage = level.stage;
  level.time += dt;
  level.shakeT = Math.max(0, level.shakeT - dt);
  if (mpIsActive() && !MP.isHost) mpSmoothStep(level, dt);
  if (level.vehicle) level.player.speed = level.vehicle.def.speed;

  // En multijugador, si estás en el menú de pausa no podés moverte ni
  // disparar, pero el mundo compartido sigue corriendo igual (te pueden
  // seguir atacando). En solitario esto ni se evalúa: el loop entero se
  // frena directamente al pausar.
  // Un jugador eliminado en multijugador queda en modo espectador: ya no se
  // mueve ni dispara, pero el mundo compartido sigue corriendo para el resto.
  const iAmBlocked = (GAME.paused && mpIsActive()) || level.dead;
  if (!iAmBlocked) {
    updatePlayerMovement(level, dt);
    updateVehicle(level, dt);
    updateWeapons(level, dt);
  } else if (level.player.invuln > 0) { level.player.invuln -= dt; }
  updateBullets(level, dt);
  // En la batalla definitiva los enemigos corren con un dt mayor (más rápidos
  // y con menos tiempo de recarga). En el resto de etapas edt === dt.
  const edt = dt * (level.diff ? level.diff.speed : 1);
  if (!mpIsActive() || MP.isHost) updateZombies(level, edt);
  updateFollowers(level, dt);
  updatePickups(level);
  if (!mpIsActive() || MP.isHost) {
    if (stage.objectiveType === 'airBoss' || stage.objectiveType === 'finalBattle') updateHelis(level, edt);
    if (level.miniPlanes) updateMiniPlanes(level, edt);
    if (stage.objectiveType === 'boss' || stage.objectiveType === 'finalBattle') updateBoss(level, edt);
    if (stage.objectiveType === 'killStreak') updateKillStreak(level, dt);
    if (level.miniRobots) updateMiniRobots(level, edt);
    if (stage.objectiveType === 'finalBattle') { updateShip(level, edt); updateFinalBattle(level, dt); }
  }
  if (level.companion) updateCompanion(level, dt);
  if (level.allies) updateAllies(level, dt);

  if (!level.dead) {
    level.camera.x = lerp(level.camera.x, level.player.x, 0.12);
    level.camera.y = lerp(level.camera.y, level.player.y, 0.12);
  } else if (mpSpectating(level)) {
    // espectador: la cámara sigue a un compañero vivo
    const t = mpSpectateTarget(level);
    if (t) { level.camera.x = lerp(level.camera.x, t.rx, 0.12); level.camera.y = lerp(level.camera.y, t.ry, 0.12); }
  }

  // Un jugador eliminado no puede "completar" la etapa con su posición
  // congelada de cuando cayó (p. ej. si murió justo parado en la zona
  // segura). Eso lo sacaba de la pantalla de eliminado hacia la de espera
  // sin poder volver, obligándolo a reiniciar toda la etapa para salir.
  if (!level.dead || (mpFriendMode() && level.subPhase === 'bossDefeatedCutscene')) checkStageCompletion(level);
  level._hudT = (level._hudT === undefined ? 1 : level._hudT) + dt;
  if (level._hudT >= 0.1) { level._hudT = 0; updateHUD(level); }
  if (mpIsActive()) mpBroadcastMyState(level, dt);
}

function moveVector() {
  const k = GAME.input.keys;
  let dx = 0, dy = 0;
  if (k['KeyW'] || k['ArrowUp']) dy -= 1;
  if (k['KeyS'] || k['ArrowDown']) dy += 1;
  if (k['KeyA'] || k['ArrowLeft']) dx -= 1;
  if (k['KeyD'] || k['ArrowRight']) dx += 1;
  const t = GAME.input.touch.move;
  if (Math.abs(t.x) > 0.15 || Math.abs(t.y) > 0.15) { dx = t.x; dy = t.y; }
  const m = Math.hypot(dx, dy);
  if (m > 1) { dx /= m; dy /= m; }
  return { dx, dy, moving: m > 0.05 };
}

function updatePlayerMovement(level, dt) {
  const p = level.player;
  const { dx, dy, moving } = moveVector();
  const speedMult = GAME.selection.character && GAME.selection.character.id === 'female' ? 1.05 : 1.0;
  p.x = clamp(p.x + dx * p.speed * speedMult * dt, 20, WORLD.w - 20);
  p.y = clamp(p.y + dy * p.speed * speedMult * dt, 20, WORLD.h - 20);
  if (p.invuln > 0) p.invuln -= dt;

  // dirección del vehículo/personaje: la controlan WASD / flechas
  if (moving) p.moveAngle = Math.atan2(dy, dx);
  if (p.moveAngle === undefined) p.moveAngle = 0;

  // dirección de apuntado/disparo: la controla el mouse (o el joystick táctil
  // derecho en celulares), independiente del movimiento
  if (GAME.input.touch.aiming) {
    p.angle = GAME.input.touch.aimAngle;
  } else {
    const canvas = document.getElementById('game-canvas');
    const screenCX = canvas.width / 2, screenCY = canvas.height / 2;
    const zoom = getViewZoom(canvas.width, canvas.height);
    const worldMouseX = level.camera.x + (GAME.input.mouse.x - screenCX) / zoom;
    const worldMouseY = level.camera.y + (GAME.input.mouse.y - screenCY) / zoom;
    p.angle = angleTo(p.x, p.y, worldMouseX, worldMouseY);
  }

  level.distanceTravelled += Math.hypot(dx, dy) * p.speed * dt;

  // interacción cercana (para mostrar prompt)
  level.interactTarget = null;
  if (level.stage.objectiveType === 'rescue') {
    const s = level.survivors.find(sv => !sv.rescued && dist(p.x, p.y, sv.x, sv.y) < 46);
    if (s) level.interactTarget = s;
  }
  if (level.stage.objectiveType === 'findNPC') {
    const alreadyHasOne = level.npcs.some(n => n.rescuedBy != null && n.rescuedBy === mpMyId());
    if (!alreadyHasOne) {
      const n = level.npcs.find(nn => !nn.found && dist(p.x, p.y, nn.x, nn.y) < 46);
      if (n) level.interactTarget = n;
    }
  }
  if (level.stage.objectiveType === 'airBoss' && !level.hasPotion && !level.potionHolder) {
    const potion = level.pickups.find(pk => pk.kind === 'potion' && !pk.taken);
    // El prompt "presiona E" solo aparece si este jugador puede agarrarla
    // (tiene la vida más alta, o hay empate y cualquiera puede).
    const eligible = !mpIsActive() || !level.potionEligible || level.potionEligible.includes(mpMyId());
    if (potion && eligible && dist(p.x, p.y, potion.x, potion.y) < 46) level.interactTarget = potion;
  }
}

function updateVehicle(level, dt) {
  const v = level.vehicle; if (!v) return;
  const p = level.player;
  // distancia realmente recorrida este cuadro (para animar el paso a la velocidad real)
  const moved = v._px === undefined ? 0 : Math.hypot(p.x - v._px, p.y - v._py);
  v._px = p.x; v._py = p.y;
  v.x = p.x; v.y = p.y;
  const face = p.moveAngle || 0;
  // solo se suaviza la rotación visual; la posición sigue al jugador sin retraso.
  // Las monturas pesadas (tanque) giran más lento que las ligeras (velocirraptor, pelota).
  const turnRate = clamp(dt * (5 + v.def.speed * 0.045), 0, 1);
  v.angle = lerpAngle(v.angle, face, turnRate);
  if (!v.anim) v.anim = { ph: 0, sp: 0, turn: 0 };
  stepVisualHeading(v.anim, face, turnRate, clamp(dt * 14, 0, 1)); // lo que se ve: giro suave + volteo de izquierda a derecha
  v.anim.sp += ((moved > 0.15 ? 1 : 0) - v.anim.sp) * clamp(dt * 10, 0, 1);
  v.anim.ph += moved * 0.16;
  p.speed = v.def.speed;
  if (v.hp <= 0) onVehicleDestroyed(level);
}

function updateWeapons(level, dt) {
  const ws = level.weaponStates[level.activeWeapon];
  if (!ws) return;
  ws.cd -= dt * 1000;
  if (ws.ammo < ws.def.maxAmmo) { ws.regenAcc += dt * 1000; if (ws.regenAcc >= ws.def.regenMs) { ws.regenAcc = 0; ws.ammo++; } }
  const wantFire = GAME.input.mouse.down || GAME.input.touch.fire || GAME.input.keys['Space'];
  if (wantFire && ws.cd <= 0 && ws.ammo > 0) {
    ws.cd = ws.def.fireRate; ws.ammo--;
    fireWeapon(level, ws.def);
  }
}

function fireWeapon(level, w) {
  const p = level.player;
  // En el tanque el cañón es más largo que el brazo de un personaje a pie,
  // así que la bala nace más adelante, justo en la punta del cañón (que ya
  // apunta hacia la puntería real, ver drawVehicle).
  const isTankTurret = level.vehicle && level.vehicle.def && level.vehicle.def.kind === 'tank';
  const muzzleDist = isTankTurret ? 30 : 20;
  const muzzleX = p.x + Math.cos(p.angle) * muzzleDist, muzzleY = p.y + Math.sin(p.angle) * muzzleDist;
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const spread = (Math.random() - 0.5) * w.spread * 2;
    const a = p.angle + spread;
    const shot = {
      x: muzzleX, y: muzzleY, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed,
      dmg: w.dmg, color: w.color, life: w.short ? 0.25 : 1.0, r: w.short ? 5 : 3,
    };
    level.bullets.push(shot);
    mpQueueShot(level, shot);
  }
  level.shakeT = Math.min(level.shakeT + 0.03, 0.12);
}

function updateBullets(level, dt) {
  level.bullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
  level.bullets = level.bullets.filter(b => b.life > 0 && b.x > -50 && b.x < WORLD.w + 50 && b.y > -50 && b.y < WORLD.h + 50);

  level.enemyBullets.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; });
  level.enemyBullets = level.enemyBullets.filter(b => b.life > 0);

  // balas de OTROS jugadores: solo visuales (el daño lo aplica quien dispara).
  // Desaparecen al tocar un zombie para que el impacto se vea natural.
  if (level.remoteBullets && level.remoteBullets.length) {
    level.remoteBullets.forEach(b => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (let i = 0; i < level.zombies.length; i++) {
        const z = level.zombies[i];
        if (z.alive !== false && dist(b.x, b.y, z.x, z.y) < 15) { b.life = 0; break; }
      }
    });
    level.remoteBullets = level.remoteBullets.filter(b => b.life > 0 && b.x > -50 && b.x < WORLD.w + 50 && b.y > -50 && b.y < WORLD.h + 50);
  }

  // colisión balas jugador -> zombies
  const iAmAuthoritative = !mpIsActive() || MP.isHost;
  level.bullets.forEach(b => {
    level.zombies.forEach(z => {
      if (z.alive === false) return;
      if (dist(b.x, b.y, z.x, z.y) < 15) {
        z.hit = 0.12; b.life = 0;
        if (iAmAuthoritative) { z.hp -= b.dmg; if (mpIsActive()) z.lastHit = mpMyId(); }
        else if (MP.hostConn) { try { MP.hostConn.send({ type: 'zombie-hit', zombieId: z.id, dmg: b.dmg }); } catch (e) { /* noop */ } }
      }
    });
    if (level.boss && level.boss.active && !level.boss.defeated && !b.allyBullet) {
      if (dist(b.x, b.y, level.boss.x, level.boss.y) < 40 * (level.boss.scale || 1)) {
        b.life = 0; // el impacto se bloquea igual, para dar feedback visual
        if (!level.boss.invulnerable) {
          if (iAmAuthoritative) { level.boss.hp -= b.dmg; level.boss.hit = 0.12; }
          else if (MP.hostConn) { try { MP.hostConn.send({ type: 'ehit', kind: 'boss', dmg: b.dmg }); } catch (e) { /* noop */ } }
        }
      }
    }
    if (level.ship && !level.ship.defeated && !b.allyBullet) {
      if (dist(b.x, b.y, level.ship.x, level.ship.y) < 62) {
        b.life = 0; // el impacto se bloquea igual, para dar feedback visual
        if (!level.ship.invulnerable) {
          if (iAmAuthoritative) { level.ship.hp -= b.dmg; level.ship.hit = 0.12; }
          else if (MP.hostConn) { try { MP.hostConn.send({ type: 'ehit', kind: 'ship', dmg: b.dmg }); } catch (e) { /* noop */ } }
        }
      }
    }
    if (level.ship2 && !level.ship2.defeated && !b.allyBullet) {
      if (dist(b.x, b.y, level.ship2.x, level.ship2.y) < 62) {
        b.life = 0; // el impacto se bloquea igual, para dar feedback visual
        if (!level.ship2.invulnerable) {
          if (iAmAuthoritative) { level.ship2.hp -= b.dmg; level.ship2.hit = 0.12; }
          else if (MP.hostConn) { try { MP.hostConn.send({ type: 'ehit', kind: 'ship2', dmg: b.dmg }); } catch (e) { /* noop */ } }
        }
      }
    }
    if (level.miniRobots && !b.allyBullet) {
      level.miniRobots.forEach(m => {
        if (!m.alive) return;
        if (dist(b.x, b.y, m.x, m.y) < 20) {
          m.hit = 0.12; b.life = 0;
          if (iAmAuthoritative) { m.hp -= b.dmg; }
          else if (MP.hostConn) { try { MP.hostConn.send({ type: 'ehit', kind: 'minirobot', id: m.id, dmg: b.dmg }); } catch (e) { /* noop */ } }
        }
      });
    }
    if (level.heli && level.heli.active) {
      if (dist(b.x, b.y, level.heli.x, level.heli.y) < (level.heli.isBoss ? 54 : 24)) {
        b.life = 0;
        if (!(level.heli.isBoss && level.heli.shielded)) {
          if (iAmAuthoritative) {
            // A partir de la mitad de su vida, el jefe se vuelve el triple de
            // resistente: recibe solo un tercio del daño de cada impacto.
            const tough = level.heli.isBoss && level.heli.hp <= level.heli.maxHp * 0.5;
            level.heli.hp -= tough ? b.dmg / 3 : b.dmg;
            level.heli.hit = 0.12;
          } else if (MP.hostConn) { try { MP.hostConn.send({ type: 'ehit', kind: 'heli', dmg: b.dmg }); } catch (e) { /* noop */ } }
        }
      }
    }
    if (level.miniPlanes && !b.allyBullet) {
      level.miniPlanes.forEach(m => {
        if (!m.alive) return;
        if (dist(b.x, b.y, m.x, m.y) < 18) {
          m.hit = 0.12; b.life = 0;
          if (iAmAuthoritative) { m.hp -= b.dmg; }
          else if (MP.hostConn) { try { MP.hostConn.send({ type: 'ehit', kind: 'miniplane', id: m.id, dmg: b.dmg }); } catch (e) { /* noop */ } }
        }
      });
    }
  });
  level.bullets = level.bullets.filter(b => b.life > 0);

  // colisión balas enemigas -> jugador/vehículo: SOLO la resuelve/aplica
  // quien controla la simulación real (el Admin, o uno mismo en solitario).
  // El resto de los clientes ya recibe la lista de balas sincronizada (ver
  // mpBroadcastMyState) y las sigue moviendo/dibujando localmente para
  // VERLAS volar, pero nunca aplica daño con su propia copia — así una bala
  // nunca puede dañar a alguien que no era su blanco real.
  if (iAmAuthoritative) {
    level.enemyBullets.forEach(b => {
      const t = mpResolveTargetRef(level, b.targetRef);
      if (!t) return;
      const r = t.isSelf ? (level.vehicle ? level.vehicle.r : 16) : 20;
      if (dist(b.x, b.y, t.x, t.y) < r) {
        mpDamageTarget(level, t, b.dmg);
        b.life = 0;
      }
    });
    level.enemyBullets = level.enemyBullets.filter(b => b.life > 0);
  }

  // zombies muertos (solo lo decide quien controla la simulación real:
  // el Admin en multijugador, o el propio jugador en solitario)
  if (iAmAuthoritative) {
    level.zombies.forEach(z => {
      if (z.alive && z.hp <= 0) {
        z.alive = false; level.killsThisStage++; GAME.run.kills++; GAME.run.totalKills++;
        // Recolección de bajas (multijugador): la baja es de quien dio el último golpe
        if (mpIsActive() && level.stage.objectiveType === 'killStreak') {
          if (!level.killsBy) level.killsBy = {};
          const who = z.lastHit || 'host';
          level.killsBy[who] = (level.killsBy[who] || 0) + 1;
        }
        spawnDeathParticles(level, z.x, z.y);
        setTimeout(() => { if (level === GAME.level && level.subPhase === 'play') spawnZombie(level); }, 2600);
      }
    });
    level.zombies = level.zombies.filter(z => z.alive);
  }
}

/* ------------- MODO ESPECIAL: RECOLECCIÓN DE BAJAS ------------- */

// ---- Modo espectador (Recolección de bajas, multijugador) ----
// Al caer, el jugador mira la partida siguiendo a un compañero que sigue con vida, hasta que
// caiga el último jugador. Puede cambiar de compañero con los botones ANTERIOR / SIGUIENTE.
function mpSpectateList() {
  const done = MP._doneIds || [];
  return Object.values(MP.remoteStates || {}).filter(s => s && !s.dead && s.rx !== undefined && !done.includes(s.id))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
function mpSpectateTarget(level) {
  const list = mpSpectateList();
  if (!list.length) return null;
  let cur = list.find(s => s.id === level.spectateId);
  if (!cur) { cur = list[0]; level.spectateId = cur.id; } // el que miraba cayó: pasa al siguiente vivo
  return cur;
}
function mpSpectateCycle(level, dir) {
  if (!level || !level.dead) return;
  const list = mpSpectateList();
  if (!list.length) return;
  const i = list.findIndex(s => s.id === level.spectateId);
  level.spectateId = list[(i + dir + list.length * 2) % list.length].id;
}
function mpUpdateSpectateUI(level) {
  const el = document.getElementById('spectate-name');
  if (!el) return;
  const t = mpSpectateTarget(level);
  el.textContent = t ? `👁 Viendo a: ${t.name || 'jugador'}` : 'Esperando...';
}

// Dificultades de la Recolección de bajas. "Normal" es exactamente el comportamiento de siempre.
//  dmg/speed/hp: multiplicadores base del daño, la velocidad y la vida de los zombies.
//  count: cantidad de zombies a la vez · cap: tope de zombies · spawn: segundos entre apariciones.
//  ramp: qué tan rápido sube la dificultad con el tiempo · typeTime: cuándo llegan los tipos fuertes
//  (menor = antes: los que disparan y los jinetes aparecen antes en difícil y más tarde en fácil).
const KILL_DIFFS = {
  easy:   { label: 'FÁCIL',   dmg: 0.65, speed: 0.85, hp: 0.75, count: 0.7, cap: 45, spawn: 0.85, ramp: 0.6,  typeTime: 1.7 },
  normal: { label: 'NORMAL',  dmg: 1,    speed: 1,    hp: 1,    count: 1,   cap: 60, spawn: 0.6,  ramp: 1,    typeTime: 1   },
  hard:   { label: 'DIFÍCIL', dmg: 1.35, speed: 1.1,  hp: 1.4,  count: 1.4, cap: 85, spawn: 0.4,  ramp: 1.5,  typeTime: 0.6 },
};
function killDiffKey() { return KILL_DIFFS[GAME.killDifficulty] ? GAME.killDifficulty : 'normal'; }
function killDiffCfg(level) { return KILL_DIFFS[(level && level.killDiff) || killDiffKey()] || KILL_DIFFS.normal; }

// Muestra los 3 botones de dificultad solo cuando se eligió la Recolección de bajas en SALTO DE FASE
// (en la pantalla de modo, antes de elegir SOLITARIO o MULTIJUGADOR: vale para ambos).
function updateKillsDiffUI() {
  const st = STAGES[GAME.stageIndex];
  const show = !!(GAME.phaseSkip && st && st.objectiveType === 'killStreak');
  const cur = killDiffKey();
  document.querySelectorAll('.kills-diff-picker').forEach(p => {
    p.classList.toggle('show', show);
    p.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('selected', b.dataset.diff === cur));
  });
}

// El récord se guarda aparte por dificultad (normal conserva el récord de siempre).
function killStreakBestKey() {
  const suffix = killDiffKey() === 'normal' ? '' : '_' + killDiffKey();
  return (mpIsActive() ? 'ez_kills_best_mp' : 'ez_kills_best_solo') + suffix;
}
function killStreakBest() {
  try { return parseInt(localStorage.getItem(killStreakBestKey()), 10) || 0; } catch (e) { return 0; }
}
function killStreakSaveBest(n) {
  try { localStorage.setItem(killStreakBestKey(), String(n)); } catch (e) { /* sin almacenamiento: no pasa nada */ }
}

// Tipos de zombie que pueden aparecer según el tiempo de partida (más variedad con el tiempo).
function killStreakTypes(level) {
  const t = (level.time || 0) / killDiffCfg(level).typeTime;
  return t < 40 ? ['walker'] : t < 100 ? ['walker', 'walker', 'gunner'] : ['walker', 'walker', 'gunner', 'rider'];
}

// Solo lo corre quien controla la simulación real (solitario o Admin): sube la dificultad con el
// tiempo, mantiene la cantidad de zombies y, en multijugador, detecta cuándo cayó todo el equipo.
function updateKillStreak(level, dt) {
  if (level.subPhase !== 'play') return;
  const D = level.diff, t = level.time, K = killDiffCfg(level);
  D.speed = K.speed * Math.min(1.5, 1 + K.ramp * t / 360);     // en normal: hasta +50% de velocidad y cadencia (a los 3 min)
  D.dmg = K.dmg * Math.min(1.6, 1 + K.ramp * t / 300);         // en normal: hasta +60% de daño (a los 3 min)
  D.zombieHp = K.hp * Math.min(2.5, 1 + K.ramp * t / 150);     // en normal: los nuevos zombies llegan con hasta 2.5x de vida
  const players = mpIsActive() ? Math.max(1, MP.players.length) : 1;
  const target = Math.min(K.cap, Math.round((18 + Math.floor(t * K.ramp / 10) + (players - 1) * 6) * K.count));
  level._ksSpawn = (level._ksSpawn || 0) - dt;
  if (level.zombies.length < target && level._ksSpawn <= 0) { level._ksSpawn = K.spawn; spawnZombie(level); }

  // Multijugador: se anota cuánto aguantó cada jugador (momento en que cayó)
  if (mpIsActive() && MP.isHost) {
    if (!level._deathT) level._deathT = {};
    if (!level._roster) level._roster = MP.players.map(p => ({ id: p.id, name: p.name }));
    if (level.dead && level._deathT.host === undefined) level._deathT.host = level.time;
    MP.conns.forEach(c => { const s = MP.remoteStates[c.peer]; if (s && s.dead && level._deathT[c.peer] === undefined) level._deathT[c.peer] = level.time; });
  }

  // Multijugador: la partida termina cuando cayeron TODOS (el Admin lo decide y avisa al resto)
  if (mpIsActive() && MP.isHost && (level.dead || mpChaosMode())) {
    const someoneAlive = MP.conns.some(c => { const s = MP.remoteStates[c.peer]; return !s || !s.dead; });
    const anyDown = level.dead || MP.conns.some(c => { const s = MP.remoteStates[c.peer]; return !!(s && s.dead); });
    if (mpChaosMode() ? anyDown : !someoneAlive) { // Modo caos: basta con que caiga uno
      const time = Math.floor(level.time);
      const board = killStreakBuildBoard(level, time);
      const kills = board.reduce((a, r) => a + r.kills, 0);
      MP.conns.forEach(c => { try { c.send({ type: 'kills-over', kills, time, board }); } catch (e) { /* noop */ } });
      killStreakFinish(level, kills, time, board);
    }
  }
}

// Clasificación final (multijugador): una fila por jugador con SUS bajas y cuánto aguantó.
// Orden: más bajas primero; si empatan, el que aguantó más tiempo.
function killStreakBuildBoard(level, endTime) {
  const roster = level._roster || MP.players.map(p => ({ id: p.id, name: p.name }));
  const rows = roster.map(p => {
    const t = level._deathT && level._deathT[p.id] !== undefined ? Math.floor(level._deathT[p.id]) : endTime;
    return { id: p.id, name: p.name || 'Jugador', kills: (level.killsBy && level.killsBy[p.id]) || 0, time: Math.min(t, endTime) };
  });
  rows.sort((a, b) => b.kills - a.kills || b.time - a.time);
  return rows;
}

// Pantalla de resultados (solitario, Admin e invitados). Guarda el mejor récord del dispositivo.
function killStreakFinish(level, kills, seconds, board) {
  if (!level || level.subPhase === 'complete') return;
  level.subPhase = 'complete';
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  const diffEl = document.getElementById('kills-over-diff');
  if (diffEl) diffEl.textContent = 'DIFICULTAD: ' + killDiffCfg(level).label;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  // En multijugador el récord personal se compara con las bajas de ESTE jugador, no las del equipo.
  const myId = mpMyId();
  const myKills = board ? ((board.find(r => r.id === myId) || {}).kills || 0) : kills;
  const prev = killStreakBest();
  const record = myKills > prev;
  if (record) killStreakSaveBest(myKills);
  const soloBox = document.getElementById('kills-solo-box');
  const boardBox = document.getElementById('kills-board-box');
  if (board && board.length) {
    // ---- clasificación multijugador ----
    if (soloBox) soloBox.style.display = 'none';
    if (boardBox) boardBox.style.display = '';
    const body = document.getElementById('kills-board-body');
    body.innerHTML = '';
    board.forEach((r, i) => {
      const tr = document.createElement('tr');
      if (r.id === myId) tr.className = 'me';
      if (i === 0) tr.classList.add('first');
      const cells = [`${i + 1}°`, r.name + (r.id === myId ? ' (tú)' : ''), String(r.kills), fmt(r.time)];
      cells.forEach((txt, ci) => { const td = document.createElement('td'); td.textContent = txt; if (ci === 0) td.className = 'rank'; tr.appendChild(td); });
      body.appendChild(tr);
    });
    const total = board.reduce((a, r) => a + r.kills, 0);
    document.getElementById('kills-total-sum').textContent = board.map(r => r.kills).join(' + ') + ' =';
    document.getElementById('kills-total-num').textContent = String(total);
    document.getElementById('kills-board-best').textContent = record ? '¡NUEVO RÉCORD PERSONAL!' : `Tu mejor marca personal: ${prev} bajas`;
  } else {
    // ---- solitario ----
    if (soloBox) soloBox.style.display = '';
    if (boardBox) boardBox.style.display = 'none';
    document.getElementById('kills-over-count').textContent = String(kills);
    document.getElementById('kills-over-time').textContent = `Tiempo sobrevivido: ${fmt(seconds)}`;
    document.getElementById('kills-over-best').textContent = record ? '¡NUEVO RÉCORD!' : `Tu mejor marca: ${prev} bajas`;
  }
  const isGuest = mpIsActive() && !MP.isHost;
  document.getElementById('btn-kills-again').style.display = isGuest ? 'none' : '';
  document.getElementById('kills-over-wait').style.display = isGuest ? '' : 'none';
  showScreen('screen-kills-over');
}

function spawnDeathParticles(level, x, y) {
  for (let i = 0; i < 8; i++) {
    level.particles.push({ x, y, vx: rand(-80, 80), vy: rand(-80, 80), life: 0.4, color: '#4a6b2a' });
  }
}

function damagePlayerOrVehicle(level, dmg) {
  if (level.dead) return; // ya eliminado: ignorar daño posterior
  if (level.vehicle) { level.vehicle.hp = Math.max(0, level.vehicle.hp - dmg); if (level.vehicle.hp <= 0) onVehicleDestroyed(level); }
  else if (level.player.invuln <= 0) { level.player.hp = Math.max(0, level.player.hp - dmg); level.player.invuln = 0.5; if (level.player.hp <= 0) onPlayerDown(level); }
  level.shakeT = Math.min(level.shakeT + 0.15, 0.25);
}

// Detiene el loop local y muestra la pantalla de fracaso de la etapa.
// Se usa tanto en solitario (apenas cae el único jugador) como en
// multijugador (recién cuando TODOS los jugadores cayeron).
function showRealStageFail(level, title, sub) {
  if (level.subPhase === 'complete') return;
  level.subPhase = 'complete';
  document.getElementById('stage-fail-title').textContent = title;
  document.getElementById('stage-fail-sub').textContent = sub;
  stageFailButtons(false);
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  showScreen('screen-stage-fail');
}

// En multijugador, cuando ESTE jugador cae no se termina la etapa: queda
// marcado como eliminado (ya no ataca ni puede ser atacado, ver
// mpGetAllTargets, y el resto lo ve apagado y con la etiqueta ELIMINADO).
// Puede volver a jugar en cualquier momento presionando "Reintentar etapa"
// en el aviso, lo que lo revive en el lugar donde cayó (ver reviveLocalPlayer).
function markLocalPlayerDead(level, title, sub) {
  if (level.dead) return;
  level.dead = true;
  const overlay = document.getElementById('hud-dead-overlay');
  if (overlay) {
    const titleEl = document.getElementById('dead-overlay-title');
    const subEl = document.getElementById('dead-overlay-sub');
    if (titleEl) titleEl.textContent = title;
    const ks = level.stage.objectiveType === 'killStreak';
    const friend = mpFriendMode();
    const chaos = mpChaosMode();
    const noRevive = ks || friend || chaos; // recolección de bajas, Modo amistad y Modo caos: caer es definitivo
    if (subEl) subEl.textContent = ks
      ? 'Modo espectador: mirarás a tus compañeros hasta que caiga el último jugador.'
      : chaos
        ? 'MODO CAOS: si un jugador cae, todos pierden.'
        : friend
          ? 'MODO AMISTAD: no puedes revivir. Mirarás a tus compañeros y volverás a jugar en la siguiente fase.'
          : sub + ' Los enemigos ya no te atacan. Presiona "Volver a jugar" para reaparecer aquí mismo.';
    const reviveBtn = overlay.querySelector('[data-action="revive-player"]');
    if (reviveBtn) reviveBtn.style.display = noRevive ? 'none' : '';
    const specBox = document.getElementById('spectate-box');
    const spectate = noRevive && mpIsActive() && !chaos;
    if (specBox) specBox.style.display = spectate ? '' : 'none';
    // espectador: el aviso pasa a una barra compacta abajo para dejar ver la partida de los compañeros
    overlay.classList.toggle('spectating', spectate);
    if (noRevive) level.spectateId = null;
    overlay.classList.add('show');
  }
  mpSendMyStateNow(level); // avisar de inmediato, sin esperar el próximo tick
  // Etapa 2: si estabas escoltando a un familiar sin entregar todavía, se
  // libera donde lo encontraste — alguien va a tener que ir a rescatarlo de nuevo.
  if (level.stage.objectiveType === 'findNPC') {
    const myId = mpMyId();
    const mine = level.npcs.find(n => n.rescuedBy != null && n.rescuedBy === myId && !n.delivered);
    if (mine) {
      if (!mpIsActive() || MP.isHost) mpReleaseNpc(level, mine.id);
      else if (MP.hostConn) { try { MP.hostConn.send({ type: 'release-npc', id: mine.id }); } catch (e) { /* noop */ } }
    }
  }
  if (MP.isHost) { mpFriendCheck(); mpChaosCheck(); } // Modo amistad: si ya cayeron todos, se acaba · Modo caos: si cae uno, pierden todos
}

// Revive al jugador local en el mismo lugar donde cayó, con la vida al
// máximo y un instante de invulnerabilidad para no morir de nuevo al toque.
// A partir de ahí vuelve a ser un blanco válido: los zombies y demás
// enemigos vuelven a perseguirlo y atacarlo con normalidad.
function reviveLocalPlayer(level) {
  if (!level || !level.dead) return;
  if (mpNoRevive(level)) return; // recolección de bajas y Modo amistad: caer es definitivo en esta fase
  level.dead = false;
  if (level.vehicle) level.vehicle.hp = level.vehicle.maxHp;
  level.player.hp = level.player.maxHp;
  level.player.invuln = 1.2;
  const overlay = document.getElementById('hud-dead-overlay');
  if (overlay) overlay.classList.remove('show');
  mpSendMyStateNow(level); // avisar de inmediato que ya está de vuelta en juego
}

function onVehicleDestroyed(level) {
  if (GAME.paused || level.subPhase === 'complete' || level.dead) return;
  if (mpIsActive()) markLocalPlayerDead(level, 'VEHÍCULO DESTRUIDO', 'Tu montura ha caído.');
  else showRealStageFail(level, 'VEHÍCULO DESTRUIDO', 'Tu montura ha caído. La etapa se reinicia.');
}

function onPlayerDown(level) {
  if (level.subPhase === 'complete' || level.dead) return;
  // Recolección de bajas en solitario: al caer termina la partida y se muestran los resultados
  if (level.stage.objectiveType === 'killStreak' && !mpIsActive()) { killStreakFinish(level, level.killsThisStage, Math.floor(level.time)); return; }
  if (mpIsActive()) markLocalPlayerDead(level, 'HAS CAÍDO', 'Fuiste derribado por los zombies.');
  else showRealStageFail(level, 'HAS CAÍDO', 'Fuiste derribado por los zombies.');
}

function updateZombies(level, dt) {
  const targets = mpGetAllTargets(level);
  level.zombies.forEach(z => {
    z.hit = Math.max(0, z.hit - dt);
    z.cd -= dt;
    const target = mpNearestTarget(z, targets);
    const d = dist(z.x, z.y, target.x, target.y);
    z.angle = angleTo(z.x, z.y, target.x, target.y);
    if (z.type === 'gunner' && d < 340 && d > 90) {
      if (z.cd <= 0) {
        z.cd = 1.6;
        // Siempre sale una bala real (visible para todos, ver enemyBullets en la
        // sincronización), sea el blanco el Admin o un invitado. Antes, si el blanco
        // era un invitado, se le restaba vida al instante desde hasta 340px sin bala:
        // en el celular parecía daño "de la nada".
        level.enemyBullets.push({ x: z.x, y: z.y, vx: Math.cos(z.angle) * 260, vy: Math.sin(z.angle) * 260, dmg: 8, life: 2, targetRef: mpTargetRef(target) });
      }
    } else if (d > 26) {
      z.x += Math.cos(z.angle) * z.speed * dt; z.y += Math.sin(z.angle) * z.speed * dt;
    } else if (z.cd <= 0) {
      z.cd = 0.9;
      mpDamageTarget(level, target, z.type === 'rider' ? 14 : 9);
    }
  });

  level.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
  level.particles = level.particles.filter(p => p.life > 0);
}

// Todos los jugadores conectados y VIVOS son blancos válidos para los
// zombies, no solo el jugador local (esto solo importa cuando el Admin
// corre la simulación compartida; en solitario simplemente devuelve un
// único blanco). Un jugador eliminado (dead) queda fuera de la lista, así
// que los enemigos dejan de perseguirlo/atacarlo y se concentran en los
// que siguen con vida.
function mpGetAllTargets(level) {
  const self = level.vehicle || level.player;
  const list = [];
  if (!level.dead) list.push({ x: self.x, y: self.y, isSelf: true, conn: null });
  if (mpIsActive() && MP.isHost) {
    MP.conns.forEach(c => {
      const s = MP.remoteStates[c.peer];
      if (s && !s.dead) list.push({ x: s.x, y: s.y, isSelf: false, conn: c });
    });
  }
  return list;
}

function mpNearestTarget(z, targets) {
  // Si ya no queda nadie con vida, el enemigo no tiene a quién perseguir:
  // se le devuelve su propia posición como blanco (no se mueve, no ataca a nadie).
  if (!targets || targets.length === 0) return { x: z.x, y: z.y, isSelf: false, conn: null };
  let best = targets[0], bestD = Infinity;
  targets.forEach(t => { const d = dist(z.x, z.y, t.x, t.y); if (d < bestD) { bestD = d; best = t; } });
  return best;
}

function mpDamageTarget(level, target, dmg) {
  if (level.diff) dmg = dmg * level.diff.dmg; // batalla definitiva: todo el daño enemigo es mayor
  if (target.isSelf) { damagePlayerOrVehicle(level, dmg); return; }
  if (target.conn) { try { target.conn.send({ type: 'damage', dmg, targetId: target.conn.peer }); } catch (e) { /* noop */ } }
}

// Cada bala enemiga se etiqueta con el ID ABSOLUTO del jugador al que
// apuntaba en el momento de dispararse (mpTargetRef) — no relativo a quién
// la mire — para que, ahora que TODOS los clientes ven volar las balas (y
// no solo el Admin), nadie la resuelva por error como "para mí" solo por
// ser su propia perspectiva. Esa referencia es la ÚNICA que puede recibir
// el impacto (mpResolveTargetRef), y solo el Admin (o uno mismo en
// solitario) aplica el daño real — ver iAmAuthoritative en updateBullets.
function mpTargetRef(t) {
  return { id: t.isSelf ? mpMyId() : (t.conn ? t.conn.peer : null) };
}

function mpResolveTargetRef(level, ref) {
  if (!ref) return null;
  if (ref.id === mpMyId()) {
    if (level.dead) return null; // ya eliminado: la bala no le pega a nadie
    const self = level.vehicle || level.player;
    return { x: self.x, y: self.y, isSelf: true, conn: null };
  }
  if (mpIsActive() && MP.isHost) {
    const conn = MP.conns.find(c => c.peer === ref.id);
    if (conn) {
      const s = MP.remoteStates[conn.peer];
      if (s && !s.dead) return { x: s.x, y: s.y, isSelf: false, conn };
    }
  }
  return null; // el jugador al que apuntaba ya no está conectado (o ya cayó)
}

function updateFollowers(level, dt) {
  const p = level.player;
  // Los supervivientes de la etapa de rescate ya se cuentan al interactuar (ver tryInteract);
  // esto solo evita procesar cada frame algo que ya no es visible.
  // Etapa 2: cada jugador solo mueve al familiar QUE ÉL rescató (ver
  // mpClaimNpc); los familiares de otros jugadores llegan ya movidos por
  // red (ver 'ownedNpc' en mpBuildPosPayload y el manejo de 'pos').
  const myId = mpMyId();
  level.npcs.forEach(n => {
    if (n.following && !n.delivered && n.rescuedBy === myId) {
      n.x = lerp(n.x, p.x - 30, 0.06); n.y = lerp(n.y, p.y + 20, 0.06);
      if (dist(n.x, n.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r) n.delivered = true;
    }
  });
}

function updatePickups(level) {
  const target = level.vehicle || level.player;
  level.pickups.forEach(pk => {
    if (pk.taken) return;
    // La poción no se recoge automáticamente: hay que presionar E (ver tryInteract).
    if (pk.kind === 'potion') return;
    if (dist(pk.x, pk.y, target.x, target.y) < 34) {
      pk.taken = true;
      if (pk.kind === 'resource' && level.stage.canRepair && level.vehicle) {
        level.vehicle.hp = Math.min(level.vehicle.maxHp, level.vehicle.hp + level.vehicle.maxHp * 0.22);
      }
    }
  });
}

/* --------- Helicópteros (etapa 3) --------- */
function updateHelis(level, dt) {
  level.heliTimer -= dt;
  if (!level.heli && level.helisSpawned < 5 && level.heliTimer <= 0) {
    level.heliTimer = rand(3, 5); level.helisSpawned++;
    const isBoss = level.helisSpawned >= 5;
    level.heli = {
      x: rand(200, WORLD.w - 200), y: rand(200, WORLD.h - 200), hp: isBoss ? 1300 : 60, maxHp: isBoss ? 1300 : 60,
      isBoss, active: true, cd: 1, hit: 0, vx: rand(-40, 40), vy: rand(-40, 40), shielded: isBoss,
    };
    if (level.heli.isBoss) {
      level.bossHeliActive = true;
      // 10 aviones mini que escoltan al avión jefe y también disparan al jugador
      level.miniPlanes = Array.from({ length: 10 }, (_, i) => {
        const orbitAngle = (i / 10) * Math.PI * 2;
        return {
          id: i, x: level.heli.x + Math.cos(orbitAngle) * 130, y: level.heli.y + Math.sin(orbitAngle) * 130,
          hp: 35, maxHp: 35, orbitAngle, orbitSpeed: rand(0.6, 1.0) * (Math.random() < 0.5 ? 1 : -1),
          orbitR: rand(110, 165), angle: 0, cd: rand(0, 1.2), hit: 0, alive: true,
        };
      });
    }
  }
  if (level.heli) {
    const h = level.heli; h.hit = Math.max(0, h.hit - dt);
    h.x = clamp(h.x + h.vx * dt, 100, WORLD.w - 100); h.y = clamp(h.y + h.vy * dt, 100, WORLD.h - 100);
    // el helicóptero jefe esquiva con movimientos más bruscos y frecuentes,
    // lo que lo hace más difícil de acertar con las balas del jugador.
    const dashChance = h.isBoss ? 0.035 : 0.01;
    if (Math.random() < dashChance) {
      const range = h.isBoss ? 115 : 50;
      h.vx = rand(-range, range); h.vy = rand(-range, range);
    }
    h.cd -= dt;
    const target = mpNearestTarget(h, mpGetAllTargets(level));
    const range = h.isBoss ? 520 : 420;
    const inRange = dist(h.x, h.y, target.x, target.y) < range;

    if (h.isBoss) {
      if (inRange && h.cd <= 0) {
        const hpPct = h.hp / h.maxHp;
        const phase = hpPct > 0.66 ? 1 : hpPct > 0.33 ? 2 : 3;
        h.cd = phase === 1 ? 0.85 : phase === 2 ? 0.58 : 0.38;
        const aimAngle = angleTo(h.x, h.y, target.x, target.y);
        const bulletSpeed = 250 + phase * 30;
        const pattern = randi(0, 2); // cualquier tipo de bala cada vez: apuntada, abanico o volley circular
        if (pattern === 0) {
          // ráfaga apuntada
          const shots = 3 + phase;
          for (let i = 0; i < shots; i++) {
            const a = aimAngle + rand(-0.08, 0.08);
            level.enemyBullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, dmg: 9, life: 2.6, targetRef: mpTargetRef(target) });
          }
        } else if (pattern === 1) {
          // abanico amplio hacia el jugador
          const count = 6 + phase;
          const arc = 1.05;
          for (let i = 0; i < count; i++) {
            const a = aimAngle - arc / 2 + (arc / (count - 1)) * i;
            level.enemyBullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, dmg: 8, life: 2.6, targetRef: mpTargetRef(target) });
          }
        } else {
          // volley circular en todas direcciones
          const count = 10 + phase * 2;
          for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 / count) * i;
            level.enemyBullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * bulletSpeed * 0.85, vy: Math.sin(a) * bulletSpeed * 0.85, dmg: 7, life: 2.9, targetRef: mpTargetRef(target) });
          }
        }
      }
    } else if (inRange && h.cd <= 0) {
      h.cd = 1.1;
      const a = angleTo(h.x, h.y, target.x, target.y);
      level.enemyBullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, dmg: 10, life: 2.4, targetRef: mpTargetRef(target) });
    }

    if (h.hp <= 0) {
      if (h.isBoss) {
        const isFinalBattle = level.stage.objectiveType === 'finalBattle';
        if (!isFinalBattle) level.pickups.push({ x: h.x, y: h.y, kind: 'potion', taken: false, r: 20 });
        level.airBossDone = true;
        // etapa 3: se limpian todos los escoltas; batalla definitiva: los helicópteros comunes siguen
        level.miniPlanes = isFinalBattle ? level.miniPlanes.filter(m => m.patrol) : [];
        // Etapa 3: se calcula UNA sola vez, en este momento, quién tiene la
        // vida más alta de la partida — solo esos jugadores podrán agarrar
        // la poción (empate = cualquiera de ellos, potionEligible queda con
        // todos los empatados). En solitario no aplica ninguna restricción.
        if (mpIsActive() && !isFinalBattle) {
          const selfHp = level.vehicle ? level.vehicle.hp : level.player.hp;
          const candidates = level.dead ? [] : [{ id: mpMyId(), hp: selfHp }];
          if (MP.isHost) {
            MP.conns.forEach(c => {
              const s = MP.remoteStates[c.peer];
              if (s && !s.dead) candidates.push({ id: c.peer, hp: s.hp || 0 });
            });
          }
          if (candidates.length) {
            const maxHp = Math.max(...candidates.map(c => c.hp));
            level.potionEligible = candidates.filter(c => c.hp === maxHp).map(c => c.id);
          } else {
            level.potionEligible = null; // nadie con datos de vida: no se restringe
          }
        }
      }
      level.heli = null;
    }
  }
}

// Los 10 aviones mini orbitan alrededor del avión jefe, lo siguen si se mueve,
// y también disparan al jugador. Dejan de actuar y se limpian cuando el jefe muere.
function updateMiniPlanes(level, dt) {
  if (!level.miniPlanes || !level.miniPlanes.length) return;
  const h = level.heli;
  const bossUp = !!(h && h.isBoss && h.hp > 0);
  // Sin helicóptero jefe vivo los escoltas se retiran; los helicópteros comunes
  // ("patrol", solo en la batalla definitiva) siguen por su cuenta.
  if (!bossUp) {
    level.miniPlanes = level.miniPlanes.filter(m => m.patrol);
    if (!level.miniPlanes.length) return;
  }
  const targets = mpGetAllTargets(level);
  level.miniPlanes.forEach(m => {
    if (!m.alive) return;
    m.hit = Math.max(0, m.hit - dt);
    if (m.patrol) {
      // helicóptero común de la etapa 3: se mueve a los tirones y dispara al blanco más cercano
      m.x = clamp(m.x + m.vx * dt, 100, WORLD.w - 100);
      m.y = clamp(m.y + m.vy * dt, 100, WORLD.h - 100);
      if (Math.random() < 0.01) { m.vx = rand(-50, 50); m.vy = rand(-50, 50); }
      const pt = mpNearestTarget(m, targets);
      m.angle = angleTo(m.x, m.y, pt.x, pt.y);
      m.cd -= dt;
      if (dist(m.x, m.y, pt.x, pt.y) < 420 && m.cd <= 0) {
        m.cd = 1.1;
        level.enemyBullets.push({ x: m.x, y: m.y, vx: Math.cos(m.angle) * 220, vy: Math.sin(m.angle) * 220, dmg: 10, life: 2.4, targetRef: mpTargetRef(pt) });
      }
      return;
    }
    const target = mpNearestTarget(h, targets);
    m.orbitAngle += m.orbitSpeed * dt;
    m.x = lerp(m.x, h.x + Math.cos(m.orbitAngle) * m.orbitR, 0.12);
    m.y = lerp(m.y, h.y + Math.sin(m.orbitAngle) * m.orbitR, 0.12);
    m.angle = angleTo(m.x, m.y, target.x, target.y);
    m.cd -= dt;
    const d = dist(m.x, m.y, target.x, target.y);
    if (d < 400 && m.cd <= 0) {
      m.cd = rand(1.2, 1.8);
      level.enemyBullets.push({ x: m.x, y: m.y, vx: Math.cos(m.angle) * 220, vy: Math.sin(m.angle) * 220, dmg: 6, life: 2.4, targetRef: mpTargetRef(target) });
    }
  });
  level.miniPlanes.forEach(m => {
    if (m.alive && m.hp <= 0) {
      m.alive = false;
      spawnDeathParticles(level, m.x, m.y);
      GAME.run.kills++; GAME.run.totalKills++;
    }
  });
  level.miniPlanes = level.miniPlanes.filter(m => m.alive);
  // el escudo del jefe solo depende de sus escoltas, no de los helicópteros comunes
  if (h && h.isBoss && h.shielded && !level.miniPlanes.some(m => !m.patrol)) h.shielded = false;
}

/* --------- Jefe final (etapa 5) --------- */
function updateBoss(level, dt) {
  const b = level.boss; if (!b || b.defeated) return;
  const targets = mpGetAllTargets(level);
  const nearest = mpNearestTarget(b, targets);
  if (!b.active && dist(nearest.x, nearest.y, b.x, b.y) < 480) { b.active = true; }
  if (!b.active) return;
  b.hit = Math.max(0, (b.hit || 0) - dt);

  // mientras queden mini robots vivos, el jefe es invulnerable
  const escorted = !!(level.miniRobots && level.miniRobots.length > 0);
  b.invulnerable = escorted;
  const hpPct = b.hp / b.maxHp;
  // fase de dificultad: solo escala una vez que las escoltas están muertas
  b.phase = !escorted && hpPct <= 0.3 ? 3 : !escorted && hpPct <= 0.5 ? 2 : 1;


  // Robot gigante (multijugador): dispara más rápido, sus balas van más rápido y
  // en más cantidad, y llama refuerzos de zombies cada cierto tiempo.
  // En solitario (b.solo): dispara más rápido y con más balas, pero sin refuerzos de zombies
  // y con balas algo más lentas que en multijugador, para poder esquivarlas.
  const big = !!b.big, solo = !!b.solo;
  const fm = big ? (solo ? 0.8 : 0.75) : 1, sm = big ? (solo ? 1.05 : 1.15) : 1, xs = big ? 2 : 0;
  if (big && !solo) {
    b.summonT = (b.summonT === undefined ? 10 : b.summonT) - dt;
    if (b.summonT <= 0) {
      b.summonT = escorted ? 14 : (b.phase === 3 ? 6 : 10);
      if (level.zombies.length < 30) for (let i = 0; i < 3; i++) spawnZombie(level);
    }
  }

  b.moveT += dt;
  // esquiva errática que se intensifica al perder vida, una vez sin escoltas
  if (!escorted && b.phase >= 2) {
    const dashChance = b.phase === 3 ? 0.035 : 0.018;
    if (Math.random() < dashChance) {
      const range = b.phase === 3 ? 150 : 90;
      b.dashVX = rand(-range, range); b.dashVY = rand(-range, range); b.dashT = 0.4;
    }
  }
  if (b.dashT > 0) {
    b.dashT -= dt;
    b.x = clamp(b.x + b.dashVX * dt, 150, WORLD.w - 150);
    b.y = clamp(b.y + b.dashVY * dt, 150, WORLD.h - 150);
  } else {
    b.x += Math.sin(b.moveT * 0.6) * 30 * dt;
    b.y = clamp(b.y + 20 * dt * (dist(nearest.x, nearest.y, b.x, b.y) > 260 ? 1 : -1), 150, WORLD.h - 150);
  }
  b.angle = angleTo(b.x, b.y, nearest.x, nearest.y);
  b.cd -= dt;

  if (b.phase <= 1) {
    // ataque normal: con escoltas vivas o recién liberado, aún manejable
    const fireRate = (escorted ? 1.3 : 1.05) * fm;
    if (b.cd <= 0) {
      b.cd = fireRate;
      const a = b.angle + rand(-0.06, 0.06);
      level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 250 * sm, vy: Math.sin(a) * 250 * sm, dmg: 9, life: 2.6, targetRef: mpTargetRef(nearest) });
      if (solo) {
        // abanico ancho a los lados de la bala principal: hay huecos por donde pasar
        [-0.34, -0.17, 0.17, 0.34].forEach(off => {
          const a2 = b.angle + off;
          level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a2) * 230 * sm, vy: Math.sin(a2) * 230 * sm, dmg: 7, life: 2.6, targetRef: mpTargetRef(nearest) });
        });
      }
    }
  } else {
    // fase 2 (<=50%) y fase 3 (<=30%): patrones variados de "cualquier bala",
    // cada vez más rápidos y densos — muy difícil de esquivar y de acertarle de vuelta
    if (b.cd <= 0) {
      b.cd = (b.phase === 3 ? 0.42 : 0.68) * fm;
      const bulletSpeed = (250 + b.phase * 35) * sm;
      const pattern = randi(0, solo ? 3 : 2);
      const aimAngle = b.angle;
      if (pattern === 0) {
        const shots = (b.phase === 3 ? 5 : 3) + xs;
        for (let i = 0; i < shots; i++) {
          const a = aimAngle + rand(-0.09, 0.09);
          level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, dmg: 9, life: 2.6, targetRef: mpTargetRef(nearest) });
        }
      } else if (pattern === 1) {
        const count = (b.phase === 3 ? 9 : 6) + xs;
        const arc = 1.15;
        for (let i = 0; i < count; i++) {
          const a = aimAngle - arc / 2 + (arc / (count - 1)) * i;
          level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * bulletSpeed, vy: Math.sin(a) * bulletSpeed, dmg: 8, life: 2.6, targetRef: mpTargetRef(nearest) });
        }
      } else if (pattern === 3) {
        // doble anillo: el segundo anillo va más lento y desfasado, dejando huecos para esquivar
        const count = (b.phase === 3 ? 14 : 10) + xs;
        const off = rand(0, Math.PI * 2);
        for (let ring = 0; ring < 2; ring++) {
          for (let i = 0; i < count; i++) {
            const a = off + (Math.PI * 2 / count) * i + ring * (Math.PI / count);
            const sp = bulletSpeed * (ring ? 0.6 : 0.9);
            level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: 7, life: 3.0, targetRef: mpTargetRef(nearest) });
          }
        }
      } else {
        const count = (b.phase === 3 ? 16 : 10) + xs * 2;
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 / count) * i;
          level.enemyBullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * bulletSpeed * 0.85, vy: Math.sin(a) * bulletSpeed * 0.85, dmg: 7, life: 2.9, targetRef: mpTargetRef(nearest) });
        }
      }
    }
  }

  if (b.hp <= 0 && !b.defeated) {
    b.defeated = true;
    if (level.stage.objectiveType === 'boss') {
      level.subPhase = 'bossDefeatedCutscene';
      level.cutsceneT = 0;
      stopBossMusic();
    } else {
      spawnDeathParticles(level, b.x, b.y); // batalla definitiva: la victoria la decide updateFinalBattle
    }
  }
}

/* --------- Mini robots escoltas del jefe final (etapa 5) --------- */
function updateMiniRobots(level, dt) {
  if (!level.miniRobots || !level.miniRobots.length) return;
  const b = level.boss; if (!b) return;
  const targets = mpGetAllTargets(level);
  level.miniRobots.forEach(m => {
    if (!m.alive) return;
    m.hit = Math.max(0, m.hit - dt);
    if (!b.active || b.defeated) return; // solo entran en acción junto con el jefe, y se detienen si es derrotado
    // orbitan alrededor del jefe, siguiéndolo si se mueve
    m.orbitAngle += m.orbitSpeed * dt;
    m.x = lerp(m.x, b.x + Math.cos(m.orbitAngle) * m.orbitR, 0.15);
    m.y = lerp(m.y, b.y + Math.sin(m.orbitAngle) * m.orbitR, 0.15);
    const target = mpNearestTarget(m, targets);
    m.angle = angleTo(m.x, m.y, target.x, target.y);
    m.cd -= dt;
    const d = dist(m.x, m.y, target.x, target.y);
    if (d < 380 && m.cd <= 0) {
      m.cd = rand(1.3, 1.9);
      level.enemyBullets.push({ x: m.x, y: m.y, vx: Math.cos(m.angle) * 210, vy: Math.sin(m.angle) * 210, dmg: 6, life: 2.4, targetRef: mpTargetRef(target) });
    }
  });
  level.miniRobots.forEach(m => {
    if (m.alive && m.hp <= 0) {
      m.alive = false;
      spawnDeathParticles(level, m.x, m.y);
      GAME.run.kills++; GAME.run.totalKills++;
    }
  });
  level.miniRobots = level.miniRobots.filter(m => m.alive);
}

function updateCompanion(level, dt) {
  const c = level.companion; const p = level.player;
  const targetX = p.x - Math.cos(p.angle) * 46 - 20, targetY = p.y - Math.sin(p.angle) * 46;
  c.x = lerp(c.x, targetX, 0.08); c.y = lerp(c.y, targetY, 0.08);
  c.cd -= dt;
  const nearest = level.zombies.reduce((best, z) => {
    const d = dist(c.x, c.y, z.x, z.y);
    return d < best.d ? { z, d } : best;
  }, { z: null, d: 999999 });
  if (nearest.z) c.angle = angleTo(c.x, c.y, nearest.z.x, nearest.z.y);

  if (c.def.ability === 'spin' && c.cd <= 0) {
    c.cd = 2.2;
    level.zombies.forEach(z => { if (dist(c.x, c.y, z.x, z.y) < 90) { z.hp -= 30; z.hit = 0.12; } });
    level.particles.push({ x: c.x, y: c.y, vx: 0, vy: 0, life: 0.25, color: c.def.color, ring: true });
  }
  if (c.def.ability === 'triple' && c.cd <= 0 && nearest.z) {
    c.cd = 1.1;
    for (let i = -1; i <= 1; i++) {
      const a = c.angle + i * 0.15;
      const shot = { x: c.x, y: c.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, dmg: 14, color: c.def.color, life: 1, r: 3 };
      level.bullets.push(shot);
      mpQueueShot(level, shot);
    }
  }
  if (c.def.ability === 'heal' && c.cd <= 0) {
    c.cd = 4.5;
    if (level.vehicle) level.vehicle.hp = Math.min(level.vehicle.maxHp, level.vehicle.hp + 15);
    level.player.hp = Math.min(level.player.maxHp, level.player.hp + 15);
  }
}

/* --------- Aliados azules invocados por Tralalero Tralala (etapa 5) --------- */
const ALLY_COLOR = '#3aa0e8';
function updateAllies(level, dt) {
  const p = level.player;
  level.allies.forEach((a, i) => {
    // se mantienen repartidos alrededor del jugador cuando no hay zombies cerca
    const spreadAngle = p.angle + Math.PI + (i - 1) * 0.9;
    const targetX = p.x + Math.cos(spreadAngle) * 70, targetY = p.y + Math.sin(spreadAngle) * 70;
    a.x = lerp(a.x, targetX, 0.05); a.y = lerp(a.y, targetY, 0.05);
    a.cd -= dt;

    // buscan al zombie más cercano; el robot jefe queda siempre excluido
    let nearest = null, bestD = 999999;
    level.zombies.forEach(z => {
      const d = dist(a.x, a.y, z.x, z.y);
      if (d < bestD) { bestD = d; nearest = z; }
    });
    if (nearest) {
      a.angle = angleTo(a.x, a.y, nearest.x, nearest.y);
      if (a.cd <= 0 && bestD < 380) {
        a.cd = 0.5;
        const shot = {
          x: a.x, y: a.y, vx: Math.cos(a.angle) * 640, vy: Math.sin(a.angle) * 640,
          dmg: 16, color: ALLY_COLOR, life: 1, r: 3, allyBullet: true,
        };
        level.bullets.push(shot);
        mpQueueShot(level, shot);
      }
    }
  });
}

/* --------------------------- FIN DE ETAPA / OBJETIVOS ------------------------- */

function checkStageCompletion(level) {
  if (level.subPhase === 'bossDefeatedCutscene') { runBossCutscene(level); return; }
  if (level.subPhase !== 'play') return;
  if (level.dead) return; // eliminado: su posición está congelada, no cuenta para completar la etapa
  const stage = level.stage;
  let done = false;
  if (stage.objectiveType === 'rescue') {
    const allRescued = level.rescuedThisStage >= level.rescueTarget;
    const inSafeZone = allRescued && dist(level.player.x, level.player.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r;
    done = allRescued && inSafeZone;
  }
  // Etapa 2: cada jugador pasa a la pantalla de espera en cuanto ENTREGA a
  // SU propio familiar (sin importar si los demás ya terminaron); el juego
  // sigue corriendo para quienes aún no entregaron el suyo.
  if (stage.objectiveType === 'findNPC') {
    const myId = mpMyId();
    const mine = level.npcs.find(n => n.rescuedBy != null && n.rescuedBy === myId);
    done = mine ? !!mine.delivered : (level.npcs.length > 0 && level.npcs.every(n => n.delivered));
  }
  if (stage.objectiveType === 'airBoss') {
    // La poción es compartida: alcanza con que ALGUIEN la tenga (o, en
    // solitario, con que el único jugador la tenga) para que cada uno
    // pueda completar su parte llegando a la zona segura.
    const potionSecured = mpIsActive() ? !!level.potionHolder : level.hasPotion;
    const inSafeZone = potionSecured && dist(level.player.x, level.player.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r;
    done = !!level.airBossDone && potionSecured && inSafeZone;
  }
  if (stage.objectiveType === 'survive') {
    const killTargetReached = level.killsThisStage >= surviveGoal(stage);
    const inSafeZone = killTargetReached && dist(level.player.x, level.player.y, level.safeZone.x, level.safeZone.y) < level.safeZone.r;
    done = killTargetReached && inSafeZone;
  }
  if (stage.objectiveType === 'boss') done = level.boss && level.boss.coreDefeated;

  if (done) {
    level.subPhase = 'complete';
    if (mpIsActive()) mpMarkStageDone(); else advanceStage();
  }
}

function runBossCutscene(level) {
  level.cutsceneT += 1 / 60;
  if (level.cutsceneT > 1.6 && !level.boss.coreDefeated) {
    level.boss.coreDefeated = true;
  }
  if (level.cutsceneT > 2.4) {
    level.subPhase = 'complete';
    cancelAnimationFrame(GAME.rafId);
    buildControllerScene();
    showScreen('screen-controller-reveal');
  }
}

function advanceStage() {
  markStageCleared(STAGES[GAME.stageIndex]); // etapa superada: se desbloquea en el salto de fase
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  if (mpIsActive()) { MP.readyChoices = {}; MP.remoteStates = {}; MP._doneIds = []; } // que no queden "listos" ni eliminados de la fase anterior
  GAME.selection.vehicle = null; // que nadie arranque la fase nueva con la montura vieja
  const lv = GAME.level;
  if (mpIsActive() && lv && lv.stage.objectiveType === 'findNPC') GAME.run.rescued = lv.rescuedBase + lv.npcs.filter(n => n.found).length;
  const nextStage = STAGES[GAME.stageIndex + 1];
  const isLast = !nextStage || nextStage.hidden; // la batalla definitiva no es una etapa "siguiente" normal
  if (isLast) { return; } // el final se gestiona vía la poción
  GAME.stageIndex++;
  GAME.vehBack = false; // en las etapas siguientes no hay selección de personaje a la que volver
  openVehicleSelectForCurrentStage();
}

// Etapa 5 en multijugador: al derrotar al jefe final, TODOS los jugadores
// llegan a esta pantalla (cada uno a su propio ritmo, tras leer el papel),
// pero solo el Admin puede elegir — los demás solo ven un aviso de espera
// y su pantalla cambia sola en cuanto el Admin decide (ver mpChooseEnding
// y el manejador de 'ending').
function showPotionChoiceScreen() {
  markStageCleared(STAGES[GAME.stageIndex]);
  const isGuest = mpIsActive() && !MP.isHost;
  const btns = document.getElementById('potion-buttons');
  const waiting = document.getElementById('potion-waiting');
  const sub = document.getElementById('potion-sub');
  if (btns) btns.style.display = isGuest ? 'none' : '';
  if (waiting) waiting.style.display = isGuest ? '' : 'none';
  if (sub) sub.textContent = isGuest ? 'El zombie con lentes espera en silencio la respuesta del Admin.' : 'El zombie con lentes espera tu respuesta en silencio.';
  showScreen('screen-potion');
}

function mpChooseEnding(yes) {
  if (mpIsActive() && !MP.isHost) return; // un invitado nunca decide, aunque le llegue a tocar el botón
  if (mpIsActive() && MP.isHost) MP.conns.forEach(c => { try { c.send({ type: 'ending', yes }); } catch (e) { /* noop */ } });
  resolveEnding(yes);
}

// Final bueno (tras ganar la batalla definitiva).
function showGoodEnd() {
  cancelAnimationFrame(GAME.rafId);
  buildGoodEndScene();
  showScreen('screen-good-end');
}

// Al responder "SÍ": el zombie con lentes lanza su desafío y, a los pocos
// segundos, empieza la batalla definitiva. Cada jugador (Admin e invitados)
// ejecuta esto por su cuenta al recibir la decisión, así que el temporizador
// arranca a la vez en todos y la batalla comienza sincronizada.
function showChallengeScreen() {
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  buildChallengeScene();
  showScreen('screen-challenge');
  if (mpIsActive() && !MP.isHost) {
    // el invitado espera la señal del Admin (respaldo por si se pierde)
    setTimeout(() => { if (GAME.screen === 'screen-challenge') startFinalBattle(); }, 12000);
  } else {
    setTimeout(() => {
      if (GAME.screen !== 'screen-challenge') return;
      if (mpIsActive()) MP.conns.forEach(c => { try { c.send({ type: 'final-battle-start' }); } catch (e) { /* noop */ } });
      startFinalBattle();
    }, 6000);
  }
}

function resolveEnding(yes) {
  cancelAnimationFrame(GAME.rafId);
  if (yes) {
    // Solo multijugador: desafío del zombie con lentes + batalla definitiva.
    // En solitario el "SÍ" sigue yendo directo al final bueno.
    if (mpIsActive()) showChallengeScreen(); else showGoodEnd();
  } else if (mpIsActive()) {
    // Multijugador: el "NO" del Admin manda a TODOS a la batalla definitiva
    // (llega igual a invitados y Admin, ver mpChooseEnding y el manejador de 'ending').
    startFinalBattle();
  } else {
    buildBadEndScene();
    showScreen('screen-bad-end');
  }
}

/* ------------------- BATALLA DEFINITIVA (multijugador) --------------------- */

// Todos los jugadores conservan personaje, armas y ayudante de la etapa 5; se
// reutiliza el mismo arranque sincronizado de las etapas (pantalla de intro y
// gameplay a los ~1.8 s).
function startFinalBattle() {
  const idx = STAGES.findIndex(st => st.objectiveType === 'finalBattle');
  if (idx < 0) { buildBadEndScene(); showScreen('screen-bad-end'); return; }
  stopBossMusic();
  GAME.stageIndex = idx;
  GAME.selection.vehicle = null;
  GAME.paused = false;
  MP.readyChoices = {}; MP.stageDone = {}; MP.remoteStates = {};
  mpStartStageForAll();
}

// Repone los helicópteros comunes y decide el avance de la batalla (solo corre el Admin):
// fase 1 = helicóptero + robot; fase 2 = zombie con lentes en su nave espacial.
function updateFinalBattle(level, dt) {
  if (level.subPhase !== 'play') return;
  const D = level.diff;
  const robotDown = !!(level.boss && level.boss.defeated);
  if (level.airBossDone && robotDown && !level.ship) { spawnShip(level); return; }
  // Cuando el primer zombie con lentes llega a la mitad de su vida, aparece el segundo.
  if (level.ship && !level.ship2 && !level.ship.entering && level.ship.hp <= level.ship.maxHp * 0.5) spawnShip2(level);
  // La batalla termina cuando caen los DOS zombies con lentes.
  if (level.ship && level.ship.defeated && level.ship2 && level.ship2.defeated) { finishFinalBattle(level); return; }
  level.patrolTimer -= dt;
  if (level.patrolTimer <= 0) {
    level.patrolTimer = 7;
    const patrols = level.miniPlanes ? level.miniPlanes.filter(m => m.patrol).length : 0;
    if (patrols < D.patrols) spawnPatrolHeli(level);
  }
}

// TERCER JEFE: el zombie con lentes baja del cielo en su nave espacial, apenas
// mueren el helicóptero y el robot. Es invulnerable mientras hace su entrada.
function spawnShip(level) {
  const D = level.diff;
  level.finalPhase = 2;
  level.shakeT = 0.25;
  level.ship = {
    x: WORLD.w / 2, y: -160, hp: D.shipHp, maxHp: D.shipHp, phase: 1,
    angle: Math.PI / 2, cd: 2, moveT: 0, hit: 0, entering: true, invulnerable: true, defeated: false,
    dashT: 0, dashVX: 0, dashVY: 0, spin: 0, summonT: 8, lastPhase: 1,
  };
}

// SEGUNDO zombie con lentes: llega cuando el primero baja a la mitad de su vida.
// Entra desde el cielo por el costado (invulnerable durante la entrada) y es el
// doble de difícil (ver level.diff.ship2): doble de vida y de cadencia, más daño y velocidad.
function spawnShip2(level) {
  const D = level.diff, M = D.ship2;
  const hp = Math.round(D.shipHp * M.hp);
  level.shakeT = 0.5;
  level.ship2 = {
    x: WORLD.w * 0.2, y: -160, hp, maxHp: hp, phase: 1,
    angle: Math.PI / 2, cd: 2, moveT: 0, hit: 0, entering: true, invulnerable: true, defeated: false,
    dashT: 0, dashVX: 0, dashVY: 0, spin: 0, summonT: 8, lastPhase: 1,
  };
  for (let i = 0; i < 6; i++) spawnZombie(level); // refuerzos con su llegada
}

function updateShip(level, dt) {
  updateShipUnit(level, dt, level.ship, null);
  updateShipUnit(level, dt, level.ship2, level.diff ? level.diff.ship2 : null);
}

// mods = null para el primer zombie; para el segundo, sus multiplicadores (level.diff.ship2).
function updateShipUnit(level, dt, sh, mods) {
  if (!sh || sh.defeated) return;
  const rate = mods ? mods.rate : 1, dmgMul = mods ? mods.dmg : 1, spdMul = mods ? mods.speed : 1;
  sh.hit = Math.max(0, sh.hit - dt);
  if (sh.hp <= 0) { sh.defeated = true; spawnDeathParticles(level, sh.x, sh.y); return; }
  const targets = mpGetAllTargets(level);
  const nearest = mpNearestTarget(sh, targets);
  // entrada: desciende desde arriba del mapa (invulnerable)
  if (sh.entering) {
    sh.y += 110 * spdMul * dt;
    if (sh.y >= 340) { sh.y = 340; sh.entering = false; sh.invulnerable = false; }
    return;
  }
  const hpPct = sh.hp / sh.maxHp;
  sh.phase = hpPct <= 0.33 ? 3 : hpPct <= 0.66 ? 2 : 1;
  if (sh.phase !== sh.lastPhase) {
    // al cambiar de fase: sacude la pantalla y llama refuerzos
    sh.lastPhase = sh.phase;
    level.shakeT = 0.25;
    for (let i = 0; i < 8; i++) spawnZombie(level);
  }
  sh.moveT += dt;
  // se lanza contra los jugadores cada vez más seguido
  if (sh.dashT > 0) {
    sh.dashT -= dt;
    sh.x = clamp(sh.x + sh.dashVX * dt, 150, WORLD.w - 150);
    sh.y = clamp(sh.y + sh.dashVY * dt, 150, WORLD.h - 150);
  } else {
    const dashChance = sh.phase === 3 ? 0.03 : sh.phase === 2 ? 0.018 : 0.01;
    if (Math.random() < dashChance) {
      const a = angleTo(sh.x, sh.y, nearest.x, nearest.y) + rand(-0.6, 0.6);
      const sp = (sh.phase === 3 ? 340 : 260) * spdMul;
      sh.dashVX = Math.cos(a) * sp; sh.dashVY = Math.sin(a) * sp; sh.dashT = 0.45;
    } else {
      sh.x = clamp(sh.x + Math.sin(sh.moveT * 0.9) * 70 * dt, 150, WORLD.w - 150);
      const d = dist(nearest.x, nearest.y, sh.x, sh.y);
      sh.y = clamp(sh.y + 55 * dt * (d > 380 ? 1 : -1), 150, WORLD.h - 150);
    }
  }
  sh.angle = angleTo(sh.x, sh.y, nearest.x, nearest.y);
  sh.spin += dt * (1.2 + sh.phase * 0.6);
  sh.cd -= dt;

  // refuerzos periódicos de zombies (más seguido en las últimas fases)
  sh.summonT -= dt;
  if (sh.summonT <= 0) {
    sh.summonT = (sh.phase === 3 ? 7 : 11) / rate;
    for (let i = 0; i < 4; i++) spawnZombie(level);
  }

  if (sh.cd > 0 || level.enemyBullets.length > 260) return; // tope de balas: cuida el rendimiento de la red
  const ph = sh.phase;
  const spd = (250 + ph * 45) * spdMul;
  sh.cd = (ph === 3 ? 0.4 : ph === 2 ? 0.55 : 0.75) / rate;
  const ref = mpTargetRef(nearest);
  const shoot = (a, sp, dmg, life) => level.enemyBullets.push({ x: sh.x, y: sh.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: dmg * dmgMul, life: life || 2.8, targetRef: ref });
  const pattern = randi(0, ph === 1 ? 2 : 4);
  if (pattern === 0) {                 // ráfaga apuntada
    for (let i = 0; i < 4 + ph * 2; i++) shoot(sh.angle + rand(-0.07, 0.07), spd + i * 12, 10);
  } else if (pattern === 1) {          // abanico amplio
    const count = 7 + ph * 2, arc = 1.3;
    for (let i = 0; i < count; i++) shoot(sh.angle - arc / 2 + (arc / (count - 1)) * i, spd, 8);
  } else if (pattern === 2) {          // volley circular
    const count = 12 + ph * 4;
    for (let i = 0; i < count; i++) shoot((Math.PI * 2 / count) * i + sh.spin, spd * 0.8, 7, 3);
  } else if (pattern === 3) {          // espiral de 3 brazos
    for (let arm = 0; arm < 3; arm++) for (let k = 0; k < 4; k++) shoot(sh.spin * 2 + arm * (Math.PI * 2 / 3) + k * 0.16, spd * (0.7 + k * 0.1), 7, 3);
  } else {                             // lluvia dirigida: dos abanicos cruzados a los lados del blanco
    for (let i = 0; i < 6; i++) { shoot(sh.angle + 0.5 + i * 0.05, spd, 8); shoot(sh.angle - 0.5 - i * 0.05, spd, 8); }
  }
}

function spawnPatrolHeli(level) {
  const D = level.diff;
  if (!level.miniPlanes) level.miniPlanes = [];
  level.nextPatrolId = (level.nextPatrolId || 100) + 1;
  const edge = randi(0, 3);
  let x, y;
  if (edge === 0) { x = rand(150, WORLD.w - 150); y = 150; }
  else if (edge === 1) { x = rand(150, WORLD.w - 150); y = WORLD.h - 150; }
  else if (edge === 2) { x = 150; y = rand(150, WORLD.h - 150); }
  else { x = WORLD.w - 150; y = rand(150, WORLD.h - 150); }
  const hp = Math.round(60 * D.escortHp);
  level.miniPlanes.push({
    id: level.nextPatrolId, x, y, angle: 0, hp, maxHp: hp, patrol: true,
    vx: rand(-40, 40), vy: rand(-40, 40), cd: rand(0.5, 1.5), hit: 0, alive: true,
  });
}

// Nave destruida: el Admin avisa a todos y aparece la escena final del zombie
// con lentes junto a su nave destruida. Desde ahí cada jugador pasa al final bueno.
function finishFinalBattle(level) {
  level.subPhase = 'complete';
  if (mpIsActive() && MP.isHost) MP.conns.forEach(c => { try { c.send({ type: 'final-victory' }); } catch (e) { /* noop */ } });
  showFinalVictory();
}

function showFinalVictory() {
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  buildFinalVictoryScene();
  showScreen('screen-final-victory');
}

// Zombie con lentes (mismo diseño que en la escena del papel), reutilizable.
function drawGlassesZombie(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawZombie(ctx, 0, 0, 0, 'walker', 0);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.rect(-6.2, -16.5, 4.6, 4.6);
  ctx.rect(1.6, -16.5, 4.6, 4.6);
  ctx.moveTo(-1.6, -14.2); ctx.lineTo(1.6, -14.2);
  ctx.stroke();
  ctx.restore();
}

// Nave espacial del tercer jefe. wreck = true la dibuja inclinada, rota y humeante.
function drawShip(ctx, x, y, hpPct, hit, t, invulnerable, wreck, elite) {
  ctx.save();
  ctx.translate(x, y);
  if (wreck) ctx.rotate(-0.28);
  if (elite && !wreck) {
    // aura roja del segundo zombie con lentes
    const ap = 1 + Math.sin(Date.now() / 220) * 0.05;
    const ag = ctx.createRadialGradient(0, 0, 30, 0, 0, 96 * ap);
    ag.addColorStop(0, 'rgba(209,39,45,0.0)'); ag.addColorStop(1, 'rgba(209,39,45,0.35)');
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, 0, 96 * ap, 0, Math.PI * 2); ctx.fill();
  }
  if (invulnerable && !wreck) {
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.07;
    ctx.strokeStyle = elite ? 'rgba(255,90,90,0.65)' : 'rgba(190,120,255,0.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 78 * pulse, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 52, 62, 12, 0, 0, Math.PI * 2); ctx.fill();
  // cúpula de cristal con el zombie con lentes adentro
  ctx.fillStyle = wreck ? 'rgba(120,150,170,0.35)' : 'rgba(150,220,255,0.35)';
  ctx.beginPath(); ctx.arc(0, -8, 26, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#9fb8c8'; ctx.lineWidth = 2; ctx.stroke();
  if (!wreck) drawGlassesZombie(ctx, 0, -6, 1.15);
  // casco
  ctx.fillStyle = hit > 0 ? '#fff' : (wreck ? '#3a3d44' : (elite ? '#6a2a30' : '#585c68'));
  ctx.beginPath(); ctx.ellipse(0, 4, 66, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = wreck ? '#25272c' : (elite ? '#42181c' : '#3c3f4a');
  ctx.beginPath(); ctx.ellipse(0, 12, 50, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 4, 66, 20, 0, 0, Math.PI * 2); ctx.stroke();
  // luces (giran; en el jefe cambian de color según su vida)
  const lc = hpPct > 0.66 ? '#9dfb4c' : hpPct > 0.33 ? '#e0b13f' : '#d1272d';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 2;
    ctx.fillStyle = wreck ? '#2a2a2a' : lc;
    if (!wreck) { ctx.shadowColor = lc; ctx.shadowBlur = LOW_FX ? 0 : 10; }
    ctx.beginPath(); ctx.arc(Math.cos(a) * 50, 5 + Math.sin(a) * 9, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (wreck) {
    // grietas y chispas
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(-8, 8); ctx.lineTo(-18, 18); ctx.moveTo(24, -2); ctx.lineTo(12, 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(224,177,63,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-52, -14); ctx.moveTo(44, 2); ctx.lineTo(58, -10); ctx.stroke();
  }
  ctx.restore();
}

// Escena final: el zombie con lentes junto a su nave destruida.
function buildFinalVictoryScene() {
  const el = document.getElementById('final-victory-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#0d0c18'); g.addColorStop(1, '#1c1a14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  // estrellas
  ctx.fillStyle = 'rgba(233,230,214,0.6)';
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rand(0, 340), rand(0, 90), rand(0.4, 1.2), 0, Math.PI * 2); ctx.fill(); }
  // suelo
  ctx.fillStyle = '#15120f'; ctx.fillRect(0, 140, 340, 40);
  // humo de la nave
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = `rgba(90,90,90,${0.28 - i * 0.025})`;
    ctx.beginPath(); ctx.arc(110 + rand(-8, 8) + i * 2, 88 - i * 9, 8 + i * 2.2, 0, Math.PI * 2); ctx.fill();
  }
  drawShip(ctx, 105, 118, 0, 0, 0, false, true);
  // el zombie con lentes, de pie junto a los restos
  drawGlassesZombie(ctx, 235, 132, 2.2);
  // chispas
  ctx.fillStyle = 'rgba(224,177,63,0.6)';
  for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(rand(40, 190), rand(80, 150), rand(0.5, 1.6), 0, Math.PI * 2); ctx.fill(); }
}

// Escena del desafío: el zombie con lentes, con sus dos naves detrás y un resplandor rojo.
function buildChallengeScene() {
  const el = document.getElementById('challenge-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#1c0808'); g.addColorStop(1, '#070303');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  const rg = ctx.createRadialGradient(170, 110, 6, 170, 110, 170);
  rg.addColorStop(0, 'rgba(209,39,45,0.45)'); rg.addColorStop(1, 'rgba(209,39,45,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 340, 180);
  ctx.fillStyle = 'rgba(233,230,214,0.5)';
  for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.arc(rand(0, 340), rand(0, 70), rand(0.4, 1.1), 0, Math.PI * 2); ctx.fill(); }
  ctx.save(); ctx.scale(0.55, 0.55); drawShip(ctx, 130 / 0.55, 60 / 0.55, 1, 0, 0, false, false, false); ctx.restore();
  ctx.save(); ctx.scale(0.55, 0.55); drawShip(ctx, 210 / 0.55, 60 / 0.55, 1, 0, 0, false, false, true); ctx.restore();
  ctx.fillStyle = '#15120f'; ctx.fillRect(0, 150, 340, 30);
  drawGlassesZombie(ctx, 170, 145, 3);
}

function buildGoodEndScene() {
  const el = document.getElementById('good-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#0e1a10'); g.addColorStop(1, '#1c2f18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  for (let i = 0; i < 6; i++) drawSurvivor(ctx, 40 + i * 48, 130);
  drawScientist(ctx, 170, 90);
  ctx.fillStyle = 'rgba(157,251,76,0.5)';
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(rand(0, 340), rand(0, 180), rand(0.5, 1.8), 0, Math.PI * 2); ctx.fill(); }
}

function buildBadEndScene() {
  const el = document.getElementById('bad-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#2a0808'); g.addColorStop(1, '#050202');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  // resplandor de la explosión que arrasa el mundo
  const rg = ctx.createRadialGradient(170, 90, 8, 170, 90, 170);
  rg.addColorStop(0, 'rgba(255,150,60,0.55)');
  rg.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, 340, 180);
  ctx.strokeStyle = 'rgba(209,39,45,0.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2), len = rand(30, 85);
    ctx.beginPath(); ctx.moveTo(170, 90); ctx.lineTo(170 + Math.cos(a) * len, 90 + Math.sin(a) * len); ctx.stroke();
  }
  // el jugador ya convertido en zombie
  drawZombie(ctx, 170, 120, 0, 'walker', 0);
  ctx.fillStyle = 'rgba(209,39,45,0.3)';
  for (let i = 0; i < 5; i++) ctx.fillRect(rand(0, 320), rand(0, 160), rand(10, 60), rand(2, 6));
}

function buildControllerScene() {
  const el = document.getElementById('controller-scene');
  el.innerHTML = '';
  const cv = document.createElement('canvas'); cv.width = 340; cv.height = 180; el.appendChild(cv);
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#1a1508'); g.addColorStop(1, '#050402');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 340, 180);
  // chispas del robot destruido de fondo
  ctx.fillStyle = 'rgba(224,177,63,0.35)';
  for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.arc(rand(0, 340), rand(60, 170), rand(0.5, 2), 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = 'rgba(224,177,63,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(60, 10); ctx.moveTo(300, 30); ctx.lineTo(280, 0); ctx.stroke();
  // el zombie con lentes, en primer plano
  ctx.save();
  ctx.translate(170, 128);
  ctx.scale(2.3, 2.3);
  drawZombie(ctx, 0, 0, 0, 'walker', 0);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.rect(-6.2, -16.5, 4.6, 4.6);
  ctx.rect(1.6, -16.5, 4.6, 4.6);
  ctx.moveTo(-1.6, -14.2); ctx.lineTo(1.6, -14.2);
  ctx.stroke();
  ctx.restore();
  // el papel doblado que sostiene
  ctx.fillStyle = '#e9e6d6';
  ctx.save(); ctx.translate(198, 148); ctx.rotate(-0.15);
  ctx.fillRect(-9, -6, 18, 13);
  ctx.strokeStyle = '#9aa694'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(9, -1); ctx.stroke();
  ctx.restore();
}

/* --------------------------------- RENDER ----------------------------------- */

// En una pantalla chica (celular) el mundo se veía 1:1 en píxeles, o sea que se
// alcanzaba a ver MUCHO menos terreno que en PC (~195px hacia arriba/abajo en un
// celular apaisado), mientras los enemigos atacan desde 340-520px: todo lo que
// disparaba desde fuera de pantalla parecía quitar vida "de la nada". Acá se
// aleja la cámara en pantallas chicas para que el área visible se parezca a la de
// una PC. En PC (>= 1000x620) el zoom es 1, o sea que no cambia nada.
function getViewZoom(w, h) {
  return clamp(Math.min(w / 1000, h / 620), 0.55, 1);
}

function render() {
  const level = GAME.level;
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  ctx.save();
  let shakeX = 0, shakeY = 0;
  if (GAME.settings.shake && level.shakeT > 0) { shakeX = rand(-1, 1) * level.shakeT * 20; shakeY = rand(-1, 1) * level.shakeT * 20; }

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, level.stage.palette.ground); g.addColorStop(1, level.stage.palette.accent);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  const zoom = getViewZoom(w, h);
  const vw = w / zoom, vh = h / zoom; // tamaño del área visible, en unidades del mundo
  const camX = level.camera.x - vw / 2 + shakeX, camY = level.camera.y - vh / 2 + shakeY;
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -camY);

  drawGroundGrid(ctx, camX, camY, vw, vh);
  drawDecor(ctx, level, camX, camY, vw, vh);
  drawSafeZone(ctx, level);

  if (level.stage.resource) level.pickups.forEach(pk => { if (!pk.taken && pk.kind === 'resource') drawPickup(ctx, pk.x, pk.y, 'resource', level.stage.resource.color); });
  level.pickups.forEach(pk => { if (!pk.taken && pk.kind === 'potion') drawPickup(ctx, pk.x, pk.y, 'potion', '#9dfb4c'); });

  if (level.stage.objectiveType === 'rescue') level.survivors.forEach(s => { if (!s.rescued) drawSurvivor(ctx, s.x, s.y); });
  level.npcs.forEach(n => { if (!n.delivered) drawFamilyMember(ctx, n.x, n.y, n.kind); });

  const inView = (x, y, m) => x > camX - m && x < camX + vw + m && y > camY - m && y < camY + vh + m;
  level.zombies.forEach(z => { if (!inView(z.x, z.y, 60)) return; if (z.type === 'rider') drawRiderZombie(ctx, z.x, z.y, z.angle); else drawZombie(ctx, z.x, z.y, z.angle, z.type, z.hit); });

  if (level.heli && level.heli.active) drawHeli(ctx, level.heli.x, level.heli.y, level.time, level.heli.hit, level.heli.isBoss, level.heli.shielded);
  if (level.miniPlanes) level.miniPlanes.forEach(m => { if (m.alive && inView(m.x, m.y, 80)) drawHeli(ctx, m.x, m.y, level.time, m.hit, false); });
  if (level.boss && level.boss.active && !level.boss.defeated) drawBoss(ctx, level.boss.x, level.boss.y, level.boss.hp / level.boss.maxHp, level.boss.hit || 0, level.boss.scale || 1, level.boss.invulnerable);
  if (level.miniRobots && level.boss && level.boss.active && !level.boss.defeated) level.miniRobots.forEach(m => { if (inView(m.x, m.y, 80)) drawBoss(ctx, m.x, m.y, m.hp / m.maxHp, m.hit, level.boss.big ? 0.55 : 0.42); });
  if (level.ship && !level.ship.defeated) drawShip(ctx, level.ship.x, level.ship.y, level.ship.hp / level.ship.maxHp, level.ship.hit || 0, level.time, level.ship.invulnerable, false, false);
  if (level.ship2 && !level.ship2.defeated) drawShip(ctx, level.ship2.x, level.ship2.y, level.ship2.hp / level.ship2.maxHp, level.ship2.hit || 0, level.time, level.ship2.invulnerable, false, true);

  level.bullets.forEach(b => { if (!inView(b.x, b.y, 20)) return; ctx.fillStyle = b.color; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); });
  (level.remoteBullets || []).forEach(b => { if (!inView(b.x, b.y, 20)) return; ctx.fillStyle = b.color; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); });
  level.enemyBullets.forEach(b => { if (!inView(b.x, b.y, 20)) return; ctx.fillStyle = '#d1272d'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); });
  level.particles.forEach(p => {
    if (!inView(p.x, p.y, 100)) return;
    ctx.globalAlpha = clamp(p.life / 0.4, 0, 1);
    if (p.ring) { ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 90 * (1 - p.life / 0.25), 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
  });

  ctx.save();
  if (level.dead) ctx.globalAlpha = 0.35; // cuerpo apagado: este jugador ya fue eliminado
  if (level.vehicle) {
    const myRider = GAME.selection.character
      ? { id: GAME.selection.character.id, color: GAME.selection.character.color, accent: GAME.selection.character.accent, aimAngle: level.player.angle }
      : null;
    drawVehicle(ctx, level.vehicle.x, level.vehicle.y, level.vehicle.angle, level.vehicle.def, 1, level.vehicle.mpColor, myRider, level.vehicle.anim);
  }
  else drawHuman(ctx, level.player.x, level.player.y, level.player.angle, GAME.selection.character.color, GAME.selection.character.accent, 1, GAME.selection.character.id);
  ctx.restore();
  if (level.dead) {
    const selfPos = level.vehicle || level.player;
    ctx.save();
    ctx.fillStyle = '#d1272d';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
    ctx.fillText('☠ ELIMINADO', selfPos.x, selfPos.y - 46);
    ctx.restore();
  }

  if (mpIsActive()) mpDrawRemotePlayers(ctx);

  if (level.companion) drawCompanion(ctx, level.companion.x, level.companion.y, level.companion.def, 1.4);
  if (level.allies) level.allies.forEach(a => drawCompanion(ctx, a.x, a.y, { color: ALLY_COLOR }, 1.3));

  ctx.restore();

  if (level.stage.objectiveType === 'rescue') {
    const targets = level.survivors.filter(s => !s.rescued);
    drawOffscreenIndicators(ctx, camX, camY, w, h, targets, '#e9e6d6', 'SUPERVIVIENTE', zoom);
  }
  if (level.stage.objectiveType === 'findNPC') {
    level.npcs.forEach(n => {
      if (n.delivered) return;
      drawOffscreenIndicators(ctx, camX, camY, w, h, [n], '#e9e6d6', n.following ? n.name : `${n.name} PERDIDO/A`, zoom);
    });
  }
  if ((level.stage.objectiveType === 'airBoss' || level.stage.objectiveType === 'finalBattle') && level.heli && level.heli.active) {
    drawOffscreenIndicators(ctx, camX, camY, w, h, [level.heli], level.heli.isBoss ? '#ff5050' : '#e0b13f', level.heli.isBoss ? 'HELI JEFE' : 'HELICÓPTERO', zoom);
  }
  if (level.stage.objectiveType === 'finalBattle' && level.boss && level.boss.active && !level.boss.defeated) {
    drawOffscreenIndicators(ctx, camX, camY, w, h, [level.boss], '#ff5050', 'ROBOT JEFE', zoom);
  }
  if (level.ship && !level.ship.defeated) {
    drawOffscreenIndicators(ctx, camX, camY, w, h, [level.ship], '#c07aff', 'NAVE JEFE', zoom);
  }
  if (level.ship2 && !level.ship2.defeated) {
    drawOffscreenIndicators(ctx, camX, camY, w, h, [level.ship2], '#ff5a5a', 'NAVE ÉLITE', zoom);
  }

  drawMinimap(level);
  document.getElementById('hud-interact').classList.toggle('show', !!level.interactTarget);
}

/* Flechas en el borde de pantalla que apuntan hacia objetivos fuera de vista
   (supervivientes en la etapa 1, helicóptero en la etapa 3, etc). */
function drawOffscreenIndicators(ctx, camX, camY, w, h, targets, color, label, zoom = 1) {
  const cx = w / 2, cy = h / 2, margin = 34;
  targets.forEach(t => {
    const sx = (t.x - camX) * zoom, sy = (t.y - camY) * zoom;
    const inView = sx > margin && sx < w - margin && sy > margin && sy < h - margin;
    if (inView) return;
    const dx = sx - cx, dy = sy - cy;
    const angle = Math.atan2(dy, dx);
    const halfW = cx - margin, halfH = cy - margin;
    const ax = Math.abs(Math.cos(angle)), ay = Math.abs(Math.sin(angle));
    const scale = Math.min(ax > 1e-6 ? halfW / ax : Infinity, ay > 1e-6 ? halfH / ay : Infinity);
    const ex = cx + Math.cos(angle) * scale, ey = cy + Math.sin(angle) * scale;
    ctx.save();
    ctx.translate(ex, ey); ctx.rotate(angle);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = LOW_FX ? 0 : 8;
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -8); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    if (label) {
      ctx.fillStyle = color; ctx.font = 'bold 10px "Chakra Petch"'; ctx.textAlign = 'center';
      ctx.fillText(label, ex - Math.cos(angle) * 14, ey - Math.sin(angle) * 14 + 3);
    }
  });
}

function drawGroundGrid(ctx, camX, camY, w, h) {
  ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
  const size = 64;
  const startX = Math.floor(camX / size) * size, startY = Math.floor(camY / size) * size;
  for (let x = startX; x < camX + w + size; x += size) { ctx.beginPath(); ctx.moveTo(x, camY - size); ctx.lineTo(x, camY + h + size); ctx.stroke(); }
  for (let y = startY; y < camY + h + size; y += size) { ctx.beginPath(); ctx.moveTo(camX - size, y); ctx.lineTo(camX + w + size, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(209,39,45,0.5)'; ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, WORLD.w, WORLD.h);
}

function drawDecor(ctx, level, camX, camY, vw, vh) {
  level.decor.forEach(d => {
    if (camX !== undefined && (d.x < camX - 140 || d.x > camX + vw + 140 || d.y < camY - 140 || d.y > camY + vh + 140)) return;
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.scale(d.s, d.s);
    switch (d.kind) {
      case 'tree':
        ctx.fillStyle = '#2c1c10'; ctx.fillRect(-3, 0, 6, 14);
        ctx.fillStyle = '#274d20'; ctx.beginPath(); ctx.arc(0, -8, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1e3a18'; ctx.beginPath(); ctx.arc(-6, -4, 10, 0, Math.PI * 2); ctx.fill();
        break;
      case 'house':
        ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-22, -14, 44, 30);
        ctx.fillStyle = '#7a1418'; ctx.beginPath(); ctx.moveTo(-26, -14); ctx.lineTo(0, -34); ctx.lineTo(26, -14); ctx.fill();
        ctx.fillStyle = '#20241c'; ctx.fillRect(-6, 2, 12, 14);
        break;
      case 'road':
        ctx.fillStyle = 'rgba(90,90,90,0.25)'; ctx.fillRect(-60, -8, 120, 16);
        ctx.strokeStyle = 'rgba(220,220,180,0.3)'; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.stroke(); ctx.setLineDash([]);
        break;
      case 'rubble':
      case 'ruin':
        ctx.fillStyle = '#3a3a34'; ctx.fillRect(-14, -10, 28, 20); ctx.fillStyle = '#26261f'; ctx.fillRect(-8, -18, 12, 12);
        break;
      case 'rock':
        ctx.fillStyle = '#4a453c'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
        break;
      case 'cloud':
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.arc(-14, 0, 14, 0, Math.PI * 2); ctx.arc(6, -6, 18, 0, Math.PI * 2); ctx.arc(22, 0, 13, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  });
}

function drawSafeZone(ctx, level) {
  if (level.stage.objectiveType === 'killStreak') return; // este modo no tiene zona segura
  const s = level.safeZone;
  const pulse = 1 + Math.sin(level.time * 3) * 0.06;
  ctx.strokeStyle = 'rgba(157,251,76,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(157,251,76,0.08)'; ctx.fill();
  ctx.fillStyle = '#9dfb4c'; ctx.font = '12px "Chakra Petch"'; ctx.textAlign = 'center';
  ctx.fillText('ZONA SEGURA', s.x, s.y - s.r - 10);
}

function drawMinimap(level) {
  const cv = document.getElementById('minimap-canvas'); const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 140, 140);
  ctx.fillStyle = 'rgba(20,26,18,0.7)'; ctx.fillRect(0, 0, 140, 140);
  const sx = 140 / WORLD.w, sy = 140 / WORLD.h;
  ctx.fillStyle = '#9dfb4c';
  if (level.stage.objectiveType !== 'killStreak') { ctx.beginPath(); ctx.arc(level.safeZone.x * sx, level.safeZone.y * sy, 4, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#d1272d';
  level.zombies.forEach(z => { ctx.fillRect(z.x * sx - 1, z.y * sy - 1, 2, 2); });
  if (level.stage.objectiveType === 'rescue') { ctx.fillStyle = '#e9e6d6'; level.survivors.forEach(s => { if (!s.rescued) ctx.fillRect(s.x * sx - 1.5, s.y * sy - 1.5, 3, 3); }); }
  if (level.npcs.length) { ctx.fillStyle = '#e9e6d6'; level.npcs.forEach(n => { if (!n.delivered) ctx.fillRect(n.x * sx - 2, n.y * sy - 2, 4, 4); }); }
  if (level.heli && level.heli.active) {
    ctx.fillStyle = level.heli.isBoss ? '#ff5050' : '#e0b13f';
    const hs = level.heli.isBoss ? 3 : 2;
    ctx.beginPath(); ctx.arc(level.heli.x * sx, level.heli.y * sy, hs, 0, Math.PI * 2); ctx.fill();
  }
  if (level.miniPlanes) {
    ctx.fillStyle = '#e0b13f';
    level.miniPlanes.forEach(m => { if (m.alive) ctx.fillRect(m.x * sx - 1, m.y * sy - 1, 2, 2); });
  }
  if (level.boss && !level.boss.defeated) { ctx.fillStyle = '#ff5050'; ctx.fillRect(level.boss.x * sx - 3, level.boss.y * sy - 3, 6, 6); }
  if (level.ship && !level.ship.defeated) { ctx.fillStyle = '#c07aff'; ctx.beginPath(); ctx.arc(level.ship.x * sx, level.ship.y * sy, 4, 0, Math.PI * 2); ctx.fill(); }
  if (level.ship2 && !level.ship2.defeated) { ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(level.ship2.x * sx, level.ship2.y * sy, 5, 0, Math.PI * 2); ctx.fill(); }
  if (level.miniRobots && level.boss && level.boss.active) {
    ctx.fillStyle = '#e07a50';
    level.miniRobots.forEach(m => { ctx.fillRect(m.x * sx - 1.5, m.y * sy - 1.5, 3, 3); });
  }
  ctx.fillStyle = '#fff';
  const p = level.player; ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(157,251,76,0.4)'; ctx.strokeRect(0, 0, 140, 140);
}

/* ---------------------------------- HUD ------------------------------------- */

function updateWeaponSlotsUI() {
  const level = GAME.level; if (!level) return;
  const box = document.getElementById('weapon-slots'); box.innerHTML = '';
  level.weaponStates.forEach((ws, i) => {
    const el = document.createElement('div');
    el.className = 'weapon-slot' + (i === level.activeWeapon ? ' active' : '');
    el.innerHTML = `<span class="slot-num">${i + 1}</span>${ws.def.name}`;
    box.appendChild(el);
  });
}

function updateObjectiveUI() {
  const level = GAME.level; if (!level) return;
  document.getElementById('hud-objective').textContent = 'Objetivo: ' + level.stage.objectiveText;
}

// Barra de vida del jefe (etapa 3: helicóptero, etapa 5: jefe final).
// Se calcula acá, en updateHUD, porque esto corre en todos los jugadores;
// antes estaba dentro de updateHelis/updateBoss, que solo corre el Admin,
// y por eso los demás jugadores no veían la barra.
function updateBossHUD(level) {
  const hud = document.getElementById('hud-boss');
  if (!hud) return;
  const label = document.getElementById('hud-boss-label');
  const bar = document.getElementById('hud-boss-hp');
  const h = level.heli, b = level.boss;
  if (level.stage.objectiveType === 'finalBattle' && level.ship && level.ship2 && (!level.ship.defeated || !level.ship2.defeated)) {
    const s1 = level.ship, s2 = level.ship2;
    const pct = s => Math.max(0, Math.round(s.hp / s.maxHp * 100)) + '%';
    const t1 = s1.defeated ? 'DERROTADO' : pct(s1);
    const t2 = s2.defeated ? 'DERROTADO' : (s2.entering ? 'LLEGANDO...' : pct(s2));
    hud.classList.add('show');
    label.textContent = `ZOMBIE CON LENTES: ${t1}  ·  2º ZOMBIE (ÉLITE): ${t2}`;
    const cur = (s1.defeated ? 0 : Math.max(0, s1.hp)) + (s2.defeated ? 0 : Math.max(0, s2.hp));
    bar.style.width = clamp(cur / (s1.maxHp + s2.maxHp) * 100, 0, 100) + '%';
  } else if (level.stage.objectiveType === 'finalBattle' && level.ship && !level.ship.defeated) {
    const sh = level.ship;
    hud.classList.add('show');
    label.textContent = sh.entering
      ? 'EL ZOMBIE CON LENTES DESCIENDE EN SU NAVE...'
      : (sh.phase === 3 ? 'ZOMBIE CON LENTES — NAVE (FURIA TOTAL)' : sh.phase === 2 ? 'ZOMBIE CON LENTES — NAVE (ALERTA)' : 'ZOMBIE CON LENTES — NAVE ESPACIAL');
    bar.style.width = clamp(sh.hp / sh.maxHp * 100, 0, 100) + '%';
  } else if (level.stage.objectiveType === 'finalBattle') {
    const D = level.diff;
    const heliUp = !!(h && h.isBoss && h.hp > 0 && !level.airBossDone);
    const robotUp = !!(b && !b.defeated);
    if (!heliUp && !robotUp) { hud.classList.remove('show'); return; }
    hud.classList.add('show');
    const heliTxt = heliUp ? (h.shielded ? 'ESCUDO ACTIVO' : Math.max(0, Math.round(h.hp / h.maxHp * 100)) + '%') : 'DERROTADO';
    const escorted = !!(level.miniRobots && level.miniRobots.length > 0);
    const robotTxt = robotUp ? (escorted ? 'PROTEGIDO' : Math.max(0, Math.round(b.hp / b.maxHp * 100)) + '%') : 'DERROTADO';
    label.textContent = `HELICÓPTERO: ${heliTxt}  ·  ROBOT: ${robotTxt}`;
    const total = (1300 + 1500) * D.bossHp;
    const cur = (heliUp ? h.hp : 0) + (robotUp ? b.hp : 0);
    bar.style.width = clamp(cur / total * 100, 0, 100) + '%';
  } else if (level.stage.objectiveType === 'airBoss' && h && h.isBoss) {
    hud.classList.add('show');
    label.textContent = h.shielded
      ? 'HELICÓPTERO PRINCIPAL — ESCUDO ACTIVO (elimina a los mini aviones)'
      : (h.hp <= h.maxHp * 0.5 ? 'HELICÓPTERO PRINCIPAL — BLINDAJE REFORZADO' : 'HELICÓPTERO PRINCIPAL');
    bar.style.width = clamp(h.hp / h.maxHp * 100, 0, 100) + '%';
  } else if (level.stage.objectiveType === 'boss' && b && b.active && !b.defeated) {
    hud.classList.add('show');
    const escorted = !!(level.miniRobots && level.miniRobots.length > 0);
    const hpPct = b.hp / b.maxHp;
    const phase = !escorted && hpPct <= 0.3 ? 3 : !escorted && hpPct <= 0.5 ? 2 : 1;
    label.textContent = escorted
      ? 'JEFE: PROTEGIDO — ELIMINA A SUS ESCOLTAS'
      : phase === 3 ? `JEFE: ZOMBIE ROBÓTICO${b.big ? ' GIGANTE' : ''} (FURIA)` : phase === 2 ? `JEFE: ZOMBIE ROBÓTICO${b.big ? ' GIGANTE' : ''} (ALERTA)` : `JEFE: ZOMBIE ROBÓTICO${b.big ? ' GIGANTE' : ''}`;
    bar.style.width = clamp(hpPct * 100, 0, 100) + '%';
  } else {
    hud.classList.remove('show');
  }
}

function updateHUD(level) {
  updateBossHUD(level);
  if (mpSpectating(level)) mpUpdateSpectateUI(level);
  document.getElementById('hud-player-hp').style.width = clamp(level.player.hp / level.player.maxHp * 100, 0, 100) + '%';
  const vBlock = document.getElementById('hud-vehicle-block');
  if (level.vehicle) {
    document.getElementById('hud-vehicle-label').textContent = level.vehicle.def.name;
    document.getElementById('hud-vehicle-hp').style.width = clamp(level.vehicle.hp / level.vehicle.maxHp * 100, 0, 100) + '%';
  }
  document.getElementById('hud-rescued').textContent = (mpIsActive() && level.stage.objectiveType === 'findNPC')
    ? level.rescuedBase + level.npcs.filter(n => n.found).length
    : GAME.run.rescued;
  document.getElementById('hud-kills').textContent = GAME.run.totalKills;

  const ws = level.weaponStates[level.activeWeapon];
  if (ws) document.getElementById('hud-ammo').textContent = `MUN: ${ws.ammo}/${ws.def.maxAmmo}`;
  updateWeaponSlotsUI();

  const inv = document.getElementById('inv-items'); inv.innerHTML = '';
  if (level.stage.objectiveType === 'rescue') { const el = document.createElement('div'); el.className = 'inv-item'; el.textContent = `${level.rescuedThisStage}/${level.rescueTarget}`; inv.appendChild(el); }
  if (level.hasPotion) { const el = document.createElement('div'); el.className = 'inv-item'; el.textContent = '🧪'; inv.appendChild(el); }

  if (level.stage.objectiveType === 'killStreak') {
    if (level._best === undefined) level._best = killStreakBest();
    const secs = Math.floor(level.time), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
    if (mpIsActive()) {
      const mine = (level.killsBy && level.killsBy[mpMyId()]) || 0;
      level._mineKills = mine;
      document.getElementById('hud-objective').textContent =
        `RECOLECCIÓN DE BAJAS (${killDiffCfg(level).label}) — Tus bajas: ${mine}  ·  Equipo: ${level.killsThisStage}  ·  Tiempo: ${mm}:${ss}  ·  Tu mejor: ${Math.max(level._best, mine)}`;
    } else {
      document.getElementById('hud-objective').textContent =
        `RECOLECCIÓN DE BAJAS (${killDiffCfg(level).label}) — Bajas: ${level.killsThisStage}  ·  Tiempo: ${mm}:${ss}  ·  Mejor: ${Math.max(level._best, level.killsThisStage)}`;
    }
  } else if (level.stage.objectiveType === 'survive') {
    const goal = surviveGoal(level.stage);
    const pct = Math.min(100, Math.round(level.killsThisStage / goal * 100));
    document.getElementById('hud-objective').textContent = level.killsThisStage >= goal
      ? '¡Objetivo cumplido! Ve a la zona segura'
      : `ZOMBIES ELIMINADOS: ${level.killsThisStage}/${goal}  ·  ${pct}%`;
  } else if (level.stage.objectiveType === 'rescue') {
    document.getElementById('hud-objective').textContent = level.rescuedThisStage >= level.rescueTarget
      ? 'Todos rescatados. ¡Ve a la zona segura!'
      : `Rescatados: ${level.rescuedThisStage}/${level.rescueTarget}`;
  } else if (level.stage.objectiveType === 'findNPC') {
    const total = level.npcs.length;
    const delivered = level.npcs.filter(n => n.delivered).length;
    const rescued = level.npcs.filter(n => n.found).length;
    const mine = level.npcs.find(n => n.rescuedBy === mpMyId());
    let text;
    if (total > 0 && delivered >= total) text = 'Familia a salvo. ¡Ve a la zona segura!';
    else if (mine && !mine.delivered) text = `Escolta a ${mine.name} a la zona segura (${rescued}/${total} rescatados · ${delivered} a salvo)`;
    else if (mine && mine.delivered) text = `Esperando al resto del equipo (${rescued}/${total} rescatados · ${delivered} a salvo)`;
    else {
      const pending = level.npcs.filter(n => !n.found).map(n => n.name).join(', ');
      text = total > 1 ? `Rescata a un familiar — faltan: ${pending} (${rescued}/${total} rescatados · ${delivered} a salvo)` : 'Encuentra al científico';
    }
    document.getElementById('hud-objective').textContent = text;
  } else if (level.stage.objectiveType === 'airBoss') {
    let text;
    if (level.hasPotion) text = '¡Ve a la zona segura!';
    else if (level.potionHolder) text = 'Otro jugador tiene la poción. ¡Ve a la zona segura!';
    else if (level.airBossDone) {
      const eligible = !mpIsActive() || !level.potionEligible || level.potionEligible.includes(mpMyId());
      text = eligible ? 'Presiona E para recoger la poción' : 'Solo el jugador con más vida puede recoger la poción';
    } else text = 'Sobrevive y derrota al helicóptero principal';
    document.getElementById('hud-objective').textContent = text;
  } else if (level.stage.objectiveType === 'boss') {
    document.getElementById('hud-objective').textContent = level.boss.active ? 'Derrota al jefe final' : 'Avanza hacia el norte del mapa';
  } else if (level.stage.objectiveType === 'finalBattle') {
    const bossesDown = (level.airBossDone ? 1 : 0) + (level.boss && level.boss.defeated ? 1 : 0);
    document.getElementById('hud-objective').textContent = level.ship2
      ? 'BATALLA DEFINITIVA — ¡Un segundo zombie con lentes, el doble de difícil! Derrota a los dos'
      : level.ship
      ? 'BATALLA DEFINITIVA — Derrota al zombie con lentes en su nave espacial'
      : `BATALLA DEFINITIVA — Jefes derrotados: ${bossesDown}/2 (helicóptero y robot); luego aparece el jefe final`;
  }
}

/* ------------------------------------ INIT ----------------------------------- */

function requestGameFullscreen(force) {
  // Solo en celulares/tablets: en desktop no forzamos pantalla completa.
  const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!isTouchDevice && !force) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
    try { req.call(el).catch(() => {}); } catch (err) { /* el navegador puede rechazarlo, no pasa nada */ }
  }
}

function setRealViewportHeight() {
  // En móviles, la barra de direcciones aparece/desaparece y 100vh no
  // refleja el alto real visible. window.innerHeight sí, así que lo usamos
  // para fijar --app-height y que el juego ocupe toda la pantalla real.
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
}

document.addEventListener('DOMContentLoaded', () => {
  setRealViewportHeight();
  window.addEventListener('resize', setRealViewportHeight);
  window.addEventListener('orientationchange', () => setTimeout(setRealViewportHeight, 100));
  document.addEventListener('fullscreenchange', () => setTimeout(setRealViewportHeight, 100));
  bindMenuActions();
  setupInput();
  showScreen('screen-menu');
  // Los navegadores bloquean el autoplay de audio hasta el primer toque/click
  // del usuario; si la música del menú no pudo arrancar sola al cargar la
  // página, la reintentamos en cuanto haya cualquier primera interacción.
  const unlockMenuMusic = () => {
    if (GAME.screen === 'screen-menu') startMenuMusic();
    window.removeEventListener('pointerdown', unlockMenuMusic);
    window.removeEventListener('keydown', unlockMenuMusic);
  };
  window.addEventListener('pointerdown', unlockMenuMusic, { once: true });
  window.addEventListener('keydown', unlockMenuMusic, { once: true });
});
