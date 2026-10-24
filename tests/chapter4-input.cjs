const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../chapter4-model.js');
const nodes=new Map();function node(k){if(!nodes.has(k))nodes.set(k,{style:{},dataset:{},isConnected:true,clientWidth:616,clientHeight:460,innerHTML:'',textContent:'',classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},removeEventListener(){},setPointerCapture(){},releasePointerCapture(){}});return nodes.get(k);}
const initial=M.fresh();Object.assign(initial,{phase:'room',met:true,boss:true,evidence:true,cover:true});initial.links.exit=initial.links.robot=false;
let saved,backs=0,id=0;const frames=new Map(),timers=new Map();const app={innerHTML:'',querySelector:s=>node(s),addEventListener(){},removeEventListener(){}};
const storage={getItem:k=>k==='project-b0-final-v1'?JSON.stringify(initial):null,setItem(k,v){if(k==='project-b0-final-v1')saved=JSON.parse(v);}};
const context={window:{B0Final:M,addEventListener(){},removeEventListener(){}},localStorage:storage,sessionStorage:storage,matchMedia:()=>({matches:true}),performance:{now:()=>0},setTimeout(f){timers.set(++id,f);return id;},clearTimeout(n){timers.delete(n);},requestAnimationFrame(f){frames.set(++id,f);return id;},cancelAnimationFrame(n){frames.delete(n);}};
vm.runInNewContext(fs.readFileSync(require.resolve('../chapter4.js'),'utf8').replace('render();return {dispose};','render();return {dispose,act,down,move,up,cancel,state:()=>({s,r,camera})};'),context);
const g=context.window.startChapterFour({app,portrait:()=>'',onBack(){backs++;}});
function event(x,y,drag){return {button:0,pointerId:1,clientX:x,clientY:y,preventDefault(){},target:{closest:sel=>sel==='[data-c4-drag]'&&drag?Object.assign(node('handle'),{dataset:{c4Drag:drag}}):null}};}
const yaw=g.state().camera.yaw;g.down(event(200,200));g.move(event(300,210));g.up(event(300,210));assert.notEqual(g.state().camera.yaw,yaw);
const yaw2=g.state().camera.yaw;g.down(event(300,200,'handle'));g.move(event(300,292,'handle'));g.up(event(300,292,'handle'));assert.equal(g.state().r.handle,1);assert.equal(g.state().camera.yaw,yaw2,'direct handle drag does not orbit');
g.act('home');assert.equal(g.state().camera.zoom,1);assert.equal(g.state().r.handle,1,'home keeps a maintained handle');assert.equal(g.state().s.links.robot,false);
function step(t){const pending=[...frames];frames.clear();pending.forEach(([,f])=>f(t));}
step(100);step(200);step(300);assert.ok(g.state().r.latch>0);g.act('release');assert.equal(g.state().r.latch,0);assert.equal(g.state().s.evidence,true);
g.act('pull');for(let t=400;t<=6000;t+=100)step(t);assert.equal(g.state().s.opened,true);assert.equal(saved.opened,true);
g.act('leave');assert.equal(g.state().s.phase,'farewell');for(let i=0;i<8;i++)g.act('story-next');assert.equal(g.state().s.phase,'ending');for(let i=0;i<6;i++)g.act('story-next');assert.equal(g.state().s.phase,'complete');
g.dispose();assert.equal(frames.size,0);assert.equal(timers.size,0);
console.log('PASS: direct handle drag vs orbit, view reset preserves state, recoverable release, real door opening, ending and complete cleanup');
