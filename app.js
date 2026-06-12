const CREATURES = [
  {id:'rose',emoji:'🌹',name:'ורד אדום',type:'flower',rarity:'common',xp:10,desc:'פרח יפה'},
  {id:'sunflower',emoji:'🌻',name:'חמנייה',type:'flower',rarity:'common',xp:10,desc:'פונה לשמש'},
  {id:'tulip',emoji:'🌷',name:'צבעוני',type:'flower',rarity:'common',xp:12,desc:'פרח האביב'},
  {id:'cherry',emoji:'🌸',name:'פריחת דובדבן',type:'flower',rarity:'rare',xp:35,desc:'פורח שבועיים בשנה'},
  {id:'lotus',emoji:'🪷',name:'לוטוס קסום',type:'flower',rarity:'rare',xp:40,desc:'גדל במים'},
  {id:'orchid',emoji:'🌺',name:'סחלב זהב',type:'flower',rarity:'legendary',xp:90,desc:'הפרח הנדיר ביותר'},
  {id:'pine',emoji:'🌲',name:'אורן ירוק',type:'tree',rarity:'common',xp:10,desc:'עמיד לכל עונה'},
  {id:'oak',emoji:'🌳',name:'אלון ותיק',type:'tree',rarity:'common',xp:12,desc:'חי מאות שנים'},
  {id:'palm',emoji:'🌴',name:'דקל מלכותי',type:'tree',rarity:'rare',xp:30,desc:'שייך לאזורים חמים'},
  {id:'cactus',emoji:'🌵',name:'קקטוס ענק',type:'tree',rarity:'rare',xp:28,desc:'שורד ללא מים'},
  {id:'sakura',emoji:'🎋',name:'במבוק קדוש',type:'tree',rarity:'legendary',xp:80,desc:'סמל לחוזק'},
  {id:'butterfly',emoji:'🦋',name:'פרפר צבעוני',type:'animal',rarity:'common',xp:15,desc:'מתחיל כזחל'},
  {id:'hedgehog',emoji:'🦔',name:'קיפוד',type:'animal',rarity:'common',xp:18,desc:'יוצא בלילה'},
  {id:'fox',emoji:'🦊',name:'שועל חכם',type:'animal',rarity:'rare',xp:45,desc:'חיה חכמה'},
  {id:'owl',emoji:'🦉',name:'ינשוף חכם',type:'animal',rarity:'rare',xp:50,desc:'ציד לילי'},
  {id:'deer',emoji:'🦌',name:'צבי אדיר',type:'animal',rarity:'rare',xp:55,desc:'חי ביערות'},
  {id:'eagle',emoji:'🦅',name:'נשר הזהב',type:'animal',rarity:'legendary',xp:110,desc:'מלך השמיים'},
  {id:'dragon',emoji:'🐉',name:'דרקון הטבע',type:'animal',rarity:'legendary',xp:130,desc:'יצור אגדי'},
];

let state = {collection:{},xp:0,level:1,coins:0,total:0,rare:0};
let map=null, playerMarker=null, spawnedMarkers=[], stopMarkers=[], currentCreature=null;
let throwBall=null, throwing=false, startY=0;
let distanceWalked=0, lastPos=null;

function save(){localStorage.setItem('gm2',JSON.stringify(state))}
function load(){const s=localStorage.getItem('gm2');if(s)state={...state,...JSON.parse(s)}}

function startApp(){
  load();
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initMap();
  updateHUD();
  requestLocation();
}

