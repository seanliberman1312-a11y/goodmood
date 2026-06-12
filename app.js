// ===== נתוני יצורים =====
const CREATURES = [
  // פרחים
  { id: 'rose',        emoji: '🌹', name: 'ורד אדום',        type: 'flower', rarity: 'common',    xp: 10,  desc: 'פרח יפה הנמצא בגנים רבים' },
  { id: 'sunflower',   emoji: '🌻', name: 'חמנייה',          type: 'flower', rarity: 'common',    xp: 10,  desc: 'תמיד פונה לשמש' },
  { id: 'tulip',       emoji: '🌷', name: 'צבעוני',          type: 'flower', rarity: 'common',    xp: 12,  desc: 'פרח האביב הקלאסי' },
  { id: 'cherry',      emoji: '🌸', name: 'פריחת דובדבן',   type: 'flower', rarity: 'rare',      xp: 30,  desc: 'פורח רק שבועיים בשנה' },
  { id: 'lotus',       emoji: '🪷', name: 'לוטוס קסום',     type: 'flower', rarity: 'rare',      xp: 35,  desc: 'גדל במים, סמל לטוהר' },
  { id: 'orchid',      emoji: '🌺', name: 'סחלב זהב',       type: 'flower', rarity: 'legendary', xp: 80,  desc: 'הפרח הנדיר ביותר ביערות' },

  // עצים
  { id: 'pine',        emoji: '🌲', name: 'אורן ירוק',       type: 'tree',   rarity: 'common',    xp: 10,  desc: 'עמיד לכל עונה' },
  { id: 'deciduous',   emoji: '🌳', name: 'אלון ותיק',       type: 'tree',   rarity: 'common',    xp: 12,  desc: 'יכול לחיות מאות שנים' },
  { id: 'palm',        emoji: '🌴', name: 'דקל מלכותי',     type: 'tree',   rarity: 'rare',      xp: 28,  desc: 'שייך לאזורים חמים' },
  { id: 'bonsai',      emoji: '🎋', name: 'במבוק ענק',       type: 'tree',   rarity: 'rare',      xp: 32,  desc: 'גדל במהירות מדהימה' },
  { id: 'sakura',      emoji: '🌸', name: 'עץ סאקורה',      type: 'tree',   rarity: 'legendary', xp: 75,  desc: 'רק 3 עצים כאלה קיימים בארץ' },
  { id: 'dragon_tree', emoji: '🌵', name: 'קקטוס ענק',       type: 'tree',   rarity: 'rare',      xp: 25,  desc: 'שורד ללא מים שבועות' },

  // בעלי חיים
  { id: 'butterfly',   emoji: '🦋', name: 'פרפר צבעוני',    type: 'animal', rarity: 'common',    xp: 15,  desc: 'מתחיל חייו כזחל' },
  { id: 'hedgehog',    emoji: '🦔', name: 'קיפוד',           type: 'animal', rarity: 'common',    xp: 18,  desc: 'יוצא בעיקר בלילה' },
  { id: 'fox',         emoji: '🦊', name: 'שועל חכם',       type: 'animal', rarity: 'rare',      xp: 40,  desc: 'חיה חכמה ומסתתרת' },
  { id: 'owl',         emoji: '🦉', name: 'ינשוף חכם',      type: 'animal', rarity: 'rare',      xp: 45,  desc: 'ציד לילי מומחה' },
  { id: 'deer',        emoji: '🦌', name: 'צבי אדיר',       type: 'animal', rarity: 'rare',      xp: 50,  desc: 'חי ביערות הצפוניים' },
  { id: 'phoenix',     emoji: '🦅', name: 'נשר הזהב',       type: 'animal', rarity: 'legendary', xp: 100, desc: 'המלך הנדיר של השמיים' },
  { id: 'dragon_fly',  emoji: '🐉', name: 'שרקרק קשתי',     type: 'animal', rarity: 'legendary', xp: 120, desc: 'יצור אגדי מהאגמים הנסתרים' },
];

// ===== STATE =====
let gameState = {
  collection: {},
  xp: 0,
  level: 1,
  coins: 0,
  totalCaught: 0,
  rareCaught: 0,
};

let map = null;
let playerMarker = null;
let mapCreatures = [];
let currentARCreature = null;
let cameraStream = null;
let currentFilter = 'all';

