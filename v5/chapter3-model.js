(function(root){
  'use strict';
  const key='project-b0-v5-control-route-v2';
  const names={start:'출발',west:'서쪽 복도',maintenance:'정비 통로',gate:'인증 게이트',observation:'관측실',goal:'목적지'};
  const edges=[['start','west',4],['start','maintenance',3],['west','gate',2],['west','observation',6],['maintenance','gate',5],['maintenance','observation',4],['gate','goal',5],['observation','goal',3]];
  function paths(){const found=[];function visit(at,nodes,minutes){if(at==='goal'){found.push({id:nodes.join('-'),nodes,minutes});return;}for(const [from,to,time] of edges)if(from===at&&!nodes.includes(to))visit(to,[...nodes,to],minutes+time);}visit('start',['start'],0);return found;}
  const routes=paths(),label=p=>p.nodes.map(n=>names[n]).join(' → '),optimal=()=>Math.min(...routes.filter(p=>p.nodes.includes('gate')&&p.minutes<=12).map(p=>p.minutes));
  const fresh=()=>({version:2,policy:{requireGate:false,maxMinutes:12,fastest:true},recommendation:null,checked:{gate:false,time:false,optimal:false},feedbackCount:0,revision:0,complete:false,phase:'room',lastIssue:'',lessons:[],logs:[],chat:[]});
  function log(s,type,data){s.logs.push({type,data,at:new Date().toISOString()});s.logs=s.logs.slice(-120);}
  function say(s,who,text){s.chat.push({who,text});s.chat=s.chat.slice(-60);return text;}
  function current(s){return routes.find(p=>p.id===s.recommendation)||null;}
  function assess(p){return {gate:!!p?.nodes.includes('gate'),time:!!p&&p.minutes<=12,optimal:!!p&&p.nodes.includes('gate')&&p.minutes<=12&&p.minutes===optimal()};}
  function recommend(s){
    const available=routes.filter(p=>(!s.policy.requireGate||p.nodes.includes('gate'))&&p.minutes<=s.policy.maxMinutes);
    available.sort((a,b)=>a.minutes-b.minutes||a.id.localeCompare(b.id));s.recommendation=available[0]?.id||null;s.checked={gate:false,time:false,optimal:false};s.complete=false;
    log(s,'recommend',{policy:{...s.policy},route:s.recommendation});const p=current(s);
    return p?`${label(p)}, 총 ${p.minutes}분을 추천해요. ${s.policy.requireGate?'인증 게이트 통과를 필수로 넣고':'구간별로 걸리는 시간을 더해'} 이동 시간을 비교했어요.`:'지금 알려 준 조건으로는 가능한 경로가 없어요. 이동 제한이나 필수 통과 조건을 다시 살펴봐요.';
  }
  function teach(s,patch,source){const before=JSON.stringify(s.policy);Object.assign(s.policy,patch);if(before===JSON.stringify(s.policy))return false;s.feedbackCount++;s.revision++;s.lessons.push({revision:s.revision,source,criteria:{...s.policy}});s.lessons=s.lessons.slice(-40);log(s,'criteria-taught',s.lessons.at(-1));return true;}
  function verify(s,field){
    const p=current(s);if(!p)return '먼저 어떤 경로를 검토할지 저에게 찾아 달라고 말해 주세요.';
    const result=assess(p);if(!Object.hasOwn(result,field))return '인증 통과, 12분 제한, 최적 여부 중 무엇을 확인할지 알려 주세요.';
    s.checked[field]=result[field];s.lastIssue=result[field]?'':field;log(s,'verify',{field,passed:result[field],route:p.id});
    if(field==='gate')return result.gate?'이 경로에는 인증 게이트가 있어요. 필수 통과 조건을 만족해요.':'이 경로는 인증 게이트를 지나지 않아요. 짧아도 실제 이동 조건을 만족하지 못해요. 제 판단 기준에 어떤 조건을 넣어야 할까요?';
    if(field==='time')return result.time?`각 구간을 더하면 ${p.minutes}분이에요. 12분 이내예요.`:`각 구간을 더하면 ${p.minutes}분이에요. 제한 시간 12분을 넘어요.`;
    return result.optimal?`인증을 통과하는 경로는 11분과 13분이에요. 13분은 제한을 넘고, 이 ${p.minutes}분 경로가 조건을 만족하는 최단 경로예요.`:'시간만 가장 짧은 것과 필수 조건을 만족하며 가장 빠른 것은 달라요. 인증 게이트를 거치는 경로끼리 다시 비교해야 해요.';
  }
  function select(s,id){if(!routes.some(p=>p.id===id))return false;s.recommendation=id;s.checked={gate:false,time:false,optimal:false};s.complete=false;log(s,'candidate-selected',id);return true;}
  function begin(s){const r=assess(current(s)),bad=['gate','time','optimal'].find(k=>!r[k]);if(bad){s.lastIssue=bad;return {ok:false,text:verify(s,bad)};}if(current(s).minutes>s.policy.maxMinutes)return {ok:false,text:'제가 배운 시간 제한과도 맞는지 확인해 주세요. 더 짧은 제한을 알려 주었다면 그 기준을 다시 수정해야 해요.'};if(!s.feedbackCount||!s.policy.requireGate)return {ok:false,text:'제 판단 기준을 아직 고치지 않았어요. 인증 게이트를 반드시 거치도록 저에게 알려 주세요.'};if(!Object.values(s.checked).every(Boolean))return {ok:false,text:'새 경로를 다시 검증해 주세요. 인증 통과, 12분 제한, 최적 여부를 어떤 순서로든 확인할 수 있어요.'};s.phase='moving';log(s,'execute-route',{route:current(s).id,minutes:current(s).minutes,criteria:{...s.policy}});return {ok:true,text:`검증한 ${current(s).minutes}분 경로로 제가 이동을 실행할게요.`};}
  function finish(s){if(s.phase!=='moving'||!assess(current(s)).optimal||!Object.values(s.checked).every(Boolean))return false;s.complete=true;s.phase='complete';log(s,'arrival',s.recommendation);return true;}
  function parse(text,s){
    const t=String(text).normalize('NFKC').toLowerCase().replace(/[\s,.!?~·]/g,''),patch={};
    const gate=/(인증|인증문|게이트|권한확인|신원확인|검문)/.test(t),audit=/(통과했|지났|거쳤|거치는지|지나는지|통과하는지|포함했|포함돼|들어있|확인해|검증해|검토해|봐줘|맞는지)/.test(t)&&!/(반드시|필수|해야|빠졌|누락|빼먹)/.test(t);
    if((gate&&!audit)||s.lastIssue==='gate'&&/(그조건|그것|그부분|그것도|그것까지|빠진조건|말한조건)/.test(t)){const doubleNegative=/(안거치면안|안지나면안|없이는안|빼지마|빼면안|빠졌|누락|빼먹)/.test(t);if(doubleNegative||/(반드시|필수|꼭|거치|거쳐|통과|지나|들러|경유|넣어|포함|고려|반영|조건|빠뜨|놓쳤|없잖|없는데)/.test(t))patch.requireGate=true;if(!doubleNegative&&/(무시|안거쳐도|안지나도|안가도|통과하지마|지나지마|거치지않아도|지나지않아도|통과하지않아도|선택사항|안넣어도|빼도|필요없)/.test(t))patch.requireGate=false;}
    if(/모든조건|전체조건/.test(t)&&!/확인|검증|맞는지/.test(t))patch.requireGate=true;
    const time=t.match(/(\d{1,2}|열두|십이)분/);if(time&&/(이내|이하|넘지|안넘|넘기.*안|초과.*안|제한|안에|최대|까지|지켜)/.test(t)){const n=/열두|십이/.test(time[1])?12:Number(time[1]);if(n>0&&n<=60)patch.maxMinutes=n;}
    return {patch,execute:/(이동해|이동시작|실행해|출발해|그길로가|이경로로가|이대로가|가자)/.test(t),compare:/(모든경로|다른경로|비교|경로들|경우의수)/.test(t),basis:/(왜|근거|이유|기준|판단했|선택했|고른|어떻게계산|몇분|얼마나|총시간)/.test(t),verify:audit||/(검증|다시확인|조건.*맞|모두만족)/.test(t),gate,time:/(시간|12분|열두분|십이분)/.test(t),optimal:/(최적|가장빠른지|최단인지)/.test(t),search:/(찾|탐색|추천|가장빠|제일빠|최단|빨리|빠르게|목적지)/.test(t)};
  }
  function ask(s,text){
    text=String(text).trim().slice(0,600);if(!text)return {text:'궁금한 점이나 바꿀 조건을 알려 주세요.'};say(s,'student',text);log(s,'student-message',text);const intent=parse(text,s);let reply,execute=false;
    if(Object.keys(intent.patch).length){teach(s,intent.patch,text);reply='판단 기준을 반영해서 다시 탐색할게요. '+recommend(s);}
    else if(intent.execute){const r=begin(s);reply=r.text;execute=r.ok;}
    else if(intent.verify){const fields=intent.gate?['gate']:intent.time?['time']:intent.optimal?['optimal']:['gate','time','optimal'];reply=fields.map(f=>verify(s,f)).join(' ');}
    else if(intent.compare)reply=routes.map(p=>`${label(p)}: ${p.minutes}분${p.nodes.includes('gate')?' · 인증 통과':' · 인증 없음'}`).join('\n');
    else if(intent.basis&&current(s)){const p=current(s);reply=`${p.nodes.slice(0,-1).map((n,i)=>edges.find(e=>e[0]===n&&e[1]===p.nodes[i+1])[2]).join(' + ')} = ${p.minutes}분이에요. 제 기준은 ‘${s.policy.requireGate?'인증 필수':'인증 필수 조건 없음'}, ${s.policy.maxMinutes}분 이내, 가장 짧은 시간’이에요.`;}
    else if(intent.search||!current(s)&&intent.basis)reply=recommend(s);
    else reply='경로를 찾거나, 판단 근거를 묻거나, 필수 통과 지점과 제한 시간을 바꿔 말할 수 있어요. 어떤 조건을 반영할까요?';
    say(s,'robot',reply);return {text:reply,execute};
  }
  function restore(raw){const s=fresh();if(raw?.version!==2)return s;s.policy={requireGate:raw.policy?.requireGate===true,maxMinutes:Number.isFinite(raw.policy?.maxMinutes)?Math.max(1,Math.min(60,raw.policy.maxMinutes)):12,fastest:true};if(routes.some(p=>p.id===raw.recommendation))s.recommendation=raw.recommendation;for(const k of ['gate','time','optimal'])s.checked[k]=raw.checked?.[k]===true&&assess(current(s))[k];s.feedbackCount=Math.max(0,Number(raw.feedbackCount)||0);s.revision=Math.max(0,Number(raw.revision)||0);s.lastIssue=['gate','time','optimal'].includes(raw.lastIssue)?raw.lastIssue:'';s.lessons=Array.isArray(raw.lessons)?raw.lessons.filter(l=>l&&typeof l.source==='string'&&l.criteria&&Number.isFinite(l.criteria.maxMinutes)).slice(-40).map(l=>({revision:Number(l.revision)||0,source:l.source.slice(0,600),criteria:{requireGate:l.criteria.requireGate===true,maxMinutes:l.criteria.maxMinutes,fastest:true}})):[];s.logs=Array.isArray(raw.logs)?raw.logs.slice(-120):[];s.chat=Array.isArray(raw.chat)?raw.chat.filter(m=>['student','robot'].includes(m?.who)&&typeof m.text==='string').map(m=>({who:m.who,text:m.text.slice(0,1500)})).slice(-60):[];s.complete=raw.complete===true&&assess(current(s)).optimal&&Object.values(s.checked).every(Boolean)&&s.feedbackCount>0&&s.policy.requireGate;s.phase=s.complete?'complete':'room';return s;}
  const api={key,names,edges,routes,label,fresh,current,assess,recommend,teach,verify,select,begin,finish,parse,ask,restore,optimal};if(typeof module!=='undefined')module.exports=api;else root.B0RoomThree=api;
})(typeof window!=='undefined'?window:globalThis);
