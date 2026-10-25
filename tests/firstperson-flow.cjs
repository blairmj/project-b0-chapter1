const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map();
function el(k){if(!elements.has(k))elements.set(k,{innerHTML:'',textContent:'',value:'',hidden:false,style:{},dataset:{},offsetWidth:600,offsetHeight:700,clientWidth:400,clientHeight:600,handlers:{},addEventListener(k,f){this.handlers[k]=f},setPointerCapture(){},hasPointerCapture(){return false},querySelector(){return null},getBoundingClientRect(){return {left:0,top:0,width:600,height:900}},cloneNode(){return null},classList:{add(){},remove(){},contains(){return false}},insertAdjacentHTML(){},select(){}});return elements.get(k);}
const app={innerHTML:'',querySelector:k=>k==='dialog'?null:el(k),addEventListener(){},querySelectorAll:()=>[]};
let storage=null;const extraStorage=new Map();
const ctx=vm.createContext({createRoomPanorama:()=>({view(){},setDoorOpen(){},openDoor(){},dispose(){}}),document:{querySelector:()=>app,addEventListener(){}},localStorage:{getItem:k=>k==='project-b0-firstperson-v4'?storage:extraStorage.get(k)??null,setItem:(k,v)=>{if(k==='project-b0-firstperson-v4')storage=v;else extraStorage.set(k,v);},removeItem(k){extraStorage.delete(k);}},setTimeout:f=>{f();return 1},clearTimeout(){},cancelAnimationFrame(){},window:{B0LabNavigation:require('../lab-navigation-model.js'),addEventListener(){},matchMedia:()=>({matches:true})}});
const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync(path.join(__dirname,'../ui-common.js'),'utf8'));
run(fs.readFileSync(path.join(__dirname,'../firstperson.js'),'utf8').replace(/boot\(\);\s*$/,''));
run('tone=()=>{};modal=(title,content)=>{globalThis.panel={title,content}};');
run('boot();');
assert.match(app.innerHTML,/campaign-home/);
run('handle("campaign-start");');
assert.match(app.innerHTML,/class="face"/);
assert.match(el('.intro-speech').innerHTML,/넌, 넌 누구야/);
assert.doesNotMatch(app.innerHTML,/student-character|student-v2/);
run('for(let i=0;i<intro.length;i++)handle("next");');
assert.equal(run('state.phase'),'room');
assert.match(app.innerHTML,/class="panorama-canvas"/);
assert.doesNotMatch(app.innerHTML,/student-character|student-v2/);
run('approach("door");inspect();handle("handle");handle("lock");');
assert.equal(run('panel.title'),'출입문 도어락');
run('submitCode("1111");');assert.equal(run('state.unlocked'),false);
assert.equal(el('#lock-status').textContent,'번호가 일치하지 않습니다.');
run('approach("map");inspect();');assert.equal(run('state.guide'),true);
assert.match(run('panel.content'),/관리용 쪽지/);
run('approach("robot");inspect();');assert.match(run('panel.content'),/비밀번호 쪽지를 알아/);
run('handle("ask-note");handle("open-storage");');
assert.equal(run('state.noteFound'),true);assert.equal(run('state.noteTaken'),false);
assert.match(run('panel.content'),/확인하기 전에는 몰랐/);
run('robot();handle("take-note");');assert.equal(run('state.noteTaken'),true);
assert.match(run('panel.content'),/4732/);
run('inventory();');assert.match(run('panel.content'),/4732/);
run('approach("lock");inspect();submitCode("4732");');assert.equal(run('state.unlocked'),true);
assert.equal(run('state.phase'),'room');run('handle("escape");');assert.equal(run('state.phase'),'escaped');
assert.equal(run('load().noteTaken'),true);
assert.match(app.innerHTML,/연구소 복도/);run('handle("epilogue-1")');assert.match(app.innerHTML,/함께 출구를 찾아/);run('handle("epilogue-2")');assert.doesNotMatch(app.innerHTML,/AXIOM/);
// The player can discover the compartment without being forced to read the guide first.
run('state=fresh();state.phase="room";enterRoom();robot();handle("ask-storage");handle("open-storage");handle("take-note");');
assert.equal(run('state.guide'),false);assert.equal(run('state.noteTaken'),true);
console.log('PASS: face-first intro, no student avatar, guide mission, B-0 compartment, recoverable note pickup, keypad retry, exit, save, free exploration order');

// Full-turn yaw wraps continuously; vertical look stays comfortable.
run('panTo(380,-9999)');assert.equal(run('camera.x'),20);assert.equal(run('camera.y'),-18);
run('panTo(-380,9999)');assert.equal(run('camera.x'),-20);assert.equal(run('camera.y'),18);
assert.match(el('.room-rig').style.transform,/rotateY\(-20deg\)/);
assert.match(app.innerHTML,/교육 실습실/);assert.match(app.innerHTML,/처음 위치로/);assert.doesNotMatch(app.innerHTML,/view-direction|room-goal/);
for(const wall of ['wall-left','wall-right'])assert.ok(app.innerHTML.includes(wall));
assert.doesNotMatch(app.innerHTML,/방 전체 보기/);
console.log('PASS: bounded camera and removal of full-room navigation button');

