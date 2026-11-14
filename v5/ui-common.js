(function(){
  'use strict';
  const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,namespace='ui',extra='')=>`<button type="button" data-${namespace}="${action}" ${extra}>${text}</button>`;
  const common=(text,action)=>button(text,action);
  let returnMenu=null;
  const destinations=[['practice','출입관리실'],['hall','출입관리실 앞 복도'],['education','교육관찰실'],['reflection','거울관찰실'],['stairs','계단 문'],['central','2층 통제실'],['survey','설문 바로 가기']];
  function locationControl(place,namespace){return `<div class="b0-location-control v5-location"><h1 class="b0-location" hidden>${esc(place)}</h1><select class="b0-location-select" data-ui-location aria-label="방 바로 가기"><option value="" selected disabled data-current-location>${esc(place)}</option>${destinations.map(([id,name])=>`<option value="${id}" ${id!=='survey'&&window.B0CampaignUI?.canTravel?.(id)===false?'disabled':''}>${esc(name)}</option>`).join('')}</select><small>V5</small></div>`;}
  function setLocation(place,scope=document){const label=scope.querySelector('.b0-location'),option=scope.querySelector('[data-current-location]');if(label)label.textContent=place;if(option)option.textContent=place;}
  function header({place,namespace='action',reset='home',zoomClass='',active=false}){
    return `<header class="b0-hud"><div class="b0-hud-main">${locationControl(place,namespace)}<div class="b0-hud-tools">${button('처음 위치로',reset,namespace,active?'':'disabled')}${window.B0LessonJumpButton?.()||''}</div><nav aria-label="게임 메뉴"><div class="zoom-controls" role="group" aria-label="화면 배율">${button('−','zoom-out',namespace,`aria-label="축소" ${active?'':'disabled'}`)}<output class="${zoomClass}" hidden>100%</output>${button('+','zoom-in',namespace,`aria-label="확대" ${active?'':'disabled'}`)}</div>${button('메뉴','menu',namespace)}</nav></div></header>`;
  }
  function menuContent({namespace='action',close='close-modal',home='campaign-home',record='',extras=''}={}){
    const native=(text,action)=>button(text,action,namespace);
    return `<div class="b0-menu-list">${native('계속하기',close)}${namespace==='lab'?native('지도','map'):common('지도','map')}${common('소지품','inventory')}${common('사용법','help')}${common('B-0 설정','robot-settings')}${record?native('기록 보기',record):common('기록 보기','record')}${native('시작 화면으로',home)}</div>${extras?`<details class="b0-settings"><summary>추가 설정</summary><div class="options">${extras}</div></details>`:''}`;
  }
  function dialogBody(body,namespace,action){
    // A worksheet, keypad or settings form still needs a way to leave unfinished.
    const editing=/<(?:form|input|select|textarea|video)\b|\baria-pressed\s*=/i.test(body);
    const buttons=/<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
    const closes=attrs=>attrs.includes(`data-${namespace}="${action}"`)||attrs.includes(`data-${namespace}='${action}'`);
    const enabled=attrs=>!/(?:^|\s)disabled(?:\s|=|$)/i.test(attrs);
    const alternatives=[...body.matchAll(buttons)].some(([,attrs])=>enabled(attrs)&&!closes(attrs));
    if(alternatives&&!editing)body=body.replace(buttons,(html,attrs,label)=>closes(attrs)&&/^\s*(?:닫기|선택 닫기|안내 닫기)\s*$/.test(label)?'':html);
    const existing=body.includes(`data-${namespace}="${action}"`)||body.includes(`data-${namespace}='${action}'`);
    return body+(existing||alternatives&&!editing?'':`<div class="b0-dialog-footer">${button('닫기',action,namespace)}</div>`);
  }
  function actionChoices(items){
    const choices=items.filter(([label])=>!['닫기','선택 닫기'].includes(label));
    return choices.length?choices:items;
  }
  function close(){const d=document.querySelector('.b0-common-modal');d?.close();d?.remove();}
  function modal(title,body,back=true){
    document.querySelectorAll('#app dialog[open]').forEach(d=>{
      const nativeClose=d.querySelector('[data-action="close"],[data-c2="close-modal"],[data-ed="close-modal"],[data-c3="close-modal"],[data-mr="close-modal"],[data-c4="close-modal"],[data-lab="close"],[data-rf="close-modal"]');
      if(nativeClose)nativeClose.click();else d.close();
    });close();
    const d=document.createElement('dialog');d.className='b0-common-modal';
    d.innerHTML=`<header><h2>${title}</h2></header><div class="b0-modal-body">${dialogBody(body+(back&&returnMenu?common('메뉴로','back-menu'):''),'ui','close')}</div>`;
    document.querySelector('#app').append(d);d.addEventListener('close',()=>d.remove());d.showModal();return d;
  }
  function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function inventory(){
    const one=read('project-b0-v5-firstperson-v4'),nav=read('project-b0-v5-lab-navigation-v1');
    const memory=read('project-b0-v5-education-v1'),archive=read('project-b0-v5-room3-v1');
    const items=[];const route=read('project-b0-v5-route-v1');if(route?.accessCard)items.push('<li><b>출입카드</b><p>출입관리실 앞 복도 바닥에서 찾은 카드. 계단 문 카드 리더에 사용할 수 있습니다.</p></li>');if(memory?.memoryTaken)items.push('<li><b>기록 메모리</b><p>교육관찰실에서 복구한 수업 기록. '+(archive?.memoryConnected?'기록 보관실 컴퓨터에 연결되어 있습니다.':'계단 문 전원 단자를 복구할 수 있습니다.')+'</p></li>');if(one?.noteTaken)items.push('<li><b>관리용 쪽지</b><p>비상 출입번호: 4732</p></li>');if(nav?.keyTaken)items.push('<li><b>계단실 열쇠</b><p>계단 차단 제어기에서 사용하는 금속 열쇠.</p></li>');
    const final=read('project-b0-v5-final-v2'),supply=window.B0CardBoss?.batterySupply(localStorage)||0,charges=[2,3,4,5].includes(final?.battle?.version)?final.battle.batteries:supply;
    items.push('<li><b>안전 팔찌</b><p>보호막이 액시엄의 공격을 막습니다. 보호막 에너지가 HP로 표시됩니다.</p></li>');
    if(supply||final?.battle)items.push('<li><b>보조 배터리 · '+charges+'개</b><p>출입관리실·교육관찰실·거울관찰실을 해결하면 한 개씩 챙깁니다. 통제실에서 사용하면 보호막 에너지 40을 회복합니다.</p></li>');
    if(final?.battle?.cardTaken)items.push('<li><b>해제 카드</b><p>'+(final.battle.released?'B-0의 잠금을 푸는 데 사용했습니다.':'액시엄의 보관함에서 꺼낸 카드. B-0의 가슴 슬롯에 넣을 수 있습니다.')+'</p></li>');
    if(read('project-b0-v5-reflection-v1')?.taken||final?.battle)items.push('<li><b>반사판</b><p>거울방에서 챙긴 반사판. 빛을 다른 쪽으로 보낼 수 있습니다.</p></li>');
    modal('소지품',items.length?`<ul class="b0-items">${items.join('')}</ul>`:'<p>아직 가지고 있는 물건이 없습니다.</p>');
  }
  function help(first=false){
    const body='<ul class="b0-help"><li><b>둘러보기</b><p>빈 곳을 끌어 시선을 돌리고 물건을 눌러 살펴봐요.</p></li><li><b>문 너머 다음 방</b><p>방에서 단서를 찾고 도구를 챙겨 출구를 열어요. 복도를 고르지 않고 다음 방으로 바로 이어져요.</p></li><li><b>B-0와 함께</b><p>B-0에게 물어보거나 소지품에서 가진 도구를 확인해요.</p></li><li><b>통제실 전투</b><p>좌우 이동으로 탄을 피하면 반사판이 자동으로 공격해요. 규칙 버튼으로 잠시 멈출 수 있어요.</p></li></ul>';
    const room=document.querySelector('#app main');
    const detail=room?.dataset.cardBattle==='true'?'마우스를 좌우로 움직이거나 화면을 손가락으로 끌면 B-0와 돔형 보호막이 함께 이동합니다. 좌우 방향키로도 이동합니다. 반사판은 자동으로 발사하며, 액시엄 중앙 아래에서 반사탄 6번을 맞히면 승리합니다. 액시엄의 탄은 중앙에서만 나옵니다. 보조 배터리 버튼이나 B 키로 보호막을 회복하고, 규칙을 열어 일시정지합니다.':room?.classList.contains('ed-game')?'수업 화면에서 영상을 재생하거나 멈출 수 있습니다. 풀이 복원 단말기에서는 고칠 계산과 값을 직접 정합니다. B-0에게 필요한 설명이나 확인을 부탁할 수 있습니다.':room?.classList.contains('mr-game')?'손잡이는 누른 채 아래로 끌거나, 조사 창의 당기기 버튼으로 조작합니다.':room?.classList.contains('rf-game')?'거울방에서는 바닥을 누르거나 ↑·↓ 버튼으로 걸어요. 빈 곳을 끌면 둘러볼 수 있어요. 빛을 켠 다음 거울 A나 B를 돌리며 빛이 가는 길을 살펴보세요. 방 안내를 누르면 설명을 다시 볼 수 있어요.':room?.classList.contains('c4-game')?'연결 단자를 옆으로 끌어 분리하고 손잡이·잠금쇠를 직접 끌 수 있습니다. 각 장치의 조작 버튼도 사용할 수 있습니다.':room?.classList.contains('c3-game')?'보관장은 직접 끌거나 조사 창의 밀기 버튼으로 움직입니다.':room?.classList.contains('c2-game')?'상자는 누른 채 끌어서 옮깁니다. 짧게 눌러 올라서거나 내려갈 수 있습니다. 다른 상자 위에도 놓을 수 있습니다.':'';
    modal(first?'처음 조작 안내':'사용법',body+(detail?`<p>${detail}</p>`:'')+(first?common('알겠어, 시작하자','guide-done'):''),!first);
  }
  function record(){
    const one=read('project-b0-v5-firstperson-v4'),education=read('project-b0-v5-education-v1'),archive=read('project-b0-v5-room3-v1');const learned=(education?.verified?'<p>수업 기록 017: 계산 순서를 수정하고 결과를 확인했다.</p>':'')+(archive?.diaryRead?'<p>비공개 교육 운영 일지: 정답률을 우선하면서 실패 기록을 제외하고 학생의 판단을 제한했다.</p>':'');modal('기록 보기',learned+(one?.logs?.length?`<ul>${one.logs.slice(-30).map(l=>`<li>${esc(l.text||l.kind||'탐색')}</li>`).join('')}</ul>`:learned?'':'<p>아직 기록이 없습니다.</p>'));
  }
  function handle(e){
    const control=e.target.closest('button[data-ui]');if(!control)return;
    e.preventDefault();e.stopPropagation();const action=control.dataset.ui;
    if(action==='close'||action==='guide-done'){close();return;}
    if(action==='back-menu'){const source=returnMenu;close();if(source?.isConnected)source.click();return;}
    if(action==='map'){const info=window.B0CampaignUI?.location?.()||{};modal('지도',window.B0LabNavigation.mapMarkup(info),false);}
    if(action==='robot-settings'){settings();return;}
    if(action.startsWith('address-')){const choice=window.B0Preferences?.set(action.slice(8));if(choice){settings(choice.persisted?'저장했습니다. 다음 대화부터 적용됩니다.':'이 기기에서 저장할 수 없어 이번 접속 중에만 적용됩니다.');document.querySelector(`[data-ui="${action}"]`)?.focus();}return;}
    if(action==='inventory')inventory();if(action==='help')help();if(action==='record')record();
  }
  function settings(message=''){const prefs=window.B0Preferences,current=prefs?.get()||{address:'owner'};modal('B-0 설정',`<p>B-0가 나를 어떻게 부르면 좋을까?</p><div class="b0-address-options">${Object.entries(prefs?.addresses||{owner:'주인님',friend:'친구',explorer:'탐험가'}).map(([id,label])=>button(label,'address-'+id,'ui',`aria-pressed="${current.address===id}"`)).join('')}</div><form id="b0-custom-address-form" class="b0-custom-address"><label for="b0-custom-address">직접 입력할 호칭</label><p id="b0-address-hint">원하는 별명이나 호칭을 1~20자로 적어 주세요.</p><div><input type="text" id="b0-custom-address" name="address" maxlength="40" autocomplete="off" aria-describedby="b0-address-hint b0-address-error" value="${esc(current.customName||'')}" placeholder="예: 별이"><button type="submit">이 호칭으로 저장</button></div><p id="b0-address-error" role="alert" hidden></p></form><div class="speech robot"><b>B-0</b><p>${esc(prefs?.robotText('알겠습니다, 주인님. 함께 살펴보겠습니다.')||'알겠습니다, 주인님.')}</p></div><p role="status">${esc(message)}</p><small>호칭 설정은 게임 진행과 따로 저장됩니다.</small>`);}
  document.addEventListener('submit',e=>{if(e.target.id!=='b0-custom-address-form')return;e.preventDefault();const input=e.target.querySelector('input'),choice=window.B0Preferences?.setCustom(input.value);if(!choice){const error=e.target.querySelector('[role="alert"]');error.textContent='호칭을 1~20자로 입력해 주세요.';error.hidden=false;input.setAttribute('aria-invalid','true');input.focus();return;}settings(choice.persisted?'저장했습니다. 다음 대화부터 적용됩니다.':'이 기기에서 저장할 수 없어 이번 접속 중에만 적용됩니다.');document.querySelector('#b0-custom-address')?.focus();});
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&['action','c2','c3','mr','c4','lab','ed','rf','v5-hall'].some(ns=>b.getAttribute('data-'+ns)==='menu'))returnMenu=b;},true);
  document.addEventListener('click',handle,true);
  document.addEventListener('change',e=>{const control=e.target.closest?.('select[data-ui-location]');if(!control||!destinations.some(([id])=>id===control.value))return;const id=control.value;control.value='';if(id==='survey'){location.assign('./survey.html');return;}window.B0CampaignUI?.travel?.(id);});
  function cameraActive(active,scope=document){scope.querySelector('.b0-hud')?.querySelectorAll?.('button')?.forEach(b=>{
    if(['action','c2','c3','mr','c4','lab','ed','rf'].some(ns=>['home','view-home','zoom-in','zoom-out'].includes(b.getAttribute('data-'+ns))))b.disabled=!active;
  });}
  // Action overlays must never resize a world while the player drags an object.
  if(typeof ResizeObserver!=='undefined'&&typeof MutationObserver!=='undefined'){
  let observedActions=null;
  const actionSize=new ResizeObserver(entries=>{for(const {target} of entries){target.closest('main')?.style.setProperty('--b0-actions-height',target.getBoundingClientRect().height+'px');}});
  new MutationObserver(()=>{const current=document.querySelector('#app main>.c2-actions,#app main>.lab-actions');if(current===observedActions)return;actionSize.disconnect();observedActions=current;if(current)actionSize.observe(current);}).observe(document.querySelector('#app'),{childList:true,subtree:true});
  }
  window.B0UI={setLocation,showPanel:modal,showInventory:inventory,header,menuContent,dialogBody,actionChoices,cameraActive,inventoryButton:()=>common('소지품','inventory'),firstGuide(){try{if(localStorage.getItem('project-b0-v5-controls-seen-v1'))return;localStorage.setItem('project-b0-v5-controls-seen-v1','1');}catch{}modal('문 너머로 가는 모험','<p>물건과 B-0를 눌러 단서를 찾아요.</p><p>문을 열면 다음 방으로 바로 이어져요.</p>'+common('시작하자','guide-done'),false);}};
})();
