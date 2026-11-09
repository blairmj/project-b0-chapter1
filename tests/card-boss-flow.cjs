const assert=require('node:assert/strict'),M=require('../card-boss-model.js'),F=require('../chapter4-model.js');
const s=M.fresh(3);
assert.equal(M.strike(s),null);assert.equal(M.takeCard(s),false);
for(let i=0;i<4;i++)M.advance(s);
assert.equal(M.readMemory(s,false),false);assert.equal(M.readMemory(s,true),true);M.deploy(s);
for(let i=0;i<32;i++)M.tick(s,100);
assert.ok(s.hp<100,'AXIOM keeps attacking without a player turn or click');
const damaged=s.hp;assert.equal(M.useBattery(s),true);assert.equal(s.hp,Math.min(100,damaged+40));assert.equal(s.batteries,2);
const checkpoint=M.restore(JSON.parse(JSON.stringify(s)),3);assert.equal(checkpoint.hp,s.hp);assert.equal(checkpoint.deployed,false);assert.equal(checkpoint.batteries,2);assert.equal(checkpoint.phase,'ready');
function aim(state){const wanted=state.side==='left'?-30:30;while(state.angle!==wanted)M.adjust(state,state.angle<wanted?15:-15);}
const battle=M.fresh(3);battle.phase='ready';M.deploy(battle);aim(battle);
M.strike(battle);assert.equal(battle.bossHP,228);assert.equal(M.strike(battle),null,'shot cooldown prevents double clicks');
for(let i=0;i<600&&battle.phase==='fight';i++){aim(battle);M.tick(battle,50,{firing:true});}
assert.equal(battle.phase,'defeated');assert.equal(battle.bossHP,0);assert.equal(battle.hits,20,'victory depends on HP, not two hits');
assert.equal(battle.hp,100,'aimed continuous reflection blocks incoming shots');
assert.ok(battle.logs.some(e=>e.action==='enemy-attack'&&e.value.side==='right'),'both emitters fire during combat');
assert.equal(M.release(battle),false);assert.equal(M.takeCard(battle),true);assert.equal(M.takeCard(battle),false);assert.equal(M.release(battle),true);
const lost=M.fresh(2);lost.phase='ready';M.deploy(lost);for(let i=0;i<400&&lost.phase==='fight';i++)M.tick(lost,100);
assert.equal(lost.phase,'lost');assert.equal(lost.hp,0);assert.deepEqual(M.tick(lost,100,{firing:true}),[]);
assert.equal(M.retry(lost),true);assert.equal(lost.hp,100);assert.equal(lost.bossHP,240);assert.equal(lost.batteries,2);
for(const side of ['left','right']){const good=[];for(let angle=-60;angle<=60;angle+=15)if(M.trace({...M.fresh(),side,angle}).hit)good.push(angle);assert.deepEqual(good,side==='left'?[-30]:[30]);}
assert.equal(M.restore({version:1,hits:2,cardTaken:true,released:true}).released,true,'existing completed card saves migrate');
assert.equal(M.restore({version:2,hp:30,bossHP:150,phase:'released',cardTaken:true,released:true}).released,false);
const final={...F.fresh(),phase:'room',met:true,boss:true,bodyChecked:true,battle,links:{robot:false}};
assert.equal(F.restore(final).opened,true,'freeing B-0 opens the exit without a manual-lock puzzle');
assert.equal(F.restore(final).upper,true);assert.equal(F.connect(F.restore(final),'robot',true),false);
const R=require('../reflection-model.js'),reflection=R.fresh();reflection.rotated=true;
const data=new Map([[R.key,JSON.stringify(reflection)],['project-b0-final-v2',JSON.stringify(final)],['project-b0-firstperson-v4',JSON.stringify({phase:'escaped'})],['project-b0-education-v1',JSON.stringify({memoryTaken:true})],['project-b0-reflection-v1',JSON.stringify({...reflection,taken:true})]]);
const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
assert.equal(M.batterySupply(storage),3);assert.equal(R.capture(storage).final.trials,battle.trials);assert.equal(R.capture(storage).final.severed,true);
console.log('PASS: real-time attacks, HP victory/defeat, fire cooldown, held reflection, side changes, battery rewards/healing, retries, migration, immediate exit and survey evidence');
