const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../mirror-model.js');
const nodes=new Map();function node(k){if(!nodes.has(k))nodes.set(k,{style:{},dataset:{},hidden:false,isConnected:true,clientWidth:616,clientHeight:500,innerHTML:'',textContent:'',classList:{toggle(){},add(){},remove(){}},querySelector:s=>node(k+s),querySelectorAll:()=>[],addEventListener(){},setPointerCapture(){},hasPointerCapture(){return true;},releasePointerCapture(){}});return nodes.get(k);}
const app={querySelector:s=>s==='.mr-modal'?null:node(s),addEventListener(){},removeEventListener(){}};
let serial=0,complete=0,saves=0;const frames=new Map(),timers=new Map();
const context={window:{B0Mirror:M,addEventListener(){},removeEventListener(){}},matchMedia:()=>({matches:true}),performance:{now:()=>0},requestAnimationFrame(fn){frames.set(++serial,fn);return serial;},cancelAnimationFrame(n){frames.delete(n);},setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial;},clearTimeout(n){timers.delete(n);}};
const source=fs.readFileSync(require.resolve('../mirror-room.js'),'utf8').replace('return {dispose};','return {dispose,act,select,activateObject,down,move,up,cancelPointer,state:()=>({s,camera,robotBusy,robot})};');
vm.runInNewContext(source,context);const s=M.fresh();const game=context.window.startMirrorRoom({app,portrait:()=>'',state:s,onSave(){saves++;},onBack(){},onComplete(){complete++;}});
const flush=()=>{while(frames.size){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(1000);}};
game.act('intro-next');game.act('intro-next');assert.equal(game.state().robotBusy,true);flush();
assert.equal(s.line,2);assert.equal(node('.mr-stage').dataset.phase,'approach');
for(let i=0;i<4;i++)game.act('intro-next');assert.equal(s.phase,'split');
game.act('ask-see');assert.doesNotMatch(node('.mr-speech').innerHTML,/삼각형/);
game.select('triangle');game.act('command-triangle-down');flush();assert.equal(s.active,'triangle');assert.equal(s.holding,null);
game.act('command-square-release');assert.equal([...timers.values()].some(t=>t.ms===700),true,'a request about another target must not cancel spring return');
for(const [id,t]of timers)if(t.ms===700){timers.delete(id);t.fn();}
assert.equal(s.active,null,'momentary movement springs back');
game.act('pull');flush();assert.equal(s.phase,'split');
game.act('command-triangle-hold');flush();assert.equal(s.holding,'triangle');
game.act('home');flush();assert.equal(game.state().camera.zoom,1);assert.equal(s.holding,'triangle','home preserves the instruction');
function event(x,y,own){return {pointerId:1,button:0,clientX:x,clientY:y,preventDefault(){},target:{closest:sel=>own&&sel==='[data-mr-drag="own"]'?{}:null}};}
let yaw=game.state().camera.yaw;game.down(event(200,200,false));game.move(event(340,215,false));game.up(event(340,215,false));assert.notEqual(game.state().camera.yaw,yaw);assert.ok(game.state().camera.x<0,'camera stays on the student side');
yaw=game.state().camera.yaw;game.down(event(200,200,true));game.move(event(200,300,true));game.up(event(200,300,true));assert.equal(s.phase,'unlocked');assert.equal(game.state().camera.yaw,yaw,'handle drag must not rotate the room');
game.activateObject('door');assert.equal(complete,0,'cannot leave B-0 behind');game.act('reunite');flush();assert.equal(s.phase,'reunited');assert.ok(game.state().robot.x<0,'B-0 crosses into the student compartment');game.activateObject('door');assert.equal(complete,1);assert.equal(s.phase,'complete');assert.ok(saves>0);
game.dispose();assert.equal(frames.size,0);
console.log('PASS: split introduction, no early answer, momentary movement, persistent request, independent camera, direct hand drag, cooperation, reunited exit and cleanup');

const nextState=M.fresh();nextState.phase='split';
const parallel=context.window.startMirrorRoom({app,portrait:()=>'',state:nextState,onSave(){},onBack(){},onComplete(){}});
parallel.act('command-triangle-hold');parallel.select('own');flush();
assert.match(node('.mr-actions').innerHTML,/data-mr="pull"/,'B-0 finishing a walk must preserve the student current object controls');
assert.equal(nextState.holding,'triangle');parallel.dispose();
console.log('PASS: robot walk completion preserves a newer student object selection');
