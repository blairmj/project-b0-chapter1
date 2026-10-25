(function(){
  'use strict';
  window.startChapterTwo=function({app,portrait,onBack,onNext,onHome,preview=false}){
    const SPACE=1.3;
    const M=window.B0RoomTwo,storage=preview?sessionStorage:localStorage,key='project-b0-room2-v1';
    let s;try{s=M.restore(JSON.parse(storage.getItem(key)));}catch{s=M.fresh();}
    let camera={yaw:-48,pitch:-12,zoom:1},standing=null,selection=null,mode=null,pointer=null,suppress=false,dead=false;
    let room,stage,world,actionbar,speech,helpText,focal=330,animation=0,busy=false;
    let robot={x:-120,z:-145},timers=[],lift=0,viewHeight=0,heightFrame=0;
    let viewX=0,viewZ=0,groundView=null,robotLift=0,travelling=false;
    const escaped=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const button=(t,a,cls='')=>`<button type="button" data-c2="${a}" class="${cls}">${t}</button>`;
    const save=()=>{try{storage.setItem(key,JSON.stringify(s));}catch{}};
    function later(f,ms){const t=setTimeout(()=>{if(!dead)f();},ms);timers.push(t);return t;}
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    function cube(id,w,h,d,cls=''){
      return `<div class="c2-cube ${cls}" ${id?`data-object="${id}" role="button" tabindex="0" aria-label="${M.sizes[id]?.name||'보관장'}"`:''} style="--w:${w}px;--h:${h}px;--d:${d}px;width:${w}px;height:${h}px">${['front','back','left','right','top'].map(f=>`<div class="c2-face c2-${f}"><i></i></div>`).join('')}</div>`;
    }
    function render(){
      if(s.phase==='complete'){ending();return;}
      app.innerHTML=`<main class="game c2-game"><header><h1>내 위치: 폐쇄 보관실</h1><nav>${button('← 원위치로','home','quiet')}${window.B0LessonJumpButton?.()||''}${button('메뉴','menu','quiet')}</nav></header>
      <section class="c2-stage" tabindex="0" aria-label="폐쇄 보관실. 빈 공간을 끌거나 방향키로 둘러보세요. 물건을 누르면 조사할 수 있습니다.">
      <div class="c2-world sf-cargo-world">
        <div class="c2-wall c2-wall-front"><div class="c2-light"></div></div><div class="c2-wall c2-wall-left"><div class="c2-light"></div></div><div class="c2-wall c2-wall-right"><div class="c2-light"></div></div><div class="c2-wall c2-wall-back"><div class="c2-light"></div></div><div class="c2-floor"></div><div class="c2-ceiling"></div><div class="sf-cargo-gantry" aria-hidden="true"><i></i><i></i><span></span></div>
        <button class="c2-entry c2-object" data-object="entry" aria-label="닫힌 입구"><span></span></button>
        <button class="c2-window c2-object" data-object="window" aria-label="높은 창문"><span class="c2-window-glass"></span><span class="c2-latch"></span></button>
        <button class="c2-window c2-fake-window c2-object" data-object="fake-window" aria-label="옆 벽의 창문"><span class="c2-window-glass"></span><span class="c2-latch"></span></button>
        <button class="c2-vent c2-object" data-object="vent" aria-label="벽면 환기 덮개"><span class="c2-vent-inside"></span><span class="c2-vent-lid"><i></i><i></i><i></i><i></i><i></i></span></button>
        <div class="c2-floor-target" hidden></div>
        ${cube('wide',118,62,92,'c2-wide')}${cube('small',76,56,68,'c2-small')}
        <div class="c2-cabinet" data-object="cabinet" role="button" tabindex="0" aria-label="보관장">${cube('',85,148,60)}<span class="c2-cabinet-door"></span></div>
        <div class="c2-robot" data-object="robot" role="button" tabindex="0" aria-label="B-0"><div class="robot-sprite live-body">${portrait()}</div><div class="c2-support-arm" hidden></div></div>
      </div><div class="c2-sill" hidden></div><div class="c2-player-grip" aria-hidden="true" hidden><div class="c2-player-arm"></div></div><p class="c2-basic-help">상자를 끌어 옮기기 · 빈 공간을 끌어 둘러보기</p><div class="c2-speech" aria-live="polite" hidden></div>
      </section><section class="c2-actions" aria-label="선택한 물체의 행동"><p>주변을 살펴보세요.</p></section>
      <footer><div class="zoom-controls">${button('−','zoom-out') }<output class="c2-zoom">100%</output>${button('+','zoom-in')}</div><button type="button" data-c2="down" class="c2-descend" hidden>내려가기</button>${button('B-0에게 부탁','robot','secondary')}</footer></main>`;
      room=app.querySelector('.c2-game');stage=app.querySelector('.c2-stage');world=app.querySelector('.c2-world');actionbar=app.querySelector('.c2-actions');speech=app.querySelector('.c2-speech');helpText=app.querySelector('.c2-basic-help');
      stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',pointerUp);stage.addEventListener('pointercancel',cancelPointer);
      stage.addEventListener('click',e=>{if(suppress){suppress=false;return;}if(busy||travelling||mode?.looking)return;const el=e.target.closest('[data-object]');if(s.phase==='ledge'){if(el?.dataset.object==='robot')act('help-b0');return;}if(el){if(!mode&&el.dataset.object==='vent'&&s.ventOpen&&e.target.closest('.c2-vent-lid'))act('vent');else select(el.dataset.object);}else if(mode?.type==='move'){const p=floorPoint(e.clientX,e.clientY);if(p)place(p.x,p.z);}});
      stage.addEventListener('wheel',e=>{e.preventDefault();if(s.phase!=='room'||travelling)return;if(!mode)camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom-e.deltaY*.001));updateCamera();},{passive:false});
      stage.addEventListener('keydown',keyDown);
      update();
      if(s.phase==='ledge'){enterLedge(false);return;}
      if(!s.logs.length)say('student','입구가 닫혔어. 다른 데부터 보자.');
    }
    function updateCamera(){
      if(!stage||!stage.isConnected)return;
      camera.pitch=Math.max(-82,Math.min(60,camera.pitch));camera.yaw=((camera.yaw+180)%360+360)%360-180;
      focal=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;
      stage.style.perspective=focal+'px';
      // Only the observer moves. Every prop keeps its saved world coordinates.
      const elevation=viewHeight+lift;
      world.style.transform=`translateZ(${focal}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(${-viewX*SPACE}px,${elevation}px,${-viewZ*SPACE}px)`;
      stage.dataset.yaw=camera.yaw;stage.dataset.pitch=camera.pitch;
      stage.dataset.eyeX=viewX;stage.dataset.eyeZ=viewZ;stage.dataset.eyeHeight=elevation;
      const r=app.querySelector('.c2-robot');r.style.transform=`translate3d(${robot.x-48}px,${24-robotLift}px,${robot.z}px) rotateY(${-camera.yaw}deg)${s.phase==='ledge'?` rotateX(${-camera.pitch}deg)`:''}`;
      window.B0RoomSpace?.sync(world);
      const zoom=app.querySelector('.c2-zoom'),down=app.querySelector('.c2-descend');if(zoom)zoom.textContent=Math.round(camera.zoom*100)+'%';if(down)down.hidden=!standing||s.phase!=='room';
    }
    const view=()=>({x:viewX,z:viewZ,height:viewHeight,yaw:camera.yaw,pitch:camera.pitch,zoom:camera.zoom});
    const direction=(x,z)=>Math.atan2(x,-z)*180/Math.PI;
    function travel(points,done,animate=true){
      cancelAnimationFrame(heightFrame);
      travelling=true;pointer=null;
      function segment(){
        const target=points.shift();if(!target){travelling=false;done?.();return;}
        const from=view(),to={...from,...target},t0=performance.now();
        const turn=((to.yaw-from.yaw+540)%360)-180;
        function step(t){if(dead)return;const v=!animate||reduced()?1:Math.min(1,(t-t0)/(target.ms||450)),e=v*v*(3-2*v);
          viewX=from.x+(to.x-from.x)*e;viewZ=from.z+(to.z-from.z)*e;viewHeight=from.height+(to.height-from.height)*e;
          camera.yaw=from.yaw+turn*e;camera.pitch=from.pitch+(to.pitch-from.pitch)*e;camera.zoom=from.zoom+(to.zoom-from.zoom)*e;updateCamera();
          if(v<1)heightFrame=requestAnimationFrame(step);else segment();}
        if(!animate||reduced())step(t0);else heightFrame=requestAnimationFrame(step);
      }
      segment();
    }
    function climb(id){
      const p=M.position(s,id),base=M.sizes[s.boxes[id].on||id],start=view();
      const dx=start.x-p.x,dz=start.z-p.z,length=Math.hypot(dx,dz)||1,ux=length===1&&dx===0&&dz===0?0:dx/length,uz=length===1&&dx===0&&dz===0?1:dz/length;
      const distance=Math.min(ux?Math.abs((base.w/2+30)/ux):Infinity,uz?Math.abs((base.d/2+30)/uz):Infinity);
      const edge={x:p.x+ux*distance,z:p.z+uz*distance},yaw=direction(p.x-edge.x,p.z-edge.z);
      groundView={...start,edge};standing=id;speech.hidden=true;actions('상자에 다가가는 중…',[]);
      travel([{...edge,height:0,yaw,pitch:-24,ms:650},{...edge,height:M.top(s,id),pitch:-42,ms:450},{x:p.x,z:p.z,height:M.top(s,id),pitch:-56,ms:400}],()=>{select(id);say('student','올라왔어. 이제 주위를 살펴보자.');});
    }
    function update(){
      if(s.phase==='complete')return;
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
    function describe(id){
      if(id==='vent'&&s.ventOpen)return '열린 덮개 뒤가 금속판으로 막혀 있다. 이곳으로는 지나갈 수 없다.';
      if(id==='fake-window'&&s.fakeWindowOpen)return '열린 창 바로 뒤가 벽이다. 빛은 들어오지만 통로는 아니다.';
      if(id==='cabinet'&&s.cabinetOpen)return '보관장 안은 비어 있다. 벽에 고정되어 있어 옮길 수 없다.';
      if(id==='window'&&s.windowOpen)return '걸쇠가 풀려 있다. 창 너머로 통로가 이어진다.';
      return descriptions[id];
    }
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
      return {x:viewX+xx*t/SPACE,z:viewZ+z*t/SPACE};
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
      if(busy||travelling||s.phase!=='room'||e.button!==0||e.isPrimary===false||e.target.closest('[data-c2]'))return;
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
      if(busy||travelling)return;
      if(s.phase==='ledge'){if((e.key==='Enter'||e.key===' ')&&e.target.dataset.object==='robot'){e.preventDefault();act('help-b0');}return;}
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
        busy=true;update();const t0=performance.now(),fromYaw=camera.yaw,fromPitch=camera.pitch;
        const targetYaw=direction(105-viewX,-296-viewZ),turn=((targetYaw-fromYaw+540)%360)-180,targetPitch=-Math.atan2(viewHeight+64-150,Math.hypot(105-viewX,-296-viewZ))*180/Math.PI;
        function rise(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-t0)/1100),e=v*v*(3-2*v);lift=64*e;camera.yaw=fromYaw+turn*e;camera.pitch=fromPitch+(targetPitch-fromPitch)*e;updateCamera();
          if(v<1)animation=requestAnimationFrame(rise);else{busy=false;save();say('student','닿았어! 조금만 기다려. 나도 너 잡아 줄게.');select('window');}}
        animation=requestAnimationFrame(rise);
      });
    }
    function showModal(title,body){
      app.querySelector('.c2-modal')?.remove();const d=document.createElement('dialog');d.className='modal c2-modal';d.innerHTML=`<div class="modal-header"><h2>${title}</h2>${button('닫기','close-modal','quiet')}</div><div class="modal-body">${body}</div>`;app.append(d);d.addEventListener('close',()=>{d.remove();stage?.focus({preventScroll:true});});d.showModal();
    }
    function enterLedge(animate=true){
      cancelAnimationFrame(animation);busy=false;mode=null;selection=null;standing=null;viewHeight+=lift;lift=0;s.assisted=null;
      if(!animate){const p=M.position(s,'small');robot=M.robotSpot(s,{x:p.x-135,z:p.z+20});}
      const actor=app.querySelector('.c2-robot');actor.classList.remove('boosting','walking','hand-held');actor.classList.add('reaching');actor.querySelector('.c2-support-arm').hidden=true;
      app.querySelector('.c2-player-grip').hidden=true;
      actor.style.setProperty('--rescue-climb','0');stage.style.setProperty('--rescue-fade','0');stage.dataset.rescueStage='reach';
      room.classList.add('c2-ledge-game');app.querySelector('header h1').textContent='내 위치: 창틀 위';
      app.querySelector('[data-c2="home"]').hidden=true;app.querySelector('footer').innerHTML='<small>창틀에 앉아 방 안을 내려다보고 있다.</small>';
      stage.setAttribute('aria-label','창틀에서 방 안의 B-0를 내려다보는 장면');
      speech.hidden=true;helpText.hidden=true;actions('창틀을 넘어 몸을 돌리는 중…',[]);
      const x=105,z=-286,height=200,dx=robot.x-x,dz=robot.z-z;
      const yaw=direction(dx,dz),pitch=-Math.atan2(height+90,Math.hypot(dx,dz)*SPACE)*180/Math.PI;
      travel([{x,z,height,pitch:-5,ms:650},{yaw,pitch,zoom:1.35,ms:750}],()=>{
        app.querySelector('.c2-sill').hidden=false;actions('아래에 있는 B-0에게 손 내밀기',[['B-0의 손 잡기','help-b0']]);say('student','이제 너 올라와. 손 줘.');
      },animate);
    }
    function rescuePose(progress){
      const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
      const handReach=ease(progress/.16),grip=ease((progress-.16)/.06),haul=ease((progress-.22)/.48),crest=ease((progress-.7)/.3);
      return {lift:10*grip+185*haul+85*crest,approach:.08*grip+.65*haul+.27*crest,handReach,contact:progress>=.16,
        blend:ease((progress-.55)/.22),fade:ease((progress-.94)/.06),
        phase:progress<.16?'reach':progress<.22?'grip':progress<.7?'pull':'climb'};
    }
    function handAnchor(blend){
      // The robot faces the camera, so its local palm offset projects directly
      // onto the screen. Both key poses share this registered hand position.
      const a=camera.yaw*Math.PI/180,p=camera.pitch*Math.PI/180;
      const dx=(robot.x-viewX)*SPACE,dz=(robot.z-viewZ)*SPACE,dy=102-robotLift+viewHeight+lift;
      const x=Math.cos(a)*dx+Math.sin(a)*dz,z=-Math.sin(a)*dx+Math.cos(a)*dz;
      const y=Math.cos(p)*dy-Math.sin(p)*z,depth=Math.sin(p)*dy+Math.cos(p)*z;
      const scale=-focal/Math.min(-10,depth),u=.29+(.225-.29)*blend,v=.13+(.12-.13)*blend;
      return {x:stage.clientWidth/2+(x+(u-.5)*96)*scale,y:stage.clientHeight/2+(y+6+v*144-78)*scale,scale};
    }
    function updatePlayerGrip(pose){
      const anchor=handAnchor(pose.blend),overlay=app.querySelector('.c2-player-grip'),arm=overlay.querySelector('.c2-player-arm');
      const origin={x:stage.clientWidth*(.08+.1*pose.approach),y:stage.clientHeight+35};
      const x=origin.x+(anchor.x-origin.x)*pose.handReach,y=origin.y+(anchor.y-origin.y)*pose.handReach;
      const width=Math.max(76.5,Math.min(stage.clientWidth*.425,106.25*anchor.scale));
      const length=Math.max(25,Math.hypot(origin.x-x,origin.y-y));
      const angle=Math.atan2(-(origin.x-x),origin.y-y)*180/Math.PI;
      overlay.hidden=false;overlay.classList.toggle('clasped',pose.contact);overlay.style.left=x+'px';overlay.style.top=y+'px';overlay.style.transform=`rotate(${angle}deg)`;
      overlay.style.opacity=String(Math.min(1,pose.handReach*2));
      arm.style.width=width+'px';arm.style.height=(length+width*.5)+'px';arm.style.left=(-width/2)+'px';arm.style.top=(-width*.5)+'px';
      arm.style.borderTopWidth=(width*800/888)+'px';arm.style.borderBottomWidth=(width*200/888)+'px';
      stage.dataset.handContact=pose.contact?'held':'reaching';
    }
    function pullCompanion(){
      if(s.phase!=='ledge'||busy||travelling)return;
      busy=true;const gripButton=app.querySelector('[data-c2="help-b0"]');gripButton.disabled=true;gripButton.textContent='끌어올리는 중…';say('student','잡았어. 놓지 마!');
      const from={...robot},t0=performance.now(),actor=app.querySelector('.c2-robot');
      function step(t){if(dead)return;const v=reduced()?1:Math.min(1,(t-t0)/3400),pose=rescuePose(v);
        robot={x:from.x+(viewX-from.x)*pose.approach,z:from.z+(viewZ+80-from.z)*pose.approach};robotLift=pose.lift;
        actor.style.setProperty('--rescue-climb',String(pose.blend));actor.classList.toggle('hand-held',pose.contact);stage.style.setProperty('--rescue-fade',String(pose.fade));stage.dataset.rescueStage=pose.phase;
        camera.yaw=direction(robot.x-viewX,robot.z-viewZ);camera.pitch=-Math.atan2(viewHeight+94-robotLift-50*pose.approach,Math.hypot(robot.x-viewX,robot.z-viewZ)*SPACE)*180/Math.PI;updateCamera();updatePlayerGrip(pose);
        if(v<1)animation=requestAnimationFrame(step);else{busy=false;if(M.finish(s)){save();ending();}}
      }
      animation=requestAnimationFrame(step);
    }
    function ending(){
      if(s.phase==='ledge'){enterLedge();return;}
      cancelAnimationFrame(heightFrame);viewHeight=0;standing=null;mode=null;lift=0;const done=s.phase==='complete';
      app.innerHTML=`<main class="game c2-ending"><header><h1>내 위치: ${done?'연구소 통로':'창문 바깥'}</h1>${window.B0LessonJumpButton?.()||''}${button('메뉴','menu','quiet')}</header><section class="c2-outside ${done?'together':''}"><div class="c2-ending-b0">${portrait()}</div><div class="c2-end-dialogue"><div class="speech ${done?'robot':'student'}"><b>${done?'B-0':'나'}</b><p>${done?'문은 없었지만, 함께 나왔습니다.':'이제 너 올라와. 손 줘.'}</p></div>${button(done?'복도 따라가기':'B-0의 손 잡기',done?'chapter-three':'help-b0','primary')+(done?button('이번 방의 기록','summary','quiet'):'')}</div></section><footer><small>${done?'B-0와 함께 통로에 도착했다.':'B-0가 아래에서 기다리고 있다.'}</small></footer></main>`;
    }
    function act(a){
      if(a==='campaign-home'){onHome?.();return;}
      if(a==='close-modal'){app.querySelector('.c2-modal')?.close();return;}
      if(a==='menu'){showModal('메뉴',`<p>모험의 진행은 자동 저장됩니다.</p><div class="options">${button('계속하기','close-modal','primary')}${button('시작 화면으로','campaign-home','secondary')}${button('조작 방법','controls')}${button('생각거리','hint')}${button('2차시 다시 시작','reset-confirm','quiet')}${button('1차시로 돌아가기','back','quiet')}</div>`);return;}
      if(a==='back'){dispose();onBack();return;}
      if(a==='reset-confirm'){showModal('2차시를 다시 시작할까요?',`<p>이 방의 상자 배치와 진행만 초기화합니다. 1차시 진행은 유지됩니다.</p>${button('초기화하고 시작','reset','primary')}`);return;}
      if(a==='reset'){cancelAnimationFrame(animation);cancelAnimationFrame(heightFrame);viewX=0;viewZ=0;viewHeight=0;groundView=null;robotLift=0;travelling=false;busy=false;lift=0;s=M.fresh();standing=null;mode=null;selection=null;camera={yaw:-48,pitch:-12,zoom:1};robot={x:-120,z:-145};save();render();return;}
      if(a==='controls'){showModal('조작 방법','<p>상자를 누른 채 끌면 바로 옮길 수 있습니다. 빈 공간을 끌면 방을 둘러봅니다. 짧게 누르면 물건의 행동이 나타납니다.</p><p>상자는 다른 상자 위에도 놓을 수 있습니다. 옮기기를 누르면 앞·뒤·왼쪽·오른쪽 버튼과 시점 돌리기 버튼을 사용할 수 있습니다. 위치를 조절한 뒤 놓기를 누르세요.</p><p>상자 위에서는 화면 아래의 내려가기를 누르세요. B-0에게 부탁할 때는 행동을 고르고 대상 물건을 누릅니다. 원위치로는 시점과 배율을 되돌립니다.</p>');return;}
      if(a==='hint'){s.hint=Math.min(4,s.hint+1);save();const hints=['','시선을 위아래로도 움직여 보세요.','창문처럼 보여도 정말 통로인지 확인해 보세요.','방 안의 물건으로 올라설 곳을 만들 수 있습니다.','통로가 보이는 창문 가까이에 넓은 상자를 놓고 작은 상자를 위에 쌓으세요. 올라선 뒤 B-0에게 나를 들어 올려 달라고 부탁해 보세요.'];showModal('생각거리',`<p>${hints[s.hint]}</p>${s.hint<4?button('조금 더 도움받기','hint'):''}`);return;}
      if(a==='help-b0'){pullCompanion();return;}
      if(a==='chapter-three'){if(s.phase==='complete'&&onNext){dispose();onNext();}return;}
      if(a==='summary'){showModal('2차시 끝','<p>소년과 B-0가 함께 창문을 넘어 통로에 도착했습니다.</p>'+button('복도 따라가기','chapter-three','primary')+button('탐색 기록 보기','record'));return;}
      if(a==='record'){const moves=s.logs.filter(l=>l.action==='move').length;showModal('이번 방의 기록',`<p>물건 이동 ${moves}회 · 생각거리 ${s.hint}단계 이용</p><p>${s.ventOpen?'환기 덮개 뒤가 막혀 있는 것을 확인했습니다.':'환기 덮개를 열지 않고 탈출했습니다.'}</p><p>어떤 것을 직접 확인했고, B-0에게는 무엇을 부탁했나요?</p>`);return;}
      if(a==='dismiss'){speech.hidden=true;return;}
      if(s.phase!=='room')return;
      if(a==='down'){
        if(!standing)return;cancelAnimationFrame(animation);busy=false;viewHeight+=lift;lift=0;s.assisted=null;app.querySelector('.c2-robot').classList.remove('walking');const id=selection,ground=groundView||{x:0,z:0,height:0,yaw:camera.yaw,pitch:-12};standing=null;cancelMove();speech.hidden=true;actions('상자에서 내려오는 중…',[]);
        travel([{...(ground.edge||ground),height:viewHeight,ms:350},{...(ground.edge||ground),height:0,ms:400},{...ground,ms:500}],()=>{groundView=null;if(id)select(id);else actions('주변을 살펴보세요.',[]);say('student','바닥으로 내려왔어.');});return;
      }
      if(busy||travelling)return;
      if(a==='home'){standing=null;lift=0;s.assisted=null;groundView=null;cancelMove();camera={yaw:-48,pitch:-12,zoom:1};travel([{x:0,z:0,height:0}],null,false);return;}
      if(a.startsWith('zoom-')){camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(a==='clear'||a==='cancel'){cancelMove();return;}
      if(a==='robot'){robotMenu();return;}
      if(a.startsWith('request-')){mode={type:'target',verb:a.slice(8)};actions('부탁할 대상 물건을 직접 눌러 주세요.',[['취소','cancel']]);return;}
      if(a==='boost'){boostStudent();return;}
      if(a==='survey'){walkRobot(-205,35,()=>say('robot','보이는 벽면에서는 다른 문을 찾지 못했습니다. 아직 확인하지 못한 곳도 있습니다.'));return;}
      if(a.startsWith('inspect-')){const id=a.slice(8);say('student',describe(id));s.logs.push({action:'inspect',id});save();return;}
      if(a==='push-entry'){say('student','움직이지 않아. 다른 곳도 살펴봐야겠어.');return;}
      if(a==='vent'){s.ventOpen=!s.ventOpen;s.logs.push({action:'vent',open:s.ventOpen});update();select('vent');if(s.ventOpen)say('student','뒤가 금속판으로 막혀 있어. 통로처럼 보였는데…….');return;}
      if(a==='fake-window'){s.fakeWindowOpen=!s.fakeWindowOpen;s.logs.push({action:'fake-window',open:s.fakeWindowOpen});update();select('fake-window');if(s.fakeWindowOpen)say('student','창 바로 뒤가 벽이야. 여기로는 나갈 수 없겠어.');return;}
      if(a==='cabinet'){s.cabinetOpen=!s.cabinetOpen;update();select('cabinet');if(s.cabinetOpen)say('student','안에는 아무것도 없어.');return;}
      if(a==='move-view'){if(mode){mode.looking=!mode.looking;moveActions();}return;}
      if(a.startsWith('move-')){beginMove(a.slice(5));return;}
      if(a.startsWith('nudge-')){nudge(a.slice(6));return;}
      if(a==='drop'){if(mode?.candidate){const p=mode.candidate;place(p.x,p.z,p.support);}else say('student','놓을 위치를 먼저 지정해야겠어.');return;}
      if(a.startsWith('climb-')){const id=a.slice(6);if(standing)return;if(s.boxes.small.on===id){say('student','위에 작은 상자가 놓여 있어. 올라설 상자를 다시 골라야겠어.');return;}climb(id);return;}
      if(a==='open-window'){if(M.openWindow(s,standing)){update();say('student','열렸어. 너머로 넘어갈 수 있겠어.');select('window');}else reachMessage();return;}
      if(a==='exit'){if(M.exit(s,standing)){save();ending();}else reachMessage();}
    }
    function click(e){const b=e.target.closest('[data-c2]');if(b){e.preventDefault();act(b.dataset.c2);}}
    function dispose(){dead=true;timers.forEach(clearTimeout);cancelAnimationFrame(animation);cancelAnimationFrame(heightFrame);app.removeEventListener('click',click);window.removeEventListener('resize',updateCamera);app.querySelector('.c2-modal')?.remove();}
    app.addEventListener('click',click);window.addEventListener('resize',updateCamera);render();
    function jumpToEnd(){s.windowOpen=true;s.phase='ledge';M.finish(s);s.logs.push({action:'temporary-skip'});save();}
    return {dispose,jumpToEnd};
  };
})();