function initMap(){
  map=L.map('map',{zoomControl:false,attributionControl:false}).setView([31.7683,35.2137],16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  setPlayerMarker(31.7683,35.2137);
  spawnAround(31.7683,35.2137);
}

function setPlayerMarker(lat,lng){
  const icon=L.divIcon({html:`<div style="position:relative;width:64px;height:64px"><div style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(76,175,80,.5);animation:radar 2s ease-out infinite"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22px;height:22px;background:#fff;border-radius:50%;border:4px solid #4caf50;box-shadow:0 0 0 4px rgba(76,175,80,.3)"></div></div>`,className:'',iconSize:[64,64],iconAnchor:[32,32]});
  if(playerMarker)map.removeLayer(playerMarker);
  playerMarker=L.marker([lat,lng],{icon,zIndexOffset:1000}).addTo(map);
}

function requestLocation(){
  if(!navigator.geolocation)return;
  navigator.geolocation.watchPosition(pos=>{
    const{latitude:la,longitude:ln}=pos.coords;
    if(lastPos){
      const d=calcDist(lastPos.lat,lastPos.lng,la,ln);
      distanceWalked+=d;
      updateDistDisplay();
    }
    lastPos={lat:la,lng:ln};
    setPlayerMarker(la,ln);
    map.setView([la,ln],16);
    spawnAround(la,ln);
  },null,{enableHighAccuracy:true,maximumAge:5000});
}

function calcDist(la1,ln1,la2,ln2){
  const R=6371000;
  const dLa=(la2-la1)*Math.PI/180;
  const dLn=(ln2-ln1)*Math.PI/180;
  const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLn/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function updateDistDisplay(){
  const el=document.getElementById('dist-val');
  if(el)el.textContent=distanceWalked<1000?Math.round(distanceWalked)+'מ':(distanceWalked/1000).toFixed(1)+'ק"מ';
}

function spawnStops(lat,lng){
  stopMarkers.forEach(m=>map.removeLayer(m));
  stopMarkers=[];
  [{lat:lat+.003,lng:lng+.002},{lat:lat-.002,lng:lng+.004},{lat:lat+.001,lng:lng-.003}].forEach(s=>{
    s.used=false;
    const icon=L.divIcon({html:`<div class="stop-marker">💠</div>`,className:'',iconSize:[36,36],iconAnchor:[18,18]});
    const m=L.marker([s.lat,s.lng],{icon}).addTo(map).on('click',()=>collectStop(m,s));
    stopMarkers.push(m);
  });
}

function collectStop(marker,stop){
  if(stop.used)return;
  stop.used=true;
  state.coins+=10;state.xp+=20;
  save();updateHUD();
  showToast('💠 PokéStop! +10🪙 +20XP');
  const el=marker.getElement();
  if(el){el.style.filter='grayscale(1)';el.style.opacity='.5';}
  setTimeout(()=>{stop.used=false;if(el){el.style.filter='';el.style.opacity='1';}},300000);
}

function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';document.getElementById('app').appendChild(t);}
  t.textContent=msg;t.className='toast-show';
  setTimeout(()=>t.className='',2000);
}

function spawnAround(lat,lng){
  spawnedMarkers.forEach(m=>map.removeLayer(m));
  spawnedMarkers=[];
  spawnStops(lat,lng);
  const n=5+Math.floor(Math.random()*4);
  for(let i=0;i<n;i++){
    const c=randomCreature();
    const la=lat+(Math.random()-.5)*.007;
    const ln=lng+(Math.random()-.5)*.007;
    const cls='cmarker'+(c.rarity==='legendary'?' legendary':c.rarity==='rare'?' rare':'');
    const icon=L.divIcon({html:`<div class="${cls}">${c.emoji}</div>`,className:'',iconSize:[46,46],iconAnchor:[23,23]});
    const m=L.marker([la,ln],{icon}).addTo(map).on('click',()=>startEncounter(c));
    spawnedMarkers.push(m);
  }
  updateNearby();
}

function randomCreature(){
  const r=Math.random();
  let pool;
  if(r<.6)pool=CREATURES.filter(c=>c.rarity==='common');
  else if(r<.88)pool=CREATURES.filter(c=>c.rarity==='rare');
  else pool=CREATURES.filter(c=>c.rarity==='legendary');
  return pool[Math.floor(Math.random()*pool.length)];
}

function updateNearby(){
  const list=document.getElementById('nearby-list');
  if(!list)return;
  const shown=spawnedMarkers.slice(0,3).map(()=>{
    const c=CREATURES[Math.floor(Math.random()*CREATURES.length)];
    return`<div class="nearby-item"><span>${c.emoji}</span><span>${c.name}</span><span class="nearby-dot"></span></div>`;
  });
  list.innerHTML=shown.join('');
}

function startEncounter(c){
  currentCreature=c;
  document.getElementById('enc-name').textContent=c.name;
  document.getElementById('enc-rarity-stars').textContent=c.rarity==='legendary'?'⭐⭐⭐ אגדי!':c.rarity==='rare'?'⭐⭐ נדיר':'⭐ נפוץ';
  document.getElementById('enc-creature').textContent=c.emoji;
  document.getElementById('enc-appear-text').textContent=`${c.name} פראי הופיע!`;
  document.getElementById('enc-hp-fill').style.width='100%';
  showScreen('encounter');
  setupThrow();
  setTimeout(()=>{document.getElementById('enc-appear-text').textContent=''},2500);
}

function setupThrow(){
  throwBall=document.getElementById('throw-ball');
  throwing=false;
  throwBall.style.transform='';
  throwBall.style.opacity='1';
  throwBall.className='';
  let sy=0;
  throwBall.addEventListener('touchstart',e=>{sy=e.touches[0].clientY},{passive:true,once:true});
  throwBall.addEventListener('touchend',e=>{if(!throwing&&sy-e.changedTouches[0].clientY>60)doThrow()},{passive:true,once:true});
  throwBall.addEventListener('mousedown',e=>{sy=e.clientY},{once:true});
  throwBall.addEventListener('mouseup',e=>{if(!throwing&&sy-e.clientY>40)doThrow()},{once:true});
}

function doThrow(){
  if(throwing)return;
  throwing=true;
  throwBall.classList.add('throwing');
  document.getElementById('enc-hp-fill').style.width='20%';
  document.getElementById('enc-creature').style.animation='none';
  setTimeout(()=>{
    throwBall.classList.remove('throwing');
    throwBall.textContent='⚫';
    throwBall.style.transform='translateY(-280px) scale(.5)';
    document.getElementById('enc-creature').style.opacity='0';
    shakeAnimation(0,Math.random()<catchRate());
  },500);
}

function shakeAnimation(count,willCatch){
  if(count>=3){
    if(willCatch){showStarBurst();setTimeout(()=>caughtCreature(),600);}
    else{
      document.getElementById('enc-creature').style.opacity='1';
      document.getElementById('enc-creature').style.animation='enc-float 2s ease-in-out infinite';
      throwBall.textContent='🟢';throwBall.style.transform='';throwing=false;
      if(Math.random()<.3)setTimeout(()=>showFlee(currentCreature),500);
    }
    return;
  }
  setTimeout(()=>{
    throwBall.style.transform=`translateY(-280px) scale(.5) rotate(${count%2===0?-15:15}deg)`;
    setTimeout(()=>shakeAnimation(count+1,willCatch),400);
  },400);
}

function showStarBurst(){
  const s=document.createElement('div');
  s.innerHTML='✨⭐✨⭐✨';
  s.style.cssText='position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);font-size:32px;z-index:20;animation:starburst .8s ease-out forwards;pointer-events:none';
  document.getElementById('encounter-screen').appendChild(s);
  setTimeout(()=>s.remove(),800);
}

function catchRate(){
  return currentCreature.rarity==='legendary'?.3:currentCreature.rarity==='rare'?.6:.85;
}

function caughtCreature(){
  const c=currentCreature;
  if(!state.collection[c.id])state.collection[c.id]={...c,count:0};
  state.collection[c.id].count++;
  state.xp+=c.xp;state.total++;
  state.coins+=c.rarity==='legendary'?50:c.rarity==='rare'?20:5;
  if(c.rarity!=='common')state.rare++;
  state.level=Math.floor(state.xp/100)+1;
  save();updateHUD();showSuccess(c);
}

function runAway(){showScreen('map')}

function showSuccess(c){
  showScreen('map');
  document.getElementById('suc-emoji').textContent=c.emoji;
  document.getElementById('suc-name').textContent=c.name;
  document.getElementById('suc-rarity').textContent=c.rarity==='legendary'?'⭐⭐⭐ אגדי!':c.rarity==='rare'?'⭐⭐ נדיר':'⭐ נפוץ';
  document.getElementById('suc-xp-val').textContent=c.xp;
  document.getElementById('success-popup').classList.remove('hidden');
}

function showFlee(c){
  showScreen('map');
  document.getElementById('flee-emoji').textContent=c.emoji;
  document.getElementById('flee-popup').classList.remove('hidden');
}

function closeSuccess(){document.getElementById('success-popup').classList.add('hidden')}
function closeFlee(){document.getElementById('flee-popup').classList.add('hidden')}

function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>{s.className='screen hidden'});
  document.getElementById(name+'-screen').className='screen active';
  if(name==='collection')renderCollection();
  if(name==='profile')renderProfile();
  if(name==='map')setTimeout(()=>map&&map.invalidateSize(),100);
}

