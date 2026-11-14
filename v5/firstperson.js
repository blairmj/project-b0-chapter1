"use strict";

// Static, first-person chapter. B-0 owns the note but has not checked his compartment.
const SAVE_KEY = "project-b0-v5-firstperson-v4";
let progressStore = new URLSearchParams(location.search).get('test')==='1'?window.B0V5Test.store:localStorage;
const app = document.querySelector("#app");
const intro = [
  ["student", "여긴 어디야? 넌 누구고?"],
  ["robot", "저는 B-0예요. 연구소 문이 잠겼어요."],
  ["student", "그럼 같이 나가자. 단서를 찾아보자."],
  ["robot", "확인한 것은 알려 드릴게요. 모르는 것은 함께 찾아봐요."]
];
const fresh = () => ({ phase:"intro", line:0, guide:false, noteFound:false, noteTaken:false,
  unlocked:false, attempts:0, muted:true, accessQuizVersion:1, observations:{seen:{},last:""}, logs:[] });
function load() {
  try {
    const d = JSON.parse(progressStore.getItem(SAVE_KEY));
    if (!d || !["intro","room","escaped"].includes(d.phase)) return null;
    const s={...fresh(),...d,line:Math.max(0,Math.min(intro.length-1,Number(d.line)||0)),logs:Array.isArray(d.logs)?d.logs:[]};
    if(d.accessQuizVersion!==1&&s.phase!=='escaped'){s.unlocked=false;s.attempts=0;}s.accessQuizVersion=1;return s;
  } catch { return null; }
}
let state = load() || fresh(), target = "", moving = false, token = 0, timer, speechTimer, audio, lastFocus;
let faceId=0, talkTimer, camera={x:0,y:0}, drag=null, suppressClick=false, roomView, walkFrame, zoom=1, pinch=null;
let chapterTwo,chapterThree,chapterFour,hallView,educationView,reflectionView;
const NAV_KEY='project-b0-v5-lab-navigation-v1';
function readProgress(key){try{return JSON.parse(progressStore.getItem(key));}catch{return null;}}
function roomProgress(){const two=readProgress('project-b0-v5-room2-v1'),three=readProgress('project-b0-v5-room3-v1'),reflection=readProgress('project-b0-v5-reflection-v1');return {practice:state.phase==='escaped',education:readProgress('project-b0-v5-education-v1')?.memoryTaken===true,storage:two?.completed===true||two?.phase==='complete',access:['gate','mirror','complete'].includes(three?.phase)&&Math.abs(three?.shelfZ||0)>=150&&three?.realDoorOpen===true,mirror:three?.phase==='complete'||three?.mirror?.phase==='complete',reflection:reflection?.phase==='complete',reflector:reflection?.taken===true};}
function loadNavigation(){
  const raw=readProgress(NAV_KEY),n=window.B0LabNavigation.restore(raw);window.B0LabNavigation.merge(n,roomProgress());
  // Existing players already in the final room keep their checkpoint after the map update.
  if(!raw&&readProgress('project-b0-v5-final-v2')?.version===2){for(const id of ['practice','storage','access','mirror'])n.cleared[id]=true;n.keyTaken=n.stairsUnlocked=true;n.floor=2;n.camera={x:0,z:-2350,yaw:0,pitch:-4};n.mode='room';}
  return n;
}
let navigation=loadNavigation();
function syncCorridorPower(){app.setAttribute?.('data-corridor-power',navigation.powerOut?'out':'on');}
syncCorridorPower();
function saveNavigation(){syncCorridorPower();try{progressStore.setItem(NAV_KEY,JSON.stringify(navigation));}catch{}}
function markRoom(){delete navigation.room;hallView?.dispose();hallView=null;navigation.mode='room';saveNavigation();}
function showHall(from,completed=true,arriving=false){
  if(from&&from!=='practice'&&!arriving&&window.B0RoomTransit&&app.querySelector('.c2-stage')){window.B0RoomTransit.cross(app,()=>showHall(from,completed,true),{direction:'exit',completed,corridor:{state:navigation,from}});return;}
  stopAdventure();window.B0LabNavigation.merge(navigation,roomProgress());
  if(from)window.B0LabNavigation.returned(navigation,from,completed);
  navigation.mode='hall';delete navigation.room;saveNavigation();
  if(typeof location!=='undefined'){const url=new URL(location.href);url.searchParams.set('area','hall');url.searchParams.delete('room');url.searchParams.set('chapter',String(state.chapter||1));history.replaceState(null,'',url);}
  hallView=window.startLabNavigation({app,portrait,state:navigation,onSave:saveNavigation,onEnter:enterFromHall,onHome:campaignHome,muted:state.muted,arrival:arriving&&from?{from,completed}:null});
}
function enterFromHall(id,arriving=false){
  if(!window.B0LabNavigation.canEnter(navigation,id))return;
  if(!arriving&&window.B0RoomTransit){window.B0RoomTransit.cross(app,()=>enterFromHall(id,true));return;}
  if(id==='practice'){enterPracticeVisit();panTo(167,-5);setZoom(1);return;}
  if(id==='education'){enterEducation();return;}
  if(id==='storage'){enterChapterTwo(true);return;}
  if(id==='access'){enterChapterThree('access',true);return;}
  if(id==='mirror'){enterChapterThree('mirror',true);return;}
  if(id==='reflection'){enterReflection();return;}
  if(id==='central')enterChapterFour(true);
}
function chapterUrl(number){if(typeof location==='undefined')return;const url=new URL(location.href);url.searchParams.delete('area');if(number!==3)url.searchParams.delete('room');if(number===1)url.searchParams.delete('chapter');else url.searchParams.set('chapter',String(number));history.replaceState(null,'',url);}
function enterPracticeVisit(){
  stopAdventure();markRoom();state.chapter=1;if(state.phase==='intro')state.phase='room';save();chapterUrl(1);
  navigation.room='practice';saveNavigation();const url=new URL(location.href);url.searchParams.set('room','practice');history.replaceState(null,'',url);enterRoom(false,true);
}
function enterEducation(){
  stopAdventure();markRoom();navigation.room='education';saveNavigation();state.chapter=2;save();chapterUrl(2);
  const url=new URL(location.href);url.searchParams.set('room','education');history.replaceState(null,'',url);
  educationView=window.startEducationRoom({app,portrait,onHome:campaignHome,onBack:done=>showHall('education',done)});
}
function enterChapterTwo(visit=false){
  educationView?.dispose();educationView=null;
  markRoom();
  chapterFour?.dispose();chapterFour=null;
  roomView?.dispose();roomView=null;chapterTwo?.dispose();chapterThree?.dispose();chapterThree=null;
  token++;clearTimeout(timer);clearTimeout(speechTimer);clearTimeout(talkTimer);cancelAnimationFrame(walkFrame);moving=false;suppressClick=false;
  state.chapter=2;save();chapterUrl(2);
  chapterTwo=window.startChapterTwo({app,portrait,visit,onNext:()=>showHall('storage'),onHome:campaignHome,onBack:()=>showHall('storage',false)});
}
function enterChapterThree(view='access',arrived=false){
  if(view!=='mirror'&&!roomProgress().education){navigation.floor=1;navigation.camera={x:0,z:-950,yaw:-90,pitch:-4};showHall();modal('기록 메모리 필요','<p>기록 보관실 입장에는 교육 실습실의 기록 메모리가 필요합니다.</p><p>교육 실습실에서 수업 기록을 복구하고 메모리를 먼저 챙겨야 합니다.</p>');return;}
  educationView?.dispose();educationView=null;
  markRoom();
  if(typeof location!=='undefined'){const url=new URL(location.href);if(view==='mirror')url.searchParams.set('room','mirror');else url.searchParams.delete('room');history.replaceState(null,'',url);}
  chapterFour?.dispose();chapterFour=null;
  roomView?.dispose();roomView=null;chapterTwo?.dispose();chapterTwo=null;chapterThree?.dispose();
  token++;clearTimeout(timer);clearTimeout(speechTimer);clearTimeout(talkTimer);cancelAnimationFrame(walkFrame);moving=false;suppressClick=false;
  state.chapter=3;save();chapterUrl(3);
  chapterThree=window.startChapterThree({app,portrait,entryRoom:view,arrived,onBack:()=>showHall('access',false),onMirrorBack:()=>showHall('mirror',false),onNext:()=>showHall('mirror'),onCorridor:()=>showHall('access'),showCompleted:view==='summary',onHome:campaignHome});
}
function enterChapterFour(arrived=false){
  educationView?.dispose();educationView=null;
  if(!navigation.stairsUnlocked&&!(navigation.reviewMode&&navigation.floor===2)){navigation.floor=1;navigation.camera={x:0,z:window.B0LabNavigation.bound(navigation,0,-1665).z,yaw:0,pitch:-4};showHall();return;}
  markRoom();
  roomView?.dispose();roomView=null;chapterTwo?.dispose();chapterTwo=null;chapterThree?.dispose();chapterThree=null;chapterFour?.dispose();
  token++;clearTimeout(timer);clearTimeout(speechTimer);clearTimeout(talkTimer);cancelAnimationFrame(walkFrame);moving=false;suppressClick=false;
  state.chapter=4;save();chapterUrl(4);
  chapterFour=window.startChapterFour({app,portrait,arrived,reflector:roomProgress().reflector,onBack:()=>showHall('central',false),onHome:campaignHome});
}
function enterReflection(){
  stopAdventure();markRoom();navigation.room='reflection';saveNavigation();state.chapter=3;save();chapterUrl(3);
  const url=new URL(location.href);url.searchParams.set('room','reflection');history.replaceState(null,'',url);
  reflectionView=window.startReflectionRoom({app,onBack:()=>showHall('reflection',false),onComplete:()=>showHall('reflection',true),onHome:campaignHome});
}
const touchPoints=new Map();
const reduced=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// The illustration stays intact. Screen features are separate SVG animation layers.
function portrait() {
  const id="body-"+(++faceId),src="../assets/b0-body-v3.webp";
  return `<svg class="live-portrait" viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>
    <clipPath id="${id}-left"><ellipse cx="390" cy="451" rx="74" ry="96"/></clipPath><clipPath id="${id}-right"><ellipse cx="649" cy="496" rx="77" ry="94"/></clipPath>
    <radialGradient id="${id}-shade"><stop offset="72%" stop-color="#080d12"/><stop offset="100%" stop-color="#080d12" stop-opacity="0"/></radialGradient></defs>
    <image href="${src}" width="1024" height="1536"/>
    <ellipse cx="390" cy="451" rx="81" ry="104" fill="url(#${id}-shade)"/><ellipse cx="649" cy="496" rx="84" ry="102" fill="url(#${id}-shade)"/>
    <g class="eye eye-left" style="--eye-x:390px;--eye-y:451px"><image href="${src}" width="1024" height="1536" clip-path="url(#${id}-left)"/></g>
    <g class="eye eye-right" style="--eye-x:649px;--eye-y:496px"><image href="${src}" width="1024" height="1536" clip-path="url(#${id}-right)"/></g>
    <ellipse cx="419" cy="337" rx="58" ry="29" fill="url(#${id}-shade)"/><ellipse cx="682" cy="387" rx="56" ry="37" fill="url(#${id}-shade)"/>
    <path class="brow brow-left" d="M387 342 Q421 326 451 335"/><path class="brow brow-right" d="M653 375 Q687 382 710 402"/>
    <ellipse cx="507" cy="541" rx="52" ry="28" fill="url(#${id}-shade)"/><g transform="rotate(10 507 541)"><rect class="live-mouth" x="475" y="534" width="64" height="14" rx="7" style="--mouth-x:507px;--mouth-y:541px"/></g></svg>`;
}
function spriteFace(pose="neutral") {
  const note=pose==="note",x=note?634:pose==="thinking"?236:284,y=note?420:pose==="thinking"?192:196,w=note?45:20,h=note?14:4;
  return `<svg class="sprite-face" viewBox="0 0 ${note?"1310 1201":"512 512"}" aria-hidden="true"><ellipse cx="${x}" cy="${y}" rx="${w*.85}" ry="${h*2.3}" fill="#081218"/><rect class="live-mouth" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" style="--mouth-x:${x}px;--mouth-y:${y}px"/></svg>`;
}
function performSpeech(who,text,mood="attentive",scope=app) {
  clearTimeout(talkTimer);
  app.querySelectorAll(".speaking").forEach(el=>el.classList.remove("speaking"));
  const actor=scope.querySelector(".face")||scope.querySelector(".robot-sprite");
  if(!actor)return;
  actor.dataset.mood=mood;
  if(actor.classList.contains("robot-sprite")&&!actor.classList.contains("live-body"))actor.innerHTML=spriteFace(actor.closest(".found")?"note":mood==="thinking"?"thinking":"neutral");
  if(who!=="robot")return;
  actor.classList.add("speaking");
  talkTimer=setTimeout(()=>actor.classList.remove("speaking"),Math.min(5500,Math.max(1600,text.length*95)));
}
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const btn = (s,a,c="",attrs="") => `<button type="button" data-action="${a}" class="${c}" ${attrs}>${s}</button>`;
function save(kind,text) { if(kind)state.logs.push({kind,text,time:new Date().toISOString()});try{progressStore.setItem(SAVE_KEY,JSON.stringify(state));}catch{} }
function tone(ok=true) {
  if(state.muted)return;
  try { audio ||= new (window.AudioContext||window.webkitAudioContext)();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=ok?720:220;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.18);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.18); }catch{}
}
function dialogue(who,text) { if(who==='robot')text=window.B0Preferences?.robotText(text)||text;return `<div class="speech ${who}"><b>${who==="robot"?"B-0":who==="thought"?"속마음":"나"}</b><p>${esc(text)}</p></div>`; }
// Temporary review control; remove this helper and header calls after lesson review.
window.B0LessonJumpButton=()=>`<span class="lesson-review-controls">${btn('차시 앞으로','jump-lesson-next','quiet lesson-jump','aria-label="차시 앞으로 (임시)" title="개발 확인용 임시 이동"')}${btn('차시 끝으로','jump-lesson-end','quiet lesson-jump','aria-label="차시 끝으로 (임시)" title="현재 차시의 마무리 장면으로 이동"')}</span>`;
function reviewLesson(number){
  window.B0RoomTransit?.cancel();
  stopAdventure();navigation.mode='room';saveNavigation();
  if(number===1){const muted=state.muted;state={...fresh(),muted,chapter:1};save();chapterUrl(1);opening();return;}
  state.phase='escaped';navigation.cleared.practice=true;
  if(number>=3)navigation.cleared.storage=true;
  if(number===4){navigation.cleared.access=navigation.cleared.mirror=true;navigation.keyTaken=navigation.stairsUnlocked=true;navigation.floor=2;}
  progressStore.removeItem(number===2?'project-b0-v5-room2-v1':number===3?'project-b0-v5-room3-v1':'project-b0-v5-final-v2');
  navigation.mode='room';saveNavigation();save('임시 이동',number+'차시 시작으로 이동');
  if(number===2)enterChapterTwo();else if(number===3)enterChapterThree();else enterChapterFour();
}

