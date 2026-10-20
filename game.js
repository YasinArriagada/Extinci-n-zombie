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
    { id: 'parasaurolophus', name: 'PARASAUROLOPHUS', hp: 270, speed: 140, desc: 'Lento pero muy resistente.', kind: 'dino', pal: ['#4a6b6b', '#2c4141'] },
  ],
  tank: [
    { id: 'beute', name: 'BEUTEPANZER', hp: 260, speed: 118, desc: 'Blindaje capturado, versátil.', kind: 'tank', pal: ['#4a4f3f', '#2c2f26'] },
    { id: 'tiger', name: 'TIGER I',     hp: 340, speed: 95,  desc: 'Blindaje pesado, muy lento.', kind: 'tank', pal: ['#514a3a', '#332e24'] },
    { id: 'kv1',   name: 'KV-1',        hp: 300, speed: 105, desc: 'Sólido todoterreno soviético.', kind: 'tank', pal: ['#41493f', '#262c24'] },
    { id: 'pershing', name: 'M26 PERSHING', hp: 320, speed: 108, desc: 'Cañón potente, medio estadounidense.', kind: 'tank', pal: ['#5a5d3a', '#33351f'] },
    { id: 'chihe',    name: 'TYPE 1 CHI-HE', hp: 230, speed: 128, desc: 'Ágil y ligero, medio japonés.', kind: 'tank', pal: ['#5b6240', '#343a24'] },
    { id: 'p26',      name: 'P26/40',        hp: 285, speed: 112, desc: 'Robusto carro armado italiano.', kind: 'tank', pal: ['#5a4f35', '#352d1e'] },
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
    const timg = v.kind === 'tank' ? TANK_IMG[v.id] : null; // los tanques se muestran con su ilustración
    card.innerHTML = `${timg ? `<img class="pick-card-tank" src="${timg}" alt="${v.name}" draggable="false">` : '<canvas class="pick-card-canvas" width="180" height="100"></canvas>'}
      <div class="pick-card-name">${v.name}</div>
      <div class="pick-card-desc">${v.desc}<br>Vida ${v.hp} · Vel ${v.speed}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    if (cv) {
      const paintCard = () => drawPreview(cv, c => drawVehicle(c, 90, 55, 0, v, 1.15));
      paintCard(); DINO_REPAINT.add(paintCard);
    }
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
// Ilustraciones de los tanques para la selección (WebP con transparencia, incrustadas en el código).

const TANK_IMG = {
  beute: 'data:image/webp;base64,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',
  tiger: 'data:image/webp;base64,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',
  kv1: 'data:image/webp;base64,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',
  pershing: 'data:image/webp;base64,UklGRgJlAABXRUJQVlA4WAoAAAAQAAAANQEA5AAAQUxQSO4TAAAB/yckSPD/eGtEpO4TENs2kiRZ7t69Z3z5B7zV7yUQ0f8J0Dqllltgy/O91IDe5/wBCzblhPJQ65lKBUWSiefxBKtzwA4X6xsA72BHfrbYa/Z/ejaAlxqoLgSCsHcq4eygHesSrXE+UrsCui6x7Cv+bvE1vkbX9H6DLNHPNVkJx1uTf1IueCrJ15f8qpIpIB8Zfsl+FySQzAQyw1DQto2U8Ke9/w5AREwAD+sJedsrqRo4JxJL29KuV77rgDOvemXXK//1yn/9zH8VMB6z3xPBORHEFBjCJtjj//+c3Oj1/nxnd+MqRm3rrmZ6Nc62bdu2bdtOardp09RGfGlzGyc7v+/7j5md7A5++/szIibAT23brm3bthVTg7AFAr03fyh6e9vdALa3RjZq62IIABExAZTdcSfO0q+3cPzU/a65nKpUTPzZhXD9mv5jJ7L5X69dJlcaIbBNKp70e4MAsvTuT6SiypBpDFLx2i/kGtmEqOuDH4sqQtFM9f33mzH1n/euA170/SLRvEhv+2x/K0lVQYsHXbYz1O9+9X0D9be8LkcL33r3Y7QcKTT2k6effPCkG4YUWy96UT2cqG8IptD6/Z9cU/OU9Qan03cBiDFfKub/l2EtsIPR9cM/e/XjdqYCOHVBlpoEjUMv5JZi3rMplr7679HzAjXY7lWnLUC0czba7Z0n0+tV4AYgkQH3noV1KdoooMh99PoonnXuf/rHbdi05JENNI3cW8Tkfx0LhaJtAEUG9bTYNvddPAEmsXnp0iv+fdv6ietzMkg9A3n38w44a2/aXD3O7PIlhpJBAfDg4JQH3riExkjqEcgw55S93tfXVu5x7Pop8gACbJMAHv3VLwdj8lQghXoCIQp2uHeq1Ua1nmZiJkUfLdrgBEOqPfjHZ4wHknoBkJh3x0Ah8HV9BbMcUTadE00Xf+/axVsL9YYM/PhpNAbteS+pAAHuOdYda0cGDNghuOp7E+iRuf+MXU+Lpf5PdlvUoiEDIbnoJY5Nv8AjNGx2gtcfi3rCk9+K9hjKAOP1tNmfAJRMUs/47uo0SkA2uxeEeoICO3HZ7+XRC570qz7jfSbN2/Kv2zbc8ycalaInrPq1TBuaVTczpOgBzeN/79gmj5rY++m0/J3bxm08aSYQ3U+1DQXtGdx3+u7k3qEB2tK5QYgMIcAr/vHBPVDX81e2hdsDcc53P3hw77DdFkoNwxcNth96Bep27L5a7YIzO5+/AymF1ANQX1uMpHN9m1fujLrdnCmmfT3U/88L6gByN5OEa49cfaI7AsjcftymYdTEXei147LaB+yblvz1aq90LeeupWxj1t1E58SNRxPRpGuf9WISbf+/+MXrQJHdnayjdjt02+It+6NOsdZ/6ecggsMXZvLA5e+Vu83au8ltlh2CBd+/9j4g3H0iz/v+ZOgHiE5p3Pjro1Gw99Z+YIHoutd9CbcZYBDrFnxt0VpI6jCllKIlJb+InE2A6Fzn5MHDSJr4wDzntM7qOrqXaD8gE/Dg0ss+A6FOChpDw4QYYnymJjreW/11aszfGOQ0s29I3cYyHeqcgCtPnw2R1CmCU57y1INodebh45bRHYt8DeyzylbKx334XV0HqVOAbJJXv2UHIEVHBAf/0/a6j0+SAHHKv1YARHfw9QPMtwXmCLqublhC7hggS9x37S8u3ogiu92Up36DDDu8duJ7wiiP+yLYEl1R7DX3QVs0blHXiTU/ljsJ7IC7f/erxRDKbqsoXs/QAGQ/+/KlsnzktkJJdM1YX6wXTQt3HbRwfXJHQXaIzZf99i+rIIXaRqneP981IDxjj2siRz6XIuiifc9eejjN5/RvU5cptOinRdFhQHaClf/45dXrIUV7KBcUEzGNNqbO6XRTMeELNE/5mG++gm4r7kq1zgNnBdzzr2MSRFIbeOJpT5i0BjVRrejz9IM3EF0EyBANiBcd6ugymR9/9sFc5PpmgHOI+vXvnQekGKXQvj+gsUnw6fn16Mug7hK06PGoy5i1b3tfJNa3A7Jtr/7eWRNASSOhiIbo4/XURYjmu+2E6Ooy3Telm1be/v9f/W5joc6CXNRt3/Khw4FI2g4lIFIkGHdoTkGLNgh1MVxLSV0G2Hfp1klffCGNVodhH1e2LPzZJcshObcgk/blDuCIdxy8BdFq0d2tc/8BJLK7C0Q++vJf/FNHviXZltRR+FiC1X/97aWbIDk3kXd8yTMO0o/++sjcb86jx+b4098m3LtwM6i7hMFHLx6C836wSwCFpOGcLaQsHGoXnBVwy5/+fg0onJHn/OUIGus1CkVvaX7LX6+4eIu6SqNMIobe/6E7H+07ZDxYzXLQqc4h8qV/+sfdkFD+wfOHksghI3puNiG44okpdRvCJrTv3866R0dc+NR9+iEDTv7VI/37HxT//u/6Xd85q4hQ2wDZCQavvPnbD8FedyQJwKJHZ7v2eohu07w25yGAift87wgEcPU7LwOmaTVw9j8AsuxQe4AzCVb86e8rH/9V3KSX24Mf2ZvoSo2Ssi/488Y3LeeF6eVrEmQTAl6zq148OQEUKNoCcCZRHv2/M0hdKTJAMPne/z4LIpMKQJjm33npRy6fdvY5U8FZ6isAzqGS4CGvPYnoRg/lY1Y/LP+ieTZFPvJZbwb2fdbU+QcAhaR2AKscoEh3Hj9od61hM68rcIYJF7xoxyP7oFC0RYms1z731shdLGxGVMpAiALisHPPP7Ifq1TZG469hx4u2RAHn/rWeUWUKXI85fcoqVcBkgo49m87A8bZ5cj85/qLgdS7ACnq++3/VbJQKFtS6Wnc+Jd37ET0MiAyHzWw8sFVARSK0pNzzb77xUg9jb58up537NlHHXr4U+afswdQKMoNuF6330L0Nnnys79b0HTKURecdSBQSCozoFCceoXUy5omMoQzTDjmgrMOBApFqaFe++7LINTLFAXNFRQw/vjnn7gnuNzkuPONdwPRw7ZTQQGTj7rg7APLTeP6fz1+AJUEQOEM48/5Ci41Rh5afDpRGgCF6lxXcsCF/dgxRIkAUbua0mtv8z+lUhF5xk2o/OS88UCiTMiHUX5AecLJqEzAQWRK8Xy5TJgTcBkSR03OKg8qJuxOKRZzdqdMeFatJOX+Q8rFntkqQ5hZlEntTqYkH4jLgzkal6UZJSLlZz8rp3IUnLyfoyxkXjbZlOVJO1AWZSZYpSnn0gBkUZLNikdweSjTG9dRHqfvhkpTRGkQc3ehghV79GeVJpcHOBxTmmsqEWtQWTIPbpFLwyOU6OV1URoH6ypPd1IazP2bcUkKbqY0mkcfU0nKrF1ELg1a9+aHXC87YxP6+vJwWcDp959PNRfZZYaA4scflSmPivT0l50MFITKSdbQhiU/eenjKJ8696wz9gtwkcuFbch9C16/uQ+QSoZSYXba8+TzDpmewqUhQ9D0jovugUhBuVRk03z24R+6Ri4JFjC4dPUduvMPjySLshkZJsbu42PtXcAHL7pVuQxkp68vnLD8vpVbACJTOuVprzlqn77ZA6z/7rsKDaz+GS4BSnzm7TRN4EzpjHzEjw5h2M++ra9gkFK4/IufiTC2KaVRu+rooRBCOccLflo/5wJUAnZasChsSmeIbCSl4qXUx9PcWnHFzvMpgTkWnJnqplQqMhgQBnieg9bt6H1F+tYrUVD0NjVouKaHTdt262P07XPgfvkBWnYmUQJz/OsjDz8CoVZs94LQMBncQDSkvmLSm4/J6YRJ3H9XnnngeAKilTK5evGiK/5K64nsbidanjAlS7sgJOCXzwCwaMwmRHn98MUTDhmfBdZtNz4AKHI3Exy708SNOnx80X/YwNDcmQU88iwSnPv+nV4rixDZSKK8OrtGy4M3XXz1LatA3Sw+WQTb6y0nwjtsyrQt8jAKYNXVC39IUqToSonznI3IzSSg8Mp/X1l4SKlEbaczIfjPjjStqfvAhc59QDS7tyj/zrnvo1/v17yHH4JkZLuLmMmMqLOkkgfkvE7aYd0V1/70ARrD7hpQpBEZay5+x121fR54cAs1A9ldIRjLuiGTGIzJGx/+23u20RihDpPEtjSWGdYICxYs7s9x02/XQeokRd0FezAmNrKdaLzmdbuD1DFyHrf/AeNXE2Oh5jkLFEP/X/hEUIdE3vGdTxgC0NipeQ7bXw3UGcQxQCYYe89FZlyKThCIeigxJpcis2aoExo1wFg+NnyfaCsh6GPMn+M7d6c2kYTJFEyZVQXc9HbUDqGCxgnMnrIEj/kca59MjF4qYML+B+yzf99B6c9PJhj7qThj9IQ59oUnHJBoFKICzH4xaZTCXPixFx8M2aCqQKwdNWY/5fQ+CklUh06DDxOjYg44jlxEUClay0GjIDhyV3ISFaO5S8GoThggqB7Fj0ijQyGqx1xbskoaMauhinRseh81RnGosnjwbuopNFK31VVN5Ljv7M31VRDY22XuWBuuJqAY1KY//PS+NZDydjgeuRNTaW577PffuWMrrVubb6DKNOQE2+784o9bg1uoPE1O8LuBVswlqyJXHYDtlKRhHA9dJVON1lm+UW4wvpTK1FH8CDVI05fnXJVweiJNE+92ncpUnDNQCMSkO3JRofjgo4hmRZWSa+fTmHiXt9lVCeLcgQKQJv/NokLZby8axaRvPrq1OsnjjmuCYM83kysSzDOjCepb/jCVabDvLc1Itb7qRJ6wabj63rgqwdSGO+wYKlMXfSubJM64/nxSVaJa8YsGqX9hX0FFaj38zR/ThHSDVZXkuOUjDMPlojKNrTc1C07ZaFUlwV67FGqifZeI6rSvRvPEp8nVSfZw6QtUqDWG4yvVifKOn+h3Q7Dvw46qBPGUqcP83FnVifuOAEicsrVIVKh9BqR0netUqnUA1d52Z+EKJXNkA8EXXVQoMKdZumhpzdWJ8qImBMduxVWJ4///GEa7D4nqNZi7kcpUeccLmxH8mVyV4HjSMNlClbptGNZVKOKfLdxWnTg2/reFtaSqBDYNDvOLhad+kVyV9I0fhvqll1HFKu2Aq5HMbx6KRxSrSdUIXkorirNXFNlViPYhPwEscr0CcSz/AdvZ/888VH1k/Xxhys/Bn119BNcH2//GDVWH9b8rsrePv1FUGwX3rCCPwCupOAuGzEj+f3bl0R9oBODlUWlQ+DmkEeGlqjJc/+IcaWSYU2FYG6cSjPD5S11ZZH4zEIz4X+dWFNb6Z01AI8d7VVVs3I9gNDfnSiJz74nSqDCp7grC+sj7E6P8gQ9aFYPZus/UrNHi1dPgg1WC3L/XGtOe5/+lQoj8uFsTag9mVQgw/c1UsXf91u308orATNqb1E68vBLIEVdS0N7frgDMz+uYdp/1rQvGeMpTtvmW539r9pgu3UDHfuCD2NIY7RV08KxvHTWb7r3i5ptH7F1lYDadqSaI6Ycfi+Clsztv5eLFrS1evIqRn/G5s3rfB9qsOwFqgmjQuS85r5NW3fLzJatRa6M9/xMzepuPpH07EARqEEgIIZj1QsRFTySK3pT0t9vWSIg2v2R6byqa5EW0a87QEkJCSE3URMilLoXuLlen3pGqKwgEai+u7UEFCmD5okVSe2RRQhC5DZGHWSVnqq7LJXpNN52+/IJeYpRBNVZ8f8lDt9fSf1JfoJWIIjkjyHK21solgm46vR65XDf6cke/t0dsJFi9eHH+9bIpkydOGD9ARZ9VRKUkRBZaq7XWcq4KIpfrRq+RzsslX/9nXeuDjIzE//7+D1YsWaJ5c5k1Y7yxcUr6HEq3IkKrtZxrOdeikjOdl0teD+Wqb/Law7rSyKN334Wx//lvf/3rzAcfNB0MBmNXmE8N5XLp0qGFtazlXGutLZcglKveRKRSvuNXu8zaBZ6Zv/93ENvO+S9/+K21AMs0mGwk6DNErk6Vs2lhra215lz2iEilvDFuJH2Hz3eVxZfejPdhM5hMttfCZGQabWPLzKeGlOsGQXOuNc3DMZQzbiS94TYi33JKxw1e5eGuHLTxZh45u7WcMoCBJrPZ9D6hlEpozbkwpt15oOM2Iu/NmfvartNvv/p2WsA0eMKNwtIoy4Bxiz47SkFozjUPpz1gtCfO3Pbakx3fcP4ZLQyNzrply4bZzbXraL2Rx00etg4Ng83GpzW5Dc3T65jmycyrD96e7/sJcLO8ed2yZU2WLV3Pdns7yJ7QdCxPN8zttFFadjes59qR9cz0rt6Fvst8i+b70LV9y5auZyT3rumZZUd7bqG7rFEyNhsM66blYdYTsZ6Ljjd2k/s6YKT9YDR6+24Nbm2xJ5Z5uHazEJQio7rNZrPNsNahIbI8DtrRXZLegm46ftg5zQgbY3y3o8EesIyhOddCKqXwaLDZfGwzDJaztSwPu2sd06GUN3aXpB9mWG7mEcDGbjIda3e7Y1lrzgUh1aUUHo3NfOy0zbmsobVaazmbPMxE5dIb6KaUH7ZhTcxImoydmew4pznXWltraFnOuqlLPns2Hz7swwxraE1rztZaq7UWJrSrSu96+NNg2CNlbDt7mLDW2lprzdma1tBCcuVyKXl0JNjMMaytNWdrztaogixny7tDFtQ1dizDvHvNuQzN2ZqzNWdrtdAh3Sqjuz2ymWFMw1pjrTVnLpFBi6bptYUWZF2DwRrWa9M01iBDa87WWrQWmghJqcgXDGNszJxjWbOsNVqjhA4NWV7OfctPvOZ+r7AMzTlZi9ZoLUvLImeiiNS+AJEZ5hysrWFa01grkd3Iu28y+ZknO94/t5mWtWhaE1otyBlSNF82hrU1mMYyD9cySuju/Tc0aOoa06D5mpM1yVoeZtEErRbydlZQOCDuUAAA8NUAnQEqNgHlAD4pEIdCIaEK9NcgDAFCWdu/Hx7ABlfoV+m6YGffPOa32b5+8/evF+B6kPj/7l5gfvn7F5y/8B/6/a/+o/VZ/pnnY+xDzgfsV+6HvKf5j2If4z1Uv8j/gP//2S3o4/tL6zX/G9oL+1f7r93PZ6/+2cb/yP8G++v+o/ih5k/jPxz9s/u/93/1v97/cL3L/8/9QPF7wl/vP1O9i/5z9I/1H6sf9j/Hepf+4/VTy194Wod+bfw3/P/qv/yv71+5/1O+G/9v9MO9X0L+cf4D80vga95vhn+s/Un/q/3/94fUv/2P1c9k/rJ/ufcN/qH8J/2v6k/97/J///6e/iH/v/WHzffAPYQ/rv8Q/6X6k/+L/P///7Xvwn/0f+H+i/+3/d///3rflP9h/5H5rf237IP6J/C/91/wv6f/3P8d////H9mf/x/+Pwp/ZL2m/0l/2v+0/cn9/0RD1ZCp6Ei2gAln2SF2ZigDyo99Dopr2fFWQ/q0pgVaqc7oFivG47vW4ZCCRfAah38+jG669dkgs6GFtS8IZ4BIb4ZQ66ktualXpKhSY4q2OnlnfN6/k3YmRtX+wwVm3oPIYu3fG5zcunuPvbMQuMedAunrcU9+6AkL0HwUsTrigR6G810sl7z/0TJs17QPtPAw/b56Pddm4ni/ZyYc+4sUZ4jpK5lbfkawcOA07jsjvMjXSNr2GC3HVU+Td8j3TovEdEBs6zxg9uq0XEet6DguBX+W4Gjtxz3I+u9PbMg89U6uG2A81nHa9+wC5oYC+dt94O/PlqPZJ7a2kGx2HtsAfUgwszEoiG3yQUfSLsrbzs8r57lTNtGIEDin0kGP5ot1KAfC+TKb9QZnJWEp6Kq4y73m/cn2NnditNp1iDYDJE1pprWo8BiWLXmdLKG2DfFkLPUu+wk+5Axtm9Vc774eunkcDCJa18etGd79J/biU8Mx+gv8twMdMgSTJABpxL3rkNJoJ5Cr04khTMVeTszqX5Lny0Fmy4Siq0oWeKJEopO1+Zm+mjRFMLDg4IaO7CJt1i5xF7Q7SGWH13WQrLCVsFw3NV86DFLzHP96xXFUDCFDfpwHxODFXnZiFBZLp3jG+pzb2SU/5+bE6OFl2B5TW3R2ydCvn7+oVqKSV5rdaQAw+djZ40HdXmqAFeVY0f3fbsC3mt5nfyFuiQai41nJunmVwD0SOgPxVv7wiWmZ5HpLYeYpsNNaRAEoYTLTcrneKU5QHLlARYHCq6jrxUlwbdrc4ul1o8LdqVH1pUiGIILfd2A6xiks8zqscP/UzsGOfIl4fsv8DLAuaMEi8szxV9TgZr/VzbqlwZIdbyRvI4lOB7SKSnsRlSATgk0GnSbMmdNfKZe0np+McK8HU0u23/NNhFpjaHiv63RwSkbyMBAEF24DfpjEpKOq+2GKmDNPHd9GmaH7t4HARIPkbrFqKdfRx6pwiyM8/WwJ5Urv0oul8+n/EQt5i2rOo4Oah08hA2o7O1RFdeTLs/+JII2tsoqC5nkcIPu1pBEQcNuC6uSY2R9QtkvmMkcd6GdHpDzufBNN3RvZa+s8nQegPdop/EeZqPnnjdmVOpr6JpU5muPFlFuA6UKUj2FK325UQ/n/4k92U2p42aM2JwJ6z4SLH/FO3Yl7Z0dvGAUJmQrKbYgyiCvQaWKozIWzsPX3ac1+ia+91QhIKV5HCyZA77dxQnzwq/0BBH0TMC3iosNBhWk40iaOU5na5auK8XjqXn06tww/s3mWTlBPRw32DcdGxgYm3JOpkit1xZE7/w/5ga+TXuGnMnKe3sOv6Ise5lsPXe7cDN7W0ZThzVCyrqCXO12hOxvZ/6MKZq/CSy7hWfm5zK+Ze7HBvmPschU174yzG2kXM25N2ZWz5cdJgmB5NO1JAqWB/gsGCIpLAGuVpMV5oYL826A8wZF4yGhrSWKGfZxweuIxoTth3ZLKQb2Nepu7GXtL9Itbf9yFImKhCMpAKlxkZk3Lu065hdl+QNRomkxk2kGUcUR4981ngLwV5T/NoqrM620l9DtVlH2QxzvvT97GUGgh4BeLWCnaZ7WRFohTyoJ/F6fb9hjzGqsyWTRno18AAuhJTAZPG7RnzhldgtBEBr/QaoVqEyz+U0ZoiqfiIGvEnZv8KseizqaqqSdVHGOXJZby4DvIHD5VLdKmxrWW8h9JdbNAHAZnk0eohuCT+WTPVrT/eIuWDncqpevnDpVBVckhb1t2fAGDlr8EAnVf/dJC5j5J3v+0pZYF+kap9zQeb9f2ZPVXSyYnv6C9VdLJie/VAAD+/rWaUfrnPFc1oMFVggAj46cIVtOIkDU58OltR/X4VboAecs2aqK/prVpvVspa8PUNbPklaE6D67TQv5OJm5dzRk3/5Wg0mv9xoK61mkMuNohMdVOX6KHZ+GQJxs7npUPKlRxSlwhGJ4Uiw//OY9jt0I02ayxcX0ZAeq1H77jmhhhkaghTElgb+MWFhy4ldaMKYYntQ4Behmn/p771lmiyYQs8p7DqjmVT3RjTk9zR2NFqnOOPxkzMicLpTlbPoiM9kcxzNAhS1ldp6AJfj0+1oX+6D1AXgi1MRbZGkq8Ha/KZLdYC5/0jXmSjRTxVDjty3k6RNI6Dhcz6lp2/PKC83z53IBkgjf33JIXf31O4VmlFQUQpGU6xrnlZ2UCEJ3cEyJMqEPxsruYuhY9EjX58l82z/CDybF4uQwrtDeThsKE/WwlRh3MPrzkX8k/paGi5hMAo/ejxT3fB2S02FOmRv2KvCea3SRIgaMH1aUnCQu79T7eOYx+WWRLet836Un7z/LPIMh28L1ldR0trp/lHin+Zpynw5yIPMC3B6si2uxSRpJfI71/D2FchVX9K4v+mumQXXRStok8AcrxOqf5M7B/mYoV74ujTih1Ao4WIvsqdDWWlWrZHONayjv+VhGCLK9fi7qUyZKq9ohHBsByi0oL6tFtR/z7cggIIG7WPMHUZfKB/MaL1ZhxrH7XGa6LKk5zN7a3gLqknkeK8skg/oqR4sZs2RrAZISjoNHtWc55aojbbQp7OnnGcLXcmSjrenQ//BBGL7U8DU1hEzP3g0ZiUNLEerPWZ+ujlP8uHNIfSTNSPgMIADkUJwDDWllRASqW3vFnMB/AHWZr+6ZlxWi8UjeeH0TNZiSLcq/w1DGf+yCvXMuKwN0aftkBeVMpCp/O+btscFbLDJuLZ1RZdTmPn5sYOmE0o9Lf3K8P98JzNw3kyytLR1DoByoiB8tL+Y5Q9tZbmDOa/zqaCt2RsHQ6uDQgbU8ZgSP8QOv1ksKBcyxxQUj3m/jJvT751lumOztdtvuBUWLM6Etyi6uIB+lAHMKwiQfORdhIrJSStX/3nVOd8dyv6rsUYjsQX/01S0l+rY/Xtv97zfCUcznnbCn0X/Jwbl58IhoAzWxeKn8z+mzVL2W25saxbxiKgBiX6BIUgIbb8TYWegvSg57SX7GFlXDNwuISjcZJiI5FOg/PjPa3m79Y+nmNaeDzuvuU4Nr3jized2ImLqh0CLOXnjKM8UTH9NbiyPdf0cDCRsZakwIlvvF+iLcWgcJQGDOqL54dgDIYL9O2IrNN21j0muCU04p4XLanRTWKLzhAALnyon9cR9G1fmzxxt4Zc2Xpe3fSBBdfkemM83S18E1NiUh1fmj3tyvFYsQxzrFfj+zGtfn9EfyFJ4vvllsww7IIR/qBVtJETtl+cnu/9x4gbUruDrBoGtP8BUnXybnSP4bARDgBfBKPrRVgv7oRsq3MSyISeQ/ooPZzsTt6CDR3rRPhT4yXMJzJHlKAYNAiNbYSMbg3umrbD84wD2yEHGXuPopRzJcIMSpQnA1oCw/w5EMdneyOzTLAoMpcmqlfZhcjiaG778lLlI1Qesb/eQ8rycR+RzveAmpX87tnPq5tnvPSlcwtjAoT61/KnwVc02jyqrDwRdnSyLWs0RRl+dkOXE6B6g38XOIGXMI2FKGjkMjbRPpX83moE6KdBeHeOAGQ8nzltJJ2f/d4Ebzsl9SPDj4j5de38Qvzemp56X5lmtkphFYlVIfovkyKNeRE1v5v6jrguXHEeFNmSavglCLAfZCsYUU21fx2m4FuClhBrGIUmSeWeobBKZos7KbhQDAUlOXtiT2zQH37P3B7sSe8bK787EWy7WVAHjeKlfAEQhhIPthhwTirrso6lIZyrPaU5hqy79eZ7zZGLPIWft4CiMuJZqUpMvBDzDS2wfDt/vEPbWEsA+zPZ36a/i1w2vjoJWJDHFlu0A3jKDdmqJykY8Ys7/ytGrGIw1jvV8ec+UUXXdfDYVlx059QFKj6i9ZZISwimuGFZUH+eYgPuQlNquzxrqwEPr0TgPeI3NiGoIIN+WicK5A+NFOO44yi071ZRfYbug4wRvo52XlOkq+0MucfsbSJM4/ufqwzzyzG5uWS5BIc+6oOM/D/kH6/Ze4xly9czECDfqO59nG6wd3QYn8X5i9mzWGx4YOfjg+qNbHKzryox1x/H8uI07pvRMcHAbD05WTg/77BgxipWoOiNbCkqytKWbPlmwW1qJu/UHk5oAw3ZQBlTK1CxNSVMStkNh4j+xIgi9ZEPn2FIKaHSCUm5A5HiR1snT5pV4SmOlyHzN5lV4T+eupUf/7bz4tHE9Au0sB39NF0IYqWs7kB8vP3OvMOUe8z46xDkQHmn4dv8I2FWBzeFclOCwthrscDMpT98wYAsCVvsE6uAOdNGEWlHHzw47wGuCynCpTswMdROSlSW7r74HqHqONJTF4SzKsahjMQM9D8EXidr8MSwjaXBMccSuQWfsTWYl+uz+l5jQlCW4v4xeVjWNt/TS9WuoVC0WiXw+sMMHUMkX2VEW8OS4Swz+RJpN5YlCHetkomkILlh/mlGdyV+DViMybeKcNstwxNsos3n6MaX8EMgyvi8tlAAea7wC9Arrpdqw8VgmgDNS++SPUIAbWwdP4UG9EuVMcdnZQdBZdSvq/K9BEfMy+dxgXBsuqIPuLGU1BjVI2sNW/ceuKlz3K6goigbhiVR35osWc2tZoxGaIQ/F5BLwG4m5ZDs8pRMxyOeyvvNeMdiWN4RcBOiwU6JNxOmRl3aV4VsJy7Yq2ChI281sva1akVAeE11sDwPsQ2Bh69EzlHJsAApvuAn0KRaqLANPqkVIJp996DybjYaBBgrdysaG9eyy9nEhYBSg6kZvTMkTl3MjFbMJb3tpa7xTWmKF2vjgVoStyuDtDpQeQyKLhpDYdd52AwOCZRxPDZ1yuWiNEEmC+a08/xc4ROk3obBbjfCipIeMcUtxv4kcsq8OqbCCjuUWHWCc5rqy7poVn2jTrDanhdvErpVP+o/fs+PRM18Y3QpD//vktpZgf6+DhD7GJTkHyjLmUAZP1qlwU5/NQQ6llfSdgiZ6aEurF8WSkD/lQZWwTZFTwcaYLju19rrlq8AoXQBmM12uK63POh3CFT7XIKGgYaGky0CKmhN1CYLg2wFRvSkDvyvlq4Uh5X4Pw74aCuGeU96rDYD72ja8srL0WQcr4gOSr9uUAakUkcJAMvBKTxoxMEySbzSujTygrEHamMgn9cTjWqN87ZOcTQ2HjzfKlvipO8WDEfMOUpPotaeWEbMQbZ35jVXAhVSB6UXkmY0a/x4CjWGSYxj+NOfjdcDCp4tsvLTws4ElCmOnU0gb2zV8pleGxbvoXtop5hIazlwv9X7YZv0aFnkufXeHZihVpPa4c6xh4N0xFpXl1xpcV0f6CBBZpANS1PC96prwNq2+NrSlWYT+9njwzlqWLagPslhSFDHI1XbvPx+3B2eL9l5m/sBQUYO/vI/9BQTOicwhQNgKyhdzrW+gVR0FAHgcfd3lS1EtDekXRSGrVcVh4qgvY/aXe4DXPv5834Fk6DV8SWElBPbPd12nH/5cGkXvfq+MpBOIDzll3C+eI+Usq/AwJTGNCvJApa9llxjAfcB1ieBnbKIzx5RxocXPB7lKa43vPU02fztku14ir9oITeEjREmgrOWJNt7Sw50Oz+NdpcHjy+O178e6iS5l1/2myiZwXZIN6q8JsJ+qFbQM1ljN9cOxHIy1FlTaw0fPRyJPetUmSGMaK2Z9r0xNp/E/zk1TPzkU+VIe1GfHdPx2lJt6aXXL3WZzshaUj77uWCuRJ8i2C11/ZzjcUZ+WSz7ZlSSABVuhZA/WU7qfshwN19upR4ojQQEZ3VTCjyoX0zMWeu3MOu0dALMRDwfeBX5XKLZ0zc/f50KutsQHkPkpxlsDImhDalFBzN43LHo0Go673zgdA8N1+g6wuEbl04/bk2ME1r8yrSRPTm4ERcj4rZaskPdUA4R4eGl2GvLgOEKg45hYDRogWoIc50asFttqZnm/GlGFzevJZerNUhU4FmCuEtmnzbWiU1In8352qVASb3HEjEw6uSSijFsaCWmSGIOXemn0w114KjFqARZXseKsT6vrNbHL1NbLXOACA+yfn+Bx0cakESyLU5HxE8ne+chv0/So/lMR1LSZBUDFSK5iZX2Z5yMfJJxYguUeTDF4fcVGAO31tXXG2aKY1vuY+AuTx4gMitdnSM6Wc6zZ4T0g7RC7yrEEaQQWNHb7qtSM05vBljpr2u3Th7sbzBRodk3wHIPXa93eLN1wvvUM4L0nw/XcedP9hzcwTqfLJxt4ouafwsHiwgStr5agdVMCJmuZwCIHuGA2t2nGweWxK3KlRzaQNiypfqyugYaS1lVlDnh22d+QlCOoADffq8tBezU7wF7AOKixntvxydR528JJoDil2dTvwnFC/kbDs2ZXIWx4lcknO/31LJNvXzWKTmQ+GNrCvhHDUJBZZ5whr7vwT9VZ4UDPx7WuhJg2bms1Axq7uWBk6o+fscJubDvUnu1H1JYoEqIicFXTlx/nJM10emhYCLu2F6C0EqWLzc19mDbwF7vLFqzkeTAR4aFgDzBMixLWo+GzckIm/Mj5+E5u8ijr/YEZmNb518pem9krhfqpDyJ5WINr5zQItddaUkflvYFqWDeKuzbcaSBrl3ToGm5nYuA0Mq339zrr0EjEpKt4lR+VzN08jOy0+GRXKivvXmN3++iIsh5J9+EP2bczO5cRaseYhdXipcRRITP8oIxx7LPGdPlHFCVJrykH+xoqu6r+7rt83oxBtYKy/riMjuIuuqQb90FLL2kGxsCfvzxKZradys7YQyTAbqNaSR1BhoAnmA/AsCW5wBftWqyUmo5+QqEbHmP4Z2zp0lBmmNSTqKnVOsyyJDCv168Qqjzxd2TCXsMfsd6K+qnaVVA0I2zV9gkol3aCWliTJUGkoM39XCpO22/5MCIQdc18/+9AEAQZUGLngaBCM7y686UFL4kN5XncfrN1RTQMfntc3D0r0NSlsw4/TPv2+Lm+OpfXZZJyava8y+ieqz7D2zAdvmr6jrG/m5uB2jVyjEOxp6qJaBd3rvH4RsGXotV9NrpHcBP+6Sl3d/wwvsOmMMjdZ9l/gNLStMtydZAfEyknHX1GNB3fq9zeNzZx3GiaqspOn3PJbEU044bphF7I7JVdM7iQOeSDn84dzcd5gQLG19CbQ87zZ0D8lJMWnHEFLNIiU+A5Sy34Nrqk9+C580sZ51UXJErHewEEmQl2pV3zCsIu1+nwaV+kvLn76vw/5DThkxiqirrc55N3dRpyjTw+IEn+94iOeqlCp473ZLtYEBHX+BUmuEyTzYp4unemqx4DZ3mI51+WocM6Yfmklk1P28/BpxOxLYbrTz459GM4AV5u49nzMu+G8wuWl8izxoqd3lqXNy2jKUgi8c99o6ILVkJnWealOydnRhwS0QVYHzF9TiB/U3/5HuZF2ZLIVtp9aLGlOTBM8YvwVinayM35kVPeXOVaEJZW/n2S4fA49iTqf6zyH9P9qIFaio6rgeKlT/7dvmiy0abqLhWFBcgjnrB5deH+VgmVK2vCazWmudAFdaDC3q/7/aldgqKu1e7d9Kof1abNqixCW1z+E/WCo+Jru69T/7MadA0b/qUGG1BrpdRna27KqQdBLfmzhw9GtuAuW9XUNl4zbRN21Y4RzISb3HZT/PLdfTZox5DLi4VU6Rs8nOVPdyjlkErY5oddDrRY5T8SYsuJCJIyLG9xs3Jjc6+/TPejS+zuMY3CRrylUQC5nu0VgBnSz5tceu4zRRFaGlFk1vK8OTcr57shsK7JQvia9e6zRahtkSgpefnuKP12gfRTOA6UCnQjDGh2QmD4V7kNW6izXQxozNKlTj9GFZSBrwKvk/fk4aI1nm7lToH7r4PB4wRY9Hd7QwG4JTZXgzaMGg1eLXPkHuRh90mM9/QG8NciTquFEiPzZSb7tlJLmwq5khWB1/7DhgVZbyimCZCb5Q/PIzf8Rqe8lwmqVOqySUnDuENMWDy5BvD9zAMHLchGiRRvC4npqV5Ms4hVmEjfIry3ZmGOZGJ7dkcbo6XpL8BBsCkByQWQ58F33ulWt39jbrAbGM8a+kyh5MmOYdUHCqinZm9jB8iE4WSfAtPayc5njEyNJEhPDfpSxytsxjB5vn6b9xqRTH11Lix7r4ByOYq9DD+qTl7vUKIkt674HVR6OQ+M0RAeRffdZM55kuXJr+YtJDQSkoukMdz5mIY/xtrnQNk8oAdEDssTTkQTt3BgyjcErEm4LAUL38hJmp9nhBClBTGO7IjAsHPNO6wzCUzYLTb3PIbRWdLl/bDvPn+ILrJr9nxneSTTNll+Zx05Vk/cTGeF0xuSZTyWOVQtIze70YrKlqCAWxZ2+P+kgOLJH75ImjxRr7zEHnu/Ht0nQlnWZWfCSnRU9sW603chsvG4Sl6p8RUIQpwf5UUYOxnrpToVf7OTrEdZmKR/H44iYv12ef2U5TbXukzJESaAnFAfUH1EWmMv8Rs2F+WEmiQ16hDJ3eRWsCSvYnw1wG8aH/2wYYto/MDtjHPGAPaNKdzgBah/nBoBijgngI4X1NMI26INbBnUtDlXb51rs76BXFTbAI5jf/T58hyv2Xz4ToWRs7ch8Q27P9o8w5GK1rXKJHBIS5xO02Mz6vAnQqzvdkLi9C0kO0mjOpmsqXGSKM1joT4cqIIOMtb+LVQ0DL8vUQk0ScYdMR2wLJDgR5jfPI1AxRbVHIAhOVttlnv4dQOKPhPV/PnCxs5B19z3gxeYJwXDVXAZTRJMhAkkIFXLBQ95+r4GPFdnnsJmuca/IKv5Gh2ZMAw1JUErP88GNvbEJDj9v3FI8HcN4iGEEkKmu4IcftSSQ6qV91yjD89L3adheDoKgQwMF1Mj8PWA2mh4Np9HTIZb3xjeJW8rla/J2H+g+i7sM0CHViX9EEBfL2BAO3r04Z83RKbz5OCq1paol+zjR/tFVxlZ6Ipt1FVy8EESbYP/E2SUSqxLnDq61DjFG1ty9nfABC+oHkPLFkuciCiwdRrIHCN8PbRrR9uydht7XSZexUj9AvLF9hxNl8pkCjSqipnQNSodRBxTSC4WAAwZzJ5FLu3+uicIct8DGDX05SyrW1AO/uOJggAHXm/5ag8ZFKj4FHJ4rehkU2njcaYTWjdQauw28RwnHUhyRuCb09ewhP11NSTFywlcCms2MILj0+QV+yPg7OII5O8pNYf+DW30X4I6xZ2OITW4fIQzavw76Lu/oOiytiJUVehwebh5kmMws7JEndX2+/PO2cZZOqbUO3o9xLyqWYN1bjexH0OuyTBLtdI2nZNMAHbk4O0vw6gOHBXQaUN9t1UGbgsUsbKxGdkuWQctUse6pYK3xWJHtCdfU+DV/PlIRsW3QEsVGQnXIVasHfIOpZCil3hbvXdeMlO0Sc97BefqdNtLA9JPtSppkDJhlStTJrNRkWnhx92U06kKP7UeHaQ7HPD8+V0J1bgpG1tlNXIffIgE+mnvIC3sOO1E9B6TB75gkYJ8lmcJfHsxcmAnYRPwx9mSY3S6s80Th9odi388NwrO/glvOUMJHo7SSZHI7Z/QrG3a1U7CuFWr8oXNlUdxgQRv9uEg9bVOvxJdWPxaVghEsiNqPLjncbB0tpYIMOY1a+tjGOxc7JPg9QR/QdiE04T4JKcdfb5rCVo0vD0JZ0vNiZYLC8o0r3DyFU1rVNUDqwUAbH7FLAK296OI31mblAr7j2ILnkJrtX5NdlCg1+/44i6bIUuFFqkF9DcyxRTTdjhp4QSV7Os/X+IET3NKIXf9/0SI0DybXDyVN/40964qWT7nlMJ4icNYEhA+SEJW55c05unmXOg20tMn+hCmpFjdJrTLrJOYNKgZwJr7mTnU59WfsKdr9eev0JSSUpVWDzUVmJ4XY4VAMSs3Xod5eB3EWsFUex/vhntFdkQSgK32BYS4YmvLxCnZnypF3JE5iEo4VV8GIN+Cbki6TXzMvpfLda1Bowa4dqgdTWZy4Gg4xn18uQ6Z2y4BtigMeRe0KY0zQ59p50dT7/Js0u8BkxCOJGzDmH/6MeTx4Prj6A/ru1zhnJtrlXoiyxS0bawq/rmGJw3wGmqVVE6WWW0zWGXjzAj/9ilwyTq/Xn7IZcDIlBZV+Rh2Xf8WjjQQI7zHKKPSmgAjfiL5ES2CKtyCJYNfYoy68jLSy3Q/nTWxPfk8MEWgHWiXk3Bhi6lKWizXaAhLhiMFC1An9etHw9K7opuf9Nx7CZY7C+9u1pboNb5o83o9YsoRxBC/asjWOjhW3372cKYVIg8esknWUfvVOrMuWAgr005mcp68+XuBhT3p8LjY7sgAjKnVg3zBmIyTYY/zThULyY50Sc4V6kOveZ/NRLeQqB+CKImxcyCsGcFcwBwR7Ex/JuSdo725+E8H1hzT4Txi4U2Ypx0REivfwg3Z+itmFoh8l7ls7RW6EBDP//Nz+d6TRpDcqPgOrSzO4CvfZqIruJfAQM3ZADsYknMsjyLW00YQ/sRLo2Ptkd6b6wMCBPqKr8lnMlOs35q65sBUEAZbKUNaifdrssfaFkeumTOMmUnLXSnyHZXSm1S1qtxLvUsLtOa1rgkmuREBvCXcofMkufI5v3fyviX1M1BShC0sSx+4h8FfmBBoOJcyRz8R5tPhPSx9gaflzecndEOHS+4wKygzIOzZsL71q6YrHvkiPbjzLq2M280W9hQ9mFLHdiH4+XJRLPt9B3BAsQPAMXz3AQRdkFwqofcSJaDx4lqLKkZq3B2E8ETJngo+eqFiWv6n/jKTAw0L/ywiR16z4XYhGW2M7pvkwEE+i7TelIjS+Z6wxLLBFYUsGKXm6U3u7o690SvAjcEU7LXsKwniYVMIQPWnRxTOxkZxpy+zEBvzl1tphaHiSq0k3+QtTgvcORScwx8yk4hoMF2GKMwc1z5VW+UKygcGnp9Za9Rb2/Zjo9CWWBYoaOGgiIuSoTSSWJIND0UFtC07xcvMcAmQXDhxhyAOd8ANJvWRL+SaYTjcIL123ev3OG+MGaBZh6/vf3O5feCV+udY6bDEvJL2nas87gQ2ndY4jf7AmdvE8kz6A5xkO8ZO9LSOgNgp6p+Ac64qanBtsgZ0XBzC2EU1jYnie5JNDzeJSIXzBG0xjxQOT8F47L/NISjdQoSuAQRc3eOAK8ru6WR0S+Q1JiWbrPeOdk2Ztm0qf1LNqo+bRgB0NekXAnY0FJTD472PtNn2WZVB+nYp/oYzZOiN/7RRpHTo9GTlZxdR/ERhQrToCe5u4PXJbCNrbOLv0dEYQ4zRQ4y5uy+EmC5zWQm/DLSYhaAVw8jnujyxIXgxRNEifBeQ1RQg3DlAkOEQEFHYc2K/F5z+MA5eHsPOcepuP1g4FStUqTP4sqfh02K4PeJX9xXokLLpN5gHtrL4y0QNYYax3iOKN616YSRGbGilkrnJuD+vdYg/5ADnFwJtttog3t2MYjda4UPt9FnBHTwODNsWPGWHeIy4eKABZPTfGOF4+A+xOA4RZvzWiEj4D/MUzewxRibepAfomhzqmx7PYAod+2bC+riaile39DARdyU9vVA5hgyWE8cL11msNCwFdDdLE/ls2tlo5WRShbQKy+2AwgRNhLAOLwG2hXFExwrej/73/XkLsVsZ4EnO78UQNykdyRo6PzvS2RDt+LfyIPOs+r2+kDBsmOSurwZLKlwiB6fLPquvXwymS2Z6Tvb7qH5J2uHKAKQctWAC9MttIWi6YjpxNWG5kkcPhjHBvCLk4nUi44wJXAd5cwI1tltG0WZIsO574YckBFxtnN/zebWxSqueKiRIFqGx1UR4FNl028KUOIe63LPk9Vl7/xNMlEJn2yzPyTmiBK6GVhpS16Ut8smtKQi6wySCLksPDtsxBBykdxfXKG88VvVbMVSobDXjInmhdiY6tA8lo/iSB1ex0WH3OVEZzmw2DxoX+PG2ZkT3VyUoE8/oo0Wy9w4XoefaOh2M34u1sVzhLMZIRYICJtIcT/zZGP8xXD1LbcG8Fx8dHFPvIylRAei72tzWgIHDsghZne5AjxORfeXbXCPhI0208OPp/jMXGTcEkYJhC/f/pxGg8E+nZ7659nNDs3CyEE6ljTeGHxVo4L0c1TecfpWGTdKwjWqVX4jt6cyMN+1BUXBwmz7wgRZkP8mb7UipajTzbdm453QfWOn4V3U9dofnvbET7aVSs6ODQZug4h31iKoWXn7MQPbRf8mwFekBWJ1k1tWHA5vGiZGzwIsC3kwv4Gu0ELBtuAPrHtdyOqTsj1hN6GzchGxNYtTDHgFn43tgYKnzpZoXpe23X66P1hAu09VnjD/bX20yqC/2ksILntKA/t+DSZFXA3SgwQkciUBVgMCKixv24w3gvYeJn0naoCWzmSlopdplHhDKlhJsNnAQPexGssQIY7EdMaSETb9GmUUuHx1AO5+PkxUPuowGOzqvwBvwoVkLVvQ1jg2PwZTy7N7uaP2i0pBGKIi9D1KkOIkKKGizhhjxaxyXx7XIvsbRhRdLvkYjfMpn3c+WEzOI2r+rNk10gIqzQIgww5FvKTSgCR2dDPQKqzBLp7fQSNGa3LjxxPoQeYoML4tvItGeJtRdOqL4hFmzTzn6xtkXiBoK6bbweX8ft8hxMoFfWFDnYoz051hNQv+HqUe7Ggy3CAqudJqm+Me41cn+RjiKLua13lJTMhpvb3dCqqyHsQ42L/cNziEXORQYtwiC4b9bLVBltqEWm4T7mKAKGXac/BprWUcTPyb/5MCDm29Alg0Ag/Vc8TCdpOe0Ibt6T+UrKkFxt3zKkxLgg9/zCbLhONegK57SzGQah/h9bUGmrLLDLPxQ9Oq9WBpsXdmjLMHiNW1JJZb8BR9RlZL5NUHiKZ7hMejfoQ0PNtzIM9ioUK4ckF8YPL7XzleHSqBZJDhPmDVRarPZI/dUBUCg7y3LJo5jgVfeI2rjr1Rl7mOyLGL0NCovmqw57XD3uOBFr79Bwi7fvLYLwAnIAfvTfyHSDu0u7cLEymaAXPrmeOjDLszO0cmyf4pEEQGtpRZz3kGs0aS0HK3DlhVKpZbYn82sQPooKUMsjskec4i2ueVwKK2iTdRH7X0fWTibU24wGR3k+VOeJtRrPDnuVADd2mI1KoKnzVOVq+LvqnnMCGMGa/dOZpWaRkG97fsK4DMyTuPA50pt+FrrHlNTeT5QcUb5jRxGCMD/uidjDyBp+SHytsbAYm7nG18ce4XPyLutQ4aLY8u79W6Vhi7cFC6ckY2RHVIOcLptDy9IJmy5yzG3Jlv8F6n5njw8GSYeicJL0HLoxccy8IX7h0r2mo1hvdJ0Ch+aY2afPD63oEKDslNSGYnYnQZz80kAjeSrgaAQc1OsOkIW9TfZrUroAn04aNthoh2H1SDI5oVb9V1NAddz76TwzyOUTO+pPWTxvr5cOjIRNeqfMeEvETngktTRTRiNNNxB2Ujm3lB8+1D2aa+k76vXZV0g5w0EYoBJRS6LFugiOnaOGKiNpOe5irKOL1tYCcwsy3BkEYH0pRSfuzquGmioMASRzsTZZJEjqj8cye0kSUD9vZXMkekjPcL4ARMmL5+8DGa92H9CYvSXGWkyD64EMbNQ0A0HJtuHcMaOzSX0S12i8PdrubeCHUgDOgJaOzOQiVE3SumGGT0wUs1mDiRiMbvn3cF3jnxydO3miXAIN0uhtiDyR4Wh9zb/35SELEakzSREOyPza88VRkJQheaeWYyS3KBFhIxL2e729lC1YTejHRtMwjSIroiQRx23KVFkVTt2BnN+sP2TJdzIcMyqv5AlWLq3a28zTO/mt+dkjL1T/jUpBr2aiHO3yqQj+QtHLYKrK8ZYCgyJYK6HtT171Vzms5TskDO6ZVQfI4pCNWHmujrVwziISCcJdz0TX2PBk7Fqme0nw8uMW1L9iMrWLmLH1aOdhZHYac/a8eW+Li1bzFSJhurzdY07OMs3zG2wvIhaomNs1KhLpXCPVzgXPOJIPgR5ndoJoz07jnJVCkKzD30cg5bPn5nvovkEBJqitDxtTUbK3Q4D5fS/P6EuQwIJHsdKGpiWZTm2f7szfdm/5TRnqYAQrwnBFR3u1W45BfBLmHGPwzX/BAiNnwsYut110IWIKJTGed8/hRdCCl7NVyErSuDQ5xvcJ+j7G7EkVMDMFt9Gxndrmu7tjafLhH2sDGqRn9nqydWlYakOia/S3hNPJeMJtUFRIn7XXZ2rwN3FQO2q6yQZKHkdoZtFEq5ndJxVottESO8A+U32ZIebZCxoanFbOafoZmxRniugESF3RmyQAzV3o2TkMnFOsonrbfnxY6gu0ECmdshAPQKbjwFD/V0162KsMoV4BT7/6/LFVwHTb/oOo7/BbrL4JOZcZrRmYnC1ZBfP8itW+no8IEDz2zWmlYUgGipRJLASKcFBAu0eDK+45cg8sRpERzGoIyLn53aKOgNnbf1rgZRobKNQQhmEMSNAvPtbEpNipZHIjPSW2Nq7SlEhOEu9Y7gHTpcYSzEBWg4t3m2nlX/cqLBOVHzt+5PVs2Cf/iyGhPqtxukiXE4W/9uOC3rxVroWpiv2aXITzvErYbDu58JnEFJ+Ad1K6mwWJpDdUWM/U0ea12qqlAGE4GNgUz0L/4ARM+ivLNQASw1fIXODCxLE+MVIEnp8VLQQfkPgpjM2GjzeK3ps7dbFCNgrJQDBccl0PJoUG8LrPMacoBQTj69D9qztWVPKI7daaxfYqWJzls0Fg+2tRQ7PTI2CbntmztioJbKOG/NKeL8gLy7IAR06uiSt3GtXdnYXhE45vSfVVJV5ZPUsYfq/cF5IQRQX/azKf6PYdJS0uj4uOS6x9pTv9kma3mWiNTA5/6FeqbANZtklqnSbEj110vSy/T2PLWK7tS5o0YE5/xWD+4we+LHRgy97hVWMoNADgwC7pBttnVuQ4O+t+kohASnSiEyomQ1jFInTwuHe9TbFkJYm3Bidq043ZnEe0JGSXnNJPMt4Lo+yjP9mZj2VwD8LDqyOIyiSkB6qDKp7lVbkR9QChnFUHfQFbi3dOidtZ43s3ISAkMFQTLjsYt/nOEBHC9CudXO1J2aXf7L5l7v+gyAnbUWuKVItls+nOcPdr3xokpPhlUzbXPXNMkQf4JEwaoBe2e23fUUdLfG5xqjBjcqUYSQwyRpgnInaNXYlmgOdvnaxGeXQ5hulsvuLQ0CQqxpwQ5VU1itgo3DHuF1zW1D77PLbtEg9EQ/ljnRK8w7bPLwnUBk70mFCo11EteHT9+PHMYi6f//k5a3SCDMv3w7Rip8UGtCUCoKjW7vQncpuk2FJWsGd+K4SPy6/wk4SHU6xmQdk6fDcB0PkBu8iJ3b6PGEljR/FvYNOLEflSvUeuuHrKKsfAjNbaR+B4lU/y4DxJ7zhrIjiF8LR/lLU7KLJjOiQIGbHM21mNtkX+iIONy+xenpTThMy6vWcXeUaJJtv+515TJor0OusXptqrFAQHj/hk/++BZEcbEE/agjeAuGnv5VUw12dETKpzl56bhE97eYlemZ0wEYRikqlR1xZpQtOWzL92HmoBihZhrUkY7pmfk/3IYlux7tIUEiUPCpa6NNEKUijA+ozq1YWK2E3oJoQvA6EyLINO3mNnhxF9pY8KhvHPmVfVVQze69xUQ2ZFZiimMRn12nC5nRi8v0lDQk9vd+2rZ3stsa/rpi43OXNIzh4GLcLs0xBNCjHEdlrO1tIfpxM8yijORsEIfx85AxQYlR9thNMqnqTnETIFeA1l0I+KrYjrIsf4ka7ab3L/Vj3PzefYwGp9bU69pbsw5Ugcjr24iuOpG7+0YciFlaWhisgnqra88XtanmO3Lo4/m5TpkX5v7hlmHlMEt+1TSzpKbTSGuvuZ/NxRJtr2dWGIt1uQko/ss8bUROq/5tz6Fp1TlgtCF7gE4ucaCIsOZCskgA6AF5uu9YLL6ObTdTN69C8++u7BoDXn5/WDO7X57ZV4cfCF7Iy614ZgUMN5qIT0OGrboruzvUwNfzzvj2eh/CY+uSWgGV1cfBSUXkZrxNuLs6nPWDDQqyXI7+yzZOKd9Gh3UXhlbAbkhnqtuOr4k3XG/8M7FY85ECmfuzEDZgFL30jxqvIMellymdq0n8g2GSTeSXuRqw3y06Jj7FjwAp6IO74by8itHJ5vSpc+Ii0Ud8wSJRNcDhB2OeVXebmnh0v2DYn4LxqqqjbBi0xOBu5fczSRt/EXSNCXe9b6qSTnU03IRRZ47nkxtsdsxnqZ7R9JoQx9i2eaRTMvjEll80wujPZhD9GMfrpufH6WCD7UAFsiQZXwemxkfo9ah/o4bvNkK62wUdGy/KD4TgzG0FkFu1/7llI+liz2EmTUp7XrEqIYQc4J1hQfvEYTjd4r4mbBj9hCVK67P9a9jG894vIHBLUI3tjGYenjmYjOydIkZQiDYwEuhGcyc0EFfkquY7KCwpiIh7qNQErkZJ1c1NZpOAufzoc3IKB7R0978drkESjlqikpwVNbuo79lG5e1WX51AXLDTYUYIWSv2MMYkajew49+epWr+jzJNuegZbDV/DVb2uCNjObAAvUpsSDuvmCcINKgIO1+0zubUMdyRJiKgMYu9eh+E2SvMZ9V7bfF3Q9GsXu4x5erGHOLpiGLt0zwce/fl/5i6STl4VehMjpNZ9PtH6ciXkZqJHF8zY1dxt5bVuIG72QSYCnz2bREzwEEcJpkpTfJQkOdzac2rV5xJ9Nbzm+vH3xPp7zVEWe8PwO3oe6lGsZvLYM3bdeL+lVxHtjxPTZNLwrdxD9Xaazor8cD2BshYXOQ2QfnynKZnxwU5J6KZpOhy2cHW2B5PYovVPWMhQ0QTUt648BNsHTcS78PT5tOuI+cy8jD0Ipb2Fuw/S1uQsMf4+q121irD1MiCkNkd1tuqmn7OnZQA5MGk17EqWDqRQAq5r84b1ZSYdT9xsfLWHd+9MZh/qg3vK3drf4dtpHtzfox0d16jU+UPvlIxEJGK59bMcQOKchQa4+4XwmR47UcxDI4GxrwSYp+7BnKi255t6d5bTfMp18nTvvkorsudesfmiaIsbhndI0r8sz7HPwLoW/x2g49xeHYDznu9iL+dAGAJ5ir16mWUNydb5FKdYpOrDXQTmCMURGzlDC6fyd0ZqeYsSXfuCLNuVP9YcpNqu9ECLvNL5SjMJZvck7bD7kNrIbLMCMsPa3woFKzM1FbXyQxp5F6clYtwJcFxii3EQv+JUJeFdBxv55Q2G+MvztUgccO79n4QbpTUKu7mMkErFT0lnFBBLx/csBmwTqgBAiLIEj1OgodIJonDA9/GlmFyIMuqV2+9+7rz8TCHTydj5IOisRlE4eS+hgQdzzbjTb7CWnISd3K8Ap5MG/wBOEmYipM76eLN3vvFX7MYKAF5lkezC1SdwqhmO6NWTsHcRoLWCQLxu0n9tsNkNsGE3dOR1RvD91OV05AXPWV7UPbqKz9ZTgI0J8WzPvmFipQDp5qM4G05teMucV8iDicxluaRHY1kK63jeWhB00u+e2E/23tanmJtpP0quft3qY+f6XyNqJ9mwUR9VUJ//Yvw17BlZEIJ1aH5xpMurcqf1ywqHodVevq3sewMUzHZC0+bpA8ph0zRqZG6SPScD5g3Z5wDUxGvZn1BjiwM/9YcER8/AvknlLYoyHPAUKqbwt2Thwsa+yOChCvL9zz5k5UcKL7Jn/2YasXniiNkVGEJC1TRJrFBQumVpbMguZUiDmIUXr4u55tlW8G1CbyW89zCIKbWIOpDn5eWx+CNIubezU+QenUus6nk2nDJN78OFzI2rZ0LGMju6NPZJZLxnKTHLRfunmXuRxH+Crz4GOYGRBCKnWpQCkktJ8FyJrLq3qd2OICnLCUn7QHWRGq6GK8KJern6PET7uKvkBtZw5xjrQcopmC/7GXP3i5I7CndARWSFnhRNgH5edforie5EvYUwuUmCbbigwQ7ComL7gPqx+l+dshA9uW1WiC5WNIYf8EO3kX+Lch1eLfJv8/JHRdv2a+YarOhyyJeslL8LRZQZ/JoTnK8ZQ0IwLdLpR491Cy2Q1zqHU/fRuiM/X7BVan3vhYTVMxskM/xmMnaSTNvGHGdt3LVMrdWXeP5vnhVDQvKVFKXN/aNGp2jd245QTUwcDiVN4i0lzSrDDCrNW8/50WZT+NpaE0BJ/Fie6Nzj5kODBSjoPEJfq4pAzOT/ITK56xUxgb56YZiOu8NHlc1AeO8QmSrSf7xR7d9s750PooVA7DWTq/f2LPq8rfHW9YoT68gHZh+3jpBGWmQDPx/dluT9B+aQc0ExYUrh0uTyzCjaydqOem69gKKiO/NihnqU9Eqx2s0MPB++kXYKILc58JOJ7osfpHoVxn4Jhgx9Q/rd1VYobG1VXNXeOwTuDZLz5b26U+1hnRWFo+MckGVs0UMRee5qlpDiljCcmpRyZOq4lT+gTzehUqkPwMh7bLC8jy4UYxZMN+sCUG7b52wJeUzx8fpY7hsxySoAdF8oWbymjnW2ZfGCzjH/Ju2zYCZLttB6DChXxhwVOii0fgo2AXDRwicV0/0mq4Byovx178bWJ83Pb5eLC1JEueIW+NCE0aMeZzvi2pXyuPUvwVHyG6vCRRNYUL3qmjl/frvCS7VxOwln15EoBsp3VJCZAKjMa5+myBgYhWeHOTk7bYopqc++PRcLBxJjZmoQ6EnSkmW+vbq3Wa+2Dh9vZxljh77pmwuD2S4w7uP8QlNIJPd5D2T7Z6zXRyzSXXcSzhtVC03lHE+TE4bzR5F3w1H/GpplPhYP4L0xTbCYUvACbO24YmQqUnQtpJegwOUC9h4lOYxizMyppnLDN3wrxMfQ3AKUHZ35eqnuogJyjxu2DqFj0/h+/CiG5uRq50o/Tz++cPG0YAEEp+kpSB66lVn5mMsD+NyGtCfcIHSgc/fOFaoZBQmyEyMKRRh6aDlMaTy5cK9PZWEVpYeaxpQx6dFw9VWlA/xoV2C66dlLGWoM178W5EbS2HqW46KJwwgO6DkV3Qk62lLUKxc7Jt2B1XfVImR6u7zpgLJVBVgb6ZihixfacrGz0rIGCnCyMUuyGahYJjLPUpWZ+ZCRMzqd3p8k1h+P7yOtfVe9jjvEZHcj18SETm2PpFRR2TbkC8sQvEwUKYLeby6uplI4u1019LsyGIkX6pIxUPeRRykZ3PWWLk6ReLVOCqoBiL9MT09UDA/LlhG7MUwCeuxL8lm+v4orObsoMssPeRYAHpeVX4A4wWa+T92Rb2BFJML4qyI8iIhqF7di6UNe1stwrj4/+H/5cbXcKX9RdU74nXyAuLIGgAaAqiuh0gDSsKBPvj9MCzBftbduB7yL7eXVBMfLo58khoFbzFCEArNkuO+6cbS4BdEU26c9+nFzvTEXySppBnFwMnVuATjtAGWb3Z4BXKhCBixsxh9R1O6zY/w4RYwshZ8df6zoRtCdPk0pa4Wuk1BJ3welFkAffYCLwnndpRoHutNBJNNCUGUUq55uO/pVjB/d42U4Mnk0IOvLkKlMgcYcziOXt7hwfMwVF89FlcXiY6LidrgfYCBQbT7FcG50BG3K0mVT/1YiXl4z0HmBdwOBCtebg9Z3mPsGFkBoqmm2x48Z3LK38c/DR5qT20CCQ6HoU4cSo1IjKXLlEa2W10EjjiIfBePcmCxIUax7gILnlIw8n+OwdBjUO9ksleejaDmNAKtR2GowSZlVYUCPN7uqQxInsCa8HfhDqlD9e8hTt3Qt0/l1Pm7TpEhUmKoJdGVnxDinc4c0eaJ2RizY185Zg1He/tf65Wj3ebuE1ukfmSaZkIUwMA5PqVTn8WarA/9C135iEvSbPvMxb4PFgchb6qNvuY7cRtiStv7Lu4aE2izM0uWE0g49+hzBhgptk1g6PWDRP0rjEvp1LGGvb51VmZojK6pXzK12rPzDXYNAvPr0LiOiiIvWqFGyYZaai4av/sNR2czeEMR7bOiLskbW777XuLp02RF0xrQBS9PHMHt+t8SF7pP1Nn+ndrL6NDN3nO2dQwN2+xyJZ7zylsTX7cUIhVbVGR0/ESwtgqLO3WQFJII8NmTGwSFSY57CuLx11GXDXDB1Gz7uLbnfOb4vX9lJeA6de90hYnaXdHmyIb+6MbjVF8FqliGFcM/LqIrP8rMV0sG5ekGjuVmhJUTPg8LieLjjKkdC0iuiWY+WQqIEsr9tWKH+G3nldR3wgtYAYw+QpLIv84+pb0SVwQQMrha16XlgAsKwfsvpo0kudTp9JWoHhabPrsUxba4+EGt4qGo1BQIVSsjpdH+6R51XThX5wjmrarV8EFIuZL/+ePJBV6jYocoU3/ZzkJO0d3ubjJdXqFyxKkuH38QoXpT8nkV/a6k1al/W5ap9k0fYW43xpsNMoYLq8VKJTVUNIyI9L6DB0+BEIVotel3zXXJb7aSKpraO8Oh8Lcvg1VrZDkiekeyHCMwrlXhTuZx83eQ0+gmsHiN0XwtBTcHFspDDs3ZyfHNTcwkgBHq9hp8Ng+ykuCUIYbdm69QlqKzSepsiCP22mYNlP8Qz9nvOPPqVmbRbnqOaLENHLsdri5OVU+HqlnLOFaNVdtfKA0xoMnINmuOr1uX9j4IPdTK59vJVA6w73M/iDA3rzV0yKA8k03/Youb0stHLKk/P/UIRJHW++nxEFbEiJ7uyCaVnuR4Cf29lB4zxfcyKxiKqj1acywXn98GJTburC+lo7xBR/uZwoDXqwHxeGQzRYKpgmTkb4dwkbJKrgzuNAaPZ/aycefucg997nmA8/p15PvpnJcj4Kj+AhmdTaueyMi3vcTdRsqvBwqQ+wCs+G986vhPNd0d+PZr1/bsODIYj1wRq1Xlwvig0smhY3wH70CwhIoMvRpeLJsxVaXZ0QPr4jJkRArVPZlDYksUFlSKLadnOjLSKMmMxST22urrtSR+83ZsRe+Lq49Q9IaKxxO5ZnxizR/69Ja5zs3VwcCeFCt0naEceduO0iUnIJ79jSeSFtaQW6hkDTiXwqbR8Xj+AHQ8t8rV3isiLRCcCuB7LDfUqVb/P5w8ZtsyiaUTPBU2AeBYcL/claqnDLIHQuIdboo0KZ71A9QK1hE63t6SZvxPG6uFxGJC4dJqDjm/4jBLHePj74A9gpIAX71sXA21TOBaqBxD25dNvboyM3MRcvVaCbDW/04zNHJaYW8IzeHmskmUlbKdJwpA4fcNyu75Mhe4hBJM38HXlpzWuAolVWsdIA/uQQMc89XIN0O51cj7UPzfQ2wGSGY30BKZSSK0y3aV0IWqsk5CBdc+4o0tTyJf/V68ibb1ONzm8DDT5PQp4OyUVpV1EFtrHxGf1ec+jfehIYBHVCTOu4OjOFGHrrqZXh0EX9aGUZjyjUs6s8pYj7SOVKfnRwpz0itvuAF8f5GsrwVgz/zQ0Zv5E73bx5a+f9Vh0g2d1DeDvIFlGIc+h4VP8LOLPUPfoP1ZsDFfJbnK9PqLCq1rGjxA+CaVeSv99bc7blnYA3epFwWe4YwLmDByIf7fuJrVFv2IOSk0kBVnu3PsYrtR06oSkGqnMZvHTX0OnO+Vo646FAHVIkbFZMZ0Wl/BgdDa7nAuIfDW7RtDyExjtNgX9PlCh2C1ZfNUaWo/VDFlTydwKVkSZLqMp3J87fDdZq4hKUIELLj4ZmyxAvLKnUOQX3oXdpWqKe4lehNC1IT5n1oCjv56aNoDQbolYOYRopBzdZcTIqKpJrs8r0R3+3rufbFT+i/eLcHxZ+bPw+LDGLQGKt2cxHRs2vqfNwRdA++xGa8DwqBabDmTKsuYH/93KrRfQOcFLXXv1Q2qqL8T7PRvnnM0wLa0bHfM1W2VpXnkWXl9Bfrwg8NHuwb+cE0KSH1Hm7wx6SVzls3LoKPh0GhnmsVppPZRXl05nw0kTkzdxIqeEjOjBNQpqgqm27BmPOGW2B4DlycKPwkumHU1hHLxBL/QJzh3atASgcNQZrpKiVfPAPmJ+D3NuRim9IpClKsU98oRCQV/CuUmlUOA816EIHvQGMHpAYIJLAFoeE0utwLDqFT2N7q05/w69dJKhvbZAxgf39La5mjhzEY4ov9icW8l2ACJewf12E6cW94WNmwFDILI8dEphIdnyWXwWPlYVvo5LrVHbEf3NvBCTc6ngP3nbu+6OtxsIAqli9sog9ffzzmjQ2QsRbkXOOJCK0LBPo7l/6ZEybBh/WrB2MYYXTMQdee87mVOIT3Ob7ahTvtoxJerUMjz/1Hwe/SXD5DH29GlcT4Pk+wWb/QTj3EkK78SofPYvjMKlX+M+A4pK5UzXkfaPLYUM5OQgttrV4+j8mtpc29HEIMi59M9CjaZRoVj21sKW//c1qjaAJuj4+3Kci3OnGqgT0VbHtK32QlSX2Jj+kxVziOKs5aoljDc2u3n7hgOSk5nI3uOSVFnVd1XcCos3WaZND2RwZUkLQteRYNPyZxL8kFR7RCKjKoCLYwIcrDboaNU783fB27OmWcL1oTMAcJ+gJ4+CrUgrYfZMifssdCvSc+eWWBb2oizCNu9Oc7lMszUXHAqZQa3jGEVjTJ0YgSjZXjuneYdOrbyLLp315H+zioCpddf3o19PeV4Tu3Je9f0Pv7lZh0o/WNCep82+C5FTynud6hbH83pZ7GzIl77802hHjm2CFUlm8hWSPTymb2R3oTXAAkjv4UG/Z80A4iAvhxIhqb1XBTshZDb7+wmZQraIGndw6fHt6LNyv6GT8BSWh/a3j1eoS/gLeK2Fp0u3mIRzT7OcREK7sfA0TnrP4unuF/qwNB3k2d3OzKU2NwAlDamoeGKdsBYigAsj/dFF91Sz6vBgPcyfCOJYk8PfdetVePfL5Gq5Gn4IpHc/kIuMoqbbUxV5ijcTyngYzEsIVK/yb6rAOrP2RVKuzeXm8+YLhOrBl4oCS5f53bJANfHstPFoG36l3QY+LUHU1aiSL8zw/YUpoIiqJO36lp512kST/kKZ34LXLvNaNtFeVfyQHz4aKk0GJNXMhsGELchsPZWal0XSrrK8xhwoFWpVeL6czZYiiXJroNuiohRXyjJ54mUggdtLSX2xIuqsABLyTJEVtAXLf38L1Rdawqb/WNL55vU8/08QuaABQLGU/LxBApanmmjB9YP+jEB8lXcJWPGFYRwDzBqNnlWRKx98sCf7N9em1dGWrrUxq85M2TNA+cCwJQxXwvdnUdtXByAd2S7R4wrVFy+BELGJ3GSfZV+mDjzzCmvpLsPNQ5vXqkejzPup5u1q7TeRegqD6FHFwgEvkClkGAf/QejyxOZ1VI5XNlOqVfGx6/Wt8zFOUCzzv+HuMv+VnlYxRSQhf4QGqaIF576qlFv+bAq9ODwsDOSKFSoBh6HYTLwlfPIFQ+IJpA1BPhEH3bQ7surDxXh3kMxvCodORzzgrCAqfBe5KV8EHneqClyXkKzZbzfZemkyi9fEjZEA/VoFNJfPFNfbegbzP4mi65U8QXliso3HMva24Cn1IIf4wfvuvIaWCVXAJGxpnW7x6WuM8SyQMrk49bsObRd+D28mtmsVkL9ks0XOixu2e0CXjJOFmWBJ2RDOKcXybUcK0bdzto/5jYjU+5c+49V0qaif1HK6mD6fqRjJCswtgL8FkF84GzG5KN6fnQvAJDdR0SXUfC/CdplqawpgSe6mWBZnuFbblnqgmmO8YYTT/q2Celr4sWiSc+G21X7UiX0rDCZe2i7NQAvduQuK2irQU9BFqJ81+xxTVIJI5UlvBYXwhDIy6lP7J8zM01ihoX9yZikjUOrU17pXMj6Bij2wEEBy+qY1lmN/Vb+WGPSOJyTDAD6+PsxvRDMW1hcJqcSI/VARVMXyK/pHM3HmgJ45Kct7Jt4Oe4n4trAJfOSX3FIcoi1PgRiSCZR6raNtZmDiwxDHrRIVAvwrwz+0wlMuE1Dm60WlK9VIB8qbhaLACKK+RbIh3AnmG/uJ/iAh+pKx7R58QPt0cCRA7JXw0EvHC7SOdfVpttBHxjFiJigXRgl3lGWSwAO1KZgIvTzZHFOwqT8xK2EW2dZBUZ2SnYhHghsk+qxXvaEQtH0c7j9B16IIiNFhQahFT8BjGdwSev/n/u5Dy+++6AmK5BE/fN8Po/10ybpiAuTSaaPDaxJ3TMbYW/lQ30jFWxsfoqN9qOgn0H3pZ5W1zZZx6tqQ7mdobQBV0BJNChQBqAz8+FoFNWrRWm+pCDEVwHVQ7ItJqayUVqxTS3nwHDIItRWJG5SKVEwG/7YDPQytoW5VgjAayivNonX4NHJS+0uMIWAfV0HFg0Nz7/2kUO3AKFXGYlj7ak29VjIJAl8oVdpHc+CQK7UileYGnH9xQ+oRGE23JfMvrHFK2ayCaIzTeBGyy1Irf/G7UKcb1ik7PQA4zWLn8QrZTp3lh9qhI3lyshMJfHBc8o9jvHRoDeGvuR0W1X6ksLBnpbbZBBHw0ERKyR9jRjiJNXO+A9dSPD8IH66bmGsEcQp8aBkaQkeCatVkn9wm0CTIEz0oXEyDn9AV/YqznoZwHCrWQhtP036KXe/Yhx8VJ16Yf58dHGcB/V9kFu7q0zQHMoonq4j9gwFo/sV51a2uRitbxVZ7dQMl5htuQm+vsYEiiiWVDH4v0OSI6fA55Tbp8l4FavzQ/2ZwRdyk9fJhG1JyVmj6pjvy7B8jTXRIQ/Frz06oTctjhpyjzwqpk7LCZJ2mjHc7bwf3C+5wOo2B18ZT5vZmIdjO/Ex+1TuupZHlbyfmIb/lbdrCSws/Cl9VCzg+4FS9CwGutL/EFAgZtbuu8YMiA+vfbbmYMYTAENrYndD1fCuVa05OS3YnWbHUSwvjY04S2uOgoFHdkipbdAdzSBWAyN23TIApqaDtIqMVEqd6aLDu1PQXWpjuZ9biAd4Hh3BRJbYl7Znbi3OprntzllYUo/arSuATKCT4QtBJ76dXE+2qDvTeUOke+RmmGHjZc+qCptaymzijPDC3WKscZNZRYLV6ZOUzuSUfxzu+QOlstCsIJpa6pHKat4bSU25hWvm5DBeapRq4LVK1HK3rJ8j+ICOanjgnuH852ROsgMCVvgQIPYt0oA85Eea9XJlEp3lwhOByKqaEkQeDUXYmZRp34bs9n90HL081Le22qQDjgiIp+CL4CSk98PVUWTHKAi11hnIX8u+aFB467wx1T0n8+2foJjqbo7+k4QXXHFXsnC420GHxAIuc+bi7bHNWyIYhVUUUFJYy4kVxB+XjmcHW1jlrSo8iUZdocwD0zUjIyBugJY8910/vUEx2gjyQ9FS4xveX+BSMO7i2Ht/i5QyQ3BEVEA3BxsSWgXexRnt1/IvIDISa3QrJYTt7+HzxNcvwhxn2a7esr+RQRnw+MjBmsEvZBvBiGiOFhd2kRznwbY/u9VPc55grszvgHL2xxFIce83P/t6WXJf1A8yiw2peEMxCovQ4qaLK1pOBjzVgDJuJuRxOUiq3DU2rqzNU540jdam2FE/+LgcZCKs9Tv8wuVD/Hgjj3gFjbqngQ1HJdMvXG6r38vQb7KE2jDBsxYdu8Wb/ZlO3chOvvPYhfGlaRMb4Q0zomX0E7oY5JFChFrrDZt5zCeNZcUeLhNDRqzuq+mWIc49X1JumrDsg4YFnD2tsq1GaXiziHggCragdfWw8Ev121oNxyoGs9CHEKdxgTh74NvTv7taTwC4CdV4KcukRHk7wo4k1FjPwuChRLSHZ7+rdKwQ1fDFYfWpCzkwoCamCUyQurWy9BvC5ftwxqKxR4ghU3PRDIxKFxzld8VAljPkgKUqzbZlQ6lc2NcIm6unfqhoppYwPWOjvZPdSJjpbIOt1Rf4K32MTJgGC+pBWcdw/Fta43vVxvvPNUy/09m703NXnLzwAocFF5z5LPxSF3iWBJZ+YiSGAbD2MX3y1LhJ/6DjPikFbFCk9+YrxqfAGWe3o/6k8fsmOAeIBWxfin9euGvTUZzVeXRZ89AMuBGOnDyggcPlWupVePIduly0KY1EVkFxtPOpwaHs93gtWm3ZgXvEkeeKsqWvpMsKgVvbqKx4BmI63CQwi/gOhL/blpUnLC2croXJ3UbPUXmVzD0NTOPQ2BWCFutMakZYaByovaHbpmPYqhOYlwkNd+Ir43mu85Bp6cz3Uf2Ezro9BYb+hXUTjYFS9vp5shsPRuVtaUfl3LXMa7fykX1GCrY1w15ZTMnXNfgsK1ST85OZjS3gzsGri/0v0a3oXFHbsnaOL03mOw6tzs1NDIKe2efGnJEyk9BtCeApPYmgw1au0STAtVJzyQhq8AutYHiXppix+P2QOFTTP8ecVZelGuUhb0+0I5DMSzDLdZtM7h03jlA/CCUOT7EleafglVyruTA48jTcyJaHqe3u7dmjKZFIjJVDnDp5Ovn8Sg+KbXZcngHo5ZKS11Qim1b8eFik6lNKs+qtny6Mi02OYWA9RoHO8ja6aNyIh4j2fJh4BlpwkD89Wb0NgZdFcTxxoDyqVvI/4X8Tw+KcQMH1AbCS5ch9gADbIk64RH6ieCbyQsslIKBf/ZU7e+z8KVqFbbUqpwAAeRAAAP2ALdg0PELp9XH9poK3qWoqWV+9Dxt2OY89lEr91RDQUZLwBAuPGhlGJd1jDed+R572OIGBbwayQ/RF4V5xFyb8Ql2HiwBhkoC6sNSZooi6V3Yw7TMys31Rg0v8XiULlJNIFtJVZEkm21GlVk5Lv98xT6IKpxfNV6MZ/zEHzCv0dJeXDS+zEHjy7LEPDDS4npnofjg1smUfxq8FDCLyN33S/si+JTRTlpIfncQa+jEKyNrd9WhYC0Gkbe33kGIP2PevgWVarN0aY+jPWHKLvpsiRhBVakzpaRztgErVIfV+Gv8iXV9jRtGJeBPCbuM9CvUJ72LV+23/D8jvV277o+D6tNHQ2XVXMz4XrUloUll42OR4sKEU4dT/+YsIgi/SpT1xxYJJlfaZXPfldebi2eLZ9yVJI1t2eXx0NHngWIYjqkuy/W/IgWbLaSSotbyl6yOXwiQSooBcuMYVsWUWCjX8A0PMhjtSvUR8B47D9EX61AQ62cQkXSNG4ITahY5E/xbn9flsxBHEB8pMN7wsJ6q0U+kEvvFqgJYOe/X6W1q2WsOiydMTUQiDBFRhZ6t3VlN6DHsjdrSS4eD3XJGpz3rQAE20SECpPyApaXn/4YBN6uXGnBsQeeNyk21oFler7XOh4761NBu6nYctJYkQUPoZjmmyGCghhGEvaEn6efYEZp4ez0ukwAAAAAA4YeRAABk3AAA',
  chihe: 'data:image/webp;base64,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',
  p26: 'data:image/webp;base64,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',
};

const TREX_IMG = {
  izquierda: 'data:image/webp;base64,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',
  derecha: 'data:image/webp;base64,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',
  arriba: 'data:image/webp;base64,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',
  abajo: 'data:image/webp;base64,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',
};
/* ---- T-Rex con imágenes (Aspectos/trex-*.png): mismas 4 vistas que el velocirraptor ---- */
// (las imágenes ya están reducidas: 416 px de ancho en vista lateral -> unos 104 px en el juego)
const TREX_VIEWS = {
  izquierda: { src: TREX_IMG.izquierda, w: 417, h: 310, cx: 208, cy: 167, sx: 252, sy: 90 },
  derecha:   { src: TREX_IMG.derecha, w: 416, h: 310, cx: 208, cy: 167, sx: 162, sy: 97 },
  arriba:    { src: TREX_IMG.arriba, w: 210, h: 393, cx: 105, cy: 196, sx: 105, sy: 183 },
  abajo:     { src: TREX_IMG.abajo, w: 210, h: 393, cx: 105, cy: 196, sx: 105, sy: 210 }, // mira hacia abajo, vista desde arriba
};
// Imágenes del Parasaurolophus incrustadas en el código (WebP con transparencia), igual que el T-Rex.
const PARA_IMG = {
  izquierda: 'data:image/webp;base64,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',
  derecha: 'data:image/webp;base64,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',
  arriba: 'data:image/webp;base64,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',
  abajo: 'data:image/webp;base64,UklGRv44AABXRUJQVlA4WAoAAAAQAAAAlwAAbgEAQUxQSDIPAAAB8IZt2zKn9f+d1yQhnqINNDR4HWmpYXVbUnfB6u7ursDyunuL1Ah1NxxqSA1ZBA0kSEhmkjnPF6Rk5rnv+1mfz7uImAB4NL9Dh7aAIW7m9b9tctVrwzvDYoWh++1zU5I2PNkN8SL3+qREUsmnusUJwy7TlJYkKnV/gVlcMLS9t4HcQmnNH4QYcdIaUS2SzQ8WIiYaOrwu6g+pefvC4kL/H7ZGan6wEBYLkHt9w1ZRPw6IB4bdpovaquphscCQe0OjWrn5+jxYHOg3Xdw66o128WD4ptYtPjwGGMqeSFOtJJ/cBha+HWerdZq9Yxw4ry4TdecFz4C7RLWauguw0JWPz8z48uAlTq3JTM2pibAZip4VlUHqmUJY2Nq/kanp/UN3yOJM1Z8WNuRckcpU8rIcBNxQ/q6ojFLvdYGFbNgvmZvZM2w3NSvD1KpTA2bIGyNmSNKYPFi4dp6WOWr6rgGzY2qyUT0kWIb8h9PKOLXhopxw9f5CzJiol4tgoTp5fXambBeu8xqzs/qoQBk6TSSVjabb8hGobjOVDVFfdIWF6a9LszVnpzABtyu71Przg2Qo/o+YFVH3ABaigfOyN6kiTPuvyN6yIQEytLmlQVmmqsNU9JqYtY0X54Soz2dZE/V6KSw8p6yPwvxhAbLzGqPQMDI4hvKJpCIwKkDdZyl7YvrpdrDQHLk0Epq7c2iAOxVFasOFgTEUPyxGQNQ9CKth4PyojMmDhWXI8qjM3C00x6yOyophQTEUPk5Fktp4aW5YiseLkRD1ahEsJF3fi857FWE5dk101hwXEuTf0RydxjMDYqj8SlREmX62PSwgMyKkWT1CcsAvUZrZMxzArWkqOmtGBMPQZpyiI+oehNLQd2a0nu8AC8WwldFaPDgch0Vs+ZBAGArGNSnCVO2IRChKJooREvViMSwMe8yK2tsdQzGyIWrL/hxXkqPCgJJ/NEet8QILgaH7DFGRJt8shwVhZuQ0u0cYjl4Wvbm7hAC4S1TUNl4M/xtKHo2cqPsM5r+9Frjw1vYhGLrChephITiuxoXl/jMUPUlFntp0ea7/SiaIkRM1vhTmu67vO1LivxPXujF7oP9GJd1oGOU75F7jSKPvDF0/FuVC8z9L4bmec5wQNbMHzG/dZzrT3XfHLnNl2TF+A+4R5SR1r8HjhtLHnDKf7b3QnXcq/bb/Sneqh/ht2HJ31h7vtdwr612R+FQRzFeG4tdFOUpNKvXZ9h+6NL7EZyeudWlyJ5+NSrpU/Vd/IffalEvJM71l2P5TUe40/6sM3uox2yFRM7vDfLX3fLfm7+0r4IaUW6kb4GdDzhhRDlNjcmB+2vFL177c0Vf7rXRt5X6eSpxZ51rdmQkfGUpeEeU09UoJzEd7fede1bZ+OrvRveq/ZMosAtZyBgwdX0pTrjXdkIfWm5kBljDLihlaNrPW9Zgt10R9UgHbKjMzAGjXEQDMMmdAXkH+lgCsxa05+HcfLDpkK8zMAKDkgBNOf/nNM487rD1gmTIU7z/22aefeeaZR48fUIkWzVow2J2knCfvNNgWZgCw/cABhz78+6aNUv3G6heObIeMDfrnr1SLqxZV3Xjj8RVdSgGzFiqr5ANVVW5hBmyz60U3Vy3+bRklkZK08h+9czN00FSJLUuiln/55aMHlwC2xcEr/LDiYBgM6Hjcy3PqtSVJSiSpzV+dnMiEHTRNpFomKUriokcOLoUZ8u9OyovJu/PN0PH4V1dJ4pbaSlKf9IC1xrDvVFGtJElx0aP7GaxkkugDalIp8nZ+bLVEUq0mN1yQyMAlzWzVlqQ05+wK7PKNL77Zuc1Z0xpFKqPUB13Nti6BTuNJZZbUpmcqzqj3xaZzRlWLVIapRfsBtjUGG/qzMiVRDXc+lvaDlPp0kagspj4YXgb7I0Ovy7+qVxbJFRvkUSq7a+7vn/gDQ983GxVOKrtU07eHtGTo+zbFLNEnWSc1/eCEAYa+b6dJxUem9XF3mKH8NZKKldx42zZm+eeuFRUztHQosNc8UXGD9Rfn2IiN8UPUG+3bviwqhkzu0KEqtrwTT97p0GFKPJnSofjvzXGE/yjGkbVi3KB+GQb0+SyOvNIeqHgrjszfGzh4VRyp/RPa3JSMI2sPR4cpomJJ2VOMKTihTowf644ADl8XR2YPAAb9EkceyQeK/5WOG9TaUQbD/r+KceOd7WCG4n+m4wW1djgMMIzeLMYIMvVgu5a6PZ0UY4Rm9IcBgKHyqaQYGzTnTzmGFg2VT6UUE6nZRxj+2NDt/l8ZC6i6EbY1MBQ+IsYBJZ/ojK2C2SlLxOBRyacq0VrLvy2tdOCoxicrYa3Crq+uEUNGKvlkJQytt47nLpHIQJHS2kcrYcho/ukfNUokg0NSqh1/YicYMmqwnv+aU6swr5h2YyfAkPltep/zQfWy+sAkV3/zwIndimCGzBuA7kMG3bMxJNRvp/TJBWDIqpkB6PaxGJIPOsPMkH2zRM6F9WIoqPoLcxOGaBq2e6pZwWh4rAKGqBr2XSCGgXpzexiiY4VjqSBSvx8PQ4QNfSc3MwBU6uZ8Q6QNe8wSA8B3dkTULPeKpSl6juLkvjBEvuTon0T6jNI7fWFwsPCodymvr36pHwwOmqHvxDp6i/rtzPYwuGmouD8l+olquiUXBlcTODPpr+RZSMBZs3N9di7MIZzjs3P+Nzm3Ka4cvthn5lS7tz12NlxKHDbPV2L62QqYK4Yu74nydsM1BneG/uoxamwC5oYhcVsT5S9+0NOhMfKZVh3k0EP/v1C9f1yZ0DmuPGAO3ee3hxKuwHDEEtFjY1zqOddnTbcl4Kqh10x/UQsGwVwBih5Mk34i111TAHcNe06VrzShI8wdmB00TZ6adiAMbh84VfQPteTPMLhtuDQl+oZMP1rmnp3jIyXPhsE1HLsyrnR+10c/7OuDsrd89EaZD4oebo4lMBxZI3rn7baWcM0SNmyZf1J3JQAzlwwAyl/3DVV72T57bwPAzBEzFFZuf+htX8u7zWuW/fLUpbvkwE0DsOf9305bJF83TL12l0JzwFDY75RpaXmaJKXGb5851AHs9sD36ySSXtqSlDTrsIRFy2xAFSXK72RaH/eGRclQ/rpIyvvkhkmHJCJkaHNujaggUjP3hUUGdsYSUYEgx5Ugqoben4kKJTWrDywywzcwJGtON0TmkpTCIWpcAhYJQ/lEUrFkhx8VlrER+i4wf4/QDyGhNl9jiKah+1dhWbgHLBpAmxsaxXDw9U6RMew6LRxU6iIYomq51zWI4TgvSjh49f8BJM+NKz8OjtQB1QGZUBapzhNDQW44P8cQ5VubyCCk9WE3RMkwaL7SIaBqzjJDpAuurhH9R9VcV4aol1xbI+9Tq68tgUXMUHJ9Lb3Hx0thiHoCO/ygtN/SWnooDNG3tmMbRJ+l1TC2zJxA539tFr1FquGfnWFw0dD5n/UivURKv97fBQY3DV0uni6RLdATpEhK9R8dWgSDqwbs/2WTJJGUNymp/vNLexkM7ppZv9s/Xaot6QeSWvPNe5f2MpjB8fzOR17/j3k/P371xCbRvS9uuP6m0yo75QAG1w0Aivvt3hbDNztH1Z6Jlg0+NDMAsN4T0nJuSldLmJnBm7YlDvhddIqsHW0G/5qVPOya3u0KH8Gw79dKO0QtPM4MXjaM3CC6o4Un5cBb5Tf+KFep30/KgcfzHhSdmVQK85bB7nPo3S5xZdUxcSV5ZlxpHO0zyxvj0kiPJbDLVIdSN+fBPGUou7tRDi8a1QbmJbO2N68THdLiM0s8hXNrRTlMVT/ZD+YfQ//PlZbTlB7Kh/nGio/7oJlyPM0lZ7aBZw1D5olynlpyZr55xdB/SjPlQWrJCTCPGHaqovyY1lvdYB5pc1OT6Aex8cFCM18YdpshyhdaMAS+MHR+vJH+YPOYInhj/xWivEktGALzgiHvpgb5lM3jimB+6PCO6BXNG+iLwxf7pm64eQE5Vzf5RdSLJTD3DF0/EOWZqo7mA+s11z9LDkPCvQQGzPNP002lcN5Q+VSjb6T0soe7w9wydHs6JR83jSmEuWRo+3BK9FBaC4e59tdlSsvDVPIipwx2Lykvk5PKYS4VPypf6fs+bu01319zert10Bp/zXXsgJVx5aA1cWX3uf76ro9b+f/212eVbtndaT9RzTfmwmXDoYtJH6W54kiYW10/V9pH0isd3QLyTlwo+oeNnw2FwfGcExbIt1TTwzsbXDckTlsu+mbdCXAPhh5z/PNxN/NCr9n+mVgKDwBl/24WPfPWNl4wnJ3yTeNd+Z44stov1OpDYPDCtlN88/M+vmhzZ1J+eaLMDzActEL0yn3wRuVkn1DLjzODJ+zOtFe+7Q5PwHDwItEXVNNdhfCloeITn8wdCPMFkHdFveiNl0s9Ytjha19QdaMTBo8UPUlvTK6AR2B2zArRB1TtKBh8gvYv+GJyhV9gOLpadI+qHWkGz7R/gV6YXAHPwHDUctE1snakGbzT7kX30nqnAt6BYdBU0S1qxekw+PjSTaRL1KpLiuBjQ+8v5BZfaAvzESznmJ9Ed9KaOggJeNpG1YquUBsvgbcNXZ5LyVFqw/2dYL4C0OvFJtEFMjmuAwz+NvR8OS0X05rZHwn4PIEhM1OMHvXjMbkGv1vhwAmKPPXj0QkE8NCvGyNG/XR0AuY/a7PL22LExuXCEADg7mhRa06HIYiJyM3pHQjDkUvFSH24XTC6z4oSlboqB2E0bDuRkdo8HBYGmF2QFCM0a/dwYOj8SD1fFJCySdGh6kYkDMEofIyKzk+7Ixgw/GWZGJlHi4PS7vmoUBvOhyGchisbxYh8t3Ng9pgXlfTTbQPTcTwjQW0eBUNIzc5vFCMxa0BoMGRBJNR4S25wCsc2R4Ca2Q+GsBoGLxSzRSZvzkVozQourBGzpZl9YaGBodOkbJGNN+UhwGan1ojZ0Yy+sBChfFKWlLw510IEw6k1ZBaoaX1hCFP5JGWB+u9xOYYwG05cKmaOT5chVLCCm1NihqjFR8AQLOz8HjNE/fe8QgTcMPBLMRMUxxbAAgbDeXVi60i9PwCGoFn7O+rE1pD8YA8Ywm5oe2eduHWU3h8IQ+gNbe9YJ5F/QKr5vYEwhN/QfvgnkpgmSUlL7twVhjhowIB//bJJLaZWV52aD0M8NEPx3qNfnTK5qqrq1kO6AobYaADadtgyHzB4EVZQOCCmKQAA0IwAnQEqmABvAT5VJI5FI6IhFfrN3DgFRLI3fj49gH8AGhpBS4vLr89+Yv9h95Cvv3L+5/p/+y+6/tTjE+0nwh+3/wP+L/aD5lf8H/l+y/7yPcJ/Xv9hfXF9WPmK/a39o/dZ/1f7ke6X9pf2q+An+df4P/8+1x6q/7oewt+3//09dz9yvhS/rH/F/dL4D/5l/hP/1+6faAcMR/Zvwx/Yf5OeKv4j8Wv2q9g/xz6p/Dflp7Bn9L5YekP9l+VXu1/Hft5+S/vn7k/4H318Jfkp/o+oL+T/1P/U/bzxJNmf+R6gvvZ9S/1n+A/Jb0u/6D0e+vH+V/NH/D/YB/Jf5t/g/y3/yn//+wv7N/r/JW+5f5b/Nfd59gf8f/p3+f/w/72f4T5Cf9H/MfkV7qvzz/If9D/K/kL9hP8i/oX+X/u3+g/8/+I/////8mv7O+xH+qqLcwMp+7WExWsCe2Gx6KEvOCMkUrWtaywPOl8wvToJFDJWZP7dyywhCEA8plZ2JLnbpzhdxbt/utRRF8DxC70GC8whCAPJWciG3PNhNjIGh6zfo+zdDgHby4FNd73tAm7pkygBlcStW1UAp4v+zEB8+7dJRgRZSsYs3nHlvR/IjFl8/dUPdRYBgph/2cExNQ73/jDGLlcm1Jd9B0GYj2pF6c9j4uSR4ru2qVDlznLipED84jL0SGVLH8/vPnYO96/FoWXwwmKshu06d4je4zhVdLhuFlM1r95rC0DswBCckTZTmStVs07yjE9GIu9JGm7p89Pqx/XHh8XEbrGOtYNNJZBfBxRdVkU1Wc6vnAF+U4pJ4jc67l/l+/asUT3qHldBxe3v2U0YA0AMZcd+LYqbkreG08zOgRwxjqSZu0mYYcYHmzUEF7/GZdW4SWk6vJ9brxUWCkl79knRHIefUVtqgclMNCpyvS9dMzBM6wsUXZkZiwSu7+devXIMIz5U95WfIwV/bhruT0STvni8FgetJxxR5fc/IEJhgOQOTYS/1mOU702neCbV7fLYmDuFAzXpisXSKXetZmjm3B7xyqkSlnP88DGCjHTnvgI/R+3WmUuVQPFhL01p+4pXn91h6vEQPwW3VP/gdWGCkTcArM/MaINuko6B3776GBkWah9EH6jLWQi3gtEeT3rdyeyBN3/WPDTZPLiUeydSaCDK/5yb8ri2VvkqqqJNeoBBOAKwL9EpGVzTUbR4SExMHxnVKM/azmm5lOs6zZGo7G3PqECGAAs55QDt1sXh+EicABI06ECaj5SqV9d0belVRS9MrIi5skelONXE1soIRrvzkbjQoyeEOx9bDCB0q5jItn4aJWRFKjC+ff6cgO5YOWlhNJzmaMA9vaIEk7f9fr0lmiJB6Y1OYAzVdaGwftWnK+ru2vYPkx9fkKZwUBoVvG+1xPX87Yx7Fc4dtFVEQkpB28XrTbD71ZDOqPdnXZ2C+OFfA7+Yxi55IKhrPN2bBQzXzDRqU5xFF56yxhBm5znORKuqqJ1g2BoK3qUmggXCou/LUAD+LpyL/eaEZMM5/tpYPyBEB+G/gvwvIiNgY5r8j35kbR3WgrXtkBP8JdkmrYMml2Lp21m4mOo4IeQ14KOhEr18HmoOt34pvZTCzVYwi6zObicgZWda7nImu51ikMZzakoN4rkx6HIwcJgwzzh97yBi/5+yvYoh+pSyFyrf8dCYWQZar7o4rsugqmXcu6ZjWWvFBVe/lCzEMtPw8xBVVxC/GOU1+LV59FwmN1qgY5mGLT1UAdW3zCD2fXK/6njEnWVnFurYqFHYJUpnNfbiXuSMRuB/UWlPLeeglG4nHXMYc1PfoRU4dj2mFOGIwUw0B90tv4Adrsd12s+CDOv7d3xLI8kxm1lvvTCBqQG/3iyfGDIV3D22G+3v6ghEkjPkmuwr/+dbgW7i9KJFVGwNSefmRx4SSKBx/Kwgmw4wEuAT4LikFfZQTHx+Pnrq3sIBDtRt0w65eVKrhgganDTKQoy+44Ujuz7u1KO3UqObQdj81l5MmMjsa+LAWPoXZUr+hq1/+r/eet8i+kg+058yYHXLXACN1bwaXkcX8t02zdlGjG1szmEeVePsNfxZG+WaSrVroBwTwaoSo2WJcx1Mj96xkX/ieFgz45tqu6uM1bQi5Qql+2XHzPRSTTzM8duv71G3qUO+VH6pv/BuHlo1GokABBJTb57tAkgQwk3prXMg5avS/FC7r0Huh4mDuuVG3PMjbGlpVaBXlEgj0vl16BuRKN9/KNJTtbyBuk+4ub3M48k393MvyNnh6qFoVGTHcycTmo00XmHGqouOBRlDB/e2YYQmO2gu8+IB1dQ3p+Tmr5ebRB5wSPGQ99rZsvQcWujaJUNBY9OP45J1rdZE2yWMzj+ml6lBWulqjUkV8QJ0/DsUyAfC0nyvcWcs2FZ/ef3cAdnOa6gZghasJ4r5ZMIHkl7UvyJ6PBQ7Chup1goVGJZD1xUUaUZSWc18v2BNCagKYjxgjOmpP7WN7opBZAiP+P4IhyyEPDOu0SMZ35apAPHMA7se0W/PmiDNobfkAcujzP4IWQ081ZBFijQKda+1Lvub1ifWJ8ptBGokKFXPzMNxmlcUIXXo3oY9jyyg+pyEeINuUSzlhazlkof4mo3UBc/b/ZTjvQzw1n5RQRIMNQMabGssmBPxWrgAbg69bUQxDizFPsunRvgTj8olB4SsUOnXkpIYRNtivA19fKi2DyqUqbadGRP61VQgCYSa3tVu/3Or0awbreMUFNRccdJsYH3/tffFptw81eZNfwuurX9PMx/laBaHigErLPhnSWQs1V9Bak+fR1Aky+WGFVqZmP1u8BU0u/QS9y7zSdjJvIWMPHSJV2smx2SzEsxOqXuNYinBWlP6pFsvoEBM/vNB4cWtuc0UrbEaVAUYb9Ld0QmucKktxIAaQ1GKNEBv6Q1lhslUMiO7XGQYDMrTjUH96QWuqrxWtnDrHvjqfBpmf3y6pj2oL0GqkWI43TtjmHrj3scR2CvFx58m6Gg9Bq/vqRtM1R6k260ssuwi2MDaVc28QM0uRrDydu1VZJMpY7E3pyMin/W1VzcteICa3MhjBuuWIBTWQC3L53XRtSFUFjQYwbcpEpNmaDF/VLM3+O69M22Gf/i907aKifFZAPNJpTvMCtkb9KKvMT0v7fz/pzL4mJfo71+cr/e/edBK3Ovu5GNv4GDtO5FlAeq60HIopt8jjpXriD7nUs8HZ5DRUGmsnMRNLWf9qwH2khVzXdPkLsf27KrvinKGQId+BoB9DRiYx2tYgVWeVp/NUTBUnyXHZ28XGGeHUQLW7XVFKNjld40rOWSHopSzo7iP6ljwJBzaUmapqE6WKemMXFAYY14IfIR1Ar/Z34tTDVmznNZwQOXNbSx2brvDLPVOBk+K6/I13O2HoNn37jIGcKNzUdkh6d6i5WeVeNE2hpCiGlgUfzWA2UC+eRPkJqOQ0blm42wJ/eO3PLhpjZNcvJsCIpMyt9ssafV67qOZzuK/rjfP8GOkaYWlMxubAQ9qEXzg37kn4XiAY1e7xskdistavKor3oHjmX9fNsJKLMHOTMzoACsPzCgqSV+QOSLhH1d7Q3ThH+OFZcEf8b4Q3QWgWzXwXWEzfLnTm8/D5o1Azq01SlL0OANe/LRLs/UEyWFD+bd57qCkmD7tzWNf5zTENME+jRxR8716fJ7pwExoEqhQ4EeiqmjHhItFvWlT+GhAYWT2W+cfLe4MN2x9FAgH0pk1ShBBEBXCz99Y+n5kGB+tZYVxc6BnBWcIO4hMXkXxWRmfCPb86kT9u1gHuhzlhHZTJjSbCg2yNWR5lxIX95MJS/uWbO29F0w9S7FQKSiBYdYqWg47n1Y4iApd6LuiTYn+VxSTSJRYkZOJeD3vZ//BSChgiObyNjpyPTLv2m0uhrnyp00Eeb8ky+MazKZzjVF0RSntSOQizyG4F7x6RSkHgZshcY7Ex23WEFIzRRpLs9sP4+NceH94DU3M5vuRILSZiJkL9/Nvj14nCV0wemvYNFFyqpLMMQr33h3WeqA3XY85MlH1r4yB2qpFcYGEM4namTrW5nzgv5ea3Pda1q0LpQkdX2qH4tPNqFTG/dU54626qCLRPbYrHk32y41Igls8ANeLE/ugsql6OIHvWuB4xXEu94wJ2Xd/j2YkNNZEWVfnif9gBZv2LzXJbHihUXijYax85AI2QGoxab0S80OVQaJlbjkwQMzFeqRuROF0gf3T/1OSspQ0UASnt/mvgacGm59gJGTzDnXR8ZH79r5zS3gv05dlrPFUmX973JnG+3a2VnhpWs25v7tbluls9ETdNz3ZVocLtojiLJJNQOE/x5XSZiOwchC26bDiW5/8BKmWN5HoDSXKNK2XK4AQqL1I7XsoP+kyL6hdZIVsB+98JVn9gWw9vQBJf6S7yKge7ACmTbsnHUfVzACEPxj/QTliq/U/wrZELoxs8b3xSchpXRRJ/8FmTbWojuyJEgMAR7mAw2FCtAZnpLPzG2kAxM2+OpWAREdc+VorrsqJ5nechNzeiN218LMik6jERM+XkfxHgvDJL+PKIYrezl/1vig7uWMvvv3pbJLtHUO6U7c7vsx0eLWlVPR5qxE1C/LtiZwbxO1cYrv3tTHouBY+950WyFd+HPf1ZdfoIYtvPuhfoSy4Vi0rTnVnJ8uSXslEXdL0oEFmjWuBnpVYxBooQPE68Rg7xFixK+voAxNZB/HMcilUxqobV7CraaN/l9hxU5UyGz8kajyJisKsnjRMRtxiaQStQkP2dZjxRVLuaDqMvSqseblLSRv4D5oGYX155i1YEggYpCt5fxDovCVLEHjkwV8CGaZutTfwFBv/ZEn1+9Ury6qvnlJQvzZNz6w/+EQ2f0n02kLfmS/D9DuE6cclOccurBzk5T9keZvCX4ZK8/BgrSK+umCzBf6hWujBR/AhuFe/DIUYQBqTnVt7+Ob8gd1M4sBpSPLy1Y3SBuzFOJ2OV6Lgk8tv2AfP6F9cdU9T24LRg3vOefkERbTL4e51iusEO+g7QzbSE5stomE+wOJYDr6+wQA2gX/qE1dnXcu6DwgbyFMYn8zg9XXlXWuIITV+LOg/ZzfFrF0qH2L//S0/lfBwkyDo0p63fZxM0lK/jysG0XlWmg8SkS7ehU+TfKmh1Fcci/YdYMflmG3l6GTLuQqkl9/C/uR7g+m+m5x/DGgUs8nvjXYj3vjDOoVuqAuGplfmmOS4TYj1iUVJ5atxHknww0ZTxHWMM3txbwQXwzRC99Xmnshpj3+8k44xplfgo08pWLextUh+JjR41HH3ploqvikEDuk5ZmWCawGTnmNOplEbRD/M50WrabYSj5BpwFt+4HSj1/AT3PWdfIofTSux61g0LPtPcDsq1B9J3R0ESsJvNlQ/D0WMaO+Uv6Q/b5VRCiWQxeDW9OfLaTq20DS367JWhuf8PbIKIwv2tI+oyQF/oN1dhVv7pJcdFyzjdnb7YQ330La+WMlCmx5oaWdfYLCjpsATvgqYo8Av9nd52af3nJsV29xZ/EHsy5cc9epZHaOkclMpvifzd95iZSPmcHsWuoAsCPGkCuT8G2YAkW34Eck3e/9RQwI5KSGAPcBDqohexXb1t7bNyvm+6yrsl1+Lk64KxhONVPuWFpJ8CGu+7mp/HzYQgPq9dtCsBv+1EfdGTAD3rnmtB+vNo1R9gVPhgvhIzps+mt5TpFwMnRVzMIfslJCsSff1Gj+MyM7cAtHwJUpuKDGszzz33YDXB/vKp7e9dXbVk8a7s2VKNPA01rUE2P+uMabJexT5SomhE8WkhJj8Xdvcj6Ea1h/BMNDmNxzTf7FtsI98+448OJibYaxV3ZE9rMLgDmUqmjBxNaQmljcTzeFsiQVSuv4OlwXcHCWBFPc61gEDX7CvqXnxnJ8xdud5lGnZKqngb4w1IilQjEqa1w0zdkRsbfzPSq/SBryeL25Y9q2+tpgfaBaAB5LMCzl7wHZ4k+FHZS0OR845K/EIwacMzeZIiezjiywQ9EDxRCaECLxGnZ9vc9rlykQxcItHyddBdTKsu9bAwVWe5bzR27Br4wVcI8jttbAbEG5kvVI3C5jIShtFsCoGMQpA3/fx1+tY75WDoN0tLUj2ta/mpLiJcK+JPzEjGYNhSEROqQi3jOa0y3Xgp9fHZSLdLm7zVgo221GGZYxxnBeczHmktOpPLGnaeqCiYcBZEpWL2ftC/8b4N9oKXcbma0Kjh+jIRFnzy2CJtkQFH58Pts6YQXf+C6KqseSFpawJBbSVvAq9pJHUxWe2MHDz8bi9rqr3kWLRKvhibgX4rs3CLldnfaj24fSY5lVe0qyPndHdnUmiETGRqF+Wx8MLexahg/RCWtUseNE5FmMB6vKGDxhR7lYjwPFx9K9oUdWdAeU2X4nGXwdTOu1WTF3+jz2ccHi7HC3REsFYHM7TnB3gECphoLshVU4Ofk3q7p19IKFv+gNU8vzqfpxdoM9DPf9WYdHWmHBS/21ATj5A2h84v5gBejIK8hkd7e+9dZ0kUkwBjFWSPmu19WEBYFrzVdalWFCV0mIqBlEf66PabbMqiYRdUNvrvPgBQ2TY9lqMvKLnbDelmvHBGa1RvcRsXQwQL60aXgGXyXYYamkOfjNDyH3yV8UbQgQoln7+1VaUVf+g+61uELuhONJD0VlONkIa61X4c8PCBYsLQpuiIlrZiYs7pI8+nhHAN3tMBIZrbpGfjG3bK6PdLMV1IZ8WhyPTJymvozM6iaDn2AKSQu1mZbiUw+9vN3bT7wt17eByG5JhQQFCvI2fqwFwwFQgCtesKg2ynAXvrngukQ9lCtkipjbKf+36p3a9s6KukgKvutZzXAyF3YBVWvmFB+IkClLh5gwKuKU4guZpVOZp2uOY4h9UPVWU8V4c663vdE0EYYQoayDlToZBfafeV5moUZQR4afzyOTxfVWOsYnGACzjmQe/5eeuKjs3uRVmoc0i783lTbPKoVne+u4cOx21A5lFPewf/F4taJflgCNDGT72Az/UB/u0J2BdTEVOEFjexGVtrFFwzGiO48+66R5+A5+d0fgAC6fN00pkdT/oLYaUpWgrzpVAJcbEV1EJvjWN6r0jgpmc2KVW6D70Zsj47NAgMyDbATZR0UpBbJ1zcjFgIyNZdQxAKD8DyB7ZTun172lIBL3zD3QdSDpYpwKP5T/baSJMfT4qjQEeTuC4PsAP0l7VnB3inBn3PRmZkKU5rcj0cT/UUJ1zA7lPxkzCel3pW8xg7bfJNgrdbQ99f2Y4jzTHI/NVesuvJcOXjoeCAHfoSHoJh2N1aNEE2bEbRu+eMLQurDp0C6F9S1TNNe5ZnvmcynICGkMm4Tnr2eyYU3ygjSm0q3Ry9ztixIzFjubgI6qxFCPZVe90zCxsuRS0xy1AwxmXqsi7PaQ2U3UMllRDZ6RzCsJ903024Du3vpteNxIByBuwm375Xp4apuiy2OOEXv5/q1Q3UCiNdY95y8z2yVvX2554ST5TJBSXPZwD0L88l+tlNJrX5k8MiEuGjs6HInYyvEx0YW5ABh2o9jcHCW2zOgngnArZ65hEsbzDzznmwt1DumUqeCvO2lhnks8vV3EvP3Zq5TCtWGBOr4odRCPY0asqmBaMSUmAyhWAIWy9pSLC2KcxVetlONreuHP8JgQbdCjXh9sNp2JUTqD5ztKHB0sug1RVg90sHbSuYj50D6MpKafj+yBjYC5jFwtvRdzc6xfLRsolpoy4H2Gd1GJi9LowQG+Cfdu7v0EjqU6o6JesqO8Dz5JCD/YnJOMXVDxh/fvCv/zDCC3TXKjD7epU52eiZ+92FG1Xk4InzGsWK5oc5qvkVk260bxK+FbHlVYz1XmswBu8pOji0A+DdcVTHLzyrLjTuI+k4ZYxCeP5ji2npds00ASZhrtnUQYdkAeXhwhmjZdQKeUv7cIbOhviqu3Flt3CGp+nQa/76V3ev0H7FmVc46wvIewKMMbpmDkmjPb8ERAJzDZDCx36rfndx6HlS52s3rXdtx1ExLR9K4mpTgOci5j3YyD9vNhMkkQPJ5rBH9EvD26P3Ic1oeJO7X5JcxNsxgHlDKAz9eLvXoRdC71Ism+XoUOPj/XyRHpP0/cETVw3sUhlXwABdH/FbBIDzRpKb9CTxQPAJzzsToieBh0E54FwD+JtHMmvJvVguNqznVvNXe4Uo1deeE+isEOjgZIOZDwi+6+ZODTc2L7pgXmBtH3tAewsl6c6l493+DHXrOYVj1tKqEp48nB7dSGuCDBD5JaEfixz3/PCxO/l4ankCtnNJlJEhqsKfLP9T6jTsKfpIraOZ1MBmPMcvpFURG0UrUj0VvKkOYjliCy0z0ZAN73LyKTuc8BVMFXXANVD81ej3XscvonaVg7V5SEW7QxOoTwsyKgQzJb7bf/XCxs4jPkXv7V0MO9vRT1ziYk1XSZH8puXxaiXYKxZ79NIcNLFeM/imVQ6WFLy+5f91zRzThfpL0FBT2nYxT1WJodUuE0YzNVdf9PJDomnn2DNs1ION1fAAiN5xuLwgUEVgKr2Jfw1KKO5ntnMa8NxJEqINpUKSwEyxX40Eh/K+wBy9lloNBlBLJJVw5NbDauW50KHRNrrmQZX+wbFVZUiItnICTjmQH6cKgI91SBSzK2Ia5Z1DwADMb0nlQcew6LGtviYy10pfy6yWarSp2CAHa87zc6MTWC/6nTZVoWNAY5T19mcsWlyODiJeY2lDep/74s1aQbOT3Nm0NscpyrTtPFFUQTVGsBiwi9/naTSou1zlDLTKgngvTRp3T5TMg835nLosd14xnjI029BrkP1md/9DeXWAQp2WNKamK6kfm1GpvnvDXXTmse3rU4NQJYYMytYsBFhx6xIhmd8mDZd0Ol1XSvAf+MUgm2dY+2mRnWWpMGR/8KAo/k0DKD9o3wXssE8Wy3ZKVLuYLEHFdm3uL/0CDd5IkggbQ1iCcowvPApuVo8UwFmlb4TXUFNHVMsR1OZGpjCmjN0Vo/zlAgrE1SbNH4CpM9ztz6EdXG37sTy4P2K+61FQTEYN2sj5AUXW6sutSr2YMAjgz7iRSRA9IKscmK5iew2+x4X1HxF1dxJUSWxDkfXx0p2JTzteb5aWdyM62tEnH2HIP2dfLVHM4FgkBWRhIBI4v8buwDsGaSu3Mhbx70X5MOiTo1S+D8pAWOrWNYhmIlbw7NBw1r7g9EqCnJqk3/AoFKvgKq579GAm7UZZLMtIrBbArppMlnQq8EJaMfN7UD1jx5xIhb53ylFT1thWLtiy2HAEXoSYias5b09TjZLtgv5q0PezFcQDtgYIAbf6eeaYU3idX11YkTSxucLxBtP10KFveq36waznV5fCS1Uv8i98zo4+TfsCp1tC20ue6G/PW82qWYvym7SdE5vTyexSzBVRbym70xrf0XueVcqf9zDS03AdQ52V9y2jbnWi8evbnmd2ipHnG/NqI4bKePxcQW75zeenmCF4jr3lX0Bxn8IE5DmC4jwe31k7QBoJX/WcCnNyA0qSn3PSPJOpAfbLZUulPxpVk8fktXHIxYJiFVDJI8XoLRwXLvMynnUV5tH2icCEyDYNW45sZBmbgxAU8FhvlAGK4cikjw4+c5DlaZw/g9cviAa1UFa98WXTq7sD1u73WZ2JymJ4w7dbP8Z/wBDLCHeOHSYOq6/XL/nwF/OV8+EFjIIHm8/yCQNPp9zGVnSotUC/8SRv8RmKg8JRUGTq21NODXinbQLgmWuRK1Q1njiaQIm7gP3D/NtQS+LwVud9xZ7jiEbSBNo4A47/ThtvUHl5GRdVm/OSJu/YzcnAlN4K74Itgw/E7UEFPoHHSihJwvMaSKjWclVZAH7UhhxdQgcC0cE3iMCbrGYtsxl0+cVyrrhuwD6FvjAJ8DSjksprQm3WGGMI9HzV6v4iz3LYTd5AV6SuN8ZZPZDCOAxu25LhTb5sShzWkz34qLnpeTL9vtsScZTTELyKfyQFDP1KDmztct3uQR0jFtH2lfvUGYDX8tWPqraV0Eph4ahdbjvOXhQzkiisdtPoTkSP4mg0/LDxxzACX+Uz3BS4567or1HR3Qlx8WBVADChoz2begLIIseB/a4BNpfQyNFveeC7pyK3c4pC6YngwK1X2Qa7Mzfa4BZuNAKXHiv0t1PXdEb7RAx0DzQVehF9kcRP+8W+MJS0gp6gNY19i9Zo2OvG2HMcS5w3Yo+8zfJbX9fB7MTqSfUaygogCJaa3z1GnZJbACDD7yIkHXE3mvRnWBzKtWvvVP4vk+cDKjuufiWwSMZyiXmM7LonlJuBsmMg3ot4H3YPv48wdwFtDUOoetWsfnHOzOQXiXuqhhr48lsirlldsORjIue5DwaR6N0mgO2gmb51Xgct+NZwFavPYsa3s0s4qOwY1/9I9gKuN7FNS9Smy9RLYkRDZQefMKb17bQ5LQwdqHf6A2kqDuItk3Oq3vcLxLAcab91/m91WJTlSkHKhmBYZg5GYvHKXLA7rTBfM8fWWekPV+3r7asVCcqBueS/Q3XQVcOUilYiJx2aG+Y/ojpflSpar52MoM6sJu6O1R74AnxlUXRvq/Wjk7Xom2rIP55+MaX0EUresfGsg6ooCmWpY0vDAJaCOVd4njjF45AnKACrVrkglCAr5qaEzH5E23GAVzxKw47s1t8WtZ+Uh9Im4RaYK0Qj9QZhE1oqtOjgpotNlfxNOeicfJxSCVj1OhSHh9FRNCMiYpzx5sjmZQzxhXG/O1eM6R0LBythnkqJWHEW/YmpBpEZwiCEEBpPXerdNuxA9kMcqRbPSXkBfct38A79AQpEjBwpAwQBWb6zTd7KkE5J1NtdCnTI8PYpsJdNayaQJ2CUZBZRdtkShPHajt72vPyEUmfGJf0MQ+v4Nj86OtH9DcAsoS2VF+sV58fO0pTHX3B+eURy6BrWYXgHYr/m5ePxDkKElEW4oAecypMbb+HEMMfxpJsDyXGhLHb1heNcE5muHYpObzJoqxBqxTuIrqGP5G1anbUfdg6D6EDZJHuyOIKM5n48iPTD4Sib/3HdXbmA0b0b19PSMoyei327fOAEnG7YlVGN8xZv+vvcijdpsJK3jHkcXJZUObpymYMSP9Z3rtu2JYCzRiE3C/fhrhsmfkjgmDDOuTsmc0AmPRl03tBQmAZWcue2g1FC/XZPMMnVoSx/B+rJYZaem2tCyxd6ORmWSE2x6bF6d/jWr0uVlhJRcz/g2Rl2nlSjRzi3V/DXVRNIqHVU122lyvrOhzErSRwG2DJ+BNaTrgneeppfvDEKQzq1OxX00G2JZaVdrjr0x8ukqwZf6l0jbe2zPJ66qZfccmcty85UDT6zxEzQ42YqbF229LUVP+Qm6HFOZp83BEr30mRWk4WsxQNvBkLRs9sSeBCj9byhvhl/ymEuB1E2tJV0t8NQWcA/yGDGhNT0inPM0iOM97N/vm4IjABNaKFmrv6XMFZAT5LghKcyvYXhsKbZAshBRJi5NstWA5Ru/XQH+iZFlG/So9Mp1ggIAYX6hDZC2N+/kjaxvvGv0rxA0OnjAEDhrEtBrzQhESiQbAqn/734eG8G1XinU67O8RFkpuDYjuACZvFqhIGA3kmqWt2SQjIU43vP9AR/WcYh6cav1NrO5grkdOpEOj46UdoYgo/TBX7+G08Vm9bzGSmA146yqglGJE/yfIKTfYiyz9Ta6L0KYWAImQ4XDOiYwi1d8FMBuZBlhQ4ZlYFDcmrfBHAvMufzo7QLeuVWZ249ii7LZsaZgtF+tkI/I1edvSzBUCU6/XHQHSQgGC8mFztV0kilTk3FLwNcIFRe7y78sr72yzxEEYapseRKt01FdJcCKmavsId2fNLhFmaCvZD6wSS+rnU24KT2thiNXQIsNAY6I7BJxe+ZgqlSRIft3e9ytk5Onp7kYOYDwunUtmQNL96vTzvH4O7Rd6LD++7Vugele9FYXdeGeZjpHW/Q5L2V6FloivRDbEh3LVPcZgMtBCO0PO94qjIRffPvH80xYLgh5MvsqSQyxHc0KK4VNvBF5jOgvCfLB8ehMN3JpdYgLfmdxLznATKQXMW/E9QmMEk4YCqlNOY0Igdxmu7ShopEPzQJ8i1yIEVKov6nwVARSjTt8r5XS6aig3Yud6Asth3gfxPtcGOcR5BMZALsBcmizrQewt/h+MVYBnS3yRRxq30j0VN+RWx6Im5IR/ntOSVLgYwQPc2SzwF3pU36z1HmereI/xo7IRR6Slw72G7bzdM7czE4Cr4Uf6uKVcGlzsUnzX3RANHl9liJ7T9tA+3NW2AgIbfVeUyizXFiMEQkIOKtDyOLTxJe8loThsLARVjwCTKFkF4Y94nWoLpV5pOZqG8uopf8ea98GBZgtnvQSCesYrVq7aiTPXfnFDWBEwgOKiaRybYfuDDweGquc3UlkcnEjAmLTilOYdB9PRR5GsnGxctSgy6hJiQs/yMeVc66uURWHIUfImn3SXMeWeY2VUuYPOrlUkgK08AD0WyvtlCArpT2xACPcjzyEruO86aQEcoDRNnUYZaFDxYImLs6Sy5TLRVjdvtynA8kcaR9MvW6mGSXLxj6j0yuJePnXLiUtVimLI7LdBwwv3cLLJCm4CR7i7L6WLLnYMzgAx20ySDxu9wi5uH9sLGAc0xpOYPBu4UaRYnQ7ShJ4pb/cuIKElBue+J+SWKHit4ro+85WaFemrFSg9yeFaThr6PZ4Afec6lWvWhxUZquQZIif9zZ+RacsRthy+3sQp9gMxR0hRmsd8gn+n6A2DSv6/li7KRgrzy56KYdjzDUdor0EzYyEAtZh/PVnnDSAOnd28B++x1sqAJ+/NHC/5p+uPTp0EadcoP9cwNBxhn20hB8rRCfj6gjIOv6ywzAhYfa0Tdc+Cd6dCbWpletjF4lgOG3X94d+i0fViS6vD+EzLLZt7zukm362qLhPaKepZej6FP2oDrw6GwcuVrN8XJ3nnEWhOhUjkvKxGPzPbORDW7g/c/+ETGlvwKXOBO4+rbeWykd3/95iXdWIS4x+NqC/1VX208WjaezZKWPouL+290Hil4TVlwdctXd2pN0cfAReS9BRltB0dDAFZ5PGeKGBHT5pW909Lp63rdb7Z4St4xKvcKa5zQqIRObJArN5txTr/QyI6kxbN06ALK5JPAJXkGE0Te0DG5wHZcF5uYWRAcKXA9r8kJYhiA3phP29bdk2qL8ieL7rBGfyAaDrjLfoW1t2SBdM07FAv8NAeSiNn+GfftFQMLfp6NIsbchZIna7sLp1EUWBjqN8JrC1D9Dq6ydAcCQ4cb8xiVV2Y4pJO3EN8tJNJm/jArKTPWU4qWyCfpRWUYAZxu/MHhJjeLLEYIGSP6LwEzQgQ6WX0UXfplOv1Sr3OdVZqC9bDDgTuvyQR74XDDZwOF/uUOuctltGGHBxysOKV3vFn+VTnpeUJpWmJzlcvyHrAR2xqVxz/bNuFSpgWj2UAetkzrByMp51v6F98LxiPD8iA8N6yz9SfMcg0qjXmHHXWhOnYhcS6ru6B8Ykn4xR+3YJqstby5jzNTYiORFVivGmSe7bEtNug9BDaBT36HkCjKsqjo5QYGGHyAHpKqs5Jffk6xpTBd+soXQyj6nt5G4PSh0GnqKgsRdy7Kqvy0ba5bmcQ+Efn5ALublnxULre9UkKXi1C+BQcbV8uhCtNh+2Eskwk6VzZx7Xk73EMU/86jKJKbZtlFr0LgGLNUe0Y4kHsS2nQ5QJGisw5lepsjf5vLEIwjhLo42MxDgi/AomGW5hCAwOWvxAaSMBVtZEIMufWJv85N0ZIvtkN0OiHMv7sW0em9Z+XxQml3fHVX94Gmx2jdzBJATSJhkh5CeEfRJ/E9VlB3E8T3F0z4Fh/er8q0Qv6fhvjXGd81tDiZGBD25uP4o7kEYjsPkda+Ad+GTDC8rKb7MwLHD+qvmisfdMDmDW8wZbq97UINwmUmBRRJfeUoNWqfeMw7vHav9zHLbGeSgo7YBPjfeQ7uh1Y4R7E4/eFpXIVpN+m9xI1zis75d8CHeE+Z02orZkE7byXnKNf6NJSEXxMhDzNukJ7zsGqXvvcNZCms4AQYsco7DLTLWLXF+1Jv3BeCNdQnP26vrJncDoAJntLsosScnCjfGPlzszrX7DwkuFFFh6tTYCe3tdVRfsBzHYeZ5QPkjYG5Ks8NGMT0R4gI96as/KMPnq15Ay7SPV//+jdf/6M9///RdgA22AAA',
};
/* ---- Parasaurolophus con imágenes: mismas 4 vistas que el velocirraptor y el T-Rex ---- */
const PARA_VIEWS = {
  izquierda: { src: PARA_IMG.izquierda, w: 345, h: 314, cx: 172, cy: 173, sx: 157, sy: 134 },
  derecha:   { src: PARA_IMG.derecha, w: 347, h: 314, cx: 174, cy: 173, sx: 193, sy: 125 },
  arriba:    { src: PARA_IMG.arriba, w: 152, h: 367, cx: 76, cy: 184, sx: 72, sy: 168 },
  abajo:     { src: PARA_IMG.abajo, w: 152, h: 367, cx: 76, cy: 184, sx: 80, sy: 199 },
};
// Aspectos de montura con imágenes: k = escala, shV/shS = tamaño de la sombra (vista vertical / lateral)
const DINO_SKINS = {
  raptor: { k: RAPTOR_K, views: RAPTOR_VIEWS, shV: [13, 26], shS: 36 },
  trex:   { k: 0.25,     views: TREX_VIEWS,   shV: [20, 40], shS: 50 },
  parasaurolophus: { k: 0.25, views: PARA_VIEWS, shV: [16, 34], shS: 40 },
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

// ---- Tanques con ilustración: se ve el mismo tanque que se elige en la selección. El personaje va DENTRO, así que no se dibuja. ----
const TANK_IMGS = {};
function tankImg(id) {
  let i = TANK_IMGS[id];
  if (!i) { i = TANK_IMGS[id] = new Image(); i.src = TANK_IMG[id]; }
  return (i.complete && i.naturalWidth > 0) ? i : null;
}
Object.keys(TANK_IMG).forEach(tankImg); // precarga
const TANK_DRAW_W = 90;      // ancho en pantalla (px de juego)
const TANK_GUN_UP = 22;      // altura aprox. del cañón sobre el centro (para que las balas salgan de la boca del cañón)
// Devuelve false si la imagen aún no cargó (entonces se usa el dibujo simple de siempre).
function drawTankMount(ctx, A, rider, v) {
  const img = tankImg(v.id);
  if (!img) return false;
  const K = TANK_DRAW_W / img.naturalWidth, w = TANK_DRAW_W, h = img.naturalHeight * K, cy = h * 0.62;
  // La ilustración mira a la izquierda; se voltea hacia el lado al que apunta el cañón (puntería), con un giro corto.
  const ang = rider ? rider.aimAngle : (A.th !== undefined ? (A.dir > 0 ? A.th : Math.PI - A.th) : 0);
  const c = Math.cos(ang);
  if (Math.abs(c) > 0.25 || A.tkD === undefined) A.tkD = c >= 0 ? 1 : -1;
  const f0 = A.tkF === undefined ? A.tkD : A.tkF;
  A.tkF = f0 + (A.tkD - f0) * 0.3;
  const fv = Math.abs(A.tkF) < 0.25 ? (A.tkF >= 0 ? 0.25 : -0.25) : A.tkF;
  const sp = A.sp || 0, sw = Math.sin(A.ph || 0);
  const bob = Math.sin(Date.now() / 420) * 0.5 * (1 - sp) - Math.abs(sw) * sp * 0.8;
  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(sw * 0.012 * sp * (fv >= 0 ? 1 : -1)); // leve cabeceo al avanzar
  ctx.scale(-fv, 1);
  ctx.drawImage(img, -w / 2, -cy, w, h);
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
  if (v.kind === 'tank' && TANK_IMG[v.id] && drawTankMount(ctx, A, rider, v)) { CUR_Z = null; ctx.restore(); return; }
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
      if (v.id === 'parasaurolophus') { // cresta tubular que se curva hacia atrás
        ctx.strokeStyle = c2; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(25, -14); ctx.quadraticCurveTo(22, -27, 5, -23); ctx.stroke();
      }
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
  const muzzleDist = isTankTurret ? 36 : 20;
  // en el tanque, al apuntar hacia un lado la bala nace a la altura del cañón dibujado
  const muzzleLift = isTankTurret ? TANK_GUN_UP * Math.abs(Math.cos(p.angle)) : 0;
  const muzzleX = p.x + Math.cos(p.angle) * muzzleDist, muzzleY = p.y + Math.sin(p.angle) * muzzleDist - muzzleLift;
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
