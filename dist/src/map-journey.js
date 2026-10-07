// Keep the prepared WebGL document alive: navigating after preload would discard
// its decoded geometry, GPU textures and shaders and start loading all over again.
export function animateJourney(duration,draw){
 return new Promise(resolve=>{
  const started=performance.now();
  function frame(now){const t=duration?Math.min(1,(now-started)/duration):1;draw(t*t*t*(t*(t*6-15)+10),t);if(t<1)requestAnimationFrame(frame);else resolve();}
  requestAnimationFrame(frame);
 });
}

function overviewTiles(){
 // A complete national level behind the already-decoded local detail tiles.
 // Individual failures retain the full preview, never a hole in the country.
 return fetch('./assets/map-tiles/manifest.json').then(r=>{if(!r.ok)throw new Error('Map manifest');return r.json();}).then(async manifest=>{
  const level=Math.min(1,manifest.levels.length-1),size=manifest.levels[level],unit=manifest.tileSize,tasks=[];
  for(let row=0;row<Math.ceil(size.height/unit);row++)for(let col=0;col<Math.ceil(size.width/unit);col++){
   tasks.push(new Promise(resolve=>{
    const image=new Image();image.alt='';image.decoding='async';
    const timer=setTimeout(()=>resolve(null),3000);
    image.onload=async()=>{try{await image.decode();clearTimeout(timer);resolve({image,left:col*unit/size.width,top:row*unit/size.height,width:Math.min(unit,size.width-col*unit)/size.width,height:Math.min(unit,size.height-row*unit)/size.height});}catch{clearTimeout(timer);resolve(null);}};
    image.onerror=()=>{clearTimeout(timer);resolve(null);};image.src=`./assets/map-tiles/${level}/${col}_${row}.${manifest.format||'avif'}`;
   }));
  }
  return (await Promise.all(tasks)).filter(Boolean);
 }).catch(()=>[]);
}

function fullPaper(viewport,sheet,overview){
 const bounds=viewport.getBoundingClientRect(),map=sheet.getBoundingClientRect();
 const paper=document.createElement('div');paper.className='journey-paper';paper.dataset.coverage='national';
 // Preserve the live map's CSS pixel density instead of rasterizing a small
 // logical sheet and magnifying it. Images remain separately tiled; no giant canvas.
 const width=map.width,height=map.height;
 Object.assign(paper.style,{width:`${width}px`,height:`${height}px`});
 const base=sheet.querySelector('.map-soft').cloneNode();base.className='journey-paper-base';paper.append(base);
 function addTile(image,left,top,w,h){
  const tile=document.createElement('div');tile.className='journey-paper-tile';
  Object.assign(tile.style,{left:`${left*100}%`,top:`${top*100}%`,width:`${w*100}%`,height:`${h*100}%`});
  const copy=image.cloneNode();copy.removeAttribute('style');tile.append(copy);paper.append(tile);
 }
 for(const t of overview)addTile(t.image,t.left,t.top,t.width,t.height);
 if(sheet.classList.contains('tiles-ready'))for(const image of sheet.querySelectorAll('.tile-soft img')){
  const r=image.getBoundingClientRect();addTile(image,(r.left-map.left)/map.width,(r.top-map.top)/map.height,r.width/map.width,r.height/map.height);
 }
 // Only the ink is a local canvas. Its placement is expressed in full-map space.
 const ink=viewport.querySelector('.ink-map-reveal');
 if(ink){const copy=document.createElement('canvas');copy.className='journey-paper-ink';copy.width=ink.width;copy.height=ink.height;copy.getContext('2d').drawImage(ink,0,0);Object.assign(copy.style,{left:`${(bounds.left-map.left)/map.width*100}%`,top:`${(bounds.top-map.top)/map.height*100}%`,width:`${bounds.width/map.width*100}%`,height:`${bounds.height/map.height*100}%`});paper.append(copy);}
 const folds=document.createElement('div');folds.className='journey-paper-folds';paper.append(folds);
 const marker=getComputedStyle(sheet.querySelector('#palace-marker'));
 const mx=parseFloat(marker.left)/sheet.clientWidth,my=parseFloat(marker.top)/sheet.clientHeight;
 paper.style.transformOrigin=`${mx*100}% ${my*100}%`;
 return {paper,width,height,mx,my,scale:map.width/width,x:map.left+map.width*mx,y:map.top+map.height*my};
}

function groundPose(model,t){
 // Retain the focused map scale. The full map is the ground extending beyond
 // the viewport, not an overview that needs to fit inside it. Keep the nearest
 // map edge in front of the perspective eye to avoid projection clipping.
 const perspective=Math.max(2400,model.height*model.scale*(1-model.my)*1.35);
 return {scale:model.scale,x:model.x+(innerWidth/2-model.x)*t,y:model.y+(innerHeight*.56-model.y)*t,angle:74*t,perspective};
}

