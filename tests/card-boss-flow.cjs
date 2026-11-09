const assert=require('node:assert/strict'),M=require('../card-boss-model.js'),F=require('../chapter4-model.js');
let seed=471;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const s=M.fresh(3);
assert.equal(M.strike(s),null);assert.equal(M.takeCard(s),false);
for(let i=0;i<4;i++)M.advance(s);
assert.equal(M.readMemory(s,false),false);assert.equal(M.readMemory(s,true),true);M.deploy(s);
for(let i=0;i<32;i++)M.tick(s,100);
assert.ok(s.hp<100,'AXIOM keeps attacking without a player turn or click');
const damaged=s.hp;assert.equal(M.useBattery(s),true);assert.equal(s.hp,Math.min(100,damaged+40));assert.equal(s.batteries,2);
const checkpoint=M.restore(JSON.parse(JSON.stringify(s)),3);assert.equal(checkpoint.hp,s.hp);assert.equal(checkpoint.deployed,false);assert.equal(checkpoint.batteries,2);assert.equal(checkpoint.phase,'ready');
function aim(state){M.moveReflector(state,state.aim.x,state.aim.y);}
const battle=M.fresh(3);battle.phase='ready';M.deploy(battle,random);aim(battle);
M.strike(battle);assert.equal(battle.bossHP,150);assert.equal(M.strike(battle),null,'shot cooldown prevents double clicks');
for(let i=0;i<600&&battle.phase==='fight';i++){aim(battle);M.tick(battle,50,{firing:true,random});}
assert.equal(battle.phase,'defeated');assert.equal(battle.bossHP,0);assert.equal(battle.hits,6,'six hits win the real-time HP battle');
assert.equal(battle.hp,100,'aimed continuous reflection blocks incoming shots');
assert.ok(battle.logs.some(e=>e.action==='enemy-attack'),'enemy attacks remain active during the shorter fight');
assert.equal(M.release(battle),false);assert.equal(M.takeCard(battle),true);assert.equal(M.takeCard(battle),false);assert.equal(M.release(battle),true);
const lost=M.fresh(2);lost.phase='ready';M.deploy(lost);for(let i=0;i<400&&lost.phase==='fight';i++)M.tick(lost,100);
assert.equal(lost.phase,'lost');assert.equal(lost.hp,0);assert.deepEqual(M.tick(lost,100,{firing:true}),[]);
assert.equal(M.retry(lost),true);assert.equal(lost.hp,100);assert.equal(lost.bossHP,180);assert.equal(lost.batteries,2);
// Random shots announce a fixed ray, rather than following a moving reflector.

const moving=M.fresh();moving.phase='ready';M.deploy(moving,random);
const sources=new Set(),targets=new Set(),quadrants=new Set();
for(let i=0;i<80;i++){
 M.nextAttack(moving,random);sources.add(JSON.stringify(moving.source));targets.add(JSON.stringify(moving.aim));quadrants.add((moving.source.x<500?'L':'R')+(moving.source.y<215?'U':'D'));
 const fixed=JSON.stringify({source:moving.source,aim:moving.aim});aim(moving);
 assert.equal(M.trace(moving).caught,true);assert.equal(M.trace(moving).hit,true);
 M.moveReflector(moving,moving.aim.x<500?700:300,505);
 assert.equal(M.trace(moving).caught,false,'a reflector away from the incoming line cannot block it');
 assert.equal(JSON.stringify({source:moving.source,aim:moving.aim}),fixed,'dragging does not make a launched attack home onto the plate');
}
assert.equal(sources.size,80);assert.equal(targets.size,80);assert.equal(quadrants.size,4);
M.nextAttack(moving,()=>.5);const before={...moving.source};M.nextAttack(moving,()=>.5);assert.notDeepEqual(moving.source,before,'a constant RNG still cannot lock the game to one muzzle');
aim(moving);const restored=M.restore(JSON.parse(JSON.stringify(moving)));
assert.deepEqual(restored.mirror,moving.mirror);assert.deepEqual(restored.source,moving.source);assert.deepEqual(restored.aim,moving.aim);assert.equal(restored.version,4);
const legacy=M.restore({version:2,hp:74,bossHP:120,batteries:1,supply:2,angle:-30});assert.equal(legacy.hp,74);assert.equal(legacy.bossHP,90,'old 120/240 HP becomes 90/180 without losing progress');assert.equal(legacy.batteries,1);assert.deepEqual(legacy.mirror,{x:500,y:455});
// Optional tilt is separate from dragging and can always return to automatic aim.
const tilted=M.fresh();tilted.phase='ready';M.deploy(tilted,random);aim(tilted);const automatic=tilted.angle;
assert.equal(M.adjust(tilted,5),true);assert.equal(tilted.tilt,5);assert.equal(tilted.angle,automatic+5);
M.moveReflector(tilted,tilted.aim.x,tilted.aim.y);assert.equal(tilted.tilt,5);assert.equal(tilted.angle,automatic+5,'moving preserves the manual tilt offset');
for(let i=0;i<10;i++)M.adjust(tilted,5);assert.equal(tilted.tilt,30);assert.equal(M.adjust(tilted,5),false);
const tiltSave=M.restore(JSON.parse(JSON.stringify(tilted)));assert.equal(tiltSave.tilt,30);
M.resetTilt(tilted);assert.equal(tilted.tilt,0);assert.equal(M.trace(tilted).hit,true);
assert.equal(M.restore({version:3,hp:100,bossHP:228}).bossHP,171);assert.equal(M.restore({version:3,hp:100,bossHP:0,cardTaken:true,released:true}).released,true);
// Drag projection follows the same perspective, translation and rotation as the room camera.
for(const view of [{width:1000,height:700,x:0,z:-78,yaw:0,pitch:3,zoom:1.1},{width:700,height:750,x:40,z:100,eyeHeight:30,yaw:22,pitch:15,zoom:.9},{width:390,height:600,x:-60,z:0,yaw:-16,pitch:-8,zoom:.8}]){
 for(const p of [{x:500,y:455},{x:350,y:390},{x:650,y:500}]){const px=M.project(view,p),back=M.screenToArena(view,px.x,px.y);assert.ok(Math.hypot(p.x-back.x,p.y-back.y)<1e-6);}
}
assert.equal(M.restore({version:1,hits:2,cardTaken:true,released:true}).released,true,'existing completed card saves migrate');
assert.equal(M.restore({version:2,hp:30,bossHP:150,phase:'released',cardTaken:true,released:true}).released,false);
const final={...F.fresh(),phase:'room',met:true,boss:true,bodyChecked:true,battle,links:{robot:false}};
assert.equal(F.restore(final).opened,true,'freeing B-0 opens the exit without a manual-lock puzzle');
assert.equal(F.restore(final).upper,true);assert.equal(F.connect(F.restore(final),'robot',true),false);
const R=require('../reflection-model.js'),reflection=R.fresh();reflection.rotated=true;
const data=new Map([[R.key,JSON.stringify(reflection)],['project-b0-final-v2',JSON.stringify(final)],['project-b0-firstperson-v4',JSON.stringify({phase:'escaped'})],['project-b0-education-v1',JSON.stringify({memoryTaken:true})],['project-b0-reflection-v1',JSON.stringify({...reflection,taken:true})]]);
const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
assert.equal(M.batterySupply(storage),3);assert.equal(R.capture(storage).final.trials,battle.trials);assert.equal(R.capture(storage).final.severed,true);
console.log('PASS: real-time attacks, HP victory/defeat, fire cooldown, held reflection, randomized fixed paths, movable interception, camera projection, battery rewards/healing, retries, migration, immediate exit and survey evidence');
