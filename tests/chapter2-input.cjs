const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('../chapter2-model.js');
// Run the real input handlers with a minimal scene DOM; no test hooks ship in the game.
const nodes=new Map();
function node(key){
  if(!nodes.has(key))nodes.set(key,{style:{setProperty(key,value){this[key]=value;}},dataset:{},hidden:false,isConnected:true,
    clientWidth:616,clientHeight:500,innerHTML:'',textContent:'',
    classList:{toggle(){},add(){},remove(){}},querySelector:s=>node(key+s),
    setAttribute(name,value){this[name]=value;},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},removeEventListener(){},setPointerCapture(){},
    hasPointerCapture(){return true;},releasePointerCapture(){},
    getBoundingClientRect(){return {left:0,top:0,width:616,height:500};}});
  return nodes.get(key);
}
const app={querySelector:node,addEventListener(){},removeEventListener(){}};
const storage={getItem(){return null;},setItem(){}};
let frame=0,clock=0,reduceMotion=true;const frames=new Map();
const context={window:{B0RoomTwo:M,addEventListener(){},removeEventListener(){}},
  sessionStorage:storage,localStorage:storage,document:{elementFromPoint(){return null;}},
  performance:{now:()=>clock},requestAnimationFrame(fn){frames.set(++frame,fn);return frame;},
  matchMedia:()=>({matches:reduceMotion}),setTimeout:()=>0,clearTimeout(){},cancelAnimationFrame(id){frames.delete(id);}};
const source=fs.readFileSync(require.resolve('../chapter2.js'),'utf8').replace('return {dispose};',
  'return {act,pointerDown,pointerMove,pointerUp,cancelPointer,select,rescuePose,state:()=>({s,camera,standing,mode,selection,view:view(),travelling})};');
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
game.act('cancel');
const groundTransform=node('.c2-world').style.transform,groundCamera={...game.state().camera};
const placedBoxes=JSON.stringify(game.state().s.boxes),crateTransform=node('[data-object="wide"]').style.transform;
game.act('climb-wide');
assert.equal(game.state().camera.zoom,groundCamera.zoom,'climbing preserves zoom');
assert.equal(JSON.stringify(game.state().s.boxes),placedBoxes,'climb keeps both crate coordinates');
assert.equal(node('[data-object="wide"]').style.transform,crateTransform,'crate DOM transform stays fixed');
assert.equal(game.state().view.x,game.state().s.boxes.wide.x,'observer finishes directly over crate');
assert.equal(game.state().view.z,game.state().s.boxes.wide.z);
assert.equal(game.state().view.height,62);
assert.ok(game.state().camera.pitch<-40,'player can look down at their footing');
assert.equal(node('.c2-descend').hidden,false);
game.act('clear');game.act('robot');game.act('request-inspect');
assert.equal(node('.c2-descend').hidden,false,'down remains available through other actions');
game.act('down');
assert.equal(game.state().standing,null);assert.equal(game.state().mode,null);
assert.equal(node('.c2-descend').hidden,true);
assert.equal(node('.c2-world').style.transform,groundTransform,'descending restores the same view');
assert.equal(JSON.stringify(game.state().s.boxes),placedBoxes);
game.act('climb-wide');before={...game.state().s.boxes.wide};yaw=game.state().camera.yaw;
drag('wide',180,390,225,395);
assert.deepEqual(game.state().s.boxes.wide,before,'standing prevents moving your support');
assert.equal(game.state().camera.yaw,yaw);
game.act('down');game.act('move-wide');game.act('move-view');
drag('wide',180,390,225,395);
assert.notEqual(game.state().camera.yaw,yaw,'explicit viewpoint control remains available');
assert.deepEqual(game.state().s.boxes.wide,before);
game.act('cancel');game.act('vent');assert.equal(game.state().s.ventOpen,true);
// Finish a harmless tap to clear the previous drag's click suppression.
game.pointerDown(event(200,200,'vent'));game.pointerUp(event(200,200,'vent'));
node('.c2-stage').listeners.click({target:{closest:sel=>sel==='[data-object]'?{dataset:{object:'vent'}}:sel==='.c2-vent-lid'?{}:null}});
assert.equal(game.state().s.ventOpen,false,'clicking the open lid closes it directly');
game.act('fake-window');assert.equal(game.state().s.fakeWindowOpen,true);assert.equal(game.state().s.windowOpen,false);
const state=game.state().s;M.move(state,'wide',105,-220);M.move(state,'small',105,-220,'wide');
const stacked=JSON.stringify(state.boxes),stackCamera={...game.state().camera};
game.act('climb-small');assert.equal(JSON.stringify(state.boxes),stacked);
assert.equal(game.state().view.x,105);assert.equal(game.state().view.z,-220);assert.equal(game.state().view.height,118);
game.act('boost');
while(frames.size){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(1200);}
assert.equal(state.assisted,'small','B-0 lifts the student instead of grabbing a crate');
assert.equal(M.reach(state,'small'),'ready');
game.act('down');assert.equal(state.assisted,null);
game.act('climb-small');game.act('boost');
while(frames.size){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(1500);}
game.act('open-window');game.act('exit');
assert.equal(state.phase,'ledge');assert.equal(game.state().view.z,-286);assert.equal(game.state().view.height,200);
assert.ok(game.state().camera.pitch<-40,'from the sill the player looks DOWN into the existing room');
assert.equal(node('.c2-sill').hidden,false);assert.equal(JSON.stringify(state.boxes),stacked,'ledge view keeps the same room layout');
assert.equal(app.innerHTML.includes('c2-outside'),false,'corridor must not appear while B-0 is still below');
game.act('help-b0');while(frames.size){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(1600);}
assert.equal(state.phase,'complete');assert.ok(app.innerHTML.includes('c2-outside'),'corridor only after pulling B-0 up');
let lastLift=-1,lastApproach=-1;
for(let i=0;i<=100;i++){const pose=game.rescuePose(i/100);assert.ok(pose.lift>=lastLift&&pose.approach>=lastApproach);lastLift=pose.lift;lastApproach=pose.approach;}
assert.equal(game.rescuePose(.1).phase,'grip');assert.ok(game.rescuePose(.1).lift<10,'grip settles before body rises');
assert.equal(game.rescuePose(.4).phase,'pull');assert.equal(game.rescuePose(.9).phase,'climb');
assert.equal(game.rescuePose(.9).blend,1,'bent-elbow climbing pose as torso clears the sill');
assert.equal(game.rescuePose(1).lift,280,'B-0 reaches the sill, rather than stopping below it');
game.act('reset');reduceMotion=false;
const fixed=JSON.stringify(game.state().s.boxes);game.act('climb-wide');
assert.equal(game.state().view.x,0,'no instantaneous horizontal teleport at climb start');
let pending=frames.entries().next().value;frames.delete(pending[0]);clock=325;pending[1](clock);
assert.ok(game.state().view.x<0&&game.state().view.x>-175,'walks toward crate before rising');
assert.equal(game.state().view.height,0,'approach remains on floor');
while(frames.size){const [id,fn]=frames.entries().next().value;frames.delete(id);clock+=250;fn(clock);}
assert.equal(game.state().view.x,-175);assert.equal(game.state().view.z,-60);assert.equal(game.state().view.height,62);
assert.equal(JSON.stringify(game.state().s.boxes),fixed,'animation never moves the boxes');
console.log('PASS: direct drag/orbit, walk-climb camera above fixed crate, descent, lid, decoy, lift, look-down rescue, corridor after reunion');
