// Viewing groups split 33 source materials, not individually verified members.
// KHS facts only; see CONTENT_SOURCES.md. Empty descriptions are intentional.
export const GYEONGHOERU_SOURCE={label:'국가유산청 · 경복궁 경회루',href:'https://digital.khs.go.kr/heri/heriDetail.do?ctptNo=1111102240000&ctptUid=13898859666538200072'};
export const GYEONGHOERU_LAYERS=[
 {id:'base',name:'기단·돌기둥',english:'STONE BASE & PILLARS',color:'#b9bbaf',offset:[0,0,0],description:'바깥쪽 돌기둥은 네모꼴이고 안쪽 돌기둥은 둥근 형태입니다.',tag:'',source:GYEONGHOERU_SOURCE},
 {id:'frame',name:'목조가구',english:'TIMBER FRAME',color:'#c69666',offset:[0,2.4,0],description:'',tag:''},
 {id:'brackets',name:'공포부',english:'BRACKETS',color:'#71aa91',offset:[0,4.8,0],description:'경회루의 공포 양식은 익공입니다.',tag:'',source:GYEONGHOERU_SOURCE},
 {id:'eaves',name:'처마부',english:'EAVES & RAFTERS',color:'#93b6a3',offset:[0,7.2,0],description:'경회루의 처마 형식은 겹처마입니다.',tag:'',source:GYEONGHOERU_SOURCE},
 {id:'roof',name:'지붕부',english:'ROOF',color:'#85969d',offset:[0,9.6,0],description:'경회루의 지붕 형식은 팔작입니다.',tag:'',source:GYEONGHOERU_SOURCE},
 {id:'finishes',name:'수장·창호',english:'FLOOR, RAILS & FINISHES',color:'#b76f5c',offset:[0,0,3.5],description:'아래층 바닥은 네모난 벽돌로, 위층 바닥은 마루로 되어 있습니다. 위층 마루에는 세 단계의 높이 차가 있습니다.',tag:'',source:GYEONGHOERU_SOURCE},
 {id:'ornaments',name:'현판',english:'NAMEPLATE',color:'#d7b175',offset:[0,3.2,3.5],description:'현판은 검은 바탕에 금색 글씨로 되어 있습니다.',tag:'',source:GYEONGHOERU_SOURCE}
];
export const GYEONGHOERU_MODEL={kind:'official',normalizedWidth:18,dir:'./models/gyeonghoeru/',version:'ghr-2',assets:['base','frame','brackets','eaves','roof','finishes','ornaments']};
