const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../card-boss-model.js');
const events=new Map(),winEvents=new Map(),frames=new Map(),nodes=new Map();let id=0,now=0,saves=0,released=0;
function node(key){if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',style:{setProperty(k,v){this[k]=v;}},dataset:{},hidden:false,classList:{toggle(){},add(){},remove(){}},querySelector:s=>node(key+s),insertAdjacentHTML(where,html){this.innerHTML+=html;},focus(){},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){},removeEventListener(){},setPointerCapture(n){this.capture=n;},releasePointerCapture(n){if(this.capture===n)this.capture=null;},getBoundingClientRect(){return {left:0,top:0,width:1000,height:700};},remove(){this.removed=true;}});return nodes.get(key);}
const original='<main><section class="c4-stage"><div class="c4-world">original textured room</div></section></main>';
const app={innerHTML:original,querySelector:s=>s==='dialog[open]'?null:node(s),addEventListener:(k,f)=>events.set(k,f),removeEventListener:(k,f)=>{if(events.get(k)===f)events.delete(k);}};
const ctx={window:{B0CardBoss:M,addEventListener:(k,f)=>winEvents.set(k,f),removeEventListener:(k,f)=>{if(winEvents.get(k)===f)winEvents.delete(k);}},document:{hidden:false},performance:{now:()=>now},requestAnimationFrame(f){frames.set(++id,f);return id;},cancelAnimationFrame(n){frames.delete(n);}};
vm.runInNewContext(fs.readFileSync(require.resolve('../card-boss.js'),'utf8'),ctx);
const view={width:1000,height:700,x:0,z:-78,yaw:0,pitch:3,zoom:1.1};let focusCalls=0;
const s=M.fresh(3),g=ctx.window.startB0CardBattle({app,stage:node('stage'),world:node('world'),bar:node('bar'),speech:node('speech'),state:s,memory:true,readView:()=>view,onFocus(){focusCalls++;},save(){saves++;},onReleased(){released++;}});
function event(a){return {pointerId:1,key:'',preventDefault(){},target:{closest:sel=>sel==='[data-bb]'?{dataset:{bb:a}}:null}};}
const act=a=>events.get('click')(event(a));
function step(){now+=50;const pending=[...frames];frames.clear();pending.forEach(([,f])=>f(now));}
for(let i=0;i<4;i++)act('next');act('terminal');act('memory');assert.equal(s.memoryRead,true);act('close-panel');act('deploy');
assert.equal(s.phase,'ready','starting first opens the rules without beginning enemy attacks');assert.equal(node('.c4-battle-rules').open,true);
for(let i=0;i<50;i++)step();assert.equal(s.hp,100);assert.equal(s.bossHP,180);
act('begin');assert.equal(node('.c4-battle-rules').open,false);assert.equal(s.phase,'fight');
const angle=s.angle;act('left');assert.equal(s.angle,angle-5);
events.get('pointerdown')(event('left'));winEvents.get('pointerup')(event('left'));act('left');assert.equal(s.angle,angle-10,'one physical click turns the reflector once');
act('auto');assert.equal(s.tilt,0);assert.equal(node('[data-tilt-label]').textContent,'자동 조준');
M.moveReflector(s,s.aim.x,s.aim.y);events.get('pointerdown')(event('strike'));for(let i=0;i<45;i++){M.moveReflector(s,s.aim.x,s.aim.y);step();}
assert.ok(s.bossHP<150,'holding the button repeats reflected attacks');assert.equal(s.hp,100);
winEvents.get('pointerup')(event('strike'));act('strike');
for(let i=0;i<600&&s.phase==='fight';i++){
 M.moveReflector(s,s.aim.x,s.aim.y);
 if(i===0)events.get('pointerdown')(event('strike'));
 step();
}
winEvents.get('pointerup')(event('strike'));assert.equal(s.phase,'defeated');act('case');assert.match(node('bar').innerHTML,/카드 꺼내기/);
act('take');assert.equal(s.cardTaken,true);act('robot');act('release');assert.equal(released,1);assert.equal(s.released,true);assert.ok(saves>15);
assert.equal(app.innerHTML,original,'combat never replaces the existing 3D room, textures or B-0');
g.dispose();g.dispose();assert.equal(events.size,0);assert.equal(winEvents.size,0);assert.equal(frames.size,0);
console.log('PASS: existing 3D room preserved, actual held-fire/aim inputs, no double turn, health HUD, memory/card/release controls and RAF/input cleanup');

// A native pointer drag changes plate position, auto-aims and fires without moving the room camera.
nodes.clear();now=0;const dragged=M.fresh();dragged.phase='ready';
const dragGame=ctx.window.startB0CardBattle({app,stage:node('stage'),world:node('world'),bar:node('bar'),speech:node('speech'),state:dragged,readView:()=>view,onFocus(){focusCalls++;}});
act('deploy');act('begin');const initialPlate={...dragged.mirror},start=M.project(view,initialPlate),end=M.project(view,dragged.aim),focusBefore=focusCalls;
const dragEvent=(a,p)=>({...event(a),clientX:p.x,clientY:p.y,button:0});
events.get('pointerdown')(dragEvent('aim',start));winEvents.get('pointermove')(dragEvent('aim',end));
assert.ok(Math.hypot(dragged.mirror.x-initialPlate.x,dragged.mirror.y-initialPlate.y)>10,'drag changes the center, not just its angle');
assert.equal(M.trace(dragged).hit,true);for(let i=0;i<15;i++)step();
assert.ok(dragged.bossHP<180,'holding the reflector itself fires');assert.equal(focusCalls,focusBefore,'drag never changes the camera focus');
winEvents.get('pointerup')(event('aim'));act('aim');assert.equal(focusCalls,focusBefore,'drag release click cannot trigger camera focus');
const shots=dragged.trials;for(let i=0;i<12;i++)step();assert.equal(dragged.trials,shots,'pointer release stops drag firing');
events.get('pointerdown')(dragEvent('aim',M.project(view,dragged.mirror)));winEvents.get('pointercancel')(event('aim'));
const afterCancel=dragged.trials;for(let i=0;i<12;i++)step();assert.equal(dragged.trials,afterCancel);
// Space can remain held while a pointer is released.
events.get('keydown')({...event(''),key:' ',code:'Space',repeat:false});
events.get('pointerdown')(event('strike'));winEvents.get('pointerup')(event('strike'));const heldShots=dragged.trials;for(let i=0;i<12;i++)step();assert.ok(dragged.trials>heldShots);
winEvents.get('blur')();const blurredShots=dragged.trials;for(let i=0;i<12;i++)step();assert.equal(dragged.trials,blurredShots);
M.moveReflector(dragged,500,455);const keyboardStart={...dragged.mirror};
events.get('keydown')({...event(''),key:'ArrowLeft',target:{closest:sel=>sel==='[data-bb="aim"]'?{}:null}});
assert.equal(dragged.mirror.x,keyboardStart.x-12,'keyboard position changes must not be snapped back onto the ray');

dragGame.dispose();assert.equal(frames.size,0);assert.equal(winEvents.size,0);
console.log('PASS: native drag position and automatic reflection, fixed camera, release/cancel/blur, concurrent Space input and cleanup');

// Incoming energy is visible before HP changes; impact feedback follows the actual damage event.
nodes.clear();now=0;
const visualState=M.fresh();visualState.phase='ready';
const visual=ctx.window.startB0CardBattle({app,stage:node('stage'),world:node('world'),bar:node('bar'),speech:node('speech'),state:visualState});
act('deploy');act('begin');for(let i=0;i<32;i++)step();
assert.equal(visualState.hp,100);
assert.match(node('world.c4-battle-space.c4-battle-effects').innerHTML,/c4-fx-enemy/,'incoming projectile starts before the damage tick');
act('terminal');const pausedHP=visualState.hp;for(let i=0;i<15;i++)step();assert.equal(visualState.hp,pausedHP,'inspection pauses the projectile clock and damage');
act('close-panel');for(let i=0;i<10;i++)step();
assert.equal(visualState.hp,100-M.ENEMY_DAMAGE);assert.match(node('.c4-combat-feedback').textContent,/보호막/);
act('rules');assert.equal(node('.c4-battle-rules').open,true);const rulesHP=visualState.hp,rulesClock=visualState.enemyClock;
for(let i=0;i<30;i++)step();assert.equal(visualState.hp,rulesHP);assert.equal(visualState.enemyClock,rulesClock,'reading rules pauses the combat clock');
act('rules-close');assert.equal(node('.c4-battle-rules').open,false);for(let i=0;i<24;i++)step();assert.ok(visualState.hp<rulesHP,'closing rules resumes the same battle');

assert.match(node('world.c4-battle-space.c4-battle-effects').innerHTML,/c4-fx-shield/);
visual.dispose();assert.equal(frames.size,0);
console.log('PASS: incoming projectile precedes damage, hit creates shield/number feedback, pause synchronizes effects and damage, cleanup');
