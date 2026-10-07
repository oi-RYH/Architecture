# AI Work Log — Architecture

## 2026-10-07 / 목표 장소를 향한 드론 비행 추가

### Purpose / User Request

- 낮은 시점 이후 실제로 장소를 향해 날아들어가는 느낌을 추가한다.

### Work AI Actually Performed

1. 낮은 시점과 모델 준비 완료 사이에 대기 조건을 유지하고, 이후 목표 장소 중심의 가속 접근 구간을 추가했다.
2. 2400ms 동안 전진 효과 1→6.5배, 기울기 74→78도, 뱅크 최대 1.6도를 적용했다. 기존 하강 구간은 동일 배율로 유지했다.
3. 지도 비행 58% 시점에 실제 모델 카메라를 출발시킨 뒤 64%부터 교차 페이드했다. 지도 목표점은 실제 3D 뷰포트 중심으로 이동시켜 좌우 점프를 줄였다.
4. 실제 Three.js 카메라의 시작 거리를 기본 거리의 2.1배로 늘리고, 2400ms 동안 cubic ease-out으로 접근/감속하도록 수정했다. 모델의 위치/품질은 변경하지 않았다.
5. `architecture-landed` 메시지를 추가해 실제 카메라 도착 후 전환을 완료한다. 실패와 10초 도착 시간 초과 때 오류 복귀를 제공한다. 동작 줄이기에서는 비행을 생략한다.
6. 데스크톱 브라우저에서 flying 단계와 비행 진행률 0.729에서 지도 접근 배율 3.537을 확인했다. 390×844 모바일에서 실제 카메라 도착 진행률 1.000 및 조작 화면 진입, 오류 로그가 없는 것을 확인했다.

### Technologies / Decisions / Files

- CSS 원근 투영/배율로 지도 위 전진을 연출하고 Three.js 실제 카메라 거리 변화로 이어간다. 실제 드론 물리 시뮬레이션이나 3D 지형 비행은 아니다.
- AI 선택: 가속 곡선 `t²(2−t)`, 접근 배율 6.5, 뱅크 1.6°, 58%/64% 연결 시점, 실제 카메라 ease-out. 사용자 요청에 맞춘 연출 값이며 조정 가능하다.
- 변경: `dist/src/map-journey.js`, `dist/src/main.js`, `dist/map.css`, 버전 갱신을 위한 `dist/src/map.js`, `dist/index.html`, `dist/building.html`, 인계/작업 기록.
- 실행: `node --check work/journey-edit/dist/src/map-journey.js`, `node --check work/journey-edit/dist/src/main.js`, `npm run check`, `node --check dist/src/map-journey.js`, `node --check dist/src/map.js`, `git diff --check`; 편집본을 권한 도구로 개인 프로젝트에 복사해 적용. 구문 검사와 diff 검사를 통과했다.
- TECH 추가: Camera dolly and animation easing — 사용자가 “처음이라 설명이 필요해요”라고 답해 ⬜로 기록. Date Added / Last Confirmed 2026-10-07. CSS 지도 접근과 실제 카메라 전진의 차이, 가속/감속 목적을 설명했으며 이해 확인 전이므로 상태를 올리지 않았다. 기존 WORKFLOW의 Connect a map transition to a prepared 3D viewer에 연결한다.

## 2026-10-07 / 사용자 의도 정정: 배율을 유지한 낮은 시점

### Purpose / User Request

- 이전 수정의 전국 줌아웃은 요청을 잘못 해석한 결과였다. 사용자는 확대된 상태에서 카메라만 낮추고, 원래 viewport 바깥의 지도도 이어 보여달라고 정정했다.

### Work AI Actually Performed

1. 전국을 화면 안에 맞추던 nationalPose/projectedBounds 계산과 배율 보간, 전국 개관 정지 구간을 제거했다.
2. 전체 지도 데이터를 가진 평면은 유지하고, 초점 맞춤이 끝난 지도와 동일한 CSS 픽셀 크기로 구성했다. 작은 논리 평면을 확대하면서 생기던 선명도 저하도 줄였다.
3. 전환 배율을 1로 고정하고 2600ms 동안 0→74도 기울기와 화면상 위치만 보간했다. 가까운 지도 끝이 원근 투영 시점을 넘어 잘리는 것을 막도록 perspective 거리를 계산했다.
4. 로컬 브라우저에서 전환 직전 지도 너비 8792.247px와 전환 평면 너비 8792.25px, 전환 scale 1을 확인했다. 기울어진 화면에서도 주변 지도가 이어지는 장면을 저장했다.
5. `npm run check`, `node --check dist/src/map-journey.js`, `git diff --check`를 실행해 통과했다.

