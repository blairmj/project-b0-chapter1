const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app={querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}};
let stored=JSON.stringify({phase:'intro',chapter:3,muted:true}),two,three,four,disposed2=0,disposed3=0,disposed4=0;
const location={pathname:'/preview-v2.html',href:'https://example.test/preview-v2.html?chapter=2',search:'?chapter=2'};
const rooms=new Map([['project-b0-room2-v1','old-2'],['project-b0-room3-v1','old-3'],['project-b0-final-v1','old-4'],['project-b0-final-v2','old-final'],['unrelated-user-data','keep']]);
const context=vm.createContext({document:{querySelector:()=>app},location,URL,URLSearchParams,
 history:{replaceState(a,b,url){location.href=String(url);location.search=new URL(url).search;}},
 sessionStorage:{getItem:k=>k==='project-b0-firstperson-v4'?stored:rooms.get(k)??null,setItem(k,v){if(k==='project-b0-firstperson-v4')stored=v;else rooms.set(k,v);},removeItem:k=>rooms.delete(k)},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},
 window:{addEventListener(){},startChapterTwo(options){two=options;return {dispose(){disposed2++;}};},startChapterThree(options){three=options;return {dispose(){disposed3++;}};},startChapterFour(options){four=options;return {dispose(){disposed4++;}};}}});
const run=s=>vm.runInContext(s,context);
run(fs.readFileSync(require.resolve('../firstperson.js'),'utf8').replace(/boot\(\);\s*$/,''));
run('boot()');assert.ok(two,'explicit Chapter 2 URL takes precedence over saved Chapter 3');
assert.equal(two.preview,true);two.onNext();assert.ok(three);assert.ok(disposed2>=1);assert.equal(new URL(location.href).searchParams.get('chapter'),'3');assert.equal(JSON.parse(stored).chapter,3);
three.onBack();assert.ok(disposed3>=1);assert.equal(new URL(location.href).searchParams.get('chapter'),'2');assert.equal(JSON.parse(stored).chapter,2);
two.onNext();three.onNext();assert.ok(four);assert.equal(new URL(location.href).searchParams.get('chapter'),'4');assert.equal(new URL(location.href).searchParams.has('room'),false);four.onBack();assert.ok(disposed4>=1);assert.equal(new URL(location.href).searchParams.get('chapter'),'3');
console.log('PASS: explicit chapter URL, persistent chapter selection, 2-to-3 continuation, 3-to-2 return and scene cleanup');

run('campaignHome()');assert.match(app.innerHTML,/이어하기/);assert.match(app.innerHTML,/처음부터 시작/);assert.equal(new URL(location.href).searchParams.has('chapter'),false,'home is the full adventure entry URL');
assert.equal(JSON.parse(stored).chapter,3,'home must not discard saved checkpoint');
run('handle("campaign-continue")');assert.equal(new URL(location.href).searchParams.get('chapter'),'3');
let openingCount=0;context.countOpening=()=>openingCount++;
run('opening=()=>countOpening();startAdventure()');assert.equal(openingCount,1);
assert.equal(JSON.parse(stored).chapter,1);assert.equal(JSON.parse(stored).phase,'intro');assert.equal(JSON.parse(stored).muted,true);
for(const key of ['project-b0-room2-v1','project-b0-room3-v1','project-b0-final-v1','project-b0-final-v2'])assert.equal(rooms.has(key),false,'a full restart cannot resume stale future rooms');
assert.equal(rooms.get('unrelated-user-data'),'keep');
run('state.phase="escaped";handle("chapter-two")');assert.ok(two.onHome,'each room can return to the full adventure menu');two.onNext();three.onNext();assert.ok(four.onHome);four.onHome();assert.match(app.innerHTML,/campaign-home/);
console.log('PASS: one full-adventure entry, preserved continue checkpoint, full-run reset across all rooms, sound preference and unrelated storage retained, 1→2→3→4 callbacks and ending home');
