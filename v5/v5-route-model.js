(function(root){
  'use strict';
  const key='project-b0-v5-route-v1',steps=['practice','hall','education','reflection','stairs','central'],names={practice:'출입관리실',hall:'출입관리실 앞 복도',education:'교육관찰실',reflection:'거울관찰실',stairs:'2층으로 가는 계단 문',central:'2층 통제실'};
  const fresh=()=>({version:1,current:'practice',accessCard:false,used:{card:false,memory:false,reflector:false},visits:{},logs:[]});
  function facts(storage){const read=k=>{try{return JSON.parse(storage.getItem('project-b0-v5-'+k));}catch{return null;}};return {practice:read('firstperson-v4')?.phase==='escaped',memory:read('education-v1')?.memoryTaken===true,reflector:read('reflection-v1')?.taken===true,released:read('final-v2')?.battle?.released===true};}
  function restore(raw,f){const s=fresh();if(raw?.version===1){s.accessCard=raw.accessCard===true&&f.practice;for(const k of ['card','memory','reflector'])s.used[k]=raw.used?.[k]===true&&({card:s.accessCard,memory:f.memory,reflector:f.reflector})[k];s.visits={...raw.visits};s.logs=Array.isArray(raw.logs)?raw.logs.slice(-80):[];if(steps.includes(raw.current))s.current=raw.current;}if(!canEnter(s,s.current,f))s.current='practice';return s;}
  const opened=s=>Object.values(s.used).every(Boolean);
  function canEnter(s,id,f){return id==='practice'||id==='hall'&&f.practice||id==='education'&&s.accessCard||id==='reflection'&&s.accessCard&&f.memory||id==='stairs'&&s.accessCard&&f.memory&&f.reflector||id==='central'&&opened(s);}
  function enter(s,id,f){if(!canEnter(s,id,f))return false;s.current=id;s.visits[id]=(Number(s.visits[id])||0)+1;log(s,'enter',id);return true;}
  function log(s,action,value){s.logs.push({action,value,at:new Date().toISOString()});s.logs=s.logs.slice(-80);}
  function takeCard(s,f){if(!f.practice||s.accessCard)return false;s.accessCard=true;log(s,'reward','access-card');return true;}
  function use(s,item,f){if(!canEnter(s,'stairs',f)||!['card','memory','reflector'].includes(item)||s.used[item])return false;s.used[item]=true;log(s,'use',item);return true;}
  const api={key,steps,names,fresh,facts,restore,opened,canEnter,enter,takeCard,use};if(typeof module!=='undefined')module.exports=api;else root.B0V5Route=api;
})(typeof window!=='undefined'?window:globalThis);
