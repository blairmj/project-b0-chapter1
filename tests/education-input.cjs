const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../education-model.js'),nodes=new Map(),frames=new Map();let serial=0,time=0,dialog;
function node(key){if(!nodes.has(key))nodes.set(key,{dataset:{},style:{},hidden:false,isConnected:true,clientWidth:676,clientHeight:870,innerHTML:'',classList:{add(){},remove(){},toggle(){}},focus(){},querySelector:s=>node(key+s),querySelectorAll:()=>[],addEventListener(){},setPointerCapture(){},hasPointerCapture(){return false;}});return nodes.get(key);}
const app={querySelector:s=>s==='.ed-modal'?dialog:node(s),addEventListener(){},removeEventListener(){},append(){}};
const storage={getItem(){return null;},setItem(){}};
const context={window:{B0Education:M,B0UI:{header:()=>'',inventoryButton:()=>'',dialogBody:b=>b},addEventListener(){},removeEventListener(){}},sessionStorage:storage,localStorage:storage,document:{createElement(){const handlers={};return dialog={dataset:{},querySelector(){return null;},addEventListener(k,f){handlers[k]=f;},showModal(){},close(){handlers.close?.();},remove(){dialog=null;}};}},performance:{now:()=>time},requestAnimationFrame:f=>{frames.set(++serial,f);return serial;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:()=>0,clearTimeout(){}};
const source=fs.readFileSync(require.resolve('../education-room.js'),'utf8').replace('return {dispose,jumpToEnd(){','return {select,act,down,move,up,view:()=>({...camera}),dispose,jumpToEnd(){');
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
