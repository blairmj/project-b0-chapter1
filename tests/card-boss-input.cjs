const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../card-boss-model.js');
const events=new Map(),winEvents=new Map(),frames=new Map(),nodes=new Map();let id=0,now=0,saves=0,released=0;
function node(key){if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',style:{},dataset:{},hidden:false,classList:{toggle(){}},querySelector:s=>node(key+s),insertAdjacentHTML(where,html){this.innerHTML+=html;},focus(){},remove(){this.removed=true;}});return nodes.get(key);}
const original='<main><section class="c4-stage"><div class="c4-world">original textured room</div></section></main>';
const app={innerHTML:original,querySelector:s=>s==='dialog[open]'?null:node(s),addEventListener:(k,f)=>events.set(k,f),removeEventListener:(k,f)=>{if(events.get(k)===f)events.delete(k);}};
const ctx={window:{B0CardBoss:M,addEventListener:(k,f)=>winEvents.set(k,f),removeEventListener:(k,f)=>{if(winEvents.get(k)===f)winEvents.delete(k);}},document:{hidden:false},performance:{now:()=>now},requestAnimationFrame(f){frames.set(++id,f);return id;},cancelAnimationFrame(n){frames.delete(n);}};
vm.runInNewContext(fs.readFileSync(require.resolve('../card-boss.js'),'utf8'),ctx);
const s=M.fresh(3),g=ctx.window.startB0CardBattle({app,stage:node('stage'),world:node('world'),bar:node('bar'),speech:node('speech'),state:s,memory:true,save(){saves++;},onReleased(){released++;}});
function event(a){return {pointerId:1,key:'',preventDefault(){},target:{closest:sel=>sel==='[data-bb]'?{dataset:{bb:a}}:null}};}
const act=a=>events.get('click')(event(a));
function step(){now+=50;const pending=[...frames];frames.clear();pending.forEach(([,f])=>f(now));}
for(let i=0;i<4;i++)act('next');act('terminal');act('memory');assert.equal(s.memoryRead,true);act('close-panel');act('deploy');
act('left');assert.equal(s.angle,-15);
events.get('pointerdown')(event('left'));winEvents.get('pointerup')(event('left'));act('left');assert.equal(s.angle,-30,'one physical click turns the reflector once');
events.get('pointerdown')(event('strike'));for(let i=0;i<45;i++)step();
assert.ok(s.bossHP<220,'holding the button repeats reflected attacks');assert.equal(s.hp,100);
winEvents.get('pointerup')(event('strike'));act('strike');
for(let i=0;i<600&&s.phase==='fight';i++){
 const wanted=s.side==='left'?-30:30;while(s.angle!==wanted)act(s.angle<wanted?'right':'left');
 if(i===0)events.get('pointerdown')(event('strike'));
 step();
}
winEvents.get('pointerup')(event('strike'));assert.equal(s.phase,'defeated');act('case');assert.match(node('bar').innerHTML,/카드 꺼내기/);
act('take');assert.equal(s.cardTaken,true);act('robot');act('release');assert.equal(released,1);assert.equal(s.released,true);assert.ok(saves>15);
assert.equal(app.innerHTML,original,'combat never replaces the existing 3D room, textures or B-0');
g.dispose();g.dispose();assert.equal(events.size,0);assert.equal(winEvents.size,0);assert.equal(frames.size,0);
console.log('PASS: existing 3D room preserved, actual held-fire/aim inputs, no double turn, health HUD, memory/card/release controls and RAF/input cleanup');
