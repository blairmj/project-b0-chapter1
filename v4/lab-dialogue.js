/* Location-aware corridor dialogue. Observations explain the current situation;
   they never solve a room puzzle or reveal an unseen object's contents. */
(function(root){
  'use strict';
  const conversation=(id,...lines)=>({id,lines});
  const nearPlate=c=>Math.hypot(c.x,c.z+65)<=220;
  function stairs(s){
    if(s.stairsUnlocked)return conversation('stairs-open',
      ['student','이제 또 밀어내는 건 아니겠지?'],
      ['robot','접근 차단이 해제되어 있습니다. 태블릿 연결은 유지되고 있습니다. 같이 올라가겠습니다, 주인님.']);
    const question=s.stairRejected?'계단에서 왜 자꾸 튕기는 거야?':'계단은 있는데 왜 올라갈 수가 없는 거야?';
    return conversation(s.keyTaken?'stairs-key':'stairs-locked',
      ['student',question],
      ['robot','계단 옆 제어기에 접근 제한 표시와 열쇠 구멍이 있습니다. 열쇠가 있어야 하는 것 같습니다.'],
      ['student',s.keyTaken?'그럼 우리가 주운 열쇠가 맞는지 확인해 보자.':'어딘가에 열쇠가 있겠네. 주변을 찾아보자.']);
  }
  function room(s,id){
    const solved=s.cleared[id];
    const lines={
      practice:[['student','여기가 우리가 들어왔던 방이지?'],['robot','네. 출입 관리실입니다. 우리가 나온 문이 복도 끝에 있습니다.']],
      education:solved?[['student','아이의 풀이를 같이 고쳤던 교실이네.'],['robot','네. 수업 기록을 확인하고 메모리를 꺼냈던 곳입니다.']]:[['student','저쪽 창 너머로 보였던 교실인가?'],['robot','문에 교육 실습실이라고 적혀 있습니다. 창으로 본 방과 같은지 들어가서 비교할 수 있겠습니다.']],
      storage:solved?[['student','우리가 창문으로 나왔던 방이네.'],['robot','네. 닫힌 입구 외에도 나갈 수 있는 곳을 함께 찾았습니다.']]:[['student','보관실이면 쓸 만한 게 있겠지?'],['robot','있을 가능성은 있습니다. 무엇을 보관하는지는 안에서 확인해야겠습니다.']],
      access:solved?[['student','여기서 네 지도에 없던 문을 찾았잖아.'],['robot','네. 기록과 실제 방을 비교해서 찾았습니다. 확인한 위치로 제 지도를 수정했습니다.']]:s.recordMemory?[['student','우리가 가져온 메모리랑 표시가 같아.'],['robot','네, 주인님. 모양만 비슷한지 실제로 연결되는지도 확인해 보겠습니다.']]:[['student','이 문도 그냥 열리지는 않네.'],['robot','문 옆 단자에 교육 실습실의 기록 표시가 있습니다.'],['student','같은 표시가 있는 물건을 찾아야겠네.']],
      mirror:solved?[['student','유리 너머 보조팔에 부탁하니까 말이 중요하더라.'],['robot','네. 어느 장치를 어떻게 움직일지 알려 주셔서, 서로 다른 쪽에서도 함께 문을 열 수 있었습니다.']]:[['student','관찰실이면 누가 누구를 보는 거야?'],['robot','원래는 연구원이 실험을 관찰했을 겁니다.'],['student','지금은 우리가 연구소를 관찰하는 거네.']],
      outside:[['student','여기가 바깥으로 나가는 문 아니야?'],['robot','문 옆 표시에는 외부 출입 승인을 2층 중앙관리실에서 확인하라고 적혀 있습니다.']],
      reflection:solved?[['student','각도를 외워서 되는 방은 아니었네.'],['robot','빛 기계와 실제 도착 위치를 비교해서 경로를 찾았습니다. 휴대용 반사판도 챙겼습니다.']]:[['student','여긴 거울 관찰실이라고 쓰여 있어.'],['robot','문 옆에 빛의 길을 맞추는 방이라는 표시가 있습니다. 안의 장치는 들어가서 확인하겠습니다.']],
      central:[['student','드디어 여기네.'],['robot','원래 기록이 이 안에 있습니다. 연결이 끊어지기 전에 되찾아 주세요.'],['student','응. 우리가 함께 공부하던 기억 그대로 데려갈게.']]
    };
    return conversation('room-'+id,...lines[id]);
  }
  function keybox(s){
    if(s.keyTaken)return conversation('keybox-empty',
      ['student','열쇠는 챙겼지?'],['robot','네. 소지품에 계단실 열쇠가 있습니다.']);
    if(s.keyboxOpen)return conversation('keybox-open',
      ['student','열쇠가 있네. 어디에 쓰는 걸까?'],
      ['robot','열쇠 고리에 계단실이라고 적혀 있습니다.'],
      ['student','챙겨서 계단 옆 제어기에 맞는지 확인해 보자.']);
    return conversation('keybox',
      ['student','B-0, 이 보관함은 뭐야?'],
      ['robot','뚜껑이 닫혀 있어 안은 보이지 않습니다. 열어서 확인해 볼까요?']);
  }
  function lookingAtKeybox(s,c,selected,doors){
    const d=doors.keybox;if(s.floor!==1||!d||Math.abs(c.z-d.z)>180)return false;
    if(selected==='keybox')return true;
    if(!s.cleared.mirror||!Number.isFinite(c.yaw)||Math.hypot(c.x-d.x,c.z-d.z)>310)return false;
    const direction=Math.atan2(d.x-c.x,c.z-d.z)*180/Math.PI;
    return Math.abs(((c.yaw-direction+540)%360)-180)<=45;
  }
  function resolve(s,c,selected,doors){
    const at=id=>doors[id]&&doors[id].floor===s.floor&&Math.abs(c.z-(id==='practice'?80:doors[id].z))<=180;
    // A deliberately examined object takes precedence only while it is nearby.
    if(lookingAtKeybox(s,c,selected,doors))return keybox(s);
    if(s.floor===2)return c.z<=-2290?room(s,'central'):conversation('upper-hall',
      ['student','여기가 2층이구나. 중앙관리실은 어디지?'],['robot','이 복도 끝에 있습니다. 문 옆 표시도 확인해 보세요.']);
    if(selected==='shutter'&&Math.abs(c.z+610)<=350)return conversation(s.cleared.storage?'shutter-open':'shutter',
      ['student',s.cleared.storage?'아까 막혀 있던 데가 열렸네?':'못 가게 막아 버렸네.'],
      ['robot',s.cleared.storage?'네. 이제 복도의 앞뒤가 이어져 있습니다.':'이 통로가 막힌 것은 맞습니다. 다른 문까지 모두 막혔다는 뜻은 아닙니다.']);
    if(selected==='glass'&&Math.abs(c.z+1510)<=350)return conversation(s.cleared.mirror?'glass-open':'glass',
      ['student',s.cleared.mirror?'이제 같이 갈 수 있겠네.':'보이는데 못 가니까 더 답답해.'],
      ['robot',s.cleared.mirror?'유리 차단문이 올라가 복도가 이어졌습니다.':'보이는 곳과 갈 수 있는 곳이 다릅니다. 지도에서도 그 둘을 구분해야겠습니다.']);
    if(c.z<=-1550)return stairs(s);
    if(['practice','education','storage','access','mirror','outside'].includes(selected)&&at(selected))return room(s,selected);
    if(nearPlate(c)){
      if(!s.powerOut)return conversation('plate-before',['student','바닥 판이 조금 들떠 있네?'],['robot','네. 어디에 연결된 판인지는 아직 확인하지 못했습니다.']);
      if(s.emergencyOn)return conversation('plate-emergency',['student','이제 바닥이 좀 보이네.'],['robot','비상 전원으로 벽면 조명만 켰습니다. 천장 형광등은 아직 꺼져 있습니다.']);
      if(s.powerTalked)return conversation('plate-after',['student','이 판을 밟아서 불이 꺼진 거지?'],['robot','네. 판을 밟은 직후 전원이 차단됐습니다. 저도 그때 연결되어 있다는 걸 알았습니다.']);
      return conversation('power',['student','B-0, 왜 미리 말 안 해줬어?'],['robot','저도 몰랐습니다. 이 바닥 덮개가 전원 장치와 연결된 건 밟은 뒤에야 알았습니다.'],['student','그럼 앞은 같이 살펴보자. 뭔가 알아내면 바로 알려 줘.']);
    }
    if(Math.abs(c.z+1510)<=125)return s.cleared.mirror?
      conversation('glass-open',['student','이제 계단 쪽으로 갈 수 있겠네.'],['robot','네. 유리 차단문이 올라가 복도가 이어졌습니다.']):
      conversation('glass',['student','유리 너머에 계단이 보이는데, 이쪽으로는 못 가?'],['robot','차단문이 닫혀 있습니다. 다른 공간과 이어지는 통로가 있는지 살펴봐야 합니다.']);
    if(Math.abs(c.z+610)<=125)return s.cleared.storage?
      conversation('shutter-open',['student','아까 막혀 있던 데가 열렸네?'],['robot','네. 이제 복도의 앞뒤가 이어져 있습니다.']):
      conversation('shutter',['student','차단문이 내려왔어. 이쪽은 못 가는 거야?'],['robot','지금은 닫혀 있습니다. 주변의 다른 문이나 통로를 살펴볼 수 있습니다.']);
    const nearest=['education','storage','access','mirror','outside'].sort((a,b)=>Math.abs(c.z-doors[a].z)-Math.abs(c.z-doors[b].z)||(a==='education'?(c.yaw<0?-1:1):b==='education'?(c.yaw<0?1:-1):0))[0];
    if(Math.abs(c.z-doors[nearest].z)<=145)return room(s,nearest);
    return conversation('hall',['student','어디부터 살펴보는 게 좋을까?'],['robot','문 옆 이름과 눈에 보이는 장치를 확인할 수 있습니다. 아직 살펴보지 않은 곳은 저도 어떤 상태인지 모릅니다.']);
  }
  function observe(s,c,doors,selected=null){
    if(lookingAtKeybox(s,c,selected,doors))return keybox(s).lines[1][1];
    if(s.floor===2)return '복도 끝 문 위에 중앙관리실이라고 적혀 있습니다. 안쪽은 아직 확인하지 않았습니다.';
    if(nearPlate(c))return '발밑에 밟았던 덮개가 있고, 천장 형광등은 꺼져 있습니다. 양옆에는 방으로 들어가는 문이 보입니다.';
    if(c.z<=-1550)return s.stairsUnlocked?'계단의 접근 차단이 해제되어 있습니다.':'계단 옆 제어기에 접근 제한 표시와 열쇠 구멍이 보입니다.';
    const nearest=['education','storage','access','mirror','outside'].sort((a,b)=>Math.abs(c.z-doors[a].z)-Math.abs(c.z-doors[b].z)||(a==='education'?(c.yaw<0?-1:1):b==='education'?(c.yaw<0?1:-1):0))[0];
    return Math.abs(c.z-doors[nearest].z)<=180?'가까운 문 옆에 '+doors[nearest].name+'이라고 적혀 있습니다. 안쪽 상태는 문 밖에서 단정할 수 없습니다.':'복도 양옆에 문이 있습니다. 문 위 이름과 눈앞의 바닥부터 확인할 수 있습니다.';
  }
  const api={resolve,nearPlate,observe};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0LabDialogue=api;
})(typeof window!=='undefined'?window:globalThis);
