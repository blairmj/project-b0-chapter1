/* Shared WebGL room surfaces. Puzzle DOM, animated B-0 portraits, glass,
 * hands and accessible controls keep their original camera and event targets.
 * Geometry is derived from that same CSS scene. Movable puzzle objects remain
 * in its original depth-sorted 3D DOM, so a shelf still conceals a door or B-0.
 * No second copy of puzzle coordinates or save state is maintained here. */
(function(root){
  'use strict';
  const views=new WeakMap();
  function layers(text){let depth=0,start=0,out=[];for(let i=0;i<text.length;i++){if(text[i]==='(')depth++;if(text[i]===')')depth--;if(text[i]===','&&!depth){out.push(text.slice(start,i).trim());start=i+1;}}out.push(text.slice(start).trim());return out;}
  function create(stage,world){
    const canvas=document.createElement('canvas');canvas.className='room-webgl-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','입체 연구소 공간');stage.prepend(canvas);
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl){canvas.remove();return null;}
    let dead=false,raf=0,last=0,revision=0,lastView='';const textures=[],shaders=[],images=new Map(),materials=new Map();
    const vertex=`attribute vec3 aPosition;attribute vec2 aUV;uniform mat4 uWorld;uniform vec2 uSize;uniform float uFocal;varying vec2 vUV;varying float vDepth;
      void main(){vec4 p=uWorld*vec4(aPosition,1.);float d=uFocal-p.z;vDepth=d;vUV=aUV;gl_Position=vec4(p.x*2.*uFocal/uSize.x,-p.y*2.*uFocal/uSize.y,1.0002*d-2.0002,d);}`;
    const fragment=`precision mediump float;uniform sampler2D uTexture;uniform vec3 uTint;uniform float uShade;varying vec2 vUV;varying float vDepth;
      void main(){vec4 c=texture2D(uTexture,vUV);if(c.a<.01)discard;vec3 rgb=c.rgb*uTint*uShade;float fog=smoothstep(900.,4200.,vDepth)*.16;gl_FragColor=vec4(mix(rgb,vec3(.025,.045,.065),fog),c.a);}`;
    const program=gl.createProgram();let buffer;
    function shader(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    try{gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));buffer=gl.createBuffer();}
    catch(error){shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);canvas.remove();return null;}
    const aPos=gl.getAttribLocation(program,'aPosition'),aUV=gl.getAttribLocation(program,'aUV');
    const uniforms={};for(const n of ['World','Size','Focal','Texture','Tint','Shade'])uniforms[n]=gl.getUniformLocation(program,'u'+n);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
    // Room architecture is GPU-rendered. Furniture, glass and B-0 retain
    // their shared CSS 3D depth ordering, hit targets, and animation layers.
    const surfaces=[...world.querySelectorAll('.c2-wall,.c2-floor,.c2-ceiling')].map(el=>{
      const c=getComputedStyle(el),w=el.offsetWidth,h=el.offsetHeight;
      return {el,w,h,material:material(c,w,h),brightness:parseFloat(c.filter.match(/brightness\(([\d.]+)\)/)?.[1])||1};
    });
    function material(c,w,h){
      const signature=[c.backgroundImage,c.backgroundColor,c.backgroundSize,c.backgroundPosition,w,h].join('|');if(materials.has(signature))return materials.get(signature);
      const tex=gl.createTexture();textures.push(tex);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      const item={tex,background:c.backgroundImage,color:c.backgroundColor,size:c.backgroundSize,position:c.backgroundPosition,w,h};materials.set(signature,item);paint(item);
      for(const match of c.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)){
        const src=match[1];let entry=images.get(src);
        if(!entry){const image=new Image();entry={image,loaded:false,users:new Set()};images.set(src,entry);image.onload=()=>{if(dead)return;entry.loaded=true;entry.users.forEach(paint);};image.onerror=()=>{if(!dead)fallback();};image.src=src;}
        entry.users.add(item);if(entry.loaded)paint(item);
      }return item;
    }
    function paint(m){
      if(dead)return;const c=document.createElement('canvas'),ratio=Math.min(1,1536/Math.max(m.w,m.h));c.width=Math.max(1,Math.round(m.w*ratio));c.height=Math.max(1,Math.round(m.h*ratio));const ctx=c.getContext('2d');ctx.scale(c.width/m.w,c.height/m.h);ctx.fillStyle=m.color;ctx.fillRect(0,0,m.w,m.h);
      const bg=layers(m.background),sizes=layers(m.size),positions=layers(m.position);
      for(let i=bg.length-1;i>=0;i--){const layer=bg[i],url=layer.match(/^url\(["']?([^"')]+)["']?\)$/);
        if(url){const entry=images.get(url[1]);if(!entry?.loaded)continue;const im=entry.image,parts=(sizes[i%sizes.length]||'auto').split(/\s+/);let tw=parseFloat(parts[0])||im.width,th=parseFloat(parts[1])||tw*im.height/im.width;
          if(parts[0]==='cover'||parts[0]==='contain'){const r=Math[parts[0]==='cover'?'max':'min'](m.w/im.width,m.h/im.height);tw=im.width*r;th=im.height*r;}
          const pos=(positions[i%positions.length]||'0% 0%').split(/\s+/),offset=(s,extent,tile)=>s?.endsWith('%')?(extent-tile)*parseFloat(s)/100:parseFloat(s)||0;
          const pattern=ctx.createPattern(im,'repeat');pattern.setTransform(new DOMMatrix().translate(offset(pos[0],m.w,tw),offset(pos[1]||pos[0],m.h,th)).scale(tw/im.width,th/im.height));ctx.fillStyle=pattern;ctx.fillRect(0,0,m.w,m.h);
        }else if(layer.includes('gradient('))paintGradient(ctx,layer,m.w,m.h);
      }
      gl.bindTexture(gl.TEXTURE_2D,m.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
      revision++;
    }
    function paintGradient(ctx,source,w,h){
      const repeating=source.startsWith('repeating-'),radial=source.includes('radial-'),parts=layers(source.slice(source.indexOf('(')+1,-1));let spec='180deg';if(!/^(rgb|hsl|#|transparent\b)/.test(parts[0]))spec=parts.shift();
      const stops=[];for(const item of parts){const match=item.match(/^(rgba?\([^)]*\)|hsla?\([^)]*\)|#[\da-f]+|transparent)\s*(.*)$/i);if(!match)continue;const positions=match[2].trim().split(/\s+/).filter(Boolean);for(const p of positions.length?positions:[null])stops.push({color:match[1],pos:p});}
      if(stops.length<2)return;const angle=(parseFloat(spec)||0)*Math.PI/180,dx=Math.sin(angle),dy=-Math.cos(angle),length=radial?Math.max(w,h):Math.abs(w*dx)+Math.abs(h*dy);
      let previous=0;for(let i=0;i<stops.length;i++){const s=stops[i];s.n=s.pos?(s.pos.endsWith('%')?parseFloat(s.pos)/100:parseFloat(s.pos)/length):i/(stops.length-1);s.n=Math.max(previous,s.n);previous=s.n;}
      ctx.save();if(repeating){const period=Math.max(1,stops.at(-1).n*length);const tile=document.createElement('canvas');tile.width=Math.ceil(period);tile.height=1;const t=tile.getContext('2d'),g=t.createLinearGradient(0,0,period,0);for(const s of stops)g.addColorStop(Math.min(1,s.n*length/period),s.color);t.fillStyle=g;t.fillRect(0,0,period,1);const pattern=ctx.createPattern(tile,'repeat');pattern.setTransform(new DOMMatrix().rotate((Math.atan2(dy,dx)*180/Math.PI)));ctx.fillStyle=pattern;
      }else{const g=radial?ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,length*.65):ctx.createLinearGradient(w/2-dx*length/2,h/2-dy*length/2,w/2+dx*length/2,h/2+dy*length/2);for(const s of stops)g.addColorStop(Math.max(0,Math.min(1,s.n)),s.color);ctx.fillStyle=g;}ctx.fillRect(0,0,w,h);ctx.restore();
    }
    function local(el,cache){
      if(el===world)return new DOMMatrix();if(cache.has(el))return cache.get(el);const css=getComputedStyle(el),origin=css.transformOrigin.split(' ').map(parseFloat),tr=css.translate.split(' ').map(parseFloat),rotate=css.rotate,sc=css.scale.split(' ').map(parseFloat);
      let matrix=new DOMMatrix().translate(el.offsetLeft,el.offsetTop).translate(origin[0]||0,origin[1]||0,origin[2]||0).translate(tr[0]||0,tr[1]||0,tr[2]||0);
      if(rotate!=='none'){const n=parseFloat(rotate);if(Number.isFinite(n))matrix=matrix.rotate(n);}
      if(css.scale!=='none')matrix=matrix.scale(sc[0]||1,sc[1]||sc[0]||1,sc[2]||1);
      if(css.transform!=='none')matrix=matrix.multiply(new DOMMatrix(css.transform));matrix=matrix.translate(-(origin[0]||0),-(origin[1]||0),-(origin[2]||0));
      const parent=el.offsetParent;const result=parent&&parent!==world?local(parent,cache).multiply(matrix):matrix;cache.set(el,result);return result;
    }
    function visible(el){for(let p=el;p&&p!==world;p=p.parentElement){const c=getComputedStyle(p);if(p.hidden||c.display==='none'||c.visibility==='hidden')return false;}return true;}
    function render(now){
      if(dead)return;if(!stage.isConnected){dispose();return;}raf=requestAnimationFrame(render);if(document.hidden||now-last<64)return;last=now;draw();
    }
    function draw(force=false){
      if(dead||!stage.isConnected||document.hidden)return;
      const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
      const f=parseFloat(stage.style.perspective)||Math.min(w*.62,h*.5),transform=getComputedStyle(world).transform,signature=[w,h,f,transform,stage.dataset.axiom,revision].join('|');if(!force&&signature===lastView)return;
      const ratio=Math.min(root.devicePixelRatio||1,1.5,1600/Math.max(w,h)),cw=Math.round(w*ratio),ch=Math.round(h*ratio);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}gl.viewport(0,0,cw,ch);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(aPos);gl.enableVertexAttribArray(aUV);gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,20,0);gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,20,12);
      const wm=new DOMMatrix(transform);gl.uniformMatrix4fv(uniforms.World,false,wm.toFloat32Array());gl.uniform2f(uniforms.Size,w,h);gl.uniform1f(uniforms.Focal,f);gl.uniform1i(uniforms.Texture,0);lastView=signature;
      const phase=stage.dataset.axiom,tint=phase==='critical'||phase==='override'?[.86,.65,.75]:phase==='severed'?[1,.81,.77]:phase==='released'?[1,1,.96]:[1,1,1];gl.uniform3fv(uniforms.Tint,tint);
      const cache=new Map();for(const s of surfaces){if(!visible(s.el))continue;const m=local(s.el,cache),points=[[0,0],[s.w,0],[s.w,s.h],[0,s.h]].map(([x,y])=>m.transformPoint({x,y,z:0,w:1})),uv=[[0,0],[1,0],[1,1],[0,1]],v=[];for(const i of [0,1,2,0,2,3])v.push(points[i].x,points[i].y,points[i].z,...uv[i]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.DYNAMIC_DRAW);gl.bindTexture(gl.TEXTURE_2D,s.material.tex);gl.uniform1f(uniforms.Shade,s.brightness);gl.drawArrays(gl.TRIANGLES,0,6);}
      if(!stage.classList.contains('room-webgl-active')){surfaces.forEach(s=>s.el.classList.add('room-gpu-surface'));stage.classList.add('room-webgl-active');stage.dataset.renderer='webgl';}
      canvas.dataset.worldMatrix=transform;canvas.dataset.focal=String(f);
    }
    function fallback(){if(dead)return;dispose();stage.dataset.renderer='css-fallback';}
    const lost=e=>{e.preventDefault();fallback();};canvas.addEventListener('webglcontextlost',lost);
    function dispose(){if(dead)return;dead=true;views.delete(world);cancelAnimationFrame(raf);stage.classList.remove('room-webgl-active');surfaces.forEach(s=>s.el.classList.remove('room-gpu-surface'));canvas.removeEventListener('webglcontextlost',lost);images.forEach(e=>{e.image.onload=e.image.onerror=null;});textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(s=>gl.deleteShader(s));gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();canvas.remove();}
    const view={dispose,sync:()=>draw(true)};views.set(world,view);raf=requestAnimationFrame(render);return view;
  }
  // One observer owns the GPU lifecycle across lesson resets, temporary jumps,
  // endings, and the nested mirror room. Removed scenes never retain a context.
  function mount(app){let current=null,view=null;const sync=()=>{const world=app.querySelector('.c2-world');if(current===world)return;view?.dispose();view=null;current=world;if(world)try{view=create(world.parentElement,world);}catch{view=null;}};const observer=new MutationObserver(sync);observer.observe(app,{childList:true,subtree:true});sync();return ()=>{observer.disconnect();view?.dispose();};}
  const api={create,mount,layers,sync:world=>views.get(world)?.sync()};if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.B0RoomWebGL=api;document.addEventListener('DOMContentLoaded',()=>{const app=document.querySelector('#app');if(app)mount(app);});}
})(typeof window!=='undefined'?window:globalThis);
