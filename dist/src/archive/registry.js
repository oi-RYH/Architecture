import {LAYERS,MODEL_CONFIG,GEUNJEONGJEON_SOURCE} from '../layers.js?v=official-1';
import {GYEONGHOERU_LAYERS,GYEONGHOERU_MODEL,GYEONGHOERU_SOURCE} from './layers-gyeonghoeru.js?v=official-1';

// Archive entries. Each record owns its 3D asset config, its layer reading,
// and the ink elevation plates rendered from that same model (front view).
// UI tones follow dancheong pigments; LAYERS keeps the shared descriptions.
const TONES={base:'#8f8b80',frame:'#8e3b2a',brackets:'#3f7a68',eaves:'#2f5d7c',roof:'#45484d',finishes:'#c07a35',ornaments:'#c39a32'};
// Bottom-up drawing order for the elevation plates.
const DRAW_ORDER=['base','frame','finishes','brackets','eaves','roof','ornaments'];

export const ARCHIVE=[{
 id:'geunjeongjeon',
 name:'근정전',hanja:'勤政殿',
 site:'서울 · 경복궁',role:'경복궁의 정전(正殿)',
 era:'1867년 중건',designation:'국보',
 form:'중층 · 팔작지붕 · 다포',
 summary:'경복궁의 중심 건물로, 국가 의례와 외국 사신 접견에 사용되었습니다.',
 source:GEUNJEONGJEON_SOURCE,
 assets:'./assets/archive/geunjeongjeon/',
 // World rectangle covered by the elevation plates (normalized model units).
 elevation:{left:-10,right:10,bottom:-.2,top:10.2},
 model:MODEL_CONFIG,
 layers:LAYERS.map(l=>({...l,tone:TONES[l.id],step:''})),
 drawOrder:DRAW_ORDER,
 credit:{
  text:'국가유산청, 2023 국가유산 디지털 콘텐츠 원천자원 · 경복궁 근정전 · 공공누리 제1유형',
  href:'https://digital.khs.go.kr/heritage/catalogDetail.do?order=1&index=1&id=13928228083859100002&type=1'
 }
},{
 id:'gyeonghoeru',
 name:'경회루',hanja:'慶會樓',
 site:'서울 · 경복궁',role:'경복궁의 누각(樓閣)',
 era:'1867년 중건',designation:'국보',
 form:'2층 누각 · 팔작지붕 · 익공',
 summary:'근정전 서북쪽 연못에 자리하며, 국가의 경사나 사신 방문 때 연회를 열었던 건물입니다.',
 source:GYEONGHOERU_SOURCE,
 assets:'./assets/archive/gyeonghoeru/',
 elevation:{left:-10,right:10,bottom:-.2,top:10.2},
 model:GYEONGHOERU_MODEL,
 // Interpretive pond: the source models only the island top (normalized units).
 pond:{rect:[-7.78,7.66,-6.72,6.76],waterY:-.5},
 layers:GYEONGHOERU_LAYERS.map(l=>({...l,tone:TONES[l.id],step:''})),
 drawOrder:DRAW_ORDER,
 credit:{
  text:'국가유산청 국가유산 디지털 콘텐츠 원천자원 · 경복궁 경회루',
  href:'https://digital.khs.go.kr/'
 }
}];

export const NUMERALS=['一','二','三','四','五','六','七','八','九','十'];
export const findEntry=id=>ARCHIVE.find(e=>e.id===id);
