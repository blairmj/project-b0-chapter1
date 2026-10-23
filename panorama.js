"use strict";
// One continuous spherical texture, sampled through the same camera as the interactive objects.
function createRoomPanorama(canvas, report) {
  const gl=canvas.getContext("webgl",{alpha:false,antialias:false,depth:false});
  if(!gl){report("이 브라우저에서는 360도 배경을 표시할 수 없습니다. 최신 브라우저로 열어 주세요.");return {view(){},dispose(){}};}
  const vertex="attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}";
  const fragment=`precision highp float;
    uniform sampler2D room;uniform vec2 resolution;uniform float focal;uniform vec2 angle;
    void main(){
      vec3 d=vec3((gl_FragCoord.x-resolution.x*.5)/focal,(resolution.y*.5-gl_FragCoord.y)/focal,-1.);
      float cp=cos(angle.y),sp=sin(angle.y),cy=cos(angle.x),sy=sin(angle.x);
      d=vec3(d.x,cp*d.y+sp*d.z,-sp*d.y+cp*d.z);
      d=normalize(vec3(cy*d.x-sy*d.z,d.y,sy*d.x+cy*d.z));
      vec2 uv=vec2(fract(.5+atan(d.x,-d.z)/6.28318530718-.078),.5+asin(clamp(d.y,-1.,1.))/3.14159265359);
      vec3 a=texture2D(room,uv).rgb;
      // Matching plain-metal wrap margins share the exact same edge color.
      float seam=.5*(1.-smoothstep(0.,.018,min(uv.x,1.-uv.x)));
      vec3 b=texture2D(room,vec2(1.-uv.x,uv.y)).rgb;
      gl_FragColor=vec4(mix(a,b,seam),1.);
    }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([28,44,58]));
  const locations={resolution:gl.getUniformLocation(program,"resolution"),focal:gl.getUniformLocation(program,"focal"),angle:gl.getUniformLocation(program,"angle")};
  let yaw=0,pitch=-5,dead=false,ready=false,cameraFocal=240;
  const img=new Image();
  function view(x,y,f=cameraFocal){
    if(dead||gl.isContextLost())return;yaw=x;pitch=y;cameraFocal=f;
    const ratio=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.useProgram(program);
    gl.uniform2f(locations.resolution,w,h);gl.uniform1f(locations.focal,cameraFocal*ratio);gl.uniform2f(locations.angle,yaw*Math.PI/180,pitch*Math.PI/180);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if(ready)canvas.classList.add("ready");
  }
  img.onload=()=>{if(dead)return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);ready=true;view(yaw,pitch);};
  img.onerror=()=>{if(!dead)report("방 배경을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");};
  img.src="./assets/room-panorama-v2.webp";
  const lost=e=>{e.preventDefault();if(!dead)report("화면 연결이 중단되었습니다. 페이지를 새로고침해 주세요. 진행은 저장되어 있습니다.");};
  canvas.addEventListener("webglcontextlost",lost);
  return {view,dispose(){dead=true;img.onload=null;img.onerror=null;canvas.removeEventListener("webglcontextlost",lost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}};
}
