const assert=require('node:assert/strict'),D=require('../lab-dialogue.js'),M=require('../lab-navigation-model.js');
const s=M.fresh();s.powerOut=true;s.powerTalked=false;
const at=(z,selected=null,x=0)=>D.resolve(s,{x,z},selected,M.doors);
assert.equal(at(-65).id,'power');
assert.equal(at(-320).id,'room-storage','old unread outage is local to the floor plate');
assert.equal(at(-1665).id,'stairs-locked');assert.equal(at(-950).id,'room-access');
const places=[-65,-320,-610,-950,-1160,-1320,-1460,-1665].map(z=>at(z).id);
assert.equal(new Set(places).size,places.length,'each meaningful corridor area has its own conversation');
s.stairRejected=true;assert.match(at(-1695).lines[0][1],/튕기는/);
assert.match(at(-1695).lines[1][1],/열쇠가 있어야/);
s.keyTaken=true;assert.equal(at(-1695).id,'stairs-key');assert.match(at(-1695).lines[2][1],/우리가 주운 열쇠/);
s.stairsUnlocked=true;assert.equal(at(-1695).id,'stairs-open');
s.powerTalked=true;assert.equal(at(-65).id,'plate-after');
s.powerOut=false;assert.equal(at(-65).id,'plate-before');assert.doesNotMatch(at(-65).lines[1][1],/전원/,'B-0 cannot know the plate function before it has been observed');
s.cleared.access=true;assert.match(at(-950).lines[1][1],/수정/);
s.keyTaken=false;s.keyboxOpen=false;assert.equal(at(-1640,'keybox').id,'keybox');assert.doesNotMatch(at(-1640,'keybox').lines[1][1],/열쇠/,'closed cabinet contents remain unknown');
assert.notEqual(at(-65,'keybox').id,'keybox','a stale remote object selection cannot override location');
s.floor=2;assert.equal(at(-2170).id,'upper-hall');assert.equal(at(-2400).id,'room-central');
assert.deepEqual(at(-2400).lines.at(-1),['student','응. 우리가 함께 공부하던 기억 그대로 데려갈게.'],'the student answers B-0 before they enter together');
assert.equal(M.restore({...s,stairRejected:true}).stairRejected,true);assert.equal(M.restore({version:1}).stairRejected,false);
console.log('PASS: local outage dialogue, distinct corridor places, observed knowledge, stair rejection/key/unlock states and old-save compatibility');

s.floor=1;s.powerOut=true;s.emergencyOn=true;assert.equal(at(-65).id,'plate-emergency');assert.match(D.observe(s,{x:0,z:-65},M.doors),/천장/);assert.doesNotMatch(D.observe(s,{x:0,z:-320},M.doors),/상자|쌓|쪽지|비밀번호/);
const fs=require('node:fs');
for(const page of ['index.html']){
 const html=fs.readFileSync(require.resolve('../'+page),'utf8');
 assert.ok(html.indexOf('lab-dialogue.js?')>0&&html.indexOf('lab-dialogue.js?')<html.indexOf('lab-navigation.js?'),page+': dialogue data loads before its controller');
}

// Cabinet dialogue remains local, respects closed contents, and follows its state.
s.floor=1;s.cleared.mirror=true;s.keyboxOpen=false;s.keyTaken=false;
const cabinetCamera={x:0,z:-1640,yaw:-90};
assert.equal(D.resolve(s,cabinetCamera,null,M.doors).id,'keybox');
assert.doesNotMatch(D.resolve(s,cabinetCamera,null,M.doors).lines.map(x=>x[1]).join(' '),/금속|고리|계단실|열쇠/);
s.keyboxOpen=true;assert.equal(D.resolve(s,cabinetCamera,null,M.doors).id,'keybox-open');
assert.match(D.observe(s,cabinetCamera,M.doors),/계단실/);
s.keyTaken=true;assert.equal(D.resolve(s,cabinetCamera,null,M.doors).id,'keybox-empty');
assert.match(D.resolve(s,cabinetCamera,null,M.doors).lines[1][1],/소지품/);
assert.equal(D.resolve(s,{...cabinetCamera,yaw:0},null,M.doors).id,'stairs-open');
assert.notEqual(D.resolve(s,{...cabinetCamera,z:-950},'keybox',M.doors).id,'keybox-empty');
s.floor=2;assert.notEqual(D.resolve(s,cabinetCamera,'keybox',M.doors).id,'keybox-empty');
console.log('PASS: cabinet dialogue persists while facing it, without unseen contents or distant spoilers');
