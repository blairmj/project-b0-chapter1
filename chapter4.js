(function(){
  'use strict';
  window.startChapterFour=function({app,portrait,onBack,onHome,preview=false}){
    const SPACE=1.3;
    const M=window.B0Final,storage=preview?sessionStorage:localStorage,key='project-b0-final-v2';
    let s;try{s=M.restore(JSON.parse(storage.getItem(key)));}catch{s=M.fresh();}
    let dead=false,stage,world,bar,speech,conversation=null,selection=null,modalEl=null,pointer=null,suppress=false,frame=0,camFrame=0,previous=0,mute=false;
    let camera={x:0,z:60,yaw:-15,pitch:14,zoom:.7,height:0},r={handle:0,latch:s.opened?1:0,lifted:false,high:0};
    let robot={x:93,z:-140},journey=null,journeyFrame=0,wakeUntil=0,recoveryPending=false,carryingTransition=false,lastControlled=s.met&&s.links.robot;
    const inRoom=()=>s.phase==='room'||s.phase==='farewell';
    try{mute=JSON.parse(storage.getItem('project-b0-firstperson-v4'))?.muted===true;}catch{}
    let audio,response=null,pulseTimer;const timers=new Set();
    const save=()=>{try{storage.setItem(key,JSON.stringify(s));}catch{}};
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const b=(label,action,cls='')=>`<button type="button" data-c4="${action}" class="${cls}">${label}</button>`;
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!dead)fn();},ms);timers.add(id);};
    function sound(low=false){if(mute)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=low?145:540;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.3);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.3);}catch{}}
    function bossCue(kind){if(mute)return;const patterns={evidence:[[360,0,.16],[250,.22,.35]],sever:[[190,0,.2],[125,.28,.45]],critical:[[150,0,.18],[150,.34,.18],[95,.72,.55]],override:[[110,0,.45],[160,.55,.4]],released:[[320,0,.3],[480,.24,.65]]};
      try{audio||=new(window.AudioContext||window.webkitAudioContext)();void audio.resume();for(const [hz,delay,length]of patterns[kind]||patterns.sever){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+delay;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025,t+.025);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+length+.02);o.onended=()=>{o.disconnect();g.disconnect();};}}catch{}}
    function pressure(){if(s.opened)return 'released';if(!s.boss)return 'calm';if(s.links.robot)return 'locked';if(s.upper)return r.handle>=.85&&s.holding?'override':'critical';return 'severed';}
    const pressureLines={calm:'',locked:'방문자의 퇴실을 우선합니다.',severed:'기체 제어 연결이 끊겼습니다. 복구하십시오.',critical:'수동 개방을 중단하십시오. 해당 기체는 회수 대상입니다.',override:'B-0. 손을 놓고 회수 명령에 응답하십시오.',released:'B-0. 제어 연결을 복구하십시오.'};
    const pressureStatus={calm:'시설 폐쇄 절차 · 방문자 퇴실',locked:'B-0 회수 모드 · 동작 제한',severed:'기체 연결 해제 · 출구 잠김',critical:'상부 잠금 해제 · 하부 잠김',override:'수동 개방 처리 중',released:'수동 개방 고정 · 회수 미완료'};
    function updateTension(){if(!inRoom())return;const level=pressure(),line=response?.phase===level?response.text:pressureLines[level];stage.dataset.axiom=level;app.querySelector('.c4-game').dataset.axiom=level;app.querySelector('.c4-main-screen').dataset.robotControl=String(s.links.robot);app.querySelector('.c4-main-screen').dataset.exitControl=String(!s.upper);
      app.querySelector('.c4-main-status').textContent=level==='override'&&stage.dataset.reported?'개방 처리 완료':pressureStatus[level];
      const banner=app.querySelector('.c4-response');banner.hidden=!line;banner.innerHTML=`<b>AXIOM</b><span>${esc(line)}</span>`;
      if(modalEl){modalEl.dataset.axiom=level;const relay=modalEl.querySelector('.c4-modal-response');if(relay){relay.hidden=!line;relay.innerHTML=`<b>AXIOM</b><span>${esc(line)}</span>`;}}}
    function react(text,kind='sever'){response={phase:pressure(),text};updateTension();bossCue(kind);stage.classList.remove('c4-surge');void stage.offsetWidth;stage.classList.add('c4-surge');if(modalEl){modalEl.classList.remove('c4-surge');void modalEl.offsetWidth;modalEl.classList.add('c4-surge');}clearTimeout(pulseTimer);pulseTimer=setTimeout(()=>{if(!dead){stage?.classList.remove('c4-surge');modalEl?.classList.remove('c4-surge');}},1600);}
    const intro=[['student','이번에는 바로 놓지 않았네.'],['robot','놓아도 된다고 하실 때까지 기다렸습니다.'],['student','그래. 잘했어.'],['robot','그 말씀은 기록해 두겠습니다.'],['student','그런 것까지 기록해? ……여기가 중앙관리실이네. 들어가 보자.']];
    const offer=[['axiom','방문자는 퇴실하십시오. 교육 기체 B-0는 회수 대상입니다.'],['student','누군데?'],['axiom','중앙관리 AI, AXIOM입니다. 시설 폐쇄 절차를 진행하고 있습니다.'],['student','얘도 같이 나갈 거야.'],['axiom','해당 기체는 초기화 후 보관됩니다.'],['student','내가 가르친 거야. 얘가 나 도와준 거라고.'],['axiom','역할을 마쳤습니다. 퇴실하십시오.']];
    const threat=[['student','너 없었으면 여기까지 못 왔어. 같이 가.'],['axiom','회수 대상의 외부 반출을 제한합니다.'],['robot','회수 모드…… 몸이 움직이지 않습니다.'],['student','잠깐만. 어디가 어떻게 된 건지부터 보자.']];
    const farewell=[['student','이번에는 따라오고 있지?'],['robot','네.'],['axiom','기체 회수 절차가 완료되지 않았습니다.'],['student','너, 처음에는 진짜 아무것도 몰랐는데.'],['robot','그래서 많이 배웠습니다.'],['student','……나도.']];
    const ending=[['student','……내 방이네. 틀린 답도 그대로잖아.'],['student','B-0?'],['robot','이번에는 먼저 가지 않았습니다.'],['student','여기부터 같이 봐 줄래?'],['robot','어느 부분을 확인할까요?'],['student','잠깐. 내가 풀던 데부터 다시 볼게.']];
    function actions(title,items=[]){if(bar)bar.innerHTML=`<strong>${esc(title)}</strong><div>${items.map(([l,a,c])=>b(l,a,c||'')).join('')}</div>`;}
    function say(who,text){if(!speech)return;speech.hidden=false;speech.innerHTML=`<div class="speech ${who}"><b>${who==='robot'?'B-0':who==='axiom'?'AXIOM':'나'}</b><p>${esc(text)}</p></div>${b(conversation?'다음':'대화 닫기',conversation?'talk-next':'dismiss','quiet')}`;
      const actor=app.querySelector('.c4-robot .robot-sprite');actor?.classList.toggle('speaking',who==='robot');if(who==='robot')later(()=>actor?.classList.remove('speaking'),Math.min(3800,text.length*90));}
    function talk(lines,done){conversation={lines,i:0,done};say(...lines[0]);}
    function next(){if(!conversation)return;const c=conversation;if(++c.i<c.lines.length)say(...c.lines[c.i]);else{conversation=null;speech.hidden=true;c.done?.();}}
    function render(){closeModal(false);conversation=null;pointer=null;cancelAnimationFrame(frame);cancelAnimationFrame(camFrame);cancelAnimationFrame(journeyFrame);journey=null;previous=0;
      if(s.phase==='intro'){renderScene(intro,'중앙관리실 앞','intro');return;}
      if(s.phase==='farewell'){camera={x:-125,z:40,yaw:-180,pitch:-8,zoom:1};robot={x:-85,z:235};}
      if(s.phase==='ending'){renderScene(ending,'내 방','ending');return;}
      if(s.phase==='complete'){renderComplete();return;}
      app.innerHTML=`<main class="game c2-game c4-game" data-farewell="${s.phase==='farewell'}"><header><h1>내 위치: 중앙관리실</h1><nav>${b('← 원위치로','home','quiet')}${window.B0LessonJumpButton?.()||''}${b('메뉴','menu','quiet')}</nav></header>
      <section class="c2-stage c4-stage" tabindex="0" aria-label="중앙관리실. 빈 공간을 끌어 둘러보고 물건을 눌러 조사하세요."><div class="c2-world c4-world">
      ${['front','left','right','back'].map(f=>`<div class="c2-wall c2-wall-${f}"><div class="c4-wall-ribs"></div><div class="c2-light"></div></div>`).join('')}<div class="c2-floor"></div><div class="c2-ceiling"></div>
      <div class="c4-main-screen" data-c4-object="screen" role="button" tabindex="0" aria-label="AXIOM 관리 화면"><img class="c4-core-art" src="./assets/sf-axiom-core-v1.webp" alt=""><small>FACILITY CLOSURE SYSTEM</small><div class="c4-emblem"><i></i><i></i><i></i></div><strong>AXIOM</strong><p class="c4-main-status"></p><span class="c4-math">잔여 이용자 퇴실 / 교육 기체 회수</span><div class="c4-screen-grid"></div></div>
      <div class="c4-desk-shell" aria-hidden="true"><i></i><i></i><i></i></div>
      <button class="c4-console" data-c4-object="console" aria-label="기체 제어 연결 조작대"><small>CONTROL</small><span>기체 제어 연결</span><i></i><i></i><i></i></button>
      <button class="c4-records" data-c4-object="records" aria-label="기록 단말기"><small>ARCHIVE</small><span>시설 운영 기록</span><i></i><i></i><i></i></button>
      <div class="c4-door" data-c4-object="door" role="button" tabindex="0" aria-label="외부 출구"><div class="c4-outside"><div class="c4-passage-robot" aria-hidden="true"><div class="c4-walk-frame"></div></div></div><div class="c4-door-leaf"><span>외부 출구</span><i data-c4-drag="grip" role="slider" tabindex="0" aria-label="문 손잡이" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></i></div><div class="c4-bolt c4-bolt-lower" aria-label="실제 하부 잠금쇠"></div><div class="c4-bolt-upper" aria-label="실제 상부 잠금쇠"></div><small class="c4-door-status"></small></div>
      <div class="c4-exit-box uncovered" data-c4-object="handle" role="button" tabindex="0" aria-label="문 옆 개방 손잡이"><strong>개방 손잡이</strong><div class="c4-track"></div><div class="c4-handle"><i></i></div></div>
      <div class="c4-high" data-c4-object="high" role="button" tabindex="0" aria-label="문 위 수동 잠금장치"><small>수동 잠금장치</small><div class="c4-high-track"></div><div class="c4-high-knob" data-c4-drag="high" role="slider" tabindex="0" aria-label="상부 잠금쇠" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div></div>
      <div class="c2-robot c4-robot" data-c4-object="robot" role="button" tabindex="0" aria-label="B-0"><div class="robot-sprite live-body">${portrait()}<svg class="c4-smile" viewBox="0 0 1024 1536" aria-hidden="true"><path d="M475 536 Q502 565 540 548"/></svg></div><span class="c4-recovery-light" aria-hidden="true"></span><img class="c4-hold-art" src="./assets/b0-bracing-v1.webp" alt=""><div class="c4-walk-art" aria-hidden="true"><div class="c4-walk-frame"></div></div></div><div class="c4-ceiling-ring" aria-hidden="true"></div>
      </div><div class="c4-exit-fade" aria-hidden="true"></div><div class="c4-response" aria-live="polite" hidden></div><p class="c2-basic-help">빈 공간을 끌어 둘러보기 · 물건을 눌러 살펴보기</p><div class="c2-speech c4-speech" aria-live="polite" hidden></div></section>
      <section class="c2-actions c4-actions" aria-label="선택한 대상의 조작"><p>방 안을 살펴보세요.</p></section><footer><div class="zoom-controls">${b('−','zoom-out')}<output class="c4-zoom">100%</output>${b('+','zoom-in')}</div>${b('B-0에게 물어보기','robot','secondary')}</footer></main>`;
      stage=app.querySelector('.c4-stage');world=app.querySelector('.c4-world');bar=app.querySelector('.c4-actions');speech=app.querySelector('.c4-speech');
      stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',cancel);
      stage.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=Math.max(.65,Math.min(1.6,camera.zoom-e.deltaY*.001));updateCamera();},{passive:false});
      update();if(s.phase==='farewell')farewellLine();frame=requestAnimationFrame(loop);
    }
    function updateCamera(){if(!inRoom()||!world?.isConnected)return;camera.pitch=Math.max(-60,Math.min(40,camera.pitch));camera.yaw=((camera.yaw+540)%360)-180;
      const f=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;stage.style.perspective=f+'px';world.style.transform=`translateZ(${f}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(${-camera.x*SPACE}px,${camera.height||0}px,${-camera.z*SPACE}px)`;
      app.querySelector('.c4-robot').style.transform=`translate3d(${robot.x-48}px,24px,${robot.z}px) rotateY(${-camera.yaw}deg)`;window.B0RoomSpace?.sync(world);app.querySelector('.c4-zoom').textContent=Math.round(camera.zoom*100)+'%';stage.dataset.yaw=Math.round(camera.yaw);}
    function update(){if(!inRoom())return;const stopped=s.met&&s.links.robot;
      stage.classList.toggle('c4-confrontation',s.boss&&!s.opened);app.querySelector('.c4-robot').classList.toggle('controlled',stopped);
      app.querySelector('.c4-door').classList.toggle('open',s.opened||s.met&&!s.boss);app.querySelector('.c4-exit-box').classList.toggle('available',M.ready(s));
      app.querySelector('.c4-door-status').textContent=s.opened?'통로 열림 · 개방 고정':s.met&&!s.boss?'방문자 통과 허용':s.boss?'반출 제한 · 기체 회수':'방문자 출구';
      updateMechanical();updateTension();updateRobot();updateCamera();}
    function updateRobot(){if(!inRoom())return;const actor=app.querySelector('.c4-robot'),controlled=s.met&&s.links.robot,now=performance.now();
      if(controlled){wakeUntil=0;recoveryPending=false;}else if(lastControlled){recoveryPending=!!modalEl;wakeUntil=now+(modalEl?500:1700);}lastControlled=controlled;
      const pose=journey?'walking':s.holding?'holding':r.lifted?'lifting':controlled?'controlled':now<wakeUntil?'recovering':s.opened?'ready':s.boss?'alert':'idle';actor.dataset.pose=pose;actor.dataset.mood=controlled?'blank':s.opened?'friendly':s.boss?'concerned':'attentive';actor.classList.toggle('controlled',controlled);}
    function farewellLine(){s.line=Math.min(s.line,farewell.length-1);say(...farewell[s.line]);const next=speech.querySelector('button');next.dataset.c4='story-next';next.textContent=s.line===farewell.length-1?'함께 바깥으로':'다음';actions('출구 앞에서 B-0와 이야기를 나눈다.');}
    function startJourney(kind){if(journey||!s.opened||s.links.robot)return;if(s.holding){say('robot','아직 잡고 있습니다. 놓아도 될까요?');robotMenu();return;}cancelAnimationFrame(camFrame);cancelAnimationFrame(journeyFrame);closeModal(false);conversation=null;pointer=null;speech.hidden=true;
      const from={...robot},view={...camera},start=performance.now(),duration=kind==='approach'?2200:3000,turn=((-180-view.yaw+540)%360)-180;
      journey={kind};stage.dataset.journey=kind;stage.setAttribute('aria-busy','true');app.querySelector('.c4-game').dataset.journey=kind;app.querySelector('.c4-response').hidden=true;actions(kind==='approach'?'B-0와 함께 출구로 향한다.':'B-0를 따라 문 너머로 걸어간다.');updateRobot();
      function finish(){journey=null;if(kind==='approach'){if(!M.leave(s))return;}else{s.phase='ending';s.line=0;}save();render();}
      if(reduced()){finish();return;}
      function step(t){if(dead||!journey||journey.kind!==kind)return;const p=Math.min(1,(t-start)/duration),smooth=v=>v*v*(3-2*v),clamp=v=>Math.max(0,Math.min(1,v));
        if(kind==='approach'){const walk=clamp((p-.12)/.88),look=smooth(clamp(p/.5));robot={x:from.x+(-85-from.x)*walk,z:from.z+(235-from.z)*walk};camera={x:view.x+(-125-view.x)*look,z:view.z+(40-view.z)*look,yaw:view.yaw+turn*look,pitch:view.pitch+(-8-view.pitch)*look,zoom:view.zoom+(1-view.zoom)*look};}
        else{const walk=clamp(p/.72),follow=smooth(clamp((p-.62)/.38));robot={x:-85,z:235+55*walk};camera={x:view.x+(-85-view.x)*smooth(p),z:view.z+40*Math.min(p/.62,1)+140*follow,yaw:view.yaw+turn*smooth(p),pitch:view.pitch+(0-view.pitch)*smooth(p),zoom:1};
          const crossing=clamp((robot.z-270)/18),depth=clamp((p-.50)/.50),portal=app.querySelector('.c4-passage-robot');app.querySelector('.c4-robot').style.opacity=1-crossing;portal.style.opacity=crossing;portal.style.transform=`translateY(${-depth*24}%) scale(${1-depth*.4})`;app.querySelector('.c4-exit-fade').style.opacity=smooth(clamp((p-.78)/.22));}
        updateCamera();if(p<1)journeyFrame=requestAnimationFrame(step);else finish();}
      journeyFrame=requestAnimationFrame(step);
    }
    function updateMechanical(){if(!inRoom())return;const visitor=s.met&&!s.boss;
      app.querySelector('.c4-handle').style.translate=`0 ${s.holding?95:(r.side||0)*95}px`;
      const grip=app.querySelector('[data-c4-drag="grip"]');grip.style.rotate=`${r.handle*65}deg`;grip.setAttribute('aria-valuenow',String(Math.round(r.handle*100)));
      app.querySelector('.c4-bolt').style.translate=`${(visitor?1:r.latch)*78}px 0`;
      app.querySelector('.c4-bolt-upper').style.translate=`${s.upper||visitor?78:0}px 0`;
      const high=app.querySelector('.c4-high-knob');high.style.translate=`${(s.upper?1:r.high)*70}px 0`;high.setAttribute('aria-valuenow',s.upper?'100':String(Math.round(r.high*100)));
    }
    function loop(t){if(dead||!inRoom())return;const was=s.opened;M.tick(s,r,previous?t-previous:0);previous=t;updateMechanical();updateRobot();
      if(!was&&s.opened){save();update();react('B-0. 제어 연결을 복구하십시오.','released');say('robot','아직 기다리라는 부탁을 받고 있습니다.');select('door');}
      if(stage.dataset.axiom!==pressure())updateTension();
      if(r.latch>=.35&&!s.opened&&!stage.dataset.reported){stage.dataset.reported='yes';react('개방 처리가 완료되었습니다. 기체는 손잡이를 놓으십시오.','critical');say('robot','놓을까요?');}
      if(r.latch===0)delete stage.dataset.reported;frame=requestAnimationFrame(loop);
    }
    function cameraTo(to,done){cancelAnimationFrame(camFrame);const from={height:0,...camera},start=performance.now(),turn=(((to.yaw??from.yaw)-from.yaw+540)%360)-180;
      function step(t){if(dead||s.phase!=='room')return;const v=reduced()?1:Math.min(1,(t-start)/850),q=v*v*(3-2*v);for(const k of ['x','z','pitch','zoom','height'])camera[k]=from[k]+((to[k]??from[k])-from[k])*q;camera.yaw=from.yaw+turn*q;updateCamera();if(v<1)camFrame=requestAnimationFrame(step);else done?.();}camFrame=requestAnimationFrame(step);
    }
    function approach(id){const targets={screen:{x:0,z:60,yaw:0,pitch:35,zoom:.75},console:{x:-100,z:25,yaw:-90,pitch:-12,zoom:1.15},records:{x:85,z:-30,yaw:90,pitch:0,zoom:1.1},door:{x:-80,z:100,yaw:180,pitch:-5,zoom:1},handle:{x:-145,z:80,yaw:180,pitch:-6,zoom:1},high:{x:-80,z:125,yaw:180,pitch:28,zoom:1},robot:{x:0,z:30,yaw:20,pitch:-12,zoom:1}};if(targets[id]&&!r.lifted)cameraTo({...targets[id],height:0});}
    function select(id){if(conversation||carryingTransition)return;
      if(selection==='ask'){selection=null;ask(id);return;}
      if(selection==='lift-target'){selection=null;if(id!=='high'){say('robot','그곳에는 들어 올려 드릴 자리가 없습니다.');robotMenu();return;}lift();return;}
      if(selection==='hold-target'){selection=null;if(id!=='handle'){say('robot','그 물건은 당긴 채 잡을 수 없습니다.');robotMenu();return;}hold(true);return;}
      selection=id;s.seen[id]=true;save();speech.hidden=true;approach(id);
      if(id==='screen')actions('AXIOM 관리 화면',[['화면 살펴보기','inspect-screen'],['선택 닫기','clear']]);
      if(id==='records')actions('시설 운영 기록',[['기록 읽기','history'],['선택 닫기','clear']]);
      if(id==='console')actions('기체 제어 연결 조작대',[['덮개 열기','connections'],['표기 확인 부탁','ask-console'],['선택 닫기','clear']]);
      if(id==='door')actions('외부 출구',[['실제 잠금쇠 살펴보기','inspect-door'],[s.opened?'B-0와 출구로 가기':s.met&&!s.boss?'B-0에게 돌아가기':'문 손잡이 돌리기',s.opened?'leave':s.met&&!s.boss?'return-b0':'try-door'],['B-0에게 문 확인 부탁','ask-door'],...(r.handle?[['문 손잡이 놓기','release']]:[]),['선택 닫기','clear']]);
      if(id==='high')actions('문 위 수동 잠금장치',[['살펴보기','inspect-high'],...(r.lifted?[['잠금쇠 오른쪽으로 밀기','high-pull'],['내려 달라고 하기','lower']]:[]),['선택 닫기','clear']]);
      if(id==='handle')handleActions();if(id==='robot')robotMenu();
    }
    function handleActions(){actions('문 옆 개방 손잡이',[['살펴보기','inspect-handle'],['직접 당겨 보기','own-side'],['B-0에게 부탁하기','robot'],['선택 닫기','clear']]);}
    function robotMenu(){actions('B-0에게 부탁하기',[
      ['몸의 상태를 확인해 줘','ask-body'],['내가 고른 곳 확인해 줘','choose-target'],['나를 들어 올려 줘','request-lift'],['당긴 채 잡고 있어','request-hold'],
      ...(r.lifted?[['내려 줘','lower']]:[]),...(s.holding?[['계속 잡고 있어','keep-hold'],['이제 놓아도 돼','release-b0']]:[]),...(s.met&&!s.boss?[['같이 가자','return-b0']]:[]),['대화 닫기','clear']]);}
    function meet(){if(s.met)return;s.met=true;save();update();talk(offer,()=>select('door'));}
    function challenge(){if(!s.met){meet();return;}if(s.boss)return;s.boss=true;s.bodyChecked=false;save();sound(true);update();talk(threat,()=>select('robot'));}
    function lift(){if(!s.boss||s.links.robot){say('robot',s.links.robot&&s.boss?'회수 모드로 움직일 수 없습니다.':'먼저 출구를 확인해 보겠습니다.');return;}if(s.holding){say('robot','손잡이를 잡고 있습니다. 먼저 놓아도 될까요?');return;}
      carryingTransition=true;r.lifted=true;robot={x:-85,z:165};actions('B-0가 들어 올리는 중…');updateRobot();say('robot','이번에도 떨어지지 않게 받치겠습니다.');
      cameraTo({x:-85,z:180,yaw:180,pitch:12,zoom:1,height:145},()=>{carryingTransition=false;select('high');actions('문 위 수동 잠금장치',[['살펴보기','inspect-high'],['잠금쇠 오른쪽으로 밀기','high-pull'],['내려 줘','lower']]);});
    }
    function lower(){if(!r.lifted||carryingTransition)return;carryingTransition=true;r.lifted=false;r.high=0;actions('바닥으로 내려오는 중…');cameraTo({x:-85,z:110,yaw:180,pitch:5,zoom:1,height:0},()=>{carryingTransition=false;select('door');});updateRobot();say('robot','내려 드리겠습니다.');}
    function highPull(){if(M.latch(s,r)){save();update();react('수동 개방을 중단하십시오. 해당 기체는 회수 대상입니다.','critical');say('student','알아들었어. 그런데 두고 가지는 않을 거야.');}else say('student','너무 높아. 여기서는 손이 닿지 않아.');}
    function hold(on){if(r.lifted){say('robot','지금은 들어 올려 드리고 있습니다.');return;}if(!M.hold(s,on)){say('robot',s.boss?'회수 모드로 움직일 수 없습니다.':'어느 손잡이인지 확인해 주세요.');return;}
      if(on){robot={x:-235,z:235};say('robot','놓아도 된다고 하실 때까지 잡겠습니다.');}else{M.release(s,r);robot={x:-155,z:205};say('student',s.opened?'됐어. 이제 놓아도 돼. 이리 와.':'잠깐 놓아 줘. 다시 살펴볼게.');}
      save();update();robotMenu();
    }

    function modal(title,body){closeModal(false);const el=document.createElement('dialog');el.className='c4-modal';el.innerHTML=`<header><h2>${esc(title)}</h2>${b('닫기','close-modal','quiet')}</header><div class="c4-modal-content"><div class="c4-modal-response" aria-live="polite" hidden></div>${body}</div>`;app.append(el);modalEl=el;el.addEventListener('cancel',e=>{e.preventDefault();closeModal();});el.showModal();if(s.phase==='room')updateTension();}
    function closeModal(reveal=true){const wasOpen=!!modalEl;if(modalEl){modalEl.close();modalEl.remove();modalEl=null;}if(wasOpen&&reveal&&recoveryPending&&!dead&&inRoom()&&!s.links.robot){recoveryPending=false;wakeUntil=performance.now()+1850;const actor=app.querySelector('.c4-robot');actor.dataset.pose='idle';void actor.offsetWidth;updateRobot();approach('robot');}}
    function history(){modal('시설 운영 기록',`<div class="c4-history"><p>시설 폐쇄 절차 진행 중</p><p>잔여 이용자: 퇴실</p><p>잔여 교육 기체: 회수 후 초기화</p>${s.boss?'<p>B-0 · 미등록 행동 학습 / 승인되지 않은 이동 / 회수 필요</p>':''}</div>`);}
    const names={robot:'B-0 원격 동작 제어'};
    function connections(){modal('기체 제어 연결',`<section class="c4-link-row" data-link-row="robot"><button data-c4="scope-robot" class="c4-link-name">B-0 원격 동작 제어</button><div class="c4-wire"><span></span><button class="c4-plug" data-c4-drag="plug-robot" data-c4="scope-robot" aria-label="B-0 원격 동작 제어 연결 단자"><i></i></button><small>AXIOM</small></div>${b('분리','disconnect-robot','quiet c4-link-toggle')}</section><p class="c4-scope" aria-live="polite">기체의 상태와 연결 표기를 확인할 수 있습니다.</p>`);updateLinks();}
    function updateLinks(){if(!modalEl)return;const row=modalEl.querySelector('[data-link-row="robot"]');if(!row)return;row.classList.toggle('disconnected',!s.links.robot);row.querySelector('.c4-link-toggle').textContent=s.links.robot?'분리':'다시 연결';row.querySelector('.c4-link-toggle').dataset.c4=(s.links.robot?'disconnect-':'connect-')+'robot';}
    function link(id,on){if(on&&(r.lifted||s.holding)){modalEl.querySelector('.c4-scope').textContent='B-0가 다른 동작을 유지하고 있습니다. 먼저 동작을 마쳐 주세요.';return;}if(!M.connect(s,id,on)){modalEl.querySelector('.c4-scope').textContent=s.opened?'개방 고정 상태입니다.':s.boss?'회수 기체의 상태 확인이 필요합니다.':'회수 절차가 실행되지 않았습니다.';sound(true);return;}
      M.release(s,r);save();updateLinks();update();modalEl.querySelector('.c4-scope').textContent=on?'원격 동작 제어 연결됨':'원격 동작 제어 분리됨';
      react(on?'기체 제어 연결 복구. 회수 모드를 재개합니다.':'기체 제어 연결이 끊겼습니다. 복구하십시오.','sever');
      if(!on)say('robot','다시 움직일 수 있습니다. 이번에는 제 상태부터 확인했습니다.');
    }
    function scope(){modalEl.querySelector('.c4-scope').textContent='이 연결은 B-0의 손과 발을 원격으로 제어합니다. 기체 내부의 학습 기록과는 별개입니다.';}
    function ask(id){if(id==='body'){s.bodyChecked=true;save();say('robot',s.met&&s.links.robot?'회수 모드가 작동하고 있습니다. 손과 발의 움직임이 제한되었습니다.':'손과 발의 움직임은 정상입니다.');return;}
      const observations={door:s.opened?'잠금쇠가 모두 빠졌고 문이 열린 채 고정되었습니다.':r.latch>=.35?'화면은 완료라고 나옵니다. 하지만 잠금쇠 끝부분이 아직 문에 걸려 있습니다.':r.latch>0?'아래 잠금쇠가 움직이고 있습니다. 문은 아직 닫혀 있습니다.':s.upper?'위 잠금쇠는 빠졌지만 아래 잠금쇠는 걸려 있습니다.':'문 위와 옆에 잠금쇠가 하나씩 있습니다.',screen:s.boss?'기체 회수와 반출 제한이라고 적혀 있습니다.':'방문자 퇴실과 기체 회수라고 적혀 있습니다.',console:'B-0 원격 동작 제어라고 적혀 있습니다.',handle:'개방 손잡이라고 적혀 있습니다. 당기면 문 옆 잠금쇠와 연결된 줄이 움직입니다.',high:'수동 잠금장치입니다. 위 잠금쇠와 이어져 있습니다.',records:'시설 폐쇄 절차에 관한 기록입니다.'};say('robot',observations[id]||'어느 물건을 확인할지 직접 눌러 주세요.');}
    function pull(){if(!s.met){meet();return;}if(!s.boss){challenge();return;}if(r.lifted){say('student','먼저 내려가야 문손잡이에 닿겠어.');return;}
      r.handle=1;updateMechanical();select('door');say('student',!s.upper?'위 잠금쇠에 걸려 있어.':!s.holding?'문 옆 손잡이가 제자리로 돌아가네.':'손잡이를 돌렸어. 문이 움직이는지 보자.');
    }

    function renderScene(lines,place,type){s.line=Math.min(s.line,lines.length-1);const [who,text]=lines[s.line];const bed=type==='ending';app.innerHTML=`<main class="game c4-story c4-story-${type}"><header><h1>내 위치: ${place}</h1>${window.B0LessonJumpButton?.()||''}${b('메뉴','menu','quiet')}</header><section class="c4-story-scene">${bed?`<div class="c4-bedroom"><div class="c4-moon"></div><div class="c4-notebook"><small>나의 풀이</small><p>24 ÷ 3 × 2 = 4 <em>×</em></p><div class="c4-pencil-line ${s.line>=5?'corrected':''}">= 8 × 2 = 16</div></div><div class="c4-home-screen ${s.line>=2?'awake':''}"><i></i><i></i></div><div class="c4-pencil"></div></div>`:`<div class="c4-story-door"></div><div class="c4-story-robot"><div class="robot-sprite live-body ${who==='robot'?'speaking':''}">${portrait()}</div></div>`}<div class="c4-story-dialogue"><div class="speech ${who}"><b>${who==='robot'?'B-0':who==='axiom'?'AXIOM':'나'}</b><p>${esc(text)}</p></div>${b(s.line===lines.length-1?(type==='intro'?'문 열고 들어가기':type==='farewell'?'함께 바깥으로':'마치기'):'다음','story-next','next')}</div></section></main>`;}
    function renderComplete(){app.innerHTML=`<main class="game c4-complete"><header><h1>PROJECT B-0</h1>${window.B0LessonJumpButton?.()||''}${b('메뉴','menu','quiet')}</header><section><div class="c4-final-eyes"><i></i><i></i></div><h2>함께, 다음 문제로.</h2><p>모르는 건 물어보고.<br>들은 답은 확인하고.<br>선택은 내가.</p>${b('시작 화면으로','campaign-home','primary')}${b('이번 모험 돌아보기','reflection')}${b('중앙관리실 다시 둘러보기','revisit','quiet')}</section></main>`;}
    function act(a){
      if(a==='campaign-home'){onHome?.();return;}
      if(carryingTransition&&!['menu','close-modal','reset-confirm','reset','back','mute'].includes(a))return;
      if(journey&&!['menu','close-modal','back','reset-confirm','reset','mute'].includes(a))return;
      if(a==='close-modal'){closeModal();return;}
      if(a==='menu'){modal('메뉴',`<div class="options">${b('계속하기','close-modal','primary')}${b('시작 화면으로','campaign-home','secondary')}${b('조작 방법','controls')}${b(mute?'소리 켜기':'소리 끄기','mute')}${b('4차시 다시 시작','reset-confirm','quiet')}${b('3차시로 돌아가기','back','quiet')}</div>`);return;}
      if(a==='mute'){mute=!mute;try{const v=JSON.parse(storage.getItem('project-b0-firstperson-v4'))||{};v.muted=mute;storage.setItem('project-b0-firstperson-v4',JSON.stringify(v));}catch{}closeModal();return;}
      if(a==='controls'){modal('조작 방법','<p>빈 공간을 끌거나 방향키로 둘러보고, 물건을 눌러 가까이 살펴봅니다.</p><p>연결 단자는 옆으로 끌어 분리합니다. 닿을 수 있는 잠금쇠와 문 손잡이를 직접 끌어 조작할 수 있습니다. 각 물건의 조작 버튼도 사용할 수 있습니다.</p><p>B-0에게 부탁한 뒤 대상 물건을 직접 누릅니다. 원위치로는 시점과 배율만 초기화합니다. 진행은 자동 저장됩니다.</p>');return;}
      if(a==='reset-confirm'){modal('4차시를 다시 시작할까요?',`<p>다른 차시의 기록은 유지됩니다.</p>${b('4차시 초기화','reset')}`);return;}
      if(a==='reset'){s=M.fresh();r={handle:0,latch:0,lifted:false,high:0};robot={x:93,z:-140};wakeUntil=0;recoveryPending=false;carryingTransition=false;lastControlled=false;camera={x:0,z:60,yaw:-15,pitch:14,zoom:.7};save();render();return;}
      if(a==='back'){dispose();onBack();return;}
      if(a==='story-next'){if(s.phase==='farewell'){if(s.line<farewell.length-1){s.line++;save();farewellLine();}else startJourney('exit');return;}const lines=s.phase==='intro'?intro:ending;if(s.line<lines.length-1)s.line++;else{s.phase=s.phase==='intro'?'room':'complete';s.line=0;}save();render();return;}
      if(a==='revisit'){s.phase='room';s.line=0;robot={x:93,z:-140};camera={x:0,z:60,yaw:-15,pitch:14,zoom:.7};save();render();return;}
      if(a==='reflection'){modal('이번 모험 돌아보기',`<p>B-0에게 전에 가르친 행동이 이번에는 어디에 쓰였나요?</p><p>혼자 할 수 없었던 일을 어떻게 나누어 했나요?</p><p>완료라는 표시와 실제 문 상태는 같았나요?</p><small>정해진 답을 고르는 시험이 아닙니다. 함께 이야기해 보세요.</small>`);return;}
      if(s.phase!=='room')return;
      if(a==='talk-next'){next();return;}if(a==='dismiss'){conversation=null;speech.hidden=true;return;}
      if(a==='home'){if(r.lifted){lower();return;}cancelAnimationFrame(camFrame);camera={x:0,z:60,yaw:-15,pitch:14,zoom:.7,height:0};updateCamera();return;}
      if(a==='zoom-in'||a==='zoom-out'){camera.zoom=Math.max(.65,Math.min(1.6,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(a==='clear'){selection=null;actions('방 안을 살펴보세요.');speech.hidden=true;return;}
      if(a==='robot'){selection=null;speech.hidden=true;robotMenu();return;}if(a==='choose-target'){selection='ask';actions('확인할 물건을 직접 눌러 주세요.',[['취소','clear']]);return;}
      if(a.startsWith('ask-')){ask(a.slice(4));return;}
      if(a==='inspect-screen'){modal('AXIOM 관리 화면',s.boss?'<p>미등록 행동 학습 / 승인되지 않은 이동 / 회수 필요</p><p>B-0: 회수 대상. 외부 반출 제한.</p>':'<p>시설 폐쇄 절차 진행 중</p><p>잔여 이용자 퇴실 / 잔여 교육 기체 회수</p>');return;}
      if(a==='history'){history();return;}
      if(a==='inspect-door'){say('student',s.opened?'잠금쇠가 모두 빠졌고, 문이 열린 채 걸렸어.':s.upper?'위 잠금쇠는 빠졌어. 아래쪽은 아직 걸려 있네.':'위쪽과 아래쪽에 잠금쇠가 있어. 문 옆 손잡이에는 줄이 이어져 있고.');return;}
      if(a==='return-b0'){challenge();return;}
      if(a==='try-door'||a==='pull'){pull();return;}
      if(a==='inspect-high'){say('student',s.upper?'잠금쇠를 빼 놓은 상태야.':r.lifted?'옆으로 미는 손잡이야. 이제 손이 닿아.':'수동 잠금장치네. 너무 높아서 손이 안 닿아.');return;}
      if(a==='high-pull'){highPull();return;}
      if(a==='lower'){lower();return;}
      if(a==='inspect-handle'){say('student','손잡이를 당기면 문 옆 잠금쇠와 이어진 줄이 팽팽해져. 놓으면 돌아오는 구조야.');return;}
      if(a==='own-side'){r.side=1;updateMechanical();later(()=>{r.side=0;updateMechanical();},700);say('student','당길 수는 있는데…… 문 손잡이에 손이 닿지 않아. 놓으니까 다시 돌아갔어.');return;}
      if(a==='request-lift'||a==='request-hold'){if(s.met&&s.links.robot){say('robot','회수 모드로 움직일 수 없습니다.');return;}selection=a==='request-lift'?'lift-target':'hold-target';actions('부탁할 대상 물건을 직접 눌러 주세요.',[['취소','clear']]);speech.hidden=true;return;}
      if(a==='release-b0'){hold(false);return;}if(a==='keep-hold'){say('robot','놓아도 된다고 하실 때까지 기다리겠습니다.');return;}
      if(a==='release'){const partial=r.latch>0&&!s.opened;M.release(s,r);updateMechanical();if(partial)say('student','잠금쇠가 돌아갔어. 실제 문은 아직 안 열렸었네.');return;}
      if(a==='connections'){connections();return;}
      if(a.startsWith('scope-')){scope();return;}
      if(a.startsWith('disconnect-')){link(a.slice(11),false);return;}if(a.startsWith('connect-')){link(a.slice(8),true);return;}
      if(a==='leave'){startJourney('approach');return;}
    }
    function down(e){if(e.button!==0||conversation||journey||carryingTransition||s.phase!=='room')return;const drag=e.target.closest('[data-c4-drag]')?.dataset.c4Drag;if(!drag&&e.target.closest('button,input,dialog,.c4-speech'))return;
      cancelAnimationFrame(camFrame);pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,drag,moved:false,el:e.target.closest('[data-c4-drag]')||stage};if(drag){pointer.el.setPointerCapture?.(e.pointerId);e.preventDefault();}}
    function move(e){if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(!pointer.drag&&!pointer.moved&&Math.hypot(dx,dy)<=6)return;if(!pointer.moved&&Math.hypot(dx,dy)>6){pointer.moved=true;pointer.el.setPointerCapture?.(e.pointerId);}
      if(pointer.drag==='high'){if(r.lifted&&!s.upper){r.high=Math.max(0,Math.min(1,dx/70));updateMechanical();}return;}
      if(pointer.drag==='grip'){if(s.boss&&!r.lifted){r.handle=Math.max(0,Math.min(1,dy/55));updateMechanical();}return;}
      if(pointer.drag){pointer.el.style.translate=`${dx}px ${dy}px`;return;}
      camera.yaw=pointer.yaw-dx*.22;camera.pitch=pointer.pitch+dy*.15;updateCamera();}
    function up(e){if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;if(p.el.hasPointerCapture?.(e.pointerId))p.el.releasePointerCapture(e.pointerId);suppress=p.moved;later(()=>{suppress=false;},0);
      if(p.drag==='high'){if(r.high>=.85)highPull();r.high=0;updateMechanical();return;}
      if(p.drag==='grip'){if(!s.boss){pull();return;}if(r.handle>=.85){r.handle=1;select('door');}else M.release(s,r);updateMechanical();return;}
      if(p.drag?.startsWith('plug-')){p.el.style.translate='';if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>55)link(p.drag.slice(5),false);return;}}
    function cancel(){if(pointer?.drag){pointer.el.style.translate='';if(pointer.drag==='grip')M.release(s,r);}pointer=null;updateMechanical();}
    function click(e){if(suppress){suppress=false;return;}const action=e.target.closest('[data-c4]');if(action){e.preventDefault();act(action.dataset.c4);return;}const id=e.target.closest('[data-c4-object]')?.dataset.c4Object;if(id&&s.phase==='room'&&!journey){select(id);}}
    function input(){}
    function keydown(e){if(s.phase!=='room'||modalEl||conversation||journey||carryingTransition)return;if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-c4-object]')){e.preventDefault();select(e.target.dataset.c4Object);return;}if(e.target.matches('[data-c4-drag="grip"]')&&['Enter',' ','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();act(e.key==='ArrowUp'||r.handle>=.85?'release':'pull');return;}if(e.target.matches('[data-c4-drag="high"]')&&['Enter',' ','ArrowRight'].includes(e.key)){e.preventDefault();highPull();return;}if(e.target.closest('button,input'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cancelAnimationFrame(camFrame);if(e.key==='ArrowLeft')camera.yaw-=15;if(e.key==='ArrowRight')camera.yaw+=15;if(e.key==='ArrowUp')camera.pitch+=8;if(e.key==='ArrowDown')camera.pitch-=8;updateCamera();}}
    function dispose(){dead=true;cancelAnimationFrame(frame);cancelAnimationFrame(camFrame);cancelAnimationFrame(journeyFrame);journey=null;clearTimeout(pulseTimer);timers.forEach(clearTimeout);closeModal(false);audio?.close();app.removeEventListener('click',click);app.removeEventListener('input',input);app.removeEventListener('keydown',keydown);app.removeEventListener('pointerdown',modalDown);app.removeEventListener('pointermove',move);app.removeEventListener('pointerup',up);app.removeEventListener('pointercancel',cancel);window.removeEventListener('resize',updateCamera);}
    function modalDown(e){if(e.target.closest('.c4-modal')&&e.target.closest('[data-c4-drag]'))down(e);}
    function jumpToEnd(){
      s.met=true;s.boss=true;s.bodyChecked=true;s.links.robot=false;s.upper=true;
      s.holding=false;s.opened=true;s.phase='ending';s.line=0;s.logs.push({action:'temporary-skip'});save();
    }
    app.addEventListener('click',click);app.addEventListener('input',input);app.addEventListener('keydown',keydown);app.addEventListener('pointerdown',modalDown);app.addEventListener('pointermove',move);app.addEventListener('pointerup',up);app.addEventListener('pointercancel',cancel);window.addEventListener('resize',updateCamera);render();return {dispose,jumpToEnd};
  };
})();
