// Keep the prepared WebGL document alive: navigating after preload would discard
// its decoded geometry, GPU textures and shaders and start loading all over again.
export function animateJourney(duration,draw){
 return new Promise(resolve=>{
  const started=performance.now();
  function frame(now){const t=duration?Math.min(1,(now-started)/duration):1;draw(t*t*t*(t*(t*6-15)+10));if(t<1)requestAnimationFrame(frame);else resolve();}
  requestAnimationFrame(frame);
 });
}

function paperSnapshot(viewport,sheet){
 const bounds=viewport.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
 const canvas=document.createElement('canvas');canvas.className='journey-paper';
 canvas.width=Math.ceil(bounds.width*ratio);canvas.height=Math.ceil(bounds.height*ratio);
 const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
 ctx.fillStyle='#eae3d3';ctx.fillRect(0,0,bounds.width,bounds.height);
 const tiles=sheet.classList.contains('tiles-ready')?[...sheet.querySelectorAll('.tile-soft img')]:[];
 ctx.globalAlpha=.43;
 for(const image of tiles.length?tiles:[sheet.querySelector('.map-soft')]){
  if(!image?.complete||!image.naturalWidth)continue;
  const r=image.getBoundingClientRect();ctx.drawImage(image,r.left-bounds.left,r.top-bounds.top,r.width,r.height);
 }
 ctx.globalAlpha=1;
 const ink=viewport.querySelector('.ink-map-reveal');if(ink)ctx.drawImage(ink,0,0,bounds.width,bounds.height);
 // Retain the paper seams at their exact map coordinates, including deep zoom.
 const r=sheet.getBoundingClientRect();ctx.strokeStyle='#836b391b';ctx.lineWidth=.7;
 for(let col=0;col<=10;col++){const x=r.left-bounds.left+r.width*col/10;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,bounds.height);ctx.stroke();}
 for(let row=0;row<=22;row++){const y=r.top-bounds.top+r.height*row/22;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(bounds.width,y);ctx.stroke();}
 return {canvas,bounds};
}

export function createJourney({reduced=false}={}){
 const frame=document.createElement('iframe');frame.className='journey-building';frame.title='근정전 구조 탐험';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');
 const stage=document.createElement('section');stage.className='journey-stage';stage.setAttribute('aria-label','지도에서 근정전으로 이동');
 const caption=document.createElement('div');caption.className='journey-caption';
 caption.innerHTML='<span>漢陽 · 景福宮</span><strong>근정전</strong><small>勤政殿</small>';
 const back=document.createElement('a');back.className='journey-back';back.href='./';back.textContent='지도로 돌아가기';
 const error=document.createElement('div');error.className='journey-error';error.hidden=true;error.setAttribute('role','alert');
 const message=document.createElement('p'),retry=document.createElement('button');retry.textContent='다시 들어가기';
 error.append(message,retry);stage.append(caption,back,error);
 document.body.append(frame,stage);
 let ready=false,failed=false,resolveReady;
 const prepared=new Promise(resolve=>{resolveReady=resolve;});
 function fail(text){
  failed=true;stage.classList.add('is-visible');stage.dataset.phase='error';error.hidden=false;message.textContent=text;
  clearTimeout(timeout);resolveReady(false);
 }
 function onMessage(event){
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='architecture-ready'){ready=true;clearTimeout(timeout);resolveReady(true);}
  if(event.data?.type==='architecture-error')fail('근정전에 연결하지 못했습니다. 다시 시도하거나 지도로 돌아가 주세요.');
 }
 addEventListener('message',onMessage);
 const timeout=setTimeout(()=>fail('근정전으로 가는 길이 지연되고 있습니다. 연결을 확인한 뒤 다시 시도해 주세요.'),90000);
 retry.onclick=()=>location.assign('./building.html');
 frame.src='./building.html?journey=1';
 frame.addEventListener('error',()=>fail('근정전 화면에 연결하지 못했습니다.'));
 return {
  async enter(viewport,sheet){
   if(failed)return;
   const {canvas,bounds}=paperSnapshot(viewport,sheet);
   const ground=document.createElement('div');ground.className='journey-ground';ground.append(canvas);stage.prepend(ground);
   stage.classList.add('is-visible');stage.dataset.phase='descending';
   const oldMain=document.querySelector('body>main');oldMain.inert=true;
   document.body.classList.add('journey-descending');
   back.focus({preventScroll:true});
   // The center of the selected map panel stays under the camera as the plane tilts.
   await animateJourney(reduced?0:2600,t=>{
    const width=bounds.width+(innerWidth-bounds.width)*t,height=bounds.height+(innerHeight-bounds.height)*t;
    ground.style.left=`${bounds.left*(1-t)}px`;ground.style.top=`${bounds.top*(1-t)}px`;
    ground.style.width=`${width}px`;ground.style.height=`${height}px`;
    canvas.style.transform=`perspective(1100px) translateY(${t*height*.23}px) rotateX(${t*74}deg) scale(${1+t*1.8})`;
   });
   if(failed)return;
   stage.dataset.phase=ready?'arriving':'waiting';
   if(!await prepared)return;
   stage.dataset.phase='arriving';
   frame.contentWindow.postMessage({type:'architecture-arrive'},location.origin);
   frame.classList.add('is-visible');stage.classList.add('is-arriving');
   await animateJourney(reduced?0:2200,t=>{
    stage.style.opacity=String(1-t);
    canvas.style.transform=`perspective(1100px) translateY(${innerHeight*(.23+t*.14)}px) rotateX(${74+t*6}deg) scale(${2.8+t*1.2})`;
   });
   if(failed){stage.style.opacity='1';stage.classList.remove('is-arriving');return;}
   clearTimeout(timeout);removeEventListener('message',onMessage);stage.remove();
   document.body.classList.add('journey-complete');document.body.style.overflow='hidden';
   document.querySelector('body>header').inert=true;document.querySelector('body>footer').inert=true;
   frame.removeAttribute('aria-hidden');frame.tabIndex=0;frame.contentWindow.focus();
   frame.contentDocument?.querySelector('#scene')?.focus({preventScroll:true});
   document.title='결 — 근정전 구조 탐험';
   history.pushState({architectureJourney:true},'', './building.html');
   addEventListener('popstate',()=>location.reload(),{once:true});
   return true;
  }
 };
}
