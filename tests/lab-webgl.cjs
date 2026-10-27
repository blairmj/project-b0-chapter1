const assert=require('node:assert/strict');
const R=require('../lab-webgl.js'),M=require('../lab-navigation-model.js');
const scene=R.buildScene(M.doors),width=676,height=829,focal=Math.min(width*.65,height*.6);
function hit(camera,x=width/2,y=height/2){
  const ray=R.ray({height:0,zoom:1,pitch:-3,...camera},x,y,width,height,focal);
  let result=null,distance=Infinity;
  for(const face of scene.faces){const d=R.intersect(ray,face.a,face.b,face.c)??R.intersect(ray,face.a,face.c,face.d);if(d!==null&&d<distance){distance=d;result=face;}}
  return result;
}
for(const [id,camera] of Object.entries({practice:{x:0,z:80,yaw:180},education:{x:0,z:-320,yaw:-90},storage:{x:0,z:-320,yaw:90},access:{x:0,z:-950,yaw:-90},mirror:{x:0,z:-1320,yaw:90},central:{x:0,z:-2370,yaw:0,height:360}})){
  assert.equal(hit(camera).id,id,`${id}: the rendered doorway and picking ray must agree`);
}
assert.equal(hit({x:0,z:80,yaw:0,pitch:-4},width/2,height-25).surface,'floor','the near floor is available for click-to-walk');
assert.equal(hit({x:0,z:20,yaw:90}).id,null,'a solid wall cannot select a room on the other side');
for(const yaw of [-135,-90,-45,0,45,90,135,180]){
  for(const pitch of [-30,0,35])assert.ok(hit({x:80,z:-800,yaw,pitch}),'every view inside the corridor must hit connected architecture');
}
assert.ok(scene.faces.some(f=>f.id==='stairs'),'stairs share the same mesh and picking system');
assert.equal(M.doors.practice.name,'출입 관리실');assert.equal(M.doors.access.name,'기록 보관실');
assert.ok(scene.signs.some(s=>s.label==='기록 보관실'));
assert.ok(scene.data.every(Number.isFinite),'mesh positions, normals and UVs must remain finite');
console.log('PASS: WebGL camera/picking alignment, every doorway, continuous corridor faces, floor movement ray, stair geometry and consistent room names');

// An opened native door must expose actual depth, not an opaque backing face.
for(const [id,camera] of Object.entries({storage:{x:0,z:-320,yaw:90},access:{x:0,z:-950,yaw:-90},central:{x:0,z:-2370,yaw:0,height:360}})){
 const depths=[];
 for(const progress of [0,.5,1]){
  const faces=[],target={quad(a,b,c,d,m){faces.push({a,b,c,d,m});}};
  R.doorway(target,id,M.doors[id],progress);
  const ray=R.ray({height:0,pitch:0,...camera},width/2,height/2,width,height,focal);
  let distance=Infinity,material;
  for(const f of faces){const t=R.intersect(ray,f.a,f.b,f.c)??R.intersect(ray,f.a,f.c,f.d);if(t!==null&&t<distance){distance=t;material=f.m;}}
  depths.push(distance);if(progress===1)assert.ok(material.kind===5||material.glow===1,`${id}: open doorway shows room material or an interior light`);
 }
 assert.ok(depths[2]>depths[0]+300,`${id}: walking through the opening has real depth`);
 const fixed=R.buildScene(M.doors,{dynamicDoors:true});
 const ray=R.ray({height:0,pitch:0,...camera},width/2,height/2,width,height,focal);
 assert.ok(!fixed.faces.filter(f=>f.id===id).some(f=>(R.intersect(ray,f.a,f.b,f.c)??R.intersect(ray,f.a,f.c,f.d))!==null),'fixed frames leave a clear aperture');
}
console.log('PASS: pocket doors expose room geometry and have no opaque fixed backing');
