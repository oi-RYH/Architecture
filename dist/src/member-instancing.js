import * as T from 'three';
// Exact decoded geometry comparisons: never merge merely similar members.
function arrays(g){return [g.index,...Object.keys(g.attributes).sort().map(k=>g.attributes[k])].filter(Boolean);}
function signature(g){
 const attrs=arrays(g);let h=2166136261;
 for(const a of attrs){const b=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);for(let i=0;i<64;i++)h=Math.imul(h^b[Math.min(b.length-1,Math.floor(i*b.length/64))],16777619);}
 return JSON.stringify([Object.keys(g.attributes).sort(),attrs.map(a=>[a.array.constructor.name,a.count,a.itemSize,a.normalized]),g.groups,g.drawRange.start,g.drawRange.count,h]);
}
function equal(a,b){
 const aa=arrays(a),bb=arrays(b);
 return aa.every((x,k)=>{const y=bb[k];const u=new Uint8Array(x.array.buffer,x.array.byteOffset,x.array.byteLength),v=new Uint8Array(y.array.buffer,y.array.byteOffset,y.array.byteLength);if(u.length!==v.length)return false;for(let i=0;i<u.length;i++)if(u[i]!==v[i])return false;return true;});
}
export async function instanceMembers(model){
 const audit={originalMeshes:0,instancedMembers:0,batches:0,removedDrawObjects:0};
 model.root.updateMatrixWorld(true);
 for(const layer of model.layers){
  const buckets=new Map(),inverse=layer.group.matrixWorld.clone().invert();let processed=0;
  const meshes=[];layer.group.traverse(o=>{if(o.isMesh)meshes.push(o);});audit.originalMeshes+=meshes.length;
  for(const mesh of meshes){
   const g=mesh.geometry,m=mesh.material;
   if(mesh.isSkinnedMesh||mesh.isInstancedMesh||Array.isArray(m)||m.transparent||Object.keys(g.morphAttributes).length||Object.values(g.attributes).some(a=>a.isInterleavedBufferAttribute)||!mesh.visible||mesh.matrixWorld.determinant()<=0)continue;
   const key=[m.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask,signature(g)].join('|');
   const candidates=buckets.get(key)||[];let batch=candidates.find(b=>equal(b[0].geometry,g));
   if(!batch){batch=[];candidates.push(batch);buckets.set(key,candidates);}batch.push(mesh);
   if(++processed%64===0)await new Promise(r=>requestAnimationFrame(r));
  }
  for(const candidates of buckets.values())for(const members of candidates){
   // Limit each bounding volume so distant members do not form one giant batch.
   members.sort((a,b)=>a.matrixWorld.elements[12]-b.matrixWorld.elements[12]||a.matrixWorld.elements[14]-b.matrixWorld.elements[14]);
   for(let offset=0;offset<members.length;offset+=32){
    const part=members.slice(offset,offset+32);if(part.length<2)continue;
    const source=part[0],batch=new T.InstancedMesh(source.geometry,source.material,part.length);
    batch.name=layer.definition.id+' repeated members';batch.userData.layerId=layer.definition.id;
    batch.userData.sourceMembers=part.map(m=>m.name);batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;batch.renderOrder=source.renderOrder;batch.layers.mask=source.layers.mask;
    part.forEach((m,i)=>batch.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld)));
    batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();layer.group.add(batch);
    part.forEach(m=>m.removeFromParent());audit.instancedMembers+=part.length;audit.batches++;audit.removedDrawObjects+=part.length-1;
   }
  }
 }
 model.instancingAudit=audit;return audit;
}
