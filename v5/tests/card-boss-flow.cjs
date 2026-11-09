const assert=require('node:assert/strict'),M=require('../card-boss-model.js'),F=require('../chapter4-model.js');
const ready=(n=0)=>{const s=M.fresh(n);for(let i=0;i<4;i++)M.advance(s);M.deploy(s);return s;};
const run=(s,n,options)=>{for(let i=0;i<n&&s.phase==='fight';i++)M.tick(s,100,options);};
const shot=ready();shot.enemyClock=-1e9;assert.ok(M.fire(shot));assert.equal(M.fire(shot),null);assert.equal(shot.bossHP,180,'firing is not an instant hit');run(shot,5,{firing:false});assert.equal(shot.bossHP,180);run(shot,1,{firing:false});assert.equal(shot.bossHP,150,'damage follows actual projectile arrival');
const miss=ready();miss.enemyClock=-1e9;M.movePlayer(miss,650);M.fire(miss);run(miss,7,{firing:false});assert.equal(miss.bossHP,180);assert.equal(miss.misses,1,'off-center shots pass the boss');
const dodged=ready();dodged.enemyClock=-1e9;M.volley(dodged,()=>.5);const velocity=dodged.projectiles[0].vx;M.movePlayer(dodged,650);run(dodged,20,{firing:false});assert.equal(dodged.hp,100,'moving out of the fired path avoids damage');assert.equal(velocity,0,'launched shots do not track later player movement');
const struck=ready();struck.enemyClock=-1e9;M.volley(struck,()=>.5);run(struck,8,{firing:false});assert.equal(struck.hp,100,'travel precedes shield impact');run(struck,4,{firing:false});assert.equal(struck.hp,94);
const crowded=ready();crowded.enemyClock=-1e9;crowded.projectiles=[1,2,3].map(id=>({id,kind:'enemy',x:500,y:480,vx:0,vy:0}));M.tick(crowded,50,{firing:false});assert.equal(crowded.hp,94,'a single clustered volley cannot stack simultaneous shield damage');
let seed=55;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const pattern=ready(),directions=new Set();let fan=false;
for(let i=0;i<40;i++){const e=M.volley(pattern,random);for(const p of e.shots){assert.deepEqual({x:p.x,y:p.y},M.core,'every orange shot originates in AXIOM itself');directions.add(p.vx.toFixed(4));}fan ||= e.shots.length===3;}
assert.ok(directions.size>35);assert.equal(fan,true);
const battle=ready(3);run(battle,100,{random});assert.equal(battle.phase,'defeated');assert.equal(battle.hits,6);assert.equal(battle.bossHP,0);assert.equal(battle.projectiles.length,0);assert.equal(M.release(battle),false);assert.equal(M.takeCard(battle),true);assert.equal(M.release(battle),true);
const lost=ready(2);run(lost,500,{firing:false,random:()=>.5});assert.equal(lost.phase,'lost');assert.equal(lost.hp,0);assert.deepEqual(M.tick(lost,100),[]);assert.equal(M.retry(lost),true);assert.equal(lost.hp,100);assert.equal(lost.batteries,2);
assert.equal(M.useBattery(lost),false);lost.hp=64;assert.equal(M.useBattery(lost),true);assert.equal(lost.hp,100);assert.equal(lost.batteries,1);
const save=M.restore(JSON.parse(JSON.stringify(dodged)),3);assert.equal(save.version,5);assert.equal(save.phase,'ready');assert.equal(save.player.x,650);assert.equal(save.projectiles.length,0);assert.equal(save.supply,3);
assert.equal(M.restore({version:2,hp:74,bossHP:120}).bossHP,90);assert.equal(M.restore({version:4,hp:60,bossHP:90,tilt:30}).bossHP,90);assert.equal(M.restore({version:4,hp:60,bossHP:90,tilt:30}).hp,60);assert.equal(M.restore({version:1,hits:2,cardTaken:true,released:true}).released,true);
for(const view of [{width:1000,height:700,x:0,z:78,yaw:0,pitch:0,zoom:1.05},{width:700,height:750,x:40,z:100,eyeHeight:30,yaw:22,pitch:15,zoom:.9}])for(const p of [{x:350,y:484},{x:500,y:215},{x:650,y:484}]){const px=M.project(view,p),back=M.screenToArena(view,px.x,px.y);assert.ok(Math.hypot(p.x-back.x,p.y-back.y)<1e-6);}
const final={...F.fresh(),phase:'room',met:true,boss:true,bodyChecked:true,battle,links:{robot:false}};assert.equal(F.restore(final).opened,true);assert.equal(F.restore(final).upper,true);
const R=require('../reflection-model.js'),reflection=R.fresh();reflection.rotated=true;
const data=new Map([[R.key,JSON.stringify(reflection)],['project-b0-v5-final-v2',JSON.stringify(final)],['project-b0-v5-firstperson-v4',JSON.stringify({phase:'escaped'})],['project-b0-v5-education-v1',JSON.stringify({memoryTaken:true})],['project-b0-v5-reflection-v1',JSON.stringify({...reflection,taken:true})]]),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
assert.equal(M.batterySupply(storage),3);assert.equal(R.capture(storage).final.trials,battle.trials);assert.equal(R.capture(storage).final.severed,true);
console.log('PASS: automatic projectiles, arrival damage, missed shots, genuine dodging/shield collision, one AXIOM source with varied fans, six-hit victory, loss/retry/batteries, save migration, original exit and survey');
