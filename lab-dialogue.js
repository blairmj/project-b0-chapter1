/* Location-aware corridor dialogue. Observations explain the current situation;
   they never solve a room puzzle or reveal an unseen object's contents. */
(function(root){
  'use strict';
  const conversation=(id,...lines)=>({id,lines});
  const nearPlate=c=>Math.hypot(c.x,c.z+65)<=220;
  function stairs(s){
    if(s.stairsUnlocked)return conversation('stairs-open',
      ['student','이제 계단으로 올라가도 되는 거지?'],
      ['robot','네. 접근 차단이 해제되어 있습니다. 2층으로 올라갈 수 있습니다.']);
    const question=s.stairRejected?'계단에서 왜 자꾸 튕기는 거야?':'계단은 있는데 왜 올라갈 수가 없는 거야?';
    return conversation(s.keyTaken?'stairs-key':'stairs-locked',
      ['student',question],
      ['robot','계단 옆 제어기에 접근 제한 표시와 열쇠 구멍이 있습니다. 열쇠가 있어야 하는 것 같습니다.'],
      ['student',s.keyTaken?'그럼 우리가 주운 열쇠가 맞는지 확인해 보자.':'어딘가에 열쇠가 있겠네. 주변을 찾아보자.']);
  }
  function room(s,id){
    const solved=s.cleared[id];
    const lines={
      practice:[['student','여기가 우리가 깨어났던 방이지?'],['robot','네. 출입 관리실입니다. 우리가 나온 문이 복도 끝에 있습니다.']],
      storage:solved?[['student','우리가 창문으로 나왔던 방이네.'],['robot','네. 닫힌 입구 외에도 나갈 수 있는 곳을 함께 찾았습니다.']]:[['student','여기는 뭘 보관하던 곳이야?'],['robot','문 옆에 물류 보관실이라고 적혀 있습니다. 안쪽 상태는 들어가서 확인해야 합니다.']],
      access:solved?[['student','여기서 네 지도에 없던 문을 찾았잖아.'],['robot','네. 기록과 실제 방을 비교해서 찾았습니다. 확인한 위치로 제 지도를 수정했습니다.']]:[['student','기록을 보면 나갈 길도 알 수 있을까?'],['robot','이곳은 기록 보관실입니다. 다만 오래된 기록이 지금 모습과 같은지는 직접 확인해야 합니다.']],
      mirror:solved?[['student','유리 너머로 떨어져 있으니까 답답하더라.'],['robot','네. 어느 장치를 어떻게 움직일지 알려 주셔서, 서로 다른 쪽에서도 함께 문을 열 수 있었습니다.']]:[['student','유리 관찰실? 여기는 어떤 곳이야?'],['robot','유리로 구역을 나누어 관찰하던 방입니다. 지금 안쪽 상황은 아직 확인하지 못했습니다.']],
      outside:[['student','여기가 바깥으로 나가는 문 아니야?'],['robot','문 옆 표시에는 외부 출입 승인을 2층 중앙관리실에서 확인하라고 적혀 있습니다.']],
      central:[['student','이 안이 중앙관리실이야?'],['robot','네. 문 옆 이름이 지도와 일치합니다. 안에서 어떤 일이 벌어지고 있는지는 직접 확인해야 합니다.']]
    };
    return conversation('room-'+id,...lines[id]);
  }
  function resolve(s,c,selected,doors){
    const at=id=>doors[id]&&doors[id].floor===s.floor&&Math.abs(c.z-(id==='practice'?80:doors[id].z))<=180;
    // A deliberately examined object takes precedence only while it is nearby.
    if(selected==='keybox'&&at('keybox'))return s.keyTaken?
      conversation('keybox-empty',['student','열쇠는 챙겼지?'],['robot','네. 소지품에 계단실 열쇠가 있습니다.']):
      conversation('keybox',['student','이 보관함에는 뭐가 있을까?'],['robot',s.keyboxOpen?'안쪽에 작은 금속 열쇠가 보입니다.':'뚜껑이 닫혀 있어 안은 보이지 않습니다. 직접 열어 확인할 수 있습니다.']);
    if(s.floor===2)return c.z<=-2290?room(s,'central'):conversation('upper-hall',
      ['student','여기가 2층이구나. 중앙관리실은 어디지?'],['robot','이 복도 끝에 있습니다. 문 옆 표시도 확인해 보세요.']);
    if(c.z<=-1550)return stairs(s);
    if(['practice','storage','access','mirror','outside'].includes(selected)&&at(selected))return room(s,selected);
    if(nearPlate(c)){
      if(!s.powerOut)return conversation('plate-before',['student','바닥 판이 조금 들떠 있네?'],['robot','네. 어디에 연결된 판인지는 아직 확인하지 못했습니다.']);
      if(s.powerTalked)return conversation('plate-after',['student','이 판을 밟아서 불이 꺼진 거지?'],['robot','네. 판을 밟은 직후 전원이 차단됐습니다. 저도 그때 연결되어 있다는 걸 알았습니다.']);
      return conversation('power',['student','B-0, 왜 미리 말 안 해줬어?'],['robot','저도 몰랐습니다. 이 바닥 덮개가 전원 장치와 연결된 건 밟은 뒤에야 알았습니다.'],['student','그럼 앞은 같이 살펴보자. 뭔가 알아내면 바로 알려 줘.']);
    }
    if(Math.abs(c.z+1510)<=125)return s.cleared.mirror?
      conversation('glass-open',['student','이제 계단 쪽으로 갈 수 있겠네.'],['robot','네. 유리 차단문이 올라가 복도가 이어졌습니다.']):
      conversation('glass',['student','유리 너머에 계단이 보이는데, 이쪽으로는 못 가?'],['robot','차단문이 닫혀 있습니다. 다른 공간과 이어지는 통로가 있는지 살펴봐야 합니다.']);
    if(Math.abs(c.z+610)<=125)return s.cleared.storage?
      conversation('shutter-open',['student','아까 막혀 있던 데가 열렸네?'],['robot','네. 이제 복도의 앞뒤가 이어져 있습니다.']):
      conversation('shutter',['student','차단문이 내려왔어. 이쪽은 못 가는 거야?'],['robot','지금은 닫혀 있습니다. 주변의 다른 문이나 통로를 살펴볼 수 있습니다.']);
    const nearest=['storage','access','mirror','outside'].sort((a,b)=>Math.abs(c.z-doors[a].z)-Math.abs(c.z-doors[b].z))[0];
    if(Math.abs(c.z-doors[nearest].z)<=145)return room(s,nearest);
    return conversation('hall',['student','어디부터 살펴보는 게 좋을까?'],['robot','문 옆 이름과 눈에 보이는 장치를 확인할 수 있습니다. 아직 살펴보지 않은 곳은 저도 어떤 상태인지 모릅니다.']);
  }
  const api={resolve,nearPlate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0LabDialogue=api;
})(typeof window!=='undefined'?window:globalThis);