function updateHUD(){
  document.getElementById('hud-xp-fill').style.width=Math.min(100,state.xp-(state.level-1)*100)+'%';
  document.getElementById('coin-val').textContent=state.coins;
}

let collFilter='all';
function filterColl(type,btn){
  collFilter=type;
  document.querySelectorAll('.ctab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderCollection();
}

function renderCollection(){
  const grid=document.getElementById('coll-grid');
  const empty=document.getElementById('coll-empty');
  const items=Object.values(state.collection).filter(c=>collFilter==='all'||c.type===collFilter);
  if(!items.length){grid.innerHTML='';empty.classList.remove('hidden');return}
  empty.classList.add('hidden');
  grid.innerHTML=items.map(c=>`<div class="ccard ${c.rarity}"><span class="cc-emoji">${c.emoji}</span><div class="cc-name">${c.name}</div><div class="cc-count">×${c.count}</div><span class="cc-badge badge-${c.rarity}">${c.rarity==='legendary'?'אגדי':c.rarity==='rare'?'נדיר':'נפוץ'}</span></div>`).join('');
}

function renderProfile(){
  const xp=state.xp-(state.level-1)*100;
  document.getElementById('prof-lvl-num').textContent=state.level;
  document.getElementById('prof-xp-fill').style.width=Math.min(100,xp)+'%';
  document.getElementById('prof-xp-text').textContent=`${xp} / 100 XP`;
  document.getElementById('ps-total').textContent=state.total;
  document.getElementById('ps-rare').textContent=state.rare;
  document.getElementById('ps-types').textContent=Object.keys(state.collection).length;
  document.getElementById('ach-list').innerHTML=[
    {em:'🌱',txt:'איסוף ראשון',ok:state.total>=1},
    {em:'🌿',txt:'אסף 10 יצורים',ok:state.total>=10},
    {em:'⭐',txt:'יצור נדיר ראשון',ok:state.rare>=1},
    {em:'🏆',txt:'5 נדירים',ok:state.rare>=5},
    {em:'👑',txt:'יצור אגדי!',ok:Object.values(state.collection).some(c=>c.rarity==='legendary')},
  ].map(a=>`<div class="ach-item${a.ok?'':' locked'}"><span class="ach-em">${a.em}</span><span class="ach-txt">${a.txt}</span></div>`).join('');
}

setInterval(()=>{if(playerMarker){const ll=playerMarker.getLatLng();spawnAround(ll.lat,ll.lng)}},35000);
