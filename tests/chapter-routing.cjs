const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../lab-navigation-model.js');
const app={attributes:{},setAttribute(k,v){this.attributes[k]=v;},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}};
let stored=JSON.stringify({phase:'escaped',chapter:3,muted:true}),two,three,four,hall,disposed=0;
const location={pathname:'/index.html',href:'https://example.test/index.html?chapter=2',search:'?chapter=2'};
const rooms=new Map([['unrelated-user-data','keep']]);
const context=vm.createContext({document:{querySelector:()=>app},location,URL,URLSearchParams,
 history:{replaceState(a,b,url){location.href=String(url);location.search=new URL(url).search;}},
 localStorage:{getItem:k=>k==='project-b0-firstperson-v4'?stored:rooms.get(k)??null,setItem(k,v){if(k==='project-b0-firstperson-v4')stored=v;else rooms.set(k,v);},removeItem:k=>rooms.delete(k)},setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){},
 window:{B0LabNavigation:M,addEventListener(){},startLabNavigation(options){hall=options;return {dispose(){disposed++;}};},startChapterTwo(options){two=options;return {dispose(){disposed++;},jumpToEnd(){rooms.set('reviewed-chapter','2');}};},startChapterThree(options){three=options;return {dispose(){disposed++;}};},startChapterFour(options){four=options;return {dispose(){disposed++;}};}}});
const run=s=>vm.runInContext(s,context);
run(fs.readFileSync(require.resolve('../firstperson.js'),'utf8').replace(/boot\(\);\s*$/,''));
run('boot()');assert.ok(two,'explicit Chapter 2 URL enters the saved room');assert.equal(two.preview,undefined,'normal entry uses persistent browser storage');
two.onNext();assert.ok(hall);assert.equal(hall.state.cleared.storage,true);assert.equal(new URL(location.href).searchParams.get('area'),'hall');assert.equal(three,undefined,'room exit must not teleport into the next room');
hall.onEnter('access');assert.ok(three);assert.equal(new URL(location.href).searchParams.get('chapter'),'3');assert.equal(new URL(location.href).searchParams.has('area'),false);
three.onCorridor();assert.equal(hall.state.cleared.access,true);hall.onEnter('mirror');assert.equal(new URL(location.href).searchParams.get('room'),'mirror');
three.onNext();assert.equal(hall.state.cleared.mirror,true);assert.equal(hall.state.keyTaken,false);assert.equal(new URL(location.href).searchParams.has('room'),false);
hall.onEnter('central');assert.equal(four,undefined,'final room requires opening the stairs and reaching floor 2');
const nav=hall.state;nav.powerOut=true;hall.onSave();assert.equal(app.attributes['data-corridor-power'],'out','all corridor cutaways inherit the outage');nav.keyboxOpen=true;assert.ok(M.takeKey(nav));assert.ok(M.unlock(nav));assert.ok(M.floor(nav,2));hall.onEnter('central');assert.ok(four);assert.equal(new URL(location.href).searchParams.get('chapter'),'4');
four.onBack();assert.equal(hall.state.floor,2);assert.equal(hall.state.mode,'hall');assert.ok(disposed>=5);
run('campaignHome()');assert.match(app.innerHTML,/이어하기/);assert.equal(JSON.parse(stored).chapter,4);run('handle("campaign-continue")');assert.equal(hall.state.floor,2,'continue restores the hallway checkpoint');
let openingCount=0;context.countOpening=()=>openingCount++;run('opening=()=>countOpening();startAdventure()');assert.equal(openingCount,1);assert.equal(app.attributes['data-corridor-power'],'on','a new adventure restores corridor lighting');assert.equal(JSON.parse(stored).muted,true);assert.equal(JSON.parse(stored).chapter,1);
for(const key of ['project-b0-room2-v1','project-b0-room3-v1','project-b0-final-v1','project-b0-final-v2'])assert.equal(rooms.has(key),false);
assert.equal(JSON.parse(rooms.get('project-b0-lab-navigation-v1')).stairsUnlocked,false);assert.equal(rooms.get('unrelated-user-data'),'keep');
run('state.phase="escaped";handle("chapter-two")');assert.equal(hall.state.cleared.practice,true);assert.equal(hall.state.floor,1);
console.log('PASS: exits lead to an explorable hall, map room selection, office-to-mirror route, key/stair/floor gate, continued hall checkpoint, cleanup, and full restart');

run('state.chapter=2;jumpLessonEnd()');assert.equal(rooms.get("reviewed-chapter"),"2","temporary end control in a corridor keeps the current lesson");
run("showHall();reviewLesson(1)");assert.equal(JSON.parse(rooms.get("project-b0-lab-navigation-v1")).mode,"room","review start must resume the selected room after refresh");
console.log("PASS: temporary lesson controls preserve corridor lesson and room resume mode");

run('navigation.cleared.practice=false;navigation.cleared.storage=true;showHall();boot()');
assert.equal(hall.state.mode,'hall','reloading a corridor reached from a direct lesson entry must preserve the corridor');
console.log('PASS: direct-lesson corridor checkpoint survives reload');

// Location review moves without clearing puzzle saves or manufacturing keys.
context.window.startEducationRoom=options=>({dispose(){disposed++;}});
run('startAdventure()');
const originalRooms=[...rooms.entries()].filter(([key])=>key.includes('room2')||key.includes('room3'));
run('window.B0CampaignUI.travel("education")');assert.equal(new URL(location.href).searchParams.get('room'),'education');
run('window.B0CampaignUI.travel("central")');assert.equal(JSON.parse(stored).chapter,4);assert.equal(four.preview,undefined);
let reviewNav=JSON.parse(rooms.get('project-b0-lab-navigation-v1'));
assert.equal(reviewNav.keyTaken,false);assert.equal(reviewNav.stairsUnlocked,false);assert.equal(reviewNav.reviewMode,true);assert.equal(reviewNav.floor,2);
assert.equal(M.restore(reviewNav).floor,2,'temporary floor survives reload without a real key');
run('window.B0CampaignUI.travel("hall2")');assert.equal(hall.state.floor,2);assert.equal(hall.state.keyTaken,false);
run('window.B0CampaignUI.travel("mirror")');run('window.B0CampaignUI.travel("hall")');assert.equal(hall.state.cleared.access,false,'visiting the mirror room for review must not solve the archive');assert.equal(hall.state.floor,1);run('boot()');assert.equal(hall.state.mode,'hall');
run('window.B0CampaignUI.travel("access")');assert.equal(new URL(location.href).searchParams.get('chapter'),'3');assert.equal(three.arrived,true);
assert.deepEqual([...rooms.entries()].filter(([key])=>key.includes('room2')||key.includes('room3')),originalRooms);
run('startAdventure()');assert.equal(JSON.parse(rooms.get('project-b0-lab-navigation-v1')).reviewMode,undefined);
console.log('PASS: temporary location travel preserves puzzle saves and inventory, floor checkpoint and restart');

const practiceViews=[];context.openPractice=(...args)=>practiceViews.push(args);
run('enterRoom=(...args)=>openPractice(...args);window.B0CampaignUI.travel("practice");boot()');
assert.equal(new URL(location.href).searchParams.get('room'),'practice');assert.equal(practiceViews.length,2);
assert.equal(practiceViews[0][1],true);assert.equal(practiceViews[1][1],true,'a first-room revisit survives refresh without falling into an ending');
console.log('PASS: first room review and reload retain the real room view');
