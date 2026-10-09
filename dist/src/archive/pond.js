import * as T from 'three';

// A pond around a building that stands on an island (경회루). It is an
// interpretive addition: the heritage source models only the island top, so the
// stone embankment and the water are drawn here and labelled as such in the UI.
// The water is a bowl: a round reflecting surface whose body hangs below it as a
// shallow hemisphere, washed like ink spreading on hanji rather than glass.
const NOISE=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
const mat2 OCT=mat2(1.6,1.2,-1.2,1.6);
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*vnoise(p);p=OCT*p;a*=.5;}return v;}`;
const VERT=`
uniform mat4 uTexMatrix;
varying vec3 vWorld;
varying vec4 vProj;
void main(){
 vec4 w=modelMatrix*vec4(position,1.);
 vWorld=w.xyz;vProj=uTexMatrix*w;
 gl_Position=projectionMatrix*viewMatrix*w;
}`;
const SURFACE=`
uniform float uTime,uOpacity,uR,uMirror;
uniform vec2 uCenter;
uniform vec4 uIsland;
uniform vec3 uDeep,uShallow,uPaper;
uniform sampler2D uRefl;
varying vec3 vWorld;
varying vec4 vProj;
${NOISE}
float islandDist(vec2 p){vec2 c=(uIsland.xy+uIsland.zw)*.5,h=(uIsland.zw-uIsland.xy)*.5;vec2 d=abs(p-c)-h;return length(max(d,0.))+min(max(d.x,d.y),0.);}
void main(){
 vec2 p=vWorld.xz;float d=max(0.,islandDist(p)),r=length(p-uCenter);
 float stain=fbm(p*.32+vec2(3.1,7.7));
 // The rim bleeds like ink into paper: an irregular, soft edge.
 float rim=1.-smoothstep(uR*.5,uR*(.96-.12*(stain-.5)),r);
 // Water pattern: fBm with two levels of domain warping (ink loosening in water),
 // drifting slowly; it replaces the old regular sine ripples.
 float t=uTime;vec2 sp=p*.22;
 vec2 w1=vec2(fbm(sp+vec2(0.,t*.035)),fbm(sp+vec2(5.2,1.3)-vec2(t*.028,0.)));
 vec2 w2=vec2(fbm(sp+3.2*w1+vec2(1.7,9.2)+t*.05),fbm(sp+3.2*w1+vec2(8.3,2.8)-t*.04));
 float wave=fbm(sp+3.6*w2);
 // Fine ripples for the reflection: gradient of a small-scale warped fBm.
 vec2 fp=p*.55+w2*1.4;float e=.08;
 float h0=fbm(fp+vec2(t*.22,-t*.17));
 vec2 grad=vec2(fbm(fp+vec2(e,0.)+vec2(t*.22,-t*.17))-h0,fbm(fp+vec2(0.,e)+vec2(t*.22,-t*.17))-h0)/e;
 // Stronger near the stones, calmer toward the open water.
 grad*=1.-.55*smoothstep(0.,uR*.55,d);
 vec3 ink=mix(uDeep,uShallow,smoothstep(0.,uR*.6,d));
 ink=mix(ink,uPaper,.14+(stain-.5)*.22);
 vec3 col=ink+(wave-.5)*.09;
 float a=uOpacity*rim;
 if(!gl_FrontFacing){
  // From below the surface is the top of a dense body of water: opaque, same tone as the bowl rim.
  col=mix(uShallow*.75,uPaper,.12*(1.-stain))+(wave-.5)*.04;a=uOpacity*rim;
 }else if(uMirror>.5){
  // A blurred, softened reflection: ink seen through paper, not a mirror.
  vec4 q=vProj;q.xy+=grad*.008*q.w;
  float b=.007*q.w;vec4 refl=texture2DProj(uRefl,q)*.36;
  refl+=texture2DProj(uRefl,q+vec4(b,0,0,0))*.16;refl+=texture2DProj(uRefl,q-vec4(b,0,0,0))*.16;
  refl+=texture2DProj(uRefl,q+vec4(0,b,0,0))*.16;refl+=texture2DProj(uRefl,q-vec4(0,b,0,0))*.16;
  vec3 rc=mix(vec3(dot(refl.rgb,vec3(.3,.59,.11))),refl.rgb,.55);
  rc=mix(rc,uPaper,.22);
  float fres=(.55+.25*(1.-smoothstep(0.,uR*.6,d)))*.7;
  col=mix(col,rc,fres*refl.a);
  // A faint glint where the ripples tilt toward the light.
  col+=smoothstep(.8,1.8,dot(grad,vec2(.6,.8)))*.03;
 }
 if(gl_FrontFacing)col=mix(col,uPaper,(1.-smoothstep(0.,.12,d))*.3);
 gl_FragColor=vec4(col,gl_FrontFacing?a*.92:a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const BOWL_VERT=`
varying vec3 vWorld,vViewN,vViewPos;
void main(){
 vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;
 vec4 mv=viewMatrix*w;vViewPos=mv.xyz;vViewN=normalize(normalMatrix*normal);
 gl_Position=projectionMatrix*mv;
}`;
const BOWL=`
uniform float uOpacity,uWaterY,uDepth;
uniform vec3 uDeep,uShallow,uPaper;
varying vec3 vWorld,vViewN,vViewPos;
${NOISE}
void main(){
 float t=clamp((uWaterY-vWorld.y)/uDepth,0.,1.);
 float m=fbm(vWorld.xz*.38+vWorld.y*.21);
 // Deeper water turns to dense ink; only the shallow band stays see-through.
 vec3 col=mix(uShallow*.75,uDeep*.5,smoothstep(0.,.45,t));
 col=mix(col,uPaper,(.12+(m-.5)*.14)*(1.-t));
 float a=mix(.86,.99,smoothstep(0.,.25,t));
 // Soft silhouette: grazing faces dissolve, with an irregular ink-bleed threshold.
 float facing=abs(dot(normalize(vViewN),normalize(-vViewPos)));
 a*=smoothstep(.02,.42+.22*(m-.5),facing);
 a*=smoothstep(0.,.025,t)*uOpacity;
 if(!gl_FrontFacing)a*=.6;
 gl_FragColor=vec4(col,a);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

export function createPond({renderer,scene,camera,model,config,startVisible=false}){
 const {rect,waterY=-.5,wallWidth=.32,reach=.35,depthRatio=.48}=config;
 const [x0,x1,z0,z1]=rect,w=wallWidth;
 const cx=(x0+x1)/2,cz=(z0+z1)/2;
 const R=Math.hypot((x1-x0)/2+w,(z1-z0)/2+w)*.78+30*reach,D=R*depthRatio;
 const group=new T.Group();group.name='pond (interpretive)';
 // Stone embankment, a closed block so its underside never reads as hollow.
 let stoneMap=null;
 const wallMat=new T.MeshStandardMaterial({color:stoneMap?'#ffffff':'#8d8a80',map:stoneMap,roughness:.92,metalness:0,transparent:true,opacity:startVisible?1:0,depthWrite:startVisible});
 if(stoneMap)stoneMap.repeat.set(6,1.2);
 // Submerged stone sinks into the ink: tint toward the deep colour with depth.
 wallMat.onBeforeCompile=sh=>{
  sh.uniforms.uWaterY={value:waterY};sh.uniforms.uSink={value:D*.06};sh.uniforms.uInk={value:new T.Color('#1d2423')};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vSinkY;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSinkY=(modelMatrix*vec4(transformed,1.)).y;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSinkY;uniform float uWaterY,uSink;uniform vec3 uInk;')
   .replace('#include <opaque_fragment>','outgoingLight=mix(outgoingLight,uInk,smoothstep(0.,uSink,uWaterY-vSinkY));\n#include <opaque_fragment>');
 };
 // The stone only reaches the shallow band; below it the ink alone holds the depth.
 const top=-.01,bottom=waterY-.02,h=top-bottom;
 // Four walls ending at the waterline (no underside), so nothing reads through the water from below.
 for(const [px,pz,sx,sz] of [[x0-w/2,cz,w,z1-z0+2*w],[x1+w/2,cz,w,z1-z0+2*w],[cx,z0-w/2,x1-x0,w],[cx,z1+w/2,x1-x0,w]]){
  const g=new T.BoxGeometry(sx,h,sz);g.groups=g.groups.filter((_,i)=>i!==3);
  const wall=new T.Mesh(g,wallMat);wall.position.set(px,bottom+h/2,pz);wall.receiveShadow=true;group.add(wall);
 }
 // Water: reflecting surface + hemispherical body.
 const rt=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType});rt.texture.colorSpace=T.LinearSRGBColorSpace;
 const texMatrix=new T.Matrix4();
 const shared={uOpacity:{value:startVisible?1:0},uDeep:{value:new T.Color('#27302f')},uShallow:{value:new T.Color('#6d7a73')},uPaper:{value:new T.Color('#e6dcc7')}};
 const surface=new T.Mesh(new T.CircleGeometry(R,128),new T.ShaderMaterial({
  uniforms:{...shared,uTime:{value:0},uR:{value:R},uMirror:{value:1},uCenter:{value:new T.Vector2(cx,cz)},
   uIsland:{value:new T.Vector4(x0-w,z0-w,x1+w,z1+w)},uRefl:{value:rt.texture},uTexMatrix:{value:texMatrix}},
  vertexShader:VERT,fragmentShader:SURFACE,transparent:true,depthWrite:false,side:T.DoubleSide}));
 surface.rotation.x=-Math.PI/2;surface.position.set(cx,waterY,cz);surface.renderOrder=2;
 const bowl=new T.Mesh(new T.SphereGeometry(R,128,32,0,Math.PI*2,Math.PI/2,Math.PI/2),new T.ShaderMaterial({
  uniforms:{...shared,uWaterY:{value:waterY},uDepth:{value:D}},
  vertexShader:BOWL_VERT,fragmentShader:BOWL,transparent:true,depthWrite:false,side:T.DoubleSide}));
 bowl.scale.y=D/R;bowl.position.set(cx,waterY,cz);bowl.renderOrder=1;
 group.add(bowl,surface);
 group.visible=startVisible;
 scene.add(group);

 const mirrorCam=new T.PerspectiveCamera(),plane=new T.Plane(new T.Vector3(0,1,0),-waterY),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
 const tmp=new T.Vector3(),tgt=new T.Vector3(),size=new T.Vector2();
 let shown=startVisible?1:0;
 // Source materials are double-sided; seen from under the water that shows the island's
 // underside, so the mirror pass culls back faces.
 const mats=new Set();
 function attachModel(source){
  mats.clear();
  source.root.traverse(o=>{
   if(!o.isMesh)return;
   for(const m of [].concat(o.material)){
    mats.add(m);
    if(!stoneMap&&/Stone$/.test(m.name||'')&&m.map){
     stoneMap=m.map.clone();stoneMap.wrapS=stoneMap.wrapT=T.RepeatWrapping;
     stoneMap.repeat.set(6,1.2);stoneMap.needsUpdate=true;
     wallMat.map=stoneMap;wallMat.color.set('#ffffff');wallMat.needsUpdate=true;
    }
   }
  });
 }
 if(model)attachModel(model);
 function reflect(){
  if(!group.visible||camera.position.y<waterY+group.position.y)return;
  renderer.getDrawingBufferSize(size);const w2=Math.max(256,size.x>>1),h2=Math.max(256,size.y>>1);
  if(rt.width!==w2||rt.height!==h2)rt.setSize(w2,h2);
  camera.updateMatrixWorld();
  tmp.setFromMatrixPosition(camera.matrixWorld);tmp.y=2*waterY-tmp.y;
  camera.getWorldDirection(tgt);tgt.y=-tgt.y;tgt.add(tmp);
  mirrorCam.position.copy(tmp);mirrorCam.up.set(0,-1,0);mirrorCam.lookAt(tgt);
  mirrorCam.projectionMatrix.copy(camera.projectionMatrix);mirrorCam.near=camera.near;mirrorCam.far=camera.far;
  mirrorCam.updateMatrixWorld();
  texMatrix.copy(bias).multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
  const prevTarget=renderer.getRenderTarget(),prevClip=renderer.clippingPlanes;
  const sides=[];mats.forEach(m=>{sides.push([m,m.side]);m.side=T.FrontSide;});
  surface.visible=bowl.visible=false;renderer.clippingPlanes=[plane];renderer.setRenderTarget(rt);renderer.clear();
  renderer.render(scene,mirrorCam);
  sides.forEach(([m,v])=>{m.side=v;});
  renderer.setRenderTarget(prevTarget);renderer.clippingPlanes=prevClip;surface.visible=bowl.visible=true;
 }
 return {
  group,
  attachModel,
  // Called each frame before the main render; returns true while it animates.
  update(now,dt,live){
   const wasVisible=group.visible;
   surface.material.uniforms.uTime.value=now/1000;
   const want=live?1:0;
   if(shown!==want){shown=want>shown?Math.min(1,shown+dt/1.6):Math.max(0,shown-dt/.6);}
   shared.uOpacity.value=shown*shown*(3-2*shown);
   wallMat.opacity=shared.uOpacity.value;
   wallMat.depthWrite=shown>=1;
   group.visible=shown>0;
   // Water and stone fade together in place, without rising from below.
   group.position.y=0;
   return group.visible||wasVisible;
  },
  reflect,
  dispose(){rt.dispose();wallMat.dispose();stoneMap?.dispose();group.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==wallMat)o.material.dispose();});scene.remove(group);}
 };
}
