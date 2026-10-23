const assert=require('node:assert/strict'),M=require('../mirror-model.js');
const fresh=()=>({...M.fresh(),phase:'split'});
for(const id of ['circle','square']){
 const s=fresh();M.command(s,id,'hold');M.setOwn(s,1);
 assert.equal(s.phase,'split','a decoy cannot release the door');
 assert.equal(s[id==='circle'?'lights':'vent'],true,'decoys have visible effects');
 M.release(s);assert.equal(s.lights,false);assert.equal(s.vent,false);
}
const s=fresh();assert.equal(M.finish(s),false);assert.equal(M.join(s),false);
M.command(s,'triangle','down');assert.equal(s.active,'triangle');assert.equal(s.holding,null);
M.setOwn(s,1);assert.equal(s.phase,'split','a momentary request does not satisfy maintaining the remote handle');
M.release(s,'triangle');assert.equal(s.active,null);assert.match(M.reply(s,'last'),/내렸다가 놓았/);
M.setOwn(s,0);M.command(s,'triangle','hold');M.setOwn(s,.8);assert.equal(s.phase,'split');
M.setOwn(s,1);assert.equal(s.phase,'unlocked');assert.deepEqual(s.seen,{},'no forced sequence of clue inspections');
M.release(s);assert.equal(M.solved(s),true,'mechanical release remains latched after unlocking');
assert.equal(M.join(s),true);assert.equal(M.finish(s),true);assert.equal(s.phase,'complete');
const firstTry=fresh();M.command(firstTry,'triangle','hold');M.setOwn(firstTry,1);assert.equal(firstTry.phase,'unlocked','a correct first request is accepted');
const ownFirst=fresh();M.setOwn(ownFirst,1);M.command(ownFirst,'triangle','hold');assert.equal(ownFirst.phase,'unlocked','the student may hold their handle before B-0');
const changing=fresh();M.command(changing,'circle','hold');M.command(changing,'triangle','hold');assert.equal(changing.lights,false);assert.equal(changing.holding,'triangle');
M.command(changing,'square','release');assert.equal(changing.holding,'triangle','naming another target must not release the held handle');
const restored=M.restore({...changing,own:1,active:'square'});assert.equal(restored.own,0);assert.equal(restored.active,'triangle');
const pulse=M.restore({...fresh(),active:'triangle',own:1,last:{target:'triangle',verb:'down'}});assert.equal(pulse.active,null);assert.equal(pulse.own,0);
assert.doesNotMatch(M.reply(fresh(),'see'),/삼각형|유지|내린 채/,'B-0 does not reveal the solution');
assert.equal(M.restore({...s}).phase,'complete');assert.equal(M.restore({version:1,phase:'bad',holding:'hack'}).phase,'approach');
console.log('PASS: separate controls, both decoys, momentary versus maintained requests, correct-first success, no forced clue order, latched release, reunion and save recovery');