function positionPaper(model,pose){
 model.paper.style.transform=`translate3d(${pose.x-model.mx*model.width}px,${pose.y-model.my*model.height}px,0) perspective(${pose.perspective}px) rotateZ(${pose.bank||0}deg) rotateX(${pose.angle}deg) scale(${pose.scale})`;
 model.paper.dataset.cameraScale=String(pose.scale);
 model.paper.dataset.cameraTilt=String(pose.angle);
}

export function createJourney({reduced=false}={}){
 const overview=overviewTiles();
 const frame=document.createElement('iframe');frame.className='journey-building';frame.title='근정전 구조 탐험';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');
 const stage=document.createElement('section');stage.className='journey-stage';stage.setAttribute('aria-label','지도에서 근정전으로 이동');
 const caption=document.createElement('div');caption.className='journey-caption';
 caption.innerHTML='<span>漢陽 · 景福宮</span><strong>근정전</strong><small>勤政殿</small>';
 const back=document.createElement('a');back.className='journey-back';back.href='./';back.textContent='지도로 돌아가기';
 const error=document.createElement('div');error.className='journey-error';error.hidden=true;error.setAttribute('role','alert');
 const message=document.createElement('p'),retry=document.createElement('button');retry.textContent='다시 들어가기';
 error.append(message,retry);stage.append(caption,back,error);
 document.body.append(frame,stage);
 let ready=false,failed=false,resolveReady,resolveLanded,landingTimer;
 const prepared=new Promise(resolve=>{resolveReady=resolve;});
 const landed=new Promise(resolve=>{resolveLanded=resolve;});
 function fail(text){
  failed=true;stage.classList.add('is-visible');stage.dataset.phase='error';error.hidden=false;message.textContent=text;
  stage.style.opacity='1';stage.classList.remove('is-arriving','is-flying');
  clearTimeout(timeout);clearTimeout(landingTimer);resolveReady(false);resolveLanded(false);
 }
 function onMessage(event){
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='architecture-ready'){ready=true;clearTimeout(timeout);resolveReady(true);}
  if(event.data?.type==='architecture-landed'){clearTimeout(landingTimer);resolveLanded(true);}
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
   const model=fullPaper(viewport,sheet,await overview);
   const ground=document.createElement('div');ground.className='journey-ground';ground.append(model.paper);stage.prepend(ground);
   stage.classList.add('is-visible');stage.dataset.phase='descending';
   const oldMain=document.querySelector('body>main');oldMain.inert=true;
   document.body.classList.add('journey-descending');
   back.focus({preventScroll:true});
   // Lower the viewpoint without pulling back. Neighbouring map tiles now
   // remain present as the view opens up beyond the original screen crop.
   await animateJourney(reduced?0:2600,t=>positionPaper(model,groundPose(model,t)));
   if(failed)return;
   const refit=()=>positionPaper(model,groundPose(model,1));addEventListener('resize',refit);
   stage.dataset.phase=ready?'arriving':'waiting';
   if(!await prepared){removeEventListener('resize',refit);return;}
   removeEventListener('resize',refit);
   stage.dataset.phase='flying';stage.classList.add('is-flying');
   let arrivalStarted=false;
   await animateJourney(reduced?0:2400,(_,t)=>{
    if(failed)return;
    // Accelerate over the paper toward the selected location. The destination
    // remains the pivot; a slight bank adds lateral parallax without a spin.
    const travel=t*t*(2-t),factor=Math.exp(Math.log(6.5)*travel),pose=groundPose(model,1);
    const scene=frame.contentDocument?.querySelector('#scene')?.getBoundingClientRect();
    const targetX=scene?scene.left+scene.width/2:innerWidth/2,targetY=scene?scene.top+scene.height/2:innerHeight/2;
    positionPaper(model,{...pose,scale:pose.scale*factor,perspective:pose.perspective*factor,x:pose.x+(targetX-pose.x)*travel,y:pose.y+(targetY-pose.y)*travel,angle:74+4*travel,bank:1.6*Math.sin(Math.PI*t)});
    stage.dataset.flightProgress=t.toFixed(3);
    // Start the real 3D approach before revealing it, so motion continues
    // through the handoff instead of restarting from a stationary scene.
    if(t>=.58&&!arrivalStarted){
     arrivalStarted=true;stage.dataset.phase='arriving';stage.classList.add('is-arriving');
     frame.contentWindow.postMessage({type:'architecture-arrive'},location.origin);frame.classList.add('is-visible');
     landingTimer=setTimeout(()=>fail('근정전 진입이 지연되고 있습니다. 다시 시도해 주세요.'),10000);
    }
    const blend=Math.max(0,Math.min(1,(t-.64)/.36));stage.style.opacity=String(1-blend*blend*(3-2*blend));
   });
   if(failed){stage.style.opacity='1';stage.classList.remove('is-arriving');return;}
   stage.dataset.phase='landing';
   if(!await landed)return;
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
