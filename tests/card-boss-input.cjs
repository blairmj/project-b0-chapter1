const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../card-boss-model.js');
const events=new Map(),timers=new Map();let nextId=0,saves=0,released=0;
const app={innerHTML:'',addEventListener(k,f){events.set(k,f);},removeEventListener(k,f){if(events.get(k)===f)events.delete(k);},querySelector(){return {focus(){}};}};
const ctx={window:{B0CardBoss:M},matchMedia:()=>({matches:true}),setTimeout(f){timers.set(++nextId,f);return nextId;},clearTimeout(id){timers.delete(id);}};
vm.runInNewContext(fs.readFileSync(require.resolve('../card-boss.js'),'utf8'),ctx);
const s=M.fresh(),g=ctx.window.startB0CardBattle({app,state:s,memory:true,save(){saves++;},onReleased(){released++;}});
function act(action){events.get('click')({target:{closest:()=>({dataset:{bb:action}})},preventDefault(){}});}
function finish(){const pending=[...timers];timers.clear();pending.forEach(([,f])=>f());}
act('menu');assert.match(app.innerHTML,/현재 공간 다시 시작/);act('close-panel');
for(let i=0;i<4;i++)act('next');
act('terminal');act('memory');assert.equal(s.memoryRead,true);assert.match(app.innerHTML,/공격 장치 전원/);act('close-panel');
act('deploy');const before=app.innerHTML;act('left');assert.notEqual(app.innerHTML,before,'aiming immediately changes the rendered ray');
act('left');act('strike');assert.equal(s.hits,1);
act('take');act('strike');assert.equal(s.hits,1,'attack animation blocks duplicate hits and premature retrieval');finish();
assert.match(app.innerHTML,/오른손 충전/);
act('case');assert.doesNotMatch(app.innerHTML,/data-bb="take"/);act('close-panel');
for(let i=0;i<4;i++)act('right');act('strike');finish();
act('case');assert.match(app.innerHTML,/카드 꺼내기/);
act('take');assert.equal(s.cardTaken,true);assert.match(app.innerHTML,/획득한 해제 카드/);
act('robot');act('release');assert.equal(released,1);assert.equal(s.released,true);assert.ok(saves>10);
g.dispose();g.dispose();assert.equal(events.size,0);assert.equal(timers.size,0);
console.log('PASS: actual combat buttons, menu, memory, live aim, animation input guard, manual card pickup, card slot and cleanup');
