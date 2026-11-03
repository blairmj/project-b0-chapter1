(function(root){
  'use strict';
  const key='project-b0-v4-story-v1';
  const fresh=()=>({version:1,scene:0,method:'',answer:'',started:false,returned:false,physical:false,archive:{summary:false,original:false,verified:false},help:{},events:[]});
  function restore(raw){const s=fresh();if(raw?.version!==1)return s;s.scene=Math.max(0,Math.min(5,Math.trunc(Number(raw.scene)||0)));s.method=['picture','steps','together'].includes(raw.method)?raw.method:'';s.answer=['3','4','6'].includes(raw.answer)?raw.answer:'';for(const k of ['started','returned','physical'])s[k]=raw[k]===true;for(const k of Object.keys(s.archive))s.archive[k]=raw.archive?.[k]===true;s.help=raw.help&&typeof raw.help==='object'?Object.fromEntries(Object.entries(raw.help).filter(([k,v])=>['practice','education','storage','access','mirror','reflection','central','hall'].includes(k)&&Number.isInteger(v)&&v>=0&&v<=3)):{};s.events=Array.isArray(raw.events)?raw.events.slice(-150):[];return s;}
  function read(store){try{return restore(JSON.parse(store.getItem(key)));}catch{return fresh();}}
  function write(store,s){store.setItem(key,JSON.stringify(s));}
  function event(s,kind,detail={}){s.events.push({at:new Date().toISOString(),kind,...detail});s.events=s.events.slice(-150);}
  function help(s,room,level){if(!['practice','education','storage','access','mirror','reflection','central','hall'].includes(room))return;s.help[room]=Math.max(s.help[room]||0,Math.max(1,Math.min(3,level)));event(s,'help',{room,level:s.help[room]});}
  function compare(s,choice){if(!s.archive.summary||!s.archive.original)return 'read';if(choice!=='original'){event(s,'comparison-retry');return 'retry';}s.archive.verified=true;event(s,'archive-compared');return 'verified';}
  function capture(store){const s=read(store);return {gameVersion:'v4',prologue:s.started,archiveCompared:s.archive.verified,returned:s.returned,physical:s.physical,support:{...s.help}};}
  const api={key,fresh,restore,read,write,event,help,compare,capture};if(typeof module!=='undefined')module.exports=api;else root.B0V4Model=api;
})(typeof window!=='undefined'?window:globalThis);
