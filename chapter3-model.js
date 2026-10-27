(function(root){
  'use strict';
  const objects=['map','oldDoor','wall','record','shelf','floor','gap','exit','desk','computer'];
  const fresh=()=>({version:1,phase:'intro',line:0,shelfZ:0,helper:false,oldDoorOpen:false,drawerOpen:false,realDoorOpen:false,approval:'none',mirror:null,computerOn:false,memoryConnected:false,fileIndex:false,diaryRead:false,axiomHeard:false,seen:{},observations:{seen:{},last:''},logs:[]});
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
    if(kind==='route')return s.seen.exit?(s.realDoorOpen?'당신이 발견한 문 너머로 통로가 보입니다. 제 지도에는 이 문이 없었습니다.':'새로운 문을 발견했습니다. 아직 문 너머는 확인하지 못했습니다.'):s.seen.wall?(s.seen.map?'제 지도와 실제 방이 다릅니다. 현재 출구 위치는 아직 확인하지 못했습니다.':'출구 표지와 직접 확인한 벽의 모습이 달랐습니다. 현재 출구 위치는 아직 확인하지 못했습니다.'):s.seen.map?'읽어 본 배치도에는 앞쪽 문이 외부 통로로 이어져 있습니다. 현재 상태는 아직 확인하지 못했습니다.':'현재 출구 위치는 아직 확인하지 못했습니다. 먼저 실제로 보이는 물건부터 살펴볼 수 있습니다.';
    if(kind==='basis')return s.seen.map?'제가 가진 시설 배치 기록 01을 보고 말씀드렸습니다. 실제 방을 새로 확인한 결과는 아닙니다.':'아직 현장에서 확인한 출구 정보가 없습니다. 직접 본 것과 기록에 적힌 것은 구분해서 말씀드리겠습니다.';
    if(id==='computer')return s.axiomHeard?'방송 뒤에 일지 열람이 차단되었습니다. 방금 읽은 내용과 들은 방송은 서로 구분해 두겠습니다.':s.diaryRead?'일지에는 정답률을 높이기 위해 학생의 실패 기록을 제외하고 판단을 AI가 대신하도록 바꾸었다고 적혀 있었습니다.':s.memoryConnected?'메모리는 연결되었습니다. 파일 내용은 직접 열어 보기 전까지 모릅니다.':s.computerOn?'컴퓨터가 켜져 있습니다. 아직 외부 기록은 연결하지 않았습니다.':'컴퓨터 전원이 꺼져 있습니다. 안의 기록은 아직 확인하지 못했습니다.';
    if(id==='map')return '시설 배치 기록 01입니다. 앞쪽 문이 외부 통로로 표시되어 있습니다. 현재 배치와 같은지는 확인이 필요합니다.';
    if(id==='oldDoor'||id==='wall')return s.oldDoorOpen?'문 바로 뒤가 벽입니다. 이 문으로는 지나갈 수 없습니다.':'문이 닫혀 있어 안쪽은 보이지 않습니다. 표지판에는 ‘출구’라고 적혀 있습니다.';
    if(id==='record')return s.drawerOpen||s.observations?.seen?.record>=2?'개조 기록 07입니다. 기존 외부 통로를 폐쇄했고, 안내 표지 철거는 완료되지 않았다고 적혀 있습니다. 새 출구 위치는 적혀 있지 않습니다.':'서랍 안의 기록은 아직 확인하지 못했습니다.';
    if(id==='floor')return '보관장 바퀴와 나란한 자국이 바닥에 남아 있습니다. 언제 생겼는지는 알 수 없습니다.';
    if(id==='gap')return '보관장 아래쪽 틈으로 빛이 들어옵니다. 뒤쪽 전체는 아직 보이지 않습니다.';
    if(id==='shelf')return '바퀴가 달린 보관장입니다. 안에 물건이 많이 실려 있습니다. 뒤쪽은 가려져 있습니다.';
    if(id==='exit')return clear(s)?'보관장에 가려져 있던 문입니다. 제 지도에는 표시되어 있지 않습니다.':'여기서는 보관장 뒤를 확인할 수 없습니다.';
    return '보이는 것부터 확인하겠습니다. 구체적으로 어느 물건을 살펴볼까요?';
  }
  function powerComputer(s){s.computerOn=true;inspect(s,'computer');return true;}
  function connectMemory(s,hasMemory){if(!s.computerOn||!hasMemory)return false;s.memoryConnected=true;note(s,'connect-memory','computer');return true;}
  function openFiles(s){if(!s.computerOn)return false;s.fileIndex=true;return true;}
  function readDiary(s){if(!s.computerOn||!s.memoryConnected||!s.fileIndex)return false;s.diaryRead=true;note(s,'read-secret-diary','computer');return true;}
  function hearAxiom(s){if(!s.diaryRead)return false;s.axiomHeard=true;note(s,'axiom-broadcast','computer');return true;}
  function restore(raw){
    const s=fresh();if(!raw||raw.version!==1)return s;
    s.phase=['intro','room','gate','mirror','complete'].includes(raw.phase)?raw.phase:'intro';
    s.line=Math.max(0,Math.min(20,Number(raw.line)||0));s.shelfZ=Number.isFinite(raw.shelfZ)?Math.max(-175,Math.min(175,raw.shelfZ)):0;
    for(const k of ['helper','oldDoorOpen','drawerOpen','computerOn','memoryConnected','fileIndex','diaryRead','axiomHeard'])s[k]=raw[k]===true;
    s.realDoorOpen=raw.realDoorOpen===true&&clear(s);s.approval=raw.approval==='rejected'?'rejected':'none';
    s.mirror=raw.mirror&&typeof raw.mirror==='object'?raw.mirror:null;
    for(const id of objects)if(raw.seen?.[id]===true)s.seen[id]=true;
    s.logs=Array.isArray(raw.logs)?raw.logs.filter(x=>x&&typeof x.action==='string').slice(-100):[];if(raw.observations&&typeof raw.observations==='object')s.observations={seen:{...raw.observations.seen},last:raw.observations.last};return s;
  }
  const api={fresh,clear,note,inspect,toggleOldDoor,moveShelf,openExit,leave,request,beginMirror,finish,reply,powerComputer,connectMemory,openFiles,readDiary,hearAxiom,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0RoomThree=api;
})(typeof window!=='undefined'?window:globalThis);
