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
  { id: 'male',   name: 'RECLUTA MASCULINO', color: '#7d8c72', accent: '#c9d6bd', desc: 'Equilibrado. Puntería estable.' },
  { id: 'female', name: 'RECLUTA FEMENINA',  color: '#c07a2e', accent: '#f0c98a', desc: 'Ágil. Recarga más rápida.' },
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
    objectiveType: 'survive', surviveKillTarget: 25,
    zombieTypes: ['rider'],
    palette: { ground: '#241c14', accent: '#302418' },
    objectiveText: 'Elimina 25 zombies para llenar la barra al 100% y luego dirígete a la zona segura. La criatura no puede repararse.',
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
  absurd: 'Avion.mp3',        // Fase 3 — VEHÍCULOS ABSURDOS
  final: 'Music_robot.mp3',   // Fase 5 — BATALLA FINAL
  finalx: 'Music_robot.mp3',  // BATALLA DEFINITIVA (tras el "NO" del Admin)
  kills: 'Music_robot.mp3',   // MODO ESPECIAL — RECOLECCIÓN DE BAJAS
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
  MUSIC.play().catch(() => { /* algunos navegadores requieren un gesto previo del usuario */ });
}

function stopBossMusic() {
  musicStarted = false;
  currentMusicKey = null;
  MUSIC.pause();
  MUSIC.currentTime = 0;
}

const MENU_MUSIC = new Audio('Menu.mp3');
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
};

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
  MP.conns.forEach(c => { try { c.send({ type: 'players', players: MP.players }); } catch (e) { /* noop */ } });
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
      // Estado de otra etapa (p. ej. del jefe final mientras aquí aún no empezó la
      // batalla definitiva): se ignora para no mezclar jefes de distintas fases.
      if (data.sid !== undefined && (data.type === 'zombies' || data.type === 'enemies' || data.type === 'objective')) {
        if (!GAME.level || GAME.level.stage.id !== data.sid) return;
      }
      // El Admin da la señal para que la batalla definitiva empiece a la vez en todos.
      if (data.type === 'final-battle-start') { if (GAME.screen === 'screen-challenge') startFinalBattle(); }
      if (data.type === 'players') { MP.code = code.toUpperCase(); MP.players = data.players; mpUpdateLobbyUI(); }
      if (data.type === 'full') { mpShowJoinError('Esa sala ya tiene 5 jugadores.'); mpLeaveRoom(); }
      if (data.type === 'begin-selection') {
        MP.takenColors = {};
        // el Admin puede arrancar en otra etapa (modo especial "Recolección de bajas")
        if (typeof data.stageIndex === 'number' && data.stageIndex > 0 && STAGES[data.stageIndex]) {
          GAME.phaseSkip = true; GAME.stageIndex = data.stageIndex; GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
        } else GAME.phaseSkip = false;
        buildCharacterGrid(); showScreen('screen-character');
      }
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

function mpResetState() {
  if (MP.peer) { try { MP.peer.destroy(); } catch (e) { /* noop */ } }
  MP.peer = null; MP.isHost = false; MP.code = null;
  MP.conns = []; MP.hostConn = null; MP.players = [];
}

function mpLeaveRoom() {
  GAME.phaseSkip = false;
  mpResetState();
  showScreen('screen-menu');
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
  MP.conns.forEach(c => { try { c.send({ type: 'begin-selection', stageIndex: GAME.phaseSkip ? GAME.stageIndex : 0 }); } catch (e) { /* noop */ } });
  if (!GAME.phaseSkip) { GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 }; }
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
  if (doneIds.length === MP.players.length) {
    MP.stageDone = {};
    MP.conns.forEach(c => { try { c.send({ type: 'advance-stage' }); } catch (e) { /* noop */ } });
    advanceStage();
  }
}

