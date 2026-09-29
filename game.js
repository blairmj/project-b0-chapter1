const SAVE_KEY = "project-b0-chapter1-v1";
const app = document.querySelector("#app");

const wakeLines = [
  { who: "SYSTEM", text: "삐…… 삐……. 비인가 인간 개체 감지." },
  { who: "학생", text: "……여기가 어디야?" },
  { who: "B-0", text: "저도 방금 깨어났습니다. 함께 살펴보죠!" },
  { who: "학생", text: "너 뭐야?" },
  { who: "B-0", text: "교육용 인공지능 로봇 B-0입니다. 이곳을 조사해 보겠습니다." },
  { who: "학생", text: "그런데 왜 여기 있어?" },
  { who: "B-0", text: "기억 데이터 일부가 손상됐지만, 단서는 찾을 수 있습니다." },
  { who: "SYSTEM", text: "교육 구역 봉쇄. 탈출 조건: B-0가 보안 과제를 수행할 것. 인간의 직접 조작은 허용되지 않습니다." },
  { who: "학생", text: "그럼 네가 하면 되잖아." },
  { who: "B-0", text: "좋습니다. 방을 둘러보고 단서를 찾아보죠. 찾은 것을 바탕으로 제가 움직이겠습니다." },
];

const endingLines = [
  { who: "B-0", text: "한 가지 알게 되었습니다." },
  { who: "학생", text: "뭔데?" },
  { who: "B-0", text: "‘저거 해’보다 어떤 것을, 어떤 조건으로, 무엇을 해야 하는지 말해주면 훨씬 잘 이해할 수 있습니다." },
  { who: "학생", text: "그걸 이제 알았냐? 진짜 갈 길이 멀다……." },
  { who: "B-0", text: "하지만 조금 전보다 똑똑해졌습니다." },
  { who: "SYSTEM", text: "화면 기록: EDUCATIONAL AI UNIT B-0 / TRAINING DATA … CORRUPTED / USER RECORD … ███████" },
  { who: "B-0", text: "뭔가 보셨습니까?" },
  { who: "학생", text: "아니…… 별거 아니야." },
  { who: "B-0", text: "다음 문제는 제가 더 잘할 수 있을 것 같습니다." },
  { who: "학생", text: "그 말 믿어도 되지?" },
  { who: "B-0", text: "확률은…… 43%입니다." },
  { who: "학생", text: "야!" },
];

const procedureSteps = [
  {
    prompt: "세 가지 전원 중 무엇을 선택해야 합니까?",
    choices: [
      "안내문에서 사용할 수 없는 전원을 먼저 찾아봐.",
      "AUX가 정답이니까 바로 눌러.",
      "아무거나 안전해 보이는 걸 눌러.",
    ],
    success: "MAIN은 손상되어 있고 EMERGENCY는 격리 모드를 켭니다. 두 전원은 적절하지 않습니다.",
    error: "B-0가 근거 없이 누르려 합니다. 먼저 사용할 수 없는 전원을 안내문에서 찾도록 해 보세요.",
  },
  {
    prompt: "MAIN과 EMERGENCY는 제외했습니다. 다음에는 무엇을 확인할까요?",
    choices: [
      "남은 전원과 안내문에 적힌 사용 순서를 확인해.",
      "손상된 MAIN을 다시 시도해.",
      "다른 버튼을 아무거나 눌러 봐.",
    ],
    success: "남은 전원은 AUX입니다. 안내문에는 AUX로 시작한 뒤 보안 코드를 확인하라고 적혀 있습니다.",
    error: "제외한 전원을 다시 쓰거나 임의로 누르면 위험합니다. 남은 전원과 절차를 읽어 보세요.",
  },
  {
    prompt: "AUX가 남았습니다. B-0가 버튼을 누르기 전에 해야 할 일은?",
    choices: [
      "네 판단이 안내문의 모든 조건과 맞는지 마지막으로 검증해.",
      "이제 됐으니 확인 없이 바로 눌러.",
      "내 느낌이 맞으니 근거는 생략해.",
    ],
    success: "MAIN 사용 불가, EMERGENCY 사용 위험, AUX 사용 가능. 검증 완료.",
    error: "AI의 선택도 확인해야 합니다. 사용한 정보와 빠진 조건이 없는지 검증해 보세요.",
  },
];

