import * as T from 'three';
import {loadArchitecture} from './model-loader.js?v=architecture-2';
import {instanceMembers} from './member-instancing.js';
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
export async function loadDetailedArchitecture(config,definitions,report){
 report('1/2 · 정밀 모델을 미리 불러오고 있습니다…');
 const model=await loadArchitecture({...config,quality:'detail'},definitions,message=>report('1/2 · '+message));
 report('반복 부재를 준비하고 있습니다…');
 await instanceMembers(model);
 model.pickRoots=()=>model.layers.map(l=>l.group);
 return model;
}
export async function warmArchitecture(renderer,scene,camera,model,report){
 report('2/2 · 표면과 조명을 미리 준비하고 있습니다…');
 const textures=new Set(),meshes=[];
 model.root.traverse(o=>{if(!o.isMesh)return;meshes.push([o,o.frustumCulled]);o.frustumCulled=false;for(const m of [].concat(o.material))for(const t of Object.values(m))if(t?.isTexture)textures.add(t);});
 const packed=[...textures].filter(t=>t.isCompressedTexture);
 model.textureAudit={textures:textures.size,compressed:packed.length,formats:[...new Set(packed.map(t=>t.format))],payloadBytes:packed.reduce((n,t)=>n+t.mipmaps.reduce((m,l)=>m+(l.data?.byteLength||0),0),0)};
 let count=0;
 for(const t of textures){renderer.initTexture(t);if(++count%4===0)await nextFrame();}
 await renderer.compileAsync(scene,camera);
 // Force vertex/index buffer upload before revealing the viewer. Small offscreen
 // renders include every mesh, even surfaces outside the starting camera frustum.
 const target=new T.WebGLRenderTarget(16,16),previous=renderer.getRenderTarget();
 const groups=model.layers.map(l=>l.group);
 groups.forEach(g=>g.visible=false);
 try{
  renderer.setRenderTarget(target);
  for(let i=0;i<groups.length;i++){
   report(`2/2 · 화면 준비 중 (${i+1}/${groups.length})`);
   groups[i].visible=true;renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);groups[i].visible=false;
   await nextFrame();
  }
 }finally{
  renderer.setRenderTarget(previous);target.dispose();meshes.forEach(([m,c])=>m.frustumCulled=c);
 }
 groups.forEach(g=>g.visible=true);renderer.shadowMap.needsUpdate=true;
}
