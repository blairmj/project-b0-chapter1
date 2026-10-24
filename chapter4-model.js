(function(root){
  'use strict';
  const fresh=()=>({version:1,phase:'intro',line:0,met:false,boss:false,evidence:false,range:[40,60],links:{support:true,exit:true,robot:true},cover:false,opened:false,seen:{},logs:[]});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  function restore(raw){const s=fresh();if(!raw||raw.version!==1)return s;
    for(const k of ['met','boss','evidence','cover','opened'])s[k]=raw[k]===true;
    if(['intro','room','farewell','ending','complete'].includes(raw.phase))s.phase=raw.phase;
    s.line=Math.max(0,Math.floor(Number(raw.line)||0));
    if(Array.isArray(raw.range)&&raw.range.length===2)s.range=raw.range.map(v=>clamp(v,0,100)).sort((a,b)=>a-b);
    if(s.evidence&&raw.links)for(const k of Object.keys(s.links))s.links[k]=raw.links[k]!==false;
    s.boss=s.boss||s.evidence;s.met=s.met||s.boss;
    s.opened=s.opened&&s.evidence&&!s.links.exit&&!s.links.robot;
    if(['farewell','ending','complete'].includes(s.phase)&&!s.opened){s.phase='room';s.line=0;}
    s.seen=raw.seen&&typeof raw.seen==='object'?{...raw.seen}:{};
    s.logs=Array.isArray(raw.logs)?raw.logs.slice(-80):[];return s;
  }
  function log(s,action,value){s.logs.push({action,value});s.logs=s.logs.slice(-80);}
  function submit(s){if(!s.boss)return false;const ok=s.range[0]<=15&&s.range[1]>=85;log(s,'record',s.range.slice());if(ok)s.evidence=true;return ok;}
  function connect(s,id,on){if(!s.evidence||!(id in s.links))return false;s.links[id]=!!on;log(s,'permission',{id,on:!!on});return true;}
  const ready=s=>s.evidence&&!s.links.exit&&!s.links.robot;
  function tick(s,runtime,dt){if(s.opened)return;if(!ready(s)||runtime.handle<.85){runtime.latch=0;return;}runtime.latch=clamp(runtime.latch+Math.min(100,Math.max(0,dt))/5200,0,1);if(runtime.latch>=1){s.opened=true;log(s,'door','verified-open');}}
  const release=(s,r)=>{r.handle=0;if(!s.opened)r.latch=0;};
  function leave(s){if(!s.opened||s.links.robot)return false;s.phase='farewell';s.line=0;return true;}
  const api={fresh,restore,submit,connect,ready,tick,release,leave,log};
  if(typeof module!=='undefined')module.exports=api;else root.B0Final=api;
})(typeof window!=='undefined'?window:globalThis);
