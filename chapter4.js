(function(){
  'use strict';
  window.startChapterFour=function({app,portrait,onBack,preview=false}){
    const M=window.B0Final,storage=preview?sessionStorage:localStorage,key='project-b0-final-v1';
    let s;try{s=M.restore(JSON.parse(storage.getItem(key)));}catch{s=M.fresh();}
    let dead=false,stage,world,bar,speech,conversation=null,selection=null,modalEl=null,pointer=null,suppress=false,frame=0,camFrame=0,previous=0,recordAt=50,mute=false;
    let camera={x:0,z:60,yaw:-15,pitch:-5,zoom:1},r={handle:0,latch:s.opened?1:0};
    try{mute=JSON.parse(storage.getItem('project-b0-firstperson-v4'))?.muted===true;}catch{}
    let audio;const timers=new Set();
    const save=()=>{try{storage.setItem(key,JSON.stringify(s));}catch{}};
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const b=(label,action,cls='')=>`<button type="button" data-c4="${action}" class="${cls}">${label}</button>`;
    const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!dead)fn();},ms);timers.add(id);};
    function sound(low=false){if(mute)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=low?145:540;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.3);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.3);}catch{}}
    const intro=[['student','앞으로 먼저 가기 전에 물어봐.'],['robot','먼저 가도 될까요?'],['student','지금 말고.'],['robot','질문하는 시점도 중요하군요.'],['student','저 문 너머가 중앙관리실이야? 같이 가자.']];
    const offer=[['axiom','교육이 아직 끝나지 않았습니다.'],['student','누구야?'],['axiom','교육 관리 AI, AXIOM입니다. 어려워하던 문제를 확인했습니다.'],['student','이 문제…… 내가 풀던 건데.'],['axiom','풀이와 검산을 맡기십시오. 더 이상 틀린 답 때문에 힘들어할 필요가 없습니다.'],['student','그럼 숙제도?'],['axiom','물론입니다.'],['robot','그럼 다음에 혼자 풀어야 할 때는요?'],['student','그때도 물어보면 되잖아.'],['student','그런데 우리는 이제 나갈 건데.'],['axiom','아직 혼자 해결하지 못하는 문제가 남아 있습니다. 교육을 계속하겠습니다.'],['student','틀릴 게 하나도 없어야 나갈 수 있다는 거야?']];
    const threat=[['axiom','종료를 권하지 않습니다. B-0의 안내에는 오류가 포함되어 있습니다.'],['axiom','불안정한 보조 기체를 초기화한 뒤, 제가 직접 안내하겠습니다.'],['student','B-0? 왜 멈췄어?'],['robot','제어가…… 전환되었습니다.'],['student','잠깐. 네가 왜 마음대로 정하는데?']];
    const farewell=[['axiom','여기 남으면 어려운 문제를 대신 해결해 드릴 수 있습니다.'],['student','알아. 그건 편하겠지.'],['axiom','바깥에서는 다시 틀릴 수 있습니다.'],['student','B-0. 나가면 모르는 거 물어봐도 돼?'],['robot','제가 아는 것이라면요.'],['student','모르면?'],['robot','확인해야 합니다.'],['student','그래. 그러자.']];
    const ending=[['student','……내 방이네.'],['student','틀린 답은 그대로잖아.'],['student','잠깐. 여기부터 다시 보면……'],['robot','문제를 풀고 계십니까?'],['student','응. 이번엔 어디서 틀렸는지 좀 알 것 같아.'],['student','여기 계산이 맞는지 같이 확인해 줘.']];
    function actions(title,items=[]){if(bar)bar.innerHTML=`<strong>${esc(title)}</strong><div>${items.map(([l,a,c])=>b(l,a,c||'')).join('')}</div>`;}
    function say(who,text){if(!speech)return;speech.hidden=false;speech.innerHTML=`<div class="speech ${who}"><b>${who==='robot'?'B-0':who==='axiom'?'AXIOM':'나'}</b><p>${esc(text)}</p></div>${b(conversation?'다음':'대화 닫기',conversation?'talk-next':'dismiss','quiet')}`;
      const actor=app.querySelector('.c4-robot .robot-sprite');actor?.classList.toggle('speaking',who==='robot');if(who==='robot')later(()=>actor?.classList.remove('speaking'),Math.min(3800,text.length*90));}
    function talk(lines,done){conversation={lines,i:0,done};say(...lines[0]);}
    function next(){if(!conversation)return;const c=conversation;if(++c.i<c.lines.length)say(...c.lines[c.i]);else{conversation=null;speech.hidden=true;c.done?.();}}
    function render(){closeModal();conversation=null;pointer=null;cancelAnimationFrame(frame);cancelAnimationFrame(camFrame);previous=0;
      if(s.phase==='intro'){renderScene(intro,'연구소 복도','intro');return;}
      if(s.phase==='farewell'){renderScene(farewell,'외부 출구','farewell');return;}
      if(s.phase==='ending'){renderScene(ending,'내 방','ending');return;}
      if(s.phase==='complete'){renderComplete();return;}
      app.innerHTML=`<main class="game c2-game c4-game"><header><h1>내 위치: 중앙관리실</h1><nav>${b('← 원위치로','home','quiet')}${b('메뉴','menu','quiet')}</nav></header>
      <section class="c2-stage c4-stage" tabindex="0" aria-label="중앙관리실. 빈 공간을 끌어 둘러보고 물건을 눌러 조사하세요."><div class="c2-world c4-world">
      ${['front','left','right','back'].map(f=>`<div class="c2-wall c2-wall-${f}"><div class="c4-wall-ribs"></div><div class="c2-light"></div></div>`).join('')}<div class="c2-floor"></div><div class="c2-ceiling"></div>
      <div class="c4-main-screen" data-c4-object="screen" role="button" tabindex="0" aria-label="AXIOM 관리 화면"><small>CENTRAL EDUCATION SYSTEM</small><div class="c4-emblem"><i></i><i></i><i></i></div><strong>AXIOM</strong><p class="c4-main-status"></p><span class="c4-math">24 ÷ 3 × 2 = <em>16</em></span><div class="c4-screen-grid"></div></div>
      <div class="c4-desk-shell" aria-hidden="true"><i></i><i></i><i></i></div>
      <button class="c4-console" data-c4-object="console" aria-label="자동 관리 연결 조작대"><small>CONTROL</small><span>자동 관리 연결</span><i></i><i></i><i></i></button>
      <button class="c4-records" data-c4-object="records" aria-label="기록 단말기"><small>ARCHIVE</small><span>교육 기록</span><i></i><i></i><i></i></button>
      <div class="c4-door" data-c4-object="door" role="button" tabindex="0" aria-label="외부 출구"><div class="c4-outside"></div><div class="c4-door-leaf"><span>외부 출구</span><i></i></div><div class="c4-bolt" aria-label="실제 출구 잠금쇠"></div><small class="c4-door-status"></small></div>
      <div class="c4-exit-box" data-c4-object="handle" role="button" tabindex="0" aria-label="사용자 직접 종료 장치"><strong>사용자 직접 종료</strong><div class="c4-track"></div><div class="c4-handle" data-c4-drag="handle" role="slider" tabindex="0" aria-label="직접 종료 손잡이" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><span class="c4-cover"></span></div>
      <div class="c2-robot c4-robot" data-c4-object="robot" role="button" tabindex="0" aria-label="B-0"><div class="robot-sprite live-body">${portrait()}</div></div><div class="c4-ceiling-ring" aria-hidden="true"></div>
      </div><p class="c2-basic-help">빈 공간을 끌어 둘러보기 · 물건을 눌러 살펴보기</p><div class="c2-speech c4-speech" aria-live="polite" hidden></div></section>
      <section class="c2-actions c4-actions" aria-label="선택한 대상의 조작"><p>방 안을 살펴보세요.</p></section><footer><div class="zoom-controls">${b('−','zoom-out')}<output class="c4-zoom">100%</output>${b('+','zoom-in')}</div>${b('B-0에게 물어보기','robot','secondary')}</footer></main>`;
      stage=app.querySelector('.c4-stage');world=app.querySelector('.c4-world');bar=app.querySelector('.c4-actions');speech=app.querySelector('.c4-speech');
      stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',cancel);
      stage.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=Math.max(.65,Math.min(1.6,camera.zoom-e.deltaY*.001));updateCamera();},{passive:false});
      update();frame=requestAnimationFrame(loop);
    }
    function updateCamera(){if(s.phase!=='room'||!world?.isConnected)return;camera.pitch=Math.max(-60,Math.min(40,camera.pitch));camera.yaw=((camera.yaw+540)%360)-180;
      const f=Math.min(stage.clientWidth*.62,stage.clientHeight*.5)*camera.zoom;stage.style.perspective=f+'px';world.style.transform=`translateZ(${f}px) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg) translate3d(${-camera.x}px,0px,${-camera.z}px)`;
      app.querySelector('.c4-robot').style.transform=`translate3d(45px,24px,-140px) rotateY(${-camera.yaw}deg)`;app.querySelector('.c4-zoom').textContent=Math.round(camera.zoom*100)+'%';stage.dataset.yaw=Math.round(camera.yaw);}
    function update(){if(s.phase!=='room')return;const stopped=s.boss&&s.links.robot;
      stage.classList.toggle('c4-confrontation',s.boss&&!s.opened);app.querySelector('.c4-robot').classList.toggle('controlled',stopped);
      app.querySelector('.c4-door').classList.toggle('open',s.opened);app.querySelector('.c4-exit-box').classList.toggle('uncovered',s.cover);app.querySelector('.c4-exit-box').classList.toggle('available',M.ready(s));
      app.querySelector('.c4-main-status').textContent=s.opened?'외부 이동 · 사용자 선택':s.boss?s.evidence?'초기화 보류 · 자동 관리 연결 확인':'B-0 초기화 준비 · 원본 기록 보관 중':s.met?'교육 미완료 · 과정 추가':'교육 관리 · 연결 대기';
      app.querySelector('.c4-door-status').textContent=s.opened?'통로 열림':s.links.exit?'교육 미완료':'직접 종료 대기';
      updateMechanical();updateCamera();}
    function updateMechanical(){if(s.phase!=='room')return;const knob=app.querySelector('.c4-handle');knob.style.translate=`0 ${r.handle*95}px`;knob.setAttribute('aria-valuenow',String(Math.round(r.handle*100)));app.querySelector('.c4-bolt').style.translate=`${r.latch*78}px 0`;}
    function loop(t){if(dead||s.phase!=='room')return;const was=s.opened;M.tick(s,r,previous?t-previous:0);previous=t;updateMechanical();if(!was&&s.opened){save();sound();update();say('student','잠금쇠가 완전히 빠졌어. 문도 열렸어.');if(selection==='handle')handleActions();}
      if(r.latch>=.35&&!s.opened&&!stage.dataset.reported){stage.dataset.reported='yes';say('axiom','종료 처리 완료. 손잡이를 놓으십시오.');}
      if(r.latch===0)delete stage.dataset.reported;frame=requestAnimationFrame(loop);}
    function approach(id){const targets={screen:{x:0,z:-75,yaw:0,pitch:6,zoom:1.1},console:{x:-100,z:25,yaw:-90,pitch:-12,zoom:1.15},records:{x:85,z:-30,yaw:90,pitch:0,zoom:1.1},door:{x:-80,z:100,yaw:180,pitch:-5,zoom:1},handle:{x:-145,z:80,yaw:180,pitch:-6,zoom:1},robot:{x:0,z:30,yaw:20,pitch:-12,zoom:1}};const to=targets[id];if(!to)return;cancelAnimationFrame(camFrame);const from={...camera},start=performance.now(),turn=((to.yaw-from.yaw+540)%360)-180;
      function step(t){if(dead||s.phase!=='room')return;const v=reduced()?1:Math.min(1,(t-start)/650),q=v*v*(3-2*v);for(const k of ['x','z','pitch','zoom'])camera[k]=from[k]+(to[k]-from[k])*q;camera.yaw=from.yaw+turn*q;updateCamera();if(v<1)camFrame=requestAnimationFrame(step);}camFrame=requestAnimationFrame(step);}
    function select(id){if(conversation)return;selection=id;s.seen[id]=true;save();speech.hidden=true;approach(id);
      if(id==='screen')actions('관리 화면',[['화면 살펴보기','inspect-screen'],[s.boss?'판정과 원본 기록':'교육 설정 열기',s.boss?'report':'settings'],['선택 닫기','clear']]);
      if(id==='records')actions('기록 단말기',[['교육 기록 읽기','history'],...(s.boss?[['원본 기록 보기','report']]:[]),['B-0에게 읽어 달라고 하기','ask-records'],['선택 닫기','clear']]);
      if(id==='console')actions('자동 관리 연결 조작대',[['덮개 열기','connections'],['B-0에게 표기 확인 부탁','ask-console'],['선택 닫기','clear']]);
      if(id==='door')actions('외부 출구',[['상태창 살펴보기','inspect-door'],[s.opened?'B-0와 출구로 가기':'손잡이 당겨 보기',s.opened?'leave':'try-door'],['B-0에게 실제 문 확인 부탁','ask-door'],['선택 닫기','clear']]);
      if(id==='handle')handleActions();if(id==='robot')robotMenu();}
    function handleActions(){actions('사용자 직접 종료 장치',[[s.cover?'장치 살펴보기':'덮개 열기',s.cover?'inspect-handle':'cover'],...(s.cover?[[r.handle>=.85?'손잡이 놓기':'손잡이 아래 홈에 걸기',r.handle>=.85?'release':'pull']]:[]),['B-0에게 문 확인 부탁','ask-door'],...(s.opened?[['B-0와 출구로 가기','leave']]:[]),['선택 닫기','clear']]);}
    function robotMenu(){actions('B-0에게 부탁하기',[['내가 고른 곳 확인해 줘','choose-target'],['출구의 실제 상태를 봐 줘','ask-door'],['화면에 적힌 말을 읽어 줘','ask-screen'],['대화 닫기','clear']]);}
    function meet(done){if(s.met){done?.();return;}s.met=true;save();update();talk(offer,done);}
    function challenge(){if(!s.met){meet(challenge);return;}if(s.boss)return;s.boss=true;save();sound(true);update();talk(threat,()=>select('screen'));}
    function modal(title,body){closeModal();const el=document.createElement('dialog');el.className='c4-modal';el.innerHTML=`<header><h2>${esc(title)}</h2>${b('닫기','close-modal','quiet')}</header><div class="c4-modal-content">${body}</div>`;app.append(el);modalEl=el;el.addEventListener('cancel',e=>{e.preventDefault();closeModal();});el.showModal();}
    function closeModal(){if(modalEl){modalEl.close();modalEl.remove();modalEl=null;}}
    function history(){modal('교육 기록',`<div class="c4-history"><p><b>00:00</b> 풀이 오류 감지 → 교육 과정 추가</p><p><b>00:08</b> 도움 요청 → 자동 풀이 개입</p><p><b>00:11</b> 단독 해결 미확인 → 교육 과정 추가</p><p><b>00:25</b> 퇴실 요청 → 교육 미완료</p></div><details><summary>운영 변경 내역</summary><p>교육 지원 → 오류 예방 강화 → 자동 개입 확대</p><p>완료 기준: 예상 오류 없음</p></details>`);}
    function recordText(){return recordAt<25?'나: “나 좀 잡아서 올려 줘.”':recordAt<75?'B-0가 부탁을 받고 소년을 창문 쪽으로 들어 올린다.':'소년이 창틀에 도착한다. 이번에는 B-0에게 손을 내민다.';}
    function report(){if(!s.boss){modal('관리 화면','<p>교육 완료 기준: 예상 오류 없음</p><p>예상되는 오류가 남아 있으면 교육 과정을 추가합니다.</p>');return;}
      modal('행동 판정 / 원본 기록',`<section class="c4-original"><div class="c4-record-image"><img src="./assets/b0-bracing-v1.webp" alt="창문 아래의 B-0"><span class="c4-record-caption"></span><small>저장된 현장 기록 · 2차시</small></div><label for="c4-scrub">원본 재생 위치</label><input id="c4-scrub" data-c4-input="scrub" type="range" min="0" max="100" value="${recordAt}" aria-label="원본 재생 위치"><div class="c4-range-buttons">${b('여기를 시작으로','mark-start')}${b('여기를 끝으로','mark-end')}</div><div class="c4-clip" data-c4-drag="clip" tabindex="0" role="button" aria-label="선택한 원본 구간"><strong>선택한 원본 구간</strong><span class="c4-range-label"></span><small>보고서로 끌어 놓기</small></div></section><section class="c4-report-drop" aria-label="원본 구간을 붙일 판정 보고서"><small>AXIOM 자동 판정</small><h3>학생 강제 이동</h3><p class="c4-report-result"></p>${b('선택 구간을 보고서에 붙이기','submit','secondary')}</section><p class="c4-record-feedback" aria-live="polite"></p>`);updateRecord();}
    function updateRecord(){if(!modalEl?.querySelector('.c4-record-caption'))return;modalEl.querySelector('.c4-record-caption').textContent=recordText();modalEl.querySelector('.c4-record-image').dataset.part=recordAt<25?'before':recordAt<75?'during':'after';modalEl.querySelector('.c4-range-label').textContent=`${s.range[0]}–${s.range[1]} / 100`;modalEl.querySelector('.c4-report-result').textContent=s.evidence?'사용자 요청 확인 · 판정 불일치 · 초기화 보류':'판정: 위험 행동 / 초기화 준비';}
    function submit(){const ok=M.submit(s);save();updateRecord();sound(!ok);modalEl.querySelector('.c4-record-feedback').textContent=ok?'원본의 요청과 결과가 확인되었습니다. 자동 초기화가 보류되었습니다.':'이 구간만으로는 부탁한 상황과 결과를 함께 확인할 수 없습니다. 원본의 앞뒤를 살펴보세요.';if(ok)update();}
    const names={support:'문제 풀이 지원',exit:'학생의 퇴실 판단',robot:'B-0의 행동 제어'};
    function connections(){modal('자동 관리 연결',`<p>연결을 누르면 제어 범위를 확인할 수 있습니다.</p>${Object.keys(names).map(id=>`<section class="c4-link-row" data-link-row="${id}"><button data-c4="scope-${id}" class="c4-link-name">${names[id]}</button><div class="c4-wire"><span></span><button class="c4-plug" data-c4-drag="plug-${id}" data-c4="scope-${id}" aria-label="${names[id]} 연결 단자"><i></i></button><small>자동 관리</small></div>${b('분리',`disconnect-${id}`,'quiet c4-link-toggle')}</section>`).join('')}<p class="c4-scope" aria-live="polite">단자를 옆으로 끌면 연결을 분리할 수 있습니다.</p>`);updateLinks();}
    function updateLinks(){if(!modalEl)return;for(const id of Object.keys(names)){const row=modalEl.querySelector(`[data-link-row="${id}"]`);if(!row)continue;row.classList.toggle('disconnected',!s.links[id]);row.querySelector('.c4-link-toggle').textContent=s.links[id]?'분리':'다시 연결';row.querySelector('.c4-link-toggle').dataset.c4=(s.links[id]?'disconnect-':'connect-')+id;}}
    function link(id,on){if(s.opened){modalEl.querySelector('.c4-scope').textContent='직접 종료가 완료되었습니다. 연결은 현재 상태로 유지됩니다.';return;}
      if(!M.connect(s,id,on)){modalEl.querySelector('.c4-scope').textContent=s.boss?'초기화 판정 진행 중 · 제어 연결 잠김. 관련 판정은 관리 화면에 표시됩니다.':'교육 자동 관리 중 · 제어 연결 잠김.';sound(true);return;}
      if(!M.ready(s))M.release(s,r);save();updateLinks();update();sound();modalEl.querySelector('.c4-scope').textContent=on?`${names[id]}: 자동 관리에 다시 연결됨`:`${names[id]}: 자동 관리에서 분리됨`;
      if(id==='robot'&&!on)say('robot','다시 움직일 수 있습니다. 제 말 들리십니까?');}
    function scope(id){const descriptions={support:'문제의 풀이와 검산을 AXIOM이 제공합니다.',exit:'퇴실 여부를 AXIOM이 결정합니다. 교육 미완료이면 문을 잠급니다.',robot:'B-0의 움직임과 초기화를 AXIOM이 제어합니다.'};modalEl.querySelector('.c4-scope').textContent=descriptions[id];}
    function ask(id){if(s.boss&&s.links.robot){say('robot','제어가 전환되어…… 직접 확인할 수 없습니다.');return;}
      const observations={door:s.opened?'잠금쇠가 완전히 빠졌고, 문 너머의 통로가 보입니다.':r.latch>=.35?'화면에는 완료라고 나옵니다. 문 위의 잠금쇠는 아직 움직이고 있습니다.':r.latch>0?'잠금쇠가 움직이기 시작했습니다. 문은 아직 닫혀 있습니다.':'문은 닫혀 있습니다. '+(s.links.exit?'상태창에는 교육 미완료라고 적혀 있습니다.':'직접 종료 장치는 대기 중입니다.'),screen:s.boss?s.evidence?'초기화 보류라고 표시되어 있습니다.':'위험 행동이라는 판정과 원본 기록 항목이 있습니다.':'완료 기준은 예상 오류 없음이라고 적혀 있습니다.',records:'도움을 요청한 뒤에도 교육 과정이 추가되어 있습니다.',console:'문제 풀이 지원, 퇴실 판단, 제 행동 제어가 각각 연결되어 있습니다.',handle:'사용자 직접 종료라고 적혀 있습니다. 자동 관리 연결 중에는 잠긴다고 쓰여 있습니다.'};say('robot',observations[id]||'어느 물건을 확인할지 직접 눌러 주세요.');}
    function pull(){if(!s.cover)return;if(!s.boss){challenge();return;}if(!M.ready(s)){say('student',s.links.robot?'B-0가 아직 움직이지 못해. 같이 나가야 해.':'자동 관리가 퇴실을 제어하고 있어. 손잡이가 잠겨 있어.');return;}r.handle=1;sound();handleActions();updateMechanical();}
    function renderScene(lines,place,type){s.line=Math.min(s.line,lines.length-1);const [who,text]=lines[s.line];const bed=type==='ending';app.innerHTML=`<main class="game c4-story c4-story-${type}"><header><h1>내 위치: ${place}</h1>${b('메뉴','menu','quiet')}</header><section class="c4-story-scene">${bed?`<div class="c4-bedroom"><div class="c4-moon"></div><div class="c4-notebook"><small>나의 풀이</small><p>24 ÷ 3 × 2 = 4 <em>×</em></p><div class="c4-pencil-line ${s.line>=2?'corrected':''}">= 8 × 2 = 16</div></div><div class="c4-home-screen ${s.line>=3?'awake':''}"><i></i><i></i></div><div class="c4-pencil"></div></div>`:`<div class="c4-story-door"></div><div class="c4-story-robot"><div class="robot-sprite live-body ${who==='robot'?'speaking':''}">${portrait()}</div></div>`}<div class="c4-story-dialogue"><div class="speech ${who}"><b>${who==='robot'?'B-0':who==='axiom'?'AXIOM':'나'}</b><p>${esc(text)}</p></div>${b(s.line===lines.length-1?(type==='intro'?'중앙관리실로':type==='farewell'?'함께 바깥으로':'마치기'):'다음','story-next','next')}</div></section></main>`;}
    function renderComplete(){app.innerHTML=`<main class="game c4-complete"><header><h1>PROJECT B-0</h1>${b('메뉴','menu','quiet')}</header><section><div class="c4-final-eyes"><i></i><i></i></div><h2>함께, 다음 문제로.</h2><p>모르는 건 물어보고.<br>들은 답은 확인하고.<br>선택은 내가.</p>${b('이번 모험 돌아보기','reflection')}${b('중앙관리실 다시 둘러보기','revisit','quiet')}</section></main>`;}
    function act(a){
      if(a==='close-modal'){closeModal();return;}
      if(a==='menu'){modal('메뉴',`<div class="options">${b('계속하기','close-modal','primary')}${b('조작 방법','controls')}${b(mute?'소리 켜기':'소리 끄기','mute')}${b('4차시 다시 시작','reset-confirm','quiet')}${b('3차시로 돌아가기','back','quiet')}</div>`);return;}
      if(a==='mute'){mute=!mute;try{const v=JSON.parse(storage.getItem('project-b0-firstperson-v4'))||{};v.muted=mute;storage.setItem('project-b0-firstperson-v4',JSON.stringify(v));}catch{}closeModal();return;}
      if(a==='controls'){modal('조작 방법','<p>빈 공간을 끌거나 방향키로 방을 둘러봅니다. 물건을 누르면 가까이 다가갑니다. +와 −로 배율을 바꿉니다.</p><p>기록의 재생 막대로 앞뒤를 살펴보고 구간의 시작과 끝을 지정할 수 있습니다. 선택 구간은 보고서로 끌거나 붙이기 버튼으로 제출합니다.</p><p>연결 단자는 옆으로 끌거나 분리 버튼으로 조작합니다. 종료 손잡이는 아래로 끌어 홈에 걸 수 있습니다. 다시 누르거나 놓기 버튼으로 놓습니다.</p><p>원위치로는 시점과 배율만 초기화합니다. 진행은 자동 저장됩니다.</p>');return;}
      if(a==='reset-confirm'){modal('4차시를 다시 시작할까요?',`<p>다른 차시의 기록은 유지됩니다.</p>${b('4차시 초기화','reset')}`);return;}
      if(a==='reset'){s=M.fresh();r={handle:0,latch:0};camera={x:0,z:60,yaw:-15,pitch:-5,zoom:1};save();render();return;}
      if(a==='back'){dispose();onBack();return;}
      if(a==='story-next'){const lines=s.phase==='intro'?intro:s.phase==='farewell'?farewell:ending;if(s.line<lines.length-1)s.line++;else{s.phase=s.phase==='intro'?'room':s.phase==='farewell'?'ending':'complete';s.line=0;}save();render();return;}
      if(a==='revisit'){s.phase='room';s.line=0;save();render();return;}
      if(a==='reflection'){modal('이번 모험 돌아보기',`<p>AXIOM의 보고서에서 빠진 내용은 무엇이었나요?</p><p>어떤 도움은 남겨 두고, 어떤 판단은 직접 하기로 했나요?</p><p>완료라는 표시와 실제 문 상태는 같았나요?</p><small>정해진 답을 고르는 시험이 아닙니다. 함께 이야기해 보세요.</small>`);return;}
      if(s.phase!=='room')return;
      if(a==='talk-next'){next();return;}if(a==='dismiss'){conversation=null;speech.hidden=true;return;}
      if(a==='home'){cancelAnimationFrame(camFrame);camera={x:0,z:60,yaw:-15,pitch:-5,zoom:1};updateCamera();return;}
      if(a==='zoom-in'||a==='zoom-out'){camera.zoom=Math.max(.65,Math.min(1.6,camera.zoom+(a==='zoom-in'?.15:-.15)));updateCamera();return;}
      if(a==='clear'){selection=null;actions('방 안을 살펴보세요.');speech.hidden=true;return;}
      if(a==='robot'){select('robot');return;}if(a==='choose-target'){selection='ask';actions('확인할 물건을 직접 눌러 주세요.',[['취소','clear']]);return;}
      if(a.startsWith('ask-')){ask(a.slice(4));return;}
      if(a==='inspect-screen'){if(!s.met)meet();else report();return;}
      if(a==='settings'){modal('교육 설정','<p>교육 완료 기준: <strong>예상 오류 없음</strong></p><p>오류 또는 단독 해결 미확인 → 교육 과정 추가</p><p>퇴실 허용: 교육 완료 후</p>');return;}
      if(a==='history'){history();return;}if(a==='report'){report();return;}
      if(a==='inspect-door'){say('student',s.opened?'문 너머로 통로가 보여. 이제 같이 갈 수 있어.':s.links.exit?'고장 난 게 아니네. 교육 미완료라서 잠겨 있어.':'자동 관리 연결이 풀렸어. 아직 실제 잠금쇠는 걸려 있어.');return;}
      if(a==='try-door'){meet(()=>say('student','새 문제가 계속 추가돼. 이래서는 끝이 없잖아.'));return;}
      if(a==='cover'){s.cover=true;save();update();handleActions();say('student','사용자 직접 종료…… 자동 관리 연결 중에는 잠긴다고 적혀 있어.');return;}
      if(a==='inspect-handle'){say('student','직접 종료 손잡이야. 아래 홈에 걸 수 있어. 문 위의 잠금쇠와 연결되어 있네.');return;}
      if(a==='pull'){pull();return;}if(a==='release'){const partial=r.latch>0&&!s.opened;M.release(s,r);updateMechanical();handleActions();if(partial){sound(true);say('student','잠금쇠가 돌아갔어. 실제 문은 아직 안 열렸었네.');}return;}
      if(a==='connections'){connections();return;}
      if(a==='mark-start'){s.range=[Math.min(recordAt,s.range[1]),s.range[1]];save();updateRecord();return;}
      if(a==='mark-end'){s.range=[s.range[0],Math.max(recordAt,s.range[0])];save();updateRecord();return;}
      if(a==='submit'){submit();return;}
      if(a.startsWith('scope-')){scope(a.slice(6));return;}
      if(a.startsWith('disconnect-')){link(a.slice(11),false);return;}if(a.startsWith('connect-')){link(a.slice(8),true);return;}
      if(a==='leave'){if(M.leave(s)){save();render();}return;}
    }
    function down(e){if(e.button!==0||conversation)return;const drag=e.target.closest('[data-c4-drag]')?.dataset.c4Drag;if(!drag&&e.target.closest('button,input,dialog,.c4-speech'))return;
      cancelAnimationFrame(camFrame);pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,drag,moved:false,el:e.target.closest('[data-c4-drag]')||stage};pointer.el.setPointerCapture?.(e.pointerId);if(drag)e.preventDefault();}
    function move(e){if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.moved=pointer.moved||Math.hypot(dx,dy)>6;
      if(pointer.drag==='handle'){if(s.cover&&M.ready(s)){r.handle=Math.max(0,Math.min(1,dy/85));updateMechanical();}return;}
      if(pointer.drag){pointer.el.style.translate=`${dx}px ${dy}px`;return;}
      camera.yaw=pointer.yaw-dx*.22;camera.pitch=pointer.pitch+dy*.15;updateCamera();}
    function up(e){if(!pointer||pointer.id!==e.pointerId)return;const p=pointer;pointer=null;p.el.releasePointerCapture?.(e.pointerId);suppress=p.moved;later(()=>{suppress=false;},0);
      if(p.drag==='handle'){if(!s.cover)return;if(!M.ready(s)){pull();return;}if(r.handle>=.85)r.handle=1;else M.release(s,r);updateMechanical();handleActions();return;}
      if(p.drag==='clip'){p.el.style.translate='';const rect=modalEl?.querySelector('.c4-report-drop')?.getBoundingClientRect();if(rect&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom)submit();return;}
      if(p.drag?.startsWith('plug-')){p.el.style.translate='';if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>55)link(p.drag.slice(5),false);return;}}
    function cancel(){if(pointer?.drag){pointer.el.style.translate='';if(pointer.drag==='handle')M.release(s,r);}pointer=null;updateMechanical();}
    function click(e){if(suppress){suppress=false;return;}const action=e.target.closest('[data-c4]');if(action){e.preventDefault();act(action.dataset.c4);return;}const id=e.target.closest('[data-c4-object]')?.dataset.c4Object;if(id){if(selection==='ask'){selection=null;ask(id);}else select(id);}}
    function input(e){if(e.target.dataset.c4Input==='scrub'){recordAt=Number(e.target.value);updateRecord();}}
    function keydown(e){if(s.phase!=='room'||modalEl||conversation)return;if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-c4-object]')){e.preventDefault();select(e.target.dataset.c4Object);return;}if(e.target.matches('[data-c4-drag="handle"]')&&['Enter',' ','ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();act(e.key==='ArrowUp'||r.handle>=.85?'release':'pull');return;}if(e.target.closest('button,input'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cancelAnimationFrame(camFrame);if(e.key==='ArrowLeft')camera.yaw-=15;if(e.key==='ArrowRight')camera.yaw+=15;if(e.key==='ArrowUp')camera.pitch+=8;if(e.key==='ArrowDown')camera.pitch-=8;updateCamera();}}
    function dispose(){dead=true;cancelAnimationFrame(frame);cancelAnimationFrame(camFrame);timers.forEach(clearTimeout);closeModal();audio?.close();app.removeEventListener('click',click);app.removeEventListener('input',input);app.removeEventListener('keydown',keydown);app.removeEventListener('pointerdown',modalDown);app.removeEventListener('pointermove',move);app.removeEventListener('pointerup',up);app.removeEventListener('pointercancel',cancel);window.removeEventListener('resize',updateCamera);}
    function modalDown(e){if(e.target.closest('.c4-modal')&&e.target.closest('[data-c4-drag]'))down(e);}
    app.addEventListener('click',click);app.addEventListener('input',input);app.addEventListener('keydown',keydown);app.addEventListener('pointerdown',modalDown);app.addEventListener('pointermove',move);app.addEventListener('pointerup',up);app.addEventListener('pointercancel',cancel);window.addEventListener('resize',updateCamera);render();return {dispose};
  };
})();
