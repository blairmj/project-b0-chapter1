(function(root){
  'use strict';
  const phases=['intro','ready','aim','defeated','card','released'];
  const fresh=()=>({version:1,phase:'intro',line:0,hits:0,angle:0,deployed:false,trials:0,misses:0,memoryRead:false,cardTaken:false,released:false,logs:[]});
  const clamp=v=>Math.max(-60,Math.min(60,Math.round((Number(v)||0)/15)*15));
  function log(s,action,value){s.logs.push({at:new Date().toISOString(),action,value});s.logs=s.logs.slice(-100);}
  function restore(raw){
    const s=fresh();if(raw?.version!==1)return s;
    s.hits=Math.max(0,Math.min(2,Math.trunc(Number(raw.hits)||0)));
    s.angle=clamp(raw.angle);s.line=Math.max(0,Math.min(3,Math.trunc(Number(raw.line)||0)));
    s.trials=Math.max(s.hits,Math.trunc(Number(raw.trials)||0));s.misses=Math.max(0,s.trials-s.hits);
    s.memoryRead=raw.memoryRead===true;s.cardTaken=s.hits===2&&raw.cardTaken===true;s.released=s.cardTaken&&raw.released===true;
    s.phase=s.released?'released':s.cardTaken?'card':s.hits===2?'defeated':raw.phase==='intro'?'intro':'ready';
    s.logs=Array.isArray(raw.logs)?raw.logs.slice(-100):[];
    return s; // A saved reflector is owned, but is not still being held after a reload.
  }
  function advance(s){if(s.phase!=='intro')return false;if(s.line<3)s.line++;else s.phase='ready';return true;}
  function deploy(s){if(!['ready','aim'].includes(s.phase))return false;s.deployed=true;s.phase='aim';log(s,'reflector-raised');return true;}
  function adjust(s,delta){if(s.phase!=='aim'||!s.deployed||![-15,15].includes(delta))return false;const angle=clamp(s.angle+delta);if(angle===s.angle)return false;s.angle=angle;log(s,'reflector-angle',angle);return true;}
  function trace(s){
    const mirror={x:500,y:455},source={x:s.hits===0?235:765,y:302},target={x:500,y:215},rad=s.angle*Math.PI/180;
    const length=Math.hypot(mirror.x-source.x,mirror.y-source.y),d={x:(mirror.x-source.x)/length,y:(mirror.y-source.y)/length},t={x:Math.cos(rad),y:Math.sin(rad)},dot=d.x*t.x+d.y*t.y;
    const out={x:2*dot*t.x-d.x,y:2*dot*t.y-d.y},to={x:target.x-mirror.x,y:target.y-mirror.y},along=to.x*out.x+to.y*out.y,off=Math.abs(to.x*out.y-to.y*out.x);
    let distance=Infinity;
    for(const [axis,low,high] of [['x',25,975],['y',55,550]])for(const edge of [low,high]){const k=(edge-mirror[axis])/out[axis];if(k>.001)distance=Math.min(distance,k);}
    const hit=along>0&&along<distance&&off<=22;
    const end=hit?{...target}:{x:mirror.x+out.x*distance,y:mirror.y+out.y*distance};
    return {source,mirror,target,end,hit,angle:s.angle,side:s.hits===0?'left':'right'};
  }
  function strike(s){if(s.phase!=='aim'||!s.deployed)return null;const result=trace(s);s.trials++;if(result.hit)s.hits++;else s.misses++;log(s,'reflected-attack',{side:result.side,angle:s.angle,hit:result.hit});if(s.hits===2){s.phase='defeated';s.deployed=false;log(s,'axiom-disabled');}return result;}
  function readMemory(s,owned){if(!owned||s.phase==='intro'||s.released)return false;s.memoryRead=true;log(s,'record-memory-read');return true;}
  function takeCard(s){if(s.phase!=='defeated'||s.hits!==2||s.cardTaken)return false;s.cardTaken=true;s.phase='card';log(s,'release-card-taken');return true;}
  function release(s){if(s.phase!=='card'||!s.cardTaken||s.hits!==2)return false;s.released=true;s.phase='released';log(s,'release-card-used','B-0');return true;}
  const api={fresh,restore,advance,deploy,adjust,trace,strike,readMemory,takeCard,release,phases};
  if(typeof module!=='undefined')module.exports=api;else root.B0CardBoss=api;
})(typeof window!=='undefined'?window:globalThis);
