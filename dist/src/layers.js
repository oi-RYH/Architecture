// Viewing groups are not official member classifications or construction stages.
// KHS facts only; see CONTENT_SOURCES.md. Empty descriptions are intentional.
export const GEUNJEONGJEON_SOURCE={label:'국가유산청 · 경복궁 근정전',href:'https://digital.khs.go.kr/heri/heriDetail.do?ctptNo=1111102230000&ctptUid=13898859666526200071'};
export const LAYERS = [
 {id:'base',name:'기단·월대',english:'STONE PLATFORM',color:'#b9bbaf',offset:[0,0,0],description:'월대 모서리와 계단 주변 난간기둥에는 십이지신상 등을 포함한 동물 조각이 있습니다.',tag:'',source:GEUNJEONGJEON_SOURCE},
 {id:'frame',name:'목조가구',english:'TIMBER FRAME',color:'#c69666',offset:[0,2.6,0],description:'',tag:''},
 {id:'brackets',name:'공포부',english:'BRACKET SYSTEM',color:'#71aa91',offset:[0,5.2,0],description:'근정전의 공포 양식은 다포입니다. 공포는 기둥 위와 기둥 사이에 배치되어 있습니다.',tag:'',source:GEUNJEONGJEON_SOURCE},
 {id:'eaves',name:'처마부',english:'EAVES & RAFTERS',color:'#93b6a3',offset:[0,7.8,0],description:'근정전의 처마 형식은 겹처마입니다.',tag:'',source:GEUNJEONGJEON_SOURCE},
 {id:'roof',name:'지붕부',english:'ROOF',color:'#85969d',offset:[0,10.4,0],description:'근정전의 지붕 형식은 팔작입니다. 내부 공간은 위아래로 나뉘지 않은 통층입니다.',tag:'',source:GEUNJEONGJEON_SOURCE},
 {id:'finishes',name:'수장·창호',english:'ENCLOSURE & FINISHES',color:'#b76f5c',offset:[0,0,3.5],description:'',tag:''},
 {id:'ornaments',name:'어좌·기타 장식',english:'THRONE & ORNAMENTS',color:'#d7b175',offset:[0,0,-3.5],description:'실내 뒤쪽 중앙에 어좌가 있으며, 그 뒤에는 일월오악도 병풍이 놓여 있습니다.',tag:'',source:GEUNJEONGJEON_SOURCE}
];
export const MODEL_CONFIG={kind:'official',normalizedWidth:18,dir:'./models/geunjeongjeon/',assets:['roof','brackets','frame','walls','base']};
