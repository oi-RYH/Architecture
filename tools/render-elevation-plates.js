// 밑그림(elevation ink plates) generator.
// Run in the browser console on http://localhost:4173/building.html (any page
// under dist/ that has the three importmap). It renders the same detailed model
// from the front with an orthographic camera and turns it into one transparent
// WebP per layer: ink lines (normal/depth/layer/colour edges) + a light wash.
// Downloads 8 files: plate-<layer>.webp ×7 and shadow.webp →
// copy them to dist/assets/archive/<entry>/. The world rectangle below must match
// `elevation` in src/archive/registry.js.
const RECT={left:-10,right:10,bottom:-.2,top:10.2},W=2400,H=1248;
const T=await import('three');
const {loadArchitecture}=await import('./src/model-loader.js?v=architecture-2');
const {LAYERS,MODEL_CONFIG}=await import('./src/layers.js?v=architecture-2');
const r=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:true});
r.setPixelRatio(1);r.setSize(W,H,false);r.setClearColor(0,0);
const m=await loadArchitecture({...MODEL_CONFIG,renderer:r,quality:'detail'},LAYERS);
const s=new T.Scene();s.add(m.root);
s.add(new T.HemisphereLight('#f4efe6','#8a8478',2.6));
const sun=new T.DirectionalLight('#fff4e0',2.4);sun.position.set(6,12,14);s.add(sun);
const cy=(RECT.top+RECT.bottom)/2,hh=(RECT.top-RECT.bottom)/2;
const cam=new T.OrthographicCamera(RECT.left,RECT.right,hh,-hh,85,115);cam.position.set(0,cy,100);cam.lookAt(0,cy,0);cam.updateProjectionMatrix();
const c2=Object.assign(document.createElement('canvas'),{width:W,height:H}),ctx=c2.getContext('2d',{willReadFrequently:true});
const grab=()=>{r.render(s,cam);ctx.clearRect(0,0,W,H);ctx.drawImage(r.domElement,0,0);return ctx.getImageData(0,0,W,H).data.slice();};
r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.15;const color=grab();
s.overrideMaterial=new T.MeshNormalMaterial();const normal=grab();
s.overrideMaterial=new T.MeshDepthMaterial();const depth=grab();s.overrideMaterial=null;
// Layer ids as pure primaries so colour management cannot blur them.
const cols=['#0000ff','#00ff00','#00ffff','#ff0000','#ff00ff','#ffff00','#ffffff'],saved=[];
r.toneMapping=T.NoToneMapping;
m.layers.forEach((l,i)=>{const mat=new T.MeshBasicMaterial({color:cols[i]});l.group.traverse(o=>{if(o.isMesh){saved.push([o,o.material]);o.material=Array.isArray(o.material)?o.material.map(()=>mat):mat;}});});
const idpx=grab();saved.forEach(([o,mm])=>o.material=mm);
const N=W*H,id=new Int8Array(N).fill(-1),map=[-1,0,1,2,3,4,5,6];
for(let p=0;p<N;p++)if(idpx[p*4+3]>=128)id[p]=map[(idpx[p*4]>127?4:0)+(idpx[p*4+1]>127?2:0)+(idpx[p*4+2]>127?1:0)];
const lum=new Float32Array(N);for(let p=0;p<N;p++)lum[p]=(color[p*4]*.3+color[p*4+1]*.59+color[p*4+2]*.11)/255;
const edge=new Float32Array(N);
for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const p=y*W+x,a=id[p];let e=0;
 for(const q of [p+1,p+W,p-1,p-W]){
  if((id[q]<0)!==(a<0)){e=1;break;}if(a<0)continue;if(id[q]!==a)e=Math.max(e,.9);
  const dn=Math.abs(normal[p*4]-normal[q*4])+Math.abs(normal[p*4+1]-normal[q*4+1])+Math.abs(normal[p*4+2]-normal[q*4+2]);
  e=Math.max(e,Math.min(1,Math.max(0,(dn-40)/80)),Math.min(1,Math.max(0,(Math.abs(depth[p*4]-depth[q*4])-2)/4)));
 }
 if(a>=0){const gx=lum[p+1+W]+2*lum[p+1]+lum[p+1-W]-lum[p-1+W]-2*lum[p-1]-lum[p-1-W],gy=lum[p+W-1]+2*lum[p+W]+lum[p+W+1]-lum[p-W-1]-2*lum[p-W]-lum[p-W+1];e=Math.max(e,Math.min(.55,Math.max(0,(Math.hypot(gx,gy)-.35)*.9)));}
 edge[p]=e;}
const soft=new Float32Array(N);
for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const p=y*W+x;soft[p]=Math.min(1,edge[p]*.6+(edge[p-1]+edge[p+1]+edge[p-W]+edge[p+W])*.12+(edge[p-1-W]+edge[p+1-W]+edge[p-1+W]+edge[p+1+W])*.05);}
const save=(canvas,name)=>new Promise(res=>canvas.toBlob(b=>{const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(b),download:name});a.click();res();},'image/webp',.9));
for(let i=0;i<7;i++){
 const c=Object.assign(document.createElement('canvas'),{width:W,height:H}),g=c.getContext('2d'),img=g.createImageData(W,H),o=img.data;
 for(let p=0;p<N;p++){if(id[p]!==i)continue;const e=soft[p],cr=color[p*4],cg=color[p*4+1],cb=color[p*4+2],l=(cr+cg+cb)/3,wa=.22,a=e+wa*(1-e);
  o[p*4]=(28*e+(l+(cr-l)*.55)*wa*(1-e))/a;o[p*4+1]=(26*e+(l+(cg-l)*.55)*wa*(1-e))/a;o[p*4+2]=(23*e+(l+(cb-l)*.55)*wa*(1-e))/a;o[p*4+3]=a*255;}
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const p=y*W+x;if(id[p]!==-1)continue;if(id[p+1]===i||id[p-1]===i||id[p+W]===i||id[p-W]===i){o[p*4]=28;o[p*4+1]=26;o[p*4+2]=23;o[p*4+3]=Math.max(o[p*4+3],soft[p]*255);}}
 g.putImageData(img,0,0);await save(c,`plate-${LAYERS[i].id}.webp`);
}
{const c=Object.assign(document.createElement('canvas'),{width:W,height:H}),g=c.getContext('2d'),img=g.createImageData(W,H),o=img.data;
 for(let p=0;p<N;p++){o[p*4]=20;o[p*4+1]=16;o[p*4+2]=12;o[p*4+3]=id[p]>=0?255:0;}g.putImageData(img,0,0);
 const half=Object.assign(document.createElement('canvas'),{width:W/2,height:H/2});half.getContext('2d').drawImage(c,0,0,W/2,H/2);await save(half,'shadow.webp');}
