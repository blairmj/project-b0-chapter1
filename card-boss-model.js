(function(root){
  'use strict';
  const phases=['intro','ready','fight','lost','defeated','card','released'];
  const MAX_HP=100,BOSS_HP=180,SHOT_DAMAGE=30,ENEMY_DAMAGE=6,SHOT_MS=460,ENEMY_MS=1150;
  const clamp=v=>Math.max(-90,Math.min(90,Number(v)||0));
  const V={y:430/600,z:Math.sqrt(1-(430/600)**2)},bounds={left:300,right:700,top:365,bottom:505},core={x:500,y:215};
  const point=p=>({x:(p.x-500)*2.5,y:-380+(p.y-215)*2.5*V.y,z:-819+(p.y-215)*2.5*V.z});
  const cross=(a,b)=>a.x*b.y-a.y*b.x;
  const finite=(n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
  const count=(v,max=1000000)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.trunc(Number(v)))):0;
  const defeated=s=>s.bossHP<=0;
  function fresh(batteries=0){return {version:4,phase:'intro',line:0,hp:MAX_HP,bossHP:BOSS_HP,hits:0,angle:0,tilt:0,side:'left',mirror:{x:500,y:455},source:{x:500,y:100},aim:{x:500,y:455},deployed:false,trials:0,misses:0,memoryRead:false,cardTaken:false,released:false,batteries:count(batteries,3),supply:count(batteries,3),enemyClock:0,shotClock:0,volley:0,logs:[]};}
  function log(s,action,value){s.logs.push({at:new Date().toISOString(),action,value});s.logs=s.logs.slice(-150);}
  function restore(raw,batteries=0){
    const s=fresh(batteries);if(!raw||![1,2,3,4].includes(raw.version))return s;
    s.line=count(raw.line,3);s.angle=clamp(raw.angle);s.memoryRead=raw.memoryRead===true;s.logs=Array.isArray(raw.logs)?raw.logs.slice(-150):[];
    if(raw.version===1){
      s.hits=count(raw.hits,2);s.bossHP=s.hits===2?0:Math.max(SHOT_DAMAGE,BOSS_HP-s.hits*SHOT_DAMAGE);s.side=s.hits?'right':'left';
    }else{
      const oldMax=raw.version<4?240:BOSS_HP;
      s.hp=raw.hp===undefined?MAX_HP:count(raw.hp,MAX_HP);s.bossHP=raw.bossHP===undefined?BOSS_HP:Math.ceil(count(raw.bossHP,oldMax)*BOSS_HP/oldMax);s.hits=count(raw.hits);s.side=raw.side==='right'?'right':'left';
      s.supply=Math.max(count(raw.supply,3),count(batteries,3));s.batteries=Math.min(s.supply,count(raw.batteries,3)+Math.max(0,s.supply-count(raw.supply,3)));s.volley=count(raw.volley);
    }
    if(raw.version>=3){
      s.mirror={x:Math.max(bounds.left,Math.min(bounds.right,finite(raw.mirror?.x,500))),y:Math.max(bounds.top,Math.min(bounds.bottom,finite(raw.mirror?.y,455)))};
      s.source={x:Math.max(180,Math.min(820,finite(raw.source?.x,500))),y:Math.max(70,Math.min(345,finite(raw.source?.y,100)))};
      s.aim={x:Math.max(390,Math.min(610,finite(raw.aim?.x,500))),y:Math.max(390,Math.min(490,finite(raw.aim?.y,455)))};
    }
    s.tilt=raw.version>=4?Math.max(-30,Math.min(30,finite(raw.tilt,0))):0;
    s.trials=Math.max(s.hits,count(raw.trials));s.misses=Math.max(0,s.trials-s.hits);s.cardTaken=defeated(s)&&raw.cardTaken===true;s.released=s.cardTaken&&raw.released===true;
    s.phase=s.released?'released':s.cardTaken?'card':defeated(s)?'defeated':s.hp===0?'lost':raw.phase==='intro'?'intro':'ready';
    return s; // Reload keeps health and items, but requires deliberately resuming combat.
  }
  function advance(s){if(s.phase!=='intro')return false;if(s.line<3)s.line++;else s.phase='ready';return true;}
  function nextAttack(s,random=Math.random){
    const unit=()=>Math.max(0,Math.min(.999999,finite(random(),.5)));let source,aim,accepted=false;
    for(let i=0;i<7;i++){
      const theta=unit()*Math.PI*2,spread=.87+unit()*.18;
      source={x:500+Math.cos(theta)*275*spread,y:215+Math.sin(theta)*115*spread};
      aim={x:430+unit()*140,y:390+unit()*90};
      if(Math.hypot(source.x-s.source.x,source.y-s.source.y)>100&&Math.hypot(aim.x-s.aim.x,aim.y-s.aim.y)>50){accepted=true;break;}
    }
    if(!accepted){const theta=Math.atan2((s.source.y-215)/115,(s.source.x-500)/275)+2.1;source={x:500+Math.cos(theta)*265,y:215+Math.sin(theta)*110};aim={x:s.aim.x<=500?560:440,y:s.aim.y<=440?475:400};}
    s.source=source;s.aim=aim;s.side=source.x<500?'left':'right';
    log(s,'attack-announced',{source:{...source},aim:{...aim}});
    return {kind:'attack',source:{...source},aim:{...aim},side:s.side};
  }
  function deploy(s,random=Math.random){if(s.phase!=='ready')return false;s.deployed=true;s.phase='fight';s.enemyClock=-800;s.shotClock=0;nextAttack(s,random);log(s,'combat-start');return true;}
  function adjust(s,delta){
    if(!['fight','ready'].includes(s.phase)||![-15,-5,5,15].includes(delta))return false;
    const tilt=Math.max(-30,Math.min(30,(s.tilt||0)+delta));if(tilt===s.tilt)return false;
    s.angle=clamp(s.angle+tilt-(s.tilt||0));s.tilt=tilt;log(s,'reflector-angle',{angle:s.angle,tilt});return true;
  }
  function resetTilt(s){if(!['fight','ready'].includes(s.phase))return false;s.tilt=0;moveReflector(s,s.mirror.x,s.mirror.y,{snap:false});log(s,'reflector-auto');return true;}
  function moveReflector(s,x,y,{snap=true}={}){
    if(!['fight','ready'].includes(s.phase)||!Number.isFinite(x)||!Number.isFinite(y))return false;
    let p={x:Math.max(bounds.left,Math.min(bounds.right,x)),y:Math.max(bounds.top,Math.min(bounds.bottom,y))};
    const d={x:s.aim.x-s.source.x,y:s.aim.y-s.source.y},length=Math.hypot(d.x,d.y);d.x/=length;d.y/=length;
    const along=(p.x-s.source.x)*d.x+(p.y-s.source.y)*d.y,q={x:s.source.x+along*d.x,y:s.source.y+along*d.y};
    // A small magnetic catch helps a child put the plate on the moving light's path.
    if(snap&&along>20&&along<=length+12&&Math.hypot(p.x-q.x,p.y-q.y)<18&&q.x>=bounds.left&&q.x<=bounds.right&&q.y>=bounds.top&&q.y<=bounds.bottom)p=q;
    const out={x:core.x-p.x,y:core.y-p.y},n=Math.hypot(out.x,out.y);out.x/=n;out.y/=n;
    let tx=d.x+out.x,ty=d.y+out.y;if(Math.hypot(tx,ty)<1e-6){tx=-d.y;ty=d.x;}
    let angle=Math.atan2(ty,tx)*180/Math.PI;while(angle>90)angle-=180;while(angle< -90)angle+=180;angle=clamp(angle+(s.tilt||0));
    if(Math.hypot(p.x-s.mirror.x,p.y-s.mirror.y)<.05&&Math.abs(angle-s.angle)<.05)return false;
    s.mirror=p;s.angle=angle;log(s,'reflector-move',{...p,angle});return true;
  }
  function trace(s){
    const source={...s.source},aim={...s.aim},plate={...s.mirror},rad=s.angle*Math.PI/180,t={x:Math.cos(rad),y:Math.sin(rad)};
    const length=Math.hypot(aim.x-source.x,aim.y-source.y),d={x:(aim.x-source.x)/length,y:(aim.y-source.y)/length},r={x:plate.x-source.x,y:plate.y-source.y},den=cross(d,t);
    const distance=Math.abs(den)>1e-8?cross(r,t)/den:Infinity,u=Math.abs(den)>1e-8?cross(r,d)/den:Infinity;
    const caught=distance>0&&distance<=length+18&&Math.abs(u)<=49;
    const mirror=caught?{x:source.x+d.x*distance,y:source.y+d.y*distance}:plate;
    const dot=d.x*t.x+d.y*t.y,out={x:2*dot*t.x-d.x,y:2*dot*t.y-d.y},to={x:core.x-mirror.x,y:core.y-mirror.y},along=to.x*out.x+to.y*out.y,off=Math.abs(cross(to,out));
    let wall=Infinity;for(const [axis,low,high]of [['x',25,975],['y',20,550]])for(const edge of [low,high]){const k=(edge-mirror[axis])/out[axis];if(k>.001)wall=Math.min(wall,k);}
    const hit=caught&&along>0&&along<wall&&off<=32,end=hit?{...core}:{x:mirror.x+out.x*wall,y:mirror.y+out.y*wall};
    return {source,aim,incomingEnd:aim,plate,mirror,target:{...core},end,caught,hit,angle:s.angle,side:s.side};
  }
  function project(view,p){
    const w=point(p),yaw=(view.yaw||0)*Math.PI/180,pitch=(view.pitch||0)*Math.PI/180,dx=w.x-(view.x||0),dz=w.z-(view.z||0),dy=w.y+(view.eyeHeight||0);
    const x=Math.cos(yaw)*dx+Math.sin(yaw)*dz,z=-Math.sin(yaw)*dx+Math.cos(yaw)*dz,y=Math.cos(pitch)*dy-Math.sin(pitch)*z,depth=-(Math.sin(pitch)*dy+Math.cos(pitch)*z);
    if(depth<=1)return null;const f=view.focal||Math.min(view.width*.62,view.height*.5)*(view.zoom||1);
    return {x:view.width/2+f*x/depth,y:view.height/2+f*y/depth};
  }
  function screenToArena(view,x,y){
    const f=view.focal||Math.min(view.width*.62,view.height*.5)*(view.zoom||1),u=(x-view.width/2)/f,v=(y-view.height/2)/f,yaw=(view.yaw||0)*Math.PI/180,pitch=(view.pitch||0)*Math.PI/180;
    const cy=Math.cos(pitch)*v-Math.sin(pitch),cz=-Math.sin(pitch)*v-Math.cos(pitch),d={x:Math.cos(yaw)*u-Math.sin(yaw)*cz,y:cy,z:Math.sin(yaw)*u+Math.cos(yaw)*cz},o={x:view.x||0,y:-(view.eyeHeight||0),z:view.z||0};
    const center=point(core),den=-V.z*d.y+V.y*d.z;if(Math.abs(den)<1e-6)return null;
    const along=(-V.z*(center.y-o.y)+V.y*(center.z-o.z))/den;if(along<=0)return null;
    const w={x:o.x+d.x*along,y:o.y+d.y*along,z:o.z+d.z*along};
    return {x:500+w.x/2.5,y:215+((w.y+380)*V.y+(w.z+819)*V.z)/2.5};
  }
  function strike(s){
    if(s.phase!=='fight'||!s.deployed||s.shotClock>0)return null;
    const result=trace(s);s.shotClock=SHOT_MS;s.trials++;
    if(result.hit){s.hits++;s.bossHP=Math.max(0,s.bossHP-SHOT_DAMAGE);}else s.misses++;
    log(s,'reflected-attack',{side:s.side,angle:s.angle,hit:result.hit,bossHP:s.bossHP});
    if(defeated(s)){s.phase='defeated';s.deployed=false;log(s,'axiom-disabled');}
    return result;
  }
  function tick(s,dt,{firing=false,random=Math.random}={}){
    if(s.phase!=='fight')return [];const elapsed=Math.min(100,Math.max(0,Number(dt)||0)),events=[];
    s.shotClock=Math.max(0,s.shotClock-elapsed);s.enemyClock+=elapsed;
    if(firing&&s.shotClock===0){const result=strike(s);if(result)events.push({kind:'return',trace:result});}
    if(s.phase!=='fight')return events;
    if(s.enemyClock>=ENEMY_MS){
      s.enemyClock-=ENEMY_MS;const result=trace(s),blocked=firing&&result.caught;
      if(!blocked)s.hp=Math.max(0,s.hp-ENEMY_DAMAGE);
      s.volley++;events.push({kind:'enemy',trace:result,blocked,damage:blocked?0:ENEMY_DAMAGE});
      log(s,'enemy-attack',{side:s.side,blocked,hp:s.hp});
      if(s.hp===0){s.phase='lost';s.deployed=false;log(s,'shield-depleted');}
      else events.push(nextAttack(s,random));
    }return events;
  }
  function useBattery(s){if(!['ready','fight'].includes(s.phase)||s.hp>=MAX_HP||s.batteries<=0)return false;s.batteries--;s.hp=Math.min(MAX_HP,s.hp+40);log(s,'backup-battery-used',{hp:s.hp,left:s.batteries});return true;}
  function retry(s){if(s.phase!=='lost')return false;const keep={memoryRead:s.memoryRead,supply:s.supply,logs:s.logs};Object.assign(s,fresh(s.supply),keep,{phase:'ready'});log(s,'combat-retry');return true;}
  function readMemory(s,owned){if(!owned||s.phase==='intro'||s.released)return false;s.memoryRead=true;log(s,'record-memory-read');return true;}
  function takeCard(s){if(s.phase!=='defeated'||!defeated(s)||s.cardTaken)return false;s.cardTaken=true;s.phase='card';log(s,'release-card-taken');return true;}
  function release(s){if(s.phase!=='card'||!s.cardTaken||!defeated(s))return false;s.released=true;s.phase='released';log(s,'release-card-used','B-0');return true;}
  function batterySupply(storage){const read=k=>{try{return JSON.parse(storage.getItem(k));}catch{return null;}};return Number(read('project-b0-firstperson-v4')?.phase==='escaped')+Number(read('project-b0-education-v1')?.memoryTaken===true)+Number(read('project-b0-reflection-v1')?.taken===true);}
  const api={V,bounds,point,project,screenToArena,nextAttack,moveReflector,MAX_HP,BOSS_HP,SHOT_DAMAGE,ENEMY_DAMAGE,SHOT_MS,ENEMY_MS,fresh,restore,advance,deploy,adjust,resetTilt,trace,strike,tick,useBattery,retry,readMemory,takeCard,release,batterySupply,defeated,phases};
  if(typeof module!=='undefined')module.exports=api;else root.B0CardBoss=api;
})(typeof window!=='undefined'?window:globalThis);
