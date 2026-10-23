(function(){
  'use strict';
  window.startChapterTwo=function({app,portrait,onBack,preview=false}){
    const M=window.B0RoomTwo,storage=preview?sessionStorage:localStorage,key='project-b0-room2-v1';
    let s;try{s=M.restore(JSON.parse(storage.getItem(key)));}catch{s=M.fresh();}
    let camera={yaw:-48,pitch:-12,zoom:1},standing=null,selection=null,mode=null,pointer=null,suppress=false,dead=false;
    let room,stage,world,actionbar,speech,helpText,focal=330,animation=0,busy=false;
    let robot={x:-120,z:-145},timers=[],lift=0,viewHeight=0,heightFrame=0;
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
        <button class="c2-window c2-fake-window c2-object" data-object="fake-window" aria-label="옆 벽의 창문"><span class="c2-window-glass"></span><span class="c2-latch"></span></button>
        <button class="c2-vent c2-object" data-object="vent" aria-label="벽면 환기 덮개"><span class="c2-vent-inside"></span><span class="c2-vent-lid"><i></i><i></i><i></i><i></i><i></i></span></button>
        <div class="c2-floor-target" hidden></div>
        ${cube('wide',118,62,92,'c2-wide')}${cube('small',76,56,68,'c2-small')}
        <div class="c2-cabinet" data-object="cabinet" role="button" tabindex="0" aria-label="보관장">${cube('',85,148,60)}<span class="c2-cabinet-door"></span></div>
        <div class="c2-robot" data-object="robot" role="button" tabindex="0" aria-label="B-0"><div class="robot-sprite live-body">${portrait()}</div><div class="c2-support-arm" hidden></div></div>
      </div><p class="c2-basic-help">상자를 끌어 옮기기 · 빈 공간을 끌어 둘러보기</p><div class="c2-speech" aria-live="polite" hidden></div>
      </section><section class="c2-actions" aria-label="선택한 물체의 행동"><p>주변을 살펴보세요.</p></section>
      <footer><div class="zoom-controls">${button('−','zoom-out') }<output class="c2-zoom">100%</output>${button('+','zoom-in')}</div><button type="button" data-c2="down" class="c2-descend" hidden>내려가기</button>${button('B-0에게 부탁','robot','secondary')}</footer></main>`;
      room=app.querySelector('.c2-game');stage=app.querySelector('.c2-stage');world=app.querySelector('.c2-world');actionbar=app.querySelector('.c2-actions');speech=app.querySelector('.c2-speech');helpText=app.querySelector('.c2-basic-help');
      stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',pointerUp);stage.addEventListener('pointercancel',cancelPointer);
      stage.addEventListener('click',e=>{if(suppress){suppress=false;return;}if(busy||mode?.looking)return;const el=e.target.closest('[data-object]');if(el){if(!mode&&el.dataset.object==='vent'&&s.ventOpen&&e.target.closest('.c2-vent-lid'))act('vent');else select(el.dataset.object);}else if(mode?.type==='move'){const p=floorPoint(e.clientX,e.clientY);if(p)place(p.x,p.z);}});
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
      // Climbing changes eye height only. Recentring the entire room on the
      // selected crate made its position appear to jump relative to the walls.
      const elevation=viewHeight+lift;
      world.style.transform=`translateZ(${focal}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(0px,${elevation}px,0px)`;
      stage.dataset.yaw=camera.yaw;stage.dataset.pitch=camera.pitch;
      const r=app.querySelector('.c2-robot');r.style.transform=`translate3d(${robot.x-48}px,24px,${robot.z}px) rotateY(${-camera.yaw}deg)`;
      app.querySelector('.c2-zoom').textContent=Math.round(camera.zoom*100)+'%';
      app.querySelector('.c2-descend').hidden=!standing;
    }
    function setViewHeight(height,animate=true){
      cancelAnimationFrame(heightFrame);
      if(!animate||reduced()){viewHeight=height;updateCamera();return;}
      const from=viewHeight,t0=performance.now();
      function step(t){if(dead)return;const v=Math.min(1,(t-t0)/450);viewHeight=from+(height-from)*(v*v*(3-2*v));updateCamera();if(v<1)heightFrame=requestAnimationFrame(step);}
      heightFrame=requestAnimationFrame(step);
    }
    function update(){
      if(s.phase!=='room')return;
      for(const id of ['wide','small']){const p=M.position(s,id),size=M.sizes[id],el=app.querySelector(`[data-object="${id}"]`);el.style.transform=`translate3d(${p.x-size.w/2}px,${180-M.top(s,id)}px,${p.z}px)`;el.classList.toggle('selected',selection===id);}
      robot=M.robotSpot(s,robot);
      app.querySelector('.c2-robot').classList.toggle('boosting',!!s.assisted);
      app.querySelector('[data-object="window"]').classList.toggle('open',s.windowOpen);
      app.querySelector('.c2-fake-window').classList.toggle('open',s.fakeWindowOpen);
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
      if(M.sizes[id])actions(M.sizes[id].name,[['살펴보기','inspect-'+id],['옮기기','move-'+id],...(!standing?[['올라서기','climb-'+id]]:[]),['선택 닫기','clear']]);
      else if(id==='robot')robotMenu();
      else if(id==='window')actions('높은 창문',[['살펴보기','inspect-window'],[s.windowOpen?'창문 넘기':'걸쇠 열기',s.windowOpen?'exit':'open-window'],['선택 닫기','clear']]);
      else if(id==='fake-window')actions('옆 벽의 창문',[['살펴보기','inspect-fake-window'],[s.fakeWindowOpen?'창 닫기':'창 열어 보기','fake-window'],['선택 닫기','clear']]);
      else if(id==='vent')actions('벽면 환기 덮개',[['살펴보기','inspect-vent'],[s.ventOpen?'덮개 닫기':'덮개 열기','vent'],['선택 닫기','clear']]);
      else if(id==='cabinet')actions('보관장',[['살펴보기','inspect-cabinet'],[s.cabinetOpen?'닫기':'열기','cabinet'],['선택 닫기','clear']]);
      else actions('닫힌 입구',[['살펴보기','inspect-entry'],['밀어 보기','push-entry'],['선택 닫기','clear']]);
    }
    const descriptions={wide:'바퀴가 없는 낮고 넓은 운반 상자다. 뚜껑이 단단히 닫혀 있다.',small:'들어서 옮길 수 있는 작은 상자다. 윗면이 평평하다.',window:'창 너머에 통로가 보인다. 걸쇠는 이쪽에 있다.','fake-window':'뿌연 유리 너머로 빛이 비친다. 정말 지나갈 수 있는 곳일까?',vent:'금속 덮개 틈으로 어두운 공간이 보인다. 손으로 열 수 있을 것 같다.',cabinet:'벽에 고정된 보관장이다. 안쪽을 확인할 수 있다.',entry:'문 가장자리가 벽에 밀착되어 있다. 안쪽에는 손잡이가 없다.'};
    function robotMenu(){actions('B-0에게 부탁',[['살펴봐 줘','request-inspect'],['옮겨 줘','request-move'],['나를 들어 올려 줘','boost'],['이 방을 살펴봐 줘','survey'],['닫기','clear']]);}
    function robotTarget(id){
      if(id==='robot')return;const verb=mode.verb;mode=null;
      if(verb==='inspect'){say('robot',id==='window'?'창 너머는 통로입니다. 안쪽 걸쇠가 보입니다.':id==='fake-window'?(s.fakeWindowOpen?'유리 뒤가 벽입니다. 통로로 이어지지 않습니다.':'유리 너머는 잘 보이지 않습니다. 창을 열어 확인해 볼까요?'):id==='vent'?(s.ventOpen?'통로 뒤가 금속판으로 막혀 있습니다. 여기로는 지나갈 수 없습니다.':'덮개 너머는 여기서 다 보이지 않습니다. 열어 확인할 수 있습니다.'):id==='entry'?'안쪽 손잡이는 보이지 않습니다. 아직 문을 여는 방법은 찾지 못했습니다.':M.sizes[id]?(id==='wide'?'윗면이 넓고 단단합니다. 바닥에서 밀어 옮길 수 있습니다.':'윗면이 평평합니다. 다른 물체 위에 놓을 때 받치는 면을 확인해야 합니다.'):'비어 있는 보관장입니다. 벽에 고정되어 있습니다.');select(id);}
      else if(!M.sizes[id]){say('robot','이 물체는 옮길 수 없습니다. 다른 대상을 지정해 주세요.');robotMenu();}
      else if(verb==='move')beginMove(id,true);
    }
    function beginMove(id,byRobot=false){
      if(standing){say('student','먼저 바닥으로 내려가야겠어.');return;}
      const other=id==='wide'?'small':'wide';if(s.boxes[other].on===id){say('student','위에 놓인 상자부터 내려야겠어.');return;}
      mode={type:'move',id,byRobot,candidate:null};selection=id;speech.hidden=true;
      moveActions();
      helpText.textContent='상자를 끌어 옮기기 · 빈 공간을 끌어 둘러보기 · 다른 상자 위에 놓기';helpText.hidden=false;update();return true;
    }
    function moveActions(){actions(`${M.sizes[mode.id].name} · ${mode.looking?'빈 공간을 끌어 시점 돌리기':mode.byRobot?'B-0가 옮길 위치 선택':'옮길 위치 선택'}`,mode.looking?[['위치 지정으로','move-view'],['취소','cancel']]:[['앞','nudge-front'],['뒤','nudge-back'],['왼쪽','nudge-left'],['오른쪽','nudge-right'],['놓기','drop'],['시점 돌리기','move-view'],['취소','cancel']]);}
    // Inverse CSS camera ray intersected with the floor; changing yaw never changes world coordinates.
    function floorPoint(clientX,clientY){
      const r=stage.getBoundingClientRect(),x=(clientX-r.left-r.width/2)/focal,y=(clientY-r.top-r.height/2)/focal;
      const p=camera.pitch*Math.PI/180,a=camera.yaw*Math.PI/180;
      const yy=Math.cos(p)*y-Math.sin(p),zz=-Math.sin(p)*y-Math.cos(p);
      const xx=Math.cos(a)*x-Math.sin(a)*zz,z=Math.sin(a)*x+Math.cos(a)*zz;
      const floor=180+viewHeight+lift;if(yy<=.04)return null;const t=floor/yy;
      return {x:xx*t,z:z*t};
    }
    function previewDrop(x,z,support=null){
      if(!mode)return;const d=M.destination(s,mode.id,x,z,support);mode.candidate={x,z,support};
      const mark=app.querySelector('.c2-floor-target');mark.hidden=false;mark.classList.toggle('invalid',!d.ok);
      const p=d.ok?d:{x:Math.max(-240,Math.min(240,x)),z:Math.max(-245,Math.min(230,z))};
      mark.style.transform=`translate3d(${p.x-45}px,${179-(support?M.top(s,support):0)}px,${p.z}px) rotateX(90deg)`;
      if(d.ok){const size=M.sizes[mode.id],el=app.querySelector(`[data-object="${mode.id}"]`);el.style.transform=`translate3d(${d.x-size.w/2}px,${180-size.h-(support?M.top(s,support):0)}px,${d.z}px)`;
        const proposed={...s,boxes:{...s.boxes,[mode.id]:{x:d.x,z:d.z,on:d.on}}};robot=M.robotSpot(proposed,robot);updateCamera();}
    }
    function place(x,z,support=null){
      if(!mode)return;const {id,byRobot}=mode,d=M.move(s,id,x,z,support);
      if(!d.ok){say('student',d.reason);return;}
      mode=null;app.querySelector('.c2-floor-target').hidden=true;helpText.hidden=true;update();select(id);
      if(byRobot){walkRobot(d.x-85,d.z+15,()=>say('robot','지정하신 위치에 놓았습니다.'));}
    }
    function cancelMove(){mode=null;pointer=null;app.querySelector('.c2-floor-target').hidden=true;helpText.hidden=true;selection=null;actions('주변을 살펴보세요.',[]);update();}
    function pointerDown(e){
      if(busy||e.button!==0||e.isPrimary===false||e.target.closest('[data-c2]'))return;
      const object=e.target.closest('[data-object]')?.dataset.object;
      pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,moved:false,object,kind:null};suppress=false;
    }
    function supportAt(x,y){
      const selected=app.querySelector(`[data-object="${mode.id}"]`);selected.style.visibility='hidden';
      const surface=document.elementFromPoint(x,y),hit=surface?.closest('[data-object]');selected.style.visibility='';
      // Stack only on the top face, never by dragging across another crate's side.
      return surface?.closest('.c2-top')&&hit&&M.sizes[hit.dataset.object]&&hit.dataset.object!==mode.id?hit.dataset.object:null;
    }
    function pointerMove(e){
      if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
      if(Math.hypot(dx,dy)<7&&!pointer.moved)return;
      // Lock the gesture to its starting object. Empty-space drags always orbit,
      // even when the optional position controls are open.
      if(!pointer.moved){
        pointer.kind='look';
        if(M.sizes[pointer.object]&&!mode?.looking&&mode?.type!=='target'){
          const id=pointer.object,start=floorPoint(pointer.x,pointer.y),p=M.position(s,id);
          const ready=mode?.type==='move'&&mode.id===id||beginMove(id);
          pointer.kind=ready?'object':'blocked';
          pointer.offset=start?{x:p.x-start.x,z:p.z-start.z}:{x:0,z:0};
        }
      }
      pointer.moved=true;stage.setPointerCapture(e.pointerId);helpText.hidden=true;
      if(pointer.kind==='object'&&mode?.type==='move'){
        const support=supportAt(e.clientX,e.clientY),p=support?M.position(s,support):floorPoint(e.clientX,e.clientY);
        if(p)previewDrop(p.x+(support?0:pointer.offset.x),p.z+(support?0:pointer.offset.z),support);
      }
      else if(pointer.kind==='look'){camera.yaw=pointer.yaw-dx*.19/camera.zoom;camera.pitch=pointer.pitch+dy*.16/camera.zoom;updateCamera();}
      e.preventDefault();
    }
    function pointerUp(e){
      if(!pointer||pointer.id!==e.pointerId)return;suppress=pointer.moved;
      if(pointer.kind==='object'&&mode?.type==='move'&&mode.candidate){
        const {x,z,support}=mode.candidate;place(x,z,support);
        // A rejected drop returns the crate to its last saved location.
        if(mode){mode.candidate=null;app.querySelector('.c2-floor-target').hidden=true;update();}
      }
      if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);pointer=null;
    }
    function cancelPointer(){const dragging=pointer?.kind==='object';pointer=null;suppress=true;if(dragging)cancelMove();}
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
      function step(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-t0)/850);robot=M.robotSpot(s,{x:start.x+(x-start.x)*v,z:start.z+(z-start.z)*v});updateCamera();if(v<1)animation=requestAnimationFrame(step);else{busy=false;app.querySelector('.c2-robot')?.classList.remove('walking');done?.();}}
      animation=requestAnimationFrame(step);
    }
    function reachMessage(){const status=M.reach(s,standing);say('student',status==='floor'?'손이 닿지 않아.':status==='far'?'올라섰지만 창문에서 너무 멀어.':status==='low'?'이 높이에서는 B-0가 도와줘도 창틀까지 닿기 어렵겠어.':'조금만 더 올라가면 닿겠는데. 혼자서는 어렵겠어.');}
    function boostStudent(){
      if(s.assisted){say('robot','받쳐 드리고 있습니다. 창틀을 잡아 보세요.');return;}
      if(M.reach(s,standing)!=='needs-help'){reachMessage();return;}
      const id=standing,p=M.position(s,id);cancelMove();standing=id;
      say('robot','발을 받쳐 드릴게요. 준비되면 창틀을 잡으세요.');
      walkRobot(p.x-135,p.z+20,()=>{
        if(standing!==id||!M.boost(s,id))return;
        busy=true;update();const t0=performance.now();
        function rise(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-t0)/1100);lift=64*(v*v*(3-2*v));updateCamera();
          if(v<1)animation=requestAnimationFrame(rise);else{busy=false;save();say('student','닿았어! 조금만 기다려. 나도 너 잡아 줄게.');select('window');}}
        animation=requestAnimationFrame(rise);
      });
    }
    function showModal(title,body){
      app.querySelector('.c2-modal')?.remove();const d=document.createElement('dialog');d.className='modal c2-modal';d.innerHTML=`<div class="modal-header"><h2>${title}</h2>${button('닫기','close-modal','quiet')}</div><div class="modal-body">${body}</div>`;app.append(d);d.addEventListener('close',()=>{d.remove();stage?.focus({preventScroll:true});});d.showModal();
    }
    function ending(){
      cancelAnimationFrame(heightFrame);viewHeight=0;standing=null;mode=null;lift=0;const done=s.phase==='complete';
      app.innerHTML=`<main class="game c2-ending"><header><h1>내 위치: ${done?'연구소 통로':'창문 바깥'}</h1>${button('메뉴','menu','quiet')}</header><section class="c2-outside ${done?'together':''}"><div class="c2-ending-b0">${portrait()}</div><div class="c2-end-dialogue"><div class="speech ${done?'robot':'student'}"><b>${done?'B-0':'나'}</b><p>${done?'문은 없었지만, 함께 나왔습니다.':'이제 너 올라와. 손 줘.'}</p></div>${button(done?'2차시 마치기':'B-0의 손 잡기',done?'summary':'help-b0','primary')}</div></section><footer><small>${done?'2차시 · 문이 없는 방':'B-0가 아래에서 기다리고 있다.'}</small></footer></main>`;
    }
    function act(a){
      if(a==='close-modal'){app.querySelector('.c2-modal')?.close();return;}
      if(a==='menu'){showModal('메뉴',`<p>1차시와 2차시 진행은 따로 저장됩니다.</p><div class="options">${button('계속하기','close-modal','primary')}${button('조작 방법','controls')}${button('생각거리','hint')}${button('2차시 다시 시작','reset-confirm','quiet')}${button('1차시로 돌아가기','back','quiet')}</div>`);return;}
      if(a==='back'){dispose();onBack();return;}
      if(a==='reset-confirm'){showModal('2차시를 다시 시작할까요?',`<p>이 방의 상자 배치와 진행만 초기화합니다. 1차시 진행은 유지됩니다.</p>${button('초기화하고 시작','reset','primary')}`);return;}
      if(a==='reset'){cancelAnimationFrame(animation);cancelAnimationFrame(heightFrame);viewHeight=0;busy=false;lift=0;s=M.fresh();standing=null;mode=null;selection=null;camera={yaw:-48,pitch:-12,zoom:1};robot={x:-120,z:-145};save();render();return;}
      if(a==='controls'){showModal('조작 방법','<p>상자를 누른 채 끌면 바로 옮길 수 있습니다. 빈 공간을 끌면 방을 둘러봅니다. 짧게 누르면 물건의 행동이 나타납니다.</p><p>상자는 다른 상자 위에도 놓을 수 있습니다. 옮기기를 누르면 앞·뒤·왼쪽·오른쪽 버튼과 시점 돌리기 버튼을 사용할 수 있습니다. 위치를 조절한 뒤 놓기를 누르세요.</p><p>상자 위에서는 화면 아래의 내려가기를 누르세요. B-0에게 부탁할 때는 행동을 고르고 대상 물건을 누릅니다. 원위치로는 시점과 배율을 되돌립니다.</p>');return;}
      if(a==='hint'){s.hint=Math.min(4,s.hint+1);save();const hints=['','시선을 위아래로도 움직여 보세요.','창문처럼 보여도 정말 통로인지 확인해 보세요.','방 안의 물건으로 올라설 곳을 만들 수 있습니다.','통로가 보이는 창문 가까이에 넓은 상자를 놓고 작은 상자를 위에 쌓으세요. 올라선 뒤 B-0에게 나를 들어 올려 달라고 부탁해 보세요.'];showModal('생각거리',`<p>${hints[s.hint]}</p>${s.hint<4?button('조금 더 도움받기','hint'):''}`);return;}
      if(a==='help-b0'){if(s.phase!=='ledge'||busy)return;busy=true;app.querySelector('.c2-outside').classList.add('pulling');app.querySelector('[data-c2="help-b0"]').disabled=true;later(()=>{busy=false;if(M.finish(s)){save();ending();}},reduced()?0:1100);return;}
      if(a==='summary'){showModal('2차시 끝','<p>소년과 B-0가 함께 창문을 넘어 통로에 도착했습니다.</p><p>다음 차시는 아직 준비 중입니다.</p>'+button('탐색 기록 보기','record'));return;}
      if(a==='record'){const moves=s.logs.filter(l=>l.action==='move').length;showModal('이번 방의 기록',`<p>물건 이동 ${moves}회 · 생각거리 ${s.hint}단계 이용</p><p>${s.ventOpen?'환기 덮개 뒤가 막혀 있는 것을 확인했습니다.':'환기 덮개를 열지 않고 탈출했습니다.'}</p><p>어떤 것을 직접 확인했고, B-0에게는 무엇을 부탁했나요?</p>`);return;}
      if(s.phase!=='room')return;
      if(a==='down'){
        cancelAnimationFrame(animation);busy=false;viewHeight+=lift;lift=0;s.assisted=null;app.querySelector('.c2-robot').classList.remove('walking');const id=selection;standing=null;cancelMove();setViewHeight(0);if(id)select(id);return;
      }
      if(busy)return;
      if(a==='dismiss'){speech.hidden=true;return;}
      if(a==='home'){standing=null;lift=0;s.assisted=null;cancelMove();camera={yaw:-48,pitch:-12,zoom:1};setViewHeight(0,false);return;}
      if(a.startsWith('zoom-')){camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(a==='clear'||a==='cancel'){cancelMove();return;}
      if(a==='robot'){robotMenu();return;}
      if(a.startsWith('request-')){mode={type:'target',verb:a.slice(8)};actions('부탁할 대상 물건을 직접 눌러 주세요.',[['취소','cancel']]);return;}
      if(a==='boost'){boostStudent();return;}
      if(a==='survey'){walkRobot(-205,35,()=>say('robot','보이는 벽면에서는 다른 문을 찾지 못했습니다. 아직 확인하지 못한 곳도 있습니다.'));return;}
      if(a.startsWith('inspect-')){const id=a.slice(8);say('student',descriptions[id]);s.logs.push({action:'inspect',id});save();return;}
      if(a==='push-entry'){say('student','움직이지 않아. 다른 곳도 살펴봐야겠어.');return;}
      if(a==='vent'){s.ventOpen=!s.ventOpen;s.logs.push({action:'vent',open:s.ventOpen});update();select('vent');if(s.ventOpen)say('student','뒤가 금속판으로 막혀 있어. 통로처럼 보였는데…….');return;}
      if(a==='fake-window'){s.fakeWindowOpen=!s.fakeWindowOpen;s.logs.push({action:'fake-window',open:s.fakeWindowOpen});update();select('fake-window');if(s.fakeWindowOpen)say('student','창 바로 뒤가 벽이야. 여기로는 나갈 수 없겠어.');return;}
      if(a==='cabinet'){s.cabinetOpen=!s.cabinetOpen;update();select('cabinet');if(s.cabinetOpen)say('student','안에는 아무것도 없어.');return;}
      if(a==='move-view'){if(mode){mode.looking=!mode.looking;moveActions();}return;}
      if(a.startsWith('move-')){beginMove(a.slice(5));return;}
      if(a.startsWith('nudge-')){nudge(a.slice(6));return;}
      if(a==='drop'){if(mode?.candidate){const p=mode.candidate;place(p.x,p.z,p.support);}else say('student','놓을 위치를 먼저 지정해야겠어.');return;}
      if(a.startsWith('climb-')){const id=a.slice(6);if(s.boxes.small.on===id){say('student','위에 작은 상자가 놓여 있어. 올라설 상자를 다시 골라야겠어.');return;}standing=id;setViewHeight(M.top(s,id));select(id);say('student','올라서니 보이는 높이가 달라졌어.');return;}
      if(a==='open-window'){if(M.openWindow(s,standing)){update();say('student','열렸어. 너머로 넘어갈 수 있겠어.');select('window');}else reachMessage();return;}
      if(a==='exit'){if(M.exit(s,standing)){save();ending();}else reachMessage();}
    }
    function click(e){const b=e.target.closest('[data-c2]');if(b){e.preventDefault();act(b.dataset.c2);}}
    function dispose(){dead=true;timers.forEach(clearTimeout);cancelAnimationFrame(animation);cancelAnimationFrame(heightFrame);app.removeEventListener('click',click);window.removeEventListener('resize',updateCamera);app.querySelector('.c2-modal')?.remove();}
    app.addEventListener('click',click);window.addEventListener('resize',updateCamera);render();
    return {dispose};
  };
})();
