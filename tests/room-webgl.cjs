const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../room-webgl.js');
assert.deepEqual(R.layers('linear-gradient(90deg,rgba(0,0,0,.5),transparent), url("wall.webp")'),['linear-gradient(90deg,rgba(0,0,0,.5),transparent)','url("wall.webp")']);
// Run the actual renderer with a small GL/DOM fixture. A transformed parent must
// update GPU vertices without replacing the interactive DOM or puzzle state.
let next=0,frames=new Map(),vertices=[],deleted=0,lost=0;const handlers={};
const gl=new Proxy({COMPILE_STATUS:1,LINK_STATUS:2,ARRAY_BUFFER:3,FLOAT:4,
 getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:()=>1,getUniformLocation:()=>1,
 bufferData(_,v){vertices.push([...v]);},getExtension:()=>({loseContext(){lost++;}}),deleteTexture(){deleted++;}},
 {get(t,k){return k in t?t[k]:(()=>({}));}});
class Matrix{
 constructor(v){this.x=0;this.y=0;this.z=0;if(v?.startsWith('translation:'))[this.x,this.y,this.z]=v.slice(12).split(',').map(Number);}
 translate(x=0,y=0,z=0){const n=new Matrix();n.x=this.x+x;n.y=this.y+y;n.z=this.z+z;return n;}
 multiply(m){return this.translate(m.x,m.y,m.z);}rotate(){return this;}scale(){return this;}
 transformPoint(p){return {x:p.x+this.x,y:p.y+this.y,z:p.z+this.z};}toFloat32Array(){return new Float32Array(16);}
}
const classes=()=>{const s=new Set();return {add:x=>s.add(x),remove:x=>s.delete(x),contains:x=>s.has(x)};};
const css={backgroundImage:'none',backgroundColor:'#52676c',backgroundSize:'100px',backgroundPosition:'0% 0%',filter:'none',transform:'none',transformOrigin:'0px 0px',translate:'none',rotate:'none',scale:'none',display:'block',visibility:'visible'};
const stage={isConnected:true,clientWidth:600,clientHeight:800,dataset:{},style:{perspective:'300px'},classList:classes(),prepend(){}};
const world={parentElement:stage,css:{...css,transform:'translation:0,0,300'}};
const crate={parentElement:world,offsetParent:world,offsetLeft:0,offsetTop:0,css:{...css,transform:'translation:10,50,-100'}};
const face={parentElement:crate,offsetParent:crate,offsetLeft:0,offsetTop:0,offsetWidth:118,offsetHeight:62,classList:classes(),css:{...css}};
world.querySelectorAll=()=>[face];
const canvas={className:'',dataset:{},setAttribute(){},getContext:()=>gl,addEventListener:(k,f)=>handlers[k]=f,removeEventListener:k=>delete handlers[k],remove(){this.removed=true;}};
const context={window:{devicePixelRatio:1},DOMMatrix:Matrix,Image:class{},Float32Array,Map,Set,Math,Number,
 getComputedStyle:e=>e.css,requestAnimationFrame:f=>{frames.set(++next,f);return next;},cancelAnimationFrame:n=>frames.delete(n),
 document:{hidden:false,addEventListener(){},createElement(tag){return tag==='canvas'?{...canvas}:{};}}};
// Material painting uses a separate 2D canvas; the first canvas is the GL one.
let count=0;context.document.createElement=()=>++count===1?canvas:{width:0,height:0,getContext:()=>({scale(){},fillRect(){},set fillStyle(v){}})};
vm.runInNewContext(fs.readFileSync(require.resolve('../room-webgl.js'),'utf8'),context);
const view=context.window.B0RoomWebGL.create(stage,world);
function tick(t){const q=[...frames.values()];frames.clear();q.forEach(f=>f(t));}
tick(100);assert.ok(stage.classList.contains('room-webgl-active'));assert.ok(face.classList.contains('room-gpu-surface'));assert.deepEqual(vertices.at(-1).slice(0,3),[10,50,-100]);
crate.css.transform='translation:75,10,-190';crate.css.translate='25px 0px -15px';view.sync();
assert.deepEqual(vertices.at(-1).slice(0,3),[100,10,-205],'nested surface transforms and independent offsets share GPU coordinates');
world.css.transform='translation:90,-15,410';stage.style.perspective='410px';context.window.B0RoomWebGL.sync(world);
assert.equal(canvas.dataset.worldMatrix,world.css.transform,'the GPU receives the camera before a second animation frame');
assert.equal(canvas.dataset.focal,'410','zoom uses the same focal length immediately');
const draws=vertices.length;face.hidden=true;view.sync();assert.equal(vertices.length,draws,'hidden puzzle surfaces do not remain in the GPU scene');face.hidden=false;
handlers.webglcontextlost({preventDefault(){}});assert.equal(stage.dataset.renderer,'css-fallback');assert.ok(!face.classList.contains('room-gpu-surface'),'context loss restores the original CSS artwork and hit targets');assert.equal(lost,1);assert.equal(deleted,1);assert.equal(frames.size,0);view.dispose();assert.equal(lost,1,'cleanup is idempotent');
console.log('PASS: nested surface geometry, shared camera, transformed parents, visibility, context fallback and GPU cleanup');