function mpUpdateStageWaitUI(doneIds) {
  const list = document.getElementById('mp-stage-wait-list');
  if (!list) return;
  list.innerHTML = '';
  MP.players.forEach(p => {
    const id = p.isHost ? 'host' : p.id;
    const isDone = doneIds.includes(id);
    const row = document.createElement('div');
    row.className = 'mp-player-row' + (isDone ? ' is-host' : '');
    row.textContent = p.name + (p.isHost ? ' — Admin' : '') + (isDone ? ' ✔ en zona segura' : ' — jugando...');
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
    vehicleDef: level.vehicle ? level.vehicle.def : null,
    vehicleColor: level.vehicle ? level.vehicle.mpColor : null,
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
    s.rAim = lerpAngle(s.rAim, s.aimAngle !== undefined ? s.aimAngle : s.angle, k);
    ctx.save();
    if (s.dead) ctx.globalAlpha = 0.35; // cuerpo apagado para el jugador eliminado
    if (s.vehicleDef) {
      const remoteRider = { color: s.charColor, accent: s.charAccent, aimAngle: s.rAim };
      drawVehicle(ctx, s.rx, s.ry, s.ra, s.vehicleDef, 1, s.vehicleColor, remoteRider);
    }
    else drawHuman(ctx, s.rx, s.ry, s.ra, s.charColor, s.charAccent, 1);
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
}

function bindMenuActions() {
  document.body.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    requestGameFullscreen();
    const action = btn.dataset.action;
    handleAction(action);
  });
}

