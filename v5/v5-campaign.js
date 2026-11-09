/* V5 replaces corridor routing; room controllers and original art are reused. */
(function(){
  'use strict';
  const M=window.B0V5Route;let route,stairsView=null,travelTimer=0,travelling=false;
  const facts=()=>M.facts(progressStore),readRoute=()=>{let raw;try{raw=JSON.parse(progressStore.getItem(M.key));}catch{}return M.restore(raw,facts());};
  route=readRoute();const persist=()=>progressStore.setItem(M.key,JSON.stringify(route));
  const originalStop=stopAdventure,originalStart=startAdventure;
  stopAdventure=function(){clearTimeout(travelTimer);travelling=false;stairsView?.dispose();stairsView=null;originalStop();};
  window.B0LessonJumpButton=()=>'';
  function mapMarkup(){const f=facts();return '<ol class="v5-route-map">'+M.steps.map((id,i)=>'<li data-current="'+(route.current===id)+'" data-open="'+M.canEnter(route,id,f)+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+M.names[id]+'</strong><small>'+(route.current===id?'지금 있는 곳':M.canEnter(route,id,f)?'연결된 방':'앞의 방에서 문 열기')+'</small></li>').join('')+'</ol>';}
  window.B0LabNavigation.mapMarkup=mapMarkup;
  function setPlace(id){if(!M.enter(route,id,facts()))return false;persist();navigation.mode='room';navigation.room=id;state.chapter={practice:1,education:2,reflection:3,stairs:3,central:4}[id];save();saveNavigation();const url=new URL(location.href);url.search='';url.searchParams.set('room',id);history.replaceState(null,'',url);return true;}
  function go(id,arrived=false){
    route=M.restore(route,facts());if(!M.canEnter(route,id,facts())){window.B0UI.showPanel('아직 문이 잠겨 있어요','<p>앞의 방에서 물건을 챙기고 문을 열어 주세요.</p>');return false;}
    window.B0RoomTransit?.cancel();stopAdventure();setPlace(id);
    if(id==='practice'){if(state.phase==='intro')opening();else enterRoom(false,true);if(state.phase==='escaped'&&!route.accessCard)rewardCard();}
    else if(id==='education')educationView=window.startEducationRoom({app,portrait,onHome:campaignHome,onPrevious:()=>travel('practice'),onBack:done=>done?travel('reflection'):travel('practice')});
    else if(id==='reflection')reflectionView=window.startReflectionRoom({app,onBack:()=>travel('education'),onComplete:()=>travel('stairs'),onHome:campaignHome});
    else if(id==='stairs')stairsView=window.startV5Stairs({app,portrait,state:route,facts,save:persist,onNext:()=>travel('central'),onBack:()=>travel('reflection'),onHome:campaignHome});
    else{navigation.floor=2;navigation.stairsUnlocked=true;chapterFour=window.startChapterFour({app,portrait,arrived,reflector:true,onBack:()=>travel('stairs'),onHome:campaignHome});}
    app.querySelector('main')?.classList.add('v5-room-arrival');return true;
  }
  function travel(id){
    route=M.restore(route,facts());if(travelling||!M.canEnter(route,id,facts()))return;travelling=true;app.querySelectorAll('dialog[open]').forEach(d=>d.close());
    const game=app.querySelector('main');game?.classList.add('v5-door-exit');
    travelTimer=setTimeout(()=>go(id,true),matchMedia('(prefers-reduced-motion: reduce)').matches?0:600);
  }
  function rewardCard(){window.B0UI.showPanel('문 안쪽에서 출입카드를 발견했다!','<div class="v5-reward-card" aria-hidden="true">B-0<br><strong>출입카드</strong><small>2F ACCESS</small></div><p>다음 문과 위층 제어기에 쓸 수 있다.</p><button data-v5="take-card" class="primary">출입카드 챙기고 교육관찰실로</button>',false);}
  ending=function(){roomView?.dispose();roomView=null;moving=false;if(route.accessCard)travel('education');else rewardCard();};
  walkIntoCorridor=function(){moving=false;ending();};
  showHall=function(from,completed=true){if(from==='practice'){ending();return;}const dest={education:completed?'reflection':'practice',reflection:completed?'stairs':'education',central:'stairs',storage:'education',access:'reflection',mirror:'reflection'}[from]||route.current;travel(dest);};
  enterEducation=function(){go('education');};enterReflection=function(){go('reflection');};enterChapterFour=function(){go('central');};enterPracticeVisit=function(){go('practice');};
  resumeAdventure=function(){route=readRoute();go(route.current);};
  startAdventure=function(){route=M.fresh();persist();originalStart();route=M.fresh();persist();setPlace('practice');};
  campaignHome=function(){stopAdventure();const saved=hasAdventure();const url=new URL(location.href);url.search='';history.replaceState(null,'',url);app.innerHTML='<main class="awakening campaign-home v5-home"><div class="face" role="img" aria-label="함께 탈출할 로봇 B-0">'+portrait()+'</div><div class="wake-controls"><small class="v5-version">PROJECT B-0 · V5</small><h1>문 너머, 다음 방으로</h1><p class="campaign-tagline">단서를 찾고, 도구를 챙겨 B-0와 탈출하자.</p><p class="v5-home-route">출입관리실 → 교육관찰실 → 거울관찰실 → 통제실</p><div class="campaign-buttons">'+btn('새 모험 시작','campaign-start','primary')+(saved?btn('이어하기','campaign-continue','secondary'):'')+'</div>'+(saved?'<small class="muted">'+M.names[route.current]+'에서 이어갈 수 있습니다.</small>':'')+'</div></main>';};
  inventory=function(){window.B0UI.showInventory();};
  window.B0CampaignUI={travel:id=>{if(M.steps.includes(id))go(id);},location:()=>({current:M.names[route.current],floor:route.current==='central'?2:1})};
  window.B0V5={current:()=>route.current,mapMarkup,facts,route:()=>route};
  app.addEventListener('click',e=>{const control=e.target.closest('[data-v5]');if(!control)return;e.preventDefault();if(control.dataset.v5==='take-card'&&M.takeCard(route,facts())){persist();travel('education');}});
  const requested=new URLSearchParams(location.search).get('room');if(M.steps.includes(requested)&&M.canEnter(route,requested,facts()))go(requested);else campaignHome();
})();
