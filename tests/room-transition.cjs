const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let clock=0,id=0,entered=0;const frames=new Map(),nodes=[];
const stage={dataset:{}},world={parentElement:stage,append(n){nodes.push(n);}},game={classList:{add(){},remove(){}}};
const app={querySelector:s=>s==='.c2-world'?world:s==='.game'?game:null};
const ctx={window:{},WeakMap,performance:{now:()=>clock},matchMedia:()=>({matches:false}),requestAnimationFrame:f=>{frames.set(++id,f);return id;},cancelAnimationFrame:i=>frames.delete(i),document:{createElement(){return {style:{setProperty(k,v){this[k]=v;}},setAttribute(){},remove(){this.removed=true;}};},body:{append:n=>nodes.push(n)}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../room-transition.js'),'utf8'),ctx);const T=ctx.window.B0RoomTransit;
let camera={x:0,z:0,yaw:-30,pitch:-8,zoom:1,height:0},stops=0;
T.bind(world,{read:()=>({...camera}),write:v=>camera={...v},stop:()=>stops++,door:{x:0,z:578,yaw:180}});
function step(){clock+=100;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(clock));}
function finish(){let n=0;while(frames.size){assert.ok(n++<100);step();}}
T.cross(app,()=>entered++,{direction:'exit'});T.cross(app,()=>entered++,{direction:'exit'});
assert.equal(entered,0);for(let i=0;i<7;i++)step();assert.equal(stage.dataset.passage,'opening');
assert.ok(camera.z>400&&camera.z<578,'approach moves toward the physical door, not a screen zoom');
finish();assert.equal(entered,1,'one exit while input is locked');assert.equal(camera.z,575,'camera reaches the threshold before the scene switches');assert.ok(nodes.every(n=>n.removed));
camera={x:0,z:0,yaw:-30,pitch:-8,zoom:1,height:0};
T.cross(app,()=>entered++);assert.equal(entered,2);assert.equal(camera.z,552,'room arrival starts just inside the matching entrance');step();assert.ok(camera.z<552&&camera.z>0);finish();assert.equal(camera.z,0);assert.equal(((camera.yaw+180)%360+360)%360-180,-30);assert.equal(frames.size,0);
T.cross(app,()=>entered++,{direction:'exit'});T.cancel();finish();assert.equal(entered,2,'home/jump cancellation cannot trigger delayed navigation');
ctx.matchMedia=()=>({matches:true});T.cross(app,()=>entered++);assert.equal(entered,3);assert.equal(frames.size,0);
console.log('PASS: world-camera approach, visible door opening, threshold exit, interior arrival, duplicate prevention, cancellation and reduced motion');
