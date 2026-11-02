(function(root){
  'use strict';
  const key='project-b0-v3-command-notebook-v1';
  const fresh=()=>({version:1,learning:{},history:[]});
  function restore(raw){const s=fresh();if(raw?.version!==1)return s;s.learning={...raw.learning};s.history=Array.isArray(raw.history)?raw.history.slice(-40):[];return s;}
  function calculate(rule){
    if(rule==='multiply-first')return {first:'multiply',middle:6,answer:4,steps:['3 × 2 = 6','24 ÷ 6 = 4']};
    if(rule==='left-to-right')return {first:'divide',middle:8,answer:16,steps:['24 ÷ 3 = 8','8 × 2 = 16']};
    return null;
  }
  function cargoDestination(target,where){
    if(where==='wide-top'||where==='small-top')return {support:where.slice(0,-4)};
    return ({window:{x:105,z:-225},vent:{x:-160,z:-210},'fake-window':{x:210,z:-30},entry:{x:0,z:180},floor:{x:-150,z:20}})[where]||null;
  }
  function holdVerb(param,learning){if(param==='remembered')return learning.hold==='until-release'?'hold':null;return param==='until-release'?'hold':param==='once'?'down':null;}
  const api={key,fresh,restore,calculate,cargoDestination,holdVerb};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0CommandModel=api;
})(typeof window!=='undefined'?window:globalThis);
