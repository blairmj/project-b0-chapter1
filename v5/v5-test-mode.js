(function(root){
  'use strict';
  const prefix='project-b0-v5-test:';
  function storage(backing){return {getItem:key=>backing.getItem(prefix+key),setItem:(key,value)=>backing.setItem(prefix+key,value),removeItem:key=>backing.removeItem(prefix+key)};}
  function prepare(id,store,{route:M,education:E,control:C,reflection:R,first:fresh}){
    const rank=M.steps.indexOf(id);if(rank<0)return false;
    const read=key=>{try{return JSON.parse(store.getItem(key));}catch{return null;}},write=(key,value)=>store.setItem(key,JSON.stringify(value));
    let first=read('project-b0-v5-firstperson-v4')||fresh();
    if(rank>0)first.phase='escaped';else first={...fresh(),phase:'room'};
    write('project-b0-v5-firstperson-v4',first);
    let r=M.restore(read(M.key),M.facts(store));
    if(rank>=M.steps.indexOf('education'))M.takeCard(r,M.facts(store));
    if(rank>=M.steps.indexOf('control')&&!M.facts(store).memory){const s=E.fresh();Object.assign(s,{workingSeen:true,first:'divide',middle:'8',answer:'16'});E.check(s);E.take(s);write(E.key,s);}
    if(rank>=M.steps.indexOf('reflection')&&!M.facts(store).control){const s=C.fresh();C.ask(s,'가장 빠른 길을 찾아줘');C.ask(s,'인증을 반드시 거쳐야 해');for(const field of ['gate','time','optimal'])C.verify(s,field);C.begin(s);C.finish(s);write(C.key,s);}
    if(rank>=M.steps.indexOf('stairs')&&!M.facts(store).reflector){const s=R.fresh();R.rotate(s);R.setAngle(s,'a',-45);R.setAngle(s,'b',-45);R.test(s);R.take(s);R.finish(s);write(R.key,s);}
    if(rank>=M.steps.indexOf('central'))for(const item of ['card','memory','reflector'])M.use(r,item,M.facts(store));
    write(M.key,r);return true;
  }
  const api={storage,prepare};if(typeof module!=='undefined')module.exports=api;else{api.store=storage(root.sessionStorage);root.B0V5Test=api;}
})(typeof window!=='undefined'?window:globalThis);
