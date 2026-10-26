(function(){
  'use strict';
  window.startMirrorRoom=function({app,portrait,state,onSave,onBack,onComplete,onHome}){
    const SPACE=1.95;
    const M=window.B0Mirror,s=state;
    let stage,world,bar,speech,pointer=null,selection=null,targetMode=false,suppress=false,dead=false,robotBusy=false,camFrame=0,botFrame=0,handFrame=0,pulse=0,timers=[],audio;
    let camera={x:-150,z:35,yaw:58,pitch:-8,zoom:1};
    const controlZ={circle:-135,triangle:-55,square:25};
    let robot=robotPosition();
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const b=(t,a,cls='')=>`<button type="button" data-mr="${a}" class="${cls}">${t}</button>`;
    const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save=()=>onSave();
    function later(fn,ms){const id=setTimeout(()=>{if(!dead)fn();},ms);timers.push(id);return id;}
    function robotPosition(){return s.phase==='approach'&&s.line<2?{x:-65,z:-55}:s.holding?{x:245,z:controlZ[s.holding]+48}:['reunited','complete'].includes(s.phase)?{x:-92,z:-35}:{x:145,z:55};}
    function glyph(id){return id==='circle'?'<circle cx="20" cy="20" r="12"/>':id==='triangle'?'<path d="M20 6 35 32H5Z"/>':'<rect x="8" y="8" width="24" height="24"/>';}
    function symbol(id,cls=''){return `<svg class="mr-symbol ${cls}" viewBox="0 0 40 40" aria-hidden="true">${glyph(id)}</svg>`;}
    function actions(title,items=[]){bar.innerHTML=`<strong>${esc(title)}</strong><div>${items.map(([label,a,c])=>b(label,a,c||'')).join('')}</div>`;if(robotBusy)bar.querySelectorAll('[data-mr^="command-"]').forEach(el=>el.disabled=true);}
    function sound(kind){
      try{if(JSON.parse((location.pathname.endsWith('/preview-v2.html')?sessionStorage:localStorage).getItem('project-b0-firstperson-v4')||'{}').muted)return;
        audio||=new(window.AudioContext||window.webkitAudioContext)();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.setValueAtTime(kind==='unlock'?460:125,audio.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='unlock'?690:60,audio.currentTime+.18);g.gain.setValueAtTime(.018,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.25);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.26);
      }catch{}
    }
    function say(who,text,next=false){speech.hidden=false;speech.innerHTML=`<div class="speech ${who}"><b>${who==='robot'?'B-0':'나'}</b><p>${esc(text)}</p></div>${b(next?'다음':'대화 닫기',next?'intro-next':'dismiss','quiet')}`;const el=app.querySelector('.mr-robot');el.classList.toggle('speaking',who==='robot');later(()=>el.classList.remove('speaking'),Math.min(4500,text.length*80));}
    function render(){
      const approaching=s.phase==='approach',glassUp=approaching&&s.line<2||M.solved(s);
      app.innerHTML=`<main class="game c2-game mr-game">${window.B0UI?.header({place:`거울 관찰실`,namespace:"mr",reset:"home",zoomClass:"mr-zoom",active:true})||""}
      <section class="c2-stage mr-stage" tabindex="0" aria-label="유리벽으로 나뉜 관찰실. 빈 공간을 끌어 둘러보고 물건을 눌러 살펴보세요."><div class="c2-world mr-world">
      ${['front','left','right','back'].map(f=>`<div class="c2-wall c2-wall-${f}"><div class="c3-conduit"></div><div class="c2-light"></div></div>`).join('')}<div class="c2-floor"></div><div class="c2-ceiling"></div><div class="sf-optical-apparatus" aria-hidden="true"></div>
      <div class="mr-room-sign" aria-hidden="true"><small>VISUAL PERCEPTION LAB</small><strong>시각 인식 관찰실</strong></div>
      <div class="mr-partition ${glassUp?'raised':''}"><div class="mr-glass"><i></i><i></i><span class="mr-glass-edge" data-mr-object="glass" role="button" tabindex="0" aria-label="두 구역 사이의 유리벽"></span></div></div><div class="mr-glass-rail" aria-hidden="true"></div>
      <div class="mr-door" data-mr-object="door" role="button" tabindex="0" aria-label="관찰실 출입문"><span class="mr-passage"></span><div class="mr-door-leaf"><span class="mr-door-plate">${symbol('triangle')}</span><span class="mr-door-grip"></span></div><i class="mr-bolt mr-bolt-upper"></i><i class="mr-bolt mr-bolt-lower"></i></div>
      <div class="mr-own-lever" data-mr-object="own" role="button" tabindex="0" aria-label="문 옆 수동 손잡이"><svg class="mr-hand-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M10 28V15q0-3 3-3t3 3v5-13q0-3 3-3t3 3v13-11q0-3 3-3t3 3v11-6q0-3 3-3t3 3v14l-7 9H16Z"/></svg><span class="mr-lever-track"></span><span class="mr-own-knob" data-mr-drag="own"><i></i></span></div>
      <div class="mr-control-panel" data-mr-object="panel" role="group" aria-label="B-0 쪽 조작반">${M.symbols.map((id,i)=>`<div class="mr-remote-lever" data-mr-object="${id}" role="button" tabindex="0" aria-label="${M.names[id]} 손잡이" style="left:${-118+i*82}px">${symbol(id)}<span class="mr-lever-track"></span><span class="mr-remote-knob" data-knob="${id}"><i></i></span></div>`).join('')}</div>
      <div class="mr-vent" data-mr-object="vent" role="button" tabindex="0" aria-label="반대편 환기 장치"><span></span><i></i><i></i><i></i></div>
      <div class="mr-entry" data-mr-object="entry" role="button" tabindex="0" aria-label="지나온 통로의 문"><i></i><i></i></div>
      <div class="c2-robot mr-robot" data-mr-object="robot" role="button" tabindex="0" aria-label="유리 너머 B-0"><div class="robot-sprite live-body">${portrait()}</div></div>
      </div><p class="c2-basic-help">빈 공간을 끌어 둘러보기 · 물건을 눌러 살펴보기</p><div class="c2-speech mr-speech" aria-live="polite" hidden></div></section>
      <section class="c2-actions mr-actions" aria-label="선택한 물건의 행동"></section><footer>${b('B-0에게 말하기','robot','secondary')}${window.B0UI?.inventoryButton()||''}</footer></main>`;
      stage=app.querySelector('.mr-stage');world=app.querySelector('.mr-world');bar=app.querySelector('.mr-actions');speech=app.querySelector('.mr-speech');
      stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',cancelPointer);
      stage.addEventListener('click',e=>{if(suppress){suppress=false;return;}if(e.target.closest('[data-mr]'))return;const id=e.target.closest('[data-mr-object]')?.dataset.mrObject;if(id)activateObject(id);});
      stage.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.dataset.mrObject){e.preventDefault();activateObject(e.target.dataset.mrObject);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')camera.yaw-=15;if(e.key==='ArrowRight')camera.yaw+=15;if(e.key==='ArrowUp')camera.pitch+=8;if(e.key==='ArrowDown')camera.pitch-=8;updateCamera();});
      stage.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=Math.max(.7,Math.min(1.65,camera.zoom-e.deltaY*.001));updateCamera();},{passive:false});
      update();if(approaching)introLine();else if(s.phase==='unlocked')unlockedActions();else if(['reunited','complete'].includes(s.phase))joinedActions();else actions('방 안을 자유롭게 살펴보세요.');
      if(!approaching&&s.phase==='split')actions('방 안을 자유롭게 살펴보세요.');
    }
    function updateCamera(){
      if(dead||!stage?.isConnected)return;camera.yaw=((camera.yaw+180)%360+360)%360-180;camera.pitch=Math.max(-58,Math.min(40,camera.pitch));camera.x=Math.min(-38,camera.x);
      const f=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;stage.style.perspective=f+'px';world.style.transform=`translateZ(${f}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(${-camera.x*SPACE}px,0px,${-camera.z*SPACE}px)`;
      stage.dataset.yaw=camera.yaw;stage.dataset.pitch=camera.pitch;stage.dataset.cameraX=camera.x;app.querySelector('.mr-zoom').textContent=Math.round(camera.zoom*100)+'%';
      app.querySelector('.mr-robot').style.transform=`translate3d(${robot.x-48}px,24px,${robot.z}px) rotateY(${-camera.yaw}deg)`;window.B0RoomSpace?.sync(world);
    }
    function update(){
      if(dead||!stage?.isConnected)return;const solved=M.solved(s),up=s.phase==='approach'&&s.line<2||solved;
      app.querySelector('.mr-partition').classList.toggle('raised',up);app.querySelector('.mr-door').classList.toggle('open',solved);app.querySelector('.mr-bolt-upper').classList.toggle('released',solved||s.active==='triangle');app.querySelector('.mr-bolt-lower').classList.toggle('released',solved||s.own>=.86);
      app.querySelector('.mr-own-knob').style.transform=`translateY(${s.own*70}px)`;
      for(const id of M.symbols)app.querySelector(`[data-knob="${id}"]`).style.transform=`translateY(${s.active===id?80:0}px)`;
      world.classList.toggle('mr-dim',s.lights);app.querySelector('.mr-vent').classList.toggle('vent-closed',s.vent);
      const bot=app.querySelector('.mr-robot');bot.classList.toggle('holding',!!s.holding||!!s.active);bot.dataset.holding=s.holding||'';stage.dataset.phase=s.phase;updateCamera();
    }
    function cameraTo(to){
      cancelAnimationFrame(camFrame);const from={...camera},start=performance.now(),turn=(((to.yaw??from.yaw)-from.yaw+540)%360)-180;
      function step(t){if(dead)return;const v=reduce()?1:Math.min(1,(t-start)/600),e=v*v*(3-2*v);for(const k of ['x','z','pitch','zoom'])camera[k]=from[k]+((to[k]??from[k])-from[k])*e;camera.yaw=from.yaw+turn*e;updateCamera();if(v<1)camFrame=requestAnimationFrame(step);}
      camFrame=requestAnimationFrame(step);
    }
    function walk(to,done){
      cancelAnimationFrame(botFrame);robotBusy=true;bar?.querySelectorAll('[data-mr^="command-"]').forEach(el=>el.disabled=true);const from={...robot},start=performance.now();app.querySelector('.mr-robot').classList.add('walking');
      function step(t){if(dead)return;const v=reduce()?1:Math.min(1,(t-start)/950),e=v*v*(3-2*v);robot={x:from.x+(to.x-from.x)*e,z:from.z+(to.z-from.z)*e};updateCamera();if(v<1)botFrame=requestAnimationFrame(step);else{robotBusy=false;app.querySelector('.mr-robot').classList.remove('walking');done?.();if(!robotBusy)bar?.querySelectorAll('[data-mr^="command-"]').forEach(el=>el.disabled=false);}}
      botFrame=requestAnimationFrame(step);
    }
    function introLine(){
      const lines=[['student','이 관찰실을 지나면 계단 쪽 복도로 이어지는 거네.'],['robot','먼저 들어가 보겠습니다.'],['student','야, 너 혼자 먼저 가면 어떡해!'],['robot','먼저 가라고 하셨습니다.'],['student','그건 아까 창문에서 한 말이잖아!'],['student','일단 각자 살펴보자.']];
      say(...lines[s.line],true);if(s.line===5)speech.querySelector('button').textContent='주변 살펴보기';actions('계단 쪽으로 이어지는 관찰실');
    }
    function nextIntro(){
      if(s.phase!=='approach'||robotBusy)return;
      if(s.line===1){speech.querySelector('button').disabled=true;walk({x:145,z:55},()=>{s.line=2;save();update();sound('glass');introLine();});return;}
      if(s.line===5){s.phase='split';save();speech.hidden=true;actions('방 안을 자유롭게 살펴보세요.');update();return;}
      s.line++;save();update();introLine();
    }
    function activateObject(id){if(!targetMode&&id==='door'&&M.solved(s)){leave();return;}select(id);}
    function select(id){
      if(s.phase==='approach')return;selection=id;speech.hidden=true;
      if(targetMode&&M.symbols.includes(id)){targetMode=false;cameraTo({x:-55,z:-55,yaw:90,pitch:-5,zoom:1.45});requestMenu(id);return;}
      if(id==='robot'){robotMenu();return;}
      const positions={door:{x:-160,z:-130,yaw:0,pitch:-5},own:{x:-180,z:-120,yaw:-20,pitch:-5},glass:{x:-105,z:0,yaw:90,pitch:-8},panel:{x:-55,z:-55,yaw:90,pitch:-5,zoom:1.45},vent:{x:-80,z:-200,yaw:70,pitch:12},entry:{x:-150,z:140,yaw:180,pitch:-8}};
      if(M.symbols.includes(id)){cameraTo(positions.panel);leverActions(id);return;}
      if(positions[id])cameraTo(positions[id]);
      const labels={door:'관찰실 출입문',own:'문 옆 수동 손잡이',glass:'두 구역 사이의 유리벽',panel:'유리 너머 조작반',vent:'반대편 환기 장치',entry:'지나온 통로의 문'};
      const items=[['살펴보기','inspect-'+id]];if(id==='door')items.push([M.solved(s)?'함께 통로로 나가기':'문 당겨 보기',M.solved(s)?'leave':'try-door']);if(id==='own'&&!M.solved(s))items.push(['손잡이 당기기','pull']);items.push(['선택 닫기','clear']);actions(labels[id]||'물건',items);
    }
    function leverActions(id){selection=id;actions(M.names[id]+' 손잡이',[['살펴보기','inspect-'+id],...(['split','unlocked'].includes(s.phase)?[['B-0에게 부탁','request-'+id]]:[]),['선택 닫기','clear']]);}
    function requestMenu(id){if(!['split','unlocked'].includes(s.phase)){leverActions(id);return;}selection=id;actions(M.names[id]+' 손잡이를 어떻게 움직일까?',[['내려 줘','command-'+id+'-down'],['올려 줘','command-'+id+'-up'],['내린 채 잡고 있어','command-'+id+'-hold'],['놓아 줘','command-'+id+'-release'],['돌아가기','select-'+id]]);}
    function robotMenu(){actions('B-0에게 말하기',[['뭐가 보이니?','ask-see'],['방금 어떻게 움직였어?','ask-last'],...(s.phase==='unlocked'?[['이제 놓아도 돼','reunite']]:[]),...(['split','unlocked'].includes(s.phase)?[['대상 가리키기','target-mode']]:[]),['닫기','clear']]);}
    function inspect(id){
      M.inspect(s,id);save();const descriptions={door:M.solved(s)?'두 잠금쇠가 풀렸다. 문 너머로 통로가 보인다.':'두 개의 잠금쇠가 문을 잡고 있다. 위쪽 잠금쇠 옆에는 삼각형이 새겨져 있다.',own:'아래로 움직이는 손잡이다. 손을 떼면 다시 위로 돌아온다.',glass:M.solved(s)?'유리벽이 위로 올라가 있다. 이제 서로에게 갈 수 있다.':'두꺼운 유리다. B-0는 보이지만 이쪽에서 건너갈 수는 없다.',panel:'모양이 다른 손잡이가 세 개 있다. 유리 너머에 있어서 내 손으로는 닿지 않는다.',vent:s.vent?'환기 장치의 덮개가 닫혀 있다.':'높은 벽에 환기 장치가 달려 있다.',entry:'지나온 문이 닫혀 있다. 안쪽 손잡이도 움직이지 않는다.'};
      say('student',M.symbols.includes(id)?`${M.names[id]}가 새겨져 있다. 아래로 움직일 수 있는 손잡이다. 유리 너머에 있어 손이 닿지 않는다.`:descriptions[id]||'직접 살펴보자.');
    }
    function command(id,verb){
      if(robotBusy||!['split','unlocked'].includes(s.phase))return;
      if(verb==='release'&&s.holding!==id&&s.active!==id){M.command(s,id,verb);save();say('robot','그 손잡이는 지금 잡고 있지 않습니다.');return;}
      clearTimeout(pulse);cancelAnimationFrame(handFrame);
      M.release(s);if(!pointer?.own&&s.phase==='split')M.setOwn(s,0);save();update();robotBusy=true;requestMenu(id);say('robot','그 손잡이로 이동하겠습니다.');
      walk({x:245,z:controlZ[id]+48},()=>{
        const wasSolved=M.solved(s),result=M.command(s,id,verb);save();update();sound('lever');if(!wasSolved&&M.solved(s)){afterUnlock();return;}requestMenu(id);
        if(result==='momentary'){
          say('robot',M.names[id]+' 손잡이를 내리겠습니다.');pulse=later(()=>{if(s.active!==id||s.holding)return;M.release(s,id);save();update();say('robot','내렸다가 놓았습니다.');walk({x:145,z:55});},700);
        }else if(result==='holding')say('robot',M.names[id]+' 손잡이를 내린 채 잡고 있습니다.');else{say('robot',result==='raised'?'위로 올렸습니다.':'손을 놓았습니다.');walk({x:145,z:55});}
      });
    }
    function unlockedActions(){actions('출입문이 열렸다.',[['이제 놓아도 돼','reunite'],['문 살펴보기','select-door']]);}
    function afterUnlock(){save();update();sound('unlock');say('student','열렸어!');unlockedActions();}
    function pull(){
      if(s.phase!=='split')return;cancelAnimationFrame(handFrame);const start=performance.now();
      function step(t){if(dead||s.phase!=='split')return;const v=reduce()?1:Math.min(1,(t-start)/500);if(M.setOwn(s,v)){afterUnlock();return;}update();if(v<1)handFrame=requestAnimationFrame(step);else{say('student','아래쪽 잠금쇠가 움직였어.');later(()=>{if(s.phase==='split'&&!pointer){M.setOwn(s,0);update();}},350);}}
      handFrame=requestAnimationFrame(step);
    }
    function reunite(){
      if(s.phase!=='unlocked'||robotBusy)return;M.release(s);save();update();say('student','이제 놓아도 돼.');actions('B-0가 이쪽으로 다가온다.');
      walk({x:-92,z:-35},()=>{M.join(s);save();update();say('robot','이번에는 확인하고 놓았습니다.');joinedActions();});
    }
    function joinedActions(){actions('다시 만난 B-0',[['같이 통로로 나가기','leave'],['방 더 살펴보기','clear']]);}
    function leave(){if(s.phase==='complete'){onComplete();return;}if(s.phase==='unlocked'){say('student','B-0도 이쪽으로 와야 해.');unlockedActions();return;}if(M.finish(s)){save();onComplete();}}
    function down(e){
      if(e.button!==0||e.isPrimary===false||e.target.closest('[data-mr]')||s.phase==='approach')return;
      const own=!!e.target.closest('[data-mr-drag="own"]');if(own&&s.phase!=='split')return;cancelAnimationFrame(camFrame);if(own)cancelAnimationFrame(handFrame);
      pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,own,moved:false,base:s.own};suppress=false;
    }
    function move(e){
      if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(!pointer.moved&&Math.hypot(dx,dy)<6)return;pointer.moved=true;stage.setPointerCapture(e.pointerId);
      if(pointer.own){if(M.setOwn(s,pointer.base+dy/85))afterUnlock();else update();}
      else{camera.yaw=pointer.yaw-dx*.19/camera.zoom;camera.pitch=pointer.pitch+dy*.16/camera.zoom;updateCamera();}e.preventDefault();
    }
    function up(e){if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;suppress=p.moved;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(p.own&&s.phase==='split'){M.setOwn(s,0);update();if(p.moved)say('student','손을 떼니 손잡이가 돌아왔어.');}save();}
    function cancelPointer(){pointer=null;suppress=true;if(s.phase==='split')M.setOwn(s,0);update();save();}
    function modal(title,body){app.querySelector('.mr-modal')?.remove();const d=document.createElement('dialog');d.className='modal mr-modal';d.innerHTML=`<div class="modal-header"><h2>${esc(title)}</h2>${b('닫기','close-modal','quiet')}</div><div class="modal-body">${body}</div>`;app.append(d);d.addEventListener('close',()=>d.remove());d.showModal();}
    function act(a){
      if(a==='campaign-home'){onHome?.();return;}
      if(a==='close-modal'){app.querySelector('.mr-modal')?.close();return;}
      if(a==='menu'){modal('메뉴',window.B0UI.menuContent({namespace:'mr',close:'close-modal',home:'campaign-home',record:'record',extras:`${b('현재 공간 다시 시작','reset-confirm')}${b('복도로 나가기','back')}`}));return;}
      if(a==='controls'){modal('사용법','<p>빈 공간을 끌거나 방향키로 둘러봅니다. 물건을 누르면 조사하거나 행동할 수 있습니다.</p><p>유리 너머 물건도 눌러 B-0에게 부탁할 수 있습니다. 대상과 행동은 직접 골라 주세요.</p><p>자기 쪽 손잡이는 잡은 채 아래로 끌거나, 선택 후 당기기 버튼을 사용합니다. 처음 위치로는 시점과 배율만 되돌립니다.</p>');return;}
      if(a==='record'){modal('관찰실 탐색 기록',`<p>조사 ${s.logs.filter(x=>x.action==='inspect').length}회 · B-0에게 요청 ${s.logs.filter(x=>x.action==='request').length}회</p><p>어떤 장치가 움직였나요? 처음 부탁한 것에 빠진 조건이 있었나요?</p>`);return;}
      if(a==='reset-confirm'){modal('관찰실을 다시 시작할까요?',`<p>출입 관리실의 진행은 유지됩니다.</p>${b('관찰실만 초기화','reset','primary')}`);return;}
      if(a==='reset'){cancelAnimationFrame(camFrame);cancelAnimationFrame(botFrame);cancelAnimationFrame(handFrame);timers.forEach(clearTimeout);clearTimeout(pulse);robotBusy=false;pointer=null;selection=null;targetMode=false;suppress=false;Object.assign(s,M.fresh());camera={x:-150,z:35,yaw:58,pitch:-8,zoom:1};robot=robotPosition();save();app.querySelector('.mr-modal')?.remove();render();return;}
      if(a==='back'){onBack();return;}
      if(a==='intro-next'){nextIntro();return;}if(a==='dismiss'){speech.hidden=true;return;}
      if(a==='home'){selection=null;targetMode=false;actions(s.phase==='approach'?'계단 쪽으로 이어지는 관찰실':'방 안을 자유롭게 살펴보세요.');cameraTo({x:-150,z:35,yaw:58,pitch:-8,zoom:1});return;}
      if(a.startsWith('zoom-')){camera.zoom=Math.max(.7,Math.min(1.65,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(s.phase==='approach')return;
      if(a==='clear'){selection=null;targetMode=false;speech.hidden=true;actions('방 안을 자유롭게 살펴보세요.');return;}
      if(a==='robot'){robotMenu();return;}if(a.startsWith('ask-')){say('robot',M.reply(s,a.slice(4)));return;}
      if(a==='target-mode'){targetMode=true;actions('물건을 직접 눌러 가리켜 주세요.',[['취소','clear']]);return;}
      if(a.startsWith('select-')){select(a.slice(7));return;}if(a.startsWith('inspect-')){inspect(a.slice(8));return;}
      if(a.startsWith('request-')){requestMenu(a.slice(8));return;}
      if(a.startsWith('command-')){const [,id,verb]=a.split('-');command(id,verb);return;}
      if(a==='try-door'){say('student','문이 움직이지 않아. 잠금쇠가 문을 붙잡고 있어.');return;}
      if(a==='pull'){pull();return;}if(a==='reunite'){reunite();return;}if(a==='leave')leave();
    }
    function click(e){const el=e.target.closest('[data-mr]');if(el){e.preventDefault();act(el.dataset.mr);}}
    function dispose(){dead=true;cancelAnimationFrame(camFrame);cancelAnimationFrame(botFrame);cancelAnimationFrame(handFrame);timers.forEach(clearTimeout);clearTimeout(pulse);audio?.close();app.removeEventListener('click',click);window.removeEventListener('resize',updateCamera);app.querySelector('.mr-modal')?.remove();}
    app.addEventListener('click',click);window.addEventListener('resize',updateCamera);render();return {dispose};
  };
})();
