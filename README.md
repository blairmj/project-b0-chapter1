# PROJECT B-0 Chapter 1

Chapter 1 **말 좀 제대로 해!**를 구현한 정적 브라우저 게임입니다. 초등 고학년용 세로 화면에 맞춰 제작했으며, 오프닝 영상에는 대사 음성 없이 말풍선과 효과음만 사용합니다.

## 실행

이 폴더에서 로컬 서버를 시작한 뒤 `http://localhost:8000`을 엽니다.

```powershell
python -m http.server 8000
```

`index.html`, `style.css`, `game.js`, `assets/`만으로 실행됩니다. 계정, API 키, 서버, 빌드 단계가 필요하지 않습니다. 경로는 모두 상대 경로라 GitHub Pages의 프로젝트 하위 경로에서도 동작합니다.

## GitHub Pages

이 폴더 내용을 저장소 루트에 올리고 기본 브랜치를 `main`으로 두세요. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정하면 `.github/workflows/pages.yml`이 정적 파일을 배포합니다. `index.html`은 배포 루트에 있습니다.

## 구성

- 20초 세로형 오프닝 영상, 건너뛰기 지원
- 연구소에서 깨어나는 도입과 B-0 대화
- 모호한 지시 및 전원 선택의 결과 확인
- 안내문에 근거해 B-0에게 단계별로 지시하는 전원 복구 퍼즐
- 대상·조건·행동을 조립하는 배터리 퍼즐과 직접 입력 검사
- B-0 학습 로그, 연구소 복선, Chapter 1 완료 화면
- 진행 상황 자동 저장, 재시작, 기기 내 학습 로그 JSON 내려받기

게임 기록은 브라우저의 `localStorage`에만 저장되며 서버로 전송하지 않습니다. 게임은 시나리오 문서 `PROJECT_B0_Chapter1_Scenario.docx`와 기획서 `PROJECT_B0_게임기획서_최종수정본.docx`를 바탕으로 구성했습니다. 현재 범위는 Chapter 1이며, 다음 장은 예고 화면으로 연결됩니다.

연구소 배경과 B-0 캐릭터 이미지는 이 프로젝트용으로 생성했습니다. 오프닝 영상은 제공된 네 컷 이미지로 만들었습니다.
