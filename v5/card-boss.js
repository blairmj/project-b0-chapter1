(function(){
  'use strict';
  window.startB0CardBattle=function({app,stage,world,bar,speech,state:s,memory=false,save,onReleased,onLeave,onFocus,readView,onPlayerMove}){
    const M=window.B0CardBoss,point=M.point,esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const button=(label,action,extra='')=>'<button type="button" data-bb="'+action+'" '+extra+'>'+label+'</button>';
    const intro=[['axiom','너는 나가도 좋다. B-0는 남는다.'],['student','같이 나갈 거야.'],['robot','보호막 안에서 함께 피하고, 반사판으로 공격해요.'],['axiom','해제 카드를 찾는 건가? 가져갈 수 있다면 가져가 봐.']];
    let dead=false,panel='',note=null,frame=0,previous=0,visualTime=0,lastSave=0,phase=s.phase,rulesMode='',pointer=null,blurred=false,damageUntil=0,fxSeq=0;
    const keys=new Set(),effects=[],bullets=new Map(),game=app.querySelector('.c4-game'),core=app.querySelector('.c4-main-screen'),footer=app.querySelector('.c4-game>footer');
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    game.dataset.cardBattle='true';game.dataset.shooter='true';
    world.insertAdjacentHTML('beforeend','<div class="c4-battle-space"><div class="c4-battle-effects" aria-hidden="true"></div><div class="c4-player-dome" aria-label="B-0를 감싸는 돔형 보호막"><i class="c4-dome-shell"></i><i class="c4-dome-rib"></i><i class="c4-dome-rib c4-dome-rib-two"></i><i class="c4-dome-base"></i><b data-dome-hp></b></div><div class="c4-player-weapon" aria-label="B-0가 든 반사판"><i></i></div></div>');
    core.insertAdjacentHTML('beforeend','<div class="c4-battle-core" aria-hidden="true"><i></i></div><button class="c4-card-case" data-bb="case" aria-label="액시엄의 카드 보관함"><span class="c4-case-card" aria-hidden="true">B-0</span><span class="c4-case-cover"></span></button>');
    stage.insertAdjacentHTML('beforeend','<div class="c4-shooter-input" tabindex="0" role="application" aria-label="슈팅 전투. 마우스 좌우 이동, 손가락 끌기 또는 좌우 방향키. 자동 발사."></div><section class="c4-combat-hud" aria-label="전투 상태"><div class="c4-player-health"><b>B-0 보호막 <output data-hp-label></output></b><span class="c4-hp-track"><i data-hp-bar></i></span></div><div class="c4-boss-health"><b>AXIOM <output data-boss-label></output></b><span class="c4-hp-track"><i data-boss-bar></i></span></div><p data-battle-status></p></section><div class="c4-combat-feedback" aria-hidden="true"></div><div class="c4-acquired-card" hidden aria-label="획득한 해제 카드">B-0<br>해제 카드</div>');
    footer.insertAdjacentHTML('afterbegin','<span class="c4-battery-control">'+button('보조 배터리','battery')+'</span>');
    footer.insertAdjacentHTML('afterend','<dialog class="c4-battle-rules" aria-labelledby="c4-rules-title"></dialog>');
    const space=world.querySelector('.c4-battle-space'),layer=space.querySelector('.c4-battle-effects'),dome=space.querySelector('.c4-player-dome'),weapon=space.querySelector('.c4-player-weapon');
    const light=core.querySelector('.c4-battle-core'),cardCase=core.querySelector('.c4-card-case'),rules=app.querySelector('.c4-battle-rules'),input=stage.querySelector('.c4-shooter-input'),feedback=app.querySelector('.c4-combat-feedback');
    const transform=p=>'translate3d('+p.x+'px,'+p.y+'px,'+p.z+'px)';
    function commit(){save?.();}
    function stop(){keys.clear();if(pointer!==null){if(input.hasPointerCapture?.(pointer))input.releasePointerCapture(pointer);pointer=null;}}
    function paused(){return !!panel||!!rulesMode||blurred||document.hidden||!!app.querySelector('dialog[open]');}
    function placePlayer(){onPlayerMove?.(s.player);}
    function movePlayer(x){
      const view=readView?.();
      if(view){const at=M.project(view,s.player),center=M.project(view,{x:500,y:M.bounds.y}),edge=M.project(view,{x:552,y:M.bounds.y});if(at&&center&&edge){const margin=Math.min(view.width*.4,Math.abs(edge.x-center.x)+12),a=M.screenToArena(view,margin,at.y),b=M.screenToArena(view,view.width-margin,at.y);if(a&&b)x=Math.max(Math.min(a.x,b.x),Math.min(Math.max(a.x,b.x),x));}}
      if(M.movePlayer(s,x)){placePlayer();refreshScene();return true;}return false;
    }
    function notify(text,kind){feedback.textContent=text;feedback.dataset.kind=kind;feedback.dataset.until=String(visualTime+800);feedback.classList.remove('c4-feedback-pop');void feedback.offsetWidth;feedback.classList.add('c4-feedback-pop');}
    function impact(kind,p,damage=0,life=550){
      const id=++fxSeq;layer.insertAdjacentHTML('beforeend','<div class="c4-energy-fx c4-fx-'+kind+'" data-fx="impact-'+id+'"><i class="c4-impact-ring"></i><i class="c4-impact-ring c4-impact-ring-two"></i><b>'+(damage?'−'+damage:'')+'</b></div>');
      effects.push({node:layer.querySelector('[data-fx="impact-'+id+'"]'),point:point(p),start:visualTime,life});
    }
    function resetEffects(){for(const node of bullets.values())node.remove();bullets.clear();for(const fx of effects)fx.node.remove();effects.length=0;feedback.textContent='';}
    function syncProjectiles(){
      const active=new Set();
      for(const p of s.projectiles){
        active.add(p.id);let node=bullets.get(p.id);
        if(!node){layer.insertAdjacentHTML('beforeend','<div class="c4-energy-fx c4-fx-'+p.kind+'" data-shot="'+p.id+'"><i class="c4-energy-orb"></i><i class="c4-energy-tail c4-tail-one"></i><i class="c4-energy-tail c4-tail-two"></i></div>');node=layer.querySelector('[data-shot="'+p.id+'"]');bullets.set(p.id,node);}
        for(const [selector,delay,size,opacity] of [['.c4-energy-orb',0,1,1],['.c4-tail-one',.04,.65,.6],['.c4-tail-two',.08,.4,.25]]){
          const at=point({x:p.x-p.vx*delay,y:p.y-p.vy*delay});if(p.kind==='return'){at.y+=16;at.z+=20;}
          const orb=node.querySelector(selector);orb.style.transform=transform(at)+' scale('+size+')';orb.style.opacity=String(opacity);
        }
      }
      for(const [id,node] of bullets)if(!active.has(id)){node.remove();bullets.delete(id);}
      for(let i=effects.length-1;i>=0;i--){const fx=effects[i],progress=(visualTime-fx.start)/fx.life;if(progress>=1){fx.node.remove();effects.splice(i,1);}else{fx.node.style.transform=transform(fx.point)+' scale('+(reduced?1:.5+progress*1.2)+')';fx.node.style.opacity=String(1-progress);}}
      if(visualTime>Number(feedback.dataset.until||0))feedback.textContent='';
    }
    function message(){
      if(s.phase==='intro')return intro[s.line];
      return note||(s.phase==='lost'?['robot','보호막 에너지가 다 떨어졌어요. 다시 도전해요.']:s.phase==='released'?['robot','잠금이 풀렸어요. 열린 문으로 같이 나가요.']:s.phase==='card'?['student','카드를 찾았어. B-0의 잠금을 풀자.']:M.defeated(s)?['student','액시엄이 멈췄어. 출구도 열렸어!']:['robot','보호막과 함께 좌우로 피하세요. 반사판은 자동으로 쏴요.']);
    }
    function openRules(start=false){
      stop();rulesMode=start?'start':'review';
      rules.innerHTML='<header><small>B-0 구출 작전</small><h2 id="c4-rules-title">피하면서 액시엄을 공격해요</h2></header><ol>'+
        '<li><b>화면에서 좌우로 움직이기</b><p>마우스를 움직이거나 손가락으로 끌어요.<br>반사판은 자동으로 쏴요.</p></li>'+
        '<li><b>주황색 탄은 피하기</b><p>액시엄 중앙 아래에서 쏘세요.<br>반사탄 6번이 맞으면 승리해요!</p></li>'+
        '<li><b>B-0는 돔 보호막 안에!</b><p>맞으면 보호막이 줄어요.<br>보조 배터리로 40을 채울 수 있어요.</p></li></ol>'+
        '<p class="c4-rules-goal">승리 → 해제 카드 → B-0와 탈출</p><footer>'+button(start?'준비됐어, 시작!':'전투 계속하기',start?'begin':'rules-close','class="primary"')+(start?button('아직 준비 중이야','rules-close'):'')+'</footer>';
      rules.showModal();refreshHUD();
    }
    function closeRules(){rulesMode='';if(rules.open)rules.close();refreshHUD();input.focus({preventScroll:true});}
    function cancelRules(e){e.preventDefault();closeRules();}
    function controls(){
      if(panel==='terminal')return '<strong>기록 단말기</strong><p>'+(s.memoryRead?'장치 점검 기록 · <b>중앙의 둥근 불빛이 공격 장치 전원이다.</b> 그 아래에 해제 카드가 있다.':memory?'교육 실습실에서 가져온 기록 메모리를 연결할 수 있다.':'교육 실습실의 기록 메모리가 있으면 장치 점검 그림을 읽을 수 있다.')+'</p>'+(memory&&!s.memoryRead?button('기록 메모리 연결하기','memory'):'')+button('돌아가기','close-panel');
      if(panel==='case')return '<strong>카드 보관함</strong><p>'+(M.defeated(s)?s.cardTaken?'카드를 꺼낸 빈 보관함이다.':'덮개가 열렸다. 안에 해제 카드가 있다.':'덮개가 잠겨 있다. 액시엄을 먼저 멈춰야 한다.')+'</p>'+(s.phase==='defeated'?button('카드 꺼내기','take','class="primary"'):'')+button('돌아가기','close-panel');
      if(panel==='robot')return '<strong>B-0의 가슴 슬롯</strong><p>'+(s.released?'잠금이 풀렸다. 함께 나갈 수 있다.':s.cardTaken?'해제 카드와 같은 그림이 있다.':'반출 잠금 표시가 켜져 있다.')+'</p>'+(s.phase==='card'?button('해제 카드 넣기','release','class="primary"'):'')+button('돌아가기','close-panel');
      if(panel==='door')return '<strong>외부 출구</strong><p>'+(s.released?'액시엄이 멈추면서 출구가 열렸다.':M.defeated(s)?'출구는 열렸다. B-0의 잠금도 풀고 함께 나가자.':'액시엄이 출구를 막고 있다.')+'</p>'+(s.released?button('B-0와 함께 나가기','leave','class="primary"'):'')+button('돌아가기','close-panel');
      if(s.phase==='intro')return button(s.line===3?'주변 살펴보기':'다음','next');
      if(s.phase==='lost')return button('다시 도전하기','retry','class="primary"');
      if(s.phase==='released')return button('B-0와 함께 나가기','leave','class="primary"');
      if(s.phase==='card')return button('B-0에게 가기','robot','class="primary"')+button('열린 출구 보기','door');
      if(s.phase==='defeated')return button('카드 보관함 살펴보기','case','class="primary"')+button('열린 출구 보기','door');
      if(s.phase==='ready')return button('규칙 보고 전투 시작','deploy','class="primary"')+button('기록 단말기 살펴보기','terminal');
      return '<span class="c4-shooter-help">좌우로 피하기 · 반사판 자동 발사</span>'+button('규칙 · 일시정지','rules');
    }
    function render(){
      if(dead)return;const [who,text]=message();speech.hidden=s.phase==='fight';speech.innerHTML='<div class="speech '+who+'"><b>'+(who==='axiom'?'AXIOM':who==='robot'?'B-0':'나')+'</b><p>'+esc(text)+'</p></div>';
      bar.innerHTML='<div class="c4-battle-controls">'+controls()+'</div>';refreshHUD();refreshScene();
    }
    function refreshHUD(){
      app.querySelector('[data-hp-label]').textContent=s.hp+' / '+M.MAX_HP;app.querySelector('[data-boss-label]').textContent=s.bossHP+' / '+M.BOSS_HP;
      app.querySelector('[data-hp-bar]').style.width=s.hp/M.MAX_HP*100+'%';app.querySelector('[data-boss-bar]').style.width=s.bossHP/M.BOSS_HP*100+'%';
      app.querySelector('[data-battle-status]').textContent=s.phase==='fight'?(paused()?'일시정지':'좌우 이동 · 자동 발사'):s.phase==='lost'?'보호막 소진':M.defeated(s)?'AXIOM 정지 · 출구 열림':'전투 준비';
      const battery=app.querySelector('[data-bb="battery"]');battery.textContent='보조 배터리 '+s.batteries;battery.disabled=s.batteries<=0||s.hp===M.MAX_HP||!['ready','fight'].includes(s.phase);
      const card=app.querySelector('.c4-acquired-card');card.hidden=!s.cardTaken;card.dataset.used=String(s.released);
      stage.dataset.combat=s.phase;stage.dataset.combatPaused=String(paused());stage.dataset.firing=String(s.phase==='fight'&&!paused());
    }
    function refreshScene(){
      if(dead)return;const p=point(s.player),protectedB0=!s.released;
      dome.hidden=!protectedB0;weapon.hidden=!protectedB0;dome.style.transform=transform({...p,z:p.z+15});weapon.style.transform=transform({...p,y:p.y+16,z:p.z+22})+' rotate(-9deg)';
      dome.dataset.low=String(s.hp<=30);dome.dataset.hit=String(visualTime<damageUntil);dome.dataset.empty=String(s.hp===0);dome.style.setProperty('--shield-level',String(.45+s.hp/M.MAX_HP*.55));dome.querySelector('[data-dome-hp]').textContent='B-0 보호막 '+s.hp;
      input.hidden=s.phase!=='fight';light.dataset.defeated=String(M.defeated(s));light.dataset.marked=String(s.memoryRead);light.dataset.damaged=String(s.bossHP<M.BOSS_HP);light.style.setProperty('--charge',s.phase==='fight'?String(Math.max(0,Math.min(1,s.enemyClock/M.ENEMY_MS))):'0');
      cardCase.dataset.open=String(M.defeated(s));cardCase.dataset.empty=String(s.cardTaken);stage.classList.toggle('c4-player-hit',visualTime<damageUntil);syncProjectiles();
    }
    function afterEvents(events){
      for(const e of events){
        if(e.kind==='volley')impact('muzzle',M.core,0,350);
        if(e.kind==='hit')impact('core',e.at,e.damage,450);
        if(e.kind==='player-hit'){damageUntil=visualTime+350;impact('shield',e.at,e.damage,550);notify('보호막 −'+e.damage,'damage');}
      }
      if(s.phase!==phase){phase=s.phase;stop();panel='';note=null;if(M.defeated(s)){impact('core',M.core,0,850);notify('AXIOM 정지','victory');}render();}
      if(events.some(e=>e.kind==='hit'||e.kind==='player-hit')){commit();refreshHUD();}
      refreshScene();
    }
    function act(a){
      if(dead)return;
      if(a==='next'){if(M.advance(s)){commit();render();}return;}
      if(a==='deploy'){if(s.phase==='ready')openRules(true);return;}
      if(a==='rules'){openRules(s.phase==='ready');return;}
      if(a==='rules-close'){closeRules();return;}
      if(a==='begin'){if(rulesMode!=='start')return;closeRules();if(M.deploy(s)){phase=s.phase;blurred=false;panel='';note=null;resetEffects();placePlayer();onFocus?.('combat');commit();render();input.focus({preventScroll:true});}return;}
      if(a==='close-panel'){panel='';note=null;stop();render();return;}
      if(a==='focus'){onFocus?.('combat');return;}
      if(['terminal','case','robot','door'].includes(a)){stop();panel=a;onFocus?.(a==='terminal'?'records':a);render();return;}
      if(a==='memory'){if(M.readMemory(s,memory)){commit();note=['student','중앙의 둥근 불빛이 공격 장치구나.'];render();}return;}
      if(a==='battery'){if(M.useBattery(s)){commit();refreshHUD();refreshScene();}return;}
      if(a==='retry'){if(M.retry(s)){phase=s.phase;note=null;resetEffects();placePlayer();commit();render();openRules(true);}return;}
      if(a==='take'){if(M.takeCard(s)){phase=s.phase;panel='';note=['student','해제 카드를 찾았어. 이제 B-0에게 가자.'];commit();render();}return;}
      if(a==='release'){if(M.release(s)){phase=s.phase;panel='';note=null;commit();onReleased?.();render();}return;}
      if(a==='leave'){if(s.released)onLeave?.();else act('door');return;}
      if(a==='hint'){note=['robot',s.released?'문이 열렸어요. 같이 나가요.':s.cardTaken?'가슴 슬롯에 해제 카드를 넣어 주세요.':M.defeated(s)?'이제 보관함에서 카드를 꺼낼 수 있어요.':'좌우로 피하면서 액시엄 중앙을 노리세요. 반사판은 자동으로 쏴요.'];render();}
    }
    function click(e){const target=e.target.closest('[data-bb]');if(target){e.preventDefault();act(target.dataset.bb);}}
    function pointerPosition(e){
      const rect=stage.getBoundingClientRect(),view=readView?.();if(!view||e.clientX<rect.left||e.clientX>rect.left+view.width||e.clientY<rect.top||e.clientY>rect.top+view.height)return null;
      const projected=M.project(view,s.player);if(!projected)return null;
      return M.screenToArena(view,e.clientX-rect.left,projected.y);
    }
    function down(e){if(s.phase!=='fight'||paused()||e.button>0||(pointer!==null&&pointer!==e.pointerId)||e.target.closest('button,dialog,input,select'))return;const p=pointerPosition(e);if(!p)return;e.preventDefault();pointer=e.pointerId;blurred=false;input.setPointerCapture?.(pointer);input.focus({preventScroll:true});movePlayer(p.x);}
    function move(e){if(s.phase!=='fight'||paused()||(e.pointerType&&e.pointerType!=='mouse'&&pointer!==e.pointerId))return;const p=pointerPosition(e);if(p){if(pointer===e.pointerId)e.preventDefault();movePlayer(p.x);}}
    function up(e){if(pointer!==e.pointerId)return;if(input.hasPointerCapture?.(pointer))input.releasePointerCapture(pointer);pointer=null;commit();}
    function keydown(e){if(s.phase!=='fight'||paused()||e.target.closest('input,select,dialog'))return;if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)){e.preventDefault();keys.add(e.key);}if(e.key==='b'||e.key==='B'){e.preventDefault();if(!e.repeat)act('battery');}if(e.code==='Space'||e.key===' ')e.preventDefault();}
    function keyup(e){keys.delete(e.key);}
    function blur(){stop();blurred=true;refreshHUD();}
    function focus(){blurred=false;previous=0;refreshHUD();}
    function loop(t){
      if(dead)return;const dt=previous?Math.min(100,t-previous):0;previous=t;
      if(paused()){stop();frame=requestAnimationFrame(loop);return;}
      if(s.phase==='fight'){const left=keys.has('ArrowLeft')||keys.has('a')||keys.has('A'),right=keys.has('ArrowRight')||keys.has('d')||keys.has('D');if(left!==right)movePlayer(s.player.x+(right?1:-1)*220*dt/1000);}
      visualTime+=dt;afterEvents(M.tick(s,dt));
      if(s.phase==='fight'&&t-lastSave>1500){lastSave=t;commit();}frame=requestAnimationFrame(loop);
    }
    function select(id){if(s.phase==='fight')return;act(({records:'terminal',console:'terminal',screen:'focus',robot:'robot',door:'door',handle:'door',high:'door'})[id]||'focus');}
    function dispose(){
      if(dead)return;dead=true;cancelAnimationFrame(frame);stop();resetEffects();
      app.removeEventListener('click',click);app.removeEventListener('pointerdown',down);app.removeEventListener('keydown',keydown);
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);
      rules.removeEventListener('cancel',cancelRules);if(rules.open)rules.close();rules.remove();space.remove();light.remove();cardCase.remove();input.remove();feedback.remove();app.querySelector('.c4-combat-hud')?.remove();app.querySelector('.c4-acquired-card')?.remove();app.querySelector('.c4-battery-control')?.remove();delete game.dataset.shooter;
    }
    app.addEventListener('click',click);app.addEventListener('pointerdown',down);app.addEventListener('keydown',keydown);
    window.addEventListener('pointermove',move,{passive:false});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);window.addEventListener('focus',focus);
    rules.addEventListener('cancel',cancelRules);placePlayer();render();frame=requestAnimationFrame(loop);return {dispose,act,select,stop,isFighting:()=>s.phase==='fight'};
  };
})();
