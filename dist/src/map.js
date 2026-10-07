import {revealInk} from './ink-reveal.js?v=tile-recovery-1';
import {createMapTiles} from './map-tiles.js?v=tile-recovery-1';
const viewport=document.querySelector('#map-viewport'),sheet=document.querySelector('#map-sheet');
const backing=document.createElement('div');backing.className='map-paper';backing.setAttribute('aria-hidden','true');
for(let i=0;i<220;i++){const panel=document.createElement('span');panel.style.setProperty('--paper-tone',String(.17+(i*7%11)*.004));panel.style.backgroundPosition=`${i*37%100}% ${i*61%100}%`;backing.append(panel);}sheet.prepend(backing);
let scale=1,x=0,y=0,entering=false,tileView=null;
const maxZoom=()=>Math.min(40,17837/(sheet.clientWidth*Math.min(devicePixelRatio||1,2)));
try{const saved=JSON.parse(sessionStorage.getItem('map-view'));if(saved&&[saved.scale,saved.x,saved.y].every(Number.isFinite)){scale=Math.min(maxZoom(),Math.max(.4,saved.scale));x=saved.x;y=saved.y;}}catch{}
function paint(){
 const limitX=sheet.clientWidth*scale/2+viewport.clientWidth*.3,limitY=sheet.clientHeight*scale/2+viewport.clientHeight*.3;
 x=Math.max(-limitX,Math.min(limitX,x));y=Math.max(-limitY,Math.min(limitY,y));
 sheet.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(${scale})`;
 sheet.style.setProperty('--marker-scale',String(1/Math.max(1,scale)));
 sheet.classList.toggle("zoomed",scale>=1.7);viewport.dataset.zoom=scale.toFixed(2);tileView?.update();
}
function zoom(factor,anchor){if(entering)return;const r=sheet.getBoundingClientRect();const previous=scale;scale=Math.min(maxZoom(),Math.max(.4,scale*factor));const a=anchor||{x:viewport.getBoundingClientRect().left+viewport.clientWidth/2,y:viewport.getBoundingClientRect().top+viewport.clientHeight/2};x+=(a.x-(r.left+r.width/2))*(1-scale/previous);y+=(a.y-(r.top+r.height/2))*(1-scale/previous);paint();}
document.querySelector('#map-in').onclick=()=>zoom(1.2);document.querySelector('#map-out').onclick=()=>zoom(1/1.2);document.querySelector('#map-reset').onclick=()=>{if(entering)return;scale=Math.min(1,(viewport.clientHeight-60)/sheet.clientHeight);x=y=0;paint();};
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.002),{x:e.clientX,y:e.clientY});},{passive:false});
let pointers=new Map();viewport.addEventListener('pointerdown',e=>{if(entering)return;if(e.target.closest('button,a'))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{const prev=pointers.get(e.pointerId);if(!prev)return;const next={x:e.clientX,y:e.clientY};if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1];const old=Math.hypot(prev.x-other.x,prev.y-other.y),dist=Math.hypot(next.x-other.x,next.y-other.y);if(old>5)zoom(dist/old,{x:(next.x+other.x)/2,y:(next.y+other.y)/2});}else{x+=next.x-prev.x;y+=next.y-prev.y;paint();}pointers.set(e.pointerId,next);});for(const event of ['pointerup','pointercancel'])viewport.addEventListener(event,e=>pointers.delete(e.pointerId));
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const deltas={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(deltas[e.key]){e.preventDefault();x+=deltas[e.key][0];y+=deltas[e.key][1];paint();}if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1/1.2:1.2);}});
async function enter(e){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();if(entering)return;entering=true;pointers.clear();
try{sessionStorage.setItem('map-view',JSON.stringify({scale,x,y}));}catch{}
if(matchMedia('(prefers-reduced-motion:reduce)').matches){location.assign('./building.html');return;}
let r=document.querySelector('.seal').getBoundingClientRect();const v=viewport.getBoundingClientRect();
if(r.right<v.left||r.left>v.right||r.bottom<v.top||r.top>v.bottom){scale=1;x=y=0;paint();r=document.querySelector('.seal').getBoundingClientRect();}
const point={x:r.x+r.width/2,y:r.y+r.height/2};document.body.style.setProperty('--ink-x',`${point.x}px`);document.body.style.setProperty('--ink-y',`${point.y}px`);document.body.classList.add('entering');document.querySelector('#journey-status').textContent='먹이 스며들며 근정전으로 들어갑니다.';
try{await revealInk(viewport,sheet,point);}catch{await new Promise(r=>setTimeout(r,600));}location.assign('./building.html');}
document.querySelectorAll('a[href="./building.html"]').forEach(a=>a.addEventListener('click',enter));addEventListener('pageshow',()=>{entering=false;document.body.classList.remove('entering','ink-ready','ink-absorbing','ink-departing');document.querySelector('.ink-map-reveal')?.remove();});addEventListener('resize',paint);paint();

createMapTiles(viewport,sheet).then(view=>{tileView=view;paint();}).catch(()=>{viewport.dataset.mapLoad="fallback";document.querySelector("#journey-status").textContent="고해상도 지도를 불러오지 못했습니다. 기본 지도로 표시합니다.";});
