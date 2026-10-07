import {inkRadiusForMapWidth} from './ink-policy.js';
// A viewport-sized reveal avoids rasterizing the entire deep-zoom map into one GPU layer.
const loadImage=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
const inkImage=loadImage('./assets/ink-fibers.png').catch(()=>null);
const clamp=v=>Math.max(0,Math.min(1,v));
const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
function noise(x,y){const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v;}
export async function revealInk(viewport,sheet,point){
 const bounds=viewport.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=bounds.width,h=bounds.height;
 const snapshot=document.createElement('canvas');snapshot.width=Math.ceil(w*dpr);snapshot.height=Math.ceil(h*dpr);const s=snapshot.getContext('2d');s.scale(dpr,dpr);
 const tiles=sheet.classList.contains('tiles-ready')?[...sheet.querySelectorAll('.tile-soft img')]:[];
 for(const img of tiles.length?tiles:[sheet.querySelector('.map-soft')]){if(!img?.complete)continue;const r=img.getBoundingClientRect();s.drawImage(img,r.left-bounds.left,r.top-bounds.top,r.width,r.height);}
 const canvas=document.createElement('canvas');canvas.className='ink-map-reveal';canvas.setAttribute('aria-hidden','true');canvas.width=snapshot.width;canvas.height=snapshot.height;viewport.append(canvas);const ctx=canvas.getContext('2d');
 const mask=document.createElement('canvas'),mw=Math.ceil(w),mh=Math.ceil(h);mask.width=mw;mask.height=mh;const m=mask.getContext('2d'),pixels=m.createImageData(mw,mh),arrival=new Float32Array(mw*mh),envelope=new Float32Array(mw*mh);
 const cx=point.x-bounds.left,cy=point.y-bounds.top,maxR=inkRadiusForMapWidth(sheet.getBoundingClientRect().width);
 viewport.dataset.inkRadiusPx=maxR.toFixed(2);viewport.dataset.inkScope='local';
 let sample=null,inkAsset=null;try{const im=await inkImage;inkAsset=im;const temp=document.createElement('canvas');temp.width=temp.height=512;const c=temp.getContext('2d');c.drawImage(im,0,0,512,512);sample=c.getImageData(0,0,512,512).data;}catch{}
 for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const px=x/mw*w,py=y/mh*h,dx=px-cx,dy=py-cy,r=Math.hypot(dx,dy)/maxR;
 const nx=dx/maxR*90,ny=dy/maxR*90;const broad=noise(nx*.009,ny*.009),mid=noise(nx*.035,ny*.027),fiber=noise(nx*.27+ny*.11,ny*.035),fine=noise(nx*.63,ny*.56);
 envelope[y*mw+x]=1-clamp((r-.92)/.08);
 const sx=Math.max(0,Math.min(511,Math.round(256+dx/maxR*220))),sy=Math.max(0,Math.min(511,Math.round(256+dy/maxR*220)));const ink=sample?1-sample[(sy*512+sx)*4]/255:.8;
 // Fixed fiber paths: the edge advances through them instead of wobbling in place.
 arrival[y*mw+x]=Math.max(0,r*(.80+.26*broad+.13*mid+.09*(1-ink))+.024*(fiber-.5)+.01*(fine-.5));
 const p=(y*mw+x)*4;pixels.data[p]=pixels.data[p+1]=pixels.data[p+2]=255;}
 document.body.classList.add('ink-ready');
 const start=performance.now(),impact=520,spread=2300,hold=450;
 return new Promise(resolve=>{function frame(now){const elapsed=now-start,t=clamp((elapsed-impact)/spread);const front=.90*Math.pow(t,.62);
 if(elapsed>=impact){document.body.classList.add('ink-absorbing');for(let i=0;i<arrival.length;i++){const a=clamp((front-arrival[i])/.018);pixels.data[i*4+3]=Math.round(a*a*(3-2*a)*envelope[i]*255);}m.putImageData(pixels,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';ctx.drawImage(snapshot,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
 // Only the initial drop is dark; it is absorbed and leaves the original map behind.
 const stain=Math.max(0,1-(elapsed-impact)/650);if(stain>0&&sample){const radius=Math.min(maxR*.8,8+Math.sqrt(Math.max(0,elapsed-impact))*1.3);ctx.save();ctx.beginPath();ctx.arc(cx*dpr,cy*dpr,maxR*dpr,0,Math.PI*2);ctx.clip();ctx.globalAlpha=stain*.85;ctx.globalCompositeOperation='darken';ctx.drawImage(inkAsset,(cx-radius)*dpr,(cy-radius)*dpr,radius*2*dpr,radius*2*dpr);ctx.restore();}
 }
 viewport.dataset.inkProgress=t.toFixed(2);
 if(elapsed<impact+spread+hold)requestAnimationFrame(frame);else{document.body.classList.add('ink-departing');setTimeout(resolve,350);}}
 requestAnimationFrame(frame);});
}
