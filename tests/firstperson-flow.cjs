const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map();
function el(k){if(!elements.has(k))elements.set(k,{innerHTML:'',textContent:'',value:'',hidden:false,style:{},dataset:{},offsetWidth:600,offsetHeight:700,clientWidth:400,clientHeight:600,handlers:{},addEventListener(k,f){this.handlers[k]=f},setPointerCapture(){},hasPointerCapture(){return false},querySelector(){return null},cloneNode(){return null},classList:{add(){},remove(){},contains(){return false}},insertAdjacentHTML(){},select(){}});return elements.get(k);}
const app={innerHTML:'',querySelector:k=>k==='dialog'?null:el(k),addEventListener(){},querySelectorAll:()=>[]};
let storage=null;
const ctx=vm.createContext({document:{querySelector:()=>app},localStorage:{getItem:()=>storage,setItem:(k,v)=>storage=v},setTimeout:f=>{f();return 1},clearTimeout(){},window:{addEventListener(){},matchMedia:()=>({matches:true})}});
const run=s=>vm.runInContext(s,ctx);
run(fs.readFileSync(path.join(__dirname,'../firstperson.js'),'utf8').replace(/boot\(\);\s*$/,''));
run('tone=()=>{};modal=(title,content)=>{globalThis.panel={title,content}};');
run('boot();');
assert.match(app.innerHTML,/class="face"/);
assert.match(el('.intro-speech').innerHTML,/넌, 넌 누구야/);
assert.doesNotMatch(app.innerHTML,/student-character|student-v2/);
run('for(let i=0;i<intro.length;i++)handle("next");');
assert.equal(run('state.phase'),'room');
assert.match(app.innerHTML,/class="background"/);
assert.doesNotMatch(app.innerHTML,/student-character|student-v2/);
run('approach("door");inspect();handle("handle");handle("lock");');
assert.equal(run('panel.title'),'출입문 도어락');
run('submitCode("1111");');assert.equal(run('state.unlocked'),false);
assert.equal(el('#lock-status').textContent,'번호가 일치하지 않습니다.');
run('approach("map");inspect();');assert.equal(run('state.guide'),true);
assert.match(run('panel.content'),/관리용 쪽지/);
run('approach("robot");inspect();');assert.match(run('panel.content'),/네가 갖고 있는 건 없어/);
run('handle("ask-note");handle("open-storage");');
assert.equal(run('state.noteFound'),true);assert.equal(run('state.noteTaken'),false);
assert.match(run('panel.content'),/확인하기 전에는 몰랐/);
run('robot();handle("take-note");');assert.equal(run('state.noteTaken'),true);
assert.match(run('panel.content'),/4732/);
run('inventory();');assert.match(run('panel.content'),/4732/);
run('approach("lock");inspect();submitCode("4732");');assert.equal(run('state.unlocked'),true);
assert.equal(run('state.phase'),'room');run('handle("escape");');assert.equal(run('state.phase'),'escaped');
assert.equal(run('load().noteTaken'),true);
assert.match(run('panel.content'),/함께 출구를 찾아/);
// The player can discover the compartment without being forced to read the guide first.
run('state=fresh();state.phase="room";robot();handle("ask-storage");handle("open-storage");handle("take-note");');
assert.equal(run('state.guide'),false);assert.equal(run('state.noteTaken'),true);
console.log('PASS: face-first intro, no student avatar, guide mission, B-0 compartment, recoverable note pickup, keypad retry, exit, save, free exploration order');

// Full-turn yaw wraps continuously; vertical look stays comfortable.
run('panTo(380,-9999)');assert.equal(run('camera.x'),20);assert.equal(run('camera.y'),-18);
run('panTo(-380,9999)');assert.equal(run('camera.x'),-20);assert.equal(run('camera.y'),18);
assert.match(el('.room-rig').style.transform,/rotateY\(-20deg\)/);
assert.match(app.innerHTML,/내 위치: 교육 실습실/);assert.match(app.innerHTML,/처음으로/);
for(const wall of ['wall-left','wall-right','wall-back','wall-floor','wall-ceiling'])assert.ok(app.innerHTML.includes(wall));
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
