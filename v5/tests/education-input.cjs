const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../education-model.js'),nodes=new Map(),frames=new Map();let serial=0,time=0,dialog,media;
function node(key){if(!nodes.has(key))nodes.set(key,{dataset:{},style:{},hidden:false,isConnected:true,clientWidth:676,clientHeight:870,innerHTML:'',classList:{add(){},remove(){},toggle(){}},focus(){},pause(){},querySelector:s=>node(key+s),querySelectorAll:()=>[],addEventListener(){},setPointerCapture(){},hasPointerCapture(){return false;}});return nodes.get(key);}
const app={querySelectorAll:()=>[],querySelector:s=>s==='video'?media:s==='.ed-modal'?dialog:node(s),addEventListener(){},removeEventListener(){},append(){}};
const storage={getItem(){return null;},setItem(){}};
const context={window:{B0Education:M,B0UI:{header:()=>'',inventoryButton:()=>'',dialogBody:b=>b},addEventListener(){},removeEventListener(){}},sessionStorage:storage,localStorage:storage,document:{createElement(){const handlers={};return dialog={dataset:{},querySelector(){return null;},addEventListener(k,f){handlers[k]=f;},showModal(){},close(){handlers.close?.();},remove(){dialog=null;}};}},performance:{now:()=>time},requestAnimationFrame:f=>{frames.set(++serial,f);return serial;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:()=>0,clearTimeout(){}};
const source=fs.readFileSync(require.resolve('../education-room.js'),'utf8').replace('return {dispose,jumpToEnd(){','return {select,act,down,move,up,state:()=>s,view:()=>({...camera}),dispose,jumpToEnd(){');
vm.runInNewContext(source,context);
const game=context.window.startEducationRoom({app,portrait:()=>'',preview:true,onBack(){},onHome(){}});
function finish(){while(frames.size){time+=200;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(time));}}
const initial=game.view();game.select('desk');finish();assert.deepEqual(game.view(),initial,'clicking an empty desk must not turn or translate the camera');
game.select('screen');assert.ok(frames.size);time+=180;const pending=[...frames.values()];frames.clear();pending.forEach(f=>f(time));
const interrupted=game.view();game.select('desk');finish();assert.deepEqual(game.view(),interrupted,'desk inspection also cancels an earlier unfinished automatic approach');
game.act('desk');assert.match(node('.ed-speech').innerHTML,/필기 자국/);
game.act('working');assert.ok(dialog);game.act('close-modal');assert.equal(dialog,null);
const afterClose=game.view();game.select('desk');finish();assert.deepEqual(game.view(),afterClose,'closing a popup leaves desk inspection stationary and usable');
const event=(x,y)=>({button:0,pointerId:1,clientX:x,clientY:y,target:{closest(){return null;}}});
game.down(event(400,300));game.move(event(280,320));game.up(event(280,320));assert.notEqual(game.view().yaw,afterClose.yaw,'a deliberate background drag still rotates the classroom');
game.select('terminal');finish();assert.ok(Math.abs(game.view().yaw-35)<1e-8,'interactive terminal approach remains available');
console.log('PASS: stationary empty desks, cancelled stale approach, inspection after popup close, intentional drag and terminal approach');

let lastTalk;context.window.B0ObjectDialogue={present(lines,options){lastTalk={lines,options};return true;}};
game.act('solve');assert.ok(dialog);const originalChoices=lastTalk;game.act('help');assert.equal(dialog,null,'asking B-0 closes the worksheet popup');assert.notEqual(lastTalk,originalChoices);assert.equal(lastTalk.options.actions.length,1);
assert.equal(dialog,null,'a spoken explanation stays below the scene');assert.equal(lastTalk.lines[0][0],'student');assert.match(lastTalk.lines[1][1],/왼쪽부터/);lastTalk.options.actions[0][1]();assert.ok(dialog,'the saved worksheet remains available after help');
game.act('help-check');assert.equal(dialog,null);assert.match(lastTalk.lines[1][1],/아직 첫 계산/);
game.act('help-draw');assert.equal(dialog,null);assert.match(lastTalk.lines[1][1],/3묶음/);lastTalk.options.actions[0][1]();assert.ok(dialog,'the requested picture uses the reference-material popup');assert.match(dialog.innerHTML,/ed-groups/);
console.log('PASS: spoken lesson help uses in-room dialogue, returns to the worksheet, and keeps diagrams as reference popups');

// V5's actual solve controls use choices and do not let an unfinished exit skip the room.
game.select('exit');assert.doesNotMatch(node('.ed-actions').innerHTML,/문 열고 관제 기록실로/);assert.match(node('.ed-actions').innerHTML,/잠금 표시/);
game.act('solve');assert.doesNotMatch(dialog.innerHTML,/<input/);assert.match(dialog.innerHTML,/value-middle-8/);game.act('choose-divide');game.act('value-middle-8');game.act('value-answer-16');game.act('verify');assert.equal(game.state().verified,true);game.act('take');assert.equal(game.state().memoryTaken,true);game.select('exit');assert.match(node('.ed-actions').innerHTML,/문 열고 관제 기록실로/);game.dispose();
console.log('PASS: V5 button-only arithmetic, earned memory, and locked forward door until collection');

// The replacement recording has one pause/replay control and freezes a pending camera approach.
const videoEvents={},toggle={textContent:'',setAttribute(){}};let pauses=0,plays=0;
media={paused:true,ended:false,currentTime:0,addEventListener:(name,fn)=>videoEvents[name]=fn,play(){plays++;this.paused=false;videoEvents.play?.();return Promise.resolve();},pause(){pauses++;this.paused=true;videoEvents.pause?.();}};
const create=context.document.createElement;context.document.createElement=()=>{const d=create();d.classList={add(){}};d.querySelector=selector=>selector==='video'?media:selector==='[data-ed="video-toggle"]'?toggle:null;return d;};
const replay=context.window.startEducationRoom({app,portrait:()=>'',preview:true,onBack(){},onHome(){}});
replay.select('screen');assert.ok(frames.size);replay.act('video');assert.equal(frames.size,0);assert.match(dialog.innerHTML,/education-discussion-v1.mp4/);assert.doesNotMatch(dialog.innerHTML,/playsinline controls|video-rewind|풀이 화면 보기/);assert.equal((dialog.innerHTML.match(/data-ed="video-toggle"/g)||[]).length,1);assert.equal(plays,1);
replay.act('video-toggle');assert.equal(media.paused,true);assert.equal(toggle.textContent,'계속 보기');media.ended=true;media.currentTime=32.5;videoEvents.ended();assert.equal(toggle.textContent,'다시 보기');replay.act('video-toggle');assert.equal(media.currentTime,0);assert.equal(plays,2);replay.act('close-modal');assert.ok(pauses>=2);assert.equal(dialog,null);replay.dispose();
console.log('PASS: fixed-camera discussion video, one pause/resume/replay control and media cleanup');
