/* V5 replaces corridor routing; room controllers and original art are reused. */
(function(){
  'use strict';
  const M=window.B0V5Route;let route,stairsView=null,travelTimer=0,travelling=false;
  const isTest=()=>!!window.B0V5Test&&progressStore===window.B0V5Test.store;
  const facts=()=>M.facts(progressStore),readRoute=()=>{let raw;try{raw=JSON.parse(progressStore.getItem(M.key));}catch{}return M.restore(raw,facts());};
  route=readRoute();const persist=()=>progressStore.setItem(M.key,JSON.stringify(route));
  const originalStop=stopAdventure,originalStart=startAdventure;
  stopAdventure=function(){clearTimeout(travelTimer);travelling=false;stairsView?.dispose();stairsView=null;originalStop();};
  window.B0LessonJumpButton=()=>'';
  function mapMarkup(){const f=facts();return '<ol class="v5-route-map">'+M.steps.map((id,i)=>'<li data-current="'+(route.current===id)+'" data-open="'+M.canEnter(route,id,f)+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+M.names[id]+'</strong><small>'+(route.current===id?'지금 있는 곳':M.canEnter(route,id,f)?'연결된 방':'앞의 방에서 문 열기')+'</small></li>').join('')+'</ol>';}
  window.B0LabNavigation.mapMarkup=mapMarkup;
  function setPlace(id){if(!M.enter(route,id,facts()))return false;persist();navigation.mode='room';navigation.room=id;state.chapter={practice:1,hall:1,education:2,control:3,reflection:3,stairs:3,central:4}[id];save();saveNavigation();const url=new URL(location.href);url.search='';url.searchParams.set('room',id);if(isTest())url.searchParams.set('test','1');history.replaceState(null,'',url);return true;}
  function go(id,arrived=false){
    route=M.restore(route,facts());if(!M.canEnter(route,id,facts())){window.B0UI.showPanel('아직 문이 잠겨 있어요','<p>앞의 방에서 물건을 챙기고 문을 열어 주세요.</p>');return false;}
    window.B0RoomTransit?.cancel();stopAdventure();setPlace(id);
    if(id==='practice'){if(state.phase==='intro')opening();else enterRoom(false,true);}
    else if(id==='hall'){entryHall();if(!route.accessCard)rewardCard();}
    else if(id==='education')educationView=window.startEducationRoom({app,portrait,store:progressStore,onHome:campaignHome,onPrevious:()=>travel('practice'),onBack:done=>done?travel('control'):travel('practice')});
    else if(id==='control')chapterThree=window.startChapterThree({app,portrait,store:progressStore,onBack:()=>travel('education'),onNext:()=>travel('reflection'),onHome:campaignHome});
    else if(id==='reflection')reflectionView=window.startReflectionRoom({app,store:progressStore,onBack:()=>travel('control'),onComplete:()=>travel('stairs'),onHome:campaignHome});
    else if(id==='stairs')stairsView=window.startV5Stairs({app,portrait,state:route,facts,save:persist,onNext:()=>travel('central'),onBack:()=>travel('reflection'),onHome:campaignHome});
    else{navigation.floor=2;navigation.stairsUnlocked=true;chapterFour=window.startChapterFour({app,portrait,store:progressStore,arrived,reflector:true,onBack:()=>travel('stairs'),onHome:campaignHome});}
    app.querySelector('main')?.classList.add('v5-room-arrival');return true;
  }
  function travel(id){
    route=M.restore(route,facts());if(travelling||!M.canEnter(route,id,facts()))return;travelling=true;app.querySelectorAll('dialog[open]').forEach(d=>d.close());
    const game=app.querySelector('main');game?.classList.add('v5-door-exit');
    travelTimer=setTimeout(()=>go(id,true),matchMedia('(prefers-reduced-motion: reduce)').matches?0:600);
  }
  function testTravel(id){
    if(!M.steps.includes(id))return;stopAdventure();progressStore=window.B0V5Test.store;
    window.B0V5Test.prepare(id,progressStore,{route:M,education:window.B0Education,control:window.B0RoomThree,reflection:window.B0Reflection,first:fresh});
    state=load()||fresh();navigation=loadNavigation();route=readRoute();if(id==='practice'){logicTrial=null;codeDraft='';}go(id,true);
  }
  function exitTest(){stopAdventure();progressStore=localStorage;state=load()||fresh();navigation=loadNavigation();route=readRoute();campaignHome();}
  function entryHall(){app.innerHTML='<main class="game v5-entry-hall">'+window.B0UI.header({place:'출입관리실 앞 복도',namespace:'v5-hall',active:false})+'<section class="v5-entry-hall-scene" aria-label="출입관리실 문 밖의 복도"><div class="v5-entry-hall-sign">교육관찰실 →</div>'+(!route.accessCard?'<button class="v5-floor-card" data-v5="inspect-card" aria-label="복도 바닥의 출입카드 살펴보기">B-0<br><b>출입카드</b></button>':'')+'<div class="v5-hall-robot robot-sprite live-body">'+portrait()+'</div></section><section class="c2-actions"><strong>'+(route.accessCard?'출입카드를 챙겼다. 다음 문은 교육관찰실이다.':'복도로 나왔다. 바닥에서 카드가 반짝인다.')+'</strong><div><button data-v5="hall-education" class="primary" '+(route.accessCard?'':'disabled')+'>교육관찰실 문 열기</button><button data-v5="hall-practice">출입관리실로 돌아가기</button></div></section><footer>'+window.B0UI.inventoryButton()+'</footer></main>';}
  function rewardCard(){window.B0UI.showPanel('복도에서 출입카드를 발견했다!','<div class="v5-reward-card" aria-hidden="true">B-0<br><strong>출입카드</strong><small>2F ACCESS</small></div><p>출입관리실을 나와 보니 복도 바닥에 카드가 떨어져 있다.</p><button data-v5="take-card" class="primary">출입카드 챙기기</button>',false);}
  ending=function(){roomView?.dispose();roomView=null;moving=false;travel('hall');};
  walkIntoCorridor=function(){moving=false;ending();};
  showHall=function(from,completed=true){if(from==='practice'){ending();return;}const dest={education:completed?'control':'practice',control:completed?'reflection':'education',reflection:completed?'stairs':'control',central:'stairs',storage:'education',access:'control',mirror:'reflection'}[from]||route.current;travel(dest);};
  enterEducation=function(){go('education');};enterReflection=function(){go('reflection');};enterChapterFour=function(){go('central');};enterPracticeVisit=function(){go('practice');};
  resumeAdventure=function(){route=readRoute();go(route.current==='practice'&&state.phase==='escaped'&&!route.accessCard?'hall':route.current);};
  startAdventure=function(){route=M.fresh();persist();originalStart();route=M.fresh();persist();setPlace('practice');};
  campaignHome=function(){stopAdventure();const saved=hasAdventure();const url=new URL(location.href);url.search='';if(isTest())url.searchParams.set('test','1');history.replaceState(null,'',url);app.innerHTML='<main class="awakening campaign-home v5-home"><div class="face" role="img" aria-label="함께 탈출할 로봇 B-0">'+portrait()+'</div><div class="wake-controls"><small class="v5-version">PROJECT B-0 · V5</small><h1>문 너머, 다음 방으로</h1><p class="campaign-tagline">단서를 찾고, 도구를 챙겨 B-0와 탈출하자.</p><p class="v5-home-route">출입관리실 → 교육관찰실 → 관제 기록실 → 거울관찰실 → 통제실</p><div class="campaign-buttons">'+btn('새 모험 시작','campaign-start','primary')+(saved?btn('이어하기','campaign-continue','secondary'):'')+'</div>'+(saved?'<small class="muted">'+M.names[route.current]+'에서 이어갈 수 있습니다.</small>':'')+(isTest()?'<button data-ui="exit-test">일반 모험으로 돌아가기</button>':'')+'</div></main>';};
  inventory=function(){window.B0UI.showInventory();};
  window.B0CampaignUI={travel:testTravel,canTravel:id=>M.steps.includes(id),isTest,storage:()=>progressStore,exitTest,location:()=>({current:M.names[route.current],floor:route.current==='central'?2:1})};
  window.B0V5={current:()=>route.current,mapMarkup,facts,route:()=>route};
  app.addEventListener('click',e=>{const hall=e.target.closest('[data-v5-hall="menu"]');if(hall){e.preventDefault();window.B0UI.showPanel('메뉴','<button data-ui="close">계속하기</button><button data-ui="inventory">소지품</button><button data-ui="map">지도</button><button data-v5="hall-home">시작 화면으로</button>'+(isTest()?'<button data-ui="exit-test">일반 모험으로 돌아가기</button>':''));return;}const control=e.target.closest('[data-v5]');if(!control||control.disabled)return;e.preventDefault();const a=control.dataset.v5;if(a==='take-card'&&M.takeCard(route,facts())){persist();app.querySelectorAll('dialog[open]').forEach(d=>d.close());entryHall();}if(a==='inspect-card'&&!route.accessCard)rewardCard();if(a==='hall-education'&&route.accessCard)travel('education');if(a==='hall-practice')travel('practice');if(a==='hall-home')campaignHome();});
  const requested=new URLSearchParams(location.search).get('room');if(M.steps.includes(requested)){if(isTest()&&!M.canEnter(route,requested,facts()))testTravel(requested);else if(M.canEnter(route,requested,facts()))go(requested);else campaignHome();}else campaignHome();
})();
