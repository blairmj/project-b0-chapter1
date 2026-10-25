const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../chapter3-model.js');
const nodes=new Map();function node(key){if(!nodes.has(key))nodes.set(key,{style:{},dataset:{},hidden:false,isConnected:true,clientWidth:616,clientHeight:500,innerHTML:'',textContent:'',classList:{toggle(){},add(){},remove(){}},querySelector:s=>node(key+s),querySelectorAll:()=>[],setAttribute(k,v){this[k]=v;},listeners:{},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(){},setPointerCapture(){},hasPointerCapture(){return true;},releasePointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:616,height:500};}});return nodes.get(key);}
let saved,back=0;const storage={getItem(){return null;},setItem(k,v){saved=v;}};
const app={querySelector:s=>['.c3-modal','.mr-modal'].includes(s)?null:node(s),addEventListener(){},removeEventListener(){}};
let serial=0;const frames=new Map();const context={window:{B0RoomThree:M,B0Mirror:require('../mirror-model.js'),addEventListener(){},removeEventListener(){}},sessionStorage:storage,localStorage:storage,matchMedia:()=>({matches:true}),performance:{now:()=>0},requestAnimationFrame(fn){frames.set(++serial,fn);return serial;},cancelAnimationFrame(n){frames.delete(n);},setTimeout:()=>0,clearTimeout(){}};
const source=fs.readFileSync(require.resolve('../chapter3.js'),'utf8').replace('return {dispose,jumpToEnd};','return {jumpToEnd,act,select,down,move,up,mirror:()=>mirrorView,state:()=>({s,camera,busy,mode})};');
context.document={addEventListener(){}};vm.runInNewContext(fs.readFileSync(require.resolve('../ui-common.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(require.resolve('../mirror-room.js'),'utf8').replace('return {dispose};','return {act,dispose};'),context);
vm.runInNewContext(source,context);const game=context.window.startChapterThree({app,portrait:()=>'',onBack(){back++;},preview:true});
const flush=()=>{while(frames.size){const [id,f]=frames.entries().next().value;frames.delete(id);f(1000);}};
for(let i=0;i<6;i++)game.act('intro-next');game.act('talk-next');game.act('talk-next');
assert.equal(game.state().s.phase,'room');
assert.match(node('.c3-real-exit')['aria-hidden'],/true/);
game.act('robot');game.act('ask-route');assert.doesNotMatch(node('.c3-speech').innerHTML,/보관장/);
game.select('oldDoor');game.act('old-door');assert.equal(game.state().s.seen.wall,true,'context buttons work during the approach');flush();
game.act('talk-next');game.act('talk-next');game.act('ask-route');assert.match(node('.c3-speech').innerHTML,/현재 출구 위치는 아직 확인하지/);
game.select('shelf');flush();
function ev(x,y,object){return {pointerId:1,button:0,clientX:x,clientY:y,preventDefault(){},target:{closest:sel=>sel==='[data-object]'&&object?{dataset:{object}}:null}};}
const yaw=game.state().camera.yaw;
game.down(ev(300,250,'shelf'));game.move(ev(370,250,'shelf'));game.up(ev(370,250,'shelf'));
assert.notEqual(game.state().s.shelfZ,0,'direct cabinet drag changes world position');assert.equal(game.state().camera.yaw,yaw);
const shelf=game.state().s.shelfZ;game.down(ev(400,100));game.move(ev(350,100));game.up(ev(350,100));
assert.notEqual(game.state().camera.yaw,yaw);assert.equal(game.state().s.shelfZ,shelf);
game.act('home');flush();assert.equal(game.state().camera.zoom,1);assert.equal(game.state().s.shelfZ,shelf,'home keeps exploration');
game.select('shelf');flush();game.act('help-shelf');flush();assert.equal(game.state().s.helper,true);
game.act('push-right');game.act('push-right');game.act('push-right');assert.equal(M.clear(game.state().s),true);
assert.equal(node('.c3-real-exit')['aria-hidden'],'false');
game.select('exit');flush();game.act('open-exit');game.act('leave');
assert.equal(game.state().s.phase,'gate');assert.equal(game.state().busy,true);
game.act('talk-next');game.act('talk-next');game.act('talk-next');assert.equal(game.state().busy,false);assert.match(app.innerHTML,/외부 출입구/);
game.act('request-approval');assert.equal(game.state().s.approval,'rejected');assert.match(node('.c3-actions').innerHTML,/관찰실 통로로 가기/);game.act('go-central');assert.equal(game.state().s.phase,'mirror');assert.match(app.innerHTML,/mr-game/);const mirror=game.mirror();mirror.act('intro-next');mirror.act('intro-next');flush();for(let i=0;i<4;i++)mirror.act('intro-next');mirror.act('command-triangle-hold');flush();mirror.act('pull');flush();mirror.act('reunite');flush();mirror.act('leave');assert.match(app.innerHTML,/data-c3="chapter-four"/);assert.match(app.innerHTML,/중앙관리실 앞으로 가기/);assert.match(app.innerHTML,/거울 관찰실 밖 통로/);assert.doesNotMatch(app.innerHTML,/AXIOM|액시엄|엑시엄/);
assert.equal(JSON.parse(saved).phase,'complete');game.act('back');assert.equal(back,1);
console.log('PASS: corridor intro, factual B-0, direct drag vs orbit, home preserves placement, requested cooperation, revealed door, final approval and chapter return');

game.state().s.phase='mirror';game.state().s.mirror.phase='approach';game.jumpToEnd();
const skipped=M.restore(JSON.parse(saved));assert.equal(skipped.phase,'complete');assert.equal(skipped.mirror.phase,'complete');assert.equal(skipped.realDoorOpen,true);
console.log('PASS: temporary jump completes the whole third lesson including its mirror room');
