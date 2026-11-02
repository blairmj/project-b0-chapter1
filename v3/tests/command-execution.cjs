const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path=require('node:path'),CM=require('../command-model.js');
function harness(file,modelName,model,needle,replacement){
 const nodes=new Map(),frames=new Map(),learning={};let serial=0,time=0,active,opened,dialog;
 function node(k){if(!nodes.has(k))nodes.set(k,{style:{},dataset:{},hidden:false,isConnected:true,clientWidth:676,clientHeight:870,innerHTML:'',textContent:'',classList:{toggle(){},add(){},remove(){}},setAttribute(){},addEventListener(){},removeEventListener(){},focus(){},querySelector:s=>node(k+s),querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,width:676,height:870})});return nodes.get(k);}
 const storage={getItem:()=>null,setItem(){}};
 const app={innerHTML:'',querySelector:s=>s.includes('modal')?dialog:node(s),querySelectorAll:()=>[],addEventListener(){},removeEventListener(){},append(){}};
 const commands={define(c){active=c;},open(t){opened=t;},clear(){},observed:()=>true,read:()=>({learning}),remember(k,v){learning[k]=v;},waitFor(test,dead=()=>false){return new Promise(resolve=>{function tick(){if(dead())return resolve(false);if(test())return resolve(true);frames.set(++serial,tick);}tick();});}};
 const ctx={window:{[modelName]:model,B0CommandModel:CM,B0Commands:commands,B0RoomDialogue:require('../room-dialogue.js'),B0UI:{header:()=>'',inventoryButton:()=>'',dialogBody:x=>x},addEventListener(){},removeEventListener(){}},sessionStorage:storage,localStorage:storage,matchMedia:()=>({matches:false}),performance:{now:()=>time},requestAnimationFrame:f=>{frames.set(++serial,f);return serial;},cancelAnimationFrame:n=>frames.delete(n),setTimeout:()=>0,clearTimeout(){},console};
 ctx.document={createElement(){const handlers={};return dialog={dataset:{},querySelector:()=>null,addEventListener(k,f){handlers[k]=f;},showModal(){},close(){handlers.close?.();},remove(){if(dialog===this)dialog=null;}};}};
 const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');assert.ok(source.includes(needle));vm.runInNewContext(source.replace(needle,replacement),ctx);
 async function execute(c){let complete=false,error;const p=active.execute(c).then(()=>complete=true,e=>{error=e;complete=true;});for(let i=0;i<800&&!complete;i++){await Promise.resolve();time+=50;const pending=[...frames];frames.clear();pending.forEach(([,fn])=>fn(time));await Promise.resolve();}await p;if(error)throw error;assert.ok(complete,'command finishes');}
 return {ctx,app,node,execute,learning,opened:()=>opened,dialog:()=>dialog};
}
(async()=>{
 const cargo=harness('chapter2.js','B0RoomTwo',require('../chapter2-model.js'),'return {dispose,jumpToEnd};','return {dispose,jumpToEnd,act,state:()=>s};');
 const game=cargo.ctx.window.startChapterTwo({app:cargo.app,portrait:()=>'',onNext(){},onBack(){},preview:true});
 const before=JSON.stringify(game.state().boxes);game.act('move-wide');assert.equal(cargo.opened(),'wide');assert.equal(JSON.stringify(game.state().boxes),before,'player move action opens a command without moving a box');
 await cargo.execute({target:'wide',verb:'move',param:'window'});assert.equal(game.state().boxes.wide.x,105);assert.ok(game.state().boxes.wide.z<=-170);
 await cargo.execute({target:'wide',verb:'stack',param:'small-top'});assert.equal(game.state().boxes.wide.on,null);assert.match(cargo.node('.c2-speech').innerHTML,/받치는 면보다/);
 await cargo.execute({target:'small',verb:'stack',param:'wide-top'});assert.equal(game.state().boxes.small.on,'wide');assert.equal(cargo.learning.specificTarget,true);
 const ed=harness('education-room.js','B0Education',require('../education-model.js'),'return {dispose,jumpToEnd(){','return {act,select,state:()=>s,dispose,jumpToEnd(){');
 const classroom=ed.ctx.window.startEducationRoom({app:ed.app,portrait:()=>'',onBack(){},onHome(){},preview:true});classroom.state().workingSeen=true;
 await ed.execute({target:'working',verb:'calculate',param:'multiply-first'});assert.equal(classroom.state().answer,'4');assert.equal(classroom.state().verified,false);assert.match(ed.dialog().innerHTML,/3 × 2 = 6/);
 await ed.execute({target:'working',verb:'rule',param:'left-to-right'});assert.equal(classroom.state().answer,'16');assert.equal(classroom.state().verified,true);assert.equal(ed.learning.calculation,'left-to-right');
 await ed.execute({target:'memory',verb:'take'});assert.equal(classroom.state().memoryTaken,true);
 const archive=harness('chapter3.js','B0RoomThree',require('../chapter3-model.js'),'return {dispose,jumpToEnd};','return {act,dispose,jumpToEnd,state:()=>s};');
 archive.ctx.window.B0Education={read:()=>({memoryTaken:true})};
 const room=archive.ctx.window.startChapterThree({app:archive.app,portrait:()=>'',onBack(){},preview:true,arrived:true});for(let i=0;i<4;i++)room.act('talk-next');
 room.act('push-left');assert.equal(room.state().shelfZ,0);assert.equal(archive.opened(),'shelf');
 await archive.execute({target:'computer',verb:'power'});assert.equal(room.state().computerOn,true);
 await archive.execute({target:'computer',verb:'connect'});assert.equal(room.state().memoryConnected,true);
 await archive.execute({target:'shelf',verb:'push',param:'left'});assert.equal(room.state().shelfZ,35);assert.equal(room.state().realDoorOpen,false);
 await archive.execute({target:'shelf',verb:'together',param:'left'});assert.ok(room.state().shelfZ>=150);await archive.execute({target:'exit',verb:'open'});assert.equal(room.state().realDoorOpen,true);
 console.log('PASS: actual B-0 command executors, guarded player actions, animated cargo placement, wrong support feedback, rule correction, memory delivery and cooperative archive exit');
})().catch(error=>{console.error(error);process.exitCode=1;});
