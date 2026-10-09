# Architecture 이어서 작업하기

## 현재 프로젝트

- 실제 로컬 저장소: `/Users/baejeonghun/Documents/10-19_Coding/11_Personal-Projects/11.10_Architecture`
- 원격: https://github.com/oi-RYH/Architecture
- 현재 웹: `dist/index.html` — 고서 서가에서 근정전·경회루로 진입
- 실행: `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`
- 검사: `npm run check`
- 정적 ES modules 웹입니다. file:// 대신 HTTP로 실행합니다. 별도 빌드는 필요 없습니다.

## 현재 동작

책을 펼치면 같은 모델의 정면을 렌더한 밑그림이 표시되고 모델 준비 후 3D로 전환됩니다. 설명을 대신하는 시공 순서 비유 문구는 제거했습니다. 나갈 때는 모델을 정면으로 복귀시킨 뒤 완성된 밑그림으로 바꾸고 책을 덮습니다.

레이어 선택 시 다른 레이어에 3초 강조 효과를 적용합니다. 드래그 회전, 우클릭 이동, 휠 펼치기, 핀치/Ctrl+휠 확대를 지원합니다. 동작 줄이기 설정을 존중합니다.

경회루 연못과 석축은 원본 자료에 없는 별도 연출입니다. 먼저 준비하되 로딩 밑그림에서는 숨기고, 3D 전환 시 함께 1.6초 동안 나타납니다.

## 코드·자료

- `dist/src/archive/{app,stage,registry,pond,layers-gyeonghoeru}.js`: 현재 UI와 장면
- `dist/src/layers.js`: 근정전 레이어
- `dist/src/{model-loader,model-preload,member-instancing,view-gestures,procedural}.js`: 공유 의존성. procedural은 model-loader가 import하므로 제거하지 마세요.
- `dist/models/geunjeongjeon/`, `dist/models/gyeonghoeru/`: 웹 모델 보존
- `tools/`: 변환·텍스처·밑그림 도구
- `CONTENT_SOURCES.md`: 공식 설명 근거. 출처가 없으면 해설을 비우고 추정으로 채우지 않습니다.
- 경회루는 원본 병합 메시의 재질 33개를 기준으로 분리했습니다. 개별 부재와 전수 대조된 공식 분류가 아닙니다.
- 모델 화질·형상 유지. LOD 재도입 금지. originals/ 수정·삭제 금지.
- 모듈 변경 시 해당 import의 ?v= 캐시 버전도 확인합니다.

## 2026-10-09 이전 웹 정리

사용자 요청에 따라 지도·드론 진입, 스크롤 산책, 단독 뷰어와 전용 CSS·JS·지도 에셋을 dist에서 제거했습니다. 현재 페이지에서 이전 실험 링크도 삭제했습니다.

미커밋 수정까지 보존하기 위해 저장소 밖 `/Users/baejeonghun/Documents/Codex/architecture-legacy-ntVVft`에 기존 상대 경로로 옮겼습니다. 이전 README/이 문서 사본도 있습니다. 웹용 모델과 원본 참고 자료는 제거하지 않았습니다. 상세 과거 작업은 AI_WORK_LOG.md 및 Git 이력에 남습니다.

## 저장과 배포

작업 전 변경 상태를 확인합니다. 사용자 변경이 있을 때 자동 pull/stash/reset하지 않습니다. 사용자가 요청한 범위만 커밋·push하며, 커밋 요청만으로 원격 push나 배포하지 않습니다.

Sites 기존 설정은 .openai/hosting.json의 dist 배포를 유지합니다. originals/와 research/는 배포하지 않습니다. 이번 정리는 로컬 커밋만 수행합니다.
