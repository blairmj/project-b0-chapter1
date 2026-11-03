(function(root){
  'use strict';
  const key='project-b0-reflection-v1',rad=Math.PI/180;
  const layout={source:{x:-2.6,z:2.5},heading:-90,mirrors:[{id:'a',x:-2.6,z:-.8,half:.7},{id:'b',x:1.7,z:-.8,half:.7}],receiver:{x:1.7,z:-3.78,r:.22,accept:{x:0,z:-1}},bound:4};
  const clampAngle=v=>Math.max(-75,Math.min(75,Math.round((Number(v)||0)/15)*15));
  const cross=(a,b)=>a.x*b.z-a.z*b.x;
  function trace(angles,scene=layout){
    let p={...scene.source},d={x:Math.cos(scene.heading*rad),z:Math.sin(scene.heading*rad)},last='';const segments=[],hits=[];
    for(let bounce=0;bounce<9;bounce++){
      let distance=Infinity,hit=null,normal=null;
      for(const m of scene.mirrors){if(m.id===last)continue;const angle=(angles[m.id]||0)*rad,t={x:Math.cos(angle),z:Math.sin(angle)},q={x:m.x-t.x*m.half,z:m.z-t.z*m.half},e={x:t.x*2*m.half,z:t.z*2*m.half},delta={x:q.x-p.x,z:q.z-p.z},den=cross(d,e);if(Math.abs(den)<1e-8)continue;const u=cross(delta,d)/den,v=cross(delta,e)/den;if(v>.001&&u>=0&&u<=1&&v<distance){distance=v;hit=m.id;normal={x:-t.z,z:t.x};}}
      for(const axis of ['x','z'])for(const side of [-1,1]){const v=(side*scene.bound-p[axis])/d[axis];if(v>.001&&v<distance){distance=v;hit='wall';normal={x:axis==='x'?1:0,z:axis==='z'?1:0};}}
      if(bounce>0){const delta={x:scene.source.x-p.x,z:scene.source.z-p.z},along=delta.x*d.x+delta.z*d.z,off=Math.abs(cross(delta,d));if(along>.001&&off<.14){const near=along-Math.sqrt(.14*.14-off*off);if(near>.001&&near<distance){distance=near;hit='source';}}}
      const target=scene.receiver,to={x:target.x-p.x,z:target.z-p.z},along=to.x*d.x+to.z*d.z,perp=Math.abs(cross(to,d));
      if(along>.001&&along<distance&&perp<=target.r){const received=!target.accept||d.x*target.accept.x+d.z*target.accept.z>.995;segments.push({from:{...p},to:{x:p.x+d.x*along,z:p.z+d.z*along},hit:received?'receiver':'receiver-edge'});return {segments,hits,received,end:received?'receiver':'receiver-edge'};}
      if(!Number.isFinite(distance))break;const end={x:p.x+d.x*distance,z:p.z+d.z*distance};segments.push({from:{...p},to:end,hit});hits.push(hit);if(hit==='source')return {segments,hits,received:false,end:'source'};const dot=d.x*normal.x+d.z*normal.z;d={x:d.x-2*dot*normal.x,z:d.z-2*dot*normal.z};p={x:end.x+d.x*.002,z:end.z+d.z*.002};last=hit==='wall'?'':hit;
    }return {segments,hits,received:false,end:hits.at(-1)||'wall'};
  }
  function bossLayout(){const turn=p=>({x:p.x*Math.cos(30*rad)-p.z*Math.sin(30*rad),z:p.x*Math.sin(30*rad)+p.z*Math.cos(30*rad)}),source=turn({x:-3,z:-2}),target=turn({x:3,z:-2}),length=Math.hypot(target.x,target.z);return {source,heading:Math.atan2(-source.z,-source.x)/rad,mirrors:[{id:'a',x:0,z:0,half:.8}],receiver:{...target,r:.24,accept:{x:target.x/length,z:target.z/length}},bound:4};}
  const bossTrace=angle=>trace({a:angle},bossLayout());
  function floorTarget(camera,sx,sy,width,height){
    if(!(width>0&&height>0))return null;const yaw=camera.yaw*rad,pitch=camera.pitch*rad,focal=height*.82*camera.zoom,u=(sx-width/2)/focal,v=(height/2-sy)/focal;
    const dy=Math.sin(pitch)+v*Math.cos(pitch);if(dy>=-.025)return null;const t=-1.48/dy,dx=Math.sin(yaw)*Math.cos(pitch)+u*Math.cos(yaw)-v*Math.sin(yaw)*Math.sin(pitch),dz=-Math.cos(yaw)*Math.cos(pitch)+u*Math.sin(yaw)+v*Math.cos(yaw)*Math.sin(pitch);
    return {x:Math.max(-3.72,Math.min(3.72,camera.x+dx*t)),z:Math.max(-3.72,Math.min(3.72,camera.z+dz*t))};
  }
  function moveCamera(from,to,angles,taken=false){
    const overlap=(x,z)=>{
      let amount=Math.max(0,Math.abs(x)-3.72,Math.abs(z)-3.72,.48-Math.hypot(x-layout.source.x,z-layout.source.z),.43-Math.hypot(x-.55,z-1.7));
      if(x>1.15&&x<2.25&&z< -3.34)amount=Math.max(amount,Math.min(x-1.15,2.25-x,-3.34-z));
      for(const m of layout.mirrors){if(taken&&m.id==='a')continue;const a=angles[m.id]*rad,dx=x-m.x,dz=z-m.z,along=Math.max(-m.half,Math.min(m.half,dx*Math.cos(a)+dz*Math.sin(a))),px=m.x+along*Math.cos(a),pz=m.z+along*Math.sin(a);amount=Math.max(amount,.24-Math.hypot(x-px,z-pz));}return amount;
    };
    const allowed=(x,z,p)=>{const next=overlap(x,z);return next<=1e-8||next<overlap(p.x,p.z)-1e-8;};
    let p={x:from.x,z:from.z};const dx=to.x-from.x,dz=to.z-from.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.06));
    for(let i=0;i<steps;i++){const nx=Math.max(-3.72,Math.min(3.72,p.x+dx/steps)),nz=Math.max(-3.72,Math.min(3.72,p.z+dz/steps));if(allowed(nx,nz,p))p={x:nx,z:nz};else{if(allowed(nx,p.z,p))p.x=nx;if(allowed(p.x,nz,p))p.z=nz;}}
    return p;
  }
  const fresh=()=>({version:1,phase:'intro',rotated:false,angles:{a:0,b:0},lit:false,solved:false,taken:false,inspected:[],prediction:'',trialSeq:0,totals:{predictions:0,singleChanges:0,multipleChanges:0},trials:[],logs:[]});
  function log(s,kind,data={}){s.logs.push({at:new Date().toISOString(),kind,...data});s.logs=s.logs.slice(-300);}
  function restore(raw){const s=fresh();if(!raw||raw.version!==1)return s;s.rotated=raw.rotated===true;s.angles={a:clampAngle(raw.angles?.a),b:clampAngle(raw.angles?.b)};s.inspected=Array.isArray(raw.inspected)?raw.inspected.filter(id=>['a','b','source','receiver','protocol'].includes(id)):[];s.logs=Array.isArray(raw.logs)?raw.logs.slice(-300):[];s.trials=Array.isArray(raw.trials)?raw.trials.filter(t=>Number.isInteger(t.id)&&typeof t.received==='boolean'&&t.angles&&Number.isFinite(t.angles.a)&&Number.isFinite(t.angles.b)).slice(-60):[];s.trialSeq=Math.max(Math.trunc(Number(raw.trialSeq)||0),...s.trials.map(t=>t.id));for(const [id,fn]of Object.entries({predictions:t=>!!t.prediction,singleChanges:t=>t.changes?.length===1,multipleChanges:t=>t.changes?.length>1})){const value=raw.totals?.[id];s.totals[id]=Number.isInteger(value)&&value>=0?Math.min(s.trialSeq,value):s.trials.filter(fn).length;}s.solved=raw.solved===true&&s.trials.some(t=>t.received);s.taken=s.solved&&raw.taken===true;s.phase=raw.phase==='complete'&&s.taken?'complete':s.rotated?'room':'intro';return s;}
  function rotate(s){if(s.rotated)return false;s.rotated=true;s.phase='room';log(s,'platform-rotated',{heading:layout.heading});return true;}
  function setAngle(s,id,value){if(!s.rotated||s.solved||!['a','b'].includes(id))return false;const angle=clampAngle(value);if(s.angles[id]===angle)return false;const from=s.angles[id];s.angles[id]=angle;s.lit=false;log(s,'angle-change',{target:id,from,to:angle});return true;}
  function inspect(s,id){if(!['a','b','source','receiver','protocol'].includes(id))return false;if(!s.inspected.includes(id))s.inspected.push(id);log(s,'inspect',{target:id});return true;}
  function predict(s,id){if(!['a','b','wall','receiver'].includes(id)||s.solved)return false;s.prediction=id;log(s,'prediction',{target:id});return true;}
  function test(s){if(!s.rotated||s.taken)return null;const result=trace(s.angles),previous=s.trials.at(-1),changes=previous?['a','b'].filter(id=>s.angles[id]!==previous.angles[id]):[];const trial={id:++s.trialSeq,angles:{...s.angles},prediction:s.prediction||null,received:result.received,firstHit:result.segments[0]?.hit||'wall',changes};if(trial.prediction)s.totals.predictions++;if(changes.length===1)s.totals.singleChanges++;if(changes.length>1)s.totals.multipleChanges++;s.trials.push(trial);s.trials=s.trials.slice(-60);s.lit=true;s.prediction='';if(result.received)s.solved=true;log(s,'trial',trial);return result;}
  function take(s){if(!s.solved||s.taken)return false;s.taken=true;s.lit=false;log(s,'reflector-acquired');return true;}
  function finish(s){if(!s.taken)return false;s.phase='complete';log(s,'leave');return true;}
  function summary(s){return {played:s.rotated,completed:s.phase==='complete',reflector:s.taken,trials:s.trialSeq,inspected:s.inspected.length,predictions:s.totals.predictions,singleChanges:s.totals.singleChanges,multipleChanges:s.totals.multipleChanges};}
  function session(storage){try{let id=storage.getItem('project-b0-play-id-v1');if(!id){id=root.crypto?.randomUUID?.()||'play-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);storage.setItem('project-b0-play-id-v1',id);}return id;}catch{return null;}}
  function capture(storage){try{const raw=JSON.parse(storage.getItem(key));if(!raw?.rotated)return null;const s=restore(raw),final=JSON.parse(storage.getItem('project-b0-final-v2'));return {playId:session(storage),reflection:summary(s),final:{played:final?.boss===true&&final?.optics?.enabled===true,trials:Math.max(0,Math.trunc(Number(final?.optics?.trials)||0)),severed:final?.optics?.cut===true}};}catch{return null;}}
  const api={key,layout,fresh,restore,rotate,setAngle,inspect,predict,test,take,finish,trace,bossLayout,bossTrace,clampAngle,summary,session,capture,floorTarget,moveCamera};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0Reflection=api;
})(typeof window!=='undefined'?window:globalThis);
