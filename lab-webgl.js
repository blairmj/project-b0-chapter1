/* One connected corridor mesh. Coordinates match the existing navigation model:
 * x right, y down, north is -z, eye height is y=0 on the first floor. */
(function(root){
  'use strict';
  const metal={color:[.79,.86,.91],kind:1},dark={color:[.13,.21,.28],kind:1},trim={color:[.40,.51,.59],kind:1};
  const pale={color:[.69,.78,.81]},cyan={color:[.25,.88,1],glow:1},amber={color:[1,.55,.22],glow:1};
  function ray(camera,x,y,width,height,focal){
    const a=camera.yaw*Math.PI/180,p=camera.pitch*Math.PI/180,u=(x-width/2)/focal,v=(y-height/2)/focal;
    const ry=v*Math.cos(p)-Math.sin(p),rz=-v*Math.sin(p)-Math.cos(p);
    const d=[u*Math.cos(a)-rz*Math.sin(a),ry,u*Math.sin(a)+rz*Math.cos(a)];
    const length=Math.hypot(...d);return {origin:[camera.x,-camera.height,camera.z],direction:d.map(n=>n/length)};
  }
  const sub=(a,b)=>a.map((n,i)=>n-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
  function intersect(r,a,b,c){
    const e1=sub(b,a),e2=sub(c,a),p=cross(r.direction,e2),det=dot(e1,p);
    if(Math.abs(det)<1e-8)return null;
    const t=sub(r.origin,a),u=dot(t,p)/det;if(u<0||u>1)return null;
    const q=cross(t,e1),v=dot(r.direction,q)/det;if(v<0||u+v>1)return null;
    const distance=dot(e2,q)/det;return distance>.1?distance:null;
  }
  function mesh(){
    const data=[],faces=[];
    function quad(a,b,c,d,m=metal,id=null,surface='wall',uv=null,pickable=true){
      const n=cross(sub(b,a),sub(c,a)),length=Math.hypot(...n)||1,normal=n.map(x=>x/length),axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
      const points=[a,b,c,d],tex=uv||points.map(p=>axis===1?[p[0]/180,p[2]/180]:axis===0?[p[2]/300,p[1]/235]:[p[0]/300,p[1]/235]);
      for(const i of [0,1,2,0,2,3])data.push(...points[i],...normal,...tex[i],...(m.color||[1,1,1]),m.kind||0,m.glow||0);
      if(pickable)faces.push({a,b,c,d,id,surface});
    }
    function box(x,y,z,w,h,d,m=metal,id=null,surface='wall'){
      const X=x+w,Y=y+h,Z=z+d;
      quad([x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z],m,id,surface);
      quad([X,y,z],[x,y,z],[x,Y,z],[X,Y,z],m,id,surface);
      quad([x,y,z],[x,y,Z],[x,Y,Z],[x,Y,z],m,id,surface);
      quad([X,y,Z],[X,y,z],[X,Y,z],[X,Y,Z],m,id,surface);
      quad([x,y,z],[X,y,z],[X,y,Z],[x,y,Z],m,id,surface);
      quad([x,Y,Z],[X,Y,Z],[X,Y,z],[x,Y,z],m,id,surface);
    }
    return {data,faces,quad,box};
  }
  function buildScene(doors,{dynamicDoors=false}={}){
    const scene=mesh(),{quad,box}=scene,signs=[];
    // Continuous faces run the full length. Door openings are actual holes.
    for(const side of [-1,1]){
      const holes=Object.entries(doors).filter(([id,d])=>d.floor===1&&Math.sign(d.x)===side&&Math.abs(d.x)>200).map(([id,d])=>({id,z:d.z})).sort((a,b)=>a.z-b.z);
      let cursor=-1810;
      function wall(from,to,top=-290,bottom=180){if(to-from<.1)return;quad([side*270,top,from],[side*270,top,to],[side*270,bottom,to],[side*270,bottom,from],metal);}
      for(const hole of holes){wall(cursor,hole.z-78);wall(hole.z-78,hole.z+78,-290,-65);cursor=hole.z+78;}
      wall(cursor,240);
      quad([side*270,-290,-1810],[side*270,-650,-2118],[side*270,-180,-2118],[side*270,180,-1810],metal);
      quad([side*270,-650,-2118],[side*270,-650,-2545],[side*270,-180,-2545],[side*270,-180,-2118],metal);
      // One continuous base channel, with a real return through every doorway.
      for(const [from,to] of [[-1810,240],[-2545,-2118]]){
        const up=from<-2100?360:0;
        box(side<0?-269:259,163-up,from,10,17,to-from,dark);
        box(side<0?-269:263,-274-up,from,6,10,to-from,trim);
      }
      for(let z=180;z>-1780;z-=300){
        if(holes.some(h=>Math.abs(h.z-z)<92))continue;
        box(side<0?-269:263,-282,z-4,6,446,8,trim);
        for(const y of [-250,-45,145])box(side<0?-262:258,y,z-3,4,5,6,pale);
      }
    }
    const floor={color:[.48,.60,.69],kind:1},ceiling={color:[.40,.51,.61],kind:1};
    quad([-270,180,240],[270,180,240],[270,180,-1810],[-270,180,-1810],floor,null,'floor');
    quad([-270,-290,-1810],[270,-290,-1810],[270,-290,240],[-270,-290,240],ceiling);
    quad([-270,-290,-1810],[270,-290,-1810],[270,-650,-2118],[-270,-650,-2118],ceiling);
    quad([-270,-180,-2118],[270,-180,-2118],[270,-180,-2545],[-270,-180,-2545],floor,null,'floor');
    quad([-270,-650,-2545],[270,-650,-2545],[270,-650,-2118],[-270,-650,-2118],ceiling);
    for(let i=0;i<14;i++){
      const y=180-(i+1)*360/14,z=-1810-i*22;
      box(-265,y,z-22,530,360/14,22,metal,'stairs','stairs');
      box(-264,y-.8,z-3,528,1.5,3,pale,'stairs','stairs');
    }
    // Return walls around the two end doors close every visible corner.
    for(const [z,top,bottom,width]of [[240,-290,180,156],[-2545,-650,-180,240]]){
      const doorTop=z>0?-65:-450;
      box(-270,top,z-2,(540-width)/2,bottom-top,4,metal);
      box(width/2,top,z-2,(540-width)/2,bottom-top,4,metal);
      box(-width/2,top,z-2,width,doorTop-top,4,metal);
    }
    function frameDoor(id,d){
      const wide=id==='central',w=wide?220:136,h=wide?260:235,bottom=180-(d.floor===2?360:0),top=bottom-h;
      const yaw=-d.yaw*Math.PI/180,right=[Math.cos(yaw),0,-Math.sin(yaw)],normal=[Math.sin(yaw),0,Math.cos(yaw)];
      const origin=[d.x,0,d.z],P=(u,y,n=0)=>[origin[0]+right[0]*u+normal[0]*n,y,origin[2]+right[2]*u+normal[2]*n];
      function panel(u1,y1,u2,y2,depth,m,tex=null){quad(P(u1,y1,depth),P(u2,y1,depth),P(u2,y2,depth),P(u1,y2,depth),m,id,'door',tex);}
      // Recessed double leaves, raised frame, real jamb depth and separate grips.
      if(!dynamicDoors)panel(-w/2-10,top-10,w/2+10,bottom,0,dark);
      for(const side of dynamicDoors?[]:[-1,1]){
        const lo=side<0?-w/2:-1,hi=side<0?-1:w/2;
        panel(lo,top,hi,bottom,2,{color:[.45,.57,.66],kind:1});
        panel(lo+9,top+13,hi-9,bottom-13,3,{color:[.52,.62,.68],kind:1});
        const x=side*(wide?16:11);panel(x-2,top+h*.46,x+2,top+h*.65,7,pale);
      }
      panel(-w/2-11,top-11,-w/2-2,bottom,9,trim);panel(w/2+2,top-11,w/2+11,bottom,9,trim);panel(-w/2-11,top-11,w/2+11,top-3,9,trim);
      for(const side of [-1,1])quad(P(side*(w/2+10),top-10,0),P(side*(w/2+10),top-10,10),P(side*(w/2+10),bottom,10),P(side*(w/2+10),bottom,0),trim,id,'door');
      panel(-w/2-8,top+35,-w/2-4,top+110,11,wide?amber:cyan);
      const row=signs.length;signs.push({label:d.name,sub:d.floor===2?'02 / CENTRAL CONTROL':'01 / RESEARCH FACILITY'});
      panel(-w/2-17,top-45,w/2+17,top-17,5,{color:[1,1,1],kind:2},[[0,row/8],[1,row/8],[1,(row+1)/8],[0,(row+1)/8]]);
    }
    for(const id of ['practice','storage','access','mirror','outside','central'])frameDoor(id,doors[id]);
    signs.push({label:'2F · 중앙관리실',sub:'STAIRWAY / AUTHORIZATION REQUIRED'});
    quad([-125,-278,-1805],[125,-278,-1805],[125,-248,-1805],[-125,-248,-1805],{color:[1,1,1],kind:2},'stairs','door',[[0,6/8],[1,6/8],[1,7/8],[0,7/8]]);
    for(const x of [-190,190]){
      box(x-13,-283,-1810,26,13,2050,dark);
      for(const dx of [-7,0,7])box(x+dx-1,-271,-1810,2,3,2050,trim);
      box(x-10,-643,-2545,20,11,427,dark);
    }
    const lights=[];
    for(let i=0;i<8;i++)lights.push({y:-284,z:80-i*260});
    for(const z of [-2220,-2440])lights.push({y:-644,z});
    for(const l of lights){
      box(-31,l.y,l.z-68,62,9,136,trim);
      box(-23,l.y+9,l.z-60,46,3,120,{color:[.68,.86,.91]});
    }
    // Loose floor plate is a solid object in the same coordinates as its trigger.
    box(-55,176,-125,110,4,120,trim,null,'floor');
    for(let x=-49;x<55;x+=22)box(x,175.3,-121,3,.7,112,dark,null,'floor');
    return {...scene,signs,lights};
  }
  // Sliding pocket leaves and a shallow room in the same world coordinates.
  function doorway(target,id,d,progress=0,preview=true){
    const wide=id==='central',w=wide?220:136,h=wide?260:235,bottom=180-(d.floor===2?360:0),top=bottom-h;
    const yaw=-d.yaw*Math.PI/180,right=[Math.cos(yaw),0,-Math.sin(yaw)],normal=[Math.sin(yaw),0,Math.cos(yaw)];
    const P=(u,y,n=0)=>[d.x+right[0]*u+normal[0]*n,y,d.z+right[2]*u+normal[2]*n];
    const panel=(a,b,c,e,n,m,uv)=>target.quad(P(a,b,n),P(c,b,n),P(c,e,n),P(a,e,n),m,id,'door',uv);
    for(const side of [-1,1]){
      const shift=side*w*.52*progress,lo=Math.max(-w/2,(side<0?-w/2:0)+shift),hi=Math.min(w/2,(side<0?0:w/2)+shift);
      if(hi-lo<.2)continue;
      panel(lo,top,hi,bottom,2,{color:[.45,.57,.66],kind:1});
      if(hi-lo>18)panel(lo+5,top+13,hi-5,bottom-13,3,{color:[.52,.62,.68],kind:1});
      const grip=side*(wide?16:11)+shift;if(grip-2>=lo&&grip+2<=hi)panel(grip-2,top+h*.46,grip+2,top+h*.65,7,pale);
    }
    if(progress<=0||!preview)return;
    const row={practice:0,storage:1,access:2,mirror:3,central:4}[id]??2;
    panel(-310,top-150,310,bottom,-470,{color:[.85,.9,.94],kind:5},[[0,row/5],[1,row/5],[1,(row+1)/5],[0,(row+1)/5]]);
    for(const side of [-1,1])target.quad(P(side*310,top-150,0),P(side*310,top-150,-470),P(side*310,bottom,-470),P(side*310,bottom,0),metal);
    target.quad(P(-310,bottom,0),P(310,bottom,0),P(310,bottom,-470),P(-310,bottom,-470),{color:[.48,.60,.69],kind:1},null,'floor');
    target.quad(P(-310,top-150,0),P(-310,top-150,-470),P(310,top-150,-470),P(310,top-150,0),metal);
    // Familiar silhouettes make the space beyond the open door identifiable.
    function crate(u,n,width,height,depth){
      const material={color:id==='central'?[.20,.29,.40]:[.58,.65,.63],kind:1,glow:.28};
      for(const [a,b] of [[0,1],[1,2],[2,3],[3,0]]){
        const corners=[[u-width/2,n],[u+width/2,n],[u+width/2,n-depth],[u-width/2,n-depth]],A=corners[a],B=corners[b];
        target.quad(P(A[0],bottom-height,A[1]),P(B[0],bottom-height,B[1]),P(B[0],bottom,B[1]),P(A[0],bottom,A[1]),material);
      }
      target.quad(P(u-width/2,bottom-height,n),P(u+width/2,bottom-height,n),P(u+width/2,bottom-height,n-depth),P(u-width/2,bottom-height,n-depth),material);
    }
    if(id==='storage'){crate(-155,-285,120,62,92);crate(125,-370,76,56,68);}
    if(id==='access'){crate(-200,-320,115,205,70);crate(180,-370,130,90,75);}
    if(id==='mirror'){for(const u of [-110,110])crate(u,-365,8,230,8);}
    if(id==='central'){crate(0,-420,115,155,65);panel(-32,top+50,32,top+100,-352,{color:[.4,.85,1],glow:1});}
    target.quad(P(-35,top-115,-200),P(35,top-115,-200),P(35,top-115,-310),P(-35,top-115,-310),{color:[.7,.9,1],glow:1});

  }
  function create(canvas,{model,state,onFallback=()=>{}}){
    const gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false});
    if(!gl)return null;
    let dead=false,raf=0,last=0,current=null,power=state.powerOut?0:1,shutter=state.barrierTriggered?1:0,keyOpen=state.keyboxOpen?1:0;
    const reduced=()=>root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;attribute vec3 aColor;attribute float aKind;attribute float aGlow;
      uniform vec3 uCamera;uniform vec2 uAngle;uniform vec2 uSize;uniform vec2 uOffset;uniform float uFocal;
      varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vColor;varying float vKind;varying float vGlow;varying float vDepth;
      void main(){vec3 p=aPosition-uCamera;float cy=cos(uAngle.x),sy=sin(uAngle.x),cp=cos(uAngle.y),sp=sin(uAngle.y);
        p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);p=vec3(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);
        gl_Position=vec4(p.x*2.*uFocal/uSize.x,-p.y*2.*uFocal/uSize.y-uOffset.y*p.z,-1.0004*p.z-2.0004,-p.z);
        vPosition=aPosition;vNormal=aNormal;vUV=aUV;vColor=aColor;vKind=aKind;vGlow=aGlow;vDepth=-p.z;}`;
    const fragment=`precision highp float;uniform sampler2D uMetal;uniform sampler2D uSigns;uniform sampler2D uRobot;uniform sampler2D uWalk;uniform sampler2D uRooms;
      uniform float uPower;uniform float uTime;uniform float uSpeaking;uniform vec3 uCamera;uniform vec3 uLights[10];
      varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUV;varying vec3 vColor;varying float vKind;varying float vGlow;varying float vDepth;
      void main(){vec4 tex=vec4(1.);vec3 color=vColor;float emission=vGlow;
        if(vKind>.5&&vKind<1.5){tex=texture2D(uMetal,vUV);color*=mix(vec3(.57,.65,.71),tex.rgb, .76)*1.48;
          vec2 g=abs(fract(vUV)-.5);float seams=smoothstep(.478,.496,max(g.x,g.y));color*=1.-seams*.38;}
        else if(vKind>1.5&&vKind<2.5){color=texture2D(uSigns,vUV).rgb;emission=.24;}
        else if(vKind>2.5&&vKind<4.5){tex=vKind<3.5?texture2D(uRobot,vUV):texture2D(uWalk,vUV);if(tex.a<.12)discard;color=tex.rgb;
          if(vKind<3.5){vec2 eyeA=vec2(.381,.294),eyeB=vec2(.634,.323);float blink=step(.13,mod(uTime,6.8));
            float eye=max(1.-smoothstep(.68,1.,length((vUV-eyeA)/vec2(.073,.063))),1.-smoothstep(.68,1.,length((vUV-eyeB)/vec2(.076,.062))));
            color=mix(color,vec3(.025,.045,.06),eye*(1.-blink));
            vec2 m=(vUV-vec2(.495,.352))/vec2(.032,.006+uSpeaking*(.004+.006*abs(sin(uTime*13.))));float mouth=1.-smoothstep(.7,1.,length(m));color=mix(color,vec3(.25,.91,1.),mouth);}
          emission=.22;}
        else if(vKind>4.5){color=texture2D(uRooms,vUV).rgb;emission=.75;}
        float illumination=mix(.20,.48,uPower),highlight=0.;vec3 n=normalize(vNormal),eye=normalize(uCamera-vPosition);
        for(int i=0;i<10;i++){vec3 delta=uLights[i]-vPosition;float d=length(delta),falloff=1./(1.+d*d/58000.);vec3 l=normalize(delta);
          illumination+=abs(dot(n,l))*falloff*mix(.008,.22,uPower);highlight+=pow(max(0.,abs(dot(n,normalize(l+eye)))),30.)*falloff*.065*uPower;}
        if(vKind>2.5&&vKind<4.5)illumination=max(illumination,.75);
        vec3 lit=color*mix(illumination,1.,emission)+vec3(.62,.82,.92)*highlight;
        float fog=smoothstep(450.,2700.,vDepth)*mix(.78,.56,uPower);lit=mix(lit,mix(vec3(.018,.035,.056),vec3(.065,.105,.145),uPower),fog);
        gl_FragColor=vec4(lit,1.);}`;
    const shaders=[],textures=[],images=[],buffers=[];
    function shader(type,source){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();
    try{gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}
    catch(error){shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);throw error;}
    gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.025,.045,.07,1);
    const uniforms={};for(const name of ['Camera','Angle','Size','Offset','Focal','Power','Time','Speaking','Lights'])uniforms[name]=gl.getUniformLocation(program,'u'+name+(name==='Lights'?'[0]':''));
    const attributes=[['Position',3],['Normal',3],['UV',2],['Color',3],['Kind',1],['Glow',1]].map(([name,size])=>({location:gl.getAttribLocation(program,'a'+name),size}));
    function texture(unit,path,repeat=false){
      const t=gl.createTexture();textures.push(t);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(unit>1?[0,0,0,0]:[105,125,140,255]));
      if(path){const img=new Image();images.push(img);img.onload=()=>{if(dead)return;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
        if(repeat){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}};
        img.onerror=()=>{if(!dead)onFallback('복도 그림을 불러오지 못했습니다. 새로고침해 주세요.');};img.src=path;}
      return t;
    }
    texture(0,'./assets/chapter2-metal-v1.webp',true);const signTexture=texture(1);texture(2,'./assets/b0-body-v3.webp');texture(3,'./assets/b0-walk-back-v1.webp');
    for(const [i,name]of ['Metal','Signs','Robot','Walk'].entries())gl.uniform1i(gl.getUniformLocation(program,'u'+name),i);
    const scene=buildScene(model.doors,{dynamicDoors:true}),dynamic=mesh();
    const roomTexture=texture(4),roomAtlas=document.createElement('canvas');roomAtlas.width=1024;roomAtlas.height=2560;const roomCtx=roomAtlas.getContext('2d');roomCtx.fillStyle='#314555';roomCtx.fillRect(0,0,1024,2560);
    function uploadRooms(){if(dead)return;gl.activeTexture(gl.TEXTURE0+4);gl.bindTexture(gl.TEXTURE_2D,roomTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,roomAtlas);}
    uploadRooms();gl.uniform1i(gl.getUniformLocation(program,'uRooms'),4);
    ['sf-practice-panorama-v1.webp','sf-cargo-wall-v1.webp','sf-access-wall-v1.webp','sf-optical-wall-v1.webp','chapter4-navy-wall-v1.webp'].forEach((file,row)=>{const img=new Image();images.push(img);img.onload=()=>{if(dead)return;roomCtx.drawImage(img,0,row*512,1024,512);uploadRooms();};img.src='./assets/'+file;});
    function signs(){
      if(dead)return;const c=document.createElement('canvas');c.width=1024;c.height=1024;const ctx=c.getContext('2d');
      for(let i=0;i<scene.signs.length;i++){const s=scene.signs[i],y=i*128;ctx.fillStyle='#152c3b';ctx.fillRect(0,y,1024,128);ctx.strokeStyle='#82979c';ctx.lineWidth=4;ctx.strokeRect(2,y+2,1020,124);ctx.fillStyle='#d3e9ed';ctx.textAlign='center';ctx.font='72px "B0 Digital", "Malgun Gothic", sans-serif';ctx.fillText(s.label,512,y+84);ctx.fillStyle='#8fa8b0';ctx.font='17px monospace';ctx.fillText(s.sub,512,y+112);}
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,signTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
    }
    signs();document.fonts?.ready.then(()=>signs());
    function buffer(data){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;}
    const staticBuffer=buffer(scene.data),movingBuffer=buffer([]);
    function draw(b,count){gl.bindBuffer(gl.ARRAY_BUFFER,b);let offset=0;for(const a of attributes){gl.enableVertexAttribArray(a.location);gl.vertexAttribPointer(a.location,a.size,gl.FLOAT,false,52,offset*4);offset+=a.size;}gl.drawArrays(gl.TRIANGLES,0,count/13);}
    function buildDynamic(time){
      dynamic.data.length=0;dynamic.faces.length=0;const {box,quad}=dynamic;
      for(const id of ['practice','storage','access','mirror','outside','central'])doorway(dynamic,id,model.doors[id],current?.passage?.id===id?current.passage.open:0,!current?.portal);
      if(!state.cleared.storage){
        const y=-290-(1-shutter)*490;
        box(-269,y,-613,538,470,8,{color:[.32,.42,.49],kind:1},'shutter');
        for(let yy=y+10;yy<y+470;yy+=27)box(-264,yy,-603,528,5,3,trim,'shutter');
      }
      if(!state.cleared.mirror){
        dynamic.faces.push({a:[-263,-289,-1510],b:[263,-289,-1510],c:[263,180,-1510],d:[-263,180,-1510],id:'glass',surface:'wall'});
        for(const x of [-263,259])box(x,-289,-1510,4,469,8,trim,'glass');
        box(-263,-289,-1510,526,9,8,trim,'glass');box(-263,170,-1510,526,10,8,trim,'glass');
        for(const x of [-89,87])box(x,-285,-1510,3,460,3,{color:[.37,.55,.64]},'glass');
        // Sparse diagonal highlights leave the stairwell visible beyond the glazing.
        for(let y=-250;y<150;y+=80)quad([-255,y,-1509],[255,y-65,-1509],[255,y-63,-1509],[-255,y+2,-1509],{color:[.16,.27,.34],glow:.2},'glass');
      }
      // Key cabinet mounted flush against the same wall mesh.
      box(-268,-60,-1677,14,110,74,dark,'keybox');
      if(!state.keyTaken){box(-250,-10,-1647,3,10,15,{color:[.85,.68,.29]},'keybox');box(-250,-6,-1653,3,3,32,{color:[.85,.68,.29]},'keybox');}
      const a=keyOpen*1.9,base=-1676,tip=base+72*Math.cos(a),tipX=-250+72*Math.sin(a);
      quad([-250,-58,base],[tipX,-58,tip],[tipX,48,tip],[-250,48,base],{color:[.58,.69,.74],kind:1},'keybox');
      box(-268,5,-1774,12,88,68,dark,'stair-control');box(-254,12,-1767,3,28,54,state.stairsUnlocked?cyan:amber,'stair-control');box(-254,49,-1745,4,21,5,pale,'stair-control');
      if(canvas.parentElement.classList.contains('stair-repel')){
        for(let y=-280;y<180;y+=22)quad([-262,y,-1806],[262,y,-1806],[262,y+2,-1806],[-262,y+2,-1806],amber,'stairs');
      }
      for(const l of scene.lights)box(-16,l.y+12.1,l.z-52,32,.8,104,{color:power>.03?[.62+.32*power,.76+.24*power,.85+.15*power]:[.12,.18,.23],glow:power});
      if(current){
        const c=current.companion,ground=model.groundAt(c.z),theta=-current.camera.yaw*Math.PI/180,right=[Math.cos(theta),0,-Math.sin(theta)];
        const moving=current.walking,w=104,h=156,bob=moving?Math.sin(time*9)*2:0,top=180-ground-h+bob,bottom=180-ground+bob;
        const p=(x,y)=>[c.x+right[0]*x,y,c.z+right[2]*x];
        const frame=moving&&!reduced()?Math.floor(time/.36)%2:0,uv=moving?[[frame*.5,0],[(frame+1)*.5,0],[(frame+1)*.5,1],[frame*.5,1]]:null;
        quad(p(-w/2,top),p(w/2,top),p(w/2,bottom),p(-w/2,bottom),{color:[1,1,1],kind:moving?4:3},null,'robot',uv||[[0,0],[1,0],[1,1],[0,1]],false);
      }
    }
    function render(now){
      if(dead||!current)return;const dt=Math.min(.05,(now-last)/1000||.016);last=now;
      const targetPower=current.lit?1:0;power+=Math.sign(targetPower-power)*Math.min(Math.abs(targetPower-power),dt/(reduced()?.01:2.3));
      const targetShutter=state.barrierTriggered?1:0;shutter+=Math.sign(targetShutter-shutter)*Math.min(Math.abs(targetShutter-shutter),dt/(reduced()?.01:1.2));
      const targetKey=state.keyboxOpen?1:0;keyOpen+=Math.sign(targetKey-keyOpen)*Math.min(Math.abs(targetKey-keyOpen),dt/(reduced()?.01:.5));
      const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(current.portal?4:(root.devicePixelRatio||1),current.portal?4:1.5,1600/Math.max(w,h)),width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      const c=current.camera,f=current.portal?.focal??Math.min(w*.65,h*.6)*c.zoom;
      gl.uniform3f(uniforms.Camera,c.x,-c.height,c.z);gl.uniform2f(uniforms.Angle,c.yaw*Math.PI/180,c.pitch*Math.PI/180);gl.uniform2f(uniforms.Size,w,h);gl.uniform1f(uniforms.Focal,f);
      gl.uniform2f(uniforms.Offset,0,current.portal?.offsetY||0);
      gl.uniform1f(uniforms.Power,power);gl.uniform1f(uniforms.Time,now/1000);gl.uniform1f(uniforms.Speaking,current.speaking?1:0);gl.uniform3fv(uniforms.Lights,new Float32Array(scene.lights.flatMap(l=>[0,l.y+24,l.z])));
      draw(staticBuffer,scene.data.length);buildDynamic(now/1000);gl.bindBuffer(gl.ARRAY_BUFFER,movingBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dynamic.data),gl.DYNAMIC_DRAW);draw(movingBuffer,dynamic.data.length);
      raf=requestAnimationFrame(render);
    }
    function pick(x,y){
      if(!current)return null;buildDynamic(performance.now()/1000);
      const w=canvas.clientWidth,h=canvas.clientHeight,c=current.camera,r=ray(c,x,y,w,h,Math.min(w*.65,h*.6)*c.zoom);
      let best=null,nearest=Infinity;
      for(const face of [...scene.faces,...dynamic.faces]){const t=intersect(r,face.a,face.b,face.c)??intersect(r,face.a,face.c,face.d);if(t!==null&&t<nearest){nearest=t;best={id:face.id,surface:face.surface,distance:t};}}
      return best;
    }
    const lost=e=>{e.preventDefault();if(!dead){cancelAnimationFrame(raf);onFallback('복도 그래픽 연결이 중단되어 기본 보기로 전환했습니다. 진행은 유지됩니다.');}};
    canvas.addEventListener('webglcontextlost',lost);
    return {update(camera,companion,options){current={...current,camera:{...camera},companion:{...companion},...options};if(!raf)raf=requestAnimationFrame(render);},pick,
      dispose(){dead=true;cancelAnimationFrame(raf);canvas.removeEventListener('webglcontextlost',lost);images.forEach(i=>{i.onload=i.onerror=null;});buffers.forEach(b=>gl.deleteBuffer(b));textures.forEach(t=>gl.deleteTexture(t));shaders.forEach(s=>gl.deleteShader(s));gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
  }
  const api={create,ray,intersect,buildScene,doorway};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.B0LabWebGL=api;
})(typeof window!=='undefined'?window:globalThis);
