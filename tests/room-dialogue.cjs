const assert=require('node:assert/strict'),fs=require('node:fs'),K=require('../room-dialogue.js');
const models={storage:require('../chapter2-model.js'),access:require('../chapter3-model.js'),mirror:require('../mirror-model.js'),central:require('../chapter4-model.js')};
for(const [room,M] of Object.entries(models)){
 const s=M.fresh();assert.deepEqual(s.observations,{seen:{},last:''});
 const before=JSON.stringify(s);K.reply(room,s);assert.equal(JSON.stringify(s),before,'conversation does not manufacture observations');
 for(const id of ['window','record','door','console'])assert.match(K.about(room,s,id),/아직 함께 확인하지/,'unseen objects have no facts to disclose');
 K.remember(s,'door',1);K.remember(s,'console',2);const restored=M.restore(JSON.parse(JSON.stringify(s)));
 assert.equal(K.level(room,restored,'console'),2);assert.equal(K.restore(restored.observations).last,'console');
}
const cargo=models.storage.fresh();K.remember(cargo,'cabinet');assert.doesNotMatch(K.reply('storage',cargo),/비어/);
K.remember(cargo,'cabinet',3);assert.match(K.reply('storage',cargo),/비어/);cargo.cabinetOpen=false;assert.match(K.reply('storage',cargo),/직접 열어 본/,'closed again still retains learned contents');
const freshVent=models.storage.fresh();K.remember(freshVent,'vent',2);assert.doesNotMatch(K.reply('storage',freshVent),/금속판으로 막혀/);K.remember(freshVent,'vent',3);assert.match(K.reply('storage',freshVent),/금속판/);
const archive=models.access.fresh();assert.doesNotMatch(models.access.reply(archive,'route'),/앞쪽 문/);
K.remember(archive,'desk');assert.doesNotMatch(K.reply('access',archive),/개조 기록|보관장 뒤.*문/);
K.remember(archive,'floor',2);assert.match(K.reply('access',archive),/자국/);assert.doesNotMatch(K.reply('access',archive),/밀어|출구.*뒤/);
const mirror=models.mirror.fresh();mirror.phase='split';K.remember(mirror,'door');assert.doesNotMatch(K.reply('mirror',mirror),/삼각형/);
K.remember(mirror,'door',2);assert.match(K.reply('mirror',mirror),/삼각형/);assert.doesNotMatch(K.reply('mirror',mirror),/동시에|잡고 있어/);
K.remember(mirror,'circle');mirror.holding='circle';assert.match(K.reply('mirror',mirror),/원 표시.*잡고/);assert.doesNotMatch(K.reply('mirror',mirror),/삼각형/,'an incorrect experiment is reported without naming the correct lever');
K.remember(mirror,'door',2);assert.match(K.reply('mirror',mirror),/직접 살펴본 문/,'newly inspected objects remain discussable while B-0 holds a lever');
Object.assign(mirror,models.mirror.fresh());assert.deepEqual(mirror.observations,{seen:{},last:''},'reset removes the learned clue history');
const central=models.central.fresh();K.remember(central,'records');assert.doesNotMatch(K.reply('central',central),/회수|초기화/);
K.remember(central,'console',2);assert.doesNotMatch(K.reply('central',central),/직접 연|B-0 원격/);
K.remember(central,'console',3);assert.match(K.reply('central',central),/B-0 원격/);
central.met=central.boss=true;central.bodyChecked=false;assert.match(K.reply('central',central),/손과 발/);assert.doesNotMatch(K.reply('central',central),/분리|잠금쇠/);
central.bodyChecked=true;central.links.robot=false;K.remember(central,'door');assert.doesNotMatch(K.reply('central',central,{latch:.5}),/아직 문에 걸려/);
K.remember(central,'door',2);assert.match(K.reply('central',central,{latch:.5}),/아직 문에 걸려/);
central.holding=true;assert.match(K.reply('central',central),/계속 잡고/);
for(const page of ['index.html','preview-v2.html']){const html=fs.readFileSync(require.resolve('../'+page),'utf8');assert.ok(html.indexOf('room-dialogue.js?')>0&&html.indexOf('room-dialogue.js?')<html.indexOf('chapter2.js?'));}
console.log('PASS: look/read/open knowledge boundaries, no unobserved clue/answer disclosure, action-state replies, persistence, reset and page integration');
