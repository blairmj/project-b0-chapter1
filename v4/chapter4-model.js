(function(root){
  'use strict';
  const fresh=()=>({version:2,phase:'intro',line:0,met:false,boss:false,bodyChecked:false,restored:false,links:{robot:true},upper:false,holding:false,opened:false,seen:{},observations:{seen:{},last:''},logs:[]});
  function restore(raw){const s=fresh();if(!raw||raw.version!==2)return s;
    for(const k of ['met','boss','bodyChecked','restored','upper','opened'])s[k]=raw[k]===true;
    if(['intro','room','farewell','ending','complete'].includes(raw.phase))s.phase=raw.phase;
    s.line=Math.max(0,Math.floor(Number(raw.line)||0));s.links.robot=raw.links?.robot!==false;
    s.opened=s.opened&&s.upper&&!s.links.robot;
    if(['farewell','ending','complete'].includes(s.phase)&&!s.opened){s.phase='room';s.line=0;}
    // A saved request is not a maintained physical grip after a reload.
    s.holding=false;s.seen=raw.seen&&typeof raw.seen==='object'?{...raw.seen}:{};
    s.logs=Array.isArray(raw.logs)?raw.logs.slice(-80):[];if(raw.observations&&typeof raw.observations==='object')s.observations={seen:{...raw.observations.seen},last:raw.observations.last};
    if(raw.optics?.enabled)s.optics={enabled:true,angle:Math.max(-75,Math.min(75,Math.round((Number(raw.optics.angle)||0)/15)*15)),deployed:false,holding:false,cut:raw.optics.cut===true,trials:Math.max(0,Math.trunc(Number(raw.optics.trials)||0)),testedAngle:null};return s;
  }
  function arrive(raw){const s=restore(raw);if(['farewell','ending','complete'].includes(s.phase)){s.phase='room';s.line=0;}return s;}
  function log(s,action,value){s.logs.push({action,value});s.logs=s.logs.slice(-80);}
  function connect(s,id,on){if(id!=='robot'||!s.boss||!s.bodyChecked||s.opened||s.optics?.enabled&&!s.optics.cut)return false;s.links.robot=!!on;if(on)s.holding=false;log(s,'remote-control',!!on);return true;}
  function enableOptics(s){if(s.opened||!s.links.robot||s.optics?.enabled)return false;s.optics={enabled:true,angle:-30,deployed:false,holding:false,cut:false,trials:0,testedAngle:null};return true;}
  function opticalResult(s){const O=root.B0Reflection||(typeof require==='function'?require('./reflection-model.js'):null);return O?.bossTrace(s.optics?.angle||0);}
  function opticalAdjust(s,delta){const o=s.optics;if(!o?.enabled||!s.boss||!s.links.robot||o.holding)return false;o.angle=Math.max(-75,Math.min(75,o.angle+delta));o.deployed=false;o.testedAngle=null;log(s,'reflector-angle',o.angle);return true;}
  function opticalProbe(s){const o=s.optics;if(!o?.enabled||!s.boss||!s.links.robot||o.holding)return null;const result=opticalResult(s);o.deployed=true;o.testedAngle=o.angle;o.trials++;log(s,'reflector-probe',{angle:o.angle,received:result.received});return result;}
  function opticalHold(s,on){const o=s.optics;if(!o?.enabled||!s.boss||!s.links.robot)return false;if(on&&(!o.deployed||o.testedAngle!==o.angle||!opticalResult(s)?.received))return false;o.holding=!!on;if(!on)o.deployed=false;log(s,'reflector-maintain',!!on);return true;}
  const opticalWindow=s=>!!(s.optics?.enabled&&s.optics.holding&&s.optics.deployed&&opticalResult(s)?.received);
  function backup(s){if(!s.boss||!s.bodyChecked||!s.links.robot||!opticalWindow(s)||s.restored)return false;s.restored=true;log(s,'original-records-restored','tablet');return true;}
  const canOpticalCut=s=>s.boss&&s.bodyChecked&&s.restored&&s.links.robot&&opticalWindow(s);
  function opticalCut(s){if(!canOpticalCut(s))return false;s.links.robot=false;s.optics.cut=true;s.optics.holding=s.optics.deployed=false;log(s,'optical-control-severed','B-0');return true;}
  const ready=s=>s.boss&&!s.links.robot&&s.upper;
  function latch(s,r){if(!s.boss||s.links.robot||!r.lifted)return false;s.upper=true;log(s,'upper-bolt','manual');return true;}
  function hold(s,on){if(!s.boss||s.links.robot)return false;s.holding=!!on;log(s,'maintain-grip',!!on);return true;}
  function tick(s,r,dt){if(s.opened)return;if(!ready(s)||!s.holding||r.handle<.85||r.lifted){r.latch=0;return;}r.latch=Math.min(1,r.latch+Math.min(100,Math.max(0,dt))/5200);if(r.latch>=1){s.opened=true;log(s,'door','physically-latched-open');}}
  const release=(s,r)=>{r.handle=0;if(!s.opened)r.latch=0;};
  function leave(s){if(!s.opened||s.links.robot||s.holding)return false;s.phase='farewell';s.line=0;return true;}
  const api={fresh,restore,arrive,connect,ready,latch,hold,tick,release,leave,log,enableOptics,opticalResult,opticalAdjust,opticalProbe,opticalHold,opticalWindow,canOpticalCut,opticalCut,backup};
  if(typeof module!=='undefined')module.exports=api;else root.B0Final=api;
})(typeof window!=='undefined'?window:globalThis);
