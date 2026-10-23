(function(root){
  'use strict';
  const objects=['map','oldDoor','wall','record','shelf','floor','gap','exit','desk'];
  const fresh=()=>({version:1,phase:'intro',line:0,shelfZ:0,helper:false,oldDoorOpen:false,drawerOpen:false,realDoorOpen:false,approval:'none',mirror:null,seen:{},logs:[]});
  const clear=s=>Math.abs(s.shelfZ)>=150;
  function note(s,action,id){s.logs.push({action,id});s.logs=s.logs.slice(-100);}
  function inspect(s,id){if(!objects.includes(id))return false;s.seen[id]=true;note(s,'inspect',id);return true;}
  function toggleOldDoor(s){s.oldDoorOpen=!s.oldDoorOpen;inspect(s,'oldDoor');if(s.oldDoorOpen)inspect(s,'wall');return s.oldDoorOpen;}
  function moveShelf(s,z,start=s.shelfZ){
    if(!Number.isFinite(z))return false;
    const limit=s.helper?340:40;
    s.shelfZ=Math.max(-175,Math.min(175,start+Math.max(-limit,Math.min(limit,z-start))));
    if(!clear(s))s.realDoorOpen=false;
    return true;
  }
  function openExit(s){if(!clear(s))return false;s.realDoorOpen=true;inspect(s,'exit');return true;}
  function leave(s){if(!clear(s)||!s.realDoorOpen)return false;s.phase='gate';s.line=0;note(s,'found-exit','exit');return true;}
  function request(s){if(s.phase!=='gate')return false;s.approval='rejected';note(s,'request-approval','gate');return true;}
  function beginMirror(s){if(!(s.phase==='gate'&&s.approval==='rejected')&&s.phase!=='complete')return false;s.phase='mirror';note(s,'enter-mirror','gate');return true;}
  function finish(s){if(s.phase!=='mirror'||s.mirror?.phase!=='complete')return false;s.phase='complete';note(s,'go-central','mirror');return true;}
  function reply(s,kind,id){
    if(kind==='route')return s.seen.exit?'당신이 발견한 문 너머로 통로가 보입니다. 제 지도에는 이 문이 없었습니다.':s.seen.wall?'제 지도와 실제 방이 다릅니다. 현재 출구 위치는 아직 확인하지 못했습니다.':'제 지도에는 ‘출구’라고 적힌 앞쪽 문이 외부 통로로 이어져 있습니다. 현재 상태는 아직 확인하지 못했습니다.';
    if(kind==='basis')return '제가 가진 시설 배치 기록 01을 보고 말씀드렸습니다. 실제 방을 새로 확인한 결과는 아닙니다.';
    if(id==='map')return '시설 배치 기록 01입니다. 앞쪽 문이 외부 통로로 표시되어 있습니다. 현재 배치와 같은지는 확인이 필요합니다.';
    if(id==='oldDoor'||id==='wall')return s.oldDoorOpen?'문 바로 뒤가 벽입니다. 이 문으로는 지나갈 수 없습니다.':'문이 닫혀 있어 안쪽은 보이지 않습니다. 표지판에는 ‘출구’라고 적혀 있습니다.';
    if(id==='record')return s.drawerOpen?'개조 기록 07입니다. 기존 외부 통로를 폐쇄했고, 안내 표지 철거는 완료되지 않았다고 적혀 있습니다. 새 출구 위치는 적혀 있지 않습니다.':'서랍 안의 기록은 아직 확인하지 못했습니다.';
    if(id==='floor')return '보관장 바퀴와 나란한 자국이 바닥에 남아 있습니다. 언제 생겼는지는 알 수 없습니다.';
    if(id==='gap')return '보관장 아래쪽 틈으로 빛이 들어옵니다. 뒤쪽 전체는 아직 보이지 않습니다.';
    if(id==='shelf')return '바퀴가 달린 보관장입니다. 안에 물건이 많이 실려 있습니다. 뒤쪽은 가려져 있습니다.';
    if(id==='exit')return clear(s)?'보관장에 가려져 있던 문입니다. 제 지도에는 표시되어 있지 않습니다.':'여기서는 보관장 뒤를 확인할 수 없습니다.';
    return '보이는 것부터 확인하겠습니다. 구체적으로 어느 물건을 살펴볼까요?';
  }
  function restore(raw){
    const s=fresh();if(!raw||raw.version!==1)return s;
    s.phase=['intro','room','gate','mirror','complete'].includes(raw.phase)?raw.phase:'intro';
    s.line=Math.max(0,Math.min(20,Number(raw.line)||0));s.shelfZ=Number.isFinite(raw.shelfZ)?Math.max(-175,Math.min(175,raw.shelfZ)):0;
    for(const k of ['helper','oldDoorOpen','drawerOpen'])s[k]=raw[k]===true;
    s.realDoorOpen=raw.realDoorOpen===true&&clear(s);s.approval=raw.approval==='rejected'?'rejected':'none';
    s.mirror=raw.mirror&&typeof raw.mirror==='object'?raw.mirror:null;
    for(const id of objects)if(raw.seen?.[id]===true)s.seen[id]=true;
    s.logs=Array.isArray(raw.logs)?raw.logs.filter(x=>x&&typeof x.action==='string').slice(-100):[];return s;
  }
  const api={fresh,clear,note,inspect,toggleOldDoor,moveShelf,openExit,leave,request,beginMirror,finish,reply,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0RoomThree=api;
})(typeof window!=='undefined'?window:globalThis);
