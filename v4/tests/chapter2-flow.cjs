const assert=require('node:assert/strict');
const M=require('../chapter2-model.js');
let s=M.fresh();
assert.equal(M.openWindow(s,null),false);
assert.equal(M.exit(s,null),false);
assert.equal(M.finish(s),false);
assert.equal(M.move(s,'small',-175,-60,'wide').ok,true);
assert.equal(M.move(s,'wide',105,-220).ok,false,'cannot move the support out from under a stack');
assert.equal(M.move(s,'small',160,125).ok,true);
assert.equal(M.move(s,'wide',160,125,'small').ok,false,'large crate cannot be supported by smaller one');
assert.equal(M.move(s,'wide',105,-220).ok,true);
assert.equal(M.reach(s,'wide'),'low');
assert.equal(M.move(s,'small',105,-220,'wide').ok,true);
assert.equal(M.reach(s,'small'),'needs-help');
assert.equal(M.openWindow(s,'small'),false,'student still needs B-0 to lift them');
assert.equal(M.boost(s,null),false);assert.equal(M.boost(s,'wide'),false);
assert.equal(M.boost(s,'small'),true);assert.equal(s.assisted,'small');
assert.equal(M.move(s,'small',-100,100).ok,false,'cannot move the platform while being lifted');
assert.equal(M.reach(s,'small'),'ready');
assert.equal(M.openWindow(s,'small'),true);
const saved=M.restore(JSON.parse(JSON.stringify(s)));
assert.equal(M.reach(saved,'small'),'needs-help','reloading puts the player safely back on the floor');
M.boost(saved,'small');
assert.equal(M.exit(saved,'small'),true);
assert.equal(saved.phase,'ledge');
assert.equal(M.finish(saved),true);assert.equal(saved.phase,'complete');
assert.equal(M.finish(saved),false);
// Exploration and the decoy are optional; no checklist or hidden inspect gate.
assert.equal(s.ventOpen,false);assert.equal(s.logs.some(x=>x.action==='inspect'),false);
s.assisted=null;s.boxes.wide={x:-120,z:100,on:null};
assert.equal(M.reach(s,'small'),'far');
assert.equal(M.exit(s,'small'),false,'opened window does not permit remote teleport out');
assert.deepEqual(M.restore({version:1,boxes:{wide:{x:NaN,z:0},small:{x:0,z:0}}}),M.fresh());
const restored=M.restore({version:1,boxes:{wide:{x:0,z:0,on:'small'},small:{x:50,z:0,on:'wide'}}});
assert.equal(restored.boxes.wide.on,null,'saved support cycles cannot hang height calculation');
const overlapping=M.fresh();overlapping.boxes.small={x:-175,z:-60,on:null};
const repaired=M.restore(overlapping);
assert.equal(M.destination(repaired,'small',repaired.boxes.small.x,repaired.boxes.small.z).ok,true);
for(const state of [M.fresh(),repaired,s])for(const preferred of [{x:-175,z:-60},{x:105,z:-220},{x:160,z:125}]){
  const spot=M.robotSpot(state,preferred);
  for(const id of ['wide','small']){const p=M.position(state,id),size=M.sizes[id];assert.ok(Math.abs(spot.x-p.x)>=size.w/2+66||Math.abs(spot.z-p.z)>=size.d/2+66,'robot cannot intersect a crate');}
}
const fake=M.fresh();fake.fakeWindowOpen=true;
assert.equal(M.exit(fake,null),false,'fake window never unlocks the exit');
assert.equal(M.restore(fake).fakeWindowOpen,true);
console.log('PASS: crate collision/stacking, robot clearance, lift student then pull B-0 out, save migration, optional decoys');
