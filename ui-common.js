(function(){
  'use strict';
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,namespace='ui',extra='')=>`<button type="button" data-${namespace}="${action}" ${extra}>${text}</button>`;
  const common=(text,action)=>button(text,action);
  let returnMenu=null;
  const destinations=[['hall','1층 복도'],['practice','출입 관리실'],['education','교육 실습실'],['storage','물류 보관실'],['access','기록 보관실'],['mirror','유리 관찰실'],['hall2','2층 복도'],['central','중앙관리실']];
  function locationControl(place,namespace){return `<div class="b0-location-control"><h1 class="b0-location ${namespace==='lab'?'lab-location':''}" hidden>${esc(place)}</h1><select class="b0-location-select" data-ui-location aria-label="위치 이동 (임시)" title="개발 확인용 임시 위치 이동"><option value="" selected disabled data-current-location>${esc(place)}</option>${destinations.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></div>`;}
  function setLocation(place,scope=document){const label=scope.querySelector('.b0-location'),option=scope.querySelector('[data-current-location]');if(label)label.textContent=place;if(option)option.textContent=place;}
  function header({place,namespace='action',reset='home',zoomClass='',active=false}){
    return `<header class="b0-hud"><div class="b0-hud-main">${locationControl(place,namespace)}<div class="b0-hud-tools">${button('처음 위치로',reset,namespace,active?'':'disabled')}${window.B0LessonJumpButton?.()||''}</div><nav aria-label="게임 메뉴"><div class="zoom-controls" role="group" aria-label="화면 배율">${button('−','zoom-out',namespace,`aria-label="축소" ${active?'':'disabled'}`)}<output class="${zoomClass}" hidden>100%</output>${button('+','zoom-in',namespace,`aria-label="확대" ${active?'':'disabled'}`)}</div>${button('메뉴','menu',namespace)}</nav></div></header>`;
  }
  function menuContent({namespace='action',close='close-modal',home='campaign-home',record='',extras=''}={}){
    const native=(text,action)=>button(text,action,namespace);
    return `<div class="b0-menu-list">${native('계속하기',close)}${namespace==='lab'?native('지도','map'):common('지도','map')}${common('소지품','inventory')}${common('사용법','help')}${record?native('기록 보기',record):common('기록 보기','record')}${native('시작 화면으로',home)}</div>${extras?`<details class="b0-settings"><summary>추가 설정</summary><div class="options">${extras}</div></details>`:''}`;
  }
  function dialogBody(body,namespace,action){
    const existing=body.includes(`data-${namespace}="${action}"`)||body.includes(`data-${namespace}='${action}'`);
    return body+(existing?'':`<div class="b0-dialog-footer">${button('닫기',action,namespace)}</div>`);
  }
  function close(){const d=document.querySelector('.b0-common-modal');d?.close();d?.remove();}
  function modal(title,body,back=true){
    document.querySelectorAll('#app dialog[open]').forEach(d=>{
      const nativeClose=d.querySelector('[data-action="close"],[data-c2="close-modal"],[data-ed="close-modal"],[data-c3="close-modal"],[data-mr="close-modal"],[data-c4="close-modal"],[data-lab="close"]');
      if(nativeClose)nativeClose.click();else d.close();
    });close();
    const d=document.createElement('dialog');d.className='b0-common-modal';
    d.innerHTML=`<header><h2>${title}</h2></header><div class="b0-modal-body">${dialogBody(body+(back&&returnMenu?common('메뉴로','back-menu'):''),'ui','close')}</div>`;
    document.querySelector('#app').append(d);d.addEventListener('close',()=>d.remove());d.showModal();
  }
  function read(key){try{const storage=location.pathname.endsWith('/preview-v2.html')?sessionStorage:localStorage;return JSON.parse(storage.getItem(key));}catch{return null;}}
  function inventory(){
    const one=read('project-b0-firstperson-v4'),nav=read('project-b0-lab-navigation-v1');
    const memory=read('project-b0-education-v1'),archive=read('project-b0-room3-v1');
    const items=[];if(memory?.memoryTaken)items.push('<li><b>기록 메모리</b><p>교육 실습실에서 복구한 수업 기록. '+(archive?.memoryConnected?'기록 보관실 컴퓨터에 연결되어 있습니다.':'외부 기록 컴퓨터에 연결할 수 있습니다.')+'</p></li>');if(one?.noteTaken)items.push('<li><b>관리용 쪽지</b><p>비상 출입번호: 4732</p></li>');if(nav?.keyTaken)items.push('<li><b>계단실 열쇠</b><p>계단 차단 제어기에서 사용하는 금속 열쇠.</p></li>');
    modal('소지품',items.length?`<ul class="b0-items">${items.join('')}</ul>`:'<p>아직 가지고 있는 물건이 없습니다.</p>');
  }
  function help(first=false){
    const body='<ul class="b0-help"><li><b>둘러보기</b><p>빈 공간을 끌어 시선을 돌립니다. 복도에서는 바닥을 누른 곳으로 걷습니다. 이동 버튼과 방향키도 사용할 수 있습니다.</p></li><li><b>조사하고 조작하기</b><p>물건을 눌러 살펴봅니다. 상자·손잡이처럼 움직이는 물건은 직접 끌거나 조사 창의 버튼으로 조작합니다.</p></li><li><b>B-0와 협력하기</b><p>B-0에게 말한 뒤 확인하거나 조작할 대상을 직접 고릅니다. 상자 위에서는 내려가기 버튼을 사용할 수 있습니다.</p></li><li><b>화면 조절</b><p>오른쪽 위 −·+로 배율을 조절합니다. 처음 위치로는 시점과 배율만 되돌립니다.</p></li><li><b>지도와 기록</b><p>메뉴에서 지도·소지품·사용법·기록 보기를 엽니다. 차시 이동 버튼은 개발 확인용 임시 기능입니다.</p></li></ul>';
    const room=document.querySelector('#app main');
    const detail=room?.classList.contains('ed-game')?'수업 화면에서 영상을 재생하거나 멈출 수 있습니다. 풀이 복원 단말기에서는 고칠 계산과 값을 직접 정합니다. B-0에게 필요한 설명이나 확인을 부탁할 수 있습니다.':room?.classList.contains('mr-game')?'손잡이는 누른 채 아래로 끌거나, 조사 창의 당기기 버튼으로 조작합니다.':room?.classList.contains('c4-game')?'연결 단자를 옆으로 끌어 분리하고 손잡이·잠금쇠를 직접 끌 수 있습니다. 각 장치의 조작 버튼도 사용할 수 있습니다.':room?.classList.contains('c3-game')?'보관장은 직접 끌거나 조사 창의 밀기 버튼으로 움직입니다.':room?.classList.contains('c2-game')?'상자는 누른 채 끌어서 옮깁니다. 짧게 눌러 올라서거나 내려갈 수 있습니다. 다른 상자 위에도 놓을 수 있습니다.':'';
    modal(first?'처음 조작 안내':'사용법',body+(detail?`<p>${detail}</p>`:'')+(first?common('알겠어, 시작하자','guide-done'):''),!first);
  }
  function record(){
    const one=read('project-b0-firstperson-v4'),education=read('project-b0-education-v1'),archive=read('project-b0-room3-v1');const learned=(education?.verified?'<p>수업 기록 017: 계산 순서를 수정하고 결과를 확인했다.</p>':'')+(archive?.diaryRead?'<p>비공개 교육 운영 일지: 정답률을 우선하면서 실패 기록을 제외하고 학생의 판단을 제한했다.</p>':'');modal('기록 보기',learned+(one?.logs?.length?`<ul>${one.logs.slice(-30).map(l=>`<li>${esc(l.text||l.kind||'탐색')}</li>`).join('')}</ul>`:learned?'':'<p>아직 기록이 없습니다.</p>'));
  }
  function handle(e){
    const control=e.target.closest('button[data-ui]');if(!control)return;
    e.preventDefault();e.stopPropagation();const action=control.dataset.ui;
    if(action==='close'||action==='guide-done'){close();return;}
    if(action==='back-menu'){const source=returnMenu;close();if(source?.isConnected)source.click();return;}
    if(action==='map'){const info=window.B0CampaignUI?.location?.()||{};modal('지도',window.B0LabNavigation.mapMarkup(info),false);}
    if(action==='inventory')inventory();if(action==='help')help();if(action==='record')record();
  }
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&['action','c2','c3','mr','c4','lab','ed'].some(ns=>b.getAttribute('data-'+ns)==='menu'))returnMenu=b;},true);
  document.addEventListener('click',handle,true);
  document.addEventListener('change',e=>{const control=e.target.closest?.('select[data-ui-location]');if(!control||!destinations.some(([id])=>id===control.value))return;const id=control.value;control.value='';window.B0CampaignUI?.travel?.(id);});
  function cameraActive(active,scope=document){scope.querySelector('.b0-hud')?.querySelectorAll?.('button')?.forEach(b=>{
    if(['action','c2','c3','mr','c4','lab','ed'].some(ns=>['home','view-home','zoom-in','zoom-out'].includes(b.getAttribute('data-'+ns))))b.disabled=!active;
  });}
  // Action overlays must never resize a world while the player drags an object.
  if(typeof ResizeObserver!=='undefined'&&typeof MutationObserver!=='undefined'){
  let observedActions=null;
  const actionSize=new ResizeObserver(entries=>{for(const {target} of entries){target.closest('main')?.style.setProperty('--b0-actions-height',target.getBoundingClientRect().height+'px');}});
  new MutationObserver(()=>{const current=document.querySelector('#app main>.c2-actions,#app main>.lab-actions');if(current===observedActions)return;actionSize.disconnect();observedActions=current;if(current)actionSize.observe(current);}).observe(document.querySelector('#app'),{childList:true,subtree:true});
  }
  window.B0UI={setLocation,showInventory:inventory,header,menuContent,dialogBody,cameraActive,inventoryButton:()=>common('소지품','inventory'),firstGuide(){try{if(localStorage.getItem('project-b0-controls-seen-v1'))return;localStorage.setItem('project-b0-controls-seen-v1','1');}catch{}help(true);}};
})();