function handleAction(action) {
  switch (action) {
    case 'goto-character': buildCharacterGrid(); showScreen('screen-character'); break;
    case 'goto-settings': showScreen('screen-settings'); break;
    case 'goto-controls': showScreen('screen-controls'); break;
    case 'goto-credits': showScreen('screen-credits'); break;
    case 'goto-mode-select': GAME.phaseSkip = false; showScreen('screen-mode-select'); break; // JUGAR siempre empieza desde la etapa 1
    case 'goto-mp-join': {
      const modeErr = document.getElementById('mode-select-error');
      if (!mpIsOnline()) { if (modeErr) modeErr.textContent = MP_MSG_OFFLINE; break; } // sin internet no se entra
      if (modeErr) modeErr.textContent = '';
      document.getElementById('mp-join-error').textContent = '';
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
      GAME.phaseSkip = true;
      GAME.stageIndex = GAME.phaseSkipTarget;
      GAME.run = { rescued: 0, kills: 0, totalKills: 0 };
      if (STAGES[GAME.stageIndex].special) {
        // Recolección de bajas: se puede jugar en solitario o en multijugador
        const modeErr = document.getElementById('mode-select-error'); if (modeErr) modeErr.textContent = '';
        showScreen('screen-mode-select');
        break;
      }
      buildCharacterGrid();
      showScreen('screen-character');
      break;
    case 'back-menu': GAME.phaseSkip = false; showScreen('screen-menu'); break;
    case 'goto-vehicle':
      if (!GAME.phaseSkip) { GAME.stageIndex = 0; GAME.run = { rescued: 0, kills: 0, totalKills: 0 }; }
      GAME.phaseSkip = false;
      openVehicleSelectForCurrentStage();
      break;
    case 'vehicle-next': afterVehicleSelected(); break;
    case 'start-stage':
      if (mpIsActive()) mpMarkReady(); else beginStageIntro();
      break;
    case 'stage-intro-continue': startStageGameplay(); break;
    case 'resume-game': togglePause(false); break;
    case 'restart-stage': togglePause(false); startStageGameplay(); break;
    case 'quit-menu': fullReset(); showScreen('screen-menu'); break;
    case 'retry-run': fullReset(); showScreen('screen-menu'); break;
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
    case 'kills-exit': {
      const wasMp = mpIsActive();
      fullReset();
      if (wasMp) mpLeaveRoom(); else showScreen('screen-menu');
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

function buildPhaseGrid() {
  const grid = document.getElementById('phase-grid');
  grid.innerHTML = '';
  document.getElementById('btn-phase-next').disabled = true;
  STAGES.forEach((stage, i) => {
    if (stage.hidden) return; // la batalla definitiva solo se alcanza con el "NO" del Admin
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${stage.special ? 'MODO ESPECIAL' : 'ETAPA ' + stage.id} — ${stage.name}</div>
      <div class="pick-card-desc">${stage.objectiveText}</div>
      <div class="pick-check">✔ SELECCIONADA</div>`;
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
  CHARACTERS.forEach(ch => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${ch.name}</div>
      <div class="pick-card-desc">${ch.desc}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawHuman(c, 90, 60, 0, ch.color, ch.accent, 1.6));
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
  VEHICLE_SETS[stage.vehicleSet].forEach(v => {
    const card = document.createElement('div');
    card.className = 'pick-card';
    card.innerHTML = `<canvas class="pick-card-canvas" width="180" height="100"></canvas>
      <div class="pick-card-name">${v.name}</div>
      <div class="pick-card-desc">${v.desc}<br>Vida ${v.hp} · Vel ${v.speed}</div>
      <div class="pick-check">✔ SELECCIONADO</div>`;
    const cv = card.querySelector('canvas');
    drawPreview(cv, c => drawVehicle(c, 90, 55, 0, v, 1.15));
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

function drawHuman(ctx, x, y, angle, bodyColor, accent, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
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
function drawRiderFigure(ctx, bodyColor, accent) {
  ctx.save();
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

function drawVehicle(ctx, x, y, angle, v, scale, mpColor, rider) {
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
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 16, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  const [c1, c2] = v.pal;
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
      ctx.beginPath(); ctx.moveTo(-24, 4); ctx.lineTo(-24, 16); ctx.moveTo(-8, 6); ctx.lineTo(-8, 18); ctx.stroke();
      riderSpot = { dx: -2, dy: -9 };
      break;
    case 'tank':
      // Solo el casco y las orugas: la torreta (con el artillero) se dibuja
      // aparte más abajo, con su propia rotación hacia la puntería.
      ctx.fillStyle = c2; ctx.fillRect(-26, -14, 52, 28);
      ctx.fillStyle = c1; ctx.fillRect(-22, -10, 44, 20);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      for (let i = -20; i <= 20; i += 8) { ctx.beginPath(); ctx.arc(i, -16, 4, 0, Math.PI * 2); ctx.arc(i, 16, 4, 0, Math.PI * 2); ctx.stroke(); }
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
      for (let i = -18; i <= 14; i += 12) { ctx.beginPath(); ctx.moveTo(i, 10); ctx.lineTo(i - 3, 20); ctx.stroke(); }
      riderSpot = { dx: 0, dy: -15 };
      break;
    case 'ball':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = 2;
      for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
      riderSpot = { dx: 0, dy: -17 };
      break;
    case 'case':
      ctx.fillStyle = c1; ctx.fillRect(-26, -12, 52, 24);
      ctx.strokeStyle = c2; ctx.lineWidth = 2; ctx.strokeRect(-26, -12, 52, 24);
      ctx.fillStyle = c2; ctx.fillRect(-4, -12, 8, 24);
      ctx.strokeStyle = '#e0b13f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = -20; i <= 20; i += 10) { ctx.beginPath(); ctx.moveTo(i, 12); ctx.lineTo(i, 22); ctx.stroke(); }
      riderSpot = { dx: 0, dy: -16 };
      break;
    case 'horse':
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(22, -6, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-14, 20); ctx.moveTo(10, 8); ctx.lineTo(10, 20); ctx.stroke();
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
      ctx.rotate(rider.aimAngle - angle);
      ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#20241c'; ctx.fillRect(0, -3, 27, 6);
      // el artillero (tu personaje) asomado por la escotilla de la torreta
      ctx.fillStyle = rider.color; ctx.beginPath(); ctx.arc(-3, 0, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rider.accent; ctx.beginPath(); ctx.arc(-3, -3, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (riderSpot) {
      ctx.save();
      ctx.translate(riderSpot.dx, riderSpot.dy);
      // El personaje mantiene su lugar sobre la montura, pero su cuerpo/arma
      // se orienta hacia la puntería real (mouse), no hacia el movimiento.
      ctx.rotate(rider.aimAngle - angle);
      drawRiderFigure(ctx, rider.color, rider.accent);
      ctx.restore();
    }
  }
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
    speed: type === 'rider' ? rand(110, 150) : rand(48, 82),
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
  } else if (mpIsActive() && stage.objectiveType === 'killStreak') {
    // espectador: la cámara sigue a un compañero vivo
    const t = mpSpectateTarget(level);
    if (t) { level.camera.x = lerp(level.camera.x, t.rx, 0.12); level.camera.y = lerp(level.camera.y, t.ry, 0.12); }
  }

  // Un jugador eliminado no puede "completar" la etapa con su posición
  // congelada de cuando cayó (p. ej. si murió justo parado en la zona
  // segura). Eso lo sacaba de la pantalla de eliminado hacia la de espera
  // sin poder volver, obligándolo a reiniciar toda la etapa para salir.
  if (!level.dead) checkStageCompletion(level);
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
  v.x = p.x; v.y = p.y;
  const face = p.moveAngle || 0;
  // solo se suaviza la rotación visual; la posición sigue al jugador sin retraso
  v.angle = lerpAngle(v.angle, face, clamp(dt * 12, 0, 1));
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
  return Object.values(MP.remoteStates || {}).filter(s => s && !s.dead && s.rx !== undefined)
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

function killStreakBestKey() { return mpIsActive() ? 'ez_kills_best_mp' : 'ez_kills_best_solo'; }
function killStreakBest() {
  try { return parseInt(localStorage.getItem(killStreakBestKey()), 10) || 0; } catch (e) { return 0; }
}
function killStreakSaveBest(n) {
  try { localStorage.setItem(killStreakBestKey(), String(n)); } catch (e) { /* sin almacenamiento: no pasa nada */ }
}

// Tipos de zombie que pueden aparecer según el tiempo de partida (más variedad con el tiempo).
function killStreakTypes(level) {
  const t = level.time || 0;
  return t < 40 ? ['walker'] : t < 100 ? ['walker', 'walker', 'gunner'] : ['walker', 'walker', 'gunner', 'rider'];
}

// Solo lo corre quien controla la simulación real (solitario o Admin): sube la dificultad con el
// tiempo, mantiene la cantidad de zombies y, en multijugador, detecta cuándo cayó todo el equipo.
function updateKillStreak(level, dt) {
  if (level.subPhase !== 'play') return;
  const D = level.diff, t = level.time;
  D.speed = Math.min(1.5, 1 + t / 360);     // hasta +50% de velocidad y cadencia (a los 3 min)
  D.dmg = Math.min(1.6, 1 + t / 300);       // hasta +60% de daño (a los 3 min)
  D.zombieHp = Math.min(2.5, 1 + t / 150);  // los nuevos zombies llegan con hasta 2.5x de vida
  const players = mpIsActive() ? Math.max(1, MP.players.length) : 1;
  const target = Math.min(60, 18 + Math.floor(t / 10) + (players - 1) * 6);
  level._ksSpawn = (level._ksSpawn || 0) - dt;
  if (level.zombies.length < target && level._ksSpawn <= 0) { level._ksSpawn = 0.6; spawnZombie(level); }

  // Multijugador: se anota cuánto aguantó cada jugador (momento en que cayó)
  if (mpIsActive() && MP.isHost) {
    if (!level._deathT) level._deathT = {};
    if (!level._roster) level._roster = MP.players.map(p => ({ id: p.id, name: p.name }));
    if (level.dead && level._deathT.host === undefined) level._deathT.host = level.time;
    MP.conns.forEach(c => { const s = MP.remoteStates[c.peer]; if (s && s.dead && level._deathT[c.peer] === undefined) level._deathT[c.peer] = level.time; });
  }

  // Multijugador: la partida termina cuando cayeron TODOS (el Admin lo decide y avisa al resto)
  if (mpIsActive() && MP.isHost && level.dead) {
    const someoneAlive = MP.conns.some(c => { const s = MP.remoteStates[c.peer]; return !s || !s.dead; });
    if (!someoneAlive) {
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
    if (subEl) subEl.textContent = ks
      ? 'Modo espectador: mirarás a tus compañeros hasta que caiga el último jugador.'
      : sub + ' Los enemigos ya no te atacan. Presiona "Volver a jugar" para reaparecer aquí mismo.';
    const reviveBtn = overlay.querySelector('[data-action="revive-player"]');
    if (reviveBtn) reviveBtn.style.display = ks ? 'none' : ''; // en recolección de bajas no se revive
    const specBox = document.getElementById('spectate-box');
    if (specBox) specBox.style.display = ks && mpIsActive() ? '' : 'none';
    if (ks) level.spectateId = null;
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
}

// Revive al jugador local en el mismo lugar donde cayó, con la vida al
// máximo y un instante de invulnerabilidad para no morir de nuevo al toque.
// A partir de ahí vuelve a ser un blanco válido: los zombies y demás
// enemigos vuelven a perseguirlo y atacarlo con normalidad.
function reviveLocalPlayer(level) {
  if (!level || !level.dead) return;
  if (level.stage.objectiveType === 'killStreak') return; // recolección de bajas: caer es definitivo
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
    const killTargetReached = level.killsThisStage >= stage.surviveKillTarget;
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
  cancelAnimationFrame(GAME.rafId);
  stopBossMusic();
  if (mpIsActive()) MP.readyChoices = {}; // que no queden "listos" de la fase anterior
  GAME.selection.vehicle = null; // que nadie arranque la fase nueva con la montura vieja
  const lv = GAME.level;
  if (mpIsActive() && lv && lv.stage.objectiveType === 'findNPC') GAME.run.rescued = lv.rescuedBase + lv.npcs.filter(n => n.found).length;
  const nextStage = STAGES[GAME.stageIndex + 1];
  const isLast = !nextStage || nextStage.hidden; // la batalla definitiva no es una etapa "siguiente" normal
  if (isLast) { return; } // el final se gestiona vía la poción
  GAME.stageIndex++;
  openVehicleSelectForCurrentStage();
}

// Etapa 5 en multijugador: al derrotar al jefe final, TODOS los jugadores
// llegan a esta pantalla (cada uno a su propio ritmo, tras leer el papel),
// pero solo el Admin puede elegir — los demás solo ven un aviso de espera
// y su pantalla cambia sola en cuanto el Admin decide (ver mpChooseEnding
// y el manejador de 'ending').
function showPotionChoiceScreen() {
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
      ? { color: GAME.selection.character.color, accent: GAME.selection.character.accent, aimAngle: level.player.angle }
      : null;
    drawVehicle(ctx, level.vehicle.x, level.vehicle.y, level.vehicle.angle, level.vehicle.def, 1, level.vehicle.mpColor, myRider);
  }
  else drawHuman(ctx, level.player.x, level.player.y, level.player.angle, GAME.selection.character.color, GAME.selection.character.accent, 1);
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
  if (level.dead && mpIsActive() && level.stage.objectiveType === 'killStreak') mpUpdateSpectateUI(level);
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
        `RECOLECCIÓN DE BAJAS — Tus bajas: ${mine}  ·  Equipo: ${level.killsThisStage}  ·  Tiempo: ${mm}:${ss}  ·  Tu mejor: ${Math.max(level._best, mine)}`;
    } else {
      document.getElementById('hud-objective').textContent =
        `RECOLECCIÓN DE BAJAS — Bajas: ${level.killsThisStage}  ·  Tiempo: ${mm}:${ss}  ·  Mejor: ${Math.max(level._best, level.killsThisStage)}`;
    }
  } else if (level.stage.objectiveType === 'survive') {
    const pct = Math.min(100, Math.round(level.killsThisStage / level.stage.surviveKillTarget * 100));
    document.getElementById('hud-objective').textContent = level.killsThisStage >= level.stage.surviveKillTarget
      ? '¡Objetivo cumplido! Ve a la zona segura'
      : `ZOMBIES ELIMINADOS: ${level.killsThisStage}/${level.stage.surviveKillTarget}  ·  ${pct}%`;
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
