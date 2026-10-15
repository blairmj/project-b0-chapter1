"use strict";

// Static, offline-capable lesson. No remote AI service or student data collection.
const SAVE_KEY = "project-b0-practice-v2";
const app = document.querySelector("#app");
const objects = {
  door: { name: "출입문", icon: "door", clue: "문 옆에 잠금 표시가 있다. 전선은 단말기로 이어진다." },
  terminal: { name: "단말기", icon: "terminal", clue: "화면이 꺼져 있다. ‘전원을 켜면 출입문 잠금이 해제됩니다’라는 안내가 있다." },
  map: { name: "안내도", icon: "map", clue: "단말기 → 잠금 확인 → 출입문 순서로 연결되어 있다. 문 너머는 데이터 복구실이다." },
  light: { name: "비상등", icon: "light", clue: "방을 밝히는 장치다. 출입문 잠금과는 연결되어 있지 않다." }
};
const intro = [
  ["여기는… 내 방이 아닌데?", "교육 실습실이야. 나는 교육용 AI 로봇 B-0. 너도 방금 깨어났구나."],
  ["문이 잠겼어. 나갈 수 있을까?", "문을 조작할 수는 있어. 하지만 어디에 연결된 장치인지는 함께 찾아야 해."],
  ["그럼 내가 살펴보고, 네가 움직이는 거네.", "맞아. 어떤 장치에 무엇을 할지 알려줘. 실행한 뒤에는 결과도 같이 확인하자."],
  ["좋아. 우선 방부터 둘러보자.", "빛나는 표시나 아래 조사 버튼을 눌러 봐. 찾은 내용은 단서함에 남겨 둘게."]
];
function fresh() {
  return { phase: "intro", intro: 0, clues: [], power: false, lamp: false, verified: false, open: false,
    target: "", verb: "", tab: "explore", muted: false, hints: 0, attempts: 0, logs: [],
    student: intro[0][0], robot: intro[0][1], reflection: 0 };
}
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data || !["intro", "room", "clear"].includes(data.phase) || !Array.isArray(data.clues)) return null;
    return { ...fresh(), ...data, clues: data.clues.filter(k => objects[k]), tab: "explore" };
  } catch { return null; }
}
let saved = load();
let state = saved || fresh();
let screen = "title", busy = false, view = "", selected = "", pending = null;
let pose = "neutral", position = "home", audio, turn = 0, toastTimer, talkTimer;
let returnFocus = "";
const esc = text => String(text).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function btn(text, action, cls = "", attrs = "") {
  return `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${text}</button>`;
}
function icon(key) {
  const paths = {
    door: '<path d="M5 21V3h14v18M12 3v18M9 11v3m6-3v3"/>',
    terminal: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4m-5 1h10"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16M6 11h4l3 3 5-5"/>',
    light: '<path d="M9 18h6m-5 3h4M12 1v2M4 5l2 2m14-2-2 2"/><path d="M8 15a6 6 0 1 1 8 0l-1 3H9Z"/>',
    book: '<path d="M3 5h7l2 2 2-2h7v15h-7l-2 2-2-2H3Zm9 2v15"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${paths[key] || paths.check}</svg>`;
}
function save(kind, text) {
  if (kind) state.logs.push({ time: new Date().toISOString(), kind, text });
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saved = state; } catch { /* Optional persistence. */ }
}
function tone(freq = 650, length = .12) {
  if (state.muted) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    void audio.resume();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.045, audio.currentTime + .01);
    g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + length);
    o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + length);
  } catch { /* Sound is optional. */ }
}
function say(student, robot, nextPose = "neutral") {
  state.student = student; state.robot = robot; pose = nextPose;
}
function notify(text) {
  const el = app.querySelector(".system-notice");
  if (!el) return;
  clearTimeout(toastTimer); el.textContent = text; el.classList.add("visible");
  toastTimer = setTimeout(() => el.classList.remove("visible"), 2800);
}
function title() {
  screen = "title"; turn++; busy = false;
  app.innerHTML = `<main class="title-screen"><div class="title-room"></div><section class="title-copy"><p class="eyebrow">퍼즐 어드벤처 · 1차시</p><h1>PROJECT <span>B-0</span></h1><h2>깨어난 실습실</h2><p>낯선 연구소, 잠긴 문.<br>단서를 찾고 B-0와 함께 출구를 열어 보세요.</p><div class="title-b0 robot-sprite pose-neutral" role="img" aria-label="교육용 로봇 B-0"></div><div class="title-actions">${saved ? btn("이어서 하기", "continue", "primary") : ""}${btn(saved ? "처음부터 시작" : "새 게임 시작", "new", saved ? "secondary" : "primary")}${btn("수업 안내", "teacher", "text-button")}</div><small>세로 화면 권장 · 자동 저장 · 음성 대사 없음</small></section></main>`;
}
function opening() {
  screen = "opening";
  app.innerHTML = `<main class="opening"><header><b>PROJECT B-0</b><span>PROLOGUE</span></header><video src="./assets/opening.mp4" controls playsinline preload="auto" aria-label="밤늦게 공부하다 잠드는 학생"></video><footer><p>밤 10시, 아직 풀리지 않은 문제.</p>${btn("영상 건너뛰기", "skip", "secondary")}</footer></main>`;
  const v = app.querySelector("video");
  v.muted = state.muted;
  v.addEventListener("ended", enterRoom, { once: true });
  v.addEventListener("error", () => { app.querySelector(".opening footer p").textContent = "영상 재생이 어렵다면 건너뛰어 시작하세요."; }, { once: true });
  v.play().catch(() => {});
}
function enterRoom() {
  screen = "game"; view = ""; selected = ""; pending = null; position = "home"; pose = "neutral";
  app.innerHTML = `<main class="game-shell"><header class="game-header"><div><p class="brand">PROJECT <span>B-0</span><small>01 / 04</small></p><h1>교육 실습실</h1></div><div class="header-tools">${btn("소리", "sound", "small-button", 'aria-label="효과음 끄기"')}${btn("메뉴", "menu", "small-button")}</div><p class="objective"></p><ol class="progress" aria-label="진행 단계"><li>조사</li><li>지시</li><li>확인</li><li>탈출</li></ol></header>
  <section class="room" aria-label="교육 실습실 탐색"><div class="room-background"></div><div class="room-light"></div>
    <div class="door-layer device" aria-hidden="true"><div class="door-crop"><i class="device-art door-art left-leaf"></i><i class="device-art door-art right-leaf"></i></div><span class="lock-led"></span></div>
    <div class="terminal-layer device" aria-hidden="true"><i class="device-art terminal-art"></i><span class="terminal-screen"></span></div>
    <div class="map-layer device" aria-hidden="true"><i class="device-art map-art"></i></div>
    <div class="light-layer device" aria-hidden="true"><i class="device-art light-art"></i></div>
    <div class="student-character" role="img" aria-label="회색 후드티를 입은 초등학생"></div>
    <div class="robot-character at-home" role="img" aria-label="B-0 대기 중"><div class="robot-sprite pose-neutral"><i class="digital-mouth"></i></div></div>
    <div class="hotspots">${Object.entries(objects).map(([key, o]) => btn(`<i></i><span>${o.name}</span>`, `inspect-${key}`, `hotspot hotspot-${key}`, `aria-label="${o.name} 조사"`)).join("")}</div>
    <div class="room-caption"></div><div class="system-notice" role="status" aria-live="polite"></div>
  </section><section class="dialogues" aria-label="학생과 B-0 대화" aria-live="polite"></section>
  <section class="controls" aria-label="플레이어 행동"></section>
  <footer class="game-footer"><span>1차시 · 명확하게 지시하고 확인하기</span><span>자동 저장</span></footer></main>`;
  render();
}
function ready() { return ["door", "terminal", "map"].every(k => state.clues.includes(k)); }
function objective() {
  if (state.open) return "열린 문으로 B-0와 함께 나가기";
  if (state.verified) return "B-0에게 출입문을 열도록 지시하기";
  if (state.power) return "출입문의 잠금 표시 확인하기";
  if (ready()) return "B-0에게 대상과 행동을 알려 주기";
  return "잠긴 출입문을 열 단서 찾기";
}
function render() {
  if (screen !== "game") return;
  const room = app.querySelector(".room");
  room.classList.toggle("powered", state.power); room.classList.toggle("lamp-bright", state.lamp);
  room.classList.toggle("door-open", state.open); room.classList.toggle("busy", busy);
  room.classList.toggle("intro", state.phase === "intro");
  const robot = app.querySelector(".robot-character");
  robot.className = `robot-character at-${position}${busy ? " moving" : ""}`;
  robot.setAttribute("aria-label", `B-0 ${ { neutral:"대기", thinking:"생각", pointing:"가리키기", walking:"이동", operating:"장치 조작", success:"기쁨" }[pose]}`);
  const sprite = robot.querySelector(".robot-sprite");
  sprite.className = `robot-sprite pose-${pose}`;
  app.querySelector(".objective").innerHTML = `<b>목표</b> ${objective()}`;
  const step = state.open ? 3 : state.power ? 2 : ready() ? 1 : 0;
  app.querySelectorAll(".progress li").forEach((el, i) => { el.classList.toggle("done", i < step); el.classList.toggle("current", i === step); });
  app.querySelector(".room-caption").textContent = state.open ? "출입문 열림 · 다음 구역: 데이터 복구실" : state.power ? "단말기 작동 중 · 문 옆 잠금 표시가 초록색" : "단말기 전원 꺼짐 · 출입문 잠김";
  app.querySelectorAll(".hotspot").forEach(el => {
    const key = el.dataset.action.slice(8);
    el.disabled = busy || state.phase !== "room";
    el.classList.toggle("found", state.clues.includes(key));
    el.classList.toggle("selected", key === selected);
  });
  const sound = app.querySelector('[data-action="sound"]');
  sound.textContent = state.muted ? "소리 꺼짐" : "소리 켜짐";
  sound.setAttribute("aria-label", state.muted ? "효과음 켜기" : "효과음 끄기");
  const dialogue = app.querySelector(".dialogues");
  const markup = `<div class="speech student-speech"><b>학생</b><p>${esc(state.student)}</p></div><div class="speech robot-speech"><b>B-0</b><p>${esc(state.robot)}</p></div>`;
  if (dialogue.innerHTML !== markup) {
    dialogue.innerHTML = markup;
    clearTimeout(talkTimer); sprite.classList.add("talking");
    talkTimer = setTimeout(() => sprite.classList.remove("talking"), 2400);
  }
  app.querySelector(".controls").innerHTML = controls();
  save();
}
function controls() {
  if (state.phase === "intro") return `<p class="panel-eyebrow">낯선 곳에서의 첫 만남 · ${state.intro+1} / ${intro.length}</p>${btn(state.intro === intro.length-1 ? "방 둘러보기 시작" : "대화 계속 →", "next", "primary wide")}`;
  if (state.phase === "clear") return clearPanel();
  if (busy) return `<div class="execution" role="status"><span class="activity-dot"></span><b>B-0가 지시를 실행하고 있어요.</b><p>어떤 장치가 달라지는지 살펴보세요.</p></div>`;
  if (view === "confirm") return `<p class="panel-eyebrow">실행 전 · B-0가 이해한 내용</p><p class="readback">${esc(pending.label)}</p><div class="action-pair">${btn("맞아, 실행해", "execute", "primary")}${btn("지시 고치기", "edit", "secondary")}</div>`;
  if (view === "verify") return `<p class="panel-eyebrow">결과 확인</p><h2>잠금이 풀렸다는 근거는?</h2><div class="option-stack">${btn("문 옆 잠금 표시가 초록색이다", "verify-lock", "secondary")}${btn("비상등이 더 밝아졌다", "verify-light", "secondary")}${btn("B-0가 성공했다고 말했다", "verify-word", "secondary")}</div>${btn("방을 다시 살펴보기", "explore", "text-button")}`;
  const nav = `<nav class="action-tabs" aria-label="행동 선택">${btn("방 조사", "explore", state.tab === "explore" ? "active" : "", `aria-pressed="${state.tab === "explore"}"`)}${btn("B-0에게 지시", "command", state.tab === "command" ? "active" : "", `aria-pressed="${state.tab === "command"}"`)}${btn(`단서함 ${state.clues.length}/4`, "clues", state.tab === "clues" ? "active" : "", `aria-pressed="${state.tab === "clues"}"`)}</nav>`;
  let body = "";
  if (state.tab === "clues") body = `<div class="clue-list">${state.clues.length ? state.clues.map(k => `<article>${icon(objects[k].icon)}<div><h3>${objects[k].name}</h3><p>${objects[k].clue}</p></div></article>`).join("") : '<p>방의 물건을 조사하면 단서가 여기에 모입니다.</p>'}</div>`;
  else if (state.tab === "command") body = commandPanel();
  else body = `<div class="panel-heading"><h2>${state.power && !state.verified ? "문을 눌러 잠금 상태 확인" : "조사할 곳 선택"}</h2><span>${state.clues.length}/4 발견</span></div><div class="object-grid">${Object.entries(objects).map(([k,o]) => btn(`${icon(o.icon)}<span>${o.name}</span><small>${state.clues.includes(k) ? "✓ 조사함" : "조사"}</small>`, `inspect-${k}`, `object-button ${selected===k ? "chosen" : ""}`)).join("")}</div>${state.open ? btn("B-0와 함께 나가기 →", "exit", "primary wide") : ready() && !state.power ? btn("단서를 바탕으로 지시하기 →", "command", "primary wide") : ""}`;
  return `${nav}${body}<div class="utility-row">${btn("힌트", "hint", "text-button")}${btn("학습 기록", "record", "text-button")}</div>${view === "hint" ? `<aside class="hint" role="status">${hint()}</aside>` : ""}`;
}
function commandPanel() {
  if (!ready()) return `<div class="guidance"><h2>먼저 지시할 근거를 찾아요.</h2><p>출입문 · 단말기 · 안내도를 살펴보세요. 아직 못 찾은 곳: ${["door","terminal","map"].filter(k=>!state.clues.includes(k)).map(k=>objects[k].name).join(", ")}</p>${btn("방 살펴보기", "explore", "secondary")}</div>`;
  const verbs = { on:"전원을 켜 줘", open:"열어 줘", inspect:"상태를 확인해 줘" };
  return `<form id="command-form"><div class="command-fields"><label><span>① 어떤 대상?</span><select name="target" aria-label="지시 대상" required><option value="">대상 선택</option>${["terminal","light","door"].map(k=>`<option value="${k}" ${state.target===k?'selected':''}>${objects[k].name}</option>`).join("")}</select></label><label><span>② 어떤 행동?</span><select name="verb" aria-label="지시 행동" required><option value="">행동 선택</option>${Object.entries(verbs).map(([k,v])=>`<option value="${k}" ${state.verb===k?'selected':''}>${v}</option>`).join("")}</select></label></div><button class="primary wide" type="submit">B-0에게 전달하기</button></form>${btn('“저거 켜 줘”라고만 말하면?', "vague", "text-button example")}`;
}
function hint() {
  if (state.open) return "문이 열렸어요. ‘방 조사’에서 B-0와 함께 나갈 수 있어요.";
  if (state.verified) return "대상은 ‘출입문’, 행동은 ‘열어 줘’로 지시해 보세요.";
  if (state.power) return "B-0의 말만 믿기 전에 출입문을 조사하고, 잠금 표시의 색을 확인해 보세요.";
  if (!ready()) return "출입문, 단말기, 안내도에서 연결 관계를 찾아보세요. 비상등도 비교해 볼 수 있어요.";
  return state.hints > 1 ? "‘단말기’에 ‘전원을 켜 줘’라고 전달해 보세요. 실행한 뒤 문 상태를 확인하세요." : "안내도에서 출입문으로 이어지는 장치는 무엇인가요? 대상과 행동을 따로 정해 보세요.";
}
function inspect(key) {
  if (!objects[key]) return;
  selected = key; view = ""; state.tab = "explore";
  const first = !state.clues.includes(key);
  if (first) state.clues.push(key);
  if (key === "door" && state.power && !state.verified) {
    say("문 옆 표시가 빨간색에서 초록색으로 바뀌었어.", "단말기 전원을 켠 결과일까? 잠금이 풀렸다는 근거를 골라 보자.", "pointing"); view = "verify";
  } else if (key === "door" && state.open) say("문이 열렸어. 함께 나가자!", "다음은 데이터 복구실이야. 저쪽에서 구조 신호가 들어오고 있어.", "success");
  else if (key === "door" && state.verified) say("초록색 표시, 잠금 해제 확인!", "이제 출입문을 열라고 지시해 줘.", "success");
  else if (key === "terminal" && state.power) say("단말기에 ‘잠금 해제’가 떠 있어.", "문 쪽 표시도 살펴보자. 화면에 나온 결과와 실제 상태가 같은지 확인해야 해.", "pointing");
  else {
    const lines = {
      door:["문은 잠겼고, 옆에 빨간 표시가 있어.","문에서 나온 전선이 단말기로 이어져 있어. 단말기도 살펴보자."],
      terminal:["전원을 켜면 출입문 잠금이 해제된다고 적혀 있어.","내가 전원을 켤 수 있어. 안내도에서도 장치의 연결을 확인해 보자."],
      map:["단말기에서 출입문으로 화살표가 이어져 있어.","단말기 작동 → 잠금 확인 → 문 열기. 방의 장치가 연결되어 있네."],
      light:[state.lamp ? "비상등이 더 밝아졌지만, 문은 따로 움직이지 않네." : "비상등이 약하게 켜져 있어.","이건 방을 밝히는 장치야. 문을 열려면 다른 장치를 찾아야겠어."]
    };
    say(...lines[key], key === "map" ? "thinking" : "pointing");
  }
  save("조사", `${objects[key].name}: ${objects[key].clue}`); render();
  if (first) { tone(760,.08); notify(`${objects[key].name} 단서 저장`); }
}
async function execute() {
  if (!pending || busy) return;
  const command = pending; pending = null; busy = true; view = "";
  const ticket = ++turn;
  position = command.target; pose = "walking"; render(); tone(420,.08);
  await new Promise(r=>setTimeout(r,900));
  if (ticket !== turn || screen !== "game") return;
  pose = "operating"; render();
  await new Promise(r=>setTimeout(r,650));
  if (ticket !== turn || screen !== "game") return;
  busy = false; state.attempts++;
  if (command.verb === "inspect") { inspect(command.target); return; }
  if (command.target === "terminal" && command.verb === "on") {
    state.power = true;
    say("단말기가 켜졌어. 문 옆에도 초록빛이 보이는데?", "잠금을 해제했다는 표시가 나왔어. 출입문을 직접 살펴보고 확인해 줘.", "pointing");
    state.tab = "explore"; tone(880,.2);
  } else if (command.target === "light" && command.verb === "on") {
    state.lamp = true;
    say("방은 밝아졌어. 그런데 문은 그대로네.", "나는 지시한 비상등을 켰어. 문을 열려면 어떤 장치를 골라야 할까?", "thinking");
    state.tab = "command"; tone(500,.15);
  } else if (command.target === "door" && command.verb === "open") {
    if (!state.power) say("문이 움직이지 않아.", "아직 잠겨 있어. 출입문과 연결된 장치부터 작동시켜 보자.", "thinking");
    else if (!state.verified) say("열기 전에 잠금부터 확인하자.", "좋아. 출입문을 조사해서 잠금이 풀렸다는 근거를 확인해 줘.", "thinking");
    else { state.open = true; say("열렸다! 네가 실행하고 내가 확인하니까 됐어.", "대상과 행동을 분명히 알고, 결과도 확인했어. 이 방법을 기억할게.", "success"); tone(980,.25); }
    state.tab = "explore";
  } else {
    say("이 대상에는 그 행동이 맞지 않는구나.", command.target === "door" ? "출입문에는 전원을 직접 켤 수 없어. 연결된 단말기에 지시해 줘." : "이 장치는 여는 대신 전원을 켜거나 상태를 확인할 수 있어.", "thinking");
    state.tab = "command";
  }
  save("실행", `${command.label} → ${state.robot}`); render();
  notify(state.open ? "출입문 열림" : "실행 완료 · 달라진 곳을 확인하세요");
}
function clearPanel() {
  if (state.reflection === 0) return `<p class="panel-eyebrow">탈출 기록 · 1 / 2</p><h2>B-0에게 가장 명확한 지시는?</h2><div class="option-stack">${btn("빨리 해 줘", "reflect-wrong", "secondary")}${btn("단말기 전원을 켜 줘", "reflect-target", "secondary")}${btn("저거 좀 해 봐", "reflect-wrong", "secondary")}</div>`;
  if (state.reflection === 1) return `<p class="panel-eyebrow">탈출 기록 · 2 / 2</p><h2>실행한 다음에는 무엇을 할까?</h2><div class="option-stack">${btn("실제 장치의 변화를 확인한다", "reflect-check", "secondary")}${btn("B-0가 성공했다면 확인 없이 넘어간다", "reflect-wrong", "secondary")}</div>`;
  return `<section class="completion"><p class="panel-eyebrow">LESSON 01 COMPLETE</p><h2>첫 번째 문을 열었다.</h2><p>단서를 찾고 → 대상과 행동을 알려 주고 → 결과를 확인했어요.</p><div class="learning-tags"><span>대상 + 행동</span><span>관찰로 검증</span><span>함께 해결</span></div><p class="next-chapter">문 너머에서 AXIOM의 안내가 들린다.<br>“데이터 복구실 진입. B-0의 외부 이동을 제한합니다.”<br><strong>다음 차시 · 잘못 배운 분류를 고쳐라</strong><small>현재 플레이 범위는 1차시입니다.</small></p><div class="action-pair">${btn("학습 기록 저장", "download", "primary")}${btn("시작 화면", "home", "secondary")}</div></section>`;
}
function showModal(type) {
  returnFocus = document.activeElement?.dataset.action || "";
  let content;
  if (type === "teacher") content = `<h2>1차시 · B-0와 첫 협력</h2><p>학습 목표: 방의 단서를 근거로 대상을 정하고 행동을 구체적으로 지시하기. AI가 실행한 결과를 직접 확인하기.</p><ol><li>도입 5분: 사람과 AI가 맡을 일 예상하기</li><li>탐색 10분: 장치 네 곳을 관찰하고 연결 관계 찾기</li><li>실습 15분: 지시 작성·실행·비교·수정하기</li><li>정리 10분: 탈출 기록과 자신의 지시 설명하기</li></ol><p>게임은 시간 제한 없이 진행됩니다. 40분 수업에는 짝 토의와 교사의 질문이 포함됩니다.</p><p>선택지를 해석하는 정해진 게임 규칙이며 실제 생성형 AI와 연결되어 있지 않습니다. 기록은 이 기기에만 저장됩니다.</p>`;
  else if (type === "new") content = `<h2>처음부터 시작할까요?</h2><p>이 기기에 저장된 이번 실습실 진행 기록이 새로 시작됩니다.</p>${btn("새 게임 시작", "start-new", "primary wide")}`;
  else if (type === "record") content = `<h2>나와 B-0의 학습 기록</h2><p>발견한 단서 ${state.clues.length}/4 · 실행 ${state.attempts}회 · 힌트 ${state.hints}회</p><ul class="log-list">${state.logs.slice(-25).map(l=>`<li><b>${esc(l.kind)}</b> ${esc(l.text)}</li>`).join("") || '<li>조사한 내용과 실행 결과가 여기에 남아요.</li>'}</ul>${btn("기록 파일 저장", "download", "primary wide")}`;
  else content = `<h2>잠시 쉬어 가기</h2><p>진행은 이 기기에 자동으로 저장돼요.</p><div class="option-stack">${btn("게임 계속", "close", "primary")}${btn("수업 안내", "teacher", "secondary")}${btn("시작 화면으로", "home", "secondary")}</div>`;
  app.querySelector("dialog")?.remove();
  const dialog = document.createElement("dialog"); dialog.className = "modal";
  dialog.innerHTML = `${content}${btn("닫기", "close", "text-button close-modal")}`;
  app.append(dialog); dialog.showModal();
  dialog.addEventListener("close", () => { dialog.remove(); app.querySelector(`[data-action="${returnFocus}"]`)?.focus(); }, { once:true });
}
function download() {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ lesson:1, title:"깨어난 실습실", ...state },null,2)], {type:"application/json"}));
  const a = document.createElement("a"); a.href = url; a.download = "PROJECT_B0_1차시_학습기록.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function handle(action) {
  if (action === "close") { app.querySelector("dialog")?.close(); return; }
  if (["teacher","record","menu"].includes(action)) { showModal(action); return; }
  if (action === "home") { save(); title(); return; }
  if (action === "download") { download(); return; }
  if (action === "sound") { state.muted = !state.muted; render(); return; }
  if (action === "new") { if (saved) showModal("new"); else handle("start-new"); return; }
  if (action === "start-new") { state = fresh(); turn++; save("시작","1차시 시작"); opening(); return; }
  if (action === "continue") { state = load() || fresh(); enterRoom(); return; }
  if (action === "skip") { app.querySelector("video")?.pause(); enterRoom(); return; }
  if (busy) return;
  if (action === "next") {
    state.intro++;
    if (state.intro < intro.length) say(...intro[state.intro], "neutral");
    else { state.phase = "room"; say("문을 열 방법을 찾아보자.","어느 장치부터 살펴볼까?", "pointing"); }
  } else if (action.startsWith("inspect-") && state.phase === "room") { inspect(action.slice(8)); return; }
  else if (["explore","command","clues"].includes(action)) { state.tab=action; view=""; pending=null; }
  else if (action === "hint") { state.hints++; view = view === "hint" ? "" : "hint"; save("힌트", hint()); }
  else if (action === "vague") { say("저거 켜 줘.","단말기와 비상등 중 어느 것을 말하는 거야? 대상의 이름과 할 일을 알려줘.","thinking"); save("지시 수정","모호한 대상에 대해 B-0가 재질문함"); }
  else if (action === "edit") { view=""; pending=null; state.tab="command"; }
  else if (action === "execute") { void execute(); return; }
  else if (action.startsWith("verify-")) {
    if (action === "verify-lock") { state.verified=true; view=""; state.tab="command"; state.target="door"; state.verb="open"; say("실제 잠금 표시가 초록색이야. 잠금이 풀렸어.","내 말만 듣지 않고 직접 확인했네. 이제 문을 열 수 있어!", "success"); save("검증","출입문 잠금 표시의 실제 변화 확인"); tone(980); }
    else { say("그것만으로 문이 열리는지 알 수 있을까?",action === "verify-light" ? "밝기는 조명 상태야. 출입문 옆 잠금 표시와 비교해 봐." : "내가 성공했다고 해도 실제 결과는 다를 수 있어. 문 옆 표시를 보자.", "thinking"); save("검증 다시 시도", action); }
  } else if (action === "exit" && state.open) { state.phase="clear"; position="door"; say("함께 나왔네. 우리가 한 일을 정리해 볼까?","다음 방에서도 네 관찰과 내 실행을 함께 써 보자.","success"); save("탈출","교육 실습실 탈출"); }
  else if (action === "reflect-target") { state.reflection=1; say("단말기라는 대상과, 켜 달라는 행동이 있었어.","그래서 무엇을 해야 하는지 알 수 있었어.","success"); }
  else if (action === "reflect-check") { state.reflection=2; say("AI가 실행한 뒤에는 실제 결과를 확인해야 해.","이 협력 방법을 기억했어. 다음 방에서도 같이 해 보자.","success"); save("정리","대상+행동, 실제 결과 검증 학습 완료"); }
  else if (action === "reflect-wrong") { say("우리가 문을 열 때 어떻게 했더라?","대상과 행동을 알려 주고, 실제 표시가 바뀌었는지 확인했지. 다시 골라 보자.","thinking"); }
  render();
}
app.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (button && !button.disabled) handle(button.dataset.action);
});
app.addEventListener("change", event => {
  if (event.target.closest("#command-form")) { state[event.target.name] = event.target.value; save(); }
});
app.addEventListener("submit", event => {
  if (event.target.id !== "command-form") return;
  event.preventDefault();
  const data = new FormData(event.target), target = data.get("target"), verb = data.get("verb");
  if (!objects[target] || !["on","open","inspect"].includes(verb) || !ready()) return;
  state.target=target; state.verb=verb;
  const label = `${objects[target].name}: ${ {on:"전원을 켜기",open:"열기",inspect:"상태를 확인하기"}[verb]}`;
  pending = {target,verb,label}; view="confirm";
  say(`${objects[target].name}, ${ {on:"전원을 켜 줘.",open:"열어 줘.",inspect:"상태를 확인해 줘."}[verb]}`, `내가 이해한 건 ‘${label}’야. 맞으면 실행할게.`, "thinking");
  save("지시",label); render();
});
title();