function jumpLessonEnd(){
  if(reflectionView){showHall('reflection',false);return;}
  if(educationView){educationView.jumpToEnd();showHall('education',true);return;}
  if(hallView){const chapter=state.chapter||1;if(chapter===2)enterChapterTwo();else if(chapter===3)enterChapterThree();else if(chapter===4){if(!navigation.stairsUnlocked)reviewLesson(4);else enterChapterFour();}}
  if(chapterFour){chapterFour.jumpToEnd();enterChapterFour();return;}
  if(chapterThree){chapterThree.jumpToEnd();enterChapterThree('summary');return;}
  if(chapterTwo){chapterTwo.jumpToEnd();enterChapterTwo();return;}
  stopAdventure();state.chapter=1;state.phase='escaped';state.unlocked=true;
  save('임시 이동','1차시 마무리로 이동');ending(3);
}
function openingHeader(){return window.B0UI?.header({place:'알 수 없는 곳',namespace:'action',reset:'view-home'})|| `<header class="opening-header"><span>알 수 없는 곳</span><nav>${btn("처음 위치로","view-home","quiet")}${window.B0LessonJumpButton()}</nav></header>`;}
const campaignKeys=[NAV_KEY,'project-b0-v5-control-route-v2','project-b0-v5-education-v1','project-b0-v5-room2-v1','project-b0-v5-room3-v1','project-b0-v5-final-v1','project-b0-v5-final-v2','project-b0-v5-reflection-v1','project-b0-v5-play-id-v1'];
function hasAdventure(){
  if((state.chapter||1)>1||state.phase!=='intro'||state.line>0)return true;
  try{return campaignKeys.some(key=>progressStore.getItem(key)!==null);}catch{return false;}
}
function stopAdventure(){
  reflectionView?.dispose();reflectionView=null;
  educationView?.dispose();educationView=null;
  hallView?.dispose();hallView=null;
  chapterTwo?.dispose();chapterTwo=null;chapterThree?.dispose();chapterThree=null;chapterFour?.dispose();chapterFour=null;
  roomView?.dispose();roomView=null;token++;clearTimeout(timer);clearTimeout(speechTimer);clearTimeout(talkTimer);cancelAnimationFrame(walkFrame);
  app.querySelectorAll('dialog').forEach(d=>d.close());moving=false;suppressClick=false;drag=null;pinch=null;touchPoints.clear();
}
function campaignHome(){
  window.B0RoomTransit?.cancel();
  stopAdventure();chapterUrl(1);const saved=hasAdventure(),chapter=Math.max(1,Math.min(4,state.chapter||1));
  app.innerHTML=`<main class="awakening campaign-home"><div class="face" role="img" aria-label="함께 탈출할 AI 로봇 B-0">${portrait()}</div><div class="wake-controls"><h1>PROJECT B-0</h1><p class="campaign-tagline">모르는 로봇과, 함께 길을 찾는 모험.</p><div class="campaign-buttons">${btn('처음부터 시작','campaign-start','primary')}${saved?btn('이어하기','campaign-continue','secondary'):''}</div>${saved?`<small class="muted">${chapter}차시 진행이 저장되어 있습니다.</small>`:''}</div></main>`;
}
function resumeAdventure(chapter=state.chapter||1){
  if(new URLSearchParams(location.search).get('room')==='reflection'||navigation.room==='reflection'){enterReflection();return;}
  if(navigation.mode==='hall'&&(navigation.cleared.practice||navigation.reviewMode)){showHall();return;}
  if(new URLSearchParams(location.search).get('room')==='practice'||navigation.room==='practice'){enterPracticeVisit();return;}
  if(new URLSearchParams(location.search).get('room')==='education'||navigation.room==='education'){enterEducation();return;}
  if(chapter===4){enterChapterFour();return;}if(chapter===3){enterChapterThree(new URLSearchParams(location.search).get('room')==='mirror'||readProgress('project-b0-v5-room3-v1')?.phase==='mirror'?'mirror':'access');return;}if(chapter===2){enterChapterTwo();return;}
  state.chapter=1;save();if(state.phase==='intro')opening();else enterRoom();
}
function startAdventure(){
  window.B0RoomTransit?.cancel();
  const muted=state.muted;stopAdventure();
  for(const key of campaignKeys)progressStore.removeItem(key);
  state=fresh();logicTrial=null;codeDraft='';state.chapter=1;state.muted=muted;navigation=window.B0LabNavigation.fresh();navigation.mode='room';saveNavigation();save();chapterUrl(1);opening();
}
function boot() {
  const requested=typeof location!=="undefined"?new URLSearchParams(location.search).get('chapter'):null;
  if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('area')==='hall'&&(Object.values(navigation.cleared).some(Boolean)||navigation.reviewMode)){showHall();return;}
  if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('room')==='practice'){enterPracticeVisit();return;}
  if(['1','2','3','4'].includes(requested)){navigation.mode='room';if(new URLSearchParams(location.search).get('room')!=='education')delete navigation.room;resumeAdventure(Number(requested));}else campaignHome();
}
function opening() {
  roomView?.dispose();roomView=null;
  token++;clearTimeout(timer);clearTimeout(speechTimer);target="";moving=false;
  app.innerHTML=`<main class="awakening${state.line===0?" waking":""}"><div class="face" role="img" aria-label="잠에서 깨어나 처음 마주한 B-0의 얼굴">${portrait()}</div><div class="eyelids" aria-hidden="true"></div><div class="wake-controls"><div class="intro-speech"></div>${btn("다음","next","next")}</div></main>`;
  renderIntro();
  app.querySelector(".awakening").insertAdjacentHTML("afterbegin",openingHeader());
}
function renderIntro() {
  let line=intro[state.line];app.querySelector(".intro-speech").innerHTML=dialogue(...line);
  app.querySelector('[data-action="next"]').textContent=state.line===intro.length-1?"주변 둘러보기":"다음";
  performSpeech(...line,["attentive","friendly","attentive","thinking","attentive","thinking","concerned","concerned","thinking","friendly"][state.line]);
  save();
}
const places={door:{name:"출입문",wall:0},lock:{name:"도어락",wall:0},map:{name:"출입 기록판",wall:0},robot:{name:"B-0",wall:0},terminal:{name:"단말기",wall:0},cabinet:{name:"보관장",wall:-90},bench:{name:"실습대",wall:90},window:{name:"관찰창",wall:90},filebox:{name:"낡은 서류함",wall:-90},envelope:{name:"접힌 봉투",wall:90}};
const wallTarget=id=>btn("",`approach-${id}`,`target target-${id}`,`aria-label="${places[id].name} 살펴보기"`);
function artifact(id){
  const drawing=id==="filebox"?'<path d="M12 35 43 14h91l14 25v57H12Z" fill="#5b686b" stroke="#263943" stroke-width="5"/><path d="M27 29h96v40H27Z" fill="#b6b6a4"/><path d="M12 44h136v52H12Z" fill="#6a787c" stroke="#34444b" stroke-width="4"/><rect x="55" y="59" width="51" height="21" rx="3" fill="#bcbdb2"/><path d="M68 68h24" stroke="#717d7c" stroke-width="4"/>':'<path d="M15 28 142 16l7 65L22 94Z" fill="#c9c0a5" stroke="#6c756c" stroke-width="4"/><path d="m16 29 68 31 59-43M23 92l42-39m38-2 44 28" fill="none" stroke="#898d7c" stroke-width="3"/>';
  return `<div class="artifact-art art-${id}" aria-hidden="true"><svg viewBox="0 0 160 110">${drawing}</svg></div>${wallTarget(id)}`;
}
function otherWalls(){return `<div class="room-wall side-wall wall-left" data-yaw="-90">${wallTarget("cabinet")}${artifact("filebox")}</div><div class="room-wall side-wall wall-right" data-yaw="90">${wallTarget("bench")}${wallTarget("window")}${artifact("envelope")}</div>`;}
function enterRoom(reveal=false,restoreView=false) {
  if(state.phase==="escaped"&&!restoreView){ending();return;}
  roomView?.dispose();roomView=null;
  token++;clearTimeout(timer);clearTimeout(speechTimer);target="";moving=false;
  camera={x:0,y:-5};zoom=1;drag=null;pinch=null;touchPoints.clear();suppressClick=false;
  app.innerHTML=`<main class="game${reveal?" revealing":""}">${window.B0UI?.header({place:`출입 관리실`,namespace:"action",reset:"view-home",zoomClass:"zoom-value",active:true})||""}<section class="scene" tabindex="0" aria-label="출입 관리실. 드래그하거나 방향키로 시선을 돌려 네 벽과 구석을 살펴보세요."><canvas class="panorama-canvas" role="img" aria-label="벽과 바닥이 하나로 이어진 출입 관리실"></canvas><p class="render-error" hidden role="alert"></p><div class="room-rig"><div class="room-wall world${state.unlocked?" unlocked":""}" data-yaw="0">
    <div class="door-art" aria-hidden="true"><div class="device door-left"></div><div class="device door-right"></div></div><span class="lock-led" aria-hidden="true"></span>
    <div class="device terminal-art" aria-hidden="true"></div><div class="map-board" aria-hidden="true"><small>출입 기록</small><strong>세 자리 비밀번호</strong><p>첫째 = 셋째 × 2<br>둘째 + 셋째 = 7<br>첫째 + 둘째 = 9</p></div><div class="device light-art" aria-hidden="true"></div>
    <div class="targets">${Object.keys(places).filter(id=>places[id].wall===0&&id!=="robot").map(wallTarget).join("")}</div></div>${otherWalls()}<div class="robot-anchor"><div class="robot-sprite live-body" role="img" aria-label="함께 있는 AI 로봇 B-0">${portrait()}</div>${wallTarget("robot")}</div></div>
    <p class="look-hint">끌어서 둘러보기 · 휠/두 손가락으로 확대·축소</p><div class="room-speech" aria-live="polite" hidden></div><div class="arrival sr-only" role="status"></div>
    </section><footer>${btn("B-0에게 말하기","talk-","secondary")}${btn("소지품 <span class=\"item-count\">"+(state.noteTaken?"1":"0")+"</span>","inventory","secondary")}</footer></main>`;

  const report=text=>{const el=app.querySelector(".render-error");if(el){el.textContent=text;el.hidden=false;}};
  try{roomView=createRoomPanorama(app.querySelector(".panorama-canvas"),report);}catch{report("방 화면을 시작하지 못했습니다. 페이지를 새로고침해 주세요.");}

  if(state.phase==="escaped")roomView?.setDoorOpen(1);
  bindCamera();
  panTo(camera.x,camera.y);
  if(reveal)setTimeout(()=>{if(app.querySelector(".scene"))window.B0UI?.firstGuide();},reduced()?0:1900);
}
function revealRoom() {
  if(moving)return;
  const face=app.querySelector(".face"),source=face?.getBoundingClientRect(),body=face?.cloneNode(true);
  enterRoom(!reduced());
  if(reduced()||!body||!source)return;
  moving=true;const ticket=token,game=app.querySelector(".game"),base=game.getBoundingClientRect();
  const target=app.querySelector(".robot-anchor>.robot-sprite").getBoundingClientRect();
  const width=Math.min(target.width,target.height*2/3),height=width*1.5;
  const overlay=document.createElement("div");overlay.className="departure body-retreat";overlay.setAttribute("aria-hidden","true");
  body.style.width=source.width+"px";body.style.height=source.height+"px";
  overlay.append(body);game.append(overlay);
  const from=`translate(${source.left-base.left}px,${source.top-base.top}px) scale(1)`;
  const to=`translate(${target.left-base.left+(target.width-width)/2}px,${target.top-base.top+(target.height-height)/2}px) scale(${width/source.width})`;
  body.animate([{transform:from},{transform:to}],{duration:1800,easing:"cubic-bezier(.25,.55,.3,1)",fill:"forwards"});
  timer=setTimeout(()=>{if(ticket!==token)return;overlay.remove();game.classList.remove("revealing");moving=false;app.querySelector(".scene").focus({preventScroll:true});},1850);
}
function roomSpeech(who,text) {const el=app.querySelector(".room-speech");if(!el)return;clearTimeout(speechTimer);el.innerHTML=dialogue(who,text);el.hidden=false;speechTimer=setTimeout(()=>{el.hidden=true;},4800);}
function approach(id) {
  if(moving||!places[id]||app.querySelector("dialog"))return;
  target=id;inspect();
}
function panTo(x,y) {
  const scene=app.querySelector(".scene"),rig=app.querySelector(".room-rig");if(!scene||!rig)return;
  // The spherical background and object planes share one camera.
  camera={x:((x+180)%360+360)%360-180,y:Math.max(-18,Math.min(18,y))};
  const focal=Math.min(scene.clientHeight*.58,scene.clientWidth*.9)*(.82/1.5)*zoom;
  scene.style.perspective=focal+"px";
  rig.style.transform=`translateZ(${focal}px) rotateX(${camera.y}deg) rotateY(${camera.x}deg)`;
  scene.dataset.yaw=String(camera.x);scene.dataset.pitch=String(camera.y);
  scene.dataset.zoom=String(zoom);
  roomView?.view(camera.x,camera.y,focal);
  // Keep the existing character art facing the viewer instead of flattening it onto a wall.
  const robot=app.querySelector(".robot-anchor");
  if(robot)robot.style.transform=`translate3d(125px,230px,-470px) rotateY(${-camera.x}deg) rotateX(${-camera.y}deg)`;

}
function setZoom(value){
  if(moving)return;
  zoom=Math.max(.55,Math.min(1.8,value));
  panTo(camera.x,camera.y);
  const label=app.querySelector(".zoom-value");if(label)label.textContent=Math.round(zoom*100)+"%";
  const out=app.querySelector('[data-action="zoom-out"]'),inside=app.querySelector('[data-action="zoom-in"]');
  if(out)out.disabled=zoom<=.55;if(inside)inside.disabled=zoom>=1.8;
}
function hideLookHint(){app.querySelector(".look-hint")?.classList.add("dismissed");}
function bindCamera() {
  const scene=app.querySelector(".scene");
  scene.addEventListener("pointerdown",e=>{
    if(moving||app.querySelector("dialog")||e.button!==0)return;
    if(e.pointerType==="touch"){
      touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});scene.setPointerCapture(e.pointerId);
      if(touchPoints.size===2){const [a,b]=[...touchPoints.values()];pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom};drag=null;suppressClick=true;e.preventDefault();return;}
      if(touchPoints.size>2)return;
    }else if(e.isPrimary===false)return;
    suppressClick=false;drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:camera.x,y:camera.y,moved:false};
  });
  scene.addEventListener("pointermove",e=>{
    if(touchPoints.has(e.pointerId))touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch){if(touchPoints.size>=2){const [a,b]=[...touchPoints.values()];setZoom(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance);hideLookHint();}e.preventDefault();return;}
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(!drag.moved&&Math.hypot(dx,dy)<8)return;
    if(!drag.moved){drag.moved=true;scene.setPointerCapture(e.pointerId);scene.classList.add("dragging");hideLookHint();}
    panTo(drag.x-dx*.16/zoom,drag.y+dy*.10/zoom);e.preventDefault();
  });
  const finish=e=>{touchPoints.delete(e.pointerId);if(pinch){if(touchPoints.size===0)pinch=null;drag=null;suppressClick=true;scene.classList.remove("dragging");return;}if(!drag||drag.id!==e.pointerId)return;suppressClick=drag.moved;drag=null;scene.classList.remove("dragging");if(scene.hasPointerCapture(e.pointerId))scene.releasePointerCapture(e.pointerId);};
  scene.addEventListener("pointerup",finish);scene.addEventListener("pointercancel",finish);scene.addEventListener("lostpointercapture",finish);
  scene.addEventListener("pointerleave",e=>{if(drag&&!drag.moved)finish(e);});
  scene.addEventListener("wheel",e=>{if(moving||app.querySelector("dialog"))return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?scene.clientHeight:1);setZoom(zoom*Math.exp(-Math.max(-150,Math.min(150,delta))*.0015));hideLookHint();},{passive:false});
  scene.addEventListener("keydown",e=>{
    if(["+","=","-","0"].includes(e.key)){e.preventDefault();setZoom(e.key==="0"?1:zoom+(e.key==="-"?-.15:.15));return;}
    const delta={ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,6],ArrowDown:[0,-6]}[e.key];
    if(!delta||moving)return;e.preventDefault();hideLookHint();panTo(camera.x+delta[0],camera.y+delta[1]);
  });
  scene.addEventListener("focusin",e=>{
    if(!e.target.matches(".target:focus-visible"))return;
    const id=e.target.dataset.action?.replace("approach-","");
    if(places[id])panTo(id==="map"?-45:places[id].wall,-5);
  });
}
function modal(title,content,kind="") {
  window.B0ObjectDialogue?.close?.();
  const previous=app.querySelector("dialog");if(!previous)lastFocus=document.activeElement;previous?.remove();
  const d=document.createElement("dialog");d.className="modal "+kind;d.innerHTML=`<div class="modal-header"><h2>${title}</h2></div><div class="modal-body">${window.B0UI.dialogBody(content,'action','close')}</div>`;app.append(d);d.addEventListener("close",()=>{d.remove();if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});});d.showModal();
  const spoken=d.querySelector(".speech.robot p");
  if(spoken)performSpeech("robot",spoken.textContent,state.noteFound?"friendly":"thinking",d);
}
function inspect() {
  if(moving||!target)return;window.B0RoomDialogue?.remember(state,target,2);save();
  if(target==="filebox")modal("낡은 서류함",`<div class="decoy-detail">${artifact("filebox")}</div><p>얇은 서류 몇 장이 들어 있다. 설레는 마음으로 꺼내 펼쳐 본다.</p><div class="notice-paper"><h3>실습 준비물</h3><p>연필 · 지우개 · 활동지</p></div><p>준비물 목록이다. 출입번호는 적혀 있지 않다.</p>${btn("서류를 돌려놓기","close","primary wide")}`);
  if(target==="envelope")modal("접힌 봉투",`<div class="decoy-detail">${artifact("envelope")}</div><p>봉투 안에 종이가 들어 있다. 조심히 꺼내 본다.</p><div class="notice-paper"><h3>장비 청소 안내</h3><p>사용 후 부드러운 천으로 화면을 닦아 주세요.</p></div><p>장비 관리 안내였다. 비밀번호 쪽지는 아니다.</p>${btn("봉투를 내려놓기","close","primary wide")}`);
  if(target==="door")door();
  if(target==="lock")lock();
  if(target==="map")guide();
  if(target==="robot")robot();
  if(target==="terminal")window.B0ObjectDialogue.present([['student','화면에 전원이 들어오지 않아.'],['robot','이 단말기는 작동하지 않습니다.']]);
  if(target==="cabinet")modal("보관장",`<p>낡은 장비 상자와 비어 있는 수납칸이다. 문을 여는 데 쓸 만한 물건은 보이지 않는다.</p>${btn("그만 살펴보기","close","secondary wide")}`);
  if(target==="bench")modal("실습대",`<p>실습 도구가 남아 있다. 모니터와 장비의 전원은 모두 꺼져 있다.</p>${btn("그만 살펴보기","close","secondary wide")}`);
  if(target==="window")modal("관찰창",`<p>두꺼운 유리 너머에 교육 실습실이 보인다. 이쪽에는 나갈 수 있는 문이 없다.</p>${btn("그만 살펴보기","close","secondary wide")}`);
}
function door(tried=false) {
  window.B0RoomDialogue?.remember(state,"door",tried?3:2);save();
  if(state.unlocked){modal("잠금이 풀린 출입문",`<p>잠금 표시가 초록색이다. 손잡이를 돌릴 수 있다.</p>${btn("문을 열고 나가기","escape","primary wide")}`);return;}
  if(tried){window.B0ObjectDialogue.present([['student','손잡이를 돌려도 문이 안 열려.'],['robot','문 옆에 도어락이 있습니다.']],{actions:[['도어락 살펴보기',lock]]});return;}
  modal("출입문",`<div class="door-detail" aria-hidden="true"><div class="device"></div></div><p>닫힌 출입문이다. 옆에 숫자 도어락이 달려 있다.</p><div class="action-row">${btn("손잡이 돌려보기","handle","secondary")}${btn("도어락 살펴보기","lock","primary")}</div>`);
}
function accessClues(){return '<section class="v5-access-clues"><h3>벽에 남은 출입 기록</h3><ol>'+window.B0AccessLogic.clues.map(text=>'<li>'+esc(text)+'</li>').join('')+'</ol></section>';}
function guide() {
  window.B0RoomDialogue?.remember(state,'map',2);state.guide=true;save('발견','벽면 출입 기록의 숫자 조건 확인');
  modal('출입 기록판',accessClues()+btn('도어락에서 숫자 눌러 보기','lock','primary')+btn('B-0와 함께 생각하기','logic-help','secondary'));
}
let logicTrial=null,codeDraft='';
function logicCoach(){
  const M=window.B0AccessLogic;logicTrial||=M.fresh();const q=M.question(logicTrial);
  const numbers=[logicTrial.a,logicTrial.b,logicTrial.c].map(n=>'<span>'+(n??'?')+'</span>').join('');
  const choices=q.values.map(n=>btn(n,'logic-pick-'+q.field+'-'+n,'key')).join('');
  modal('B-0와 가설 확인',`<div class="v5-logic-trial"><small>내가 생각한 숫자</small><div class="v5-logic-slots">${numbers}</div><div class="speech robot"><b>B-0</b><p>${esc(logicTrial.message)}</p></div><div class="v5-logic-options">${choices}</div>${q.field==='retry'?btn('다른 첫째 숫자로 다시 생각하기','logic-retry','primary'):''}${q.field==='lock'?btn('찾은 숫자를 도어락에 눌러 보기','logic-lock','primary'):btn('도어락으로 돌아가기','logic-lock','secondary')}${!['first','retry','lock'].includes(q.field)?btn('첫째 숫자부터 다시 고르기','logic-retry','secondary'):''}<details><summary>단서 다시 보기</summary>${accessClues()}</details></div>`,'v5-logic-modal');
}
function robot(topic='') {
  if(topic==='belongings'&&state.noteFound&&!state.noteTaken){window.B0ObjectDialogue.present([['robot','보관함에 출입 기록의 사본이 있네요. 정답 대신 숫자 사이의 조건이 적혀 있어요.']],{actions:[['출입 기록 챙기기',()=>handle('take-note')]]});return;}
  if(target&& !['robot','map','lock','door'].includes(target)&&window.B0ObjectDialogue?.open('practice',state,{target}))return;
  if(state.unlocked){window.B0ObjectDialogue.present([['student','내가 찾은 숫자로 문이 열렸어.'],['robot','모든 단서와 비교해서 확인했군요. 이제 함께 나가요.']]);return;}
  window.B0ObjectDialogue.present(state.guide?[['student','번호를 바로 알려줄 수 있어?'],['robot','직접 생각한 숫자를 골라 보세요. 다른 단서와 맞는지 함께 확인할게요.']]:[['robot','출입문의 잠금이 걸렸어요. 서로 다른 숫자 세 개가 필요해요.'],['student','방 안에 단서가 있을까?'],['robot','벽에 출입 기록이 남아 있어요. 먼저 읽어 봐요.']],{actions:[[state.guide?'함께 생각하기':'출입 기록 보기',state.guide?logicCoach:guide]]});
}
function askStorage(){window.B0ObjectDialogue.present([['student','네 보관함에도 단서가 있어?'],['robot','안쪽을 열어 확인해 볼게요.']],{actions:[['보관함 열기',openStorage]]});}
function openStorage(){window.B0RoomDialogue?.remember(state,'storage',3);state.noteFound=true;save('발견','B-0 보관함에서 출입 기록 사본 발견');tone();robot('belongings');}
function noteMarkup(){return accessClues();}
function showNote(){if(state.noteTaken)modal('출입 기록 사본',noteMarkup()+btn('도어락 살펴보기','lock','primary'));}
function inventory(){modal('소지품',state.noteTaken?noteMarkup():'<p>아직 가지고 있는 물건이 없다.</p>');}
function lock(){
  window.B0RoomDialogue?.remember(state,'lock',2);state.guide=true;save();if(state.unlocked){door();return;}
  modal('세 자리 출입문 비밀번호',`<div class="v5-access-puzzle">${accessClues()}<div class="keypad"><label for="code">숫자 버튼으로 세 자리를 눌러요</label><input id="code" name="code" type="text" readonly inputmode="none" maxlength="3" value="${esc(codeDraft)}" aria-describedby="lock-status" placeholder="— — —"><div class="keys">${window.B0AccessLogic.digits.map(n=>btn(n,'digit-'+n,'key')).join('')}${btn('지우기','erase','key small')}${btn('확인','submit-code','key primary')}</div><p id="lock-status" role="status">궁금하면 B-0와 숫자를 하나씩 비교해 보세요.</p>${btn('B-0와 함께 생각하기','logic-help','primary wide')}</div></div>`,'lock-modal v5-access-modal');
}
function submitCode(value){
  const code=value===undefined?app.querySelector('#code').value:String(value),result=window.B0AccessLogic.check(code),status=app.querySelector('#lock-status');codeDraft=code;
  if(!/^[1-9]{3}$/.test(code)){status.textContent=result.reason;return;}
  state.attempts++;save('입력',code);
  if(!result.ok){tone(false);status.textContent=result.reason;return;}
  state.unlocked=true;window.B0RoomDialogue?.remember(state,'door',3);save('잠금 해제','직접 고른 세 자리 숫자를 모든 조건과 대조');tone();app.querySelector('.world').classList.add('unlocked');
  modal('잠금 해제','<p>모든 단서가 맞았다. 딸깍, 출입문의 잠금이 풀렸다.</p>'+btn('문 열고 나가기','escape','primary wide'));
}
function walkIntoCorridor(){
  const ticket=token,game=app.querySelector(".game");if(!game)return;
  game.classList.add("leaving-room");
  const layer=document.createElement("div");layer.className="corridor-transition";layer.setAttribute("aria-hidden","true");game.append(layer);
  const start=performance.now();
  function frame(now){
    if(ticket!==token)return;
    const t=Math.min(1,(now-start)/2100),ease=t*t*(3-2*t);
    if(t>=.5){const place=game.querySelector('.b0-location');if(place)place.textContent='1층 연구소 복도';}
    zoom=1+ease*2.6;panTo(-13,3);
    layer.style.opacity=String(Math.max(0,(t-.48)/.52));
    layer.style.transform=`scale(${1.04+.06*ease})`;
    if(t<1)walkFrame=requestAnimationFrame(frame);else{moving=false;ending();}
  }
  walkFrame=requestAnimationFrame(frame);
}
function ending() {
  roomView?.dispose();roomView=null;moving=false;
  showHall('practice');
}
function menu() {modal("메뉴",window.B0UI.menuContent({namespace:'action',close:'close',extras:`${btn(state.muted?"효과음 켜기":"효과음 끄기","sound")}${btn("생각거리","hint")}${btn("수업 안내","teacher")}${btn("진행 초기화","restart")}`}));}
function handle(a) {
  if(a==='campaign-home'){campaignHome();return;}
  if(a==='campaign-continue'){resumeAdventure();return;}
  if(a==='campaign-start'){if(hasAdventure())modal('처음부터 시작할까요?',`<p>V5의 방 진행을 초기화합니다. V1 기록은 유지됩니다.</p><div class="action-row">${btn('취소','close','secondary')}${btn('처음부터 시작','campaign-new','primary')}</div>`);else startAdventure();return;}
  if(a==='campaign-new'){startAdventure();return;}

  if(a==='chapter-two'||a==='hall-return'){app.querySelector('dialog')?.close();showHall('practice');return;}
  if(a==='chapter-three'){app.querySelector('dialog')?.close();showHall('storage');return;}
  if(a==="close"){app.querySelector("dialog")?.close();return;}
  if(a==="next"){if(state.line<intro.length-1){state.line++;renderIntro();}else{state.phase="room";save("도입","B-0와 만나 탐색 시작");revealRoom();}return;}
  if(a==="continue"){if(state.phase==="escaped")enterRoom();else revealRoom();return;}
  if(a==="restart"){modal("진행을 초기화할까요?",`<p>이번 탐색의 쪽지와 도어락 진행을 초기화하고 B-0와 처음 만나는 장면으로 돌아갑니다.</p><div class="action-row">${btn("계속하기","close","secondary")}${btn("초기화하고 시작","new","primary")}</div>`);return;}
  if(a.startsWith("epilogue-")){const line=Number(a.slice(9));if(state.phase==="escaped"&&[1,2,3].includes(line))ending(line);return;}
  if(a==="view-home"){
    if(state.phase==="intro"){opening();return;}
    if(!app.querySelector(".scene"))enterRoom(false,true);
    panTo(0,-5);setZoom(1);return;
  }
  if(a.startsWith("zoom-")){setZoom(a==="zoom-reset"?1:zoom+(a==="zoom-in"?.15:-.15));return;}
  if(a==="new"){state=fresh();logicTrial=null;codeDraft='';save();opening();return;}
  if(a.startsWith("approach-")){approach(a.slice(9));return;}
  if(a.startsWith("talk-")){robot(a.slice(5));return;}
  if(a==="inspect"){inspect();return;}
  if(a==="handle"){door(true);return;}
  if(a==="lock"){lock();return;}
  if(a==="ask-note"||a==="ask-storage"){askStorage();return;}
  if(a==="open-storage"){openStorage();return;}
  if(a==="take-note"){window.B0RoomDialogue?.remember(state,"note",3);state.noteTaken=true;save("획득","B-0에게 출입 기록 사본 받음");app.querySelector(".item-count").textContent="1";showNote();return;}
  if(a==="note"){showNote();return;}
  if(a==="inventory"){inventory();return;}
  if(a.startsWith("digit-")){const input=app.querySelector("#code"),digit=Number(a.slice(6));if(input&&input.value.length<3&&window.B0AccessLogic.digits.includes(digit)){input.value+=digit;codeDraft=input.value;}return;}
  if(a==="erase"){const input=app.querySelector("#code");input.value=input.value.slice(0,-1);codeDraft=input.value;return;}
  if(a==='logic-help'){logicCoach();return;}
  if(a==='logic-lock'){lock();return;}
  if(a==='logic-retry'){logicTrial=window.B0AccessLogic.fresh();logicCoach();return;}
  if(a.startsWith('logic-pick-')){const [, ,field,value]=a.split('-');if(window.B0AccessLogic.choose(logicTrial,field,value)){save('가설 확인',field+':'+value);logicCoach();}return;}
  if(a==="submit-code"){submitCode();return;}
  if(a==="escape"&&state.unlocked){state.phase="escaped";save("탈출","B-0와 함께 출입문을 열고 나감");app.querySelector("dialog")?.close();panTo(-13,3);setZoom(1);moving=true;const ticket=token;
    if(reduced()){roomView?.setDoorOpen(1);moving=false;ending();return;}
    roomView?.openDoor();timer=setTimeout(()=>{if(ticket!==token)return;walkIntoCorridor();},1550);return;}
  if(a==="menu"){menu();return;}
  if(a==="sound"){state.muted=!state.muted;save();menu();return;}
  if(a==='hint'){logicCoach();return;}
  if(a==='teacher'){modal('출입 기록 · 추론 퍼즐','<p>숫자 사이의 네 조건을 비교해 비밀번호를 찾습니다. B-0는 학생이 고른 가설의 다음 확인 지점을 질문하며 정답을 대신 제시하지 않습니다.</p><small>선택에 따라 미리 작성한 질문이 이어지는 방식입니다. 실제 생성형 AI 연결은 사용하지 않습니다.</small>');}
}
app.addEventListener("click",e=>{
  const review=e.target.closest('button[data-action]')?.dataset.action;
  if(review==='jump-lesson-next'){e.preventDefault();if((state.chapter||1)<4)reviewLesson((state.chapter||1)+1);else jumpLessonEnd();return;}
  if(review==='jump-lesson-menu'){e.preventDefault();modal('차시 이동 · 임시 검토용',`<p>처음 위치로는 시점만 초기화합니다. 아래 버튼은 해당 차시를 처음부터 다시 시작합니다.</p><div class="options">${[1,2,3,4].map(n=>btn(n+'차시 시작','review-lesson-'+n,'secondary')).join('')}</div>`);return;}
  if(review?.startsWith('review-lesson-')){e.preventDefault();reviewLesson(Number(review.slice(14)));return;}
  const jump=e.target.closest('button[data-action="jump-lesson-end"]');
  if(jump&&!jump.disabled){e.preventDefault();jumpLessonEnd();return;}
  if(suppressClick&&e.detail!==0){suppressClick=false;e.preventDefault();return;}
  const b=e.target.closest("button[data-action]");if(b&&!b.disabled&&!moving)handle(b.dataset.action);
});
window.addEventListener("resize",()=>panTo(camera.x,camera.y));
app.addEventListener("keydown",e=>{if(e.target.id==="code"&&e.key==="Enter"){e.preventDefault();submitCode();}});
function travelReviewLocation(id){
  const rooms=['practice','education','storage','access','mirror','reflection','central'];
  if(!rooms.includes(id)&&id!=='hall'&&id!=='hall2')return;
  window.B0RoomTransit?.cancel();stopAdventure();navigation.reviewMode=true;navigation.companion=null;delete navigation.room;
  navigation.floor=(id==='hall2'||id==='central')?2:1;
  navigation.camera={x:0,z:navigation.floor===2?-2350:id==='hall'?80:window.B0LabNavigation.doors[id].z,yaw:0,pitch:-4};
  if(id==='hall'||id==='hall2'){showHall();return;}
  // Review travel bypasses only entry distance/access; it never completes a puzzle or grants an item.
  if(id==='practice'){enterPracticeVisit();return;}
  if(id==='education'){enterEducation();return;}
  if(id==='storage'){enterChapterTwo(true);return;}
  if(id==='access'){enterChapterThree('access',true);return;}
  if(id==='mirror'){enterChapterThree('mirror',true);return;}
  if(id==='reflection'){enterReflection();return;}
  enterChapterFour(true);
}
window.B0CampaignUI={travel:travelReviewLocation,location:()=>({floor:app.querySelector('.lab-game')?navigation.floor:state.chapter===4?2:1,z:navigation.camera.z,stairsUnlocked:navigation.stairsUnlocked,current:app.querySelector('.b0-location')?.textContent||'출입 관리실'})};
// The V5 campaign starts after this reusable room controller.
