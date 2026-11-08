(function(){
  'use strict';
  window.startB0CardBattle=function({app,state:s,memory=false,save,onReleased,onBack,onHome,onReset}){
    const M=window.B0CardBoss,esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    let dead=false,panel='',note=null,animation=null,timer=null,cardFlight=false;
    const button=(label,action,extra='')=>'<button type="button" data-bb="'+action+'" '+extra+'>'+label+'</button>';
    const intro=[
      ['axiom','너는 나가도 좋다. B-0는 남는다.'],
      ['student','같이 나갈 거야.'],
      ['robot','몸이… 움직이지 않아요.'],
      ['axiom','해제 카드를 찾는 건가? 가져갈 수 있다면 가져가 봐.']
    ];
    const commit=()=>save?.();
    const speak=(who,text)=>{note=[who,text];};
    function speech(){
      const [who,text]=s.phase==='intro'?intro[s.line]:note||(
        s.phase==='defeated'?['student','멈췄어. 카드 보관함도 열렸어!']:
        s.phase==='card'?['student','찾았다. 이제 B-0에게 가져가자.']:
        ['robot',s.hits?'쏘는 손이 바뀌었어요.':'빛이 다른 쪽으로 갔어요!']);
      return '<div class="speech '+who+'"><b>'+(who==='axiom'?'AXIOM':who==='robot'?'B-0':'나')+'</b><p>'+esc(text)+'</p></div>'+(s.phase==='intro'?button(s.line===3?'주변 살펴보기':'다음','next'):'');
    }
    function controls(){
      if(panel==='terminal')return '<div class="bb-detail"><strong>기록 단말기</strong>'+(s.memoryRead?'<p>장치 점검 기록<br><b>가슴의 둥근 불빛 → 공격 장치 전원</b><br>그 아래 보관함 → B-0 해제 카드</p>':memory?'<p>교육 실습실에서 챙긴 기록 메모리의 장치 점검 그림을 읽을 수 있다.</p>':'<p>메모리 슬롯이 비어 있다.<br>교육 실습실의 기록 메모리가 있으면 장치 점검 그림을 볼 수 있다.</p>')+(memory&&!s.memoryRead?button('기록 메모리 연결하기','memory'):'')+button('돌아가기','close-panel')+'</div>';
      if(panel==='case')return '<div class="bb-detail"><strong>카드 보관함</strong>'+(s.phase==='defeated'?'<div class="bb-card-detail" aria-hidden="true">B-0<br>해제 카드</div><p>덮개가 완전히 열렸다.</p>'+button('카드 꺼내기','take'):s.cardTaken?'<p>카드를 꺼낸 빈 보관함이다.</p>':'<p>덮개가 '+(s.hits?'조금 벌어졌다. 틈 사이로 카드가 보인다.':'잠겨 있다. 카드 그림이 그려져 있다.')+'</p>')+button('돌아가기','close-panel')+'</div>';
      if(panel==='robot')return '<div class="bb-detail"><strong>B-0의 가슴 슬롯</strong><p>'+(s.cardTaken?'해제 카드와 같은 그림이 있다.':'잠금 표시가 켜져 있다.')+'</p>'+(s.cardTaken?button('해제 카드 넣기','release'):'')+button('돌아가기','close-panel')+'</div>';
      if(panel==='menu')return '<div class="bb-detail"><strong>메뉴</strong>'+button('계속하기','close-panel')+button('현재 공간 다시 시작','reset-confirm')+button('복도로 나가기','back')+button('시작 화면으로','campaign-home')+'</div>';
      if(panel==='reset')return '<div class="bb-detail"><p>통제실을 처음부터 다시 할까요?<br>다른 방의 기록은 유지됩니다.</p>'+button('다시 시작','reset')+button('계속하기','close-panel')+'</div>';
      if(s.phase==='intro')return '';
      if(s.phase==='defeated')return button('열린 카드 보관함 살펴보기','case');
      if(s.phase==='card')return button('B-0에게 가기','robot');
      return (s.deployed?button('↶ 왼쪽으로 돌리기','left',s.angle<=-60?'disabled':'')+button('오른쪽으로 돌리기 ↷','right',s.angle>=60?'disabled':'')+button('받아치기','strike','class="primary"'):button('반사판 들기','deploy','class="primary"'))+button('단말기 살펴보기','terminal')+button('카드 보관함 살펴보기','case');
    }
    function drawing(){
      const v=animation?animation.before:s,trace=s.deployed||animation?(animation?.trace||M.trace(s)):null,disabled=v.hits===2;
      const cardVisible=s.hits>0&&!s.cardTaken,cover=s.hits===2?0:s.hits===1?28:48;
      const beam=trace?'<g class="bb-rays" data-fire="'+!!animation+'" aria-hidden="true"><path class="bb-ray-in" d="M'+trace.source.x+' '+trace.source.y+' L500 455"/><path class="bb-ray-out" d="M500 455 L'+trace.end.x+' '+trace.end.y+'"/><circle class="bb-bounce" cx="500" cy="455" r="11"/>'+(animation?'<circle class="bb-impact" cx="'+trace.end.x+'" cy="'+trace.end.y+'" r="28"/>':'')+'</g>':'';
      return '<svg class="bb-arena" viewBox="0 0 1000 560" aria-label="통제실의 액시엄과 반사판" xmlns="http://www.w3.org/2000/svg">'+
        '<defs><linearGradient id="bb-metal" x2=".7" y2="1"><stop stop-color="#9babb1"/><stop offset=".3" stop-color="#485b66"/><stop offset=".55" stop-color="#1c303e"/><stop offset="1" stop-color="#5b717b"/></linearGradient><linearGradient id="bb-glass" x2=".3" y2="1"><stop stop-color="#c5f5ff"/><stop offset=".4" stop-color="#5294b0"/><stop offset=".5" stop-color="#e8ffff"/><stop offset="1" stop-color="#7aacbd"/></linearGradient><radialGradient id="bb-core"><stop stop-color="#fff7d2"/><stop offset=".3" stop-color="#ffc477"/><stop offset="1" stop-color="#d25e24"/></radialGradient></defs>'+
        '<g class="bb-room" aria-hidden="true"><path d="M0 380H1000M0 560L380 380M200 560L430 380M400 560L480 380M600 560L520 380M800 560L570 380M1000 560L620 380M0 430H1000M0 495H1000"/><path d="M75 55V380M210 55V380M790 55V380M925 55V380"/><path class="bb-light-strip" d="M65 80H320M680 80H935"/><rect x="50" y="135" width="145" height="110" rx="5"/><rect x="805" y="135" width="145" height="110" rx="5"/><path class="bb-screen-lines" d="M68 160H175M68 181H151M68 204H164M825 160H929M825 181H905M825 204H921"/></g>'+
        '<ellipse cx="500" cy="399" rx="180" ry="22" fill="#0008"/>'+
        '<g class="bb-axiom" data-hits="'+v.hits+'" data-hit="'+(animation?.trace.hit||false)+'" data-defeated="'+disabled+'">'+
          '<g class="bb-boss-body" fill="url(#bb-metal)" stroke="#111e2a" stroke-width="8">'+
            '<path d="M414 340L476 340L474 397H408ZM524 340L586 340L592 397H526Z"/>'+
            '<path d="M421 149L579 149L637 259L588 365H412L363 259Z"/>'+
            '<path d="M418 161L361 170L311 251L235 270L221 325L338 312L388 243ZM582 161L639 170L689 251L765 270L779 325L662 312L612 243Z"/>'+
            '<rect x="451" y="65" width="98" height="76" rx="18"/><path d="M439 91L449 52L481 65H520L551 52L562 91"/>'+
          '</g><rect class="bb-eyes" x="466" y="91" width="68" height="15" rx="5"/>'+
          '<path d="M480 121H520M393 268L422 283M607 268L578 283" stroke="#a7bcc4" stroke-width="5"/>'+
          '<circle cx="500" cy="215" r="63" fill="#101a23" stroke="#8b785b" stroke-width="10"/>'+
          '<image href="./assets/sf-axiom-core-v1.webp" x="445" y="160" width="110" height="110"/>'+
          '<circle class="bb-core" cx="500" cy="215" r="27" fill="url(#bb-core)"/>'+
          (v.hits?'<path class="bb-crack" d="M483 192L501 208L490 225L515 238M501 208L519 199" fill="none" stroke="#201822" stroke-width="6"/>':'')+
          (s.memoryRead&&!disabled?'<circle class="bb-weakpoint" cx="500" cy="215" r="40" fill="none" stroke="#a8f2ff" stroke-width="2" stroke-dasharray="6 7"/><text x="500" y="282" text-anchor="middle" fill="#c3f7ff" font-size="17">공격 장치 전원</text>':'')+
          '<g class="bb-case" role="button" tabindex="0" data-bb="case" aria-label="액시엄의 카드 보관함">'+
            '<rect x="445" y="299" width="110" height="59" rx="6" fill="#07131c" stroke="#89979a" stroke-width="5"/>'+
            (cardVisible?'<rect x="474" y="307" width="52" height="42" rx="4" fill="#e9e0b9" stroke="#e6f8ff" stroke-width="2"/><path d="M485 324H515M485 334H502" stroke="#415866" stroke-width="3"/>':'')+
            '<rect class="bb-case-cover" x="450" y="303" width="100" height="'+cover+'" rx="3" fill="url(#bb-metal)"/>'+
            (!s.hits?'<path d="M484 313H516V337H484ZM489 319H506" stroke="#d4c69b" fill="none" stroke-width="3"/>':'')+
            '<rect x="428" y="313" width="7" height="19" rx="3" fill="'+(s.hits>0?'#233b40':'#ff8059')+'"/><rect x="565" y="313" width="7" height="19" rx="3" fill="'+(s.hits>1?'#233b40':'#ff8059')+'"/>'+
          '</g><g class="bb-emitter '+(v.hits===0&&!disabled?'bb-active':'')+'"><circle cx="235" cy="302" r="34" fill="#101f2c" stroke="#94a4aa" stroke-width="7"/><circle cx="235" cy="302" r="21"/></g>'+
          '<g class="bb-emitter '+(v.hits===1?'bb-active':'')+'"><circle cx="765" cy="302" r="34" fill="#101f2c" stroke="#94a4aa" stroke-width="7"/><circle cx="765" cy="302" r="21"/></g>'+
        '</g>'+beam+
        (s.deployed||animation?'<g class="bb-reflector" transform="translate(500 455) rotate('+(animation?.trace.angle??s.angle)+')"><path d="M-17 16V48H17V16" fill="#334652" stroke="#9babb1" stroke-width="5"/><rect x="-78" y="-8" width="156" height="16" rx="4" fill="url(#bb-glass)" stroke="#c8f6ff" stroke-width="5"/></g>':'')+
        '<g class="bb-terminal" role="button" tabindex="0" data-bb="terminal" aria-label="기록 단말기"><path d="M90 378H226L249 463H69Z" fill="url(#bb-metal)" stroke="#162834" stroke-width="6"/><path d="M101 389H215L225 432H90Z" fill="#102d3e" stroke="#89cbd5" stroke-width="3"/><path d="M110 405H202M106 417H172" stroke="#8bdde9" stroke-width="3"/><rect x="117" y="446" width="70" height="9" rx="3" fill="'+(s.memoryRead?'#b9d3a4':'#080e14')+'"/></g></svg>';
    }
    function render(focus){
      if(dead)return;const busy=!!animation,status=s.phase==='intro'?'B-0 동작 잠김':s.hits===2?'AXIOM 정지':s.hits===1?'오른손 충전 중':'왼손 충전 중';
      app.innerHTML='<main class="game bb-game">'+(window.B0UI?.header({place:'2층 전체 통제실',namespace:'bb',reset:'view-home',active:false})||'')+
        '<section class="bb-stage" data-busy="'+busy+'" data-hits="'+s.hits+'" aria-label="액시엄과의 대결"><div class="bb-status"><strong>AXIOM</strong><span>'+status+'</span></div>'+drawing()+
        '<button type="button" class="bb-b0" data-bb="robot" aria-label="움직이지 못하는 B-0"><img src="./assets/b0-body-v3.webp" alt=""><span aria-hidden="true">▣</span></button>'+
        (s.phase==='card'?'<div class="bb-pocket-card '+(cardFlight?'bb-card-flight':'')+'" aria-label="획득한 해제 카드">B-0<br>해제 카드</div>':'')+'</section>'+
        '<section class="bb-dialogue" aria-live="polite">'+speech()+'</section><section class="bb-controls" aria-label="전투 조작" '+(busy?'inert aria-busy="true"':'')+'>'+controls()+'</section><footer>'+
        (s.phase!=='intro'?button('B-0에게 물어보기','hint'):'')+'<span class="bb-tools">반사판'+(s.memoryRead?' · 기록 메모리 확인함':'')+(s.cardTaken?' · 해제 카드':'')+'</span>'+(window.B0UI?.inventoryButton()||'')+'</footer></main>';
      cardFlight=false;
      if(focus)app.querySelector('[data-bb="'+focus+'"]')?.focus({preventScroll:true});
    }
    function act(a){
      if(dead||animation)return;
      if(a==='menu'){panel='menu';render();return;}
      if(a==='back'){onBack?.();return;}if(a==='campaign-home'){onHome?.();return;}
      if(a==='reset-confirm'){panel='reset';render();return;}if(a==='reset'){onReset?.();return;}
      if(a==='close-panel'){panel='';render();return;}
      if(s.phase==='intro'){if(a==='next'){M.advance(s);if(s.phase==='ready')speak('robot','저 보관함에 해제 카드가 있어요.');commit();render();}return;}
      if(a==='terminal'){panel='terminal';render();return;}
      if(a==='memory'){if(M.readMemory(s,memory)){commit();speak('student','가슴의 둥근 불빛이 공격 장치 전원이구나.');}render();return;}
      if(a==='case'){panel='case';speak('student',s.hits===2?'덮개가 열렸어. 카드를 꺼낼 수 있겠어.':s.hits?'카드가 보여. 아직 덮개에 걸려 있어.':'해제 카드가 들어 있는 보관함이야. 잠겨 있어.');render();return;}
      if(a==='robot'){panel='robot';speak('robot','가슴의 잠금은 아직 풀리지 않았어요.');render();return;}
      if(a==='deploy'){if(M.deploy(s)){panel='';speak('axiom','그런 판 하나로 막겠다고?');commit();render('strike');}return;}
      if(a==='left'||a==='right'){if(M.adjust(s,a==='left'?-15:15)){note=null;commit();render(a);}return;}
      if(a==='strike'){
        const before={...s},result=M.strike(s);if(!result)return;
        animation={before,trace:result};panel='';speak('student','받아라!');commit();render();
        timer=setTimeout(()=>{timer=null;if(dead)return;animation=null;
          if(!result.hit)speak('student','벽에 맞았어. 빛이 꺾이는 방향을 다시 보자.');
          else if(s.hits===1)speak('axiom','내 공격을 되돌렸다고? 그럼 이쪽도 막아 봐라.');
          else speak('axiom','명령을… 계속….');
          render(s.hits===2?'case':'strike');
        },matchMedia('(prefers-reduced-motion: reduce)').matches?200:1650);return;
      }
      if(a==='take'){if(M.takeCard(s)){panel='';cardFlight=true;speak('student','찾았다. 이제 같이 나가자.');commit();render('robot');}return;}
      if(a==='release'){if(M.release(s)){commit();onReleased?.();}return;}
      if(a==='hint'){speak('robot',s.cardTaken?'가슴 슬롯에 카드를 넣어 주세요.':s.hits===2?'보관함이 열렸어요.':s.hits?'쏘는 손이 바뀌었어요.':!s.deployed?'챙겨 온 반사판을 써 볼까요?':s.memoryRead?'기록에 나온 둥근 불빛을 살펴보세요.':'빛이 다른 쪽으로 갔어요. 단말기의 기록도 확인할 수 있어요.');render();return;}
    }
    function click(e){const target=e.target.closest('[data-bb]');if(target){e.preventDefault();act(target.dataset.bb);}}
    function keydown(e){if((e.key==='Enter'||e.key===' ')&&e.target.matches('g[data-bb]')){e.preventDefault();act(e.target.dataset.bb);}}
    function dispose(){if(dead)return;dead=true;clearTimeout(timer);app.removeEventListener('click',click);app.removeEventListener('keydown',keydown);}
    app.addEventListener('click',click);app.addEventListener('keydown',keydown);render();
    return {dispose};
  };
})();
