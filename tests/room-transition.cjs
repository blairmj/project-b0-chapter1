const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');let now=0,id=0,entered=0;const timers=new Map(),frames=[],nodes=[];
const app={querySelector:()=>({getBoundingClientRect:()=>({left:0,top:100,width:676,height:830}),classList:{add(){}}})};
const ctx={window:{},matchMedia:()=>({matches:false}),requestAnimationFrame:f=>frames.push(f),setTimeout:(f,ms)=>{timers.set(++id,{f,at:now+ms});return id;},clearTimeout:i=>timers.delete(i),document:{querySelector:()=>nodes.find(n=>!n.removed),createElement(){return {style:{},classList:{add(){},remove(){}},setAttribute(){},remove(){this.removed=true;}};},body:{append:n=>nodes.push(n)}}};
vm.runInNewContext(fs.readFileSync(require.resolve('../room-transition.js'),'utf8'),ctx);const T=ctx.window.B0RoomTransit;
function advance(ms){now+=ms;for(const [i,t]of [...timers])if(t.at<=now){timers.delete(i);t.f();}}
T.cross(app,()=>entered++);T.cross(app,()=>entered++);frames.splice(0).forEach(f=>f());assert.equal(entered,0);advance(300);assert.equal(entered,1,'double entry cannot create two rooms');advance(120);advance(320);assert.ok(nodes[0].removed);
T.cross(app,()=>entered++);T.cancel();advance(1000);assert.equal(entered,1,'menu/home/temporary lesson jumps cancel a pending entrance');assert.equal(timers.size,0);
ctx.matchMedia=()=>({matches:true});T.cross(app,()=>entered++);assert.equal(entered,2,'reduced motion preserves immediate progression');
console.log('PASS: single entrance, fade lifecycle, navigation interruption and reduced-motion progression');
