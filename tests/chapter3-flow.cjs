const assert=require('node:assert/strict');
const M=require('../chapter3-model.js');
for(const direction of [-1,1]){
  const s=M.fresh();s.phase='room';
  assert.equal(M.openExit(s),false);assert.equal(M.leave(s),false);
  assert.doesNotMatch(M.reply(s,'route'),/보관장|숨은|밀어/,'B-0 cannot disclose the hidden exit');
  assert.match(M.reply(s,'basis'),/기록 01/);
  for(let i=0;i<5;i++)M.moveShelf(s,s.shelfZ+35*direction);
  assert.equal(M.clear(s),true,'either direction can reveal the door, without a clue checklist');
  assert.deepEqual(s.seen,{});
  assert.equal(M.leave(s),false,'must actually open the revealed door');
  assert.equal(M.openExit(s),true);assert.equal(M.leave(s),true);
  assert.equal(M.finish(s),false,'external gate needs its approval response');
  assert.equal(M.request(s),true);assert.equal(M.finish(s),true);
  assert.equal(s.phase,'complete');assert.equal(M.restore(JSON.parse(JSON.stringify(s))).phase,'complete');
}
const s=M.fresh();s.phase='room';M.toggleOldDoor(s);
assert.equal(s.seen.wall,true);assert.match(M.reply(s,'route'),/まだ|아직 확인하지 못/);
assert.match(M.reply(s,'check','oldDoor'),/벽/);assert.doesNotMatch(M.reply(s,'check','record'),/새 출구/);
s.drawerOpen=true;assert.match(M.reply(s,'check','record'),/위치는 적혀 있지/);
M.moveShelf(s,175);assert.equal(s.shelfZ,40,'solo direct drag is limited per attempt');
s.helper=true;M.moveShelf(s,175);assert.equal(s.shelfZ,175);M.openExit(s);
M.moveShelf(s,0);assert.equal(s.realDoorOpen,false,'cannot bury an open doorway with the cabinet');
const damaged=M.restore({version:1,phase:'bad',shelfZ:Infinity,realDoorOpen:true,seen:{exit:true,bad:true},logs:new Array(110).fill({action:'inspect'})});
assert.equal(damaged.phase,'intro');assert.equal(damaged.shelfZ,0);assert.equal(damaged.realDoorOpen,false);assert.equal(damaged.seen.bad,undefined);assert.equal(damaged.logs.length,100);
console.log('PASS: independent exploration, both cabinet directions, solo/helper movement, no early exit disclosure, evidence comparison, gate and saved progress');