// ===== LOAD / SAVE =====
function saveState() {
  localStorage.setItem('goodmood_state', JSON.stringify(gameState));
}

function loadState() {
  const saved = localStorage.getItem('goodmood_state');
  if (saved) {
    gameState = { ...gameState, ...JSON.parse(saved) };
  }
}

// ===== START =====
function startApp() {
  loadState();
  document.getElementById('splash-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  initMap();
  updateUI();
  requestLocation();
}

// ===== MAP =====
function initMap() {
  map = L.map('map-container', {
    zoomControl: false,
    attributionControl: false,
  }).setView([31.7683, 35.2137], 15);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  // סמן שחקן
  const playerIcon = L.divIcon({
    html: `<div style="position:relative;width:60px;height:60px">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(100,200,150,0.15);border:2px solid rgba(100,200,150,0.4);animation:radar 2s ease-out infinite"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;background:white;border-radius:50%;border:3px solid #4CAF50;box-shadow:0 0 0 4px rgba(76,175,80,0.3),0 2px 8px rgba(0,0,0,0.3)"></div>
    </div>`,
    className: '', iconSize: [60, 60], iconAnchor: [30, 30]
  });

  playerMarker = L.marker([31.7683, 35.2137], { icon: playerIcon }).addTo(map);
  spawnCreaturesNearby(31.7683, 35.2137);
}

function requestLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      playerMarker.setLatLng([lat, lng]);
      map.setView([lat, lng], 16);
      spawnCreaturesNearby(lat, lng);
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

function spawnCreaturesNearby(lat, lng) {
  // נקה יצורים ישנים
  mapCreatures.forEach(m => map.removeLayer(m.marker));
  mapCreatures = [];

  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const creature = randomCreature();
    const offsetLat = (Math.random() - 0.5) * 0.008;
    const offsetLng = (Math.random() - 0.5) * 0.008;
    const cLat = lat + offsetLat;
    const cLng = lng + offsetLng;

    const rarityClass = creature.rarity === 'legendary' ? 'legendary' : creature.rarity === 'rare' ? 'rare' : '';
    const icon = L.divIcon({
      html: `<div class="creature-marker ${rarityClass}">${creature.emoji}</div>`,
      className: '', iconSize: [44, 44], iconAnchor: [22, 22]
    });

    const marker = L.marker([cLat, cLng], { icon })
      .addTo(map)
      .on('click', () => openCameraForCreature(creature));

    mapCreatures.push({ marker, creature });
  }
}

function randomCreature() {
  const roll = Math.random();
  let pool;
  if (roll < 0.6) pool = CREATURES.filter(c => c.rarity === 'common');
  else if (roll < 0.88) pool = CREATURES.filter(c => c.rarity === 'rare');
  else pool = CREATURES.filter(c => c.rarity === 'legendary');
  return pool[Math.floor(Math.random() * pool.length)];
}

// ===== CAMERA / AR =====
function openCameraForCreature(creature) {
  currentARCreature = creature;
  showView('camera');

  document.getElementById('ar-creature-display').textContent = creature.emoji;
  document.getElementById('catch-btn').classList.remove('hidden');
  document.getElementById('camera-hint').textContent =
    `${creature.emoji} ${creature.name} — לחץ לאיסוף!`;

  startCamera();
}