### Technologies / Decisions / Files

- CSS 3D 원근 투영과 지도 타일은 그대로 사용했다. **전국 데이터를 유지하는 것**과 **전국이 한 화면에 보이도록 축소하는 것**을 구분해야 한다.
- AI 선택: 지도의 기존 픽셀 밀도 유지, 가까운 평면이 시점 뒤로 넘어가지 않는 perspective 거리, 74도 기울기.
- 변경: `dist/src/map-journey.js`, 모듈 버전 갱신을 위한 `dist/src/map.js`와 `dist/index.html`, `CONTINUE_HERE.md`, 이 작업 기록.
- 관련 TECH/WORKFLOW 항목은 앞선 등록과 같으며 이해도 상태는 ❓로 유지했다. 새 기술이나 새로운 작업 단계가 아니므로 지식 저장소 재동기화는 하지 않았다.

아래 기록은 실제 수행한 이전 시도이며, 전국 맞춤 줌아웃 설정은 위 정정으로 폐기됐다.

## 2026-10-07 / 전체 화면 지도와 전국 지도 진입 전환

- Date (YYYY-MM-DD): 2026-10-07
- Work title: 기존 지도→근정전 전환의 화면 범위 개선

### Purpose

- 장소를 선택할 때부터 지도가 화면 전체를 사용하고, 시점이 낮아져도 전국 지도가 잘리지 않게 한다.

### User Request

- 장소 선택 이후 지도를 전체 화면으로 적용한다.
- 기울어진 지도에서 한 칸만 보이는 문제를 수정하고 전국 지도를 펼쳐 보여준다.

### Work AI Actually Performed

1. 기존 전환이 현재 viewport만 캔버스에 복사하므로 주변 지도가 사라지는 원인을 확인했다.
2. 지도 영역을 fixed 전체 화면으로 올리고, 변경 전 화면상 좌표를 보존한 뒤 장소에 초점을 맞추도록 수정했다.
3. 전환용 잘라낸 캔버스를 전국 지도 DOM 평면으로 교체했다. 전체 미리보기, 전국용 타일, 선택 위치의 세부 타일을 함께 배치했다. 기존 모델/원본 자산의 품질은 변경하지 않았다.
4. 먹 번짐만 작은 캔버스로 복사해 전체 지도 좌표 안의 올바른 위치에 올렸다.
5. CSS 원근 투영 후 네 모서리를 계산하고, 전국이 화면 안에 들어오는 배율을 이분 탐색으로 구했다.
6. 로컬 브라우저의 좁은 화면과 데스크톱 화면에서 전체 화면 전환 및 근정전 진입을 확인했다. 좁은 화면에서 전국 지도 경계가 화면 안에 들어오는 수치도 확인했다.
7. 전역 TECH/WORKFLOW 목록에 실제 사용한 중요 항목을 ❓로 등록하고 이해도 확인 질문을 전달했다. 이번 요청은 같은 모션의 후속 수정이므로 새 작업의 지식 저장소 동기화를 수행하지 않았다.

### Technologies / Tools Used

| Technology or Tool | Reason for Use | Where Applied |
|---|---|---|
| CSS fixed positioning | 화면의 헤더/사이드 영역까지 지도 영역으로 확장 | map.css, map.js |
| Multi-resolution AVIF map tiles | 전국을 빠짐없이 덮으면서 선택 위치의 디테일 유지 | map-journey.js, 기존 assets/map-tiles |
| CSS 3D perspective | 평면 지도를 낮은 시점으로 보여주는 공간 전환 | map-journey.js, map.css |
| Projected corners / binary search | 기울어진 지도의 사각 경계가 화면을 벗어나지 않는 최대 배율 계산 | nationalPose, projectedBounds |
| Canvas 2D | 기존 먹 번짐만 복사해 전체 지도 좌표에 연결 | fullPaper |
| Same-origin iframe / postMessage / Three.js WebGL | 기존 구현의 실제 모델 사전 준비와 진입 연결 유지 | 기존 main.js, map-journey.js |
| Codex browser tools / Node.js syntax checks | 실제 렌더링과 JavaScript 구문 확인 | localhost:4173, 터미널 |