const scene=el('.scene');
run('moving=false;bindCamera();panTo(0,0)');
function pointer(x,y){return {pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,preventDefault(){}}}
scene.handlers.pointerdown(pointer(100,100));scene.handlers.pointermove(pointer(104,100));
assert.equal(run('camera.x'),0);scene.handlers.pointerup(pointer(104,100));assert.equal(run('suppressClick'),false);
scene.handlers.pointerdown(pointer(100,100));scene.handlers.pointermove(pointer(180,130));
assert.ok(Math.abs(run('camera.x')+12.8)<.00001);assert.equal(run('camera.y'),3);scene.handlers.pointerup(pointer(180,130));assert.equal(run('suppressClick'),true);
scene.handlers.pointerdown(pointer(100,100));scene.handlers.pointercancel(pointer(100,100));assert.equal(run('drag'),null);
console.log('PASS: click slop, mouse/touch pointer drag, click suppression, pointer cancellation');

run('panTo(0,0)');for(let i=0;i<24;i++)scene.handlers.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(run('camera.x'),0);
for(const [id,title] of [['cabinet','보관장'],['bench','실습대'],['window','관찰창']]){run('approach('+JSON.stringify(id)+')');assert.equal(run('panel.title'),title)}
run('handle("restart")');assert.equal(run('state.noteTaken'),true);assert.match(run('panel.content'),/계속하기/);
run('handle("new")');assert.equal(run('state.phase'),'intro');assert.equal(run('state.noteTaken'),false);
console.log('PASS: 360-degree keyboard turn, side-wall inspections, restart confirmation and reset');

assert.match(run('portrait()'),/b0-body-v3.webp/);assert.doesNotMatch(run('portrait()'),/portrait-photo|portrait-character|b0-awakening/);
console.log('PASS: shared transparent body source; no rectangular portrait layer');

run('state.phase="room";enterRoom();setZoom(999)');assert.equal(run('zoom'),1.8);
run('setZoom(-999)');assert.equal(run('zoom'),.55);
run('panTo(60,10);handle("view-home")');assert.equal(run('zoom'),1);assert.equal(run('camera.x'),0);assert.equal(run('camera.y'),-5);assert.equal(run('state.phase'),'room');
assert.ok(Math.abs(parseFloat(el('.scene').style.perspective)-190.24)<.01,'wider default view');
run('setZoom(1.5)');assert.ok(Math.abs(parseFloat(el('.scene').style.perspective)-285.36)<.01,'zoom retains the wider shared projection');
const touch=(id,x)=>({...pointer(x,100),pointerId:id,pointerType:'touch',isPrimary:id===1});
run('setZoom(1);bindCamera()');scene.handlers.pointerdown(touch(1,100));scene.handlers.pointerdown(touch(2,200));scene.handlers.pointermove(touch(2,250));assert.equal(run('zoom'),1.5);
scene.handlers.pointerup(touch(1,100));scene.handlers.pointerup(touch(2,250));assert.equal(run('pinch'),null);assert.equal(run('touchPoints.size'),0);assert.equal(run('suppressClick'),true);
run('state=fresh();state.phase="room";approach("filebox")');assert.match(run('panel.content'),/준비물 목록/);assert.equal(run('state.noteFound'),false);
run('approach("envelope")');assert.match(run('panel.content'),/장비 관리 안내/);assert.equal(run('state.noteTaken'),false);assert.equal(run('state.unlocked'),false);
console.log('PASS: zoom limits, shared focal length, home view without progress reset, pinch cleanup, optional decoys');

run('state=fresh();state.phase="room";robot()');assert.match(run('panel.content'),/무엇을 물어볼까/);assert.doesNotMatch(run('panel.content'),/talk-password|<input|<textarea/);
for(const t of ['identity','where','exit','belongings']){run('handle("talk-'+t+'")');assert.match(run('panel.content'),/conversation-reply/);assert.equal(run('state.noteFound'),false);}
assert.match(run('panel.content'),/ask-storage/);
run('state.guide=true;robot()');assert.match(run('panel.content'),/talk-password/);assert.match(run('panel.content'),/talk-limits/);
run('handle("talk-password")');assert.doesNotMatch(run('panel.content'),/4732/);assert.match(run('panel.content'),/확인하지 않은 번호/);
run('handle("talk-belongings");handle("ask-storage");handle("open-storage")');assert.equal(run('state.noteFound'),true);assert.match(run('panel.content'),/쪽지 받기/);
run('handle("take-note");handle("talk-limits")');assert.match(run('panel.content'),/안을 확인하기 전/);assert.equal(run('state.noteTaken'),true);
console.log('PASS: selectable questions, context-sensitive topics, no early password reveal, conversation-to-compartment flow');

assert.doesNotMatch(run('JSON.stringify(intro)'),/실망하셨나요|먼저 출입구/);
assert.match(run('JSON.stringify(intro)'),/궁금한 것이 있으면/);
assert.doesNotMatch(run('openingHeader()'),/restart|처음으로/);
run('state.phase="escaped";state.noteTaken=true;state.unlocked=true;ending(1)');assert.match(app.innerHTML,/corridor-b0 walking/);
run('handle("epilogue-2")');assert.match(app.innerHTML,/corridor-b0 walking/);assert.doesNotMatch(app.innerHTML,/AXIOM/);
run('handle("epilogue-3")');assert.match(app.innerHTML,/같이 가 보자/);assert.match(app.innerHTML,/chapter-two/);assert.doesNotMatch(app.innerHTML,/data-action="epilogue-|data-action="restart"/);
run('enterRoom(false,true);panTo(70,12);setZoom(1.6);handle("view-home")');assert.equal(run('state.phase'),'escaped');assert.equal(run('state.noteTaken'),true);assert.equal(run('state.unlocked'),true);assert.equal(run('camera.x'),0);assert.equal(run('zoom'),1);
console.log('PASS: revised opening, corridor continuation, late AXIOM reveal preserved, home preserves completed progress');
