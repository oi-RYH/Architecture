// Report-informed viewing categories, not construction/dismantling stages.
export const LAYERS = [
 {id:'base',name:'기단·월대',english:'STONE PLATFORM',color:'#b9bbaf',offset:[0,0,0],description:'월대와 계단, 초석, 돌난간은 근정전의 하부를 구성합니다. 초석은 기둥을 받치고, 월대는 건물 주변에 높인 공간을 만듭니다. 난간의 석수는 설치된 월대와 함께 살펴봅니다.',tag:'월대 · 계단 · 초석 · 돌난간'},
 {id:'frame',name:'목조가구',english:'TIMBER FRAME',color:'#c69666',offset:[0,2.6,0],description:'가구(架構)는 목재를 짜 맞춘 건축 골격입니다. 기둥과 보, 창방·평방 등 연결 부재가 함께 건물을 지지합니다. 보아지와 화반도 골격을 설명하는 이 항목에 묶었습니다.',tag:'기둥 · 보 · 창방 · 평방'},
 {id:'brackets',name:'공포부',english:'BRACKET SYSTEM',color:'#71aa91',offset:[0,5.2,0],description:'공포는 주두·소로와 여러 가로 부재가 짜여 지붕을 받치는 구조입니다. 근정전은 기둥 위와 기둥 사이에 공포를 배치한 다포식 건물입니다. 서까래는 별도의 처마부에서 살펴봅니다.',tag:'다포식 · 주두 · 소로 · 공포 짜임'},
 {id:'eaves',name:'처마부',english:'EAVES & RAFTERS',color:'#93b6a3',offset:[0,7.8,0],description:'처마는 지붕이 건물 밖으로 내민 부분입니다. 이 보기에서는 원본 모델의 서까래와 모서리 서까래 묶음을 분리합니다. 실제 부재의 결합과 처마 곡선을 살펴보되, 일부 메시는 여러 부재가 합쳐진 형태입니다.',tag:'서까래 · 모서리 구성 · 처마 곡선'},
 {id:'roof',name:'지붕부',english:'ROOF',color:'#85969d',offset:[0,10.4,0],description:'근정전은 중층 팔작지붕 건물입니다. 기와와 지붕마루, 합각과 지붕 장식을 함께 살펴봅니다. 바깥 지붕은 상·하층으로 나뉘지만 건물 내부는 위아래가 트인 통층입니다.',tag:'기와 · 지붕마루 · 합각 · 지붕 장식'},
 {id:'finishes',name:'수장·창호',english:'ENCLOSURE & FINISHES',color:'#b76f5c',offset:[0,0,3.5],description:'창호와 문틀, 판벽, 바닥과 천장 마감은 공간의 안팎과 실내를 구성합니다. 하중을 받는 기둥은 목조가구에 따로 두었습니다. 수장부를 바탕으로 원본 모델에서 식별되는 마감 요소를 묶은 보기입니다.',tag:'창호 · 문틀 · 판벽 · 바닥 · 천장'},
 {id:'ornaments',name:'어좌·기타 장식',english:'THRONE & ORNAMENTS',color:'#d7b175',offset:[0,0,-3.5],description:'어좌와 일월오봉도, 어좌 상부 장식 및 원본의 기타 장식 요소를 살펴봅니다. 단청은 이 항목만의 장식이 아니라 목조가구·공포·처마 등 여러 부재 표면에 걸쳐 있습니다. 이름만으로 세부 용도가 확정되지 않는 장식은 이곳에 함께 두었습니다.',tag:'어좌 · 일월오봉도 · 기타 장식'}
];
export const MODEL_CONFIG={kind:'official',normalizedWidth:18,assets:['roof','brackets','frame','walls','base']};
