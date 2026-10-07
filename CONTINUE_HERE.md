# 다른 맥북에서 이어서 작업하기

## 시작

1. 이 저장소를 내려받습니다: `git clone https://github.com/oi-RYH/Architecture.git`
2. Codex에서 내려받은 `Architecture` 폴더를 프로젝트로 엽니다.
3. 터미널에서 아래 명령을 실행합니다. Python 3이 필요합니다.

```sh
cd Architecture
python3 -m http.server 4173 --directory dist
```

브라우저에서 http://localhost:4173/ 을 여세요. 건축물 화면은 http://localhost:4173/building.html 입니다. 파일을 더블클릭해 여는 방식은 ES modules 때문에 지원하지 않습니다. 별도 npm 설치나 빌드는 필요 없습니다. Node.js가 있으면 `npm run check`로 기존 주요 모듈을 구문 검사할 수 있습니다.

## 포함한 자료

- `dist/`: 실제 배포하는 웹 전체. 웹용 3D 모델, 압축 텍스처, 지도 타일, Three.js 및 디코더를 포함합니다.
- `originals/geunjeongjeon/Texture/`: 다운로드 원본 텍스처. PNG 663개와 Maya swatch 3개. 변경하지 않았습니다.
- `originals/geunjeongjeon/manifest.json`: 원본 667개 전체의 크기와 SHA-256, 포함 여부.
- `research/`: 화면 검증 자료와 이전에 사용한 LOD 에셋 등 참고 자료.
- `.openai/hosting.json`: 기존 Sites 프로젝트 연결 설정. 기존 사이트를 업데이트할 때 유지합니다.

원본 `FBX/Geunjeongjeon.fbx`(539,950,464 bytes, 약 514.94 MiB)는 사용자 요청으로 제외했습니다. 현재 웹 실행과 UI/기능 수정에는 필요 없습니다. 원본 FBX를 다시 변환하려면 기존 맥북 다운로드 폴더에서 별도로 복사해야 합니다. 이 파일은 `.gitignore`로 제외합니다. 원본 재변환 도구/스크립트가 모두 이 저장소에 포함되어 있다고 가정하지 마세요.

원본 출처: 국가유산청, 2023 경복궁 근정전. 기존 프로젝트 출처 기록은 공공누리 제1유형(출처표시)입니다. 상세 출처는 `dist/models/provenance.json`, 지도 출처는 `dist/assets/map-source.txt`를 확인하세요. 해당 provenance 파일 일부는 이전 최적화 단계의 이력을 담고 있으므로 현재 동작은 소스와 아래 현황을 우선 확인하세요.

## 현재 동작과 사용자 결정

- 지도 메인 → 근정전 건축물 화면. 대동여지도 원본 17,837×30,000에서 만든 5단계 AVIF 타일 사용.
- 평소 지도는 블러 없이 투명도로 옅게 표시합니다. 표식을 누르면 먹이 종이 결을 따라 퍼지며 해당 부분의 원래 진한 지도를 드러냅니다.
- 먹 번짐은 전국으로 확장하지 않습니다. 모든 장소에 공통으로 지도 너비의 3.5% 지름을 상한으로 사용합니다(`ink-policy.js`). 서울 규모를 시각적으로 근사한 값이며 정확한 행정경계는 아닙니다.
- 건축물 바닥은 한지. 하늘/산 배경 추가는 보류했습니다.
- 3D 모델은 고해상도 단일 표현. 자동 LOD는 사용자 요청으로 제거했습니다. GPU 텍스처 압축, 사전 준비, 동일 반복 부재 인스턴싱은 유지합니다.
- 드래그 회전, 우클릭 드래그 이동, 일반 휠 구조 분해, 핀치/Ctrl+휠 확대·축소. 처음 시점 복귀는 부드러운 애니메이션입니다. 이전 슬라이더와 +/- 버튼은 제거했습니다.
- 해설 분류: 기단·월대 / 목조가구 / 공포부 / 처마부 / 지붕부 / 수장·창호 / 어좌·기타 장식. 전통 건축 보고서의 구분을 참고한 해설용 매핑이며 근정전의 공식 7분류라는 의미는 아닙니다.
- 마지막 수정: 지도 축소용 타일 로딩이 실패할 때 확대 타일 일부만 남는 오류를 수정. 전체 미리보기 유지, 실패 캐시 제거 및 재시도, 준비된 타일 묶음 교체, 화면 크기 변경 감지를 적용했습니다.

## 주요 파일

- `dist/src/map.js`, `map-tiles.js`, `ink-reveal.js`, `ink-policy.js`: 지도/입력/먹 번짐.
- `dist/index.html`, `dist/map.css`: 지도 메인 UI.
- `dist/building.html`, `dist/src/main.js`: 3D 페이지와 카메라/렌더링.
- `dist/src/model-loader.js`, `dist/src/layers.js`: 모델 로딩과 해설 레이어 매핑.

## 배포와 두 맥북 사이의 동기화

기존 사이트: https://geunjeongjeon-architecture-lab.ryuyaelhwa.chatgpt.site/
Sites 프로젝트 ID: `appgprj_6abc9626b3ec81918361bf0adb53fb9a`
이관 기준 Sites 커밋: `21966f7adc002126fb2052fa77676a29fe28d616`

GitHub에 push한다고 기존 Sites가 자동 배포되는 것은 아닙니다. Codex의 Sites 플러그인으로 기존 프로젝트를 선택하고 최신 변경을 해당 저장소에 반영해 배포해야 합니다. 사이트의 접근 권한은 별도이며 변경하지 마세요. `originals/`는 참고용으로 보관하고 웹 배포물에 포함하지 마세요. 배포 대상은 `dist/`입니다.

작업 시작 전 `git pull --ff-only`, 작업 완료 후 commit/push를 수행하세요. 두 맥북에서 같은 파일을 동시에 수정하면 충돌을 해결해야 합니다. 현재 GitHub 이관은 최신 작업 상태의 스냅샷이며 Sites의 과거 Git 이력을 복사하지 않았습니다. Git LFS는 사용하지 않았으므로 일반 clone만으로 포함된 데이터도 함께 받습니다. 초기 다운로드는 약 8GB 규모입니다.

## 새 대화에 전달할 문장

CONTINUE_HERE.md와 AGENTS.md를 읽고 기존 근정전 웹 작업을 이어가줘. 현재 품질과 사용자 결정은 유지하고, 요청한 변경만 적용해줘. 배포할 때는 새 사이트를 만들지 말고 .openai/hosting.json의 기존 Sites 프로젝트를 사용해줘.
