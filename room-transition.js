(function(){
  'use strict';let crossing=false,pending=new Set();
  function later(fn,ms){const id=setTimeout(()=>{pending.delete(id);fn();},ms);pending.add(id);}
  function cancel(){pending.forEach(clearTimeout);pending.clear();document.querySelector('.b0-scene-crossing')?.remove();crossing=false;}
  function cross(app,enter){
    if(crossing)return;const stage=app.querySelector('.lab-stage,.c2-stage,.scene');if(!stage||matchMedia('(prefers-reduced-motion: reduce)').matches){enter();return;}
    crossing=true;const r=stage.getBoundingClientRect(),veil=document.createElement('div');veil.className='b0-scene-crossing';veil.setAttribute('aria-hidden','true');Object.assign(veil.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.append(veil);
    requestAnimationFrame(()=>veil.classList.add('covered'));
    later(()=>{try{enter();const next=app.querySelector('.lab-stage,.c2-stage,.scene');next?.classList.add('b0-room-arrival');}finally{later(()=>{veil.classList.remove('covered');later(()=>{veil.remove();crossing=false;},320);},120);}},300);
  }
  window.B0RoomTransit={cross,cancel};
})();
