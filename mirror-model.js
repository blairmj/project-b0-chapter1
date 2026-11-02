(function(root){
  'use strict';
  const symbols=['circle','triangle','square'];
  const directions=['down','up'],stops=['once','door','crossing','signal'];
  const emptyDraft=()=>({target:null,direction:null,stop:null});
  const objects=['door','own','glass','panel','robot','vent','entry',...symbols];
  const fresh=()=>({version:1,phase:'approach',line:0,holding:null,active:null,last:null,own:0,lights:false,vent:false,seen:{},observations:{seen:{},last:''},draft:emptyDraft(),instruction:null,sequence:0,logs:[]});
  const solved=s=>['unlocked','reunited','complete'].includes(s.phase);
  function log(s,action,target,verb,detail={}){s.logs.push({action,target,verb,time:new Date().toISOString(),...detail});s.logs=s.logs.slice(-100);}
  function inspect(s,id){if(!objects.includes(id))return false;s.seen[id]=true;log(s,'inspect',id,undefined,{instructionId:s.sequence});return true;}
  function effect(s,id,on){if(id==='circle')s.lights=on;if(id==='square')s.vent=on;}
  function release(s,id=s.holding||s.active,reason='manual'){
    if(!id||!symbols.includes(id))return false;
    if(s.holding!==id&&s.active!==id)return false;
    effect(s,id,false);s.holding=null;s.active=null;log(s,'release',id);if(s.instruction?.target===id){log(s,'instruction-end',id,undefined,{instructionId:s.instruction.id,event:reason});s.instruction=null;}return true;
  }
  function check(s){if(s.phase==='split'&&s.holding==='triangle'&&s.instruction?.direction!=='up'&&s.own>=.86){s.phase='unlocked';s.own=1;log(s,'unlock','door',undefined,{instructionId:s.sequence});return true;}return false;}
  function command(s,id,verb){
    if(!['split','unlocked'].includes(s.phase)||!symbols.includes(id)||!['down','up','hold','release'].includes(verb))return false;
    s.last={target:id,verb};log(s,'request',id,verb);
    if(verb==='release')return release(s,id)?'released':'not-held';
    release(s);if(verb==='up')return 'raised';
    s.active=id;s.holding=verb==='hold'?id:null;effect(s,id,true);check(s);return verb==='hold'?'holding':'momentary';
  }
  function setOwn(s,value){if(s.phase!=='split')return false;s.own=Math.max(0,Math.min(1,Number(value)||0));return check(s);}
  function draft(raw){return {target:symbols.includes(raw?.target)?raw.target:null,direction:directions.includes(raw?.direction)?raw.direction:null,stop:stops.includes(raw?.stop)?raw.stop:null};}
  function setDraft(s,field,value){const choices={target:symbols,direction:directions,stop:stops};if(!choices[field]?.includes(value))return false;s.draft=draft(s.draft);const previous=s.draft[field];s.draft[field]=value;if(previous!==value)log(s,'plan-change',s.draft.target,undefined,{field,value,previous,afterInstruction:s.sequence});return true;}
  function ready(plan){const p=draft(plan);return !!(p.target&&p.direction&&p.stop);}
  function describe(plan){const p=draft(plan);if(!ready(p))return '대상, 움직임, 놓을 때를 직접 골라 주세요.';const direction=p.direction==='down'?'아래로':'위로';return `${names[p.target]} 손잡이를 ${direction}${p.stop==='once'?' 한 번 움직이고 놓겠습니다.':` 움직여 ${stopNames[p.stop]} 잡고 있겠습니다.`}`;}
  const stopNames={door:'문이 열릴 때까지',crossing:'문턱을 지나갈 때까지',signal:'놓으라는 신호를 받을 때까지'};
  function execute(s,plan=s.draft){
    if(!ready(plan)||!['split','unlocked'].includes(s.phase))return false;
    const p=draft(plan),verb=p.direction==='down'?(p.stop==='once'?'down':'hold'):'up';
    const result=command(s,p.target,verb);if(!result)return false;
    s.sequence=(Number.isInteger(s.sequence)?s.sequence:0)+1;s.instruction={...p,id:s.sequence};
    if(p.direction==='up'&&p.stop!=='once'){s.holding=p.target;s.active=null;}
    log(s,'instruction-execute',p.target,verb,{instructionId:s.sequence,plan:{...p}});return result;
  }
  function trigger(s,event){const instruction=s.instruction;if(!instruction||instruction.stop!==event)return false;if(['door','crossing'].includes(event)&&!solved(s))return false;log(s,'condition-met',instruction.target,undefined,{instructionId:instruction.id,event});if(!release(s,instruction.target,event)){log(s,'instruction-end',instruction.target,undefined,{instructionId:instruction.id,event});s.instruction=null;}return true;}
  function join(s){if(s.phase!=='unlocked')return false;release(s);s.phase='reunited';log(s,'reunite','robot');return true;}
  function finish(s){if(s.phase!=='reunited')return false;s.phase='complete';log(s,'leave-together','door');return true;}
  function reply(s,topic){
    if(topic==='see')return '제 쪽 벽에는 모양이 다른 손잡이가 세 개 있습니다. 여기서는 제가 움직일 수 있습니다.';
    if(topic==='last'){
      if(s.instruction)return describe(s.instruction);
      if(s.holding)return `${names[s.holding]} 손잡이를 내린 채 잡고 있습니다.`;
      if(s.last?.verb==='down')return `${names[s.last.target]} 손잡이를 내렸다가 놓았습니다.`;
      if(s.last?.verb==='up')return `${names[s.last.target]} 손잡이를 위로 올렸습니다.`;
      return s.last?'요청하신 손잡이에서 손을 놓았습니다.':'아직 손잡이는 움직이지 않았습니다.';
    }
    return '어느 물건을 어떻게 움직일까요? 가리켜 주시면 확인하겠습니다.';
  }
  const names={circle:'원 표시',triangle:'삼각형 표시',square:'사각형 표시'};
  function restore(raw){
    const s=fresh();if(!raw||raw.version!==1)return s;
    s.phase=['approach','split','unlocked','reunited','complete'].includes(raw.phase)?raw.phase:'approach';
    s.line=Math.max(0,Math.min(5,Math.floor(Number(raw.line)||0)));
    s.holding=['split','unlocked'].includes(s.phase)&&symbols.includes(raw.holding)?raw.holding:null;
    s.draft=draft(raw.draft);s.sequence=Number.isInteger(raw.sequence)&&raw.sequence>=0?raw.sequence:0;
    if(ready(raw.instruction)&&raw.instruction.stop!=='once'&&s.holding===raw.instruction.target&&['split','unlocked'].includes(s.phase))s.instruction={...draft(raw.instruction),id:s.sequence};
    s.active=s.instruction?.direction==='up'?null:s.holding; // A momentary movement or a player's hand never resumes by itself.
    s.own=solved(s)?1:0;s.lights=s.active==='circle';s.vent=s.active==='square';
    if(raw.last&&symbols.includes(raw.last.target)&&['down','up','hold','release'].includes(raw.last.verb))s.last={target:raw.last.target,verb:raw.last.verb};
    for(const id of objects)if(raw.seen?.[id]===true)s.seen[id]=true;
    s.logs=Array.isArray(raw.logs)?raw.logs.filter(x=>x&&typeof x.action==='string').slice(-100):[];if(raw.observations&&typeof raw.observations==='object')s.observations={seen:{...raw.observations.seen},last:raw.observations.last};return s;
  }
  const api={fresh,solved,inspect,release,command,setOwn,join,finish,reply,restore,names,symbols,setDraft,ready,describe,execute,trigger};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0Mirror=api;
})(typeof window!=='undefined'?window:globalThis);
