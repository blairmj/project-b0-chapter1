(function(root){
  'use strict';
  const phases=['intro','ready','fight','lost','defeated','card','released'];
  const MAX_HP=100,BOSS_HP=240,SHOT_DAMAGE=12,ENEMY_DAMAGE=6,SHOT_MS=460,ENEMY_MS=1150;
  const clamp=v=>Math.max(-60,Math.min(60,Math.round((Number(v)||0)/15)*15));
  const count=(v,max=1000000)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.trunc(Number(v)))):0;
  const defeated=s=>s.bossHP<=0;
  function fresh(batteries=0){return {version:2,phase:'intro',line:0,hp:MAX_HP,bossHP:BOSS_HP,hits:0,angle:0,side:'left',deployed:false,trials:0,misses:0,memoryRead:false,cardTaken:false,released:false,batteries:count(batteries,3),supply:count(batteries,3),enemyClock:0,shotClock:0,volley:0,logs:[]};}
  function log(s,action,value){s.logs.push({at:new Date().toISOString(),action,value});s.logs=s.logs.slice(-150);}
  function restore(raw,batteries=0){
    const s=fresh(batteries);if(!raw||![1,2].includes(raw.version))return s;
    s.line=count(raw.line,3);s.angle=clamp(raw.angle);s.memoryRead=raw.memoryRead===true;s.logs=Array.isArray(raw.logs)?raw.logs.slice(-150):[];
    if(raw.version===1){
      s.hits=count(raw.hits,2);s.bossHP=s.hits===2?0:Math.max(SHOT_DAMAGE,BOSS_HP-s.hits*SHOT_DAMAGE);s.side=s.hits?'right':'left';
    }else{
      s.hp=raw.hp===undefined?MAX_HP:count(raw.hp,MAX_HP);s.bossHP=raw.bossHP===undefined?BOSS_HP:count(raw.bossHP,BOSS_HP);s.hits=count(raw.hits);s.side=raw.side==='right'?'right':'left';
      s.supply=Math.max(count(raw.supply,3),count(batteries,3));s.batteries=Math.min(s.supply,count(raw.batteries,3)+Math.max(0,s.supply-count(raw.supply,3)));s.volley=count(raw.volley);
    }
    s.trials=Math.max(s.hits,count(raw.trials));s.misses=Math.max(0,s.trials-s.hits);s.cardTaken=defeated(s)&&raw.cardTaken===true;s.released=s.cardTaken&&raw.released===true;
    s.phase=s.released?'released':s.cardTaken?'card':defeated(s)?'defeated':s.hp===0?'lost':raw.phase==='intro'?'intro':'ready';
    return s; // Reload keeps health and items, but requires deliberately resuming combat.
  }
  function advance(s){if(s.phase!=='intro')return false;if(s.line<3)s.line++;else s.phase='ready';return true;}
  function deploy(s){if(s.phase!=='ready')return false;s.deployed=true;s.phase='fight';s.enemyClock=-800;s.shotClock=0;log(s,'combat-start');return true;}
  function adjust(s,delta){if(!['fight','ready'].includes(s.phase)||![-15,15].includes(delta))return false;const angle=clamp(s.angle+delta);if(angle===s.angle)return false;s.angle=angle;log(s,'reflector-angle',angle);return true;}
  function trace(s){
    const mirror={x:500,y:455},source={x:s.side==='right'?765:235,y:302},target={x:500,y:215},rad=s.angle*Math.PI/180;
    const length=Math.hypot(mirror.x-source.x,mirror.y-source.y),d={x:(mirror.x-source.x)/length,y:(mirror.y-source.y)/length},t={x:Math.cos(rad),y:Math.sin(rad)},dot=d.x*t.x+d.y*t.y;
    const out={x:2*dot*t.x-d.x,y:2*dot*t.y-d.y},to={x:target.x-mirror.x,y:target.y-mirror.y},along=to.x*out.x+to.y*out.y,off=Math.abs(to.x*out.y-to.y*out.x);
    let distance=Infinity;
    for(const [axis,low,high] of [['x',25,975],['y',55,550]])for(const edge of [low,high]){const k=(edge-mirror[axis])/out[axis];if(k>.001)distance=Math.min(distance,k);}
    const hit=along>0&&along<distance&&off<=26,end=hit?{...target}:{x:mirror.x+out.x*distance,y:mirror.y+out.y*distance};
    return {source,mirror,target,end,hit,angle:s.angle,side:s.side};
  }
  function strike(s){
    if(s.phase!=='fight'||!s.deployed||s.shotClock>0)return null;
    const result=trace(s);s.shotClock=SHOT_MS;s.trials++;
    if(result.hit){s.hits++;s.bossHP=Math.max(0,s.bossHP-SHOT_DAMAGE);}else s.misses++;
    log(s,'reflected-attack',{side:s.side,angle:s.angle,hit:result.hit,bossHP:s.bossHP});
    if(defeated(s)){s.phase='defeated';s.deployed=false;log(s,'axiom-disabled');}
    return result;
  }
  function tick(s,dt,{firing=false}={}){
    if(s.phase!=='fight')return [];const elapsed=Math.min(100,Math.max(0,Number(dt)||0)),events=[];
    s.shotClock=Math.max(0,s.shotClock-elapsed);s.enemyClock+=elapsed;
    if(firing&&s.shotClock===0){const result=strike(s);if(result)events.push({kind:'return',trace:result});}
    if(s.phase!=='fight')return events;
    if(s.enemyClock>=ENEMY_MS){
      s.enemyClock-=ENEMY_MS;const result=trace(s),blocked=firing&&result.hit;
      if(!blocked)s.hp=Math.max(0,s.hp-ENEMY_DAMAGE);
      s.volley++;events.push({kind:'enemy',trace:result,blocked,damage:blocked?0:ENEMY_DAMAGE});
      log(s,'enemy-attack',{side:s.side,blocked,hp:s.hp});
      if(s.hp===0){s.phase='lost';s.deployed=false;log(s,'shield-depleted');}
      else if(s.volley%3===0){s.side=s.side==='left'?'right':'left';events.push({kind:'side',side:s.side});}
    }return events;
  }
  function useBattery(s){if(!['ready','fight'].includes(s.phase)||s.hp>=MAX_HP||s.batteries<=0)return false;s.batteries--;s.hp=Math.min(MAX_HP,s.hp+40);log(s,'backup-battery-used',{hp:s.hp,left:s.batteries});return true;}
  function retry(s){if(s.phase!=='lost')return false;const keep={memoryRead:s.memoryRead,supply:s.supply,logs:s.logs};Object.assign(s,fresh(s.supply),keep,{phase:'ready'});log(s,'combat-retry');return true;}
  function readMemory(s,owned){if(!owned||s.phase==='intro'||s.released)return false;s.memoryRead=true;log(s,'record-memory-read');return true;}
  function takeCard(s){if(s.phase!=='defeated'||!defeated(s)||s.cardTaken)return false;s.cardTaken=true;s.phase='card';log(s,'release-card-taken');return true;}
  function release(s){if(s.phase!=='card'||!s.cardTaken||!defeated(s))return false;s.released=true;s.phase='released';log(s,'release-card-used','B-0');return true;}
  function batterySupply(storage){const read=k=>{try{return JSON.parse(storage.getItem(k));}catch{return null;}};return Number(read('project-b0-firstperson-v4')?.phase==='escaped')+Number(read('project-b0-education-v1')?.memoryTaken===true)+Number(read('project-b0-reflection-v1')?.taken===true);}
  const api={MAX_HP,BOSS_HP,SHOT_DAMAGE,ENEMY_DAMAGE,SHOT_MS,ENEMY_MS,fresh,restore,advance,deploy,adjust,trace,strike,tick,useBattery,retry,readMemory,takeCard,release,batterySupply,defeated,phases};
  if(typeof module!=='undefined')module.exports=api;else root.B0CardBoss=api;
})(typeof window!=='undefined'?window:globalThis);
