# AI Work Log — Architecture

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
