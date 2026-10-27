(function(){
  'use strict';
  window.startChapterThree=function({app,portrait,onBack,onNext,onCorridor,onHome,showCompleted=false,preview=false}){
    const SPACE=1.95;
    const M=window.B0RoomThree,storage=preview?sessionStorage:localStorage,key='project-b0-room3-v1';
    let s;try{s=M.restore(JSON.parse(storage.getItem(key)));}catch{s=M.fresh();}
    let camera={x:0,z:30,yaw:-12,pitch:-8,zoom:1},stage,world,bar,speech,selection=null,pointer=null,suppress=false,dead=false,busy=false,cameraMoving=false,frame=0,mode=null,conversation=null;
    const helperPosition=()=>({x:-195,z:s.shelfZ+(s.shelfZ>=0?-90:90)});
    let robot=s.helper?helperPosition():{x:120,z:-190},timers=[],mirrorView=null;
    if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('room')==='mirror')s.phase='mirror';
    else if(onCorridor&&!showCompleted&&['gate','complete'].includes(s.phase))s.phase='room';
    function mirrorUrl(active){if(typeof location==='undefined')return;const url=new URL(location.href);if(active)url.searchParams.set('room','mirror');else url.searchParams.delete('room');history.replaceState(null,'',url);}
    const intro=[['student','기록 보관실이네. 출구에 관한 기록도 있을까?'],['robot','제 지도에는 이곳에 시설 출입 기록을 보관한다고 나옵니다.'],['student','지금도 그런지는 직접 봐야겠지.'],['robot','네. 함께 확인해 보겠습니다.']];
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const b=(label,action,cls='')=>`<button type="button" data-c3="${action}" class="${cls}">${label}</button>`;
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save=()=>{try{storage.setItem(key,JSON.stringify(s));}catch{}};
    function later(fn,ms){const t=setTimeout(()=>{if(!dead)fn();},ms);timers.push(t);}
    function actions(title,items=[]){bar.innerHTML=`<strong>${esc(title)}</strong><div>${items.map(([label,action,cls])=>b(label,action,cls||'')).join('')}</div>`;}
    function clearSelection(){
      if(cameraMoving){cancelAnimationFrame(frame);cameraMoving=false;busy=false;}mode=null;selection=null;conversation=null;if(speech)speech.hidden=true;actions('');
    }
    function clearSelectionOnLook(){if(selection&&!mode&&!conversation)clearSelection();}
    function say(who,text){
      if(!speech)return;speech.hidden=false;speech.innerHTML=`<div class="speech ${who}"><b>${who==='robot'?'B-0':'나'}</b><p>${esc(text)}</p></div>${b(conversation?'다음':'대화 닫기',conversation?'talk-next':'dismiss','quiet')}`;
      const actor=app.querySelector('.robot-sprite');if(actor){actor.classList.toggle('speaking',who==='robot');later(()=>actor.classList.remove('speaking'),Math.min(4500,text.length*85));}
    }
    function talk(lines,done){conversation={lines,index:0,done};say(...lines[0]);}
    function nextTalk(){if(!conversation)return;const c=conversation;c.index++;if(c.index<c.lines.length)say(...c.lines[c.index]);else{conversation=null;speech.hidden=true;c.done?.();}}
    function mapArt(){return `<svg class="c3-map-art" viewBox="0 0 260 200" role="img" aria-label="옛 배치도. 기록 보관실 앞쪽 문에서 외부 통로로 이어지는 기록"><rect x="44" y="62" width="172" height="115" fill="#b9c4bf" stroke="#394f58" stroke-width="5"/><path d="M114 62h32" stroke="#dce6cf" stroke-width="9"/><path d="M130 139V28m-14 15 14-15 14 15" fill="none" stroke="#387b82" stroke-width="7"/><circle cx="130" cy="145" r="8" fill="#a75e44"/><text x="130" y="19" text-anchor="middle">외부 통로</text><text x="130" y="94" text-anchor="middle">기록 보관실</text><text x="130" y="168" text-anchor="middle">들어온 곳</text></svg>`;}
    function cube(w,h,d,cls='',id=''){return `<div class="c2-cube ${cls}" style="--w:${w}px;--h:${h}px;--d:${d}px;width:${w}px;height:${h}px">${['front','back','left','right','top'].map(f=>`<div class="c2-face c2-${f}" ${f==='front'&&id?`data-object="${id}" role="button" tabindex="0" aria-label="${id==='shelf'?'바퀴 달린 보관장':'기록 서랍이 있는 책상'}"`:''}>${f==='front'?'<i></i>':''}</div>`).join('')}</div>`;}
    function render(){
      mirrorView?.dispose();mirrorView=null;
      conversation=null;pointer=null;selection=null;mode=null;
      if(s.phase==='mirror'){renderMirror();return;}
      if(s.phase==='intro'){renderIntro();return;}if(s.phase==='gate'){renderGate();return;}if(s.phase==='complete'){renderEnd();return;}
      app.innerHTML=`<main class="game c2-game c3-game">${window.B0UI?.header({place:`기록 보관실`,namespace:"c3",reset:"home",zoomClass:"c3-zoom",active:true})||""}
      <section class="c2-stage c3-stage" tabindex="0" aria-label="기록 보관실. 빈 공간을 끌어 둘러보고 물건을 눌러 살펴보세요."><div class="c2-world c3-world">
      ${['front','left','right','back'].map(f=>`<div class="c2-wall c2-wall-${f}"><div class="c3-conduit" aria-hidden="true"></div><div class="c3-riser" aria-hidden="true"></div><div class="c2-light"></div></div>`).join('')}<div class="c2-floor"></div><div class="c2-ceiling"></div><div class="sf-archive-console" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="c3-junction" aria-hidden="true"><i></i><i></i><span></span></div><div class="c3-room-plaque" aria-hidden="true"><small>RECORD ARCHIVE</small><strong>기록 보관실</strong></div><div class="c3-clock" aria-hidden="true"><i></i><i></i></div>
      <div class="c3-observation" aria-hidden="true"><div class="c3-observation-frame"><span></span><span></span><span></span><small>관찰창</small></div></div>
      <div class="c3-record-wall" aria-hidden="true"><div class="c3-record-window"><span>출입 기록 보관</span><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
      <div class="c3-old-exit" data-object="oldDoor" role="button" tabindex="0" aria-label="출구 표지판이 있는 문"><span class="c3-exit-sign">출구</span><span class="c3-brick-wall"></span><span class="c3-old-leaf"><i></i></span></div>
      <button class="c3-map-board" data-object="map" aria-label="벽면 배치도"><strong>시설 배치도</strong>${mapArt()}<small>배치 기록 01</small></button>
      <div class="c3-real-exit" data-object="exit" role="button" tabindex="-1" aria-label="보관장 뒤의 문" aria-hidden="true"><span class="c3-exit-space"></span><span class="c3-real-leaf"><i></i></span></div>
      <div class="c3-tracks" data-object="floor" role="button" tabindex="0" aria-label="보관장 주변 바닥"></div><button class="c3-gap" data-object="gap" aria-label="보관장 아래쪽 틈"></button>
      <div class="c3-shelf-anchor" data-object="shelf">${cube(154,210,74,'c3-shelf','shelf')}<span class="c3-shelf-load load-a"></span><span class="c3-shelf-load load-b"></span><span class="c3-shelf-load load-c"></span><span class="c3-wheel wheel-a"></span><span class="c3-wheel wheel-b"></span></div>
      <div class="c3-desk" data-object="desk">${cube(135,90,75,'c3-desk-cube','desk')}<div class="c3-monitor"><span><small>출입 기록</small><i></i><em>연결 끊김</em></span></div><div class="c3-keyboard"></div><div class="c3-drawer"><span></span><button class="c3-record-paper" data-object="record" aria-label="서랍 안의 공사 기록" hidden>개조 기록</button></div></div>
      <div class="c2-robot c3-robot" data-object="robot" role="button" tabindex="0" aria-label="B-0"><div class="robot-sprite live-body">${portrait()}</div></div>
      </div><p class="c2-basic-help">빈 공간을 끌어 둘러보기 · 물건을 눌러 살펴보기</p><div class="c2-speech c3-speech" aria-live="polite" hidden></div></section>
      <section class="c2-actions c3-actions" aria-label="선택한 물건의 행동"><p>방 안을 자유롭게 살펴보세요.</p></section><footer>${b('B-0에게 말하기','robot','secondary')}${window.B0UI?.inventoryButton()||''}</footer></main>`;
      stage=app.querySelector('.c3-stage');world=app.querySelector('.c3-world');bar=app.querySelector('.c3-actions');speech=app.querySelector('.c3-speech');
      stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',cancelPointer);
      stage.addEventListener('click',e=>{if(suppress){suppress=false;return;}if(busy||e.target.closest('[data-c3]'))return;const id=e.target.closest('[data-object]')?.dataset.object;if(id)activateObject(id);else if(!mode&&!conversation)clearSelection();});
      stage.addEventListener('wheel',e=>{e.preventDefault();if(!busy){camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom-e.deltaY*.001));updateCamera();}},{passive:false});
      stage.addEventListener('keydown',e=>{if(busy)return;if((e.key==='Enter'||e.key===' ')&&e.target.dataset.object){e.preventDefault();activateObject(e.target.dataset.object);return;}const dirs={ArrowLeft:-15,ArrowRight:15};if(dirs[e.key]){e.preventDefault();clearSelectionOnLook();camera.yaw+=dirs[e.key];updateCamera();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();clearSelectionOnLook();camera.pitch+=e.key==='ArrowUp'?8:-8;updateCamera();}});
      update();
    }
    function renderMirror(){
      s.mirror=window.B0Mirror.restore(s.mirror);mirrorUrl(true);save();
      mirrorView=window.startMirrorRoom({app,portrait,state:s.mirror,onSave:save,onHome,onBack:()=>{s.phase=s.approval==='rejected'?'gate':'room';mirrorUrl(false);save();render();},onComplete:()=>{if(M.finish(s)){mirrorUrl(false);save();render();}}});
    }
    function updateCamera(){
      if(s.phase!=='room'||!stage?.isConnected)return;
      camera.yaw=((camera.yaw+180)%360+360)%360-180;camera.pitch=Math.max(-65,Math.min(45,camera.pitch));
      const f=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;stage.style.perspective=f+'px';
      world.style.transform=`translateZ(${f}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(${-camera.x*SPACE}px,0px,${-camera.z*SPACE}px)`;
      stage.dataset.yaw=camera.yaw;stage.dataset.pitch=camera.pitch;
      app.querySelector('.c3-robot').style.transform=`translate3d(${robot.x-48}px,24px,${robot.z}px) rotateY(${-camera.yaw}deg)`;
      window.B0RoomSpace?.sync(world);
      app.querySelector('.c3-zoom').textContent=Math.round(camera.zoom*100)+'%';
    }
    function update(){
      if(s.phase!=='room')return;
      app.querySelector('.c3-old-exit').classList.toggle('open',s.oldDoorOpen);app.querySelector('.c3-desk').classList.toggle('open',s.drawerOpen);app.querySelector('.c3-record-paper').hidden=!s.drawerOpen;
      app.querySelector('.c3-shelf-anchor').style.transform=`translate3d(-250px,180px,${s.shelfZ}px) rotateY(90deg)`;
      const door=app.querySelector('.c3-real-exit');door.setAttribute('aria-hidden',String(!M.clear(s)));door.tabIndex=M.clear(s)?0:-1;door.classList.toggle('open',s.realDoorOpen);
      app.querySelector('.c3-robot').classList.toggle('helping',s.helper&&!M.clear(s));updateCamera();
    }
    function animateCamera(to,done){
      cancelAnimationFrame(frame);busy=true;cameraMoving=true;pointer=null;const from={...camera},start=performance.now(),turn=(((to.yaw??from.yaw)-from.yaw+540)%360)-180;
      function step(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-start)/650),e=v*v*(3-2*v);for(const k of ['x','z','pitch','zoom'])camera[k]=from[k]+((to[k]??from[k])-from[k])*e;camera.yaw=from.yaw+turn*e;updateCamera();if(v<1)frame=requestAnimationFrame(step);else{busy=false;cameraMoving=false;done?.();}}
      frame=requestAnimationFrame(step);
    }
    function approach(id){
      const targets={oldDoor:{x:45,z:-120,yaw:12,pitch:-8},map:{x:-80,z:-100,yaw:-22,pitch:10},shelf:{x:-75,z:0,yaw:-90,pitch:-10},floor:{x:-75,z:0,yaw:-90,pitch:-48},gap:{x:-75,z:0,yaw:-90,pitch:-36},desk:{x:65,z:85,yaw:90,pitch:-20},record:{x:65,z:85,yaw:90,pitch:-28},exit:{x:-85,z:0,yaw:-90,pitch:-8}};
      if(targets[id])animateCamera(targets[id]);
    }
    function activateObject(id){if(busy)return;if(!mode&&id==='exit'&&s.realDoorOpen){leaveRoom();return;}select(id);}
    function select(id){
      if(id==='exit'&&!M.clear(s))return;if(id==='record'&&!s.drawerOpen)return;
      if(mode==='check'){mode=null;M.inspect(s,id);save();say('robot',M.reply(s,'check',id));showActions(id);return;}
      if(mode==='help'){mode=null;if(id==='shelf')helpShelf();else{say('robot','이 물건은 함께 밀어 움직일 수 없습니다.');robotMenu();}return;}
      conversation=null;selection=id;speech.hidden=true;showActions(id);if(id!=='robot')approach(id);
    }
    function showActions(id){
      selection=id;
      if(id==='robot'){robotMenu();return;}
      if(id==='oldDoor')actions('출구 표지판이 있는 문',[['살펴보기','inspect-oldDoor'],[s.oldDoorOpen?'문 닫기':'문 열어 보기','old-door'],['B-0에게 확인 부탁','ask-oldDoor'],['선택 닫기','clear']]);
      else if(id==='map')actions('벽면 배치도',[['가까이 읽기','inspect-map'],['B-0의 지도와 비교','ask-map'],['선택 닫기','clear']]);
      else if(id==='desk')actions('기록 책상',[['살펴보기','inspect-desk'],[s.drawerOpen?'서랍 닫기':'서랍 열기','drawer'],...(s.drawerOpen?[['공사 기록 읽기','inspect-record']]:[]),['선택 닫기','clear']]);
      else if(id==='record')actions('공사 기록',[['읽기','inspect-record'],['B-0에게 확인 부탁','ask-record'],['선택 닫기','clear']]);
      else if(id==='shelf')actions('바퀴 달린 보관장',[['살펴보기','inspect-shelf'],['밀어 보기','push-menu'],['B-0에게 부탁','shelf-requests'],['선택 닫기','clear']]);
      else if(id==='floor'||id==='gap')actions(id==='floor'?'보관장 주변 바닥':'아래쪽 틈',[['살펴보기','inspect-'+id],['B-0에게 확인 부탁','ask-'+id],['선택 닫기','clear']]);
      else if(id==='exit')actions('보관장에 가려져 있던 문',[['살펴보기','inspect-exit'],[s.realDoorOpen?'문 너머로 이동':'문 열기',s.realDoorOpen?'leave':'open-exit'],['선택 닫기','clear']]);
    }
    function robotMenu(){actions('B-0에게 물어보기',[['어디로 나가?','ask-route'],['무엇을 보고 말한 거야?','ask-basis'],['내가 고른 곳 확인해 줘','request-check'],['같이 밀어 줘','request-help'],['닫기','clear']]);}
    function shelfRequests(){actions('보관장의 어느 부분을 확인할까?',[['바닥을 살펴봐 줘','ask-floor'],['아래쪽 틈을 봐 줘','ask-gap'],['같이 밀어 줘','help-shelf'],['돌아가기','select-shelf']]);}
    function helpShelf(){
      if(s.helper){say('robot','같이 밀 준비가 되어 있습니다. 움직일 방향은 직접 정해 주세요.');showActions('shelf');return;}
      cancelAnimationFrame(frame);cameraMoving=false;busy=true;const from={...robot},to=helperPosition(),start=performance.now();say('robot','옆에서 함께 밀겠습니다.');
      app.querySelector('.c3-robot').classList.add('walking');
      function step(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-start)/850);robot={x:from.x+(to.x-from.x)*v,z:from.z+(to.z-from.z)*v};updateCamera();if(v<1)frame=requestAnimationFrame(step);else{busy=false;s.helper=true;M.note(s,'help','shelf');save();app.querySelector('.c3-robot').classList.remove('walking');update();showActions('shelf');}}
      frame=requestAnimationFrame(step);
    }
    function shelfRay(x,y){
      const r=stage.getBoundingClientRect(),f=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;
      const sx=(x-r.left-r.width/2)/f,sy=(y-r.top-r.height/2)/f,a=camera.yaw*Math.PI/180,p=camera.pitch*Math.PI/180;
      const zz=-Math.sin(p)*sy-Math.cos(p),xx=Math.cos(a)*sx-Math.sin(a)*zz,z=Math.sin(a)*sx+Math.cos(a)*zz;
      if(Math.abs(xx)<.02)return null;const t=(-245-camera.x)*SPACE/xx;return t>0?camera.z+z*t/SPACE:null;
    }
    function down(e){if(busy||e.button!==0||e.isPrimary===false||e.target.closest('[data-c3]'))return;const id=e.target.closest('[data-object]')?.dataset.object;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,object:id,shelfZ:s.shelfZ,hit:shelfRay(e.clientX,e.clientY),moved:false};suppress=false;}
    function move(e){
      if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(!pointer.moved&&Math.hypot(dx,dy)<7)return;
      pointer.moved=true;stage.setPointerCapture(e.pointerId);
      if(pointer.object==='shelf'&&!mode){const hit=shelfRay(e.clientX,e.clientY);if(hit!==null&&pointer.hit!==null){M.moveShelf(s,pointer.shelfZ+hit-pointer.hit,pointer.shelfZ);if(s.helper)robot=helperPosition();update();}}
      else{clearSelectionOnLook();camera.yaw=pointer.yaw-dx*.19/camera.zoom;camera.pitch=pointer.pitch+dy*.16/camera.zoom;updateCamera();}e.preventDefault();
    }
    function up(e){if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;suppress=p.moved;if(p.moved&&p.object==='shelf'&&!mode){M.note(s,'move-shelf',Math.round(s.shelfZ));save();showActions('shelf');if(!s.helper&&!M.clear(s))say('student','조금 움직였어. 꽤 무겁네.');}if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);pointer=null;}
    function cancelPointer(){pointer=null;suppress=true;save();}
    function modal(title,body,clearOnClose=false){app.querySelector('.c3-modal')?.remove();const d=document.createElement('dialog');d.className='modal c3-modal';d.innerHTML=`<div class="modal-header"><h2>${esc(title)}</h2>${b('닫기','close-modal','quiet')}</div><div class="modal-body">${body}</div>`;app.append(d);d.addEventListener('close',()=>{d.remove();if(clearOnClose&&s.phase==='room')clearSelection();stage?.isConnected&&stage.focus({preventScroll:true});});d.showModal();}
    function inspect(id){
      if(id==='record'&&!s.drawerOpen)return;
      M.inspect(s,id);save();
      if(id==='map')modal('시설 배치 기록 01',`<div class="c3-paper">${mapArt()}<p>외부 통로는 앞쪽 출입문과 연결되어 있다.</p><small>시설 배치 기록 01</small></div>`,true);
      else if(id==='record'){modal('개조 기록 07','<article class="c3-paper"><h3>기록 보관실 개조 기록</h3><p>기존 외부 통로: 폐쇄</p><p>이동 통로 재배치: 완료</p><p>기존 안내 표지 철거: 미완료</p><hr><p>새 배치도: 첨부 누락</p><small>시설 관리 기록 07</small></article>',true);}
      else say('student',({oldDoor:s.oldDoorOpen?'문 뒤가 벽으로 막혀 있어. 표지판은 그대로인데…….':'문 위에는 출구라고 적혀 있어. 안쪽은 아직 보이지 않아.',desk:'출입 기록을 보던 책상인가 봐. 모니터는 연결이 끊겨 있고, 아래에는 서랍이 있어.',shelf:'서류 상자가 가득 실린 보관장이다. 아래에 작은 바퀴가 달려 있다.',floor:'보관장 옆으로 길게 바퀴 자국이 남아 있어.',gap:'아래쪽 틈으로 빛이 들어와. 뒤쪽은 잘 안 보여.',exit:'보관장 뒤에 문이 있었어. 이쪽은 막혀 있지 않은 것 같아.'})[id]||'직접 확인해 보자.');
    }
    function renderIntro(){
      s.line=Math.min(intro.length-1,s.line);const [who,text]=intro[s.line];
      app.innerHTML=`<main class="game c3-intro">${window.B0UI?.header({place:`기록 보관실 앞`,namespace:"c3",reset:"home",zoomClass:"c3-zoom",active:false})||""}<section class="corridor-scene"><div class="corridor-view"></div><div class="corridor-b0 walking"><div class="robot-sprite live-body ${who==='robot'?'speaking':''}">${portrait()}</div></div><div class="corridor-dialogue"><div class="speech ${who}"><b>${who==='robot'?'B-0':'나'}</b><p>${esc(text)}</p></div>${b(s.line===intro.length-1?'기록 보관실로':'다음','intro-next','next')}</div></section><footer><small>기록 보관실 문 앞에서 B-0와 잠시 숨을 돌린다.</small></footer></main>`;
    }
    function renderGate(){
      app.innerHTML=`<main class="game c3-gate-game">${window.B0UI?.header({place:`외부 출입구`,namespace:"c3",reset:"home",zoomClass:"c3-zoom",active:false})||""}<section class="c3-gate-scene"><div class="c3-gate-door"><span>외부 출입구</span><i></i></div><div class="c3-gate-terminal"><small>출입 관리</small><p>${s.approval==='rejected'?'외부 이동 보류':'외부 이동에는 중앙관리실의 승인이 필요합니다.'}</p>${s.approval==='rejected'?'<small>중앙관리실에서 직접 확인</small>':''}</div><div class="c3-gate-b0"><div class="robot-sprite live-body">${portrait()}</div></div><div class="c2-speech c3-speech" hidden></div></section><section class="c2-actions c3-actions"></section><footer><small>문 너머로는 바깥 불빛이 보인다.</small></footer></main>`;
      stage=null;world=null;speech=app.querySelector('.c3-speech');bar=app.querySelector('.c3-actions');
      actions('외부 출입구',s.approval==='rejected'?[['관찰실 통로로 가기','go-central'],['방으로 돌아가기','return-room']]:[['문 살펴보기','inspect-gate'],['B-0에게 승인 요청 부탁','request-approval'],['방으로 돌아가기','return-room']]);
    }
    function renderEnd(){
      app.innerHTML=`<main class="game c3-end">${window.B0UI?.header({place:`거울 관찰실 밖 통로`,namespace:"c3",reset:"home",zoomClass:"c3-zoom",active:false})||""}<section class="c3-central-scene">${onCorridor?'<div class="corridor-view"></div>':'<div class="c3-central-door"><i></i><span>중앙관리실</span></div>'}<div class="c3-central-dialogue"><div class="speech student"><b>나</b><p>좋아, 다시 같이 나왔네.</p></div><div class="speech robot"><b>B-0</b><p>지도에는 중앙관리실이 2층으로 표시되어 있습니다.</p></div><div class="speech student"><b>나</b><p>그럼 계단부터 찾아보자.</p></div></div></section><footer>${b(onCorridor?'복도로 나가기':'중앙관리실 앞으로 가기','chapter-four','primary')}${b('거울 관찰실 둘러보기','visit-mirror','quiet')}<small>유리 관찰실의 반대쪽 복도로 나왔다.</small></footer></main>`;
    }
    function leaveRoom(){
      if(!M.leave(s))return;cancelAnimationFrame(frame);cameraMoving=false;save();busy=true;
      talk([['robot','제 지도에는 이 문이 없었습니다.'],['student',s.seen.wall?'너는 지도 봤고, 나는 방을 봤잖아. 같이 찾은 거지.':'지도에 없어도 실제로는 있었네. 직접 보길 잘했어.'],['robot','지금 확인한 위치로 지도를 수정하겠습니다.']],()=>{busy=false;if(onCorridor)onCorridor();else render();});
    }
    function act(a){
      if(a==='campaign-home'){onHome?.();return;}
      if(a==='chapter-four'&&s.phase==='complete'){dispose();onNext?.();return;}
      if(a==='close-modal'){app.querySelector('.c3-modal')?.close();return;}
      if(a==='menu'){modal('메뉴',window.B0UI.menuContent({namespace:'c3',close:'close-modal',home:'campaign-home',record:'record',extras:`${b('현재 공간 다시 시작','reset-confirm')}${b('복도로 나가기','back')}`}));return;}
      if(a==='back'){dispose();onBack();return;}
      if(a==='reset-confirm'){modal('3차시를 다시 시작할까요?',`<p>기록 보관실의 진행만 초기화합니다.</p>${b('초기화하고 시작','reset','primary')}`);return;}
      if(a==='reset'){cancelAnimationFrame(frame);busy=false;cameraMoving=false;s=M.fresh();mirrorUrl(false);camera={x:0,z:30,yaw:-12,pitch:-8,zoom:1};robot={x:120,z:-190};app.querySelector('.c3-modal')?.remove();save();render();return;}
      if(a==='controls'){modal('사용법','<p>빈 공간을 끌거나 방향키로 방을 둘러봅니다. 물건을 누르면 가까이 다가가 살펴볼 수 있습니다.</p><p>보관장은 직접 끌거나 밀기 버튼으로 움직입니다. 혼자 밀면 조금씩 움직이고, 함께 밀면 더 쉽게 움직입니다.</p><p>B-0에게 부탁할 때는 확인할 대상과 내용을 골라 주세요. 처음 위치로는 시점과 배율만 되돌립니다.</p>');return;}
      if(a==='record'){const labels={map:'배치 기록 01',oldDoor:'출구 표지판의 문',wall:'문 뒤의 벽',record:'개조 기록 07',shelf:'보관장',floor:'바퀴 자국',gap:'아래쪽 빛',exit:'새로 발견한 문',desk:'기록 책상'};modal('직접 확인한 것',`<ul>${Object.keys(s.seen).map(id=>`<li>${labels[id]}</li>`).join('')||'<li>아직 살펴본 기록이 없습니다.</li>'}</ul><p>어떤 사실이 기록과 달랐나요? 그 근거는 직접 본 것인가요, B-0에게 들은 것인가요?</p>`);return;}
      if(a==='intro-next'){if(s.line<intro.length-1)s.line++;else{s.phase='room';s.line=0;}save();render();if(s.phase==='room')talk([['student','문은 있는데, 열릴까?'],['robot','제 지도에서는 앞쪽 문이 출구입니다. 현재 상태는 함께 확인해 보겠습니다.']]);return;}
      if(a==='talk-next'){nextTalk();return;}if(a==='dismiss'){conversation=null;speech.hidden=true;return;}
      if(a==='return-room'){s.phase='room';save();render();return;}
      if(a==='inspect-gate'){say('student','바깥 불빛이 보이는데 문이 안 열려. 옆 화면에 승인 안내가 있어.');return;}
      if(a==='request-approval'){if(M.request(s)){save();renderGate();talk([['robot','외부 이동이 보류되었습니다. 중앙관리실에서 직접 확인하라고 나옵니다. 그쪽으로 가려면 옆 관찰실을 지나야 합니다.'],['student','여기까지 왔는데 왜 못 나가게 하는 거야?']]);}return;}
      if(a==='go-central'&&onCorridor){onCorridor();return;}
      if(a==='go-central'||a==='visit-mirror'){if(M.beginMirror(s)){save();render();}return;}
      if(s.phase!=='room'||(busy&&!cameraMoving))return;
      if(a==='home'){clearSelection();animateCamera({x:0,z:30,yaw:-12,pitch:-8,zoom:1});return;}
      if(a.startsWith('zoom-')){camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(a==='clear'){clearSelection();return;}
      if(a==='robot'){robotMenu();return;}
      if(a==='request-check'||a==='request-help'){mode=a==='request-check'?'check':'help';actions('대상 물건을 직접 눌러 주세요.',[['취소','clear']]);return;}
      if(a.startsWith('select-')){select(a.slice(7));return;}
      if(a.startsWith('inspect-')){inspect(a.slice(8));return;}
      if(a.startsWith('ask-')){const id=a.slice(4);if(id!=='route'&&id!=='basis')M.inspect(s,id);save();say('robot',M.reply(s,id==='route'?'route':id==='basis'?'basis':'check',id));return;}
      if(a==='shelf-requests'){shelfRequests();return;}
      if(a==='help-shelf'){helpShelf();return;}
      if(a==='push-menu'){actions('밀 방향을 직접 정해 보세요.',[['왼쪽으로 밀기','push-left'],['오른쪽으로 밀기','push-right'],['돌아가기','select-shelf']]);return;}
      if(a==='push-left'||a==='push-right'){const delta=(a==='push-left'?1:-1)*(s.helper?85:35);M.moveShelf(s,s.shelfZ+delta);M.note(s,'move-shelf',Math.round(s.shelfZ));if(s.helper)robot=helperPosition();save();update();if(!s.helper&&!M.clear(s))say('student','조금 움직였어. 꽤 무겁네.');return;}
      if(a==='drawer'){s.drawerOpen=!s.drawerOpen;M.inspect(s,'desk');save();update();showActions('desk');return;}
      if(a==='old-door'){const open=M.toggleOldDoor(s);save();update();showActions('oldDoor');if(open)talk([['student','출구라며? 지금은 벽이잖아.'],['robot','기록에는 통로로 되어 있습니다. 하지만 지금 보고 있는 것과 제 기록이 다릅니다.']]);return;}
      if(a==='open-exit'){if(M.openExit(s)){save();update();showActions('exit');say('student','이쪽은 통로로 이어져 있어!');}return;}
      if(a==='leave'){leaveRoom();}
    }
    function click(e){const el=e.target.closest('[data-c3]');if(el){e.preventDefault();act(el.dataset.c3);}}
    function dispose(){dead=true;mirrorView?.dispose();mirrorView=null;cancelAnimationFrame(frame);timers.forEach(clearTimeout);app.removeEventListener('click',click);window.removeEventListener('resize',updateCamera);app.querySelector('.c3-modal')?.remove();}
    function jumpToEnd(){
      s.shelfZ=175;s.realDoorOpen=true;s.approval='rejected';s.phase='mirror';
      s.mirror={...window.B0Mirror.restore(s.mirror),phase:'complete'};
      M.finish(s);M.note(s,'temporary-skip');mirrorUrl(false);save();
    }
    app.addEventListener('click',click);window.addEventListener('resize',updateCamera);render();return {dispose,jumpToEnd};
  };
})();
