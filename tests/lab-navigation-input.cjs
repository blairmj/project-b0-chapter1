const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../lab-navigation-model.js');
const nodes=new Map();
function node(k){if(!nodes.has(k))nodes.set(k,{style:{},dataset:{},clientWidth:760,clientHeight:480,hidden:false,innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},contains(){return true},focus(){},getBoundingClientRect(){return {left:0,top:0,width:760,height:480}}});return nodes.get(k);}
let htmlWrites=0,clock=0,id=0,saves=0;const frames=new Map(),timers=new Map();
const app={set innerHTML(v){htmlWrites++;},querySelector:node,addEventListener(){},removeEventListener(){}};
const context={window:{B0LabNavigation:M,addEventListener(){},removeEventListener(){}},performance:{now:()=>clock},matchMedia:()=>({matches:false}),requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:n=>frames.delete(n),setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:n=>timers.delete(n)};
vm.runInNewContext(fs.readFileSync(require.resolve('../lab-navigation.js'),'utf8').replace('render();save();return {dispose};','render();save();return {dispose,act,walkTo,click,state:()=>({camera,companion,s})};'),context);
function finish(){let limit=0;while(frames.size){assert.ok(limit++<100,'animation must finish');clock+=250;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(clock));}}
const state=M.fresh();state.cleared.practice=true;
const g=context.window.startLabNavigation({app,portrait:()=>'',state,onSave:()=>saves++,onEnter(){},onHome(){},muted:true});
const original={...g.state().companion};g.act('turn-left');finish();
assert.equal(g.state().companion.x,original.x);assert.equal(g.state().companion.z,original.z,'looking around must not teleport B-0');
g.walkTo('practice');finish();assert.equal(g.state().camera.z,80);assert.equal(Math.abs(g.state().camera.yaw),180);assert.equal(state.powerOut,false,'looking back at the classroom does not cut power');
g.walkTo('storage');assert.doesNotMatch(node('.lab-actions').innerHTML,/data-lab="enter-/,'previous door actions disappear while walking to a new destination');finish();assert.equal(state.camera.z,-320);assert.ok(state.barrierTriggered,'the shutter descends after entering the corridor');
assert.equal(state.powerOut,true,'stepping into the corridor records the outage');
assert.match(node('.lab-notice').innerHTML,/뭔가 밟았어/,'the player notices the floor cover before the announcement');
const outageTimers=[...timers.values()];timers.clear();outageTimers.forEach(f=>f());
assert.match(node('.lab-notice').innerHTML,/전원이 차단되었습니다/,'the delayed announcement explains why the lights changed');
assert.ok(g.state().companion.z>=M.bound(state,0,-9999).z,'B-0 cannot stand beyond a closed barrier');
M.returned(state,'mirror');state.cleared.storage=true;state.keyboxOpen=true;
g.act('upstairs');finish();
assert.equal(state.floor,1);assert.ok(g.state().camera.height>0,'the player takes a few physical steps before rejection');
const rejectDelay=[...timers.values()];timers.clear();rejectDelay.forEach(f=>f());finish();
assert.equal(g.state().camera.z,-1695);assert.equal(g.state().camera.height,0,'rejection returns the player to the foot of the stairs');
assert.match(node('.lab-notice').innerHTML,/밀려 내려왔어/);
const writes=htmlWrites;g.act('take-key');assert.ok(state.keyTaken);assert.equal(htmlWrites,writes,'picking up a key must not rebuild the corridor or replace B-0');
g.act('unlock-stairs');g.act('upstairs');finish();assert.equal(state.floor,2);assert.equal(state.companion.floor,2);assert.equal(M.groundAt(state.companion.z),360);
g.act('downstairs');finish();assert.equal(state.floor,1);assert.equal(M.groundAt(state.companion.z),0);assert.ok(state.stairsUnlocked);
g.dispose();assert.equal(frames.size,0);assert.equal(timers.size,0);assert.ok(saves>5);
const edge=M.fresh();edge.cleared={practice:true,storage:true,access:true,mirror:true};edge.camera.z=-1610;
const e=context.window.startLabNavigation({app,portrait:()=>'',state:edge,onSave(){},onEnter(){},onHome(){},muted:true});
assert.ok(e.state().companion.z>-1810,'on leaving the mirror room B-0 must stay in front of the locked stair door');e.dispose();
console.log('PASS: physical B-0 position survives rotation and key pickup, entry shutter trigger, closed-wall clearance, stair round trip, floor grounding and cleanup');

let lastDialog,entered;
context.document={createElement(){const handlers={};return lastDialog={setAttribute(){},addEventListener(k,f){handlers[k]=f},showModal(){},close(){handlers.close?.()},remove(){}};}};
context.window.B0UI={menuContent:()=>'',header:()=>''};app.append=()=>{};
const popState=M.fresh();popState.cleared.practice=true;popState.powerOut=true;
const pop=context.window.startLabNavigation({app,portrait:()=>'',state:popState,onSave(){},onEnter:id=>entered=id,onHome(){},muted:true});
pop.act('menu');lastDialog.close(); // Native Escape emits close without the button action.
pop.click({target:{closest(){return null}},detail:1,clientX:380,clientY:400});finish();
assert.ok(pop.state().camera.z<0,'a floor click must still move after native Escape closes the dialog');
pop.walkTo('storage');finish();pop.act('enter-storage');assert.equal(entered,'storage');
pop.act('menu');pop.act('close');pop.act('turn-left');finish();pop.act('backward');finish();assert.ok(pop.state().camera.z>-320,'button close must also restore travel');
pop.dispose();
console.log('PASS: stair rejection returns safely, key unlock restores ascent, Escape/button popup close restores floor travel and room entry');
