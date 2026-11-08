const assert=require('node:assert/strict'),M=require('../card-boss-model.js'),F=require('../chapter4-model.js');
const s=M.fresh();
assert.equal(M.strike(s),null);assert.equal(M.takeCard(s),false);assert.equal(M.release(s),false);
for(let i=0;i<4;i++)M.advance(s);
assert.equal(s.phase,'ready');assert.equal(M.readMemory(s,false),false);assert.equal(M.readMemory(s,true),true);
assert.equal(M.deploy(s),true);
const initial=M.trace(s);assert.equal(initial.hit,false);
M.strike(s);assert.equal(s.hits,0);assert.equal(s.misses,1);
M.adjust(s,-15);M.adjust(s,-15);
assert.equal(M.trace(s).hit,true);M.strike(s);
assert.equal(s.hits,1);assert.equal(M.takeCard(s),false);
assert.equal(M.trace(s).side,'right');assert.equal(M.trace(s).hit,false,'switching hands changes the path at the old angle');
M.strike(s);assert.equal(s.hits,1,'a miss preserves the first hit');
const restored=M.restore(JSON.parse(JSON.stringify(s)));
assert.equal(restored.hits,1);assert.equal(restored.deployed,false);assert.equal(restored.memoryRead,true);
M.deploy(restored);for(let i=0;i<4;i++)M.adjust(restored,15);
assert.equal(M.trace(restored).hit,true);M.strike(restored);
assert.equal(restored.phase,'defeated');assert.equal(M.strike(restored),null);assert.equal(M.release(restored),false);
assert.equal(M.takeCard(restored),true);assert.equal(M.takeCard(restored),false);
assert.equal(M.release(restored),true);assert.equal(M.restore(restored).released,true);
for(const hits of [0,1]){
  const good=[];
  for(let angle=-60;angle<=60;angle+=15){const t=M.trace({...M.fresh(),hits,angle});if(t.hit)good.push(angle);assert.ok(Number.isFinite(t.end.x)&&Number.isFinite(t.end.y));}
  assert.deepEqual(good,hits? [30]:[-30],'each hand has a distinct solution from actual ray geometry');
}
assert.equal(M.restore({version:1,hits:0,phase:'released',cardTaken:true,released:true}).released,false);
const checkpoint={...F.fresh(),phase:'room',met:true,boss:true,bodyChecked:true,battle:s,links:{robot:false}};
assert.equal(F.restore(checkpoint).links.robot,true,'an unfinished card battle cannot bypass B-0 locking through a saved link');
checkpoint.battle=restored;assert.equal(F.restore(checkpoint).links.robot,false);
assert.equal(F.connect(F.restore(checkpoint),'robot',true),false,'disabled AXIOM cannot be reconnected');
const R=require('../reflection-model.js'),education=R.fresh();education.rotated=true;
const data=new Map([[R.key,JSON.stringify(education)],['project-b0-final-v2',JSON.stringify(checkpoint)]]);
const store={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},evidence=R.capture(store);
assert.equal(evidence.final.played,true);assert.equal(evidence.final.trials,restored.trials);assert.equal(evidence.final.severed,true,'survey evidence follows release-card use');
console.log('PASS: reflection geometry, changed hand, retry checkpoint, memory ownership, card retrieval/use, reload and final-room integration');
