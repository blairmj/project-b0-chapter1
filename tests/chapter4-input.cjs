const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../chapter4-model.js');
const nodes=new Map();function node(k){if(!nodes.has(k))nodes.set(k,{style:{},dataset:{},isConnected:true,clientWidth:616,clientHeight:460,innerHTML:'',textContent:'',classList:{toggle(){},add(){},remove(){}},querySelector:s=>node(k+s),setAttribute(){},addEventListener(){},removeEventListener(){},setPointerCapture(id){this.captured=id;},hasPointerCapture(id){return this.captured===id;},releasePointerCapture(){this.captured=null;}});return nodes.get(k);}
const initial=M.fresh();Object.assign(initial,{phase:'room',met:true,boss:true});
let saved,now=0,id=0;const frames=new Map(),timers=new Map(),app={innerHTML:'',querySelector:s=>node(s),addEventListener(){},removeEventListener(){}};
const storage={getItem:k=>k==='project-b0-final-v2'?JSON.stringify(initial):null,setItem(k,v){if(k==='project-b0-final-v2')saved=JSON.parse(v);}};
const ctx={window:{B0Final:M,addEventListener(){},removeEventListener(){}},localStorage:storage,sessionStorage:storage,matchMedia:()=>({matches:true}),performance:{now:()=>now},setTimeout(f){timers.set(++id,f);return id;},clearTimeout(n){timers.delete(n);},requestAnimationFrame(f){frames.set(++id,f);return id;},cancelAnimationFrame(n){frames.delete(n);}};
let closedContexts=0;
ctx.window.AudioContext=class{
  constructor(){this.currentTime=0;this.closed=false;this.destination={};}
  resume(){} createGain(){return {connect(){},disconnect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}
  createOscillator(){return {connect(){},disconnect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}};}
  close(){assert.equal(this.closed,false,'AudioContext cannot be closed twice');this.closed=true;closedContexts++;}
};
ctx.document={addEventListener(){}};vm.runInNewContext(fs.readFileSync(require.resolve('../ui-common.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(require.resolve('../chapter4.js'),'utf8').replace('render();return {dispose,jumpToEnd};','render();return {dispose,jumpToEnd,act,select,down,move,up,click,updateMechanical,state:()=>({s,r,camera,robot,journey,conversation})};'),ctx);
const g=ctx.window.startChapterFour({app,portrait:()=>'',onBack(){}});
function step(t){now=t;const pending=[...frames];frames.clear();pending.forEach(([,f])=>f(t));}
function event(x,y,drag){return {button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){},target:{closest:sel=>sel==='[data-c4-drag]'&&drag?Object.assign(node('drag'),{dataset:{c4Drag:drag}}):null}};}
const stage=node('.c4-stage'),tap=event(200,200);
tap.target.closest=sel=>sel==='[data-c4-object]'?{dataset:{c4Object:'door'}}:null;
g.down(tap);assert.equal(stage.captured,undefined,'world-object taps must keep their original event target');
const tapYaw=g.state().camera.yaw;g.move({...tap,clientX:203,clientY:201});assert.equal(g.state().camera.yaw,tapYaw,'small hand jitter is a tap, not a camera turn');
g.up(tap);g.click(tap);assert.match(node('.c4-actions').innerHTML,/문 손잡이 돌리기/,'a pointer tap reaches the real door selection handler');
g.state().s.boss=false;g.updateMechanical();assert.equal(node('.c4-bolt').style.translate,'78px 0');assert.equal(node('.c4-bolt-upper').style.translate,'78px 0');assert.equal(g.state().s.upper,false,'temporary visitor clearance must not solve the final puzzle');
g.state().s.boss=true;g.updateMechanical();assert.equal(node('.c4-bolt').style.translate,'0px 0');assert.equal(node('.c4-bolt-upper').style.translate,'0px 0');
g.down(event(200,200));g.move(event(300,210));assert.equal(stage.captured,1,'a real orbit captures only after movement begins');g.up(event(300,210));g.click(event(300,210));assert.equal(stage.captured,null);
assert.equal(node('.c4-robot').dataset.pose,'controlled');g.act('ask-body');assert.equal(g.state().s.bodyChecked,true);
g.state().s.links.robot=false;step(100);assert.equal(node('.c4-robot').dataset.pose,'recovering');
g.act('request-lift');g.select('records');assert.equal(g.state().r.lifted,false,'wrong request target does not solve puzzle');
g.act('request-lift');g.select('high');step(200);assert.equal(g.state().camera.height,145);
const yaw=g.state().camera.yaw;g.down(event(200,200,'high'));g.move(event(280,200,'high'));g.up(event(280,200,'high'));assert.equal(g.state().s.upper,true);assert.equal(g.state().camera.yaw,yaw,'latch drag does not orbit');
g.act('lower');step(300);assert.ok(Math.hypot(g.state().robot.x-g.state().camera.x,g.state().robot.z-g.state().camera.z)*3.9>190,'B-0 steps aside after lowering the student instead of covering the exit');const landed=g.state(),toHandle={x:-242.5-landed.camera.x,z:286-landed.camera.z},toRobot={x:landed.robot.x-landed.camera.x,z:landed.robot.z-landed.camera.z};const sightGap=Math.abs(toHandle.x*toRobot.z-toHandle.z*toRobot.x)/Math.hypot(toHandle.x,toHandle.z);assert.ok(sightGap>25,'after lowering, B-0 must stand clear of the view and click path to the side handle');const viewYaw=g.state().camera.yaw;g.act('robot');step(310);assert.equal(g.state().camera.yaw,viewYaw,'asking B-0 from the footer must not turn away from the current puzzle');assert.equal(g.state().camera.height,0);assert.equal(g.state().s.upper,true);
g.act('request-hold');g.select('handle');assert.equal(g.state().s.holding,true);assert.equal(node('.c4-robot').dataset.pose,'holding');
g.down(event(200,200,'grip'));g.move(event(200,265,'grip'));g.up(event(200,265,'grip'));assert.equal(g.state().r.handle,1);
for(let t=400;t<=2400;t+=100)step(t);assert.equal(node('.c4-stage').dataset.reported,'yes');assert.equal(g.state().s.opened,false);g.act('ask-door');assert.match(node('.c4-speech').innerHTML,/아직 문에 걸려/);
g.act('release-b0');assert.ok(g.state().robot.x>-85,'released B-0 waits on the clear side of the exit');assert.equal(g.state().r.latch,0);assert.equal(g.state().s.upper,true);
g.act('request-hold');g.select('handle');g.act('pull');for(let t=2500;t<=7900;t+=100)step(t);assert.equal(saved.opened,true);
g.act('leave');assert.equal(g.state().s.phase,'room');g.act('release-b0');g.act('enter-exit');assert.equal(g.state().s.phase,'farewell');for(let i=0;i<6;i++)g.act('story-next');assert.equal(g.state().s.phase,'ending');for(let i=0;i<6;i++)g.act('story-next');assert.equal(g.state().s.phase,'complete');
g.dispose();g.dispose();assert.equal(frames.size,0);assert.equal(timers.size,0);assert.equal(closedContexts,1,'back navigation and campaign cleanup share an idempotent disposal');
ctx.matchMedia=()=>({matches:false});initial.opened=initial.upper=true;initial.links.robot=false;now=0;
const a=ctx.window.startChapterFour({app,portrait:()=>'',onBack(){}});a.act('leave');step(1100);assert.equal(node('.c4-robot').dataset.pose,'walking');step(2300);assert.equal(a.state().s.phase,'farewell');for(let i=0;i<6;i++)a.act('story-next');step(3900);assert.ok(Number(node('.c4-passage-robot').style.opacity)>0);step(5400);assert.equal(a.state().s.phase,'ending');a.dispose();assert.equal(frames.size,0);
console.log('PASS: target selection, lift and descent, physical drags, real bolt check, release/reset, held robot cannot be abandoned, walking ending, cleanup');

Object.assign(initial,M.fresh());const introGame=ctx.window.startChapterFour({app,portrait:()=>'',onBack(){}});assert.match(app.innerHTML,/2층 중앙관리실 앞/);for(let i=0;i<4;i++)introGame.act('story-next');assert.match(app.innerHTML,/문 열고 들어가기/);assert.doesNotMatch(app.innerHTML,/저쪽에 출구/);introGame.dispose();
console.log('PASS: world-object tap target retained, drag slop and capture, visitor bolt clearance, conversation keeps view, one central-room entry');

const skipGame=ctx.window.startChapterFour({app,portrait:()=>'',onBack(){}});skipGame.jumpToEnd();
const skipped=M.restore(saved);assert.equal(skipped.phase,'ending');assert.equal(skipped.opened,true);assert.equal(skipped.links.robot,false);assert.equal(skipped.holding,false);skipGame.dispose();
console.log('PASS: temporary final-lesson jump saves a valid ending with B-0 free');

Object.assign(initial,M.fresh(),{phase:'room'});
const dialogueGame=ctx.window.startChapterFour({app,portrait:()=>'',onBack(){}});
dialogueGame.act('try-door');
const activeTalk=dialogueGame.state().conversation;
assert.ok(activeTalk);
assert.doesNotMatch(node('.c4-actions').innerHTML,/<button/,'a story conversation must hide old object actions');
for(const action of ['robot','clear','home','enter-exit']){
  dialogueGame.act(action);
  assert.equal(dialogueGame.state().conversation,activeTalk);
  assert.equal(node('.c4-speech').hidden,false,'room controls cannot hide a conversation while leaving input blocked');
}
node('.c4-speech').hidden=true;
dialogueGame.select('door');
assert.equal(node('.c4-speech').hidden,false,'clicking the exit recovers a previously hidden conversation');
for(let i=0;i<7;i++)dialogueGame.act('talk-next');
assert.equal(dialogueGame.state().conversation,null);
assert.equal(dialogueGame.state().s.boss,false);
dialogueGame.act('enter-exit');
assert.equal(dialogueGame.state().s.boss,true,'the visitor-only exit continues the B-0 confrontation instead of silently doing nothing');
for(let i=0;i<4;i++)dialogueGame.act('talk-next');
dialogueGame.act('enter-exit');
assert.equal(dialogueGame.state().s.phase,'room','clicking the closed exit cannot skip the puzzle');
assert.match(node('.c4-actions').innerHTML,/문 손잡이 돌리기/);
dialogueGame.dispose();
console.log('PASS: hidden-conversation recovery, story control guard, clickable portal progression, closed exit cannot skip puzzle');

Object.assign(initial,M.fresh());
const arrivingGame=ctx.window.startChapterFour({app,portrait:()=>'',onBack(){},arrived:true});
assert.equal(arrivingGame.state().s.phase,'room');
assert.match(app.innerHTML,/c4-world/,'hall entry introduces AXIOM inside the actual 3D room');
assert.ok(arrivingGame.state().conversation,'arrival preserves the introduction dialogue');
assert.equal(arrivingGame.state().s.boss,false);assert.equal(arrivingGame.state().s.upper,false);
arrivingGame.dispose();
console.log('PASS: hall entry preserves the introduction in the 3D room without solving any puzzle');
