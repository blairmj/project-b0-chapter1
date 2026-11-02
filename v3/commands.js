(function(){
  'use strict';
  const M=window.B0CommandModel;let current=null,dialog=null,running=false;
  const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(){try{return M.restore(JSON.parse(localStorage.getItem(M.key)));}catch{return M.fresh();}}
  function write(s){try{localStorage.setItem(M.key,JSON.stringify(s));}catch{}}
  function close(){const d=dialog;dialog=null;d?.close();d?.remove();}
  function reset(){close();current=null;running=false;}
  const options=list=>'<option value="">직접 선택</option>'+list.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
  function open(target=''){
    if(!current||running)return;close();const owner=current,targets=owner.targets();
    if(!targets.length){owner.feedback('아직 지시할 물건을 함께 확인하지 않았습니다. 눈앞의 물건부터 살펴봐 주세요.');return;}
    const d=document.createElement('dialog');dialog=d;d.className='modal command-modal';
    const notebook=read();
    d.innerHTML=`<div class="modal-header"><h2>B-0에게 지시하기</h2></div><div class="modal-body"><p class="command-context">${esc(owner.context?.()||'어느 물건을 어떻게 할까요?')}</p><label>대상<select name="target" aria-label="지시 대상">${options(targets)}</select></label><label>행동<select name="verb" aria-label="지시 행동">${options(owner.verbs)}</select></label><label class="command-param" hidden><span>추가 조건</span><select name="param" aria-label="지시 조건"></select></label><label class="command-number" hidden>입력할 번호<input name="value" aria-label="지시할 번호" inputmode="numeric" maxlength="4" autocomplete="off"></label><p class="command-preview" aria-live="polite">대상과 행동을 직접 골라 주세요.</p><p class="command-error" role="status"></p>${notebook.learning.hold?'<p class="command-learned">기억한 약속: 놓으라고 할 때까지 유지하기</p>':''}${notebook.history.length?`<details><summary>최근 지시</summary><ol>${notebook.history.slice(-5).map(h=>`<li>${esc(h.text)}</li>`).join('')}</ol></details>`:''}<div class="command-buttons"><button data-command="run">지시 실행</button><button data-command="close">닫기</button></div></div>`;
    document.querySelector('#app').append(d);const fields={};for(const n of ['target','verb','param','value'])fields[n]=d.querySelector(`[name="${n}"]`);
    if(targets.some(([id])=>id===target))fields.target.value=target;
    function form(){
      const params=owner.params?.(fields.verb.value)||[];const old=fields.param.value;
      fields.param.innerHTML=options(params);if(params.some(([v])=>v===old))fields.param.value=old;
      d.querySelector('.command-param').hidden=!params.length;d.querySelector('.command-number').hidden=fields.verb.value!=='input';preview();
    }
    function preview(){const t=fields.target.selectedOptions[0]?.textContent,v=fields.verb.selectedOptions[0]?.textContent,p=fields.param.selectedOptions[0]?.textContent;d.querySelector('.command-preview').textContent=fields.target.value&&fields.verb.value?`${t} → ${v}${fields.param.value?' → '+p:''}${fields.verb.value==='input'?' → '+fields.value.value:''}`:'대상과 행동을 직접 골라 주세요.';}
    fields.verb.addEventListener('change',form);fields.target.addEventListener('change',preview);fields.param.addEventListener('change',preview);fields.value.addEventListener('input',preview);
    d.addEventListener('click',async e=>{
      const action=e.target.closest('[data-command]')?.dataset.command;if(action==='close'){close();return;}if(action!=='run')return;
      const cmd={target:fields.target.value,verb:fields.verb.value,param:fields.param.value,value:fields.value.value};
      if(!cmd.target||!cmd.verb||!d.querySelector('.command-param').hidden&&!cmd.param){d.querySelector('.command-error').textContent='대상·행동과 필요한 조건을 골라 주세요.';return;}
      if(cmd.verb==='input'&&!/^\d{4}$/.test(cmd.value)){d.querySelector('.command-error').textContent='입력할 네 자리 번호를 적어 주세요.';return;}
      const text=d.querySelector('.command-preview').textContent;close();running=true;
      const s=read();s.history.push({room:owner.id,...cmd,text});s.history=s.history.slice(-40);write(s);
      try{if(current===owner)await owner.execute(cmd);}catch(error){console.error('B-0 instruction failed',error);if(current===owner)owner.feedback('지시를 마치지 못했습니다. 대상을 다시 살펴보고 부탁해 주세요.');}finally{running=false;}
    });
    d.addEventListener('cancel',()=>{dialog=null;});d.addEventListener('close',()=>{d.remove();if(dialog===d)dialog=null;});form();d.showModal();
  }
  const observed=(s,id)=>!!(s.observations?.seen?.[id]||s.seen?.[id]);
  function waitFor(test,dead=()=>false){return new Promise(resolve=>{const start=performance.now();function tick(){if(dead()){resolve(false);return;}if(test()){resolve(true);return;}if(performance.now()-start>15000){resolve(false);return;}requestAnimationFrame(tick);}tick();});}
  window.B0Commands={define(cfg){if(current?.id!==cfg.id)close();current=cfg;},open,reset,close,observed,read,waitFor,
    remember(k,v){const s=read();s.learning[k]=v;write(s);},
    clear(id){if(current?.id===id)reset();}
  };
})();
