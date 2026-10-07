// Chromium/Firefox trackpad pinches arrive as Ctrl+wheel; Safari uses gesture events.
export function bindViewGestures(host,{zoomBy,explodeBy}){
 let gestureActive=false,lastScale=1;
 host.addEventListener('wheel',e=>{
  e.preventDefault();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1);
  if(e.ctrlKey){
   if(!gestureActive)zoomBy(Math.exp(Math.max(-120,Math.min(120,delta))*.005));
  }else if(!gestureActive)explodeBy(delta/1800);
 },{passive:false});
 host.addEventListener('gesturestart',e=>{e.preventDefault();gestureActive=true;lastScale=e.scale>0?e.scale:1;},{passive:false});
 host.addEventListener('gesturechange',e=>{
  e.preventDefault();
  if(gestureActive&&Number.isFinite(e.scale)&&e.scale>0){zoomBy(lastScale/e.scale);lastScale=e.scale;}
 },{passive:false});
 host.addEventListener('gestureend',e=>{e.preventDefault();gestureActive=false;lastScale=1;},{passive:false});
 host.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();explodeBy(e.key==='ArrowUp'?.05:-.05);}
  else if(['+','=','-','_'].includes(e.key)){e.preventDefault();zoomBy(e.key==='+'||e.key==='='?.88:1.12);}
 });
}
