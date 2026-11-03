(function(root){
  'use strict';
  const key='project-b0-v4-preferences-v1';
  const addresses={owner:'주인님',friend:'친구',explorer:'탐험가'};
  const customName=raw=>typeof raw==='string'?raw.normalize('NFC').replace(/\s+/g,' ').trim():'';
  const validName=name=>name.length>0&&Array.from(name).length<=20&&!/[\u0000-\u001f\u007f]/.test(name);
  function hasFinal(name){const last=Array.from(name).at(-1)?.codePointAt(0);if(last>=0xac00&&last<=0xd7a3)return (last-0xac00)%28!==0;return '013678'.includes(Array.from(name).at(-1)||' ');}
  function create(storage){
    let value='friend',custom='';try{const raw=JSON.parse(storage?.getItem(key)),name=customName(raw?.customName);if(validName(name))custom=name;if(Object.hasOwn(addresses,raw?.address)||raw?.address==='custom'&&custom)value=raw.address;}catch{}
    const get=()=>({address:value,label:value==='custom'?custom:addresses[value],customName:custom});
    function persist(){let persisted=false;try{storage?.setItem(key,JSON.stringify({version:1,address:value,customName:custom}));persisted=!!storage;}catch{}return {...get(),persisted};}
    function set(address){if(!Object.hasOwn(addresses,address))return null;value=address;return persist();}
    function setCustom(raw){const name=customName(raw);if(!validName(name))return null;custom=name;value='custom';return persist();}
    function robotText(text){text=String(text);if(value==='owner')return text;const label=get().label,final=hasFinal(label),particles={이:final?'이':'가',을:final?'을':'를',은:final?'은':'는',과:final?'과':'와',께:'에게'};return text.replace(/주인님(이|을|은|과|께)?/g,(_,particle)=>label+(particles[particle]||''));}
    return {get,set,setCustom,robotText};
  }
  let storage;try{storage=root.localStorage;}catch{}
  const api={...create(storage),create,addresses,key};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0Preferences=api;
})(typeof window!=='undefined'?window:globalThis);
