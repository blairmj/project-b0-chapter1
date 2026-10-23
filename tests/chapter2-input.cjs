const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('../chapter2-model.js');
// Run the real input handlers with a minimal scene DOM; no test hooks ship in the game.
const nodes=new Map();
function node(key){
  if(!nodes.has(key))nodes.set(key,{style:{},dataset:{},hidden:false,isConnected:true,
    clientWidth:616,clientHeight:500,innerHTML:'',textContent:'',
    classList:{toggle(){},add(){},remove(){}},querySelector:s=>node(key+s),
    addEventListener(){},removeEventListener(){},setPointerCapture(){},
    hasPointerCapture(){return true;},releasePointerCapture(){},
    getBoundingClientRect(){return {left:0,top:0,width:616,height:500};}});
  return nodes.get(key);
}
const app={querySelector:node,addEventListener(){},removeEventListener(){}};
const storage={getItem(){return null;},setItem(){}};
const context={window:{B0RoomTwo:M,addEventListener(){},removeEventListener(){}},
  sessionStorage:storage,localStorage:storage,document:{elementFromPoint(){return null;}},
  matchMedia:()=>({matches:true}),setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(){}};
const source=fs.readFileSync(require.resolve('../chapter2.js'),'utf8').replace('return {dispose};',
  'return {act,pointerDown,pointerMove,pointerUp,cancelPointer,select,state:()=>({s,camera,standing,mode,selection})};');
vm.runInNewContext(source,context);
const game=context.window.startChapterTwo({app,portrait:()=>'',onBack(){},preview:true});
function event(x,y,object){return {pointerId:1,button:0,clientX:x,clientY:y,preventDefault(){},
  target:{closest:s=>s==='[data-object]'&&object?{dataset:{object}}:null}};}
function drag(object,x1,y1,x2,y2){game.pointerDown(event(x1,y1,object));game.pointerMove(event(x2,y2,object));game.pointerUp(event(x2,y2,object));}
let before={...game.state().s.boxes.wide},yaw=game.state().camera.yaw;
drag('wide',180,390,225,395);
assert.notDeepEqual(game.state().s.boxes.wide,before,'crate drag moves without selecting move first');
assert.equal(game.state().camera.yaw,yaw,'crate drag must not rotate camera');
assert.equal(game.state().s.logs.filter(x=>x.action==='move').length,1);
game.act('move-wide');game.act('nudge-right');
before={...game.state().s.boxes.wide};
drag(null,400,220,350,220);
assert.notEqual(game.state().camera.yaw,yaw,'empty drag orbits with move controls open');
assert.deepEqual(game.state().s.boxes.wide,before,'orbit must not drop the candidate');
assert.equal(game.state().s.logs.filter(x=>x.action==='move').length,1);
game.act('cancel');game.act('climb-wide');
assert.equal(node('.c2-descend').hidden,false);
game.act('clear');game.act('robot');game.act('request-inspect');
assert.equal(node('.c2-descend').hidden,false,'down remains available through other actions');
game.act('down');
assert.equal(game.state().standing,null);assert.equal(game.state().mode,null);
assert.equal(node('.c2-descend').hidden,true);
game.act('climb-wide');before={...game.state().s.boxes.wide};yaw=game.state().camera.yaw;
drag('wide',180,390,225,395);
assert.deepEqual(game.state().s.boxes.wide,before,'standing prevents moving your support');
assert.equal(game.state().camera.yaw,yaw);
game.act('down');game.act('move-wide');game.act('move-view');
drag('wide',180,390,225,395);
assert.notEqual(game.state().camera.yaw,yaw,'explicit viewpoint control remains available');
assert.deepEqual(game.state().s.boxes.wide,before);
console.log('PASS: direct crate drag, empty-space orbit during move, no accidental drops, persistent descent, standing guard, viewpoint button');
