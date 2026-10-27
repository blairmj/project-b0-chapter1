/* Doorway travel shares each room's camera, including the WebGL surfaces and
   original puzzle props. No room object or saved puzzle position is moved. */
(function(){
  'use strict';
  const rooms=new WeakMap();let active=false,frame=0,blocker=null,portal=null,game=null,portalRenderer=null;
  const ease=p=>p*p*(3-2*p),reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function bind(world,view){if(world)rooms.set(world,view);}
  function cancel(){portalRenderer?.dispose();portalRenderer=null;cancelAnimationFrame(frame);frame=0;blocker?.remove();portal?.remove();game?.classList.remove('b0-passage-travel');blocker=portal=game=null;active=false;}
  function tween(view,to,ms,done,each){
    const from=view.read(),start=performance.now(),turn=(((to.yaw??from.yaw)-from.yaw+540)%360)-180;
    function tick(t){if(!active)return;const p=Math.min(1,(t-start)/ms),q=ease(p),v={...from};
      for(const k of ['x','z','height','pitch','zoom'])v[k]=(from[k]||0)+((to[k]??from[k]??0)-(from[k]||0))*q;
      v.yaw=from.yaw+turn*q;view.write(v);each?.(q);if(p<1)frame=requestAnimationFrame(tick);else done?.();
    }frame=requestAnimationFrame(tick);
  }
  function lock(app){
    game=app.querySelector('.game');game?.classList.add('b0-passage-travel');
    blocker=document.createElement('div');blocker.className='b0-passage-blocker';blocker.setAttribute('aria-label','문을 통과하는 중');document.body.append(blocker);
  }
  function portalAt(world,d){
    const w=d.wide?220:136,h=d.wide?260:235;
    portal=document.createElement('div');portal.className='b0-passage-door';portal.setAttribute('aria-hidden','true');
    portal.style.cssText=`width:${w}px;height:${h}px;left:${-w/2}px;top:${180-h}px;transform:translate3d(${d.x}px,0,${d.z}px) rotateY(${-d.yaw}deg)`;
    portal.innerHTML='<div class="b0-passage-view"></div><div class="b0-passage-leaves"><i></i><i></i></div><div class="b0-passage-jamb"></div>';
    world.append(portal);return portal;
  }
  function arrive(app,done){
    game?.classList.remove('b0-passage-travel');game=app.querySelector('.game');game?.classList.add('b0-passage-travel');
    const world=app.querySelector('.c2-world'),view=rooms.get(world);
    if(!view){done();return;}
    const target=view.read(),d=view.door,a=d.yaw*Math.PI/180;view.stop();
    view.write({...target,x:d.x-Math.sin(a)*26,z:d.z+Math.cos(a)*26,yaw:d.yaw+180,pitch:0,height:0,zoom:1});
    const stage=world.parentElement;stage.dataset.passage='entering';
    // Let the observer mount the shared WebGL surface renderer before moving.
    tween(view,target,1150,()=>{delete stage.dataset.passage;done();});
  }
  function cross(app,enter,{direction='enter',completed=false,corridor=null}={}){
    if(active)return;
    if(reduced()){enter();return;}
    const world=app.querySelector('.c2-world'),view=rooms.get(world);
    active=true;lock(app);
    if(direction==='exit'&&view){
      view.stop();app.querySelector('dialog')?.close();const d=(completed&&view.exit)||view.door,a=d.yaw*Math.PI/180;
      const door=portalAt(world,d),stage=world.parentElement;stage.dataset.passage='approaching';
      if(corridor&&window.B0LabWebGL){
        const canvas=document.createElement('canvas');canvas.className='b0-passage-canvas';door.querySelector('.b0-passage-view').append(canvas);
        const M=window.B0LabNavigation,state=M.restore(corridor.state),hallDoor=M.doors[corridor.from];
        try{portalRenderer=window.B0LabWebGL.create(canvas,{model:M,state,onFallback:()=>{canvas.remove();}});}catch{canvas.remove();}
        if(portalRenderer){
          const into={x:Math.sin(hallDoor.yaw*Math.PI/180),z:-Math.cos(hallDoor.yaw*Math.PI/180)},ground=hallDoor.floor===2?360:0;
          if(completed)M.returned(state,corridor.from,true);
          const originalWrite=view.write;
          view.write=v=>{originalWrite(v);const distance=Math.max(3,(d.x-v.x)*Math.sin(a)-(d.z-v.z)*Math.cos(a));
            const camera=completed?{...state.camera,z:state.camera.z+distance,zoom:1,height:ground,pitch:0}:{x:hallDoor.x+into.x*distance,z:hallDoor.z+into.z*distance,yaw:hallDoor.yaw+180,pitch:0,zoom:1,height:ground};
            const companion=state.companion||M.companionSpot(state.camera.x+100,state.camera.z-240,hallDoor.floor);
            portalRenderer?.update(camera,companion,{lit:!state.powerOut,walking:false,passage:{id:corridor.from,open:1},portal:{focal:distance,offsetY:2*(180-(d.wide?260:235)/2)/(d.wide?260:235)}});
          };
        }
      }
      const near={x:d.x-Math.sin(a)*160,z:d.z+Math.cos(a)*160,yaw:d.yaw,pitch:0,height:0,zoom:1};
      const current=view.read(),distance=Math.hypot(current.x-near.x,current.z-near.z);
      tween(view,near,Math.max(650,Math.min(1450,distance*1.4)),()=>{
        stage.dataset.passage='opening';
        tween(view,near,720,()=>{
          stage.dataset.passage='leaving';
          tween(view,{...near,x:d.x-Math.sin(a)*3,z:d.z+Math.cos(a)*3},800,()=>{enter();cancel();});
        },q=>door.style.setProperty('--open',q));
      });
    }else{enter();arrive(app,cancel);}
  }
  window.B0RoomTransit={bind,cross,cancel};
})();
