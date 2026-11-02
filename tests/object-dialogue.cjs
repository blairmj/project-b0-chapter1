const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const D=require('../object-dialogue.js'),K=require('../room-dialogue.js');
const models={storage:require('../chapter2-model.js'),access:require('../chapter3-model.js'),mirror:require('../mirror-model.js'),central:require('../chapter4-model.js'),education:require('../education-model.js')};
const ids={practice:['door','lock','map','terminal','cabinet','bench','window','filebox','envelope','storage','note'],education:['screen','desk','terminal','memory','exit'],storage:['entry','window','fake-window','vent','cabinet','wide','small','survey'],access:['server','computer','oldDoor','map','desk','record','shelf','floor','gap','exit'],mirror:['glass','entry','door','own','panel','circle','triangle','square','vent'],central:['screen','console','records','door','high','handle']};
const fresh=room=>models[room]?.fresh()||{observations:{seen:{},last:''},attempts:0};
let count=0;
for(const [room,objects]of Object.entries(ids))for(const id of objects){
 const s=fresh(room);K.remember(s,id,1);const before=JSON.stringify(s),lines=D.resolve(room,s,{target:id});
 assert.ok(lines.length>=2,`${room}/${id}`);assert.ok(lines.some(([who])=>who==='robot'));
 assert.doesNotMatch(lines.map(x=>x[1]).join(' '),/저도 모르겠습니다|기본 호칭|당신/);
 assert.equal(JSON.stringify(s),before,'talking cannot grant an item, inspect a hidden clue or operate a device');count++;
}
function text(room,s,id,e={}){return D.resolve(room,s,{target:id,...e}).map(x=>x[1]).join(' ');}
const cargo=fresh('storage');K.remember(cargo,'vent');assert.doesNotMatch(text('storage',cargo,'vent'),/막혀/);K.remember(cargo,'vent',3);assert.match(text('storage',cargo,'vent'),/막혀/);
K.remember(cargo,'fake-window');assert.doesNotMatch(text('storage',cargo,'fake-window'),/창문 뒤에 왜 벽/);cargo.fakeWindowOpen=true;assert.match(text('storage',cargo,'fake-window'),/벽/);
const office=fresh('access');K.remember(office,'computer');assert.doesNotMatch(text('access',office,'computer'),/실수를 없애|방송/);office.computerOn=true;office.memoryConnected=true;assert.match(text('access',office,'computer'),/메모리|연결/);office.diaryRead=true;assert.match(text('access',office,'computer'),/실수/);office.axiomHeard=true;assert.match(text('access',office,'computer'),/방송/);
const racks=[0,1,2].map(variant=>{K.remember(office,'server');return text('access',office,'server',{variant});});assert.equal(new Set(racks).size,3);
const lesson=fresh('education');K.remember(lesson,'desk');const desks=[0,1,2].map(variant=>text('education',lesson,'desk',{variant}));assert.equal(new Set(desks).size,3);assert.doesNotMatch(desks.join(' '),/영상 속 아이는/,'unplayed video contents stay unknown');lesson.watched=true;assert.match(text('education',lesson,'screen'),/쟤도 나랑/);lesson.workingSeen=true;assert.match(text('education',lesson,'terminal'),/한 줄씩/);lesson.verified=true;assert.match(text('education',lesson,'terminal'),/설명/);lesson.memoryTaken=true;assert.match(text('education',lesson,'memory'),/수정한 풀이/);const copy=models.education.restore(lesson);assert.equal(copy.observations.last,'desk');
const final=fresh('central');K.remember(final,'console');assert.doesNotMatch(text('central',final,'console'),/멀리서 제 몸/);K.remember(final,'console',3);assert.match(text('central',final,'console'),/멀리서 제 몸/);K.remember(final,'door',2);assert.doesNotMatch(text('central',final,'door'),/끝부분/);assert.match(text('central',final,'door',{latch:.5}),/끝부분/);
const intro=fs.readFileSync(require.resolve('../firstperson.js'),'utf8');assert.match(intro,/내가 왜 네 주인이야/);assert.match(intro,/\["robot", "기본값입니다\."\]/);assert.doesNotMatch(intro,/기본 호칭/);
// The real popup can advance, close, reopen, and hand off to existing requests.
let dialog,focuses=0,requests=0;const actor={classList:{toggle(){},remove(){}}};
const app={querySelectorAll:()=>[],querySelector:sel=>sel==='.robot-sprite'?actor:{focus(){focuses++;}},append(){}};
const document={querySelector:()=>app,createElement(){const handlers={};return dialog={innerHTML:'',setAttribute(){},querySelector(){return {focus(){}};},addEventListener(k,f){handlers[k]=f;},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();},remove(){this.removed=true;},click(a){handlers.click({target:{closest:()=>({dataset:{objectTalk:a}})}});}};}};
const ctx={window:{document,B0RoomDialogue:K}};vm.runInNewContext(fs.readFileSync(require.resolve('../object-dialogue.js'),'utf8'),ctx);
const sourceState=JSON.stringify(cargo);ctx.window.B0ObjectDialogue.open('storage',cargo,{target:'vent'},()=>requests++);assert.match(dialog.innerHTML,/영화에서는/);dialog.click('next');assert.match(dialog.innerHTML,/이곳은 뒤가 막혀/);dialog.click('close');assert.equal(dialog.removed,true);assert.ok(focuses);assert.equal(JSON.stringify(cargo),sourceState);
ctx.window.B0ObjectDialogue.open('storage',cargo,{target:'wide'},()=>requests++);dialog.click('next');dialog.click('requests');assert.equal(requests,1);assert.equal(dialog.open,false);
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.ok(html.includes('object-dialogue.js?'));for(const file of ['firstperson.js','chapter2.js','chapter3.js','mirror-room.js','chapter4.js','education-room.js'])assert.match(fs.readFileSync(require.resolve('../'+file),'utf8'),/B0ObjectDialogue\?\.open/);
console.log(`PASS: ${count} object contexts, unseen facts, state changes, desk/rack variants, memory persistence, primary-school address, popup close and request handoff`);
