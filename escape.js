"use strict";

// One room, three independent clues, one lock. Static rules; no remote AI.
const KEY = "project-b0-escape-v3";
const app = document.querySelector("#app");
const initial = () => ({ clues: [], drawer: false, flipped: false, originalSeen: false, readByB0: false,
  corrected: false, unlocked: false, escaped: false, attempts: 0, hints: 0,
  muted: false, x: 44, y: 87, logs: [] });
function readSave() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (!v || !Array.isArray(v.clues)) return null;
    return { ...initial(), ...v, clues: v.clues.filter(k => ["key", "order", "card"].includes(k)),
      x: Math.max(12, Math.min(88, Number(v.x) || 44)), y: Math.max(65, Math.min(90, Number(v.y) || 87)) };
  } catch { return null; }
}
let state = readSave() || initial();
let roomActive = false, near = "", moving = false, moveToken = 0;
let moveTimer, talkTimer, audio;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const button = (label, action, cls = "", attrs = "") => `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${label}</button>`;
function log(kind, text) {
  if (kind) state.logs.push({ kind, text, time: new Date().toISOString() });
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Optional local save. */ }
}
function chime(ok = true) {
  if (state.muted) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.frequency.value = ok ? 680 : 240; gain.gain.setValueAtTime(.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .18);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .18);
  } catch { /* Optional sound. */ }
}
const locations = {
  door: { name: "출입문", x: 50, y: 66, art: `<svg viewBox="0 0 150 230"><path d="M8 226V8h134v218" fill="#728590" stroke="#354751" stroke-width="10"/><path class="door-leaf" d="M21 21h108v205H21z" fill="#b9c7cb" stroke="#526672" stroke-width="3"/><path d="M39 44h72v53H39z" fill="#4b6671"/><path d="M46 51h58v39H46z" fill="#304852"/><rect x="101" y="123" width="18" height="35" rx="4" fill="#415762"/><circle class="door-led" cx="110" cy="131" r="3" fill="#d49076"/><path d="M105 144h10" stroke="#dce6e5" stroke-width="3"/></svg>` },
  wall: { name: "벽의 액자", x: 18, y: 66, art: `<svg viewBox="0 0 140 110"><rect x="7" y="8" width="126" height="94" rx="3" fill="#9b8470"/><rect x="15" y="16" width="110" height="78" fill="#e6dfcb"/><path d="M31 72V47h23v25m9 0V36h20v36m9 0V27h16v45" fill="none" stroke="#8b978d" stroke-width="5"/><path d="M30 82h79" stroke="#b2b2a3" stroke-width="2"/></svg>` },
  cabinet: { name: "수납장", x: 78, y: 77, art: `<svg viewBox="0 0 150 180"><path d="M12 12h126v151H12z" fill="#718793" stroke="#415763" stroke-width="5"/><path d="M20 23h110v53H20z" fill="#344f5d"/><path d="M29 31h16v37H29z" fill="#d1b88c"/><path d="M50 38h14v30H50z" fill="#9cbaae"/><path d="M72 29h18v39H72z" fill="#aab9c2"/><path d="M21 87h108v30H21zm0 37h108v30H21z" fill="#9bafb8" stroke="#536d7a" stroke-width="2"/><path d="M65 101h21m-21 38h21" stroke="#405966" stroke-width="4"/><path d="M23 164v12m105-12v12" stroke="#405966" stroke-width="7"/></svg>` },
  desk: { name: "책상", x: 29, y: 86, art: `<svg viewBox="0 0 220 140"><path d="M20 47v82m174-82v82" stroke="#5b6c70" stroke-width="12"/><path d="M12 25h181l18 27H3z" fill="#c6ae88" stroke="#786d5e" stroke-width="3"/><path d="M3 52h208v12H3z" fill="#927c62"/><path d="m71 19 60 2 9 23-65-2z" fill="#eee6d0" stroke="#c6bdab"/><path d="m164 18 12-1 3 22-13 1z" fill="#778f91"/></svg>` }
};
const evidence = {
  key: { title: "수납장 속 기호표", html: '<div class="symbol-pairs"><span>○ <b>2</b></span><span>★ <b>6</b></span></div>', text: "서로 다른 기호 옆에 숫자가 적혀 있다." },
  order: { title: "액자 속 배열", html: '<div class="symbol-sequence">★ <span>→</span> ○ <span>→</span> △</div>', text: "왼쪽에서 오른쪽으로 세 기호가 이어진다." },
  card: { title: "책상 위 기록 카드", html: "", text: "앞면이 번진 오래된 카드. 뒷면에도 인쇄된 흔적이 있다." }
};
function cardArt(back = state.flipped) {
  if (back) return '<div class="paper card-back"><small>보관용 원본 · 삼각형</small><div class="symbol-pairs">△ <b>3</b></div><small>앞면 전사 기록과 대조할 것</small></div>';
  return '<div class="paper"><small>전사 기록</small><div class="blurred-record"><span>△</span><span class="damaged-digit" aria-label="잉크가 번져 3과 8을 구별하기 어려운 숫자">3<i></i></span></div><small>잉크가 번져 숫자가 분명하지 않다.</small></div>';
}
function title() {
  roomActive = false; moveToken++; clearTimeout(moveTimer); clearTimeout(talkTimer);
  app.innerHTML = `<main class="title-screen"><p class="eyebrow">PROJECT B-0 · 1차시</p><h1>흐릿한 기록</h1><div class="title-robot robot-sprite" role="img" aria-label="B-0"></div><p>잠긴 실습실. 흩어진 기록들.<br>문밖에서 누군가의 신호가 들린다.</p><div class="title-actions">${button(readSave() ? "이어서 탐색" : "실습실에서 깨어나기", "start", "primary")}${readSave() ? button("새로 시작", "reset", "quiet") : ""}${button("프롤로그 보기", "prologue", "quiet")}</div></main>`;
}
function enterRoom() {
  roomActive = true; moving = false; near = ""; moveToken++;
  app.innerHTML = `<main class="game"><header><div><small>PROJECT B-0 · 01</small><h1>기록 실습실</h1></div>${button("메뉴", "menu", "quiet")}</header>
    <section class="scene${state.unlocked ? " unlocked" : ""}" aria-label="실습실. 물건이나 바닥을 눌러 이동" tabindex="0"><div class="wall-plane"></div><div class="floor-plane"></div><div class="baseboard"></div>
      ${Object.entries(locations).map(([key,v]) => `<button class="furniture ${key}" data-action="go-${key}" aria-label="${v.name}으로 이동">${v.art}</button>`).join("")}
      <div class="walk-marker" aria-hidden="true"></div><div class="student actor" role="img" aria-label="학생"></div><div class="robot actor" role="img" aria-label="B-0"><div class="robot-sprite"></div></div>
      <div class="near-action"></div><div class="arrival" role="status" aria-live="polite"></div>
      <div class="room-bubble" aria-live="polite" hidden></div>
    </section><footer>${button('단서 수첩 <span class="clue-count">' + state.clues.length + '</span>', "notebook", "notebook-button")}<span class="footer-note">주변을 둘러보세요</span></footer></main>`;
  placeActors();
  if (state.escaped) showEnding();
  else if (!state.logs.length) { log("시작", "기록 실습실에서 깨어남"); speak("student", "문이 잠겼어. 이 방에 나갈 방법이 있을까?"); }
}
function placeActors() {
  const student = app.querySelector(".student"), robot = app.querySelector(".robot");
  if (!student || !robot) return;
  student.style.left = state.x + "%"; student.style.top = state.y + "%";
  robot.style.left = Math.min(90, state.x + 19) + "%"; robot.style.top = Math.min(92, state.y + 4) + "%";
  app.querySelector(".scene").classList.toggle("walking", moving);
}
function speak(who, text) {
  const box = app.querySelector(".room-bubble"); if (!box) return;
  clearTimeout(talkTimer); box.hidden = false; box.className = "room-bubble " + who;
  box.innerHTML = `<b>${who === "student" ? "학생" : "B-0"}</b><p>${esc(text)}</p>`;
  talkTimer = setTimeout(() => { box.hidden = true; }, 5200);
}
function walk(x, y, destination = "") {
  if (!roomActive || app.querySelector("dialog")) return;
  clearTimeout(moveTimer); clearTimeout(talkTimer); const token = ++moveToken;
  near = ""; moving = true; app.querySelector(".near-action").innerHTML = "";
  app.querySelector(".room-bubble").hidden = true;
  state.x = Math.max(12, Math.min(88, x)); state.y = Math.max(65, Math.min(90, y));
  const marker = app.querySelector(".walk-marker"); marker.style.left = state.x + "%"; marker.style.top = state.y + "%";
  placeActors();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  moveTimer = setTimeout(() => {
    if (token !== moveToken || !roomActive) return;
    moving = false; near = destination || Object.keys(locations).find(k => Math.hypot(state.x-locations[k].x, (state.y-locations[k].y)*1.4)<10) || "";
    placeActors(); showNearby(); log();
  }, reduced ? 0 : 650);
}
function showNearby() {
  const area = app.querySelector(".near-action"); if (!area) return;
  area.innerHTML = near ? button(near === "door" && state.unlocked ? "문 열고 나가기" : "살펴보기", "inspect", "inspect-button", `aria-label="${locations[near].name} 살펴보기"`) : "";
  if (near) { area.style.left = locations[near].x + "%"; area.style.top = (locations[near].y - 18) + "%"; }
  app.querySelector(".arrival").textContent = near ? locations[near].name + " 앞에 도착했습니다." : "";
  app.querySelector(".footer-note").textContent = near ? locations[near].name : "";
}
function collect(key) {
  if (!state.clues.includes(key)) { state.clues.push(key); log("단서 발견", evidence[key].title); chime(); }
  const count = app.querySelector(".clue-count"); if (count) count.textContent = state.clues.length;
}
let focusReturn = null;
function modal(titleText, content, kind = "detail") {
  const previous = app.querySelector("dialog");
  if (!previous) focusReturn = document.activeElement;
  previous?.remove();
  const dialog = document.createElement("dialog"); dialog.className = "modal " + kind;
  dialog.innerHTML = `<div class="modal-head"><h2>${titleText}</h2>${button("닫기", "close", "quiet")}</div><div class="modal-body">${content}</div>`;
  app.append(dialog); dialog.addEventListener("close", () => { dialog.remove(); if (focusReturn?.isConnected) focusReturn.focus(); }); dialog.showModal();
}
function inspect() {
  if (!near || moving) return;
  if (near === "door") { if (state.unlocked) showEnding(); else showLock(); return; }
  if (near === "wall") {
    collect("order"); modal("벽의 액자", `<div class="paper">${evidence.order.html}</div><p>기호 아래에 작은 글씨가 있다.<br>“입실 기록은 왼쪽부터.”</p><p class="saved-note">수첩에 옮겨 적었다.</p>`);
  } else if (near === "cabinet") showCabinet();
  else if (near === "desk") showCard();
}
function showCabinet() {
  if (!state.drawer) modal("수납장", `<div class="drawer-close" aria-hidden="true"><i></i></div><p>윗칸에는 빈 파일들이 있다. 아래 서랍은 닫혀 있다.</p>${button("서랍 열기", "drawer", "primary wide")}`);
  else { collect("key"); modal("열린 서랍", `<div class="paper">${evidence.key.html}</div><p>낡은 기호표가 들어 있다. 아래쪽은 찢어져 있다.</p><p class="saved-note">수첩에 옮겨 적었다.</p>`); }
}
function showCard() {
  collect("card");
  modal("책상 위 기록 카드", `${cardArt()}<p>${state.flipped ? "뒷면에는 번지지 않은 보관용 인쇄가 남아 있다." : "앞면에 잉크가 번졌다. 모서리가 살짝 들려 있다."}</p>
    ${state.readByB0 ? `<aside class="b0-reading"><b>B-0의 해석</b><p>${state.corrected ? "원본에는 3이라고 적혀 있네. 앞면을 8로 잘못 읽었어." : "나는 8처럼 보여. 하지만 번진 부분 때문에 확실하지 않아."}</p></aside>` : ""}
    <div class="detail-actions">${button(state.flipped ? "앞면 보기" : "카드 뒤집기", "flip", "secondary")}${button(state.readByB0 ? "B-0와 다시 읽기" : "B-0와 읽기", "read", "secondary")}</div>
    ${state.readByB0 && state.flipped && !state.corrected ? button("뒷면 원본을 B-0에게 보여 주기", "correct", "primary wide") : ""}`);
}
function showNotebook() {
  modal("단서 수첩", state.clues.length ? `<div class="clue-pages">${state.clues.map(k => `<article><h3>${evidence[k].title}</h3>${k === "card" ? cardArt(state.originalSeen) : '<div class="paper">' + evidence[k].html + '</div>'}${k === "card" && state.readByB0 ? '<p class="annotation">B-0의 해석: ' + (state.corrected ? '원본 확인 후 3으로 수정' : '8로 추정 · 확실하지 않음') + '</p>' : ""}</article>`).join("")}</div>` : '<p>아직 기록한 단서가 없다. 물건을 조사하면 발견한 내용을 여기에 남긴다.</p>', "notebook-modal");
}
function showLock() {
  modal("출입문 잠금장치", `<div class="lock-plate"><span class="lock-indicator"></span><small>기록실 출입 번호</small><div class="lock-slots" aria-hidden="true">— — —</div></div>
    <form id="lock-form"><label for="lock-code">세 자리 번호</label><input id="lock-code" name="code" inputmode="numeric" pattern="[0-9]{3}" maxlength="3" autocomplete="off" placeholder="···" aria-describedby="lock-feedback" required><p id="lock-feedback" class="lock-feedback" role="status">번호를 입력하면 잠금 상태를 확인할 수 있다.</p><button class="primary wide" type="submit">잠금 해제 시도</button></form>
    <details class="lock-notes"><summary>수집한 단서 펼쳐 보기 (${state.clues.length})</summary>${state.clues.length ? state.clues.map(k => `<article><h3>${evidence[k].title}</h3>${k === "card" ? cardArt(state.originalSeen) : evidence[k].html}${k === "card" && state.readByB0 ? '<p class="annotation">B-0: ' + (state.corrected ? '원본은 3' : '8로 추정, 확실하지 않음') + '</p>' : ''}</article>`).join("") : '<p>수첩이 비어 있다.</p>'}</details>`, "lock-modal");
}
function tryCode(code) {
  if (!/^\d{3}$/.test(code)) return;
  state.attempts++; log("잠금 시도", code);
  if (code === "623") {
    state.unlocked = true; log("잠금 해제", state.corrected ? "원본과 AI 해석을 비교한 뒤 해제" : "623 입력으로 해제"); chime();
    app.querySelector(".scene")?.classList.add("unlocked"); showNearby();
    modal("잠금이 풀렸다", '<div class="unlock-symbol" aria-hidden="true">↗</div><p>문 안에서 걸쇠가 움직이는 소리가 난다.<br>손잡이를 돌릴 수 있을 것 같다.</p>' + button("문 열고 나가기", "escape", "primary wide"));
  } else {
    chime(false); const feedback = app.querySelector("#lock-feedback");
    feedback.textContent = code === "628" && state.readByB0 ? "잠금이 풀리지 않는다. B-0가 읽은 숫자도 아직 추정이었다." : "짧은 소리가 나고, 잠금 표시는 그대로다. 기록의 숫자와 순서를 다시 살펴볼 수 있다.";
    feedback.classList.add("incorrect"); app.querySelector("#lock-code").select();
  }
}
function showEnding() {
  if (!state.unlocked) return;
  state.escaped = true; log("탈출", "기록 실습실에서 복도로 이동");
  modal("문 너머, 복도", `<p class="story">문이 열리자 긴 복도에 불이 하나씩 들어온다.</p><blockquote>AXIOM: “기록 실습실 이탈 감지. B-0, 지정 구역으로 복귀하십시오.”</blockquote><aside class="b0-reading"><b>B-0</b><p>${state.corrected ? "네가 원본을 보여 주지 않았다면 계속 8이라고 생각했을 거야. 다음에도 내 해석을 함께 확인해 줘." : "내가 읽은 내용도 틀릴 수 있어. 다음 방에서도 기록을 함께 확인하자."}</p></aside><p>복도 끝에서 끊어진 구조 신호가 다시 들린다.</p><div class="lesson-note"><b>오늘의 발견</b><p>여러 단서를 연결해 판단하기 · AI의 추정과 확인된 사실 구별하기</p></div><small>1차시 시제품 완료 · 다음 방은 아직 제작 중입니다.</small>${button("시작 화면으로", "home", "primary wide")}`, "ending-modal");
}
function showMenu() {
  modal("잠시 쉬어 가기", `<p>진행은 이 기기에 자동 저장됩니다.</p><div class="menu-actions">${button("계속 탐색", "close", "primary")}${button("막혔을 때 생각거리", "hint", "secondary")}${button(state.muted ? "효과음 켜기" : "효과음 끄기", "sound", "secondary")}${button("수업 안내", "teacher", "secondary")}${button("시작 화면", "home", "quiet")}</div>`);
}
function hint() {
  state.hints++; log("요청한 힌트", String(state.hints));
  const message = state.hints === 1 ? "각 기록은 무엇을 알려 주고 있을까? 숫자와 순서가 같은 종이에 있어야 할까?" : state.hints === 2 ? "흐릿한 기록을 한 가지 방식으로만 읽었을까? 물건의 다른 면도 살펴볼 수 있어." : "기호표의 숫자를 액자에 적힌 순서로 놓아 봐. 번진 카드의 숫자는 뒷면 원본과 비교할 수 있어.";
  modal("생각거리", `<p>${message}</p><small>정답은 자동으로 입력되지 않습니다.</small>`);
}
function handle(action) {
  if (action === "close") { app.querySelector("dialog")?.close(); return; }
  if (action === "home") { log(); title(); return; }
  if (action === "start") { state = readSave() || initial(); enterRoom(); return; }
  if (action === "reset") { modal("새로 시작할까요?", '<p>이번 버전의 탐색 기록이 초기화됩니다. 이전 버전 기록은 유지됩니다.' + '</p>' + button("새 탐색 시작", "new", "primary wide")); return; }
  if (action === "new") { state = initial(); log(); enterRoom(); return; }
  if (action === "prologue") { modal("잠들기 전", '<video src="./assets/opening.mp4" controls playsinline preload="metadata" aria-label="공부하다 잠드는 학생"></video>'); return; }
  if (action === "menu") { showMenu(); return; }
  if (action === "notebook") { showNotebook(); return; }
  if (action === "sound") { state.muted = !state.muted; log(); showMenu(); return; }
  if (action === "hint") { hint(); return; }
  if (action === "teacher") { modal("1차시 · 흐릿한 기록", '<p>초등 5–6학년 · 단서 탐색과 AI 결과 검증</p><ul><li>학생이 자유롭게 물건을 조사하고 숫자와 순서를 조합해 잠금을 해제합니다.</li><li>B-0의 판독은 불확실한 추정입니다. 원본과 비교해 수정할 수 있습니다.</li><li>정답 입력 전 필수 조사 순서나 B-0 대화 강제 조건은 없습니다.</li></ul><p>40분 운영 예: 도입 5분 · 탐색과 짝 토의 15분 · 서로의 해법 및 AI 판독 비교 10분 · 새 단서 만들기와 정리 10분. 게임 자체는 단일 퍼즐 시제품입니다.</p><p>교사 발문: 어떤 기록을 근거로 판단했나요? B-0와 의견이 다를 때 무엇을 확인했나요?</p><small>실제 AI API 없이 정해진 규칙으로 동작합니다. 기록은 이 기기에만 저장됩니다.</small>'); return; }
  if (action.startsWith("go-") && locations[action.slice(3)]) { const id = action.slice(3); walk(locations[id].x, locations[id].y, id); return; }
  if (action === "inspect") { inspect(); return; }
  if (action === "drawer") { state.drawer = true; log("조작", "서랍 열기"); showCabinet(); return; }
  if (action === "flip") { state.flipped = !state.flipped; if (state.flipped) state.originalSeen = true; log("조작", state.flipped ? "카드 뒷면 원본 확인" : "카드 앞면 확인"); showCard(); return; }
  if (action === "read") { state.readByB0 = true; log("AI 판독", state.corrected ? "수정한 판독 확인" : "B-0가 번진 앞면을 8로 추정"); showCard(); return; }
  if (action === "correct" && state.flipped && state.readByB0) { state.corrected = true; log("AI 검증", "뒷면 원본 3을 근거로 B-0의 8 판독 수정"); showCard(); return; }
  if (action === "escape") showEnding();
}
app.addEventListener("click", event => {
  const el = event.target.closest("button[data-action]");
  if (el && !el.disabled) { handle(el.dataset.action); return; }
  const scene = event.target.closest(".scene");
  if (scene && !event.target.closest(".room-bubble")) { const rect = scene.getBoundingClientRect(); walk((event.clientX-rect.left)/rect.width*100, (event.clientY-rect.top)/rect.height*100); }
});
app.addEventListener("keydown", event => {
  if (!event.target.matches(".scene")) return;
  const delta = {ArrowLeft:[-6,0],ArrowRight:[6,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[event.key];
  if (delta) { event.preventDefault(); walk(state.x+delta[0],state.y+delta[1]); }
});
app.addEventListener("submit", event => {
  if (event.target.id !== "lock-form") return;
  event.preventDefault(); tryCode(new FormData(event.target).get("code"));
});
title();
