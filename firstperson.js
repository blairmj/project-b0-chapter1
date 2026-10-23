"use strict";

// Static, first-person chapter. B-0 owns the note but has not checked his compartment.
const SAVE_KEY = "project-b0-firstperson-v4";
const app = document.querySelector("#app");
const intro = [
  ["student", "넌, 넌 누구야?"],
  ["robot", "저는 AI 로봇 B-0입니다."],
  ["student", "여긴 어디야?"],
  ["robot", "여기는 폐쇄된 AI 교육 연구소입니다."],
  ["student", "여기서 어떻게 나가?"],
  ["robot", "저도 모릅니다. 나가는 길을 찾아보면 되지 않을까요?"],
  ["thought", "AI 로봇이라더니… 왜 그것도 모르는 거야?"],
  ["robot", "제가 모른다고 해서 실망하셨나요?"],
  ["robot", "저는 아직 이곳의 출입 방법을 확인하지 못했습니다."],
  ["robot", "먼저 출입구를 살펴볼까요?"]
];
const fresh = () => ({ phase:"intro", line:0, guide:false, noteFound:false, noteTaken:false,
  unlocked:false, attempts:0, muted:false, logs:[] });
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!d || !["intro","room","escaped"].includes(d.phase)) return null;
    return {...fresh(),...d,line:Math.max(0,Math.min(intro.length-1,Number(d.line)||0)),logs:Array.isArray(d.logs)?d.logs:[]};
  } catch { return null; }
}
let state = load() || fresh(), target = "", moving = false, token = 0, timer, speechTimer, audio, lastFocus;
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const btn = (s,a,c="",attrs="") => `<button type="button" data-action="${a}" class="${c}" ${attrs}>${s}</button>`;
function save(kind,text) { if(kind)state.logs.push({kind,text,time:new Date().toISOString()});try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch{} }
function tone(ok=true) {
  if(state.muted)return;
  try { audio ||= new (window.AudioContext||window.webkitAudioContext)();void audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=ok?720:220;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.18);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.18); }catch{}
}
function dialogue(who,text) { return `<div class="speech ${who}"><b>${who==="robot"?"B-0":who==="thought"?"속마음":"나"}</b><p>${esc(text)}</p></div>`; }
function boot() {
  if(state.phase==="intro") opening();
  else {
    app.innerHTML=`<main class="awakening resume"><div class="face" role="img" aria-label="눈앞을 가득 채운 B-0의 얼굴"></div><div class="wake-controls"><p class="chapter-label">PROJECT B-0 · 깨어난 실습실</p>${dialogue("robot","다시 만났네요.")}<div class="resume-actions">${btn(state.phase==="escaped"?"탈출 기록 보기":"이어서 탐색","continue","primary")}${btn("처음부터","restart","secondary")}</div></div></main>`;
  }
}
function opening() {
  token++;clearTimeout(timer);clearTimeout(speechTimer);target="";moving=false;
  app.innerHTML=`<main class="awakening${state.line===0?" waking":""}"><div class="face" role="img" aria-label="잠에서 깨어나 처음 마주한 B-0의 얼굴"></div><div class="eyelids" aria-hidden="true"></div><div class="wake-controls"><div class="intro-speech"></div>${btn("다음","next","next")}</div></main>`;
  renderIntro();
}
function renderIntro() {
  const line=intro[state.line];app.querySelector(".intro-speech").innerHTML=dialogue(...line);
  app.querySelector('[data-action="next"]').textContent=state.line===intro.length-1?"주변 둘러보기":"다음";
  save();
}
const places={door:{name:"출입문",origin:"38% 40%",scale:1.55},lock:{name:"도어락",origin:"55% 44%",scale:2},map:{name:"벽면 안내도",origin:"13% 34%",scale:1.7},robot:{name:"B-0",origin:"79% 75%",scale:1.35},terminal:{name:"단말기",origin:"65% 52%",scale:1.6}};
function enterRoom() {
  token++;clearTimeout(timer);clearTimeout(speechTimer);target="";moving=false;
  app.innerHTML=`<main class="game"><header><h1>교육 실습실</h1>${btn("메뉴","menu","quiet")}</header><section class="scene" aria-label="나의 시선으로 보는 교육 실습실"><div class="world${state.unlocked?" unlocked":""}"><div class="background" role="img" aria-label="기존 교육 실습실 배경"></div>
    <div class="door-art" aria-hidden="true"><div class="device door-left"></div><div class="device door-right"></div></div><span class="lock-led" aria-hidden="true"></span>
    <div class="device terminal-art" aria-hidden="true"></div><div class="device map-art" aria-hidden="true"></div><div class="device light-art" aria-hidden="true"></div>
    <div class="robot-sprite" role="img" aria-label="함께 있는 AI 로봇 B-0"></div>
    <div class="targets">${Object.entries(places).map(([id,p])=>btn("",`approach-${id}`,`target target-${id}`,`aria-label="${p.name} 쪽으로 다가가기"`)).join("")}</div></div>
    <div class="approach-controls" hidden>${btn("방 전체 보기","back","secondary")}${btn("살펴보기","inspect","primary")}</div><div class="room-speech" aria-live="polite" hidden></div><div class="arrival sr-only" role="status"></div>
    </section><footer>${btn("소지품 <span class=\"item-count\">"+(state.noteTaken?"1":"0")+"</span>","inventory","secondary")}<span class="room-goal">${state.unlocked?"잠금 해제":state.guide?"비상 출입번호 찾기":""}</span></footer></main>`;
  if(state.phase==="escaped")ending();
}
function roomSpeech(who,text) {const el=app.querySelector(".room-speech");if(!el)return;clearTimeout(speechTimer);el.innerHTML=dialogue(who,text);el.hidden=false;speechTimer=setTimeout(()=>{el.hidden=true;},4800);}
function approach(id) {
  if(!places[id]||app.querySelector("dialog"))return;
  clearTimeout(timer);clearTimeout(speechTimer);const ticket=++token;target=id;moving=true;
  app.querySelector(".room-speech").hidden=true;app.querySelector(".approach-controls").hidden=true;
  const world=app.querySelector(".world");world.style.transformOrigin=places[id].origin;world.style.transform=`scale(${places[id].scale})`;
  app.querySelector(".targets").classList.add("inactive");
  timer=setTimeout(()=>{if(ticket!==token)return;moving=false;app.querySelector(".approach-controls").hidden=false;app.querySelector('[data-action="inspect"]').textContent=id==="robot"?"B-0와 이야기하기":"살펴보기";app.querySelector(".arrival").textContent=places[id].name+" 앞에 도착했습니다.";},window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:600);
}
function back() {
  token++;clearTimeout(timer);moving=false;target="";const w=app.querySelector(".world");if(!w)return;w.style.transform="scale(1)";
  app.querySelector(".targets").classList.remove("inactive");app.querySelector(".approach-controls").hidden=true;app.querySelector(".arrival").textContent="방 전체를 둘러봅니다.";
}
function modal(title,content,kind="") {
  const previous=app.querySelector("dialog");if(!previous)lastFocus=document.activeElement;previous?.remove();
  const d=document.createElement("dialog");d.className="modal "+kind;d.innerHTML=`<div class="modal-header"><h2>${title}</h2>${btn("닫기","close","quiet")}</div><div class="modal-body">${content}</div>`;app.append(d);d.addEventListener("close",()=>{d.remove();if(lastFocus?.isConnected)lastFocus.focus();});d.showModal();
}
function inspect() {
  if(moving||!target)return;
  if(target==="door")door();
  if(target==="lock")lock();
  if(target==="map")guide();
  if(target==="robot")robot();
  if(target==="terminal")modal("꺼진 단말기",`<p>화면에 전원이 들어오지 않는다.</p>${dialogue("robot","이 단말기는 작동하지 않습니다.")}${btn("돌아가기","close","secondary wide")}`);
}
function door(tried=false) {
  if(state.unlocked){modal("잠금이 풀린 출입문",`<p>잠금 표시가 초록색이다. 손잡이를 돌릴 수 있다.</p>${btn("문을 열고 나가기","escape","primary wide")}`);return;}
  modal("출입문",`<div class="door-detail" aria-hidden="true"><div class="device"></div></div><p>${tried?"손잡이를 돌려도 문이 열리지 않는다.":"닫힌 출입문이다. 옆에 숫자 도어락이 달려 있다."}</p>${tried?dialogue("robot","문 옆에 도어락이 있습니다."):""}<div class="action-row">${btn("손잡이 돌려보기","handle","secondary")}${btn("도어락 살펴보기","lock","primary")}</div>`);
}
function guide() {
  state.guide=true;save("발견","벽면 안내도의 비상 출입 지침");app.querySelector(".room-goal").textContent=state.unlocked?"잠금 해제":"비상 출입번호 찾기";
  modal("벽면 안내도",`<div class="map-detail" role="img" aria-label="기존 벽면 안내도 확대"><div class="device"></div></div><div class="notice-paper"><h3>비상 출입 안내</h3><p>출입 시스템 정지 시<br>관리용 쪽지의 비밀번호를 사용하십시오.</p></div>${dialogue("student","비밀번호가 적힌 쪽지가 있다는 거네.")}${btn("방으로 돌아가기","close","primary wide")}`);
}
function robot() {
  const art=`<div class="robot-detail${state.noteFound&&!state.noteTaken?" found":""}" role="img" aria-label="B-0와 가슴 아래 보관함"><div class="robot-sprite"></div></div>`;
  if(state.noteTaken){modal("B-0",`${art}${dialogue("robot","쪽지는 건네드렸습니다. 소지품에서 다시 볼 수 있어요.")}${btn("비밀번호 쪽지 보기","note","primary wide")}`);return;}
  if(state.noteFound){modal("B-0의 보관함",`${art}${dialogue("robot","제 보관함에 들어 있었습니다. 확인하기 전에는 몰랐네요.")}${btn("쪽지 받기","take-note","primary wide")}`);return;}
  modal("B-0",`${art}${dialogue("robot",state.guide?"관리용 쪽지 말인가요? 아직 본 기억은 없습니다.":"어떤 것을 확인해 볼까요?")}<div class="options">${state.guide?btn("네가 갖고 있는 건 없어?","ask-note","secondary"):""}${btn("네 보관함을 살펴봐도 돼?","ask-storage","secondary")}${btn("방을 더 둘러볼게","close","quiet")}</div>`);
}
function askStorage() { modal("B-0의 보관함",`${dialogue("student",state.guide?"네 보관함도 확인해 볼까?":"몸에 보관함이 있네. 안에 뭐가 있어?")}${dialogue("robot","안쪽은 아직 확인하지 않았습니다. 열어 보겠습니다.")}<div class="robot-detail thinking" aria-hidden="true"><div class="robot-sprite"></div></div>${btn("보관함 열어 보기","open-storage","primary wide")}`); }
function openStorage() { state.noteFound=true;save("발견","B-0가 확인하지 않았던 보관함에서 관리용 쪽지 발견");tone();robot(); }
function noteMarkup() {return '<div class="password-note"><small>관리용 쪽지</small><h3>비상 출입번호</h3><strong>4732</strong><p>사용 후 보관함에 넣어 두십시오.</p></div>';}
function showNote() { if(!state.noteTaken)return;modal("비밀번호 쪽지",`${noteMarkup()}${dialogue("student","찾았다! 이 번호로 해보자.")}${btn("쪽지 보관하고 돌아가기","close","primary wide")}`); }
function inventory() {modal("소지품",state.noteTaken?`${noteMarkup()}<p class="muted">B-0의 보관함에서 받은 쪽지.</p>`:'<p>아직 가지고 있는 물건이 없다.</p>');}
function lock() {
  if(state.unlocked){door();return;}
  modal("출입문 도어락",`<div class="keypad"><label for="code">비밀번호 네 자리</label><input id="code" name="code" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" aria-describedby="lock-status" placeholder="— — — —"><div class="keys">${[1,2,3,4,5,6,7,8,9].map(n=>btn(n,"digit-"+n,"key")).join("")}${btn("지우기","erase","key small")}${btn("0","digit-0","key")}${btn("확인","submit-code","key primary")}</div><p id="lock-status" role="status">비밀번호를 입력하십시오.</p></div>${state.noteTaken?`<details class="note-peek"><summary>가진 쪽지 보기</summary>${noteMarkup()}</details>`:""}`,"lock-modal");
}
function submitCode(value) {
  const code=value===undefined?app.querySelector("#code").value:String(value),status=app.querySelector("#lock-status");
  if(!/^\d{4}$/.test(code)){status.textContent="숫자 네 자리를 입력하십시오.";return;}
  state.attempts++;save("입력",code);
  if(code!=="4732"){tone(false);status.textContent="번호가 일치하지 않습니다.";app.querySelector("#code").select();return;}
  state.unlocked=true;save("잠금 해제","4732 입력");tone();app.querySelector(".world").classList.add("unlocked");app.querySelector(".room-goal").textContent="잠금 해제";
  modal("잠금 해제",`<p>딸깍. 문 안쪽에서 걸쇠가 풀리는 소리가 난다.</p>${btn("손잡이를 돌려 문 열기","escape","primary wide")}`);
}
function ending() {
  modal("문 너머",`<p class="story">문이 열리고, 어두운 복도가 모습을 드러낸다.</p>${dialogue("student","너도 같이 가는 거지?")}${dialogue("robot","네. 함께 출구를 찾아보겠습니다.")}<p class="axiom">AXIOM<br>“교육 실습실 이탈 감지. B-0, 현재 위치를 유지하십시오.”</p><small class="muted">1차시 완료 · 다음 공간은 아직 제작 중입니다.</small>${btn("처음부터 다시 보기","restart","secondary wide")}`,"ending");
}
function menu() {modal("메뉴",`<p>진행은 이 기기에 자동 저장됩니다.</p><div class="options">${btn("계속 탐색","close","primary")}${btn(state.muted?"효과음 켜기":"효과음 끄기","sound","secondary")}${btn("막혔을 때 생각거리","hint","secondary")}${btn("수업 안내","teacher","secondary")}${btn("처음부터 다시 보기","restart","quiet")}</div>`);}
function handle(a) {
  if(a==="close"){app.querySelector("dialog")?.close();return;}
  if(a==="next"){if(state.line<intro.length-1){state.line++;renderIntro();}else{state.phase="room";save("도입","B-0와 만나 탐색 시작");enterRoom();}return;}
  if(a==="continue"){enterRoom();return;}
  if(a==="restart"){modal("처음부터 다시 볼까요?",`<p>이번 버전의 진행만 새로 시작합니다.</p>${btn("처음부터 시작","new","primary wide")}`);return;}
  if(a==="new"){state=fresh();save();opening();return;}
  if(a.startsWith("approach-")){approach(a.slice(9));return;}
  if(a==="back"){back();return;}
  if(a==="inspect"){inspect();return;}
  if(a==="handle"){door(true);return;}
  if(a==="lock"){lock();return;}
  if(a==="ask-note"||a==="ask-storage"){askStorage();return;}
  if(a==="open-storage"){openStorage();return;}
  if(a==="take-note"){state.noteTaken=true;save("획득","B-0에게 비상 출입번호 쪽지 받음");app.querySelector(".item-count").textContent="1";showNote();return;}
  if(a==="note"){showNote();return;}
  if(a==="inventory"){inventory();return;}
  if(a.startsWith("digit-")){const input=app.querySelector("#code");if(input.value.length<4)input.value+=a.slice(6);return;}
  if(a==="erase"){const input=app.querySelector("#code");input.value=input.value.slice(0,-1);return;}
  if(a==="submit-code"){submitCode();return;}
  if(a==="escape"&&state.unlocked){state.phase="escaped";save("탈출","B-0와 함께 출입문을 열고 나감");app.querySelector(".world").classList.add("door-open");ending();return;}
  if(a==="menu"){menu();return;}
  if(a==="sound"){state.muted=!state.muted;save();menu();return;}
  if(a==="hint"){modal("생각거리",`<p>${state.noteTaken?"쪽지에 적힌 번호를 문 옆 도어락에 입력할 수 있어요.":state.guide?"방 안의 물건뿐 아니라 함께 있는 B-0도 살펴봤나요?":"벽에 붙은 안내도에 출입 방법이 적혀 있을 수 있어요."}</p>`);return;}
  if(a==="teacher"){modal("1차시 · 첫 만남",'<p>초등 고학년용 탐색 도입. AI도 확인하지 않은 정보는 모를 수 있으며, 사람과 함께 정보를 찾아 문제를 해결한다는 경험.</p><p>플레이: 출입문·안내도 탐색 → B-0의 보관함 확인 → 쪽지 획득 → 도어락 입력 → 탈출. 순서 강제 없음.</p><p>수업 대화: B-0는 쪽지를 갖고 있었는데 왜 몰랐을까요? 모른다고 했을 때 함께 무엇을 확인했나요?</p><small>정해진 게임 규칙으로 동작하며 실제 AI나 얼굴 인식은 사용하지 않습니다. 기록은 이 기기에만 저장됩니다.</small>');}
}
app.addEventListener("click",e=>{const b=e.target.closest("button[data-action]");if(b&&!b.disabled)handle(b.dataset.action);});
app.addEventListener("keydown",e=>{if(e.target.id==="code"&&e.key==="Enter"){e.preventDefault();submitCode();}});
boot();
