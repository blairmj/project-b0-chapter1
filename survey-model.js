(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.B0Survey=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const VERSION='b0-post-1.0',SCHEMA=1;
  const groups=[
    {id:'verify',name:'근거 확인',items:['V1','V2','V3']},
    {id:'instruct',name:'구체적인 지시',items:['I1','I2','I3']},
    {id:'revise',name:'오류 점검과 재시도',items:['R1','R2','R3']},
    {id:'agency',name:'역할 분담과 자기 판단',items:['A1','A2','A3']}
  ];
  const items=[
    ['V1','AI가 알려 준 내용이 맞는지, 다른 단서와 비교할 수 있다.'],
    ['V2','AI의 설명과 눈앞의 결과가 다르면, 무엇이 다른지 살펴볼 수 있다.'],
    ['V3','AI가 모르는 것이 있을 때, 확인할 정보를 찾아볼 수 있다.'],
    ['I1','AI에게 부탁할 때, 어떤 물건이나 내용을 말하는지 분명히 알려 줄 수 있다.'],
    ['I2','AI에게 무엇을 어떻게 해 달라는지 구체적으로 말할 수 있다.'],
    ['I3','AI에게 어떤 행동을 언제까지 해야 하는지 알려 줄 수 있다.'],
    ['R1','답이 틀렸을 때, 어느 단계에서 잘못됐는지 나누어 살펴볼 수 있다.'],
    ['R2','AI에게 내가 막힌 부분만 확인해 달라고 부탁할 수 있다.'],
    ['R3','한 번에 해결되지 않아도, 방법을 바꾸어 다시 시도할 수 있다.'],
    ['A1','AI와 함께 문제를 풀 때, 내가 할 일과 AI에게 부탁할 일을 나눌 수 있다.'],
    ['A2','AI에게 도움을 받은 뒤에도, 결과가 괜찮은지 내가 확인할 수 있다.'],
    ['A3','AI의 제안을 참고하면서, 마지막 선택은 내가 할 수 있다.'],
    ['E1','게임을 하는 동안 재미를 느꼈다.'],
    ['E2','다음에 비슷한 문제를 만나면 다시 도전하고 싶다.'],
    ['E3','화면을 움직이거나 물건을 누르는 방법을 이해하기 쉬웠다.'],
    ['E4','게임의 글과 대화를 읽고 뜻을 이해하기 쉬웠다.']
  ].map(([id,text])=>({id,text,group:groups.find(g=>g.items.includes(id))?.id||'experience'}));
  const scale=['전혀 그렇지 않다','별로 그렇지 않다','보통이다','대체로 그렇다','매우 그렇다'];
  const scenarios=[
    {id:'S1',group:'verify',title:'안내와 실제 모습이 달라요',text:'AI가 “오늘 도서관은 열려 있어”라고 했어요. 그런데 문 앞에는 “오늘 휴관” 안내문이 있어요. 어떻게 하면 좋을까요?',options:[['a','AI가 더 많이 알 테니 안내문을 무시한다.'],['b','안내문의 날짜를 확인하고, 도서관의 최신 안내도 찾아본다.'],['c','AI가 알려 준 문장을 그대로 반복해서 물어본다.'],['d','이제부터 모든 안내를 믿지 않는다.']],answer:'b',reason:'현재 날짜와 최신 근거를 대조한다. AI도 잘못되거나 오래된 정보를 줄 수 있다.'},
    {id:'S2',group:'instruct',title:'친구 로봇에게 부탁해요',text:'빨간 손잡이를 아래로 내린 상태로 두어야 해요. 내가 문을 지난 뒤 “이제 놓아”라고 말하면 손을 놓게 하고 싶어요. 어떤 부탁이 가장 분명할까요?',options:[['a','문이 열리게 잘해 줘.'],['b','저걸 좀 움직여 줘.'],['c','빨간 손잡이를 아래로 내리고, 내가 “이제 놓아”라고 말할 때까지 잡고 있어 줘.'],['d','빨간 손잡이를 한 번 내려 줘.']],answer:'c',reason:'대상, 방향, 유지할 행동, 종료 조건을 함께 지정한다.'},
    {id:'S3',group:'revise',title:'풀이가 틀렸어요',text:'문제 풀이가 세 단계로 되어 있는데 답이 틀렸어요. AI의 도움을 받아 내가 어디서 잘못했는지 알아보려면 어떻게 할까요?',options:[['a','각 단계의 계산을 확인하고, 막힌 단계의 설명을 부탁한다.'],['b','최종 답만 받아 적고 풀이를 지운다.'],['c','같은 풀이를 확인 없이 다시 입력한다.'],['d','한 번 틀렸으니 더는 풀지 않는다.']],answer:'a',reason:'풀이를 단계별로 점검하고 필요한 부분의 도움을 구한다.'},
    {id:'S4',group:'agency',title:'발표 자료를 만들어요',text:'AI가 발표 자료를 만들어 주었어요. 친구들 앞에서 발표하기 전에 내가 할 일은 무엇일까요?',options:[['a','AI가 만들었으니 읽지 않고 발표한다.'],['b','글자 색만 바꾸고 내용은 그대로 둔다.'],['c','AI에게 “맞지?”라고 한 번 묻고 끝낸다.'],['d','내용과 출처를 확인하고, 내가 이해한 말로 고친 뒤 사용할 내용을 정한다.']],answer:'d',reason:'결과를 검토하고 이해한 뒤 사람이 사용할 내용을 결정한다.'}
  ];
  const openItems=[
    {id:'O1',text:'B-0의 말이나 안내가 맞는지 직접 확인한 장면이 있나요? 무엇을 보고 어떻게 판단했는지 써 주세요.'},
    {id:'O2',text:'처음에는 잘 안 됐지만 부탁이나 방법을 바꾸어 해결한 일이 있나요? 바꾸기 전과 후를 써 주세요.'},
    {id:'O3',text:'게임에서 가장 어려웠던 점이나 바꾸면 좋을 점을 자유롭게 써 주세요.'}
  ];
  const string=(v,max=1000)=>typeof v==='string'?v.slice(0,max).trim():'';
  const validRating=v=>Number.isInteger(v)&&v>=1&&v<=5;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const pick=(v,allowed)=>allowed.includes(v)?v:'';
  function normalize(raw){
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schemaVersion!==SCHEMA||raw.instrumentVersion!==VERSION)throw new Error('지원하는 B-0 사후 설문 파일이 아닙니다.');
    if(typeof raw.responseId!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(raw.responseId))throw new Error('응답 ID를 확인할 수 없습니다.');
    if(!['student','test'].includes(raw.recordMode))throw new Error('실제·미리보기 응답 구분을 확인할 수 없습니다.');
    if(typeof raw.startedAt!=='string'||typeof raw.finishedAt!=='string')throw new Error('응답 시각이 올바르지 않습니다.');
    const started=Date.parse(raw.startedAt),finished=Date.parse(raw.finishedAt);
    if(!Number.isFinite(started)||!Number.isFinite(finished)||finished<started)throw new Error('응답 시각이 올바르지 않습니다.');
    const ratings={},answers={},open={};
    for(const q of items){const v=raw.ratings?.[q.id];if(v!==null&&v!==undefined&&!validRating(v))throw new Error(`${q.id}: 1~5점 또는 빈 응답이어야 합니다.`);ratings[q.id]=validRating(v)?v:null;}
    for(const q of scenarios){const v=raw.answers?.[q.id];if(v!==null&&v!==undefined&&!['a','b','c','d','unknown'].includes(v))throw new Error(`${q.id}: 보기 값이 올바르지 않습니다.`);answers[q.id]=v??null;}
    for(const q of openItems)open[q.id]=string(raw.open?.[q.id]);
    const meta=raw.meta||{};
    return {schemaVersion:SCHEMA,instrumentVersion:VERSION,responseId:raw.responseId,startedAt:new Date(started).toISOString(),finishedAt:new Date(finished).toISOString(),recordMode:pick(raw.recordMode,['student','test'])||'student',source:pick(raw.source,['ending','direct'])||'direct',meta:{participantCode:string(meta.participantCode,32),groupCode:string(meta.groupCode,32),grade:pick(meta.grade,['5','6','other','skip']),priorAI:pick(meta.priorAI,['none','sometimes','often','skip']),completion:pick(meta.completion,['full','partial','review','skip'])},ratings,answers,open};
  }
  function stats(values){
    const a=values.filter(finite).sort((a,b)=>a-b),n=a.length;if(!n)return {n:0,mean:null,sd:null,median:null,min:null,max:null};
    const mean=a.reduce((x,y)=>x+y,0)/n;
    return {n,mean,sd:n>1?Math.sqrt(a.reduce((x,y)=>x+(y-mean)**2,0)/(n-1)):null,median:n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2,min:a[0],max:a[n-1]};
  }
  function groupScore(record,group){const a=group.items.map(id=>record.ratings[id]).filter(validRating);return a.length>=2?a.reduce((s,v)=>s+v,0)/a.length:null;}
  function summary(records){
    const n=records.length;
    return {n,groups:groups.map(g=>({...g,...stats(records.map(r=>groupScore(r,g))),missing:n-records.filter(r=>groupScore(r,g)!==null).length})),items:items.map(q=>{const values=records.map(r=>r.ratings[q.id]).filter(validRating);return {...q,...stats(values),missing:n-values.length,positive:values.length?values.filter(v=>v>=4).length/values.length:null,counts:[1,2,3,4,5].map(v=>values.filter(x=>x===v).length)};}),scenarios:scenarios.map(q=>{const values=records.map(r=>r.answers[q.id]).filter(v=>v!==null);const correct=values.filter(v=>v===q.answer).length;return {id:q.id,title:q.title,group:q.group,n:values.length,correct,incorrect:values.filter(v=>v!=='unknown'&&v!==q.answer).length,unknown:values.filter(v=>v==='unknown').length,missing:n-values.length,rate:values.length?correct/values.length:null,counts:Object.fromEntries(['a','b','c','d','unknown'].map(v=>[v,values.filter(x=>x===v).length]))};}),completeScenario:stats(records.filter(r=>scenarios.every(q=>r.answers[q.id]!==null)).map(r=>scenarios.filter(q=>r.answers[q.id]===q.answer).length)),completeRatings:records.filter(r=>items.every(q=>validRating(r.ratings[q.id]))).length};
  }
  function parse(text){
    const data=JSON.parse(text.replace(/^\uFEFF/,''));
    const rows=Array.isArray(data)?data:data?.format==='b0-survey-bundle'&&Array.isArray(data.responses)?data.responses:[data];
    if(rows.length>5000)throw new Error('한 파일에는 최대 5,000개 응답을 불러올 수 있습니다.');
    return rows.map(normalize);
  }
  function merge(existing,incoming){
    const rows=new Map(existing.map(r=>[r.responseId,r]));let duplicates=0;
    for(const record of incoming){const previous=rows.get(record.responseId);if(previous){duplicates++;if(Date.parse(previous.finishedAt)>Date.parse(record.finishedAt))continue;if(previous.finishedAt===record.finishedAt&&JSON.stringify(previous)!==JSON.stringify(record))throw new Error('같은 ID와 시각에 서로 다른 응답이 있습니다. 원본을 확인해 주세요.');}rows.set(record.responseId,record);}
    return {records:[...rows.values()],duplicates};
  }
  function csvCell(value){let s=value===null||value===undefined?'':String(value);if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  const csv=rows=>'\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  function rawCSV(records){
    const fields=['responseId','recordMode','source','instrumentVersion','startedAt','finishedAt','durationSeconds','participantCode','groupCode','grade','priorAI','completion',...items.map(q=>q.id),...scenarios.map(q=>q.id),...scenarios.map(q=>q.id+'_score'),...groups.map(g=>g.id+'_mean'),...openItems.map(q=>q.id)];
    return csv([fields,...records.map(r=>[r.responseId,r.recordMode,r.source,r.instrumentVersion,r.startedAt,r.finishedAt,Math.round((Date.parse(r.finishedAt)-Date.parse(r.startedAt))/1000),r.meta.participantCode,r.meta.groupCode,r.meta.grade,r.meta.priorAI,r.meta.completion,...items.map(q=>r.ratings[q.id]),...scenarios.map(q=>r.answers[q.id]),...scenarios.map(q=>r.answers[q.id]===null?null:r.answers[q.id]===q.answer?1:0),...groups.map(g=>groupScore(r,g)),...openItems.map(q=>r.open[q.id])])]);
  }
  function summaryCSV(records){const s=summary(records);return csv([['type','id','label','n_valid','n_missing','mean','sd','median','positive_4_5_rate','correct_rate','unknown_n'],...s.groups.map(g=>['group',g.id,g.name,g.n,g.missing,g.mean,g.sd,g.median,'','','']),...s.items.map(q=>['item',q.id,q.text,q.n,q.missing,q.mean,q.sd,q.median,q.positive,'','']),...s.scenarios.map(q=>['scenario',q.id,q.title,q.n,q.missing,'','','','',q.rate,q.unknown])]);}
  return {VERSION,SCHEMA,groups,items,scale,scenarios,openItems,normalize,stats,groupScore,summary,parse,merge,csvCell,csv,rawCSV,summaryCSV};
});
