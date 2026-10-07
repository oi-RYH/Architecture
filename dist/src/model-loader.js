import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {createPalace} from './procedural.js';
export async function loadArchitecture(config,definitions,onProgress=()=>{}){
 let source;
 if(config.kind==='official'){
  source=new T.Group();const manager=new T.LoadingManager();
  const fast=config.quality!=='detail';
  manager.onProgress=()=>onProgress(`${fast?'탐색':'정밀'} 모델의 표면 표현 준비 중…`);
  const draco=new DRACOLoader(manager).setDecoderPath('./vendor/draco/').setWorkerLimit(2);
  const ktx=new KTX2Loader(manager).setTranscoderPath('./vendor/basis/').setWorkerLimit(2).detectSupport(config.renderer);
  const loader=new GLTFLoader(manager).setDRACOLoader(draco).setKTX2Loader(ktx);
  try{
   if(fast){onProgress('가벼운 탐색 모델 불러오는 중…');source=(await loader.loadAsync('./models/fast/palace.gltf')).scene;}
   else for(let i=0;i<config.assets.length;i++){
    const d={id:config.assets[i],name:"정밀 부재"};onProgress(`${d.name} 불러오는 중 (${i+1}/${config.assets.length})`);
    const gltf=await loader.loadAsync(`./models/${d.id}.gltf?v=architecture-2`,e=>{if(e.total)onProgress(`${d.name} 불러오는 중 (${i+1}/${config.assets.length})`);});
    gltf.scene.name=d.id;source.add(gltf.scene);
    await new Promise(resolve=>requestAnimationFrame(resolve));
   }
  }finally{draco.dispose();ktx.dispose();}
 }else if(config.kind==='gltf')source=(await new GLTFLoader().loadAsync(config.url)).scene;
 else source=createPalace();
 // Share texture objects across separately loaded detail layers to avoid duplicate GPU uploads.
 const textures=new Map();source.traverse(o=>{if(!o.isMesh)return;for(const m of [].concat(o.material))for(const key of ['map','normalMap','roughnessMap','metalnessMap']){const t=m[key];if(!t)continue;const id=m.name+':'+(key==='metalnessMap'?'roughnessMap':key);if(textures.has(id))m[key]=textures.get(id);else textures.set(id,t);}});
 source.updateMatrixWorld(true);
 const matches=definitions.map(d=>{const objects=[];if(config.kind==='official')source.traverse(o=>{if(o.userData.architecturalLayer===d.id)objects.push(o);});else for(const name of d.nodes||[]){const o=source.getObjectByName(name);if(o)objects.push(o);}if(!objects.length)throw new Error(`모델에서 ${d.name} 부재를 찾지 못했습니다.`);return {definition:d,objects};});
 const seen=new Set();for(const {objects} of matches)for(const o of objects){if(seen.has(o))throw new Error('레이어 매핑이 중복되었습니다.');seen.add(o);}
 for(const o of seen)for(let p=o.parent;p;p=p.parent)if(seen.has(p))throw new Error('레이어는 서로의 부모/자식일 수 없습니다.');
 const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());if(!Number.isFinite(size.x)||size.x<=0)throw new Error('모델의 크기를 확인할 수 없습니다.');
 const root=new T.Group();const layers=matches.map(({definition,objects})=>{const group=new T.Group();group.name=definition.id;root.add(group);for(const o of objects)group.attach(o);const layerMaterials=new Map();group.traverse(o=>{if(o.isMesh){const local=m=>{if(!layerMaterials.has(m))layerMaterials.set(m,m.clone());return layerMaterials.get(m);};o.material=Array.isArray(o.material)?o.material.map(local):local(o.material);}o.userData.layerId=definition.id;if(o.isMesh){o.castShadow=definition.id==='roof';o.receiveShadow=true;}});return {definition,group,origin:group.position.clone()};});
 root.add(source);const s=config.normalizedWidth/size.x;root.scale.setScalar(s);root.position.set(-center.x*s,-bounds.min.y*s,-center.z*s);
 return {root,layers,scale:s,sourceSize:size};
}

export function disposeArchitecture(model){
 const geometries=new Set(),materials=new Set(),textures=new Set(),images=new Set();
 model.root.traverse(o=>{if(!o.isMesh)return;geometries.add(o.geometry);for(const m of [].concat(o.material)){materials.add(m);for(const value of Object.values(m))if(value?.isTexture){textures.add(value);if(value.image)images.add(value.image);}}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());images.forEach(i=>i.close?.());
}