const inspectionDetails = {
  vent: { title: "환기 시스템", text: "커다란 팬은 먼지를 뒤집어쓴 채 멈춰 있습니다. 전선은 출입문 쪽으로 이어지지 않습니다." },
  terminal: { title: "보안 단말기", text: "출입문 바로 옆에 있습니다. 문으로 이어진 전선과 MAIN·AUX·EMERGENCY 전원 단자가 보입니다." },
  light: { title: "조명 제어기", text: "고장 표시등이 깜빡입니다. 출입문 잠금 장치와 연결된 흔적은 없습니다." },
  console: { title: "전원 단말기", text: "버튼은 세 개지만 현재 상태 표시가 비어 있습니다. 근거 없이 누르면 어떤 일이 일어날지 알 수 없습니다." },
  drawer: { title: "책상 서랍", text: "접힌 복구 절차 안내문을 찾았습니다. MAIN은 손상, EMERGENCY는 격리 모드, AUX로 시작한 뒤 보안 코드를 확인하라고 적혀 있습니다." },
  door: { title: "잠긴 출입문", text: "문 옆 전원 램프가 꺼져 있습니다. 전선은 왼쪽 보안 단말기로 이어집니다." },
  red: { title: "빨간 배터리", text: "연결 단자는 맞지만 요구된 색이 아닙니다." },
  blue: { title: "파란 배터리", text: "충전 장치와 맞는 연결 단자가 달려 있습니다. 옮겨서 연결할 수 있습니다." },
  toolbox: { title: "파란 공구함", text: "배터리와 같은 파란색이지만 안에는 공구가 들어 있습니다. 색만으로 지시하면 헷갈릴 수 있습니다." },
};

const clueGroups = {
  first: ["vent", "terminal", "light"],
  terminal: ["console", "drawer", "door"],
  battery: ["red", "blue", "toolbox"],
};

function freshState() {
  return {
    phase: "title",
    wakeIndex: 0,
    endingIndex: 0,
    procedureStep: 0,
    firstSpecific: false,
    terminalSafe: false,
    batteryDirect: false,
    batteryForm: { target: "", condition: "", action: "", custom: "" },
    clues: Object.fromEntries(Object.keys(inspectionDetails).map((key) => [key, false])),
    inspection: null,
    feedback: "",
    hintOpen: false,
    modal: "",
    muted: false,
    attempts: 0,
    hints: 0,
    elapsedSeconds: 0,
    logs: [],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    return saved && typeof saved.phase === "string" && Array.isArray(saved.logs)
      ? { ...freshState(), ...saved, clues: { ...freshState().clues, ...saved.clues } }
      : freshState();
  } catch {
    return freshState();
  }
}

let state = loadState();
let showTitle = true;
let audioContext;
let lastRenderedPhase = null;
let lastRenderedShot = null;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* Private browsing may disable storage. */ }
}

function logEvent(kind, text) {
  state.logs.push({ second: state.elapsedSeconds, kind, text });
  save();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function button(label, action, className = "", extra = "") {
  return `<button class="${className}" type="button" data-action="${action}" ${extra}>${label}</button>`;
}

function tone(frequency = 620, length = 0.09, type = "sine") {
  if (state.muted) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + length);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + length + 0.01);
  } catch { /* Audio is optional. */ }
}

function setPhase(phase) {
  state.phase = phase;
  state.inspection = null;
  state.feedback = "";
  state.hintOpen = false;
  logEvent("장면", phase);
  tone(710);
  render();
}

function progressIndex() {
  if (["wake", "first", "firstResult"].includes(state.phase)) return 0;
  if (["terminal", "terminalError"].includes(state.phase)) return 1;
  if (["procedure", "powerRestored"].includes(state.phase)) return 2;
  if (["batteryAmbiguity", "batteryError", "batteryBuild", "batterySuccess"].includes(state.phase)) return 3;
  return 4;
}

