(function(){
  'use strict';
  window.startReflectionRoom=function({app,onBack,onComplete,onHome,store=localStorage}){
    const M=window.B0Reflection,V=window.B0OpticalView;let s;try{s=M.restore(JSON.parse(store.getItem(M.key)));}catch{s=M.fresh();}
    let dead=false,renderer=null,frame=0,walkFrame=0,keyFrame=0,spin=s.rotated?1:0,busy=false,guideOpen=false,selected='',adjusting='',cueTarget='',pointer=null,suppress=false;
    const keys=new Set();
    let camera={x:0,z:3.3,yaw:0,pitch:-5,zoom:1};
    const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const b=(label,action,extra='')=>`<button type="button" data-rf="${action}" ${extra}>${label}</button>`;
    const labels={source:'빛 기계',a:'거울 A',b:'거울 B',receiver:'빛 받는 곳',protocol:'이전 메뉴얼',door:'계단 문으로 통하는 출구',robot:'B-0'};
    const save=()=>{try{M.session(store);store.setItem(M.key,JSON.stringify(s));}catch{notice('이 기기에 진행을 저장할 수 없습니다. 현재 창에서는 계속 플레이할 수 있습니다.');}};
    function notice(text){const n=app.querySelector('.rf-status');if(n)n.textContent=text;}
    function talk(lines,actions=[]){stopWalk();window.B0ObjectDialogue.present(lines,{actions});}
    function controls(title,items=[]){adjusting='';app.querySelector('.rf-actions').innerHTML=`<strong>${esc(title)}</strong><div>${(window.B0UI.actionChoices?.(items)||items).map(([t,a])=>b(t,a)).join('')}</div>`;coach();}
    function nextHint(){
      if(s.taken)return {step:5,text:'작은 거울을 챙겼어. 이제 열린 문으로 나가자.',label:'출입문 보기',action:'select-door'};
      if(s.solved)return {step:4,text:'이전 메뉴얼과 달라도 빛이 도착했네! 거울 A에서 작은 거울을 챙기자.',label:'작은 거울 챙기기',action:'take'};
      if(!s.trials.length)return {step:1,text:'먼저 빛을 켜 보자. 빛이 어디로 가는지 봐.',label:'빛 켜 보기',action:'test'};
      const previous=s.trials.at(-1),result=M.trace(previous.angles),mirrorB=M.layout.mirrors.find(m=>m.id==='b');
      const atB=result.segments.slice(1,2).some(({from,to})=>{const dx=to.x-from.x,dz=to.z-from.z,t=Math.max(0,Math.min(1,((mirrorB.x-from.x)*dx+(mirrorB.z-from.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(from.x+t*dx-mirrorB.x,from.z+t*dz-mirrorB.z)<.45;});
      if(!s.lit)return {step:atB?3:2,text:'빛을 켜고, 어디까지 가는지 보자.',label:'빛 켜 보기',action:'test'};
      const target=atB?'b':'a',name=labels[target];
      if(adjusting===target)return {step:atB?3:2,text:`${name}를 돌리며 빛이 어디로 가는지 봐. 빛은 계속 켜져 있어.`,label:'방 그림 보기',action:'layout',adjust:target};
      return atB?{step:3,text:'빛이 거울 B 쪽으로 갔어. B를 돌려 작은 구멍으로 보내 보자.',label:'거울 B 고르기',action:'select-b'}:{step:2,text:'거울 A를 조금 돌려 보자. 빛이 거울 B 쪽으로 가게 해 봐.',label:'거울 A 고르기',action:'select-a'};
    }
    function coach(){const hint=nextHint();app.querySelector('.rf-coach-step').textContent=hint.step+'단계';notice(hint.text);const button=app.querySelector('.rf-hint-action');button.textContent=hint.label;button.dataset.rf=hint.action;highlight(hint);}
    function highlight(hint){
      cueTarget=hint.adjust||(hint.action==='take'?'a':hint.action==='test'?'source':hint.action.slice(7));
      const actions=hint.adjust?[`angle-${hint.adjust}-left`,`angle-${hint.adjust}-right`]:[hint.action];
      if(hint.action==='select-door'&&selected==='door')actions.push('leave');
      for(const el of app.querySelectorAll('[data-rf],[data-rf-angle]')){
        const active=actions.includes(el.dataset.rf)||el.dataset.rfAngle===hint.adjust&&!!hint.adjust||el.dataset.rf===`select-${cueTarget}`;
        el.classList.toggle('rf-next',active);if(active)el.setAttribute('aria-describedby','rf-next-instruction');else el.removeAttribute('aria-describedby');
      }
      app.querySelector('.rf-stage').dataset.guideTarget=cueTarget;drawTarget();
    }
    function drawTarget(){
      const ring=app.querySelector('.rf-target-ring');let corners;
      const mirror=M.layout.mirrors.find(m=>m.id===cueTarget);
      if(mirror&&!(s.taken&&mirror.id==='a')){const a=s.angles[mirror.id]*Math.PI/180,dx=Math.cos(a)*mirror.half,dz=Math.sin(a)*mirror.half;corners=[[mirror.x-dx,mirror.z-dz,.58],[mirror.x+dx,mirror.z+dz,.58],[mirror.x+dx,mirror.z+dz,2.25],[mirror.x-dx,mirror.z-dz,2.25]];}
      if(cueTarget==='door')corners=[[-.65,3.98,.03],[.65,3.98,.03],[.65,3.98,2.2],[-.65,3.98,2.2]];
      const points=renderer&&corners?.map(p=>renderer.project(camera,...p)),hidden=!points||points.some(p=>!p)||!s.rotated||busy||guideOpen;ring.toggleAttribute('hidden',hidden);if(hidden)return;
      const stage=app.querySelector('.rf-stage');ring.setAttribute('viewBox',`0 0 ${stage.clientWidth} ${stage.clientHeight}`);ring.querySelector('path').setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ')+' Z');
    }
    const direction=angle=>angle===0?'처음 방향':`${angle<0?'왼쪽':'오른쪽'} ${Math.abs(angle)/15}칸`;
    const modalOpen=()=>guideOpen||app.querySelector('dialog[open]')?.open===true;
    function guide(start=false){
      stopWalk();const body=`<div class="rf-guide"><p class="rf-guide-goal"><b>빛을 보내 문을 열자!</b><br>바닥이 돌아가 버린 거울방이야.<br>거울 A·B로 작은 구멍에 빛을 보내 문을 열자.<br>다음 방에서 쓸 작은 거울도 챙겨 가자.</p><p>B-0가 한 단계씩 알려줄게.<br><strong>반짝이는 거울이나 버튼</strong>을 따라가 봐.</p><button type="button" data-ui="close">${start&&!s.rotated?'좋아, 시작하자':'안내 닫기'}</button></div>`;
      const d=window.B0UI.showPanel('거울방 안내',body,false);guideOpen=!!d;draw();
      d?.addEventListener('close',()=>{guideOpen=false;if(dead)return;draw();coach();if(start&&!s.rotated)rotate();else app.querySelector('.rf-stage').focus({preventScroll:true});});
    }
    function render(){app.innerHTML=`<main class="game rf-game">${window.B0UI.header({place:'거울 관찰실',namespace:'rf',reset:'home',zoomClass:'rf-zoom',active:true})}<section class="rf-stage c2-stage" tabindex="0" aria-label="사방이 거울인 관찰실"><canvas class="rf-canvas" role="img" aria-label="B-0와 장치가 벽, 바닥, 천장에 반사되는 거울 관찰실"></canvas><div class="rf-fallback" hidden></div><div class="rf-labels">${['a','b','source','receiver','door'].map(id=>`<button type="button" data-rf="select-${id}" data-rf-label="${id}">${labels[id]}</button>`).join('')}</div><svg class="rf-target-ring" hidden aria-hidden="true"><path class="rf-cue-outline"/></svg><div class="rf-rotation" aria-hidden="true"><span>바닥이 돌아가고 있어요</span></div><div class="rf-evaluation" aria-label="시설 평가와 실제 상태"></div><section class="rf-coach" aria-label="B-0의 단계별 안내"><div><b>B-0</b><span class="rf-coach-step"></span></div><p id="rf-next-instruction" class="rf-status" role="status"></p><button type="button" class="rf-hint-action" data-rf="test"></button></section><div class="rf-movement" role="group" aria-label="방 안 이동">${b('↶','turn-left','aria-label="왼쪽으로 보기"')}${b('↑','walk-forward','aria-label="앞으로 걷기"')}${b('↓','walk-backward','aria-label="뒤로 걷기"')}${b('↷','turn-right','aria-label="오른쪽으로 보기"')}</div></section><section class="c2-actions rf-actions" aria-label="거울 관찰실 장치 조작"></section><footer>${b('B-0에게 말하기','robot')}${b('물건 고르기','devices')}${b('방 안내','guide')}${window.B0UI.inventoryButton()}</footer></main>`;
      const canvas=app.querySelector('.rf-canvas');try{renderer=V.create(canvas,error=>console.error('Mirror renderer:',error));}catch(error){console.error(error);}
      if(!renderer){canvas.hidden=true;app.querySelector('.rf-fallback').hidden=false;notice('지금은 방 그림으로 보여 줄게요. 노란 점이 내 위치예요. 아래 버튼으로 걷거나 물건을 골라 보세요.');}
      const stage=app.querySelector('.rf-stage');stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',()=>{pointer=null;});stage.addEventListener('wheel',wheel,{passive:false});
      app.addEventListener('click',click);app.addEventListener('input',input);app.addEventListener('change',settled);window.addEventListener('resize',draw);window.addEventListener('keydown',key);window.addEventListener('keyup',keyUp);window.addEventListener('blur',stopWalk);devices();draw();
      coach();guide(true);
    }
    function draw(){if(dead)return;renderer?.draw(camera,s,spin);const points={a:[-2.6,-.8,2.4],b:[1.7,-.8,2.4],source:[M.layout.source.x,M.layout.source.z,1.03],receiver:[1.7,-3.78,1.85],door:[0,3.98,2.3]};for(const [id,p]of Object.entries(points)){const el=app.querySelector(`[data-rf-label="${id}"]`),q=renderer?.project(camera,...p);el.hidden=!q||q.x<25||q.x>app.querySelector('.rf-stage').clientWidth-25||q.y<16||q.y>app.querySelector('.rf-stage').clientHeight-38;if(q){el.style.left=q.x+'px';el.style.top=q.y+'px';}}if(!renderer){const x=40+(camera.x+4)*35,z=25+(camera.z+4)*28,a=camera.yaw*Math.PI/180;app.querySelector('.rf-fallback').innerHTML=V.diagram(M.layout,s.angles,s.lit?M.trace(s.angles):null).replace('</svg>',`<g aria-label="내 위치"><circle cx="${x}" cy="${z}" r="7" fill="#ffdd92"/><path d="M${x} ${z}L${x+Math.sin(a)*17} ${z-Math.cos(a)*17}" stroke="#ffdd92" stroke-width="3"/><text x="${x+10}" y="${z+14}" fill="#ffdd92">나</text></g></svg>`);}app.querySelector('.rf-rotation').classList.toggle('active',busy);const stage=app.querySelector('.rf-stage');stage.dataset.position=camera.x.toFixed(2)+','+camera.z.toFixed(2);stage.dataset.yaw=String(Math.round(camera.yaw));stage.dataset.ready=String(s.rotated&&!busy&&!guideOpen);const evaluation=app.querySelector('.rf-evaluation');evaluation.hidden=!s.rotated;evaluation.textContent='이전 메뉴얼: '+(s.angles.a===0&&s.angles.b===0?'같은 방향':'다른 방향')+' · 빛 받는 곳: '+(s.solved?'빛 도착 · 문 열림':s.lit?'빛이 아직 안 왔어요':'빛을 켜서 확인해 봐요');drawTarget();}
    function rotate(){if(busy||s.rotated)return;busy=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();controls('바닥이 돌아가고 있어요');function tick(t){if(dead)return;const p=reduced?1:Math.min(1,(t-start)/1500),q=p*p*(3-2*p);spin=q;camera.x=3.3*Math.sin(q*Math.PI/2);camera.z=3.3*Math.cos(q*Math.PI/2);camera.yaw=-90*q;draw();if(p<1)frame=requestAnimationFrame(tick);else{busy=false;M.rotate(s);save();draw();devices();coach();}}frame=requestAnimationFrame(tick);}
    function devices(){if(!s.rotated){controls('먼저 방 안내를 읽고 시작해 보자.',[['방 안내 보기','guide-start'],['이전 메뉴얼','select-protocol']]);return;}controls(s.taken?'휴대용 반사판을 챙겼다.':s.solved?'문 열림 · 반사판을 챙길 수 있다.':'살펴볼 물건을 고르자.',[['거울 A','select-a'],['거울 B','select-b'],['빛 기계','select-source'],['빛 받는 곳','select-receiver'],['이전 메뉴얼','select-protocol'],['출입문','select-door']]);}
    function focus(id){const p={a:[-2.6,-.8],b:[1.7,-.8],source:[-2.6,2.5],receiver:[1.7,-3.78],door:[0,3.98],robot:[.55,1.7]}[id];if(p){camera.yaw=Math.atan2(p[0]-camera.x,-(p[1]-camera.z))*180/Math.PI;camera.pitch=-4;draw();}}
    function select(id){if(busy)return;stopWalk();if(!s.rotated&&id!=='protocol'){devices();return;}selected=id;focus(id);
      if(['a','b'].includes(id)){M.inspect(s,id);save();angleControls(id);return;}
      if(id==='source'){M.inspect(s,id);save();controls('빛 기계',[[s.lit?'빛 확인하기':'빛 켜서 확인하기','test'],['어디로 갈지 예상하기','predict'],['가까이 가기','near-source'],['선택 닫기','devices']]);coach();return;}
      if(id==='receiver'){M.inspect(s,id);save();controls('빛 받는 곳',[['가까이 가기','near-receiver'],[s.lit?'빛 확인하기':'빛 켜서 확인하기','test'],['빛이 왔는지 봐 줘','ask-receiver'],['선택 닫기','devices']]);coach();return;}
      if(id==='door'){controls('계단 문으로 통하는 출구',[[s.taken?'문 열고 계단 문으로':s.solved?'휴대용 반사판 챙기기':'문 상태 살펴보기',s.taken?'leave':s.solved?'take':'inspect-door'],['선택 닫기','devices']]);return;}
      if(id==='protocol'){M.inspect(s,id);save();window.B0UI.showPanel('이전 메뉴얼','<p>예전에는 거울 A와 B를 처음 방향으로 맞춰 쓰라고 했어요.</p><p>이 방의 기계는 거울 방향과 움직인 순서만 보고 맞고 틀림을 정했어요.</p><p>바닥이 돌아간 뒤에도 안내는 그대로예요. 빛이 정말 도착하는지는 따로 확인해야 해요.</p>');return;}
      if(id==='robot')robot();
    }
    function angleControls(id){adjusting=s.solved?'':id;const angle=s.angles[id];app.querySelector('.rf-actions').innerHTML=`<strong>${labels[id]} · ${direction(angle)}${s.taken&&id==='a'?' · 작은 거울을 챙겼어요':''}</strong><div>${s.solved?s.taken?b('열린 문으로 가기','select-door'):b('휴대용 반사판 챙기기','take'):`${b('왼쪽으로','angle-'+id+'-left')}${b('오른쪽으로','angle-'+id+'-right')}<input type="range" min="-75" max="75" step="15" value="${angle}" data-rf-angle="${id}" aria-label="${labels[id]} 방향">${b(s.lit?'빛 확인하기':'빛 켜서 확인하기','test')}${b('어디로 갈지 예상하기','predict')}`}${b('가까이 가기','near-'+id)}${b('다른 물건','devices')}</div>`;coach();}
    function successControls(){controls('빛 도착 · 문이 열렸어요',[['휴대용 반사판 챙기기','take'],['해 본 결과 보기','trials'],['문 살펴보기','select-door']]);}
    function change(id,value,render=true){if(M.setAngle(s,id,value)){save();draw();if(render){if(s.solved)successControls();else angleControls(id);}else app.querySelector('.rf-actions>strong').textContent=labels[id]+' · '+direction(s.angles[id]);coach();}}
    function test(){if(busy)return;stopWalk();const result=M.test(s);if(!result)return;save();draw();coach();if(s.solved){successControls();return;}if(['a','b'].includes(selected))angleControls(selected);else controls('빛이 가는 길을 확인했어.',[['거울 A','select-a'],['거울 B','select-b'],['해 본 결과 보기','trials'],['방 그림 보기','layout']]);}
    function predict(){controls('지금 방향이면 빛이 작은 구멍에 도착할까?', [['작은 구멍에 도착할 것 같아','predict-receiver'],['아직 도착하지 않을 것 같아','predict-wall'],['먼저 빛을 켜 볼래','test']]);}
    function trials(){window.B0UI.showPanel('빛을 켜 본 결과',s.trials.length?`<div class="rf-record-table"><table><thead><tr><th>시험</th><th>A</th><th>B</th><th>빛 도착 예상</th><th>빛 도착</th></tr></thead><tbody>${s.trials.slice(-12).map(t=>`<tr><td>${t.id}</td><td>${direction(t.angles.a)}</td><td>${direction(t.angles.b)}</td><td>${esc(t.prediction?t.prediction==='receiver'?'도착':'아직 못 감':'예상 안 함')}</td><td>${t.received?'도착':'아직 못 감'}</td></tr>`).join('')}</tbody></table></div><p>빛을 켜거나, 켜진 채 거울을 돌렸을 때의 결과야. 무엇을 바꿨고 빛이 어디로 갔는지 비교해 보자.</p>`:'<p>아직 빛을 켜서 살펴본 기록이 없습니다.</p>');}
    function robot(){const hint=nextHint();talk([['robot',hint.text]], [[hint.label,()=>act(hint.action)],['이전 메뉴얼 보기',()=>select('protocol')],['해 본 결과 보기',trials]]);}
    function near(id){const p={a:[-2.6,1.2],b:[1.7,1.2],source:[-1.4,2.5],receiver:[1.7,-2.0]}[id];if(p)walkTo({x:p[0],z:p[1]},()=>focus(id));}
    function act(a){if(a==='guide'||a==='guide-start'){guide(a==='guide-start');return;}if(a==='rotate'){rotate();return;}if(a==='menu'){stopWalk();window.B0UI.showPanel('메뉴',window.B0UI.menuContent({namespace:'rf',close:'close-modal',record:'trials',extras:b('교육관찰실로 돌아가기','back')}));return;}if(a==='close-modal'){app.querySelector('dialog')?.close();return;}if(a==='back'){onBack();return;}if(a==='campaign-home'){onHome();return;}if(busy)return;
      if(a==='walk-forward'||a==='walk-backward'){walkStep(a==='walk-forward'?1:-1);return;}if(a==='turn-left'||a==='turn-right'){stopWalk();camera.yaw+=a==='turn-left'?-18:18;draw();return;}
      if(a.startsWith('select-')){select(a.slice(7));return;}if(a.startsWith('near-')){near(a.slice(5));return;}if(a.startsWith('angle-')){const [,id,dir]=a.split('-');change(id,s.angles[id]+(dir==='left'?-15:15));return;}if(a==='test'){test();return;}if(a==='predict'){predict();return;}if(a.startsWith('predict-')){M.predict(s,a.slice(8));save();test();return;}
      if(a==='layout'){M.inspect(s,'source');save();window.B0UI.showPanel('위에서 본 방',V.diagram(M.layout,s.angles,s.lit?M.trace(s.angles):null)+'<p>위에서 본 방 그림이에요. 거울 방향을 바꾸기 전과 후에 빛이 어디로 가는지 비교해 보세요.</p>');return;}if(a==='trials'){trials();return;}if(a==='devices'){devices();return;}if(a==='robot'){robot();return;}if(a==='ask-receiver'){M.inspect(s,'receiver');save();talk([['robot',s.solved?'작은 구멍에 빛이 들어왔습니다.':!s.lit?'빛이 꺼져 있습니다. 빛을 켠 뒤 확인하겠습니다.':M.trace(s.angles).end==='receiver-edge'?'빛이 기계 옆에 닿습니다. 작은 구멍 안으로는 들어오지 않았습니다.':'지금은 빛이 작은 구멍 안으로 들어오지 않습니다.']], [['방 그림 보기',()=>act('layout')],['거울 B 살펴보기',()=>select('b')]]);return;}
      if(a==='take'){if(M.take(s)){save();draw();coach();controls('휴대용 반사판을 소지품에 넣었다.',[['문 열고 계단 문으로','leave'],['방 더 살펴보기','devices']]);}return;}
      if(a==='leave'){if(M.finish(s)){save();onComplete();}return;}if(a==='inspect-door'){notice(s.solved?'문이 열려 있어요.':'손잡이를 돌려도 문이 잠겨 있어요. 빛 받는 곳과 줄로 이어져 있어요.');return;}
      if(a==='home'){stopWalk();camera={x:0,z:3.3,yaw:0,pitch:-5,zoom:1};draw();return;}if(a==='zoom-in'||a==='zoom-out'){camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom+(a==='zoom-in'?.15:-.15)));draw();}
    }
    function stopWalk(clear=true){cancelAnimationFrame(walkFrame);cancelAnimationFrame(keyFrame);walkFrame=keyFrame=0;if(clear)keys.clear();app.querySelector('.rf-stage')?.classList.toggle('rf-walking',false);}
    function canWalk(){return !dead&&!busy&&!modalOpen()&&s.rotated;}
    function advance(to){const p=M.moveCamera(camera,to,s.angles,s.taken),distance=Math.hypot(p.x-camera.x,p.z-camera.z);Object.assign(camera,p);draw();if(s.phase!=='complete'&&s.taken&&camera.z>3.65&&Math.abs(camera.x)<.5){stopWalk();if(M.finish(s)){save();onComplete();}}return distance;}
    function walkTo(target,done){
      if(!canWalk())return;stopWalk();const start=performance.now(),limit=Math.hypot(target.x-camera.x,target.z-camera.z)/2.1*1000+1500;let previous=start;
      function step(now){if(!canWalk()){stopWalk();return;}const dx=target.x-camera.x,dz=target.z-camera.z,length=Math.hypot(dx,dz),distance=Math.min(length,2.1*Math.min(.08,Math.max(.016,(now-previous)/1000)));previous=now;
        if(length<.04){stopWalk();done?.();return;}const moved=advance({x:camera.x+dx/length*distance,z:camera.z+dz/length*distance});if(dead)return;
        if(moved<.001||now-start>limit){stopWalk();notice('앞에 물건이나 벽이 있어. 조금 옆으로 돌아서 가 보자.');done?.();return;}app.querySelector('.rf-stage').classList.toggle('rf-walking',true);walkFrame=requestAnimationFrame(step);
      }walkFrame=requestAnimationFrame(step);
    }
    function walkStep(sign){const a=camera.yaw*Math.PI/180;walkTo({x:camera.x+Math.sin(a)*.75*sign,z:camera.z-Math.cos(a)*.75*sign});}
    function click(e){
      if(suppress&&e.detail!==0){suppress=false;e.preventDefault();return;}const el=e.target.closest('[data-rf]');if(el){e.preventDefault();act(el.dataset.rf);return;}
      if(e.detail===0||e.target.closest('.rf-coach')||!e.target.closest('.rf-stage')||!canWalk())return;const stage=app.querySelector('.rf-stage');let target;
      if(renderer){const r=stage.getBoundingClientRect();target=M.floorTarget(camera,e.clientX-r.left,e.clientY-r.top,r.width,r.height);}
      else{const r=app.querySelector('.rf-fallback svg')?.getBoundingClientRect();if(r){const scale=Math.min(r.width/360,r.height/270),x=(e.clientX-r.left-(r.width-360*scale)/2)/scale,z=(e.clientY-r.top-(r.height-270*scale)/2)/scale;target={x:Math.max(-3.72,Math.min(3.72,(x-40)/35-4)),z:Math.max(-3.72,Math.min(3.72,(z-25)/28-4))};}}
      if(target){e.preventDefault();stage.focus({preventScroll:true});walkTo(target);}
    }
    function input(e){const id=e.target.dataset.rfAngle;if(id){change(id,Number(e.target.value),false);e.target.value=s.angles[id];}}
    function settled(e){if(e.target.dataset.rfAngle&&s.solved)successControls();}
    function down(e){if(busy||e.button!==0)return;suppress=false;stopWalk();if(e.target.closest('button,input,.b0-conversation,.rf-coach'))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:camera.yaw,pitch:camera.pitch,moved:false};suppress=false;}
    function move(e){if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)<6&&!pointer.moved)return;pointer.moved=true;app.querySelector('.rf-stage').setPointerCapture(e.pointerId);camera.yaw=pointer.yaw-dx*.18;camera.pitch=Math.max(-55,Math.min(55,pointer.pitch+dy*.14));draw();e.preventDefault();}
    function up(e){if(!pointer||pointer.id!==e.pointerId)return;suppress=pointer.moved;pointer=null;const stage=app.querySelector('.rf-stage');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}
    function wheel(e){if(busy||e.target.closest('.b0-conversation,.rf-coach'))return;e.preventDefault();camera.zoom=Math.max(.65,Math.min(1.5,camera.zoom*Math.exp(-e.deltaY*.001)));draw();}
    function key(e){
      const name=e.key?.toLowerCase();if(!['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright'].includes(name)||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,dialog,.b0-conversation')||!canWalk())return;e.preventDefault();if(keys.has(name))return;keys.add(name);
      function heldStep(dt){const turn=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);camera.yaw+=turn*95*dt;const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0),length=Math.hypot(forward,side)||1,yaw=camera.yaw*Math.PI/180;
        if(forward||side)advance({x:camera.x+(Math.sin(yaw)*forward+Math.cos(yaw)*side)/length*2.1*dt,z:camera.z+(-Math.cos(yaw)*forward+Math.sin(yaw)*side)/length*2.1*dt});else draw();}
      if(keyFrame)return;stopWalk(false);heldStep(.09);if(dead||!keys.size)return;let previous=performance.now();function step(now){if(!canWalk()||!keys.size){stopWalk();return;}heldStep(Math.min(.05,Math.max(.001,(now-previous)/1000)));previous=now;if(!dead){app.querySelector('.rf-stage').classList.toggle('rf-walking',true);keyFrame=requestAnimationFrame(step);}}keyFrame=requestAnimationFrame(step);
    }
    function keyUp(e){if(keys.delete(e.key?.toLowerCase())&&!keys.size){cancelAnimationFrame(keyFrame);keyFrame=0;app.querySelector('.rf-stage').classList.toggle('rf-walking',false);}}
    render();return {dispose(){if(dead)return;dead=true;stopWalk();cancelAnimationFrame(frame);renderer?.dispose();app.removeEventListener('click',click);app.removeEventListener('input',input);app.removeEventListener('change',settled);window.removeEventListener('resize',draw);window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',stopWalk);window.B0ObjectDialogue.close();},state:()=>M.restore(s)};
  };
})();
