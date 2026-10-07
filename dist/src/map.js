import {revealInk} from './ink-reveal.js?v=journey-1';
import {createJourney,animateJourney} from './map-journey.js?v=journey-1';
import {createMapTiles} from './map-tiles.js?v=journey-1';
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
viewport.addEventListener('keydown',e=>{if(entering||e.target!==viewport)return;const deltas={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(deltas[e.key]){e.preventDefault();x+=deltas[e.key][0];y+=deltas[e.key][1];paint();}if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1/1.2:1.2);}});
async function enter(e){if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();if(entering)return;entering=true;pointers.clear();
try{sessionStorage.setItem('map-view',JSON.stringify({scale,x,y}));}catch{}
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const journey=createJourney({reduced});
document.body.classList.add('journey-focusing');
document.querySelector('#journey-status').textContent='한양으로 이동합니다.';
const start={scale,x,y},marker=document.querySelector('#palace-marker');
// One panel in the existing 10 × 22 paper grid. Recompute on resize so the
// destination stays centered on both desktop and the mobile sheet offset.
await animateJourney(reduced?0:1600,t=>{
 const targetScale=Math.min(maxZoom(),.84*Math.min(viewport.clientWidth/(sheet.clientWidth/10),viewport.clientHeight/(sheet.clientHeight/22)));
 const markerStyle=getComputedStyle(marker);
 const mx=parseFloat(markerStyle.left)/sheet.clientWidth,my=parseFloat(markerStyle.top)/sheet.clientHeight;
 const tx=viewport.clientWidth/2-sheet.offsetLeft-(mx-.5)*sheet.clientWidth*targetScale;
 const ty=viewport.clientHeight/2-sheet.offsetTop-(my-.5)*sheet.clientHeight*targetScale;
 scale=Math.exp(Math.log(start.scale)+(Math.log(targetScale)-Math.log(start.scale))*t);
 x=start.x+(tx-start.x)*t;y=start.y+(ty-start.y)*t;paint();
});
viewport.dataset.journeyFocusScale=scale.toFixed(4);
// Give the final tile level a chance to decode; a complete preview is always available.
await tileView?.settle(1200);
if(!reduced){
 const r=document.querySelector('.seal').getBoundingClientRect(),point={x:r.x+r.width/2,y:r.y+r.height/2};
 document.body.style.setProperty('--ink-x',`${point.x}px`);document.body.style.setProperty('--ink-y',`${point.y}px`);document.body.classList.add('entering');
 try{await revealInk(viewport,sheet,point);}catch(error){console.warn('Ink reveal unavailable',error);}
}
if(await journey.enter(viewport,sheet)){
 tileView?.dispose();removeEventListener('resize',paint);
 sheet.replaceChildren();viewport.querySelector('.ink-map-reveal')?.remove();
}
}
document.querySelectorAll('a[href="./building.html"]').forEach(a=>a.addEventListener('click',enter));addEventListener('pageshow',()=>{entering=false;document.body.classList.remove('entering','ink-ready','ink-absorbing','ink-departing');document.querySelector('.ink-map-reveal')?.remove();});addEventListener('resize',paint);paint();

createMapTiles(viewport,sheet).then(view=>{tileView=view;paint();}).catch(()=>{viewport.dataset.mapLoad="fallback";document.querySelector("#journey-status").textContent="고해상도 지도를 불러오지 못했습니다. 기본 지도로 표시합니다.";});