function clockText() {
  const minutes = Math.floor(state.elapsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (state.elapsedSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function titleMarkup() {
  const canContinue = state.phase !== "title" && state.phase !== "clear";
  return `<main class="title-screen">
    <div class="title-art"></div>
    <div class="title-vignette"></div>
    <div class="title-content">
      <p class="eyebrow">STORY ESCAPE · CHAPTER 01</p>
      <h1>PROJECT <span>B-0</span></h1>
      <p class="title-sub">말 좀 제대로 해!</p>
      <p class="title-copy">AI에게 답을 받는 대신,<br>AI가 스스로 풀 수 있도록 가르쳐 보세요.</p>
      <div class="title-buttons">
        ${button("새 게임 시작 <span aria-hidden='true'>→</span>", "new", "primary-button")}
        ${canContinue ? button("이어서 하기", "continue", "secondary-button") : ""}
      </div>
      <p class="title-foot">세로 화면 권장 · Chapter 1 · 진행 상황 자동 저장</p>
    </div>
    <img class="title-robot" src="./assets/b0.png" alt="교육용 AI 로봇 B-0">
  </main>`;
}

function openingMarkup() {
  return `<main class="opening-screen">
    <div class="opening-heading"><span>PROJECT B-0</span><span>PROLOGUE</span></div>
    <video id="opening-video" src="./assets/opening.mp4" playsinline controls preload="auto" aria-label="학생이 밤늦게 수학을 공부하다 잠드는 오프닝 영상"></video>
    <div class="opening-controls">
      <p>밤 10시, 아직 풀리지 않은 문제.</p>
      ${button("영상 건너뛰기", "skip-opening", "ghost-button")}
    </div>
  </main>`;
}

function statusMarkup() {
  const active = progressIndex();
  return `<header class="game-header">
    <div class="header-main"><span class="brand-mini">PROJECT <b>B-0</b></span><span class="chapter-tag">CHAPTER 01</span></div>
    <div class="header-tools">
      <span class="timer" id="clock" aria-label="플레이 시간">${clockText()}</span>
      ${button(state.muted ? "효과음 켜기" : "효과음 끄기", "sound", "icon-button", `aria-label="${state.muted ? "효과음 켜기" : "효과음 끄기"}"`)}
      ${button("기록", "log-open", "icon-button")}
    </div>
    <div class="progress-track" aria-label="진행 단계 ${active + 1} / 5">${[0, 1, 2, 3, 4].map((step) => `<span class="${step <= active ? "done" : ""}"></span>`).join("")}</div>
  </header>`;
}

function firstCluesReady() {
  return state.clues.terminal && (state.clues.vent || state.clues.light);
}

function terminalCluesReady() {
  return state.clues.console && state.clues.drawer;
}

function batteryCluesReady() {
  return state.clues.blue && state.clues.toolbox;
}

function clueTrailMarkup(phase) {
  const group = phase === "first" ? clueGroups.first
    : phase === "terminal" ? clueGroups.terminal
      : phase === "batteryAmbiguity" ? clueGroups.battery : null;
  if (!group) return "";
  const count = group.filter((key) => state.clues[key]).length;
  return `<div class="clue-trail" aria-label="발견한 단서 ${count}개"><b>단서 ${count}/${group.length}</b>${group.filter((key) => state.clues[key]).map((key) => `<span>${inspectionDetails[key].title}</span>`).join("")}</div>`;
}

function inspectionMarkup() {
  const detail = inspectionDetails[state.inspection];
  if (!detail) return "";
  return `<div class="inspection-shade"></div><section class="inspection-card" role="region" aria-label="조사 결과">
    <p>단서 발견</p><h3>${escapeHtml(detail.title)}</h3><div>${escapeHtml(detail.text)}</div>
    ${button("둘러보기 계속 →", "close-inspection", "inspection-close")}
  </section>`;
}

function sceneVisual() {
  const phase = state.phase;
  const showRobot = phase !== "wake" || state.wakeIndex >= 2;
  const shot = ["terminal", "terminalError", "procedure", "powerRestored"].includes(phase)
    ? "terminal-shot" : ["batteryAmbiguity", "batteryError", "batteryBuild", "batterySuccess"].includes(phase)
      ? "battery-shot" : "lab-shot";
  const location = shot === "terminal-shot" ? "보안 단말기" : shot === "battery-shot" ? "운반 구역" : "연구소 중심부";
  const pose = robotPose();
  let object = "";
  if (phase === "first" || phase === "firstResult") {
    object = `<div class="hotspots" aria-label="연구소 기기 조사">
      ${button("환기 시스템", "inspect-vent", "hotspot vent")}
      ${button("보안 단말기", "inspect-terminal", "hotspot terminal")}
      ${button("조명 제어기", "inspect-light", "hotspot light")}
    </div>`;
  } else if (["terminal", "terminalError", "procedure", "powerRestored"].includes(phase)) {
    object = `<div class="terminal-display ${phase === "terminalError" ? "alert" : ""} ${phase === "powerRestored" ? "restored" : ""}">
      <div class="terminal-top"><span class="tiny-led"></span> SECURITY TERMINAL <span>01</span></div>
      <div class="terminal-readout">${phase === "terminalError" ? "ISOLATION MODE" : phase === "powerRestored" ? "POWER RESTORED" : "POWER SOURCE"}</div>
      <div class="power-buttons"><span>MAIN</span><span>AUX</span><span>EMERGENCY</span></div>
    </div>${phase === "terminal" ? `<div class="terminal-hotspots" aria-label="단말기 주변 조사">
      ${button("단말기", "inspect-console", "hotspot console")}
      ${button("책상 서랍", "inspect-drawer", "hotspot drawer")}
      ${button("출입문", "inspect-door", "hotspot door")}
    </div>` : ""}`;
  } else if (["batteryAmbiguity", "batteryError", "batteryBuild", "batterySuccess"].includes(phase)) {
    const inspectable = ["batteryAmbiguity", "batteryError"].includes(phase);
    object = `<div class="battery-focus ${phase === "batteryError" ? "toolbox-focus" : ""} ${phase === "batterySuccess" ? "charged-focus" : ""}">
      ${inspectable ? button("빨간 배터리", "inspect-red", "battery-red") : '<span class="battery-red">빨간 배터리</span>'}
      ${inspectable ? button("파란 배터리", "inspect-blue", "battery-blue") : '<span class="battery-blue">파란 배터리</span>'}
      ${inspectable ? button("파란 공구함", "inspect-toolbox", "battery-toolbox") : '<span class="battery-toolbox">파란 공구함</span>'}
    </div>`;
  } else if (phase === "ending" && state.endingIndex >= 5) {
    object = `<div class="glitch-record"><span>EDUCATIONAL AI UNIT B-0</span><strong>TRAINING DATA<br>… CORRUPTED</strong><small>USER RECORD … ███████</small></div>`;
  } else if (phase === "clear") {
    object = `<div class="door-open"><div class="door-light"></div><span>ACCESS GRANTED</span></div>`;
  }
  return `<div class="scene-area ${escapeHtml(phase)} ${shot}" data-shot="${shot}"><div class="scene-bg"></div><div class="scene-overlay"></div>
    <div class="lab-sign">${location}</div>
    ${object}
    ${clueTrailMarkup(phase)}
    ${showRobot ? `<div class="b0-character pose-${pose}"><img class="b0-sprite" src="./assets/b0${pose === "neutral" ? "" : `-${pose}`}.png" alt="B-0 로봇"><span class="robot-mouth" aria-hidden="true"><i></i></span></div>` : ""}
    <div class="scene-floor-fade"></div>
    ${inspectionMarkup()}
  </div>`;
}

function robotPose() {
  const phase = state.phase;
  if (phase === "terminalError" || phase === "batteryError" || (phase === "firstResult" && !state.firstSpecific)) return "alert";
  if (phase === "powerRestored" || phase === "batterySuccess" || phase === "clear" || (phase === "firstResult" && state.firstSpecific)) return "bright";
  if (phase === "wake") return [4, 6].includes(state.wakeIndex) ? "think" : state.wakeIndex === 9 ? "bright" : "neutral";
  if (phase === "ending") return [0, 10].includes(state.endingIndex) ? "think" : [2, 4, 8].includes(state.endingIndex) ? "bright" : state.endingIndex === 6 ? "alert" : "neutral";
  if (["first", "terminal", "procedure", "batteryAmbiguity", "batteryBuild"].includes(phase)) return "think";
  return "neutral";
}

function feedbackMarkup() {
  return state.feedback ? `<div class="feedback" role="status">${escapeHtml(state.feedback)}</div>` : "";
}

function hintMarkup(text) {
  return `<div class="hint-row">${button(state.hintOpen ? "힌트 접기" : "힌트 보기", "hint", "text-button")}${state.hintOpen ? `<p class="hint-text">${text}</p>` : ""}</div>`;
}

function panelMarkup() {
  const phase = state.phase;
  if (phase === "wake") {
    const line = wakeLines[state.wakeIndex];
    return `<div class="speaker ${line.who === "SYSTEM" ? "system-speaker" : ""}">${line.who}</div>
      <p class="dialogue-text">${escapeHtml(line.text)}</p>
      <div class="action-stack">${button(state.wakeIndex === wakeLines.length - 1 ? "주변 살펴보기 →" : "계속하기 →", "wake-next", "primary-button")}</div>`;
  }
  if (phase === "first") {
    const ready = firstCluesReady();
    return `<div class="speaker system-speaker">SYSTEM · 첫 번째 미션</div>
      <h2>비상 전원을 복구하라</h2>
      <p class="dialogue-text">방 안의 장치를 조사해 출입문과 연결된 곳을 찾으세요. 단서를 찾은 뒤 B-0에게 지시하세요.</p>
      ${ready ? `<p class="investigation-status ready">출입문에 연결된 장치를 찾았습니다. 이제 B-0에게 말할 수 있습니다.</p><div class="action-stack">
        ${button("“야, 저거 좀 해봐.”", "first-ambiguous", "choice-button")}
        ${button("“가운데 보안 단말기를 조사해줘.”", "first-specific", "choice-button")}
      </div>` : `<p class="investigation-status">장면의 장치를 누르세요. 보안 단말기와 다른 장치 하나를 비교해야 합니다.</p>`}
      ${hintMarkup("출입문에 연결된 장치를 찾고, 다른 장치와 비교해 보세요.")}`;
  }
  if (phase === "firstResult") {
    return `<div class="speaker">B-0</div>
      <p class="dialogue-text">${state.firstSpecific ? "가운데 보안 단말기를 찾았습니다. 무엇을 확인할까요?" : "확인했습니다. 환기 시스템을 작동했습니다. …방 안에 먼지가 가득합니다."}</p>
      <div class="ai-note">AI NOTE 01 · AI는 머릿속 의도를 자동으로 알 수 없습니다.</div>
      <div class="action-stack">${button("가운데 보안 단말기를 조사하도록 지시 →", "to-terminal", "primary-button")}</div>`;
  }
  if (phase === "terminal") {
    const ready = terminalCluesReady();
    return `<div class="speaker">B-0</div><h2>전원 버튼이 세 개입니다</h2>
      <p class="dialogue-text">${ready ? "책상 서랍에서 복구 안내문을 찾았습니다. MAIN은 손상, EMERGENCY는 위험하군요. 어떻게 지시할까요?" : "MAIN, AUX, EMERGENCY. 먼저 단말기와 주변을 살펴보고 복구 방법을 찾아보죠."}</p>
      ${ready ? `<p class="investigation-status ready">복구 안내문과 단말기 상태를 확인했습니다.</p><div class="action-stack">
        ${button("“아무거나 켜!”", "terminal-ambiguous", "choice-button danger-choice")}
        ${button("“안내문을 근거로 복구 절차를 검증해 보자.”", "terminal-safe", "choice-button")}
      </div>` : `<p class="investigation-status">장면의 단말기와 책상 서랍을 조사하면 지시할 수 있습니다.</p>`}
      ${hintMarkup("단말기에는 상태가 보이지 않습니다. 가까운 책상에 남겨진 기록이 있는지 살펴보세요.")}`;
  }
  if (phase === "terminalError") {
    return `<div class="speaker system-speaker">SYSTEM · 경고</div><h2>비상 격리 모드 활성화</h2>
      <p class="dialogue-text">B-0가 EMERGENCY를 눌렀습니다. 붉은 경보가 켜지고 출입문이 더 단단히 잠겼습니다.</p>
      <div class="quote-pair"><p><b>학생</b> “아아악! 왜 그걸 눌러!”</p><p><b>B-0</b> “‘아무거나’에는 선택 기준이 없었습니다. 다음에는 조건을 함께 확인하죠.”</p></div>
      <div class="action-stack">${button("찾아둔 안내문으로 복구하기 →", "to-procedure", "primary-button")}</div>`;
  }
  if (phase === "procedure") {
    const step = procedureSteps[state.procedureStep];
    return `<div class="speaker system-speaker">복구 절차 · ${state.procedureStep + 1}/3</div>
      <div class="memo"><b>비상 전원 복구 절차</b><ul><li>MAIN 전원은 손상됨</li><li>EMERGENCY 사용 시 격리 모드 작동</li><li>AUX로 시스템 시작 후 보안 코드 확인</li></ul></div>
      <p class="dialogue-text"><b>B-0:</b> ${step.prompt}</p>
      ${feedbackMarkup()}
      <div class="action-stack">${step.choices.map((choice, index) => button(`“${escapeHtml(choice)}”`, `procedure-${index}`, "choice-button")).join("")}</div>
      ${hintMarkup("정답 버튼을 대신 골라 주는 것보다, 안내문의 조건을 찾고 판단을 검증하도록 지시하세요.")}`;
  }
  if (phase === "powerRestored") {
    return `<div class="speaker system-speaker">SYSTEM · POWER RESTORED</div>
      <h2>출입문 전원 복구</h2><p class="dialogue-text">B-0가 조건을 검증하고 AUX 버튼을 눌렀습니다. 푸른 조명이 켜지고 철문이 열리기 시작합니다.</p>
      <div class="ai-note">AI NOTE 02 · 답을 바로 주기보다 근거를 찾아 판단하도록 돕고, 그 결과를 검증했습니다.</div>
      <div class="action-stack">${button("다음 구역으로 이동 →", "to-battery", "primary-button")}</div>`;
  }
  if (phase === "batteryAmbiguity") {
    const ready = batteryCluesReady();
    return `<div class="speaker system-speaker">SYSTEM · 두 번째 퍼즐</div>
      <h2>파란 배터리를 연결하라</h2><p class="dialogue-text">${ready ? "파란 배터리와 파란 공구함은 색이 같습니다. 조사한 단서를 바탕으로 B-0에게 정확히 지시하세요." : "바닥의 물체를 조사해 파란 배터리와 파란 공구함을 구별하세요."}</p>
      ${ready ? `<p class="investigation-status ready">파란 물체 두 개를 구별했습니다.</p><div class="action-stack">
        ${button("“파란 거 가져가.”", "battery-ambiguous", "choice-button")}
        ${button("대상·조건·행동을 구체적으로 정하기", "battery-build", "choice-button")}
      </div>` : `<p class="investigation-status">장면의 파란 물체 두 개를 각각 눌러 살펴보세요.</p>`}
      ${hintMarkup("색깔만으로는 파란 배터리와 파란 공구함을 구별할 수 없습니다.")}`;
  }
  if (phase === "batteryError") {
    return `<div class="speaker">B-0</div><p class="dialogue-text">파란 공구함을 가져왔습니다. “파란 거”라고 하셔서요. 물체 종류와 해야 할 행동을 알려 주세요.</p>
      <div class="ai-note">지시의 세 요소 · 대상 / 조건 / 행동</div>
      <div class="action-stack">${button("지시 조립하기 →", "battery-build", "primary-button")}</div>`;
  }
  if (phase === "batteryBuild") {
    const form = state.batteryForm;
    return `<div class="speaker system-speaker">지시 조립 · 대상 + 조건 + 행동</div>
      <h2>B-0에게 정확히 말하기</h2>
      <form id="battery-form" class="build-form">
        <label>대상<select name="target"><option value="">선택</option><option value="배터리" ${form.target === "배터리" ? "selected" : ""}>배터리</option><option value="공구함" ${form.target === "공구함" ? "selected" : ""}>공구함</option></select></label>
        <label>조건<select name="condition"><option value="">선택</option><option value="파란색" ${form.condition === "파란색" ? "selected" : ""}>파란색</option><option value="빨간색" ${form.condition === "빨간색" ? "selected" : ""}>빨간색</option></select></label>
        <label>행동<select name="action"><option value="">선택</option><option value="충전 장치에 연결" ${form.action === "충전 장치에 연결" ? "selected" : ""}>충전 장치에 연결</option><option value="가져오기" ${form.action === "가져오기" ? "selected" : ""}>가져오기</option></select></label>
        <label class="custom-label">직접 지시문 쓰기 <span>선택 사항</span><input name="custom" maxlength="120" placeholder="예: 파란색 배터리를 충전 장치에 연결해" value="${escapeHtml(form.custom)}"></label>
        <p class="form-note">직접 쓰면 위 선택보다 작성한 문장을 먼저 확인합니다.</p>
        ${feedbackMarkup()}
        <button class="primary-button" type="submit">B-0에게 지시하기 →</button>
      </form>${hintMarkup("‘배터리’라는 대상, ‘파란색’이라는 조건, ‘충전 장치에 연결’이라는 행동이 모두 있어야 합니다.")}`;
  }
  if (phase === "batterySuccess") {
    return `<div class="speaker">B-0</div><h2>명령 이해 완료</h2>
      <p class="dialogue-text">대상: 배터리. 조건: 파란색. 행동: 충전 장치에 연결. 이제 이해했습니다.</p>
      <div class="ai-note">파란 배터리가 충전 장치에 연결되고 다음 문이 열렸습니다.</div>
      <div class="action-stack">${button("B-0와 함께 이동 →", "to-ending", "primary-button")}</div>`;
  }
  if (phase === "ending") {
    const line = endingLines[state.endingIndex];
    return `<div class="speaker ${line.who === "SYSTEM" ? "system-speaker" : ""}">${line.who}</div>
      <p class="dialogue-text">${escapeHtml(line.text)}</p>
      <div class="action-stack">${button(state.endingIndex === endingLines.length - 1 ? "CHAPTER 1 완료 →" : "계속하기 →", "ending-next", "primary-button")}</div>`;
  }
  if (phase === "clear") {
    return `<div class="speaker system-speaker">CHAPTER 1 CLEAR</div><h2>B-0 LEARNING LOG #01</h2>
      <p class="dialogue-text">AI에게 지시할 때는 <strong>무엇을</strong>, <strong>어떤 조건으로</strong>, <strong>무엇을 해야 하는지</strong> 구체적으로 말해야 합니다.</p>
      <div class="result-grid"><span>플레이 시간<b>${clockText()}</b></span><span>재시도<b>${state.attempts}회</b></span><span>힌트<b>${state.hints}회</b></span></div>
      <p class="next-chapter">다음 장 · “한꺼번에 하지 마!”</p>
      <div class="action-stack">${button("학습 기록 내려받기", "download-log", "secondary-button")}${button("처음부터 다시 하기", "new", "primary-button")}</div>`;
  }
  return "";
}

function modalMarkup() {
  if (state.modal !== "log") return "";
  const recent = state.logs.slice(-12).reverse();
  return `<div class="modal-backdrop" role="presentation"><section class="log-modal" role="dialog" aria-modal="true" aria-labelledby="log-title">
    <div class="modal-heading"><div><p class="eyebrow">LOCAL PLAY LOG</p><h2 id="log-title">학습 기록</h2></div>${button("닫기", "log-close", "icon-button")}</div>
    <p class="modal-note">이 기록은 현재 브라우저에만 저장됩니다. 교사에게 공유하려면 JSON 파일을 내려받으세요.</p>
    <div class="log-list">${recent.length ? recent.map((entry) => `<div><time>${Math.floor(entry.second / 60).toString().padStart(2, "0")}:${(entry.second % 60).toString().padStart(2, "0")}</time><span>${escapeHtml(entry.text)}</span></div>`).join("") : "<p>아직 기록이 없습니다.</p>"}</div>
    <div class="modal-actions">${button("JSON 내려받기", "download-log", "secondary-button")}${button("닫기", "log-close", "primary-button")}</div>
  </section></div>`;
}

function gameMarkup() {
  return `<main class="game-shell">${statusMarkup()}${sceneVisual()}
    <section class="interface-panel" aria-live="polite">${panelMarkup()}</section>
    ${modalMarkup()}</main>`;
}

function arrangeSceneDialogue() {
  const scene = app.querySelector(".scene-area");
  const panel = app.querySelector(".interface-panel");
  if (!scene || !panel || state.phase === "clear") return;

  const speaker = panel.querySelector(":scope > .speaker");
  const dialogue = panel.querySelector(":scope > .dialogue-text");
  if (speaker && dialogue) {
    const bubble = document.createElement("aside");
    const who = speaker.textContent.trim();
    const robotLine = who.startsWith("B-0") || state.phase === "procedure";
    bubble.className = `speech-bubble ${robotLine ? "robot-line" : who.startsWith("학생") ? "student-line" : "system-line"}`;
    bubble.setAttribute("aria-label", `${who} 대사`);
    bubble.setAttribute("aria-live", "polite");
    bubble.append(speaker, dialogue);
    scene.appendChild(bubble);
    if (robotLine) {
      const robot = scene.querySelector(".b0-character");
      robot?.classList.add("speaking");
      window.setTimeout(() => {
        if (robot?.isConnected) robot.classList.remove("speaking");
      }, Math.min(4400, 700 + dialogue.textContent.length * 85));
    }
  }

  const label = document.createElement("p");
  label.className = "decision-label";
  label.textContent = panel.querySelector(".choice-button") ? "내가 할 말 선택"
    : state.phase === "batteryBuild" ? "명령 만들기"
      : (state.phase === "first" && !firstCluesReady()) || (state.phase === "terminal" && !terminalCluesReady()) || (state.phase === "batteryAmbiguity" && !batteryCluesReady()) ? "방 조사 중" : "다음 행동";
  panel.prepend(label);
}

function animateRobot(previousPhase) {
  const phase = state.phase;
  const shouldWalk = (phase === "firstResult" && state.firstSpecific && previousPhase === "first")
    || (phase === "terminal" && previousPhase === "firstResult")
    || (phase === "batteryAmbiguity" && previousPhase === "powerRestored")
    || (phase === "batteryBuild" && ["batteryAmbiguity", "batteryError"].includes(previousPhase))
    || (phase === "batterySuccess" && previousPhase === "batteryBuild");
  if (!shouldWalk || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const robot = app.querySelector(".b0-character");
  const sprite = robot?.querySelector(".b0-sprite");
  if (!robot || !sprite) return;
  const finalSprite = sprite.getAttribute("src");
  robot.classList.add("walking");
  sprite.setAttribute("src", "./assets/b0-step.png");
  [260, 490, 690].forEach((delay, index) => {
    window.setTimeout(() => {
      if (robot.isConnected) sprite.setAttribute("src", index % 2 === 0 ? "./assets/b0.png" : "./assets/b0-step.png");
    }, delay);
  });
  window.setTimeout(() => {
    if (!robot.isConnected) return;
    sprite.setAttribute("src", finalSprite);
    robot.classList.remove("walking");
  }, 880);
}

function render() {
  const previousPhase = lastRenderedPhase;
  app.innerHTML = showTitle ? titleMarkup() : state.phase === "opening" ? openingMarkup() : gameMarkup();
  if (!showTitle && state.phase !== "opening") {
    const scene = app.querySelector(".scene-area");
    if (scene && scene.dataset.shot !== lastRenderedShot) scene.classList.add("scene-enter");
    lastRenderedShot = scene?.dataset.shot || null;
    arrangeSceneDialogue();
    animateRobot(previousPhase);
    lastRenderedPhase = state.phase;
  }
  if (!showTitle && state.phase === "opening") {
    const video = document.querySelector("#opening-video");
    video.addEventListener("ended", () => setPhase("wake"), { once: true });
    video.play().catch(() => { /* Native controls allow manual playback. */ });
  }
}

function downloadLog() {
  const result = {
    game: "PROJECT B-0 Chapter 1",
    completed: state.phase === "clear",
    elapsedSeconds: state.elapsedSeconds,
    attempts: state.attempts,
    hints: state.hints,
    events: state.logs,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "project-b0-chapter1-log.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleAction(action) {
  if (action === "new") {
    state = freshState();
    state.phase = "opening";
    showTitle = false;
    logEvent("시작", "새 게임 시작");
    render();
    return;
  }
  if (action === "continue") {
    if (state.phase === "opening") state.phase = "wake";
    showTitle = false;
    render();
    return;
  }
  if (action === "skip-opening") {
    document.querySelector("#opening-video")?.pause();
    logEvent("영상", "오프닝 건너뛰기");
    setPhase("wake");
    return;
  }
  if (action === "sound") {
    state.muted = !state.muted;
    save();
    render();
    return;
  }
  if (action === "log-open" || action === "log-close") {
    state.modal = action === "log-open" ? "log" : "";
    render();
    return;
  }
  if (action === "download-log") { downloadLog(); return; }
  if (action === "hint") {
    state.hintOpen = !state.hintOpen;
    if (state.hintOpen) { state.hints++; logEvent("힌트", `${state.phase} 힌트 확인`); }
    save(); render(); return;
  }
  if (action === "close-inspection") {
    state.inspection = null;
    save(); render(); return;
  }
  if (action.startsWith("inspect-")) {
    const key = action.slice(8);
    const detail = inspectionDetails[key];
    if (!detail) return;
    state.clues[key] = true;
    state.inspection = key;
    state.feedback = "";
    logEvent("단서", `${detail.title}: ${detail.text}`);
    tone(500);
    render(); return;
  }
  if (action === "wake-next") {
    if (state.wakeIndex < wakeLines.length - 1) { state.wakeIndex++; save(); tone(520, 0.06); render(); }
    else setPhase("first");
    return;
  }
  if (action === "first-ambiguous" || action === "first-specific") {
    if (!firstCluesReady()) return;
    state.firstSpecific = action === "first-specific";
    if (!state.firstSpecific) state.attempts++;
    logEvent("지시", state.firstSpecific ? "가운데 보안 단말기를 조사해줘" : "저거 좀 해봐 → 환기 시스템 오작동");
    setPhase("firstResult"); return;
  }
  if (action === "to-terminal") { setPhase("terminal"); return; }
  if (action === "terminal-ambiguous" || action === "terminal-safe") {
    if (!terminalCluesReady()) return;
    state.terminalSafe = action === "terminal-safe";
    if (!state.terminalSafe) state.attempts++;
    logEvent("지시", state.terminalSafe ? "복구 절차를 먼저 찾기" : "아무거나 켜 → EMERGENCY 격리 모드");
    setPhase(state.terminalSafe ? "procedure" : "terminalError"); return;
  }
  if (action === "to-procedure") { setPhase("procedure"); return; }
  if (action.startsWith("procedure-")) {
    const choice = Number(action.split("-")[1]);
    const step = procedureSteps[state.procedureStep];
    logEvent("전원 지시", step.choices[choice]);
    if (choice === 0) {
      state.feedback = `B-0: ${step.success}`;
      state.procedureStep++;
      tone(740);
      if (state.procedureStep >= procedureSteps.length) setPhase("powerRestored");
      else { save(); render(); }
    } else {
      state.attempts++;
      state.feedback = step.error;
      tone(230, 0.18, "sawtooth");
      save(); render();
    }
    return;
  }
  if (action === "to-battery") { setPhase("batteryAmbiguity"); return; }
  if (action === "battery-ambiguous" || action === "battery-build") {
    if (state.phase === "batteryAmbiguity" && !batteryCluesReady()) return;
    if (action === "battery-ambiguous") {
      state.attempts++;
      logEvent("지시", "파란 거 가져가 → 파란 공구함 선택");
      setPhase("batteryError");
    } else setPhase("batteryBuild");
    return;
  }
  if (action === "to-ending") { state.endingIndex = 0; setPhase("ending"); return; }
  if (action === "ending-next") {
    if (state.endingIndex < endingLines.length - 1) { state.endingIndex++; save(); tone(520, 0.06); render(); }
    else { logEvent("완료", "Chapter 1 완료"); setPhase("clear"); }
  }
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (target) handleAction(target.dataset.action);
});

app.addEventListener("change", (event) => {
  if (event.target.closest("#battery-form")) {
    state.batteryForm[event.target.name] = event.target.value;
    save();
  }
});

app.addEventListener("input", (event) => {
  if (event.target.name === "custom" && event.target.closest("#battery-form")) {
    state.batteryForm.custom = event.target.value;
    save();
  }
});

app.addEventListener("submit", (event) => {
  if (event.target.id !== "battery-form") return;
  event.preventDefault();
  const values = new FormData(event.target);
  state.batteryForm = Object.fromEntries(values.entries());
  const custom = state.batteryForm.custom.trim();
  const targetOk = custom ? /배터리/.test(custom) : state.batteryForm.target === "배터리";
  const conditionOk = custom ? /파란|파랑/.test(custom) : state.batteryForm.condition === "파란색";
  const actionOk = custom ? /충전/.test(custom) && /연결|꽂|잇/.test(custom) : state.batteryForm.action === "충전 장치에 연결";
  logEvent("배터리 지시", custom || `${state.batteryForm.condition} ${state.batteryForm.target} → ${state.batteryForm.action}`);
  if (targetOk && conditionOk && actionOk) {
    tone(760, 0.18);
    setPhase("batterySuccess");
  } else {
    state.attempts++;
    const missing = [!targetOk && "대상(배터리)", !conditionOk && "조건(파란색)", !actionOk && "행동(충전 장치에 연결)"].filter(Boolean);
    state.feedback = `B-0가 지시를 확정하지 못했습니다. 확인할 요소: ${missing.join(", ")}.`;
    tone(230, 0.18, "sawtooth");
    save(); render();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.modal) {
    handleAction("log-close");
    return;
  }
  const tag = document.activeElement?.tagName;
  if ((tag === "INPUT" || tag === "SELECT" || tag === "BUTTON") || state.modal || showTitle) return;
  if (event.key === "ArrowRight" && state.phase === "wake") handleAction("wake-next");
  if (event.key === "ArrowRight" && state.phase === "ending") handleAction("ending-next");
});

setInterval(() => {
  if (showTitle || ["title", "clear"].includes(state.phase)) return;
  state.elapsedSeconds++;
  const clock = document.querySelector("#clock");
  if (clock) clock.textContent = clockText();
  if (state.elapsedSeconds % 5 === 0) save();
}, 1000);

render();
