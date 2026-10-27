/* Spatial rules are shared by the browser and the regression tests. No network AI. */
(function(root){
  'use strict';
  const sizes={wide:{w:118,d:92,h:62,name:'넓은 상자'},small:{w:76,d:68,h:56,name:'작은 상자'}};
  const fresh=()=>({version:1,boxes:{wide:{x:-175,z:-60,on:null},small:{x:160,z:125,on:null}},assisted:null,ventOpen:false,fakeWindowOpen:false,cabinetOpen:false,windowOpen:false,phase:'room',completed:false,hint:0,observations:{seen:{},last:''},logs:[]});
  const other=id=>id==='wide'?'small':'wide';
  function top(s,id){return sizes[id].h+(s.boxes[id].on?sizes[s.boxes[id].on].h:0);}
  function position(s,id){return s.boxes[id].on?s.boxes[s.boxes[id].on]:s.boxes[id];}
  function destination(s,id,x,z,support=null){
    if(!sizes[id]||!Number.isFinite(x)||!Number.isFinite(z))return {ok:false,reason:'놓을 위치를 선택해 주세요.'};
    const b=s.boxes[id],o=other(id),size=sizes[id];
    if(s.boxes[o].on===id)return {ok:false,reason:'위에 놓인 상자를 먼저 내려야 합니다.'};
    if(s.assisted&&(s.assisted===id||s.boxes[s.assisted].on===id))return {ok:false,reason:'먼저 바닥으로 내려온 뒤 옮길 수 있습니다.'};
    if(support){
      if(support!==o||s.boxes[o].on)return {ok:false,reason:'그 위에는 놓을 수 없습니다.'};
      if(size.w>sizes[o].w||size.d>sizes[o].d)return {ok:false,reason:'받치는 면보다 상자가 큽니다. 바닥에 다시 놓을 수 있습니다.'};
      const p=s.boxes[o];return {ok:true,x:p.x,z:p.z,on:o};
    }
    x=Math.max(-285+size.w/2,Math.min(285-size.w/2,x));
    z=Math.max(-285+size.d/2,Math.min(245-size.d/2,z));
    const p=position(s,o);
    if(Math.abs(x-p.x)<(size.w+sizes[o].w)/2+12&&Math.abs(z-p.z)<(size.d+sizes[o].d)/2+12)return {ok:false,reason:'다른 상자와 겹칩니다. 빈 바닥이나 상자 윗면을 선택해 주세요.'};
    // Keep the cabinet footprint solid. This is collision, not a prescribed solution slot.
    if(x+size.w/2>195&&z+size.d/2>175)return {ok:false,reason:'보관장이 있는 자리에는 놓을 수 없습니다.'};
    return {ok:true,x,z,on:null};
  }
  function move(s,id,x,z,support=null){const d=destination(s,id,x,z,support);if(d.ok){s.boxes[id]={x:d.x,z:d.z,on:d.on};s.logs.push({action:'move',id,x:d.x,z:d.z,on:d.on});}return d;}
  function nearWindow(s,id){const p=position(s,id);return Math.abs(p.x-105)<=90&&p.z<=-170;}
  function reach(s,id){
    if(!id||!sizes[id])return 'floor';
    if(!nearWindow(s,id))return 'far';
    if(top(s,id)<100)return 'low';
    return s.assisted===id?'ready':'needs-help';
  }
  function boost(s,id){if(reach(s,id)!=='needs-help')return false;s.assisted=id;s.logs.push({action:'boost-student',id});return true;}
  // The robot occupies a real footprint, including room for its hands. Keep its
  // billboard outside crate volumes at every camera angle, including drag previews.
  function robotSpot(s,preferred){
    const free=(x,z)=>Math.abs(x)<=230&&z>=-230&&z<=210&&!(x>135&&z>115)&&Object.keys(sizes).every(id=>{const p=position(s,id),b=sizes[id];return Math.abs(x-p.x)>=b.w/2+66||Math.abs(z-p.z)>=b.d/2+66;});
    if(free(preferred.x,preferred.z))return preferred;
    let best=null,distance=Infinity;
    for(let x=-230;x<=230;x+=20)for(let z=-230;z<=210;z+=20){const d=(x-preferred.x)**2+(z-preferred.z)**2;if(d<distance&&free(x,z)){best={x,z};distance=d;}}
    return best||{x:-230,z:210};
  }
  function openWindow(s,id){if(reach(s,id)!=='ready')return false;s.windowOpen=true;s.logs.push({action:'window'});return true;}
  function exit(s,id){if(!s.windowOpen||reach(s,id)!=='ready')return false;s.phase='ledge';s.logs.push({action:'climb-out'});return true;}
  function finish(s){if(s.phase!=='ledge')return false;s.phase='complete';s.completed=true;s.assisted=null;s.logs.push({action:'help-b0'});return true;}
  function restore(raw){
    const f=fresh();if(!raw||raw.version!==1)return f;
    for(const id of Object.keys(sizes)){const b=raw.boxes?.[id];if(!b||!Number.isFinite(b.x)||!Number.isFinite(b.z)||Math.abs(b.x)>300||Math.abs(b.z)>300)return f;f.boxes[id]={x:b.x,z:b.z,on:id==='small'&&b.on==='wide'?'wide':null};}
    // Repair old overlapping floor placements while preserving valid stacks/progress.
    if(!f.boxes.small.on&&!destination(f,'small',f.boxes.small.x,f.boxes.small.z).ok){
      outer:for(let x=-220;x<=220;x+=40)for(let z=-230;z<=190;z+=40){const d=destination(f,'small',x,z);if(d.ok){f.boxes.small={x:d.x,z:d.z,on:null};break outer;}}
    }
    for(const k of ['ventOpen','fakeWindowOpen','cabinetOpen','windowOpen'])f[k]=raw[k]===true;
    f.phase=['room','ledge','complete'].includes(raw.phase)?raw.phase:'room';f.completed=raw.completed===true||f.phase==='complete';
    f.hint=Math.max(0,Math.min(4,Number(raw.hint)||0));f.logs=Array.isArray(raw.logs)?raw.logs.slice(-100):[];
    if(raw.observations&&typeof raw.observations==='object')f.observations={seen:{...raw.observations.seen},last:raw.observations.last};return f;
  }
  const api={sizes,fresh,top,position,destination,move,nearWindow,reach,boost,robotSpot,openWindow,exit,finish,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0RoomTwo=api;
})(typeof window!=='undefined'?window:globalThis);
