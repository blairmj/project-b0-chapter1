const assert=require('node:assert/strict'),M=require('../access-logic.js');
const solutions=[];for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)for(let c=1;c<=9;c++)if(M.check(''+a+b+c).ok)solutions.push(''+a+b+c);
assert.deepEqual(solutions,['452']);for(const code of ['4732','052','444','643','453','425'])assert.equal(M.check(code).ok,false,code);
const s=M.fresh();M.choose(s,'first',6);assert.equal(s.step,'third');assert.doesNotMatch(s.message,/셋째는 3|452/);M.choose(s,'third',2);assert.equal(s.step,'third');M.choose(s,'third',3);M.choose(s,'second',4);assert.equal(s.step,'total');M.choose(s,'total',10);assert.equal(s.step,'retry');assert.match(s.message,/10.*9/);
const t=M.fresh();M.choose(t,'first',4);M.choose(t,'third',2);M.choose(t,'second',5);M.choose(t,'total',9);assert.equal(t.step,'done');assert.doesNotMatch(t.message,/452/);assert.equal(M.choose(t,'total',9),false);
console.log('PASS: unique three-digit solution, all constraints, child-supplied 6/3/4 counterexample and 4/2/5 verification without answer disclosure');