### Commands Run

주요 확인 명령. 샌드박스 밖 개인 프로젝트는 작업 공간의 편집본을 명시적 권한 도구로 복사해 반영했다.

```text
git status --short --branch
cat dist/src/map-journey.js dist/src/map.js
tail -45 dist/map.css
cat dist/assets/map-tiles/manifest.json
node --check work/journey-edit/dist/src/map-journey.js
node --check work/journey-edit/dist/src/map.js
lsof -nP -iTCP:4173 -sTCP:LISTEN
npm run check
node --check dist/src/map.js
node --check dist/src/map-journey.js
git diff --check
```

### Important Settings / Options

| Setting or Option | Value | Reason and Effect |
|---|---|---|
| 전국 타일 단계 | level 1, 2230×3751, 12 tiles | 전체 나라를 덮는 기본 지도, 선택 위치는 기존 정밀 타일 중첩 |
| 논리 평면 너비 | 1000 CSS px | 거대한 전국 캔버스를 생성하지 않고 이미지별 렌더링 유지 |
| 최종 기울기 | 64°, 모델 전환 중 68° | 낮은 시점에서도 전체 지도 형태를 확인 |
| 화면 안 지도 경계 | width 94%, height 66% | 모바일 및 데스크톱에서 네 모서리 여백 유지 |
| 전국 전개 시간 | 3100ms + 900ms pause | 전국이 펼쳐진 모습을 확인한 뒤 모델 연결 |
| Reduced motion | 애니메이션 duration 0 | 기존 동작 줄이기 설정 존중 |

### Files Created or Changed

| File Path | Created or Changed | Description |
|---|---|---|
| dist/src/map.js | Changed | 클릭 직후 전체 화면과 좌표 보존 |
| dist/src/map-journey.js | Changed | 전국 지도 구성, 원근 경계 계산, 전개 동작 |
| dist/map.css | Changed | 전체 화면 지도, 전국 평면과 타일 스타일 |
| dist/index.html | Changed | 모듈/CSS 버전 갱신 |
| CONTINUE_HERE.md | Changed | 최신 전환 구조 인계 |
| AI_WORK_LOG.md | Created | 실제 수행 과정 기록 |

### Technical Decisions AI Made on the User's Behalf

| Decision | Rationale | Directed by User? |
|---|---|---|
| 화면 캡처를 전체 지도 DOM 평면으로 교체 | 캡처 밖 지역이 소실되지 않음 | 전체 지도라는 결과는 요청, 방법은 AI 선택 |
| 전국 타일+지역 세부 타일 조합 | 전국 자산을 최고 단계로 모두 디코딩하는 부담을 줄이면서 기존 세부 타일 사용 | AI 선택 |
| 투영된 네 모서리 기반 배율 계산 | 단순 고정 scale은 화면 비율에 따라 지도가 잘림 | AI 선택 |
| 64도와 900ms 전국 확인 구간 | 지도 전체 형태가 보이는 시점과 전환 속도 절충 | AI 선택, 사용자 조정 가능 |

### Items Requiring a User Knowledge Check

| Item | Question or Explanation Needed | Check Result |
|---|---|---|
| 지도 타일 | 전국/세부 타일을 함께 사용하는 이유를 설명할 수 있는가 | ❓ Unreviewed |
| CSS 원근 투영 | 평면 지도 연출과 실제 3D 지형의 차이, 네 모서리 계산의 목적 | ❓ Unreviewed |
| 3D 사전 로딩 | 모델 준비 완료 신호까지 기존 화면을 유지하는 이유 | ❓ Unreviewed |

### Related Checklist Items

- TECH_KNOWLEDGE.md: Multi-resolution map tiles and full-map coverage; CSS 3D perspective and camera framing; WebGL scene preloading with iframe and postMessage.
- WORKFLOW_KNOWLEDGE.md: Diagnose map transition coverage and verify camera framing; Connect a map transition to a prepared 3D viewer.