async function startCamera() {
  try {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, audio: false
    });
    document.getElementById('camera-feed').srcObject = cameraStream;
  } catch {
    // מצלמה לא זמינה - ממשיך בלי
    document.getElementById('camera-feed').style.background = 'linear-gradient(160deg,#1b4332,#0d2818)';
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

function catchCreature() {
  if (!currentARCreature) return;
  const c = currentARCreature;

  // עדכן אוסף
  if (!gameState.collection[c.id]) {
    gameState.collection[c.id] = { ...c, count: 0 };
  }
  gameState.collection[c.id].count++;
  gameState.xp += c.xp;
  gameState.totalCaught++;
  gameState.coins += c.rarity === 'legendary' ? 50 : c.rarity === 'rare' ? 20 : 5;
  if (c.rarity !== 'common') gameState.rareCaught++;

  // רמה
  const newLevel = Math.floor(gameState.xp / 100) + 1;
  gameState.level = newLevel;

  saveState();
  updateUI();
  showCatchPopup(c);
  stopCamera();
}

function showCatchPopup(c) {
  document.getElementById('popup-creature-emoji').textContent = c.emoji;
  document.getElementById('popup-creature-name').textContent = c.name;
  document.getElementById('popup-creature-rarity').textContent =
    c.rarity === 'legendary' ? '⭐⭐⭐ אגדי!' : c.rarity === 'rare' ? '⭐⭐ נדיר' : '⭐ נפוץ';
  document.getElementById('popup-creature-desc').textContent = c.desc;
  document.getElementById('popup-xp-val').textContent = c.xp;
  document.getElementById('catch-popup').classList.remove('hidden');
}

function closePopup() {
  document.getElementById('catch-popup').classList.add('hidden');
  showView('map');
  currentARCreature = null;
}

// ===== COLLECTION =====
function filterCollection(type) {
  currentFilter = type;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderCollection();
}

function renderCollection() {
  const grid = document.getElementById('collection-grid');
  const empty = document.getElementById('collection-empty');
  const items = Object.values(gameState.collection)
    .filter(c => currentFilter === 'all' || c.type === currentFilter);

  if (items.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = items.map(c => `
    <div class="collection-card ${c.rarity}">
      <span class="card-emoji">${c.emoji}</span>
      <div class="card-name">${c.name}</div>
      <div class="card-count">×${c.count}</div>
      <span class="card-rarity rarity-${c.rarity}">
        ${c.rarity === 'legendary' ? 'אגדי' : c.rarity === 'rare' ? 'נדיר' : 'נפוץ'}
      </span>
    </div>
  `).join('');
}

// ===== PROFILE =====
function renderProfile() {
  const xpForLevel = gameState.level * 100;
  const xpInLevel = gameState.xp - (gameState.level - 1) * 100;
  const pct = Math.min(100, (xpInLevel / 100) * 100);

  document.getElementById('stat-total').textContent = gameState.totalCaught;
  document.getElementById('stat-rare').textContent = gameState.rareCaught;
  document.getElementById('stat-level').textContent = gameState.level;
  document.getElementById('player-level').textContent = `רמה ${gameState.level}`;
  document.getElementById('xp-bar').style.width = pct + '%';
  document.getElementById('xp-text').textContent = `${xpInLevel} / 100 XP`;

  const achievements = [
    { emoji: '🌱', text: 'איסוף ראשון', unlocked: gameState.totalCaught >= 1 },
    { emoji: '🌿', text: 'אסף 10 יצורים', unlocked: gameState.totalCaught >= 10 },
    { emoji: '🌳', text: 'אסף 50 יצורים', unlocked: gameState.totalCaught >= 50 },
    { emoji: '⭐', text: 'יצור נדיר ראשון', unlocked: gameState.rareCaught >= 1 },
    { emoji: '🏆', text: '5 נדירים', unlocked: gameState.rareCaught >= 5 },
    { emoji: '👑', text: 'יצור אגדי!', unlocked: Object.values(gameState.collection).some(c => c.rarity === 'legendary') },
  ];

  document.getElementById('achievements-list').innerHTML = achievements.map(a => `
    <div class="achievement-item ${a.unlocked ? '' : 'locked'}">
      <span class="achievement-emoji">${a.emoji}</span>
      <span class="achievement-text">${a.text}</span>
    </div>
  `).join('');
}

// ===== UI =====
function updateUI() {
  document.getElementById('coin-count').textContent = `🪙 ${gameState.coins}`;
  document.getElementById('player-level').textContent = `רמה ${gameState.level}`;
}

function showView(name) {
  // עצור מצלמה אם עוברים מהמצלמה
  if (name !== 'camera') stopCamera();

  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const viewEl = document.getElementById(name + '-view');
  viewEl.classList.remove('hidden');
  viewEl.classList.add('active');

  const navBtns = document.querySelectorAll('.nav-btn');
  const navMap = { map: 0, camera: 1, collection: 2, profile: 3 };
  if (navMap[name] !== undefined) navBtns[navMap[name]].classList.add('active');

  if (name === 'collection') renderCollection();
  if (name === 'profile') renderProfile();
  if (name === 'map' && map) setTimeout(() => map.invalidateSize(), 100);
}

// spawn יצורים חדשים כל 30 שניות
setInterval(() => {
  if (playerMarker) {
    const ll = playerMarker.getLatLng();
    spawnCreaturesNearby(ll.lat, ll.lng);
  }
}, 30000);
