/* Knowledge boundary for B-0: look (1), inspect/read (2), operate/open (3).
   Asking for a recap never adds observations or solves a puzzle. */
(function(root){
  'use strict';
  const valid=id=>typeof id==='string'&&/^[a-z][a-zA-Z-]{0,25}$/.test(id)&&id!=='robot';
  function restore(raw){const result={seen:{},last:''};if(!raw||typeof raw!=='object')return result;
    for(const [id,n] of Object.entries(raw.seen||{}))if(valid(id)&&[1,2,3].includes(n))result.seen[id]=n;
    if(result.seen[raw.last])result.last=raw.last;return result;
  }
  function remember(s,id,n=1){if(!valid(id))return;s.observations=restore(s.observations);s.observations.seen[id]=Math.max(s.observations.seen[id]||0,n);s.observations.last=id;}
  function level(room,s,id){
    let n=restore(s.observations).seen[id]||0;
    if(room==='practice'){
      if(id==='map'&&s.guide)n=Math.max(n,2);if(id==='lock'&&s.attempts)n=Math.max(n,2);
      if(id==='storage'&&s.noteFound||id==='note'&&s.noteTaken||id==='door'&&s.unlocked)n=3;
    }
    if(room==='storage'){
      if((s.logs||[]).some(x=>x.action==='inspect'&&x.id===id))n=Math.max(n,2);
      if(id==='vent'&&s.ventOpen||id==='fake-window'&&s.fakeWindowOpen||id==='cabinet'&&s.cabinetOpen||id==='window'&&s.windowOpen)n=3;
    }
    if((room==='access'||room==='mirror')&&s.seen?.[id])n=Math.max(n,2);
    if(room==='central'&&s.seen?.[id])n=Math.max(n,1); // Legacy selections were not readings.
    return n;
  }
  function about(room,s,id,e={}){
    const n=level(room,s,id);if(!n)return '그 물건은 아직 함께 확인하지 않았습니다. 먼저 직접 살펴보거나 확인할 대상을 가리켜 주세요.';
    if(room==='practice')return ({
      door:s.unlocked?'출입문의 잠금이 풀린 것을 확인했습니다.':n>=3?'손잡이를 돌렸지만 문이 열리지 않았습니다.':'닫힌 출입문과 숫자 도어락을 확인했습니다. 아직 여는 방법은 확인하지 못했습니다.',
      lock:s.unlocked?'입력한 번호로 잠금이 풀렸습니다.':s.attempts?'입력한 번호는 맞지 않았습니다. 확인한 정보와 다시 비교해 볼 수 있습니다.':'숫자 네 자리를 입력하는 도어락입니다. 확인하지 않은 번호는 저도 모릅니다.',
      map:n>=2?(s.noteFound?'비상 출입 안내에 적힌 관리용 쪽지를 실제로 찾았습니다.':'읽어 본 비상 출입 안내에는 관리용 쪽지를 사용하라고 적혀 있었습니다. 쪽지의 위치는 아직 확인하지 못했습니다.'):'벽에 지도가 있습니다. 적힌 내용은 아직 읽지 않았습니다.',
      filebox:n>=2?'직접 펼쳐 본 종이는 실습 준비물 목록이었습니다. 출입번호는 적혀 있지 않았습니다.':'서류함의 안쪽 내용은 아직 확인하지 않았습니다.',
      envelope:n>=2?'봉투에서 꺼내 본 종이는 장비 청소 안내였습니다. 비밀번호 쪽지는 아니었습니다.':'봉투 안의 종이는 아직 펼쳐 보지 않았습니다.',
      terminal:'방금 살펴본 단말기에는 전원이 들어오지 않았습니다.',cabinet:n>=2?'열어 본 수납칸에서는 문을 여는 데 쓸 만한 물건이 보이지 않았습니다.':'보관장의 내용은 아직 확인하지 않았습니다.',
      bench:'살펴본 실습대의 모니터와 장비는 꺼져 있었습니다.',window:'살펴본 관찰창 너머에는 빈 교실이 보였습니다. 이쪽에서 통과할 수 있는 문은 없었습니다.',
      storage:s.noteTaken?'보관함에서 찾은 쪽지는 건네드렸습니다.':s.noteFound?'이런 게 들어 있네요. 보관함을 열고 나서야 관리용 쪽지가 있다는 걸 알았습니다.':'보관함 안은 아직 확인하지 않았습니다.',note:'제가 건넨 쪽지는 소지품에 있습니다. 적힌 내용은 직접 다시 확인할 수 있습니다.'
    })[id]||'방금 확인한 내용까지만 알고 있습니다. 아직 보지 않은 곳은 직접 살펴봐야 합니다.';
    if(room==='storage'){
      if(id==='vent')return n>=3?'직접 열어 본 환기 덮개 뒤는 금속판으로 막혀 있었습니다.':'덮개 너머는 여기서 다 보이지 않습니다. 안쪽이 통로인지는 아직 모릅니다.';
      if(id==='fake-window')return n>=3?'열어 보니 창 바로 뒤가 벽이었습니다. 빛이 보인다고 통로인 것은 아니었습니다.':'옆 벽의 창 너머는 뿌옇게 보입니다. 통과할 수 있는지는 아직 확인하지 못했습니다.';
      if(id==='cabinet')return n>=3?'직접 열어 본 보관장 안은 비어 있었습니다.':'보관장은 보이지만 닫힌 안쪽은 아직 확인하지 못했습니다.';
      if(id==='window')return s.windowOpen?'걸쇠를 풀어 창문이 열린 것을 확인했습니다.':n>=2?'살펴본 창 너머로 통로와 안쪽 걸쇠가 보였습니다. 아직 어떻게 닿을지는 정하지 않았습니다.':'높은 위치에 창문이 있습니다. 너머가 어디로 이어지는지는 아직 살펴보지 않았습니다.';
      if(id==='entry')return n>=3?'밀어 보았지만 입구는 움직이지 않았습니다. 다른 물건의 상태는 각각 확인해야 합니다.':'닫힌 입구 안쪽에는 손잡이가 보이지 않습니다. 여는 방법은 아직 모릅니다.';
      if(id==='wide'||id==='small')return n>=3?'옮기거나 올라서 본 상자의 위치와 높이가 달라졌습니다. 그 결과 무엇이 달라졌는지 직접 살펴볼 수 있습니다.':id==='wide'?'방금 본 상자는 넓고 낮습니다. 어떤 용도로 쓸지는 아직 정하지 않았습니다.':'방금 본 작은 상자는 윗면이 평평합니다. 어디에 놓을지는 직접 정할 수 있습니다.';
      if(id==='survey')return '방금 살펴본 벽면에서는 다른 문을 찾지 못했습니다. 방 전체의 구조를 모두 확인한 것은 아닙니다.';
    }
    if(room==='access'){
      if(id==='oldDoor'||id==='wall')return s.seen?.wall||s.oldDoorOpen?'직접 열어 본 문 바로 뒤는 벽이었습니다. 출구라는 표지와 실제 모습이 달랐습니다.':'출구라는 표지판을 보았습니다. 문 뒤까지 통로인지는 아직 확인하지 않았습니다.';
      if(id==='map')return n>=2?'읽어 본 옛 배치도에는 앞쪽 문이 외부 통로로 표시되어 있습니다. 지금도 같은지는 직접 확인해야 합니다.':'배치도가 걸려 있습니다. 표시된 경로는 아직 자세히 읽지 않았습니다.';
      if(id==='record')return n>=2?'읽어 본 개조 기록에는 기존 통로가 폐쇄되고 안내 표지는 남았다고 적혀 있었습니다. 새 출구의 위치는 적혀 있지 않았습니다.':'기록의 내용은 아직 읽지 않았습니다.';
      if(id==='desk')return s.drawerOpen?'서랍이 열린 상태입니다. 안에 보이는 기록의 내용은 읽기 전까지 알 수 없습니다.':n>=3?'직접 열어 보았던 서랍이 지금은 닫혀 있습니다. 이미 읽은 기록의 내용과 아직 읽지 않은 내용은 구분하겠습니다.':'책상과 닫힌 서랍을 확인했습니다. 안에 무엇이 있는지는 아직 모릅니다.';
      if(id==='shelf')return s.helper?'보관장 옆에서 함께 밀 준비를 하고 있습니다. 방향은 직접 정해 주세요.':n>=3?'보관장을 밀어 위치가 조금 달라졌습니다. 뒤쪽의 가려진 부분은 직접 확인해야 합니다.':'보관장에 물건이 실려 있고 바퀴가 보입니다. 뒤쪽은 아직 가려져 있습니다.';
      if(id==='floor')return n>=2?'살펴본 바닥에는 보관장 바퀴와 나란한 자국이 있었습니다. 언제 생겼는지는 모릅니다.':'바닥에 어떤 자국이 있는지는 아직 가까이서 확인하지 않았습니다.';
      if(id==='gap')return n>=2?'직접 살펴본 아래쪽 틈으로 빛이 들어왔습니다. 뒤쪽 전체가 보인 것은 아닙니다.':'틈의 안쪽은 아직 자세히 확인하지 않았습니다.';
      if(id==='exit')return s.realDoorOpen?'직접 연 문 너머로 통로가 보입니다. 옛 지도에는 없던 문입니다.':'보관장을 옮겨 새로운 문을 발견했습니다. 아직 문 너머의 상태는 확인하지 않았습니다.';
    }
    if(room==='mirror'){
      if(id==='door')return ['unlocked','reunited','complete'].includes(s.phase)?'잠금쇠가 풀리고 문이 열린 것을 확인했습니다.':n>=2?'직접 살펴본 문에는 잠금쇠 두 개와 삼각형 표시가 있었습니다. 아직 어떤 동작을 할지는 정하지 않았습니다.':'문이 닫혀 있습니다. 잠금장치의 자세한 모양은 아직 살펴보지 않았습니다.';
      if(id==='own')return n>=3?'손잡이를 당겼다가 놓자 원래 위치로 돌아왔습니다.':n>=2?'직접 살펴본 손잡이는 아래로 움직이고 손을 떼면 돌아오는 구조였습니다.':'문 옆 손잡이를 보았습니다. 움직임은 아직 직접 확인하지 않았습니다.';
      if(['circle','triangle','square'].includes(id))return ({circle:'원',triangle:'삼각형',square:'사각형'})[id]+' 표시가 있는 손잡이를 보았습니다. 아직 해 보지 않은 동작의 결과는 모릅니다.';
      if(id==='panel')return '제 쪽에 모양이 다른 손잡이들이 있습니다. 어느 것을 어떻게 움직일지는 직접 가리켜 부탁할 수 있습니다.';
      if(id==='glass')return ['unlocked','reunited','complete'].includes(s.phase)?'유리벽이 올라가 서로에게 갈 수 있게 되었습니다.':'지금은 유리벽 때문에 서로 다른 쪽에 있습니다. 각자 보이는 것은 다를 수 있습니다.';
      if(id==='vent')return s.vent?'손잡이를 움직였을 때 환기 장치 덮개가 바뀐 것을 확인했습니다.':'높은 벽의 환기 장치를 보았습니다. 탈출 통로인지는 확인하지 못했습니다.';
      if(id==='entry')return '지나온 문이 닫혀 있습니다. 아직 열 수 있는 방법은 확인하지 못했습니다.';
    }
    if(room==='central'){
      if(id==='door')return s.opened?'문이 실제로 열린 채 고정된 것을 확인했습니다.':n<2?'출구를 보았습니다. 실제 잠금쇠의 상태는 아직 가까이서 확인하지 않았습니다.':e.latch>=.35?'완료라는 안내가 나왔지만 실제 잠금쇠 끝부분이 아직 문에 걸려 있습니다.':s.upper?'위쪽 잠금쇠는 빠졌고 아래쪽은 아직 걸려 있습니다.':'직접 살펴본 문에는 위아래 잠금쇠가 있습니다. 아직 각각 어떻게 움직이는지는 확인해야 합니다.';
      if(id==='console')return n>=3?'직접 연 덮개 안에 B-0 원격 동작 제어라는 연결 표기가 있었습니다.': '조작대 겉면에는 기체 제어 연결이라고 적혀 있습니다. 안쪽 연결 표기는 덮개를 열어 보기 전까지 확인할 수 없습니다.';
      if(id==='records')return n>=2?'읽어 본 기록에는 이용자 퇴실과 교육 기체 회수 절차가 적혀 있었습니다.': '기록 단말기를 보았지만 내용은 아직 읽지 않았습니다.';
      if(id==='screen')return n>=2?(s.boss?'확인한 화면에는 기체 회수와 반출 제한이 표시되어 있습니다.':'읽어 본 화면에는 시설 폐쇄 절차와 방문자 퇴실이 표시되어 있습니다.'):'관리 화면을 보았지만 표시 내용은 아직 자세히 확인하지 않았습니다.';
      if(id==='handle')return n>=3?'직접 당겼다가 놓았을 때 연결된 줄이 움직이고 손잡이가 돌아왔습니다.':'문 옆 손잡이를 보았습니다. 아직 직접 조작하지 않은 움직임은 단정할 수 없습니다.';
      if(id==='high')return s.upper?'위쪽 잠금쇠를 직접 빼 놓은 상태입니다.':e.lifted&&n>=2?'가까이서 살펴본 수동 잠금장치입니다. 움직일 방향은 직접 확인할 수 있습니다.':'높은 곳의 장치는 이 자리에서 손이 닿지 않습니다. 자세한 구조는 아직 가까이서 확인하지 못했습니다.';
    }
    return '지금까지 직접 확인한 내용만 알고 있습니다. 아직 살펴보지 않은 구조는 단정하지 않겠습니다.';
  }
  function reply(room,s,e={}){
    if(room==='storage'&&s.phase==='ledge')return '저는 아직 아래에 있습니다. 지금 서로의 위치를 확인하고 있습니다.';
    if(room==='storage'&&e.standing&&['wide','small'].includes(restore(s.observations).last)&&!s.assisted)return '지금 상자 위에 올라서 있습니다. 올라오기 전과 무엇이 다르게 보이는지 직접 확인할 수 있습니다.';
    if(room==='storage'&&s.assisted)return '지금 떨어지지 않게 받쳐 드리고 있습니다. 눈앞의 상태를 직접 확인한 뒤 필요한 동작을 말해 주세요.';
    if(room==='mirror'){
      const name={circle:'원',triangle:'삼각형',square:'사각형'};
      if(['reunited','complete'].includes(s.phase))return '유리벽이 올라가 다시 같은 쪽에서 만났습니다. 서로 다른 쪽에서 본 것과 부탁한 동작을 함께 확인했습니다.';
      const observed=restore(s.observations).last;
      if(s.holding)return name[s.holding]+' 표시 손잡이를 내린 채 잡고 있습니다. '+(observed&&observed!==s.holding?about(room,s,observed,e):'놓으라는 부탁을 받기 전까지 유지하겠습니다.');
      if(s.last&&(!observed||observed===s.last.target))return s.last.verb==='down'?name[s.last.target]+' 표시 손잡이를 내렸다가 놓았습니다. 어느 부분이 달라졌는지는 그쪽에서도 확인해 주세요.':s.last.verb==='up'?'요청한 손잡이를 올렸습니다.':'요청하신 손잡이에서 손을 놓았습니다.';
    }
    if(room==='central'){
      if(s.holding)return '부탁하신 손잡이를 계속 잡고 있습니다. 실제 문 상태를 확인한 뒤 놓아도 되는지 알려 주세요.';
      if(e.lifted)return '지금 들어 올려 드리고 있습니다. 눈앞의 장치에서 직접 확인한 동작만 하겠습니다.';
      if(s.met&&s.links.robot&&!s.bodyChecked)return '손과 발이 제 뜻대로 움직이지 않습니다. 제 몸의 상태도 아직 확인이 필요합니다.';
      if(s.met&&s.links.robot&&s.bodyChecked&&!level(room,s,'console'))return '몸을 확인해 보니 회수 모드로 움직임이 제한되어 있습니다. 다른 장치의 연결은 아직 확인하지 못했습니다.';
    }
    const last=restore(s.observations).last,id=valid(e.target)&&level(room,s,e.target)?e.target:last;
    if(id&&level(room,s,id))return about(room,s,id,e);
    if(room==='practice')return s.unlocked?'잠금이 풀린 것을 확인했습니다.':s.noteTaken?'제가 건넨 쪽지는 소지품에 있습니다.':s.noteFound?'보관함을 확인해 관리용 쪽지를 찾았습니다.':'아직 방 안에서 직접 확인한 것이 없습니다. 확인한 물건을 두고 함께 이야기할 수 있습니다.';
    if(room==='storage')return e.standing?'상자 위에 올라서니 시야가 달라졌습니다. 지금 보이는 것을 먼저 확인해 주세요.':'입구가 닫힌 것을 보았습니다. 다른 물건의 안쪽이나 기능은 아직 확인하지 못했습니다.';
    if(room==='access')return '아직 이 방의 출구를 직접 확인하지 못했습니다. 눈앞의 물건과 기록을 살펴본 뒤 비교할 수 있습니다.';
    if(room==='mirror')return '유리벽 때문에 서로 다른 쪽에 있습니다. 아직 장치의 기능은 확인하지 않았습니다.';
    if(room==='central')return s.opened?'출구가 실제로 열린 것을 확인했습니다.':s.boss&&!s.links.robot?'제 움직임이 다시 자유로워졌습니다. 아직 확인하지 않은 장치의 기능은 모릅니다.':'아직 이 방의 장치를 자세히 확인하지 않았습니다.';
    return '';
  }
  const api={restore,remember,level,about,reply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0RoomDialogue=api;
})(typeof window!=='undefined'?window:globalThis);
