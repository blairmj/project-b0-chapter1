(function(){
  'use strict';
  window.startB0CardBattle=function({app,stage,world,bar,speech,state:s,memory=false,save,onReleased,onLeave,onFocus}){
    const M=window.B0CardBoss,esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const button=(label,action,extra='')=>'<button type="button" data-bb="'+action+'" '+extra+'>'+label+'</button>';
    const intro=[['axiom','너는 나가도 좋다. B-0는 남는다.'],['student','같이 나갈 거야.'],['robot','몸이 움직이지 않아요. 안전 팔찌의 보호막으로 공격을 막아 주세요.'],['axiom','해제 카드를 찾는 건가? 가져갈 수 있다면 가져가 봐.']];
    let dead=false,panel='',note=null,frame=0,previous=0,firing=false,turn=0,turnClock=0,fx=null,enemyFX=null,damageUntil=0,phase=s.phase,lastSave=0,lastRays='',skipClick='',visualTime=0,lastVisualVolley=-1,fxSeq=0;
    const effects=[];
    const pointers=new Map();
    const core=app.querySelector('.c4-main-screen'),footer=app.querySelector('.c4-game>footer');
    world.insertAdjacentHTML('beforeend','<div class="c4-battle-space"><div class="c4-battle-rays" aria-hidden="true"></div><div class="c4-battle-effects" aria-hidden="true"></div><button class="c4-battle-reflector" data-bb="aim" aria-label="반사판"><span></span><i></i></button><div class="c4-battle-emitter" data-side="left"><i></i><span></span></div><div class="c4-battle-emitter" data-side="right"><i></i><span></span></div></div>');
    core.insertAdjacentHTML('beforeend','<div class="c4-battle-core" aria-hidden="true"><i></i></div><button class="c4-card-case" data-bb="case" aria-label="액시엄의 카드 보관함"><span class="c4-case-card" aria-hidden="true">B-0</span><span class="c4-case-cover"></span></button>');
    stage.insertAdjacentHTML('beforeend','<section class="c4-combat-hud" aria-label="전투 상태"><div class="c4-player-health"><b>보호막 <output data-hp-label></output></b><span class="c4-hp-track"><i data-hp-bar></i></span></div><div class="c4-boss-health"><b>AXIOM <output data-boss-label></output></b><span class="c4-hp-track"><i data-boss-bar></i></span></div><p data-battle-status></p></section><div class="c4-combat-feedback" aria-hidden="true"></div><div class="c4-acquired-card" hidden aria-label="획득한 해제 카드">B-0<br>해제 카드</div>');
    footer.insertAdjacentHTML('afterbegin','<span class="c4-battery-control">'+button('보조 배터리','battery')+'</span>');
    app.querySelector('.c4-game').dataset.cardBattle='true';
    const space=world.querySelector('.c4-battle-space'),rays=space.querySelector('.c4-battle-rays'),reflector=space.querySelector('.c4-battle-reflector');
    const emitters={left:space.querySelector('[data-side="left"]'),right:space.querySelector('[data-side="right"]')};
    const light=core.querySelector('.c4-battle-core'),cardCase=core.querySelector('.c4-card-case');
    const effectLayer=space.querySelector('.c4-battle-effects'),feedback=app.querySelector('.c4-combat-feedback');
    const FLIGHT=480,reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    const V={y:430/600,z:Math.sqrt(1-(430/600)**2)};
    // An isometric embedding: the optical model and the room use the same ray lengths and angles.
    const point=p=>({x:(p.x-500)*2.5,y:-380+(p.y-215)*2.5*V.y,z:-819+(p.y-215)*2.5*V.z});
    function matrix(x,y,z,p){return 'matrix3d('+[...x,0,...y,0,...z,0,p.x,p.y,p.z,1].join(',')+')';}
    function beam(a,b,kind){
      const d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},length=Math.hypot(d.x,d.y,d.z);if(length<.01)return '';
      const x=[d.x/length,d.y/length,d.z/length],n=Math.hypot(x[0],x[2]),y=n>.001?[-x[0]*x[1]/n,n,-x[2]*x[1]/n]:[1,0,0],z=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]];
      return '<div class="c4-battle-ray '+kind+'" style="width:'+length+'px;transform:'+matrix(x,y,z,a)+'"><i></i><i></i></div>';
    }
    function addEffect(kind,from,to,start,life=FLIGHT,damage=0){
      const id=++fxSeq,shot=kind==='enemy'||kind==='return',html=shot?
        '<i class="c4-energy-orb"></i><i class="c4-energy-tail c4-tail-one"></i><i class="c4-energy-tail c4-tail-two"></i>':
        '<i class="c4-impact-ring"></i><i class="c4-impact-ring c4-impact-ring-two"></i><b>'+(damage?'\u2212'+damage:kind==='block'?'반사':'')+'</b>';
      effectLayer.insertAdjacentHTML('beforeend','<div class="c4-energy-fx c4-fx-'+kind+'" data-fx="'+id+'">'+html+'</div>');
      const node=effectLayer.querySelector('[data-fx="'+id+'"]');
      effects.push({id,kind,from,to:to||from,start,life,node,shot,impact:false});
    }
    function notify(text,kind,t){
      feedback.textContent=text;feedback.dataset.kind=kind;feedback.dataset.until=String(t+900);
      feedback.classList.remove('c4-feedback-pop');void feedback.offsetWidth;feedback.classList.add('c4-feedback-pop');
    }
    function resetEffects(){
      for(const e of effects)e.node.remove();effects.length=0;lastVisualVolley=-1;
      for(const emitter of Object.values(emitters)){emitter.dataset.shot='false';emitter.style.setProperty('--charge','0');}
      feedback.textContent='';feedback.classList.remove('c4-feedback-pop');
    }
    function prepareEnemy(t){
      if(s.phase!=='fight')return;
      const charge=Math.max(0,Math.min(1,(s.enemyClock+200)/(M.ENEMY_MS-FLIGHT+200)));
      for(const side of ['left','right'])emitters[side].style.setProperty('--charge',side===s.side?String(charge):'0');
      if(s.enemyClock>=M.ENEMY_MS-FLIGHT&&lastVisualVolley!==s.volley){
        lastVisualVolley=s.volley;const trace=M.trace(s),remaining=Math.max(1,M.ENEMY_MS-s.enemyClock);
        addEffect('muzzle',point(trace.source),null,t,370);
        addEffect('enemy',point(trace.source),point(trace.mirror),t,remaining);
        emitters[s.side].dataset.shot=String(s.volley+1);
      }
    }
    function updateEffects(t){
      for(let i=effects.length-1;i>=0;i--){
        const e=effects[i],age=t-e.start,p=Math.max(0,Math.min(1,age/e.life));
        if(age>=e.life){
          e.node.remove();effects.splice(i,1);
          if(e.kind==='return'&&e.hit&&s.phase==='fight')addEffect('core',e.to,null,t,420,M.SHOT_DAMAGE);
          continue;
        }
        if(e.shot){
          for(const [selector,lag,size,opacity] of [['.c4-energy-orb',0,1,1],['.c4-tail-one',.13,.7,.6],['.c4-tail-two',.26,.42,.25]]){
            const q=reducedMotion?1:Math.max(0,p-lag),x=e.from.x+(e.to.x-e.from.x)*q,y=e.from.y+(e.to.y-e.from.y)*q,z=e.from.z+(e.to.z-e.from.z)*q;
            const orb=e.node.querySelector(selector);orb.style.transform='translate3d('+x+'px,'+y+'px,'+z+'px) scale('+size+')';orb.style.opacity=String(opacity);
          }
        }else{
          e.node.style.transform='translate3d('+e.from.x+'px,'+e.from.y+'px,'+e.from.z+'px) scale('+(reducedMotion?1:e.kind==='muzzle'?.5+p*2.8:.65+p*1.2)+')';
          e.node.style.opacity=String(Math.max(0,1-p));
        }
      }
      if(Number(feedback.dataset.until||0)<t)feedback.textContent='';
    }
    function commit(){save?.();}
    function speak(who,text){note=[who,text];}
    function message(){
      if(s.phase==='intro')return intro[s.line];
      return note||(s.phase==='lost'?['robot','보호막 에너지가 다 떨어졌어요. 다시 준비해요.']:s.phase==='released'?['robot','이제 움직일 수 있어요. 열린 문으로 같이 나가요.']:s.phase==='card'?['student','카드를 찾았어. B-0의 잠금을 풀자.']:M.defeated(s)?['student','액시엄이 멈췄어. 출구도 열렸어!']:s.phase==='ready'?['robot','반사 공격 버튼을 누른 채 빛의 방향을 맞춰요. 보조 배터리로 보호막을 충전할 수 있어요.']:['robot','빛이 나오는 곳이 바뀌면 반사판도 돌려요.']);
    }
    function controls(){
      if(panel==='terminal')return '<strong>기록 단말기</strong><p>'+(s.memoryRead?'장치 점검 기록 · <b>중앙의 둥근 불빛이 공격 장치 전원이다.</b> 그 아래에 해제 카드가 있다.':memory?'교육 실습실에서 가져온 기록 메모리를 연결할 수 있다.':'교육 실습실의 기록 메모리가 있으면 장치 점검 그림을 읽을 수 있다.')+'</p>'+(memory&&!s.memoryRead?button('기록 메모리 연결하기','memory'):'')+button('돌아가기','close-panel');
      if(panel==='case')return '<strong>카드 보관함</strong><p>'+(M.defeated(s)?s.cardTaken?'카드를 꺼낸 빈 보관함이다.':'덮개가 열렸다. 안에 해제 카드가 있다.':'덮개가 잠겨 있다. 액시엄을 먼저 멈춰야 한다.')+'</p>'+(s.phase==='defeated'?button('카드 꺼내기','take','class="primary"'):'')+button('돌아가기','close-panel');
      if(panel==='robot')return '<strong>B-0의 가슴 슬롯</strong><p>'+(s.released?'잠금이 풀렸다. 함께 나갈 수 있다.':s.cardTaken?'해제 카드와 같은 그림이 있다.':'몸의 잠금 표시가 켜져 있다.')+'</p>'+(s.phase==='card'?button('해제 카드 넣기','release','class="primary"'):'')+button('돌아가기','close-panel');
      if(panel==='door')return '<strong>외부 출구</strong><p>'+(s.released?'액시엄이 멈추면서 출구가 열렸다.':M.defeated(s)?'출구는 열렸다. B-0의 잠금도 풀고 함께 나가자.':'액시엄이 출구를 막고 있다.')+'</p>'+(s.released?button('B-0와 함께 나가기','leave','class="primary"'):'')+button('돌아가기','close-panel');
      if(s.phase==='intro')return button(s.line===3?'주변 살펴보기':'다음','next');
      if(s.phase==='lost')return button('다시 도전하기','retry','class="primary"');
      if(s.phase==='released')return button('B-0와 함께 나가기','leave','class="primary"');
      if(s.phase==='card')return button('B-0에게 가기','robot','class="primary"')+button('열린 출구 보기','door');
      if(s.phase==='defeated')return button('카드 보관함 살펴보기','case','class="primary"')+button('열린 출구 보기','door');
      if(s.phase==='ready')return button('반사판 들고 전투 시작','deploy','class="primary"')+button('기록 단말기 살펴보기','terminal');
      return button('↶ 왼쪽','left','aria-label="반사판 왼쪽으로 돌리기"')+button('반사 공격 · 누르고 있기','strike','class="primary c4-reflect-fire" aria-label="반사 공격"')+button('오른쪽 ↷','right','aria-label="반사판 오른쪽으로 돌리기"')+button('전투 시점','focus');
    }
    function render(focus){
      if(dead)return;const [who,text]=message();
      speech.hidden=false;speech.innerHTML='<div class="speech '+who+'"><b>'+(who==='axiom'?'AXIOM':who==='robot'?'B-0':'나')+'</b><p>'+esc(text)+'</p></div>';
      bar.innerHTML='<div class="c4-battle-controls">'+controls()+'</div>';
      if(focus)app.querySelector('[data-bb="'+focus+'"]')?.focus({preventScroll:true});
      refreshScene(visualTime);refreshHUD();
    }
    function refreshHUD(){
      app.querySelector('[data-hp-label]').textContent=s.hp+' / '+M.MAX_HP;app.querySelector('[data-boss-label]').textContent=s.bossHP+' / '+M.BOSS_HP;
      app.querySelector('[data-hp-bar]').style.width=s.hp/M.MAX_HP*100+'%';app.querySelector('[data-boss-bar]').style.width=s.bossHP/M.BOSS_HP*100+'%';
      app.querySelector('[data-battle-status]').textContent=panel&&s.phase==='fight'?'조사 중 · 전투 일시정지':s.phase==='fight'?(s.side==='left'?'왼쪽':'오른쪽')+' 광선 장치 발사 중':s.phase==='lost'?'보호막 소진':M.defeated(s)?'AXIOM 정지 · 출구 열림':'전투 준비';
      const battery=app.querySelector('[data-bb="battery"]');battery.textContent='보조 배터리 '+s.batteries; battery.disabled=s.batteries<=0||s.hp===M.MAX_HP||!['ready','fight'].includes(s.phase);
      const card=app.querySelector('.c4-acquired-card');card.hidden=!s.cardTaken;card.dataset.used=String(s.released);
      stage.dataset.firing=String(firing);stage.dataset.combat=s.phase;stage.dataset.combatPaused=String(!!panel);
    }
    function refreshScene(t){
      if(dead)return;const trace=M.trace(s),active=s.deployed&&s.phase==='fight',angle=s.angle*Math.PI/180;
      reflector.hidden=!active;
      reflector.style.transform=matrix([Math.cos(angle),Math.sin(angle)*V.y,Math.sin(angle)*V.z],[0,V.z,-V.y],[-Math.sin(angle),Math.cos(angle)*V.y,Math.cos(angle)*V.z],point(trace.mirror));
      for(const side of ['left','right']){const pos=point({x:side==='left'?235:765,y:302});emitters[side].style.transform='translate3d('+pos.x+'px,'+pos.y+'px,'+pos.z+'px)';emitters[side].dataset.active=String(s.phase==='fight'&&s.side===side);}
      light.dataset.defeated=String(M.defeated(s));light.dataset.marked=String(s.memoryRead);light.dataset.damaged=String(s.bossHP<M.BOSS_HP);
      cardCase.dataset.open=String(M.defeated(s));cardCase.dataset.empty=String(s.cardTaken);
      let html=active?beam(point(trace.source),point(trace.mirror),'c4-ray-guide')+beam(point(trace.mirror),point(trace.end),'c4-ray-guide c4-ray-guide-out'):'';
      if(fx&&t<fx.until)html+=beam(point(fx.trace.mirror),point(fx.trace.end),'c4-ray-return');
      else fx=null;
      if(enemyFX&&t<enemyFX.until)html+=beam(point(enemyFX.trace.source),point(enemyFX.trace.mirror),'c4-ray-enemy');
      else enemyFX=null;
      if(lastRays!==html){lastRays=html;rays.innerHTML=html;}stage.classList.toggle('c4-player-hit',t<damageUntil);updateEffects(t);
    }
    function stop(){firing=false;turn=0;pointers.clear();}
    function afterAttack(events,t){
      for(const e of events){
        if(e.kind==='return'){
          fx={trace:e.trace,until:t+310};addEffect('return',point(e.trace.mirror),point(e.trace.end),t,560);
          effects[effects.length-1].hit=e.trace.hit;
          addEffect('reflect',point(e.trace.mirror),null,t,320);
        }
        if(e.kind==='enemy'){
          enemyFX={trace:e.trace,until:t+140};
          addEffect(e.blocked?'block':'shield',point(e.trace.mirror),null,t,650,e.damage);
          if(e.damage){damageUntil=t+360;notify('보호막 −'+e.damage,'damage',t);}
          else notify('반사 성공','block',t);
        }
        if(e.kind==='side')speak('robot','빛이 나오는 곳이 바뀌었어요!');
      }
      if(s.phase!==phase){phase=s.phase;stop();panel='';note=null;
        if(M.defeated(s)){addEffect('core',point(M.trace(s).target),null,t,850);notify('AXIOM 정지','victory',t);}
        render();
      }
      if(events.length){commit();refreshHUD();}
      refreshScene(t);
    }
    function act(a){
      if(dead)return;
      if(a==='next'){if(M.advance(s)){commit();render();}return;}
      if(a==='close-panel'){panel='';note=null;stop();render();return;}
      if(a==='focus'||a==='aim'){onFocus?.('combat');return;}
      if(a==='terminal'||a==='case'||a==='robot'||a==='door'){
        stop();panel=a;onFocus?.(a==='terminal'?'records':a);render();return;
      }
      if(a==='memory'){if(M.readMemory(s,memory)){commit();speak('student','중앙의 둥근 불빛을 노리면 되겠어.');render();}return;}
      if(a==='deploy'){if(M.deploy(s)){phase=s.phase;panel='';note=null;resetEffects();onFocus?.('combat');commit();render();}return;}
      if(a==='left'||a==='right'){if(M.adjust(s,a==='left'?-15:15)){commit();refreshScene(visualTime);}return;}
      if(a==='strike'){const result=M.strike(s);if(result)afterAttack([{kind:'return',trace:result}],visualTime);return;}
      if(a==='battery'){if(M.useBattery(s)){commit();refreshHUD();}return;}
      if(a==='retry'){if(M.retry(s)){phase=s.phase;note=null;resetEffects();commit();render();}return;}
      if(a==='take'){if(M.takeCard(s)){phase=s.phase;panel='';speak('student','해제 카드를 찾았어. 이제 B-0에게 가자.');commit();render();}return;}
      if(a==='release'){if(M.release(s)){phase=s.phase;panel='';note=null;commit();onReleased?.();render();}return;}
      if(a==='leave'){if(s.released)onLeave?.();else act('door');return;}
      if(a==='hint'){speak('robot',s.released?'문이 열렸어요. 같이 나가요.':s.cardTaken?'가슴 슬롯에 해제 카드를 넣어 주세요.':M.defeated(s)?'이제 보관함에서 카드를 꺼낼 수 있어요.':'반사 공격 버튼을 누른 채 조준해요. 보호막이 줄면 보조 배터리를 써요.');render();}
    }
    function click(e){const target=e.target.closest('[data-bb]');if(target){e.preventDefault();if(skipClick===target.dataset.bb){skipClick='';return;}act(target.dataset.bb);}}
    function down(e){
      const a=e.target.closest('[data-bb]')?.dataset.bb;if(s.phase!=='fight'||panel||!['left','right','strike'].includes(a))return;
      e.preventDefault();skipClick=a;pointers.set(e.pointerId,a);if(a==='strike'){firing=true;act('strike');}else{turn=a==='left'?-1:1;turnClock=0;act(a);}
    }
    function up(e){const a=pointers.get(e.pointerId);pointers.delete(e.pointerId);if(a==='strike')firing=false;if(a==='left'||a==='right')turn=0;}
    function keydown(e){
      skipClick='';
      if(e.target.closest('input,select,dialog')||panel)return;
      if(s.phase==='fight'&&([' ','Space','Spacebar','ArrowLeft','ArrowRight'].includes(e.key)||e.code==='Space')){e.preventDefault();if(e.key===' '||e.key==='Space'||e.key==='Spacebar'||e.code==='Space'){firing=true;if(!e.repeat)act('strike');}else if(!e.repeat){turn=e.key==='ArrowLeft'?-1:1;turnClock=0;act(turn<0?'left':'right');}}
    }
    function keyup(e){if([' ','Space','Spacebar'].includes(e.key)||e.code==='Space')firing=false;if(['ArrowLeft','ArrowRight'].includes(e.key))turn=0;}
    function loop(t){
      if(dead)return;const dt=previous?Math.min(100,t-previous):0;previous=t;
      if(document.hidden||app.querySelector('dialog[open]')||panel){stop();frame=requestAnimationFrame(loop);return;}
      if(turn&&s.phase==='fight'){turnClock+=dt;if(turnClock>=145){turnClock-=145;act(turn<0?'left':'right');}}
      visualTime+=dt;const events=M.tick(s,dt,{firing});prepareEnemy(visualTime);afterAttack(events,visualTime);
      if(s.phase==='fight'&&t-lastSave>1500){lastSave=t;commit();}
      frame=requestAnimationFrame(loop);
    }
    function select(id){act(({records:'terminal',console:'terminal',screen:'focus',robot:'robot',door:'door',handle:'door',high:'door'})[id]||'focus');}
    function dispose(){
      if(dead)return;dead=true;cancelAnimationFrame(frame);stop();resetEffects();
      app.removeEventListener('click',click);app.removeEventListener('pointerdown',down);app.removeEventListener('keydown',keydown);
      window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',stop);
      space.remove();light.remove();cardCase.remove();feedback.remove();app.querySelector('.c4-combat-hud')?.remove();app.querySelector('.c4-acquired-card')?.remove();app.querySelector('.c4-battery-control')?.remove();
    }
    app.addEventListener('click',click);app.addEventListener('pointerdown',down);app.addEventListener('keydown',keydown);
    window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('keyup',keyup);window.addEventListener('blur',stop);
    render();frame=requestAnimationFrame(loop);return {dispose,act,select,stop};
  };
})();
