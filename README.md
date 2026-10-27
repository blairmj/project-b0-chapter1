# PROJECT B-0 · 연구소 탈출

**초등 고학년을 위한 AI 교육용 1인칭 퍼즐 어드벤처.**

모르는 것이 많은 AI 로봇 B-0와 함께 연구소를 탐색하고, 묻고 가르치고 확인하며 탈출하는 웹게임입니다.

[게임 플레이](https://blairmj.github.io/project-b0-chapter1/) · [소스코드](https://github.com/blairmj/project-b0-chapter1)

## 1. 게임 개요

| 항목 | 내용 |
| --- | --- |
| 대상 | 초등학교 5~6학년 |
| 장르 | 스토리 기반 퍼즐 어드벤처 / 방탈출 / 게임기반학습 |
| 시점 | 학생의 눈으로 보는 1인칭 |
| 핵심 경험 | 직접 탐색 → 단서 확인 → B-0에게 구체적으로 부탁 → 조작 → 결과 검증 |
| 교육 주제 | AI의 한계 이해, 명확한 지시, 역할 분담, 오류 수정, 정보와 결과 검증, 사람의 판단 |
| 실행 환경 | PC·태블릿의 웹 브라우저, 세로 화면 중심 |
| 현재 범위 | 4차시 공간과 엔딩까지 연결된 플레이 가능한 프로토타입 |

### 이야기

- 폐쇄된 AI 교육 연구소에서 깨어난 소년과 교육용 AI 로봇 B-0의 만남.
- 스스로 관찰하고, B-0가 모르는 것을 알려 주고, 서로의 역할을 나누며 연구소 탐색.
- 교육 실습실의 수업 기록과 기록 보관실의 비밀 일지에서 연구소의 운영 방식 발견.
- 중앙관리 AI AXIOM의 B-0 회수·초기화 명령에 맞서 함께 탈출할 방법 탐색.

## 2. 차시와 공간

| 차시 | 주요 공간 | 플레이 활동 | 연결되는 교육 내용 |
| --- | --- | --- | --- |
| 1 | 출입 관리실 | 물건과 B-0를 조사하고, 발견한 쪽지로 출입문 개방 | AI도 확인하지 않은 정보는 모를 수 있음. 대상과 질문을 구체적으로 정하기 |
| 2 | 교육 실습실·물류 보관실 | 수업 속 틀린 풀이 수정·검증, 기록 메모리 획득. 상자 배치와 B-0의 도움으로 탈출 | 필요한 설명·부분 검산 요청, 오류 수정, 사람과 AI의 역할 분담 |
| 3 | 기록 보관실·유리 관찰실 | 메모리를 컴퓨터에 연결해 비밀 일지 발견. 오래된 배치와 실제 방 비교, 유리벽 양쪽에서 협동 조작 | 정보의 근거·현재 상태 확인, 명확한 대상·동작·종료 조건 전달 |
| 4 | 2층 중앙관리실 | B-0의 상태와 제어 연결을 확인하고, 잠금장치를 협동 조작해 출구 개방 | 앞서 익힌 협력 방식 종합, 실제 결과 검증, AI 사용에서 사람의 판단 |

- 교육 실습실은 2차시 권역의 추가 공간으로, 별도 차시 번호 없이 연결.
- 1층 방은 복도에서 선택해 탐색. 차단 구역과 계단은 해당 통로·열쇠 조건에 따라 접근.
- 교육 실습실에서 얻은 기록 메모리를 연결해야 비밀 일지 파일 발견 가능.
- 유리 관찰실 너머에서 열쇠 획득 → 계단 차단 해제 → 2층 중앙관리실 진입.

## 3. 조작 방법

| 조작 | 동작 |
| --- | --- |
| 마우스 왼쪽 버튼·터치 드래그 | 방과 복도 둘러보기 |
| 물건 클릭·탭 | 조사하거나 가능한 행동 선택 |
| 복도 바닥 클릭·탭 | 선택한 위치로 이동 |
| 하단 방향 화살표 / 방향키·WASD | 복도 이동·좌우 시선 전환 |
| 움직일 수 있는 물건 드래그 | 상자 이동, 손잡이·잠금쇠·연결 단자 조작. 대상별 버튼 조작도 지원 |
| B-0에게 말하기 | 현재 상황에 맞는 질문·협력 요청 |
| 처음 위치로 | 현재 공간의 시점과 배율 초기화 |
| 상단 − / + | 화면 배율 조절 |
| 메뉴 | 지도·소지품·사용법·기록 보기·시작 화면 |

- 출입 관리실은 파노라마를 둘러보는 방식. 복도는 바닥을 눌러 직접 걷는 방식.
- 빈 책상 조사는 시점을 유지. 복도의 일반적인 자동 이동·회전은 드래그로 시선 조작 전환 가능.
- 문 통과와 계단 이동은 별도의 이동 연출 사용.
- 자세한 조작은 게임 안의 **메뉴 → 사용법**에서 확인.

### 임시 검토 기능

- **왼쪽 상단 위치 드롭다운:** 1·2층 복도와 각 방으로 바로 이동.
- **차시 앞으로 / 차시 끝으로:** 차시 시작 또는 마무리 상태로 이동하는 개발 확인용 기능.
- 위치 드롭다운은 소지품·퍼즐 진행을 유지. 차시 이동 버튼은 진행을 초기화하거나 완료 상태를 만들 수 있음.
- 임시 2층 이동은 실제 열쇠 획득·계단 해제를 대신 기록하지 않음.
- 정상적인 플레이 흐름 검토는 임시 기능을 사용하지 않고 **처음부터 시작**으로 진행.

## 4. 실행과 저장

### 온라인

[GitHub Pages에서 플레이](https://blairmj.github.io/project-b0-chapter1/)

시작 화면에서 **처음부터 시작** 또는 **이어하기** 선택.

### 로컬 실행

저장소 루트에서 Python 정적 서버 실행:

```sh
python -m http.server 8000
```

- 일반 실행: <http://localhost:8000/>
- 진행을 분리한 검토용 실행: <http://localhost:8000/preview-v2.html>
- 빌드 과정·서버 애플리케이션·API 키 불필요. Python은 로컬 파일 제공에만 사용.

### 저장 방식

- 일반 게임 진행은 브라우저의 `localStorage`에 자동 저장.
- `preview-v2.html`의 게임 진행은 `sessionStorage`에 저장하여 일반 게임과 분리.
- 방별 퍼즐, 소지품, 복도 위치, 열쇠·계단, 정전·비상 조명 상태 저장.
- 방을 옮기거나 **처음 위치로**를 눌러도 정전·퍼즐 상태 유지.
- **처음부터 시작**은 해당 실행 환경의 게임 진행 초기화. 브라우저·기기 간 저장 동기화는 미구현.

## 5. 기술 구성

| 구성 | 사용 방식 |
| --- | --- |
| HTML | 게임 진입점, 대화·메뉴·조작 대상의 문서 구조 |
| CSS | 화면 배치, 팝업, CSS 3D 물체, 전환·캐릭터 연출 |
| JavaScript | 입력, 카메라, 퍼즐 규칙, 대화 분기, 진행 저장, 렌더링 제어 |
| WebGL | 출입 관리실 파노라마와 복도·방의 입체 배경 렌더링 |
| SVG·이미지 | B-0 외형, 눈·입 표현, 장치와 재질 |
| MP4·Web Audio | 실습실 기록 영상과 짧은 효과음 |
| GitHub Pages | 정적 파일 호스팅 |

**WebGL은 JavaScript에서 사용하는 브라우저 그래픽 API입니다.** WebGL 제어 코드와 셰이더 소스도 JS 파일에 들어 있으므로 GitHub의 언어 통계에서 JavaScript 비중이 높게 나타납니다.

### 렌더링 구조

- **출입 관리실:** 한 장의 연속 파노라마를 WebGL로 투영하고 조사 대상과 같은 시선 각도 사용.
- **복도:** 문·바닥·계단을 연결한 WebGL 공간. 같은 카메라와 삼각형으로 클릭 대상 판정.
- **나머지 방:** WebGL 벽·바닥·천장과 CSS 3D 퍼즐 물체를 함께 사용. 공유 카메라로 위치와 가림 관계 유지.
- **B-0:** 이미지·SVG·평면 스프라이트 기반 표현. 눈·입 움직임과 상황별 자세를 조합.
- **실습실 영상:** 생성 일러스트에 느린 줌을 적용한 12초 무음 컷 영상. 재생·정지·되감기·텍스트 자막 지원.
- **AI 동작:** 정해진 게임 규칙과 대화 분기. 실제 생성형 AI 호출·음성 인식·얼굴 인식·모델 학습은 사용하지 않음.

### 주요 파일

| 역할 | 파일 |
| --- | --- |
| 진입점 | [index.html](index.html), [preview-v2.html](preview-v2.html) |
| 전체 진행·출입 관리실 | [firstperson.js](firstperson.js), [panorama.js](panorama.js) |
| 복도 이동·입체 공간 | [lab-navigation-model.js](lab-navigation-model.js), [lab-navigation.js](lab-navigation.js), [lab-webgl.js](lab-webgl.js) |
| 교육 실습실 | [education-model.js](education-model.js), [education-room.js](education-room.js) |
| 물류 보관실 | [chapter2-model.js](chapter2-model.js), [chapter2.js](chapter2.js) |
| 기록 보관실·유리 관찰실 | [chapter3.js](chapter3.js), [mirror-model.js](mirror-model.js), [mirror-room.js](mirror-room.js) |
| 중앙관리실·엔딩 | [chapter4-model.js](chapter4-model.js), [chapter4.js](chapter4.js) |
| 공통 화면·대화 | [ui-common.js](ui-common.js), [map-status.js](map-status.js), [room-dialogue.js](room-dialogue.js), [lab-dialogue.js](lab-dialogue.js) |
| 공통 공간·문 통과 | [room-space.js](room-space.js), [room-webgl.js](room-webgl.js), [room-transition.js](room-transition.js) |
| 리소스·검사 | [assets/](assets/), [tests/](tests/) |

## 6. 검사와 배포

### 자동 검사

Node.js로 실행하는 퍼즐 규칙·입력·진행 연결 검사 20개 구성. 실행에는 Node.js가 필요하며 게임 배포에는 필요하지 않음.

Windows PowerShell에서 전체 검사:

```powershell
Get-ChildItem tests -Filter *.cjs | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "검사 실패: $($_.Name)" }
}
```

주요 검증 대상:

- 방 사이 이동, 저장 복원, 임시 위치 이동.
- 상자 배치·올라서기·B-0 구조, 협동 손잡이·출입문 조건.
- 기록 메모리 획득과 비밀 일지 접근 조건.
- 팝업을 닫은 뒤 조작 재개, 드래그와 클릭 구분.
- WebGL 카메라·선택 좌표, 캐릭터 위치, 문 통과 처리.

자동 검사와 별도로 브라우저에서 실제 마우스 조작·세로 화면·연속 플레이 확인.

### GitHub Pages 배포

- `main` 브랜치에 푸시하면 [pages.yml](.github/workflows/pages.yml) 실행.
- 저장소의 정적 파일을 GitHub Pages로 배포. 별도 번들링·빌드 단계 없음.

---

## 참고: 개발 기록

<details>
<summary>개발 과정과 최근 변경 요약</summary>

| 단계 | 주요 내용 |
| --- | --- |
| 도입·첫 방 | B-0 얼굴 근접 화면, 1인칭 탐색, 보관함·쪽지·도어락 구성 |
| 협력 퍼즐 | 물류 보관실의 상자 배치·높이 변화·B-0와 상호 구조 구성 |
| 근거 확인·지시 | 기록 보관실의 배치도와 실제 방 비교, 유리 관찰실의 분리된 공간 협동 구성 |
| 최종 관문 | B-0 원격 제어 해제와 잠금장치 협력, 함께 나가는 장면·공부방 결말 연결 |
| 공간 표현 | 연속 파노라마, 복도 WebGL, 방의 공통 WebGL 배경, 문 열기·통과 연출 적용 |
| UI 통일 | 상단·하단 한 줄 배치, 공통 팝업·폰트, 메뉴에 지도·기록 배치 |
| 교육 실습실 | 수업 기록 영상, 풀이 수정·검증, 메모리와 비밀 일지 연결 |
| 입력·재방문 | 임시 위치 이동, 완료 방 재방문, 복도 드래그, 빈 책상 시점 유지 수정 |

최근 주요 변경:

- [80f1eb8](https://github.com/blairmj/project-b0-chapter1/commit/80f1eb8): 복도 드래그·클릭 구분과 빈 책상 조사 수정.
- [844011d](https://github.com/blairmj/project-b0-chapter1/commit/844011d): 위치 드롭다운, 방 재방문, 메모리를 가진 상태의 입장 대사 정리.
- [685beb0](https://github.com/blairmj/project-b0-chapter1/commit/685beb0): 교육 실습실·기록 메모리·비밀 교육 일지 추가.
- [9b4104c](https://github.com/blairmj/project-b0-chapter1/commit/9b4104c): B-0 비상 조명 요청과 조명 상태 저장.
- [ec99453](https://github.com/blairmj/project-b0-chapter1/commit/ec99453): 한 줄 내비게이션과 마지막 출구 대화 정리.

전체 변경 내역은 [커밋 기록](https://github.com/blairmj/project-b0-chapter1/commits/main/)에서 확인. 이전 구현·리소스는 Git 이력에서 추적 가능.

</details>

<details>
<summary>리소스 제작 참고</summary>

- 이미지 생성 프롬프트·참조·출력 기록: `assets/*manifest*.json`.
- 실습실 영상 제작 방식: [education-recording-manifest-v1.json](assets/education-recording-manifest-v1.json).
- 디지털 폰트: [NeoDunggeunmo 라이선스](assets/fonts/NeoDunggeunmo-LICENSE.txt).

</details>
