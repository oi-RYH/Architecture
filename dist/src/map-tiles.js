export async function createMapTiles(viewport,sheet){
 const response=await fetch('./assets/map-tiles/manifest.json');
 if(!response.ok)throw new Error('지도 해상도 정보를 불러오지 못했습니다.');
 const manifest=await response.json(),soft=document.createElement('div');
 soft.className='tile-plane tile-soft';soft.setAttribute('aria-hidden','true');
 sheet.insertBefore(soft,sheet.lastElementChild);
 const cache=new Map();let scheduled=false,generation=0,currentKeys='',retryTimer,retries=0;
 function fetchTile(key){
   if(cache.has(key))return cache.get(key);
   const promise=new Promise((resolve,reject)=>{
     const image=new Image();image.decoding='async';
     const timer=setTimeout(()=>fail(),15000);
     function fail(){clearTimeout(timer);image.onload=image.onerror=null;reject(new Error('지도 조각을 불러오지 못했습니다.'));}
     image.onerror=fail;
     image.onload=async()=>{try{await image.decode();clearTimeout(timer);resolve(image);}catch{fail();}};
     image.src=`./assets/map-tiles/${key}.${manifest.format||'webp'}`;
   });
   cache.set(key,promise);
   promise.catch(()=>{if(cache.get(key)===promise)cache.delete(key);});
   if(cache.size>80)cache.delete(cache.keys().next().value);
   return promise;
 }
 function fallback(){sheet.classList.remove('tiles-ready');soft.hidden=true;}
 async function draw(){
   scheduled=false;const ticket=++generation,r=sheet.getBoundingClientRect(),v=viewport.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2);
   if(!r.width||!r.height){fallback();return;}
   const need=Math.max(2230,r.width*ratio*1.15);
   let level=manifest.levels.findIndex(l=>l.width>=need);if(level<0)level=manifest.levels.length-1;
   const size=manifest.levels[level],unit=manifest.tileSize,keys=[];
   const left=Math.max(0,(v.left-r.left)/r.width),right=Math.min(1,(v.right-r.left)/r.width),top=Math.max(0,(v.top-r.top)/r.height),bottom=Math.min(1,(v.bottom-r.top)/r.height);
   if(left>=right||top>=bottom){fallback();return;}
   for(let row=Math.max(0,Math.floor(top*size.height/unit)-1);row<=Math.min(Math.ceil(size.height/unit)-1,Math.floor(bottom*size.height/unit)+1);row++)
     for(let col=Math.max(0,Math.floor(left*size.width/unit)-1);col<=Math.min(Math.ceil(size.width/unit)-1,Math.floor(right*size.width/unit)+1);col++)
       keys.push({key:`${level}/${col}_${row}`,col,row});
   const signature=keys.map(item=>item.key).join('|');
   if(signature===currentKeys){soft.hidden=false;sheet.classList.add('tiles-ready');viewport.dataset.mapLoad='ready';return;}
   // Old zoom tiles cover only a small portion after zooming out. Keep the
   // complete preview visible until the entire new viewport is decoded.
   fallback();viewport.dataset.mapLoad='loading';
   const loaded=await Promise.allSettled(keys.map(async item=>({...item,image:await fetchTile(item.key)})));
   if(ticket!==generation)return;
   if(loaded.some(result=>result.status!=='fulfilled')){
     viewport.dataset.mapLoad='fallback';
     if(retries<3)retryTimer=setTimeout(()=>{retries++;queue();},1000*2**retries);
     return;
   }
   const fragment=document.createDocumentFragment();
   for(const {value:{col,row,image}} of loaded){
     image.alt='';image.draggable=false;
     Object.assign(image.style,{left:`${col*unit/size.width*100}%`,top:`${row*unit/size.height*100}%`,width:`${Math.min(unit,size.width-col*unit)/size.width*100}%`,height:`${Math.min(unit,size.height-row*unit)/size.height*100}%`});
     fragment.append(image);
   }
   soft.replaceChildren(fragment);soft.hidden=false;currentKeys=signature;retries=0;
   sheet.classList.add('tiles-ready');
   viewport.dataset.mapLevel=String(level);viewport.dataset.mapSource=`${size.width}×${size.height}`;
   viewport.dataset.visibleTiles=String(keys.length);viewport.dataset.mapLoad='ready';
 }
 function queue(){generation++;if(!scheduled){scheduled=true;requestAnimationFrame(()=>draw().catch(()=>{fallback();viewport.dataset.mapLoad='fallback';}));}}
 function update(){clearTimeout(retryTimer);retries=0;queue();}
 new ResizeObserver(update).observe(viewport);
 addEventListener('online',update);addEventListener('pageshow',update);
 return {nativeWidth:manifest.width,update};
}
