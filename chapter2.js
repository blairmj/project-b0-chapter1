(function(){
  'use strict';
  window.startChapterTwo=function({app,portrait,onBack,preview=false}){
    const M=window.B0RoomTwo,storage=preview?sessionStorage:localStorage,key='project-b0-room2-v1';
    let s;try{s=M.restore(JSON.parse(storage.getItem(key)));}catch{s=M.fresh();}
    let camera={yaw:-48,pitch:-12,zoom:1},standing=null,selection=null,mode=null,pointer=null,suppress=false,dead=false;
    let room,stage,world,actionbar,speech,helpText,focal=330,animation=0,busy=false;
    let robot={x:-120,z:-145},timers=[];
    const escaped=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const button=(t,a,cls='')=>`<button type="button" data-c2="${a}" class="${cls}">${t}</button>`;
    const save=()=>{try{storage.setItem(key,JSON.stringify(s));}catch{}};
    function later(f,ms){const t=setTimeout(()=>{if(!dead)f();},ms);timers.push(t);return t;}
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    function cube(id,w,h,d,cls=''){
      return `<div class="c2-cube ${cls}" ${id?`data-object="${id}" role="button" tabindex="0" aria-label="${M.sizes[id]?.name||'보관장'}"`:''} style="--w:${w}px;--h:${h}px;--d:${d}px;width:${w}px;height:${h}px">${['front','back','left','right','top'].map(f=>`<div class="c2-face c2-${f}"><i></i></div>`).join('')}</div>`;
    }
    function render(){
      if(s.phase!=='room'){ending();return;}
      app.innerHTML=`<main class="game c2-game"><header><h1>내 위치: 폐쇄 보관실</h1><nav>${button('← 원위치로','home','quiet')}${button('메뉴','menu','quiet')}</nav></header>
      <section class="c2-stage" tabindex="0" aria-label="폐쇄 보관실. 빈 공간을 끌거나 방향키로 둘러보세요. 물건을 누르면 조사할 수 있습니다.">
      <div class="c2-world">
        <div class="c2-wall c2-wall-front"><div class="c2-light"></div></div><div class="c2-wall c2-wall-left"><div class="c2-light"></div></div><div class="c2-wall c2-wall-right"><div class="c2-light"></div></div><div class="c2-wall c2-wall-back"><div class="c2-light"></div></div><div class="c2-floor"></div><div class="c2-ceiling"></div>
        <button class="c2-entry c2-object" data-object="entry" aria-label="닫힌 입구"><span></span></button>
        <button class="c2-window c2-object" data-object="window" aria-label="높은 창문"><span class="c2-window-glass"></span><span class="c2-latch"></span></button>
        <button class="c2-vent c2-object" data-object="vent" aria-label="벽면 환기 덮개"><span class="c2-vent-inside"></span><span class="c2-vent-lid"><i></i><i></i><i></i><i></i><i></i></span></button>
        <div class="c2-floor-target" hidden></div>
        ${cube('wide',118,62,92,'c2-wide')}${cube('small',76,56,68,'c2-small')}
        <div class="c2-cabinet" data-object="cabinet" role="button" tabindex="0" aria-label="보관장">${cube('',85,148,60)}<span class="c2-cabinet-door"></span></div>
        <div class="c2-robot" data-object="robot" role="button" tabindex="0" aria-label="B-0"><div class="robot-sprite live-body">${portrait()}</div><div class="c2-support-arm" hidden></div></div>
      </div><p class="c2-basic-help">빈 공간을 끌어 둘러보기 · 물건을 눌러 살펴보기</p><div class="c2-speech" aria-live="polite" hidden></div>
      </section><section class="c2-actions" aria-label="선택한 물체의 행동"><p>주변을 살펴보세요.</p></section>
      <footer><div class="zoom-controls">${button('−','zoom-out') }<output class="c2-zoom">100%</output>${button('+','zoom-in')}</div>${button('B-0에게 부탁','robot','secondary')}</footer></main>`;
      room=app.querySelector('.c2-game');stage=app.querySelector('.c2-stage');world=app.querySelector('.c2-world');actionbar=app.querySelector('.c2-actions');speech=app.querySelector('.c2-speech');helpText=app.querySelector('.c2-basic-help');
      stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',pointerUp);stage.addEventListener('pointercancel',cancelPointer);
      stage.addEventListener('click',e=>{if(suppress){suppress=false;return;}if(busy||mode?.looking)return;const el=e.target.closest('[data-object]');if(el)select(el.dataset.object);else if(mode?.type==='move'){const p=floorPoint(e.clientX,e.clientY);if(p)place(p.x,p.z);}});
      stage.addEventListener('wheel',e=>{e.preventDefault();if(!mode)camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom-e.deltaY*.001));updateCamera();},{passive:false});
      stage.addEventListener('keydown',keyDown);
      update();
      if(!s.logs.length)say('student','입구가 닫혔어. 다른 데부터 보자.');
    }
    function updateCamera(){
      if(!stage||!stage.isConnected)return;
      camera.pitch=Math.max(-30,Math.min(40,camera.pitch));camera.yaw=((camera.yaw+180)%360+360)%360-180;
      focal=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;
      stage.style.perspective=focal+'px';
      const lift=standing?M.top(s,standing):0,p=standing?M.position(s,standing):{x:0,z:-100};
      world.style.transform=`translateZ(${focal}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(${-p.x}px,${lift}px,${-(p.z+100)}px)`;
      stage.dataset.yaw=camera.yaw;stage.dataset.pitch=camera.pitch;
      const r=app.querySelector('.c2-robot');r.style.transform=`translate3d(${robot.x-48}px,24px,${robot.z}px) rotateY(${-camera.yaw}deg)`;
      app.querySelector('.c2-zoom').textContent=Math.round(camera.zoom*100)+'%';
    }
    function update(){
      if(s.phase!=='room')return;
      for(const id of ['wide','small']){const p=M.position(s,id),size=M.sizes[id],el=app.querySelector(`[data-object="${id}"]`);el.style.transform=`translate3d(${p.x-size.w/2}px,${180-M.top(s,id)}px,${p.z}px)`;el.classList.toggle('selected',selection===id);el.classList.toggle('c2-held',s.holding===id);}
      if(s.holding){const p=M.position(s,s.holding);robot={x:p.x-100,z:p.z+22};}
      const actor=app.querySelector('.c2-robot');actor.classList.toggle('holding',!!s.holding);actor.querySelector('.c2-support-arm').hidden=!s.holding;
      app.querySelector('.c2-window').classList.toggle('open',s.windowOpen);
      app.querySelector('.c2-vent').classList.toggle('open',s.ventOpen);
      app.querySelector('.c2-cabinet').classList.toggle('open',s.cabinetOpen);
      stage.classList.toggle('c2-moving-object',mode?.type==='move');
      updateCamera();save();
    }
    function say(who,text){
      if(!speech)return;helpText.hidden=true;speech.hidden=false;speech.innerHTML=`<div class="speech ${who}"><b>${who==='robot'?'B-0':'나'}</b><p>${escaped(text)}</p></div>${button('닫기','dismiss','quiet')}`;
      const actor=app.querySelector('.c2-robot .robot-sprite');if(actor){actor.classList.toggle('speaking',who==='robot');later(()=>actor.classList.remove('speaking'),Math.min(4500,text.length*90));}
    }
    function actions(title,items){actionbar.innerHTML=`<strong>${escaped(title)}</strong><div>${items.map(([t,a])=>button(t,a)).join('')}</div>`;}
    function select(id){
      if(mode?.looking)return;
      if(mode?.type==='target'){robotTarget(id);return;}
      if(mode?.type==='move'){
        if(M.sizes[id]&&id!==mode.id){const p=M.position(s,id);place(p.x,p.z,id);}return;
      }
      selection=id;update();
      if(M.sizes[id])actions(M.sizes[id].name,[['살펴보기','inspect-'+id],['옮기기','move-'+id],[standing===id?'내려가기':'올라서기',standing===id?'down':'climb-'+id],['선택 닫기','clear']]);
      else if(id==='robot')robotMenu();
      else if(id==='window')actions('높은 창문',[['살펴보기','inspect-window'],[s.windowOpen?'창문 넘기':'걸쇠 열기',s.windowOpen?'exit':'open-window'],...(standing?[['내려가기','down']]:[]),['선택 닫기','clear']]);
      else if(id==='vent')actions('벽면 환기 덮개',[['살펴보기','inspect-vent'],[s.ventOpen?'덮개 닫기':'덮개 열기','vent'],['선택 닫기','clear']]);
      else if(id==='cabinet')actions('보관장',[['살펴보기','inspect-cabinet'],[s.cabinetOpen?'닫기':'열기','cabinet'],['선택 닫기','clear']]);
      else actions('닫힌 입구',[['살펴보기','inspect-entry'],['밀어 보기','push-entry'],['선택 닫기','clear']]);
    }
    const descriptions={wide:'바퀴가 없는 낮고 넓은 운반 상자다. 뚜껑이 단단히 닫혀 있다.',small:'들어서 옮길 수 있는 작은 상자다. 윗면이 평평하다.',window:'창 너머에 통로가 보인다. 걸쇠는 이쪽에 있다.',vent:'금속 덮개 틈으로 어두운 공간이 보인다. 손으로 열 수 있을 것 같다.',cabinet:'벽에 고정된 보관장이다. 안쪽을 확인할 수 있다.',entry:'문 가장자리가 벽에 밀착되어 있다. 안쪽에는 손잡이가 없다.'};
    function robotMenu(){actions('B-0에게 부탁',[['살펴봐 줘','request-inspect'],['옮겨 줘','request-move'],['잡아 줘','request-hold'],...(s.holding?[['손 놓아 줘','release']]:[]),['이 방을 살펴봐 줘','survey'],['닫기','clear']]);}
    function robotTarget(id){
      if(id==='robot')return;const verb=mode.verb;mode=null;
      if(verb==='inspect'){say('robot',id==='window'?'창 너머는 통로입니다. 안쪽 걸쇠가 보입니다.':id==='vent'?(s.ventOpen?'통로 뒤가 금속판으로 막혀 있습니다. 여기로는 지나갈 수 없습니다.':'덮개 너머는 여기서 다 보이지 않습니다. 열어 확인할 수 있습니다.'):id==='entry'?'안쪽 손잡이는 보이지 않습니다. 아직 문을 여는 방법은 찾지 못했습니다.':M.sizes[id]?(id==='wide'?'윗면이 넓고 단단합니다. 바닥에서 밀어 옮길 수 있습니다.':'윗면이 평평합니다. 다른 물체 위에 놓을 때 받치는 면을 확인해야 합니다.'):'비어 있는 보관장입니다. 벽에 고정되어 있습니다.');select(id);}
      else if(!M.sizes[id]){say('robot','이 물체는 옮기거나 붙잡아서 움직일 수 없습니다. 다른 대상을 지정해 주세요.');robotMenu();}
      else if(verb==='move')beginMove(id,true);
      else {actions(`${M.sizes[id].name}를 잡고 있을까요?`,[['부탁해','hold-'+id],['취소','clear']]);selection=id;update();}
    }
    function beginMove(id,byRobot=false){
      if(standing){say('student','먼저 바닥으로 내려가야겠어.');return;}
      const other=id==='wide'?'small':'wide';if(s.boxes[other].on===id){say('student','위에 놓인 상자부터 내려야겠어.');return;}
      if(s.holding&&(s.holding===id||s.holding===s.boxes[id].on)){say('robot','제가 잡고 있습니다. 먼저 손을 놓을까요?');robotMenu();return;}
      mode={type:'move',id,byRobot,candidate:null};selection=id;speech.hidden=true;
      moveActions();
      helpText.textContent='상자를 끌거나 빈 바닥을 누르세요 · 다른 상자를 누르면 윗면에 놓기';helpText.hidden=false;update();
    }
    function moveActions(){actions(`${M.sizes[mode.id].name} · ${mode.looking?'빈 공간을 끌어 시점 돌리기':mode.byRobot?'B-0가 옮길 위치 선택':'옮길 위치 선택'}`,mode.looking?[['위치 지정으로','move-view'],['취소','cancel']]:[['앞','nudge-front'],['뒤','nudge-back'],['왼쪽','nudge-left'],['오른쪽','nudge-right'],['놓기','drop'],['시점 돌리기','move-view'],['취소','cancel']]);}
    // Inverse CSS camera ray intersected with the floor; changing yaw never changes world coordinates.
    function floorPoint(clientX,clientY){
      const r=stage.getBoundingClientRect(),x=(clientX-r.left-r.width/2)/focal,y=(clientY-r.top-r.height/2)/focal;
      const p=camera.pitch*Math.PI/180,a=camera.yaw*Math.PI/180;
      const yy=Math.cos(p)*y-Math.sin(p),zz=-Math.sin(p)*y-Math.cos(p);
      const xx=Math.cos(a)*x-Math.sin(a)*zz,z=Math.sin(a)*x+Math.cos(a)*zz;
      const floor=180+(standing?M.top(s,standing):0);if(yy<=.04)return null;const t=floor/yy;
      return {x:xx*t,z:z*t};
    }
    function previewDrop(x,z,support=null){
      if(!mode)return;const d=M.destination(s,mode.id,x,z,support);mode.candidate={x,z,support};
      const mark=app.querySelector('.c2-floor-target');mark.hidden=false;mark.classList.toggle('invalid',!d.ok);
      const p=d.ok?d:{x:Math.max(-240,Math.min(240,x)),z:Math.max(-245,Math.min(230,z))};
      mark.style.transform=`translate3d(${p.x-45}px,${179-(support?M.top(s,support):0)}px,${p.z}px) rotateX(90deg)`;
      if(d.ok){const size=M.sizes[mode.id],el=app.querySelector(`[data-object="${mode.id}"]`);el.style.transform=`translate3d(${d.x-size.w/2}px,${180-size.h-(support?M.top(s,support):0)}px,${d.z}px)`;}
    }
    function place(x,z,support=null){
      if(!mode)return;const {id,byRobot}=mode,d=M.move(s,id,x,z,support);
      if(!d.ok){say('student',d.reason);return;}
      mode=null;app.querySelector('.c2-floor-target').hidden=true;helpText.hidden=true;update();select(id);
      if(byRobot){walkRobot(d.x-85,d.z+15,()=>say('robot','지정하신 위치에 놓았습니다.'));}
    }
    function cancelMove(){mode=null;pointer=null;app.querySelector('.c2-floor-target').hidden=true;helpText.hidden=true;selection=null;actions('주변을 살펴보세요.',[]);update();}
    function pointerDown(e){
      if(busy||e.button!==0||e.isPrimary===false)return;
      pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,moved:false};suppress=false;
      if(mode?.type==='move')e.preventDefault();
    }
    function supportAt(x,y){
      const selected=app.querySelector(`[data-object="${mode.id}"]`);selected.style.pointerEvents='none';
      const hit=document.elementFromPoint(x,y)?.closest('[data-object]');selected.style.pointerEvents='';
      return hit&&M.sizes[hit.dataset.object]&&hit.dataset.object!==mode.id?hit.dataset.object:null;
    }
    function pointerMove(e){
      if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      if(Math.hypot(dx,dy)<7&&!pointer.moved)return;
      pointer.moved=true;stage.setPointerCapture(e.pointerId);helpText.hidden=true;
      if(mode?.type==='move'&&!mode.looking){const support=supportAt(e.clientX,e.clientY),p=support?M.position(s,support):floorPoint(e.clientX,e.clientY);if(p)previewDrop(p.x,p.z,support);}
      else if(!mode||mode.looking){camera.yaw=pointer.yaw-dx*.19/camera.zoom;camera.pitch=pointer.pitch+dy*.16/camera.zoom;updateCamera();}
      e.preventDefault();
    }
    function pointerUp(e){
      if(!pointer||pointer.id!==e.pointerId)return;suppress=pointer.moved;
      if(pointer.moved&&mode?.type==='move'&&!mode.looking&&mode.candidate){const {x,z,support}=mode.candidate;place(x,z,support);}
      if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);pointer=null;
    }
    function cancelPointer(){pointer=null;suppress=true;if(mode)cancelMove();}
    function keyDown(e){
      if((e.key==='Enter'||e.key===' ')&&e.target.dataset.object){e.preventDefault();select(e.target.dataset.object);return;}
      if(e.key==='Escape'){cancelMove();return;}
      const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'front',ArrowDown:'back'};
      if(!dirs[e.key])return;e.preventDefault();
      if(mode?.type==='move'&&!mode.looking)nudge(dirs[e.key]);else {if(e.key==='ArrowLeft')camera.yaw-=15;if(e.key==='ArrowRight')camera.yaw+=15;if(e.key==='ArrowUp')camera.pitch+=8;if(e.key==='ArrowDown')camera.pitch-=8;updateCamera();}
    }
    function nudge(dir){
      if(!mode)return;const p=mode.candidate||M.position(s,mode.id),a=camera.yaw*Math.PI/180,dx=dir==='left'?-25:dir==='right'?25:0,dz=dir==='front'?-25:dir==='back'?25:0;
      previewDrop(p.x+Math.cos(a)*dx-Math.sin(a)*dz,p.z+Math.sin(a)*dx+Math.cos(a)*dz);
    }
    function walkRobot(x,z,done){
      const start={...robot},t0=performance.now();busy=true;app.querySelector('.c2-robot').classList.add('walking');
      function step(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-t0)/850);robot={x:start.x+(x-start.x)*v,z:start.z+(z-start.z)*v};updateCamera();if(v<1)animation=requestAnimationFrame(step);else{busy=false;app.querySelector('.c2-robot')?.classList.remove('walking');done?.();}}
      animation=requestAnimationFrame(step);
    }
    function reachMessage(){const status=M.reach(s,standing);say('student',status==='floor'?'손이 닿지 않아.':status==='far'?'올라섰지만 창문에서 너무 멀어.':status==='low'?'조금 높아졌지만, 걸쇠까지는 닿지 않아.':'몸을 기울이니까 발판이 움직여. 이대로는 넘어가기 어렵겠어.');if(status==='unstable'){const el=app.querySelector(`[data-object="${standing}"]`);el.classList.add('unstable');later(()=>el.classList.remove('unstable'),900);} }
    function showModal(title,body){
      app.querySelector('.c2-modal')?.remove();const d=document.createElement('dialog');d.className='modal c2-modal';d.innerHTML=`<div class="modal-header"><h2>${title}</h2>${button('닫기','close-modal','quiet')}</div><div class="modal-body">${body}</div>`;app.append(d);d.addEventListener('close',()=>{d.remove();stage?.focus({preventScroll:true});});d.showModal();
    }
    function ending(){
      standing=null;mode=null;const done=s.phase==='complete';
      app.innerHTML=`<main class="game c2-ending"><header><h1>내 위치: ${done?'연구소 통로':'창문 바깥'}</h1>${button('메뉴','menu','quiet')}</header><section class="c2-outside ${done?'together':''}"><div class="c2-ending-b0">${portrait()}</div><div class="c2-end-dialogue"><div class="speech ${done?'robot':'student'}"><b>${done?'B-0':'나'}</b><p>${done?'문은 없었지만, 함께 나왔습니다.':'이제 너 올라와. 손 줘.'}</p></div>${button(done?'2차시 마치기':'B-0의 손 잡기',done?'summary':'help-b0','primary')}</div></section><footer><small>${done?'2차시 · 문이 없는 방':'B-0가 아래에서 기다리고 있다.'}</small></footer></main>`;
    }
    function act(a){
      if(a==='close-modal'){app.querySelector('.c2-modal')?.close();return;}
      if(a==='menu'){showModal('메뉴',`<p>1차시와 2차시 진행은 따로 저장됩니다.</p><div class="options">${button('계속하기','close-modal','primary')}${button('조작 방법','controls')}${button('생각거리','hint')}${button('2차시 다시 시작','reset-confirm','quiet')}${button('1차시로 돌아가기','back','quiet')}</div>`);return;}
      if(a==='back'){dispose();onBack();return;}
      if(a==='reset-confirm'){showModal('2차시를 다시 시작할까요?',`<p>이 방의 상자 배치와 진행만 초기화합니다. 1차시 진행은 유지됩니다.</p>${button('초기화하고 시작','reset','primary')}`);return;}
      if(a==='reset'){s=M.fresh();standing=null;mode=null;selection=null;camera={yaw:-48,pitch:-12,zoom:1};robot={x:-120,z:-145};save();render();return;}
      if(a==='controls'){showModal('조작 방법','<p>빈 공간을 끌거나 방향키로 시점을 돌립니다. 물건을 누르면 행동이 나타납니다.</p><p>옮기기를 선택한 뒤 물건을 끌어 놓거나 빈 바닥을 누르세요. 다른 물건 위에 놓을 수도 있습니다. 앞·뒤·왼쪽·오른쪽 버튼으로 위치를 조절하고 놓기를 눌러도 됩니다.</p><p>B-0에게 부탁할 때는 행동을 고르고 대상 물건을 직접 누릅니다. 원위치로는 시점과 배율만 되돌립니다.</p>');return;}
      if(a==='hint'){s.hint=Math.min(4,s.hint+1);save();const hints=['','시선을 위아래로도 움직여 보세요.','발견한 통로에 닿으려면 무엇이 달라져야 할까요?','방 안의 물건으로 올라설 곳을 만들 수 있습니다.','넓은 상자를 창문 가까이 옮기고 작은 상자를 위에 놓으세요. B-0에게 아래 상자를 잡아 달라고 부탁한 뒤 올라서 보세요.'];showModal('생각거리',`<p>${hints[s.hint]}</p>${s.hint<4?button('조금 더 도움받기','hint'):''}`);return;}
      if(a==='help-b0'){if(M.finish(s)){save();ending();}return;}
      if(a==='summary'){showModal('2차시 끝','<p>소년과 B-0가 함께 창문을 넘어 통로에 도착했습니다.</p><p>다음 차시는 아직 준비 중입니다.</p>'+button('탐색 기록 보기','record'));return;}
      if(a==='record'){const moves=s.logs.filter(l=>l.action==='move').length;showModal('이번 방의 기록',`<p>물건 이동 ${moves}회 · 생각거리 ${s.hint}단계 이용</p><p>${s.ventOpen?'환기 덮개 뒤가 막혀 있는 것을 확인했습니다.':'환기 덮개를 열지 않고 탈출했습니다.'}</p><p>어떤 것을 직접 확인했고, B-0에게는 무엇을 부탁했나요?</p>`);return;}
      if(s.phase!=='room'||busy)return;
      if(a==='dismiss'){speech.hidden=true;return;}
      if(a==='home'){camera={yaw:-48,pitch:-12,zoom:1};updateCamera();return;}
      if(a.startsWith('zoom-')){camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(a==='clear'||a==='cancel'){cancelMove();return;}
      if(a==='robot'){robotMenu();return;}
      if(a.startsWith('request-')){mode={type:'target',verb:a.slice(8)};actions('부탁할 대상 물건을 직접 눌러 주세요.',[['취소','cancel']]);return;}
      if(a==='release'){s.holding=null;update();say('robot','손을 놓았습니다.');robotMenu();return;}
      if(a==='survey'){walkRobot(-205,35,()=>say('robot','보이는 벽면에서는 다른 문을 찾지 못했습니다. 아직 확인하지 못한 곳도 있습니다.'));return;}
      if(a.startsWith('hold-')){const id=a.slice(5),p=M.position(s,id);walkRobot(p.x-100,p.z+22,()=>{M.hold(s,id);update();say('robot','잡고 있겠습니다.');select(id);});return;}
      if(a.startsWith('inspect-')){const id=a.slice(8);say('student',descriptions[id]);s.logs.push({action:'inspect',id});save();return;}
      if(a==='push-entry'){say('student','움직이지 않아. 다른 곳도 살펴봐야겠어.');return;}
      if(a==='vent'){s.ventOpen=!s.ventOpen;s.logs.push({action:'vent',open:s.ventOpen});update();select('vent');if(s.ventOpen)say('student','뒤가 금속판으로 막혀 있어. 통로처럼 보였는데…….');return;}
      if(a==='cabinet'){s.cabinetOpen=!s.cabinetOpen;update();select('cabinet');if(s.cabinetOpen)say('student','안에는 아무것도 없어.');return;}
      if(a==='move-view'){if(mode){mode.looking=!mode.looking;moveActions();}return;}
      if(a.startsWith('move-')){beginMove(a.slice(5));return;}
      if(a.startsWith('nudge-')){nudge(a.slice(6));return;}
      if(a==='drop'){if(mode?.candidate){const p=mode.candidate;place(p.x,p.z,p.support);}else say('student','놓을 위치를 먼저 지정해야겠어.');return;}
      if(a==='down'){standing=null;updateCamera();select(selection||'wide');return;}
      if(a.startsWith('climb-')){const id=a.slice(6);if(s.boxes.small.on===id){say('student','위에 작은 상자가 놓여 있어. 올라설 상자를 다시 골라야겠어.');return;}standing=id;const p=M.position(s,id);camera.yaw=Math.atan2(105-p.x,400+p.z)*180/Math.PI;camera.pitch=8;updateCamera();select(id);say('student','올라서니 보이는 높이가 달라졌어.');return;}
      if(a==='open-window'){if(M.openWindow(s,standing)){update();say('student','열렸어. 너머로 넘어갈 수 있겠어.');select('window');}else reachMessage();return;}
      if(a==='exit'){if(M.exit(s,standing)){save();ending();}else reachMessage();}
    }
    function click(e){const b=e.target.closest('[data-c2]');if(b){e.preventDefault();act(b.dataset.c2);}}
    function dispose(){dead=true;timers.forEach(clearTimeout);cancelAnimationFrame(animation);app.removeEventListener('click',click);window.removeEventListener('resize',updateCamera);app.querySelector('.c2-modal')?.remove();}
    app.addEventListener('click',click);window.addEventListener('resize',updateCamera);render();
    return {dispose};
  };
})();
