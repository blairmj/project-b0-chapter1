(function(root){
  'use strict';
  const fresh=()=>({version:2,phase:'intro',line:0,met:false,boss:false,bodyChecked:false,links:{robot:true},upper:false,holding:false,opened:false,seen:{},logs:[]});
  function restore(raw){const s=fresh();if(!raw||raw.version!==2)return s;
    for(const k of ['met','boss','bodyChecked','upper','opened'])s[k]=raw[k]===true;
    if(['intro','room','farewell','ending','complete'].includes(raw.phase))s.phase=raw.phase;
    s.line=Math.max(0,Math.floor(Number(raw.line)||0));s.links.robot=raw.links?.robot!==false;
    s.opened=s.opened&&s.upper&&!s.links.robot;
    if(['farewell','ending','complete'].includes(s.phase)&&!s.opened){s.phase='room';s.line=0;}
    // A saved request is not a maintained physical grip after a reload.
    s.holding=false;s.seen=raw.seen&&typeof raw.seen==='object'?{...raw.seen}:{};
    s.logs=Array.isArray(raw.logs)?raw.logs.slice(-80):[];return s;
  }
  function log(s,action,value){s.logs.push({action,value});s.logs=s.logs.slice(-80);}
  function connect(s,id,on){if(id!=='robot'||!s.boss||!s.bodyChecked||s.opened)return false;s.links.robot=!!on;if(on)s.holding=false;log(s,'remote-control',!!on);return true;}
  const ready=s=>s.boss&&!s.links.robot&&s.upper;
  function latch(s,r){if(!s.boss||s.links.robot||!r.lifted)return false;s.upper=true;log(s,'upper-bolt','manual');return true;}
  function hold(s,on){if(!s.boss||s.links.robot)return false;s.holding=!!on;log(s,'maintain-grip',!!on);return true;}
  function tick(s,r,dt){if(s.opened)return;if(!ready(s)||!s.holding||r.handle<.85||r.lifted){r.latch=0;return;}r.latch=Math.min(1,r.latch+Math.min(100,Math.max(0,dt))/5200);if(r.latch>=1){s.opened=true;log(s,'door','physically-latched-open');}}
  const release=(s,r)=>{r.handle=0;if(!s.opened)r.latch=0;};
  function leave(s){if(!s.opened||s.links.robot||s.holding)return false;s.phase='farewell';s.line=0;return true;}
  const api={fresh,restore,connect,ready,latch,hold,tick,release,leave,log};
  if(typeof module!=='undefined')module.exports=api;else root.B0Final=api;
})(typeof window!=='undefined'?window:globalThis);
