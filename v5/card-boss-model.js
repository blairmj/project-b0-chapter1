(function(root){
  'use strict';
  const MAX_HP=100,BOSS_HP=180,SHOT_DAMAGE=30,ENEMY_DAMAGE=6,SHOT_MS=620,ENEMY_MS=850;
  const V={y:430/600,z:Math.sqrt(1-(430/600)**2)},core={x:500,y:215},bounds={left:350,right:650,y:484};
  const point=p=>({x:(p.x-500)*2.5,y:-380+(p.y-215)*2.5*V.y,z:-819+(p.y-215)*2.5*V.z});
  const count=(v,max=1000000)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.trunc(Number(v)))):0;
  const defeated=s=>s.bossHP<=0;
  const phases=['intro','ready','fight','lost','defeated','card','released'];
  function fresh(batteries=0){return {version:5,phase:'intro',line:0,hp:MAX_HP,bossHP:BOSS_HP,hits:0,trials:0,misses:0,player:{x:500,y:bounds.y},projectiles:[],shotSeq:0,enemyClock:0,shotClock:0,invulnerable:0,volley:0,memoryRead:false,cardTaken:false,released:false,batteries:count(batteries,3),supply:count(batteries,3),logs:[]};}
  function log(s,action,value){s.logs.push({at:new Date().toISOString(),action,value});s.logs=s.logs.slice(-150);}
  function restore(raw,batteries=0){
    const s=fresh(batteries);if(!raw||![1,2,3,4,5].includes(raw.version))return s;
    s.line=count(raw.line,3);s.memoryRead=raw.memoryRead===true;s.logs=Array.isArray(raw.logs)?raw.logs.slice(-150):[];
    if(raw.version===1){s.hits=count(raw.hits,2);s.bossHP=s.hits===2?0:BOSS_HP-s.hits*SHOT_DAMAGE;}
    else{const oldMax=raw.version<4?240:BOSS_HP;s.hp=raw.hp===undefined?MAX_HP:count(raw.hp,MAX_HP);s.bossHP=raw.bossHP===undefined?BOSS_HP:Math.ceil(count(raw.bossHP,oldMax)*BOSS_HP/oldMax);s.hits=count(raw.hits);s.supply=Math.max(count(raw.supply,3),count(batteries,3));s.batteries=Math.min(s.supply,count(raw.batteries,3)+Math.max(0,s.supply-count(raw.supply,3)));s.volley=count(raw.volley);}
    if(raw.version===5&&Number.isFinite(raw.player?.x))s.player.x=Math.max(bounds.left,Math.min(bounds.right,raw.player.x));
    s.trials=Math.max(s.hits,count(raw.trials));s.misses=Math.max(0,s.trials-s.hits);s.cardTaken=defeated(s)&&raw.cardTaken===true;s.released=s.cardTaken&&raw.released===true;
    s.phase=s.released?'released':s.cardTaken?'card':defeated(s)?'defeated':s.hp===0?'lost':raw.phase==='intro'?'intro':'ready';
    return s; // Resume deliberately, preserving progress but clearing in-flight bullets.
  }
  function advance(s){if(s.phase!=='intro')return false;if(s.line<3)s.line++;else s.phase='ready';return true;}
  function deploy(s){if(s.phase!=='ready')return false;s.phase='fight';s.enemyClock=-600;s.shotClock=0;s.projectiles=[];log(s,'combat-start');return true;}
  function movePlayer(s,x){if(!['ready','fight'].includes(s.phase)||!Number.isFinite(x))return false;const next=Math.max(bounds.left,Math.min(bounds.right,x));if(Math.abs(next-s.player.x)<.01)return false;s.player.x=next;log(s,'player-move',next);return true;}
  function fire(s){
    if(s.phase!=='fight'||s.shotClock>0)return null;
    const p={id:++s.shotSeq,kind:'return',x:s.player.x,y:s.player.y,vx:0,vy:-510};s.projectiles.push(p);s.shotClock=SHOT_MS;s.trials++;
    return {kind:'shot',projectile:{...p}};
  }
  function volley(s,random=Math.random){
    const unit=()=>{const n=Number(random());return Number.isFinite(n)?Math.max(0,Math.min(.999999,n)):.5;};
    const aim=Math.max(320,Math.min(680,s.player.x+(unit()-.5)*170)),fan=s.volley%3===2?[-75,0,75]:[0],shots=[];
    for(const offset of fan){const dx=aim+offset-core.x,dy=bounds.y-core.y,n=Math.hypot(dx,dy),p={id:++s.shotSeq,kind:'enemy',x:core.x,y:core.y,vx:dx/n*245,vy:dy/n*245};s.projectiles.push(p);shots.push({...p});}
    s.volley++;log(s,'enemy-volley',{source:{...core},aim,shots:shots.length});return {kind:'volley',shots};
  }
  function tick(s,dt,{firing=true,random=Math.random}={}){
    if(s.phase!=='fight')return [];const elapsed=Math.min(100,Math.max(0,Number(dt)||0)),seconds=elapsed/1000,events=[];
    s.shotClock=Math.max(0,s.shotClock-elapsed);s.invulnerable=Math.max(0,s.invulnerable-elapsed);s.enemyClock+=elapsed;
    for(let i=s.projectiles.length-1;i>=0;i--){
      const p=s.projectiles[i];p.x+=p.vx*seconds;p.y+=p.vy*seconds;
      if(p.kind==='return'&&p.y<=core.y){
        const hit=Math.abs(p.x-core.x)<=76;s.projectiles.splice(i,1);
        if(hit){s.bossHP=Math.max(0,s.bossHP-SHOT_DAMAGE);s.hits++;events.push({kind:'hit',at:{...core},damage:SHOT_DAMAGE});}else{s.misses++;events.push({kind:'miss'});}
        log(s,'reflected-attack',{hit,bossHP:s.bossHP});
        if(defeated(s)){s.phase='defeated';log(s,'axiom-disabled');break;}
      }else if(p.kind==='enemy'&&Math.hypot(p.x-s.player.x,p.y-s.player.y)<=38){
        s.projectiles.splice(i,1);if(s.invulnerable===0){s.hp=Math.max(0,s.hp-ENEMY_DAMAGE);s.invulnerable=300;events.push({kind:'player-hit',at:{...s.player},damage:ENEMY_DAMAGE});log(s,'enemy-attack',{hp:s.hp});if(s.hp===0){s.phase='lost';log(s,'shield-depleted');break;}}
      }else if(p.y>565||p.x<200||p.x>800)s.projectiles.splice(i,1);
    }
    if(s.phase!=='fight'){s.projectiles=[];return events;}
    if(firing&&s.shotClock===0){const shot=fire(s);if(shot)events.push(shot);}
    if(s.enemyClock>=ENEMY_MS){s.enemyClock-=ENEMY_MS;events.push(volley(s,random));}
    return events;
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
  function useBattery(s){if(!['ready','fight'].includes(s.phase)||s.hp>=MAX_HP||s.batteries<=0)return false;s.batteries--;s.hp=Math.min(MAX_HP,s.hp+40);log(s,'backup-battery-used',{hp:s.hp,left:s.batteries});return true;}
  function retry(s){if(s.phase!=='lost')return false;const keep={memoryRead:s.memoryRead,supply:s.supply,logs:s.logs};Object.assign(s,fresh(s.supply),keep,{phase:'ready'});log(s,'combat-retry');return true;}
  function readMemory(s,owned){if(!owned||s.phase==='intro'||s.released)return false;s.memoryRead=true;log(s,'record-memory-read');return true;}
  function takeCard(s){if(s.phase!=='defeated'||!defeated(s)||s.cardTaken)return false;s.cardTaken=true;s.phase='card';log(s,'release-card-taken');return true;}
  function release(s){if(s.phase!=='card'||!s.cardTaken||!defeated(s))return false;s.released=true;s.phase='released';log(s,'release-card-used','B-0');return true;}
  function batterySupply(storage){const read=k=>{try{return JSON.parse(storage.getItem(k));}catch{return null;}};return Number(read('project-b0-v5-firstperson-v4')?.phase==='escaped')+Number(read('project-b0-v5-education-v1')?.memoryTaken===true)+Number(read('project-b0-v5-reflection-v1')?.taken===true);}
  const api={MAX_HP,BOSS_HP,SHOT_DAMAGE,ENEMY_DAMAGE,SHOT_MS,ENEMY_MS,V,core,bounds,point,project,screenToArena,fresh,restore,advance,deploy,movePlayer,fire,volley,tick,useBattery,retry,readMemory,takeCard,release,batterySupply,defeated,phases};
  if(typeof module!=='undefined')module.exports=api;else root.B0CardBoss=api;
})(typeof window!=='undefined'?window:globalThis);
