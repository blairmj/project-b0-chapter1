(function(root){
  'use strict';
  const key='project-b0-preferences-v1';
  const addresses={owner:'주인님',friend:'친구',explorer:'탐험가'};
  function create(storage){
    let value='owner';try{const raw=JSON.parse(storage?.getItem(key));if(Object.hasOwn(addresses,raw?.address))value=raw.address;}catch{}
    const get=()=>({address:value,label:addresses[value]});
    function set(address){if(!Object.hasOwn(addresses,address))return null;value=address;let persisted=false;try{storage?.setItem(key,JSON.stringify({version:1,address}));persisted=!!storage;}catch{}return {...get(),persisted};}
    function robotText(text){text=String(text);if(value==='owner')return text;const label=addresses[value];return text.replace(/주인님이/g,label+'가').replace(/주인님을/g,label+'를').replace(/주인님은/g,label+'는').replace(/주인님과/g,label+'와').replace(/주인님께/g,label+'에게').replace(/주인님/g,label);}
    return {get,set,robotText};
  }
  let storage;try{storage=root.localStorage;}catch{}
  const api={...create(storage),create,addresses,key};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0Preferences=api;
})(typeof window!=='undefined'?window:globalThis);
