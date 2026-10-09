import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadDetailedArchitecture,warmArchitecture} from '../model-preload.js?v=architecture-3';
import {disposeArchitecture} from '../model-loader.js?v=architecture-3';
import {bindViewGestures} from '../view-gestures.js';
import {createPond} from './pond.js?v=19';

// The camera starts as a near-orthographic front elevation that lines up with
// the ink plates, then widens its field of view while orbiting (a dolly zoom),
// so the drawing gains depth instead of being replaced by a different picture.
const ELEV_FOV=1.1,LIVE_FOV=34,HOME_TARGET=new T.Vector3(0,4.3,0),ELEV_TARGET_Y=4.6;
const HOME_DIR=new T.Vector3(1,.62,1.25).normalize();
const lerp=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
const easeInOut=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
const smoother=t=>t*t*t*(t*(t*6-15)+10);

// Where the plates must sit on screen for the elevation camera.
export function elevationFrame(width,height,rect){
 const aspect=width/height,w=rect.right-rect.left,h=rect.top-rect.bottom;
 const narrow=width<760;
 const halfH=Math.max(h/2/(narrow?.5:.6),w/2/aspect/(narrow?.94:.78));
 const ppu=height/(2*halfH);
 return {halfH,ppu,x:width/2+rect.left*ppu,y:height/2-(rect.top-ELEV_TARGET_Y)*ppu,w:w*ppu,h:h*ppu};
}

export function createStage(host,entry,{reduced=false,onSelect=()=>{},onExplode=()=>{},onLost=()=>{}}={}){
 const layersDef=entry.layers;
 let renderer,scene,camera,controls,model,sun;
 let mode='idle',paused=true,dirty=true,raf=0,last=performance.now();
 let explode=0,explodeTarget=0,prevExplode=0,zoom=1,baseDistance=36;
 let selected=layersDef.find(l=>l.id==='roof')?.id||layersDef[0].id,isolate=false;
 let intro=null,resetMotion=null,outro=null;
 const offset={x:0,y:0,tx:0,ty:0,fw:0,fh:0};
 const ghost=new T.MeshBasicMaterial({color:'#2b231b',transparent:true,opacity:.075,depthWrite:false});
 const originals=new WeakMap();
 const dimmedMaterials=new Map();
 let selectionTimer=null,selectionFocus=false,selectionStarted=0;
 const focusCoverage={value:.8};
 function dimMaterial(material){
  if(!dimmedMaterials.has(material)){
   const dim=material.clone();
   // Correlated screen-door coverage: stacked tiles share the same holes,
   // rather than accumulating alpha until the roof looks opaque again.
   // Preserve source alpha tests/maps (e.g. cutout rafters) independently.
   dim.transparent=false;dim.depthWrite=true;
   dim.onBeforeCompile=shader=>{
    shader.uniforms.focusCoverage=focusCoverage;
    shader.fragmentShader='uniform float focusCoverage;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
     float focusThreshold = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715))));
     if (focusThreshold >= focusCoverage) discard;
    `);
   };
   dim.customProgramCacheKey=()=> 'archive-focus-coverage-v1';
   if(dim.emissive)dim.emissive.set('#000000');
   dimmedMaterials.set(material,dim);
  }
  return dimmedMaterials.get(material);
 }
 function clearSelectionFocus(){
  clearTimeout(selectionTimer);selectionTimer=null;selectionFocus=false;
 }
 // Each stage owns its own mount so switching buildings tears down every listener with it.
 const outer=host;host=document.createElement('div');host.className='stage-mount';host.tabIndex=0;
 host.setAttribute('role','application');host.setAttribute('aria-label',outer.getAttribute('aria-label')||'3D 건축 보기');
 outer.removeAttribute('tabindex');outer.append(host);
 let observer=null,disposed=false,pond=null,lastWater=0,closingEnvironment=false;
 const alive=()=>{if(disposed)throw new Error('stage disposed');};

 function size(){return {w:Math.max(1,host.clientWidth),h:Math.max(1,host.clientHeight)};}
 function computeBase(){
  // Fit the platform into the free area beside the panels, not the whole canvas.
  const {w,h}=size(),fw=offset.fw||w,fh=offset.fh||h,t=Math.tan(T.MathUtils.degToRad(LIVE_FOV/2));
  baseDistance=Math.max(30*h/fh,26/(2*t*Math.max(.3,fw/fh))*(h/fh));
 }
 function resize(){
  if(!renderer)return;const {w,h}=size();
  renderer.setSize(w,h,false);camera.aspect=w/h;computeBase();applyOffset();dirty=true;
 }
 function applyOffset(){
  const {w,h}=size();
  if(Math.abs(offset.x)<.5&&Math.abs(offset.y)<.5)camera.clearViewOffset();
  else camera.setViewOffset(w,h,offset.x,offset.y,w,h);
  camera.updateProjectionMatrix();
 }
 function elevationPose(){
  const {w,h}=size(),f=elevationFrame(w,h,entry.elevation);
  const dist=f.halfH/Math.tan(T.MathUtils.degToRad(ELEV_FOV/2));
  camera.fov=ELEV_FOV;camera.near=Math.max(1,dist-40);camera.far=dist+60;
  camera.position.set(0,ELEV_TARGET_Y,dist);camera.lookAt(0,ELEV_TARGET_Y,0);
  camera.updateProjectionMatrix();
  return f;
 }
 function paintSelection(){
  if(!model)return;
  for(const l of model.layers){
   const on=l.definition.id===selected,ghosted=isolate&&!on,dimmed=selectionFocus&&!isolate&&!on;
   l.group.traverse(o=>{
    if(!o.isMesh)return;
    if(!originals.has(o))originals.set(o,{material:o.material,cast:o.castShadow});
    const orig=originals.get(o);
    o.material=ghosted?(Array.isArray(orig.material)?orig.material.map(()=>ghost):ghost):dimmed?(Array.isArray(orig.material)?orig.material.map(dimMaterial):dimMaterial(orig.material)):orig.material;
    o.castShadow=ghosted||dimmed?false:orig.cast;
    if(!ghosted)for(const m of [].concat(orig.material))if(m.emissive){m.emissive.set(on&&!isolate?'#9a6428':'#000000');m.emissiveIntensity=.05;}
   });
  }
  renderer.shadowMap.needsUpdate=true;dirty=true;
 }

 async function load(report){
  renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1:1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;renderer.setClearColor(0,0);
  host.append(renderer.domElement);
  scene=new T.Scene();
  camera=new T.PerspectiveCamera(ELEV_FOV,1,1,1000);
  scene.add(new T.HemisphereLight('#f3ead9','#8a8173',2.4));
  sun=new T.DirectionalLight('#fff0d6',3.1);sun.position.set(10,20,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-20,right:20,top:24,bottom:-20,near:1,far:65});sun.shadow.bias=-.001;sun.shadow.normalBias=.04;scene.add(sun);
  const rim=new T.DirectionalLight('#a9c4cf',.9);rim.position.set(-12,12,-8);scene.add(rim);
  const floor=new T.Mesh(new T.PlaneGeometry(160,160),new T.ShadowMaterial({color:'#3b2a17',opacity:.2,depthWrite:false}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.03;floor.receiveShadow=true;scene.add(floor);

  controls=new OrbitControls(camera,renderer.domElement);
  controls.enabled=false;controls.enableDamping=true;controls.dampingFactor=.065;controls.enableZoom=false;controls.enablePan=true;controls.panSpeed=.65;
  controls.maxPolarAngle=Math.PI*.54;controls.addEventListener('change',()=>{dirty=true;});

  observer=new ResizeObserver(resize);observer.observe(host);
  resize();elevationPose();

  // The interpretive setting does not depend on the large heritage asset.
  if(entry.pond){
   pond=createPond({renderer,scene,camera,config:entry.pond});
   mode='loading';resume();
  }

  model=await loadDetailedArchitecture({...entry.model,renderer},layersDef,report);alive();
  scene.add(model.root);
  // Warming uses the same renderer with an offscreen target; do not let the
  // environment loop switch targets or expose partly prepared geometry.
  pause();
  try{await warmArchitecture(renderer,scene,camera,model,report);alive();}
  finally{model.root.visible=false;}
  pond?.attachModel(model);
  paintSelection();
  bindInput();
  mode='elevation';
  renderer.shadowMap.needsUpdate=true;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!disposed)onLost();});
  resume();
 }

 function bindInput(){
  bindViewGestures(host,{zoomBy:f=>{if(mode!=='live')return;cancelReset();zoom=clamp(zoom*f,.2,1.5);dirty=true;},explodeBy:d=>{if(mode!=='live')return;cancelReset();setExplode(explodeTarget+d);}});
  host.addEventListener('keydown',e=>{
   if(mode!=='live'||e.ctrlKey||e.metaKey||e.altKey)return;
   if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));s.theta+=e.key==='ArrowLeft'?-.12:.12;camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));dirty=true;}
  });
  const ray=new T.Raycaster(),ptr=new T.Vector2();let down=null,moved=false;const pointers=new Set();
  host.addEventListener('pointerdown',e=>{cancelReset();pointers.add(e.pointerId);if(pointers.size>1){moved=true;return;}down={x:e.clientX,y:e.clientY};moved=false;});
  host.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;});
  host.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});
  host.addEventListener('pointerup',e=>{
   pointers.delete(e.pointerId);
   if(!down||moved||pointers.size||mode!=='live'){if(!pointers.size)down=null;return;}
   down=null;const r=host.getBoundingClientRect();
   ptr.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ptr,camera);
   const hits=ray.intersectObjects(model.pickRoots(),true).filter(h=>h.object.userData.layerId);
   const solid=hits.find(h=>!isolate||h.object.userData.layerId===selected)||hits[0];
   if(solid)select(solid.object.userData.layerId,true);
  });
 }
 function cancelReset(){if(!resetMotion)return;resetMotion=null;explodeTarget=explode;controls.enabled=true;controls.enableDamping=true;}

 function select(id,fromScene=false){
  if(!layersDef.some(l=>l.id===id))return;
  clearSelectionFocus();
  if(!isolate){
   selectionFocus=true;selectionStarted=performance.now();focusCoverage.value=reduced?.55:.8;
   selectionTimer=setTimeout(()=>{clearSelectionFocus();if(!disposed)paintSelection();},3000);
  }
  selected=id;paintSelection();onSelect(id,fromScene);
 }
 function setIsolate(v){clearSelectionFocus();isolate=!!v;paintSelection();}
 function setExplode(v){explodeTarget=clamp(v,0,1);dirty=true;onExplode(explodeTarget);}
 function setOffset(x,y,fw=0,fh=0){offset.tx=x;offset.ty=y;offset.fw=fw;offset.fh=fh;computeBase();dirty=true;}

 // Elevation → perspective: widen the lens while keeping the subject's framing.
 function reveal(duration=3400){
  return new Promise(resolve=>{
   if(mode!=='elevation')return resolve();
   model.root.visible=true;
   closingEnvironment=false;
   const {w,h}=size(),f=elevationFrame(w,h,entry.elevation);
   computeBase();
   const end=new T.Spherical().setFromVector3(HOME_DIR);
   intro={start:performance.now(),duration:reduced?1:duration,halfH0:f.halfH,end,resolve};
   mode='intro';dirty=true;
  });
 }
 function reset(){
  if(mode!=='live')return;
  const fromPos=camera.position.clone(),fromTarget=controls.target.clone();
  controls.enableDamping=false;controls.update();camera.position.copy(fromPos);controls.target.copy(fromTarget);controls.update();
  const orbit=new T.Spherical().setFromVector3(fromPos.clone().sub(fromTarget)),home=new T.Spherical().setFromVector3(HOME_DIR);
  const dTheta=Math.atan2(Math.sin(home.theta-orbit.theta),Math.cos(home.theta-orbit.theta));
  resetMotion={start:performance.now(),duration:reduced?1:1200,fromTarget,orbit,home,dTheta,zoom,explode};
  explodeTarget=0;onExplode(0);controls.enabled=false;
 }

 function conceal(duration=1800){
  if(mode!=='live')return Promise.resolve();
  closingEnvironment=true;
  clearSelectionFocus();isolate=false;paintSelection();resetMotion=null;
  const position=camera.position.clone(),target=controls.target.clone();
  controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(target);
  controls.enabled=false;
  const orbit=new T.Spherical().setFromVector3(position.clone().sub(target));
  const theta=Math.atan2(Math.sin(orbit.theta),Math.cos(orbit.theta));
  return new Promise(resolve=>{
   outro={start:performance.now(),duration:reduced?1:duration,target,orbit,theta,
    fov:camera.fov,halfH:orbit.radius*Math.tan(T.MathUtils.degToRad(camera.fov/2)),
    x:offset.x,y:offset.y,explode,resolve};
   mode='outro';dirty=true;resume();
  });
 }

 function frame(now){
  raf=0;if(paused)return;
  if(selectionFocus){
   // Two sinusoidal breaths in the existing three-second emphasis window.
   focusCoverage.value=reduced?.55:.55+.25*Math.sin((now-selectionStarted)/1500*Math.PI*2+Math.PI/2);
   dirty=true;
  }
  const dt=Math.min((now-last)/1000,.05);last=now;
  // Animated view offset keeps the building centred in the space beside the panels.
  if(mode==='elevation'){offset.x=offset.y=0;}
  else if(mode!=='intro'&&mode!=='outro'&&(Math.abs(offset.tx-offset.x)>.3||Math.abs(offset.ty-offset.y)>.3)){offset.x=reduced?offset.tx:T.MathUtils.damp(offset.x,offset.tx,5,dt);offset.y=reduced?offset.ty:T.MathUtils.damp(offset.y,offset.ty,5,dt);applyOffset();dirty=true;}
  if(mode==='elevation'){elevationPose();}
  else if(mode==='intro'){
   const i=intro,t=clamp((now-i.start)/i.duration,0,1);
   const e=easeInOut(t),turn=smoother(clamp((t-.12)/.88,0,1));
   const fov=Math.exp(lerp(Math.log(ELEV_FOV),Math.log(LIVE_FOV),smoother(t)));
   const halfH=lerp(i.halfH0,baseDistance*Math.tan(T.MathUtils.degToRad(LIVE_FOV/2)),e);
   const dist=halfH/Math.tan(T.MathUtils.degToRad(fov/2));
   const target=new T.Vector3(0,lerp(ELEV_TARGET_Y,HOME_TARGET.y,e),0);
   const s=new T.Spherical(dist,lerp(Math.PI/2,i.end.phi,turn),lerp(0,i.end.theta,turn));
   // Slide toward the free area only as the elevation turns into perspective.
   offset.x=offset.tx*e;offset.y=offset.ty*e;applyOffset();
   camera.fov=fov;camera.near=Math.max(.1,dist-45);camera.far=dist+220;camera.updateProjectionMatrix();
   camera.position.copy(target).add(new T.Vector3().setFromSpherical(s));camera.lookAt(target);
   dirty=true;
   if(t===1){
    intro=null;mode='live';camera.near=.1;camera.far=220;camera.updateProjectionMatrix();
    controls.target.copy(HOME_TARGET);controls.update();controls.enabled=true;i.resolve();
   }
  }else if(mode==='outro'){
   const o=outro,t=clamp((now-o.start)/o.duration,0,1),e=smoother(t);
   const {w,h}=size(),f=elevationFrame(w,h,entry.elevation);
   camera.fov=Math.exp(lerp(Math.log(o.fov),Math.log(ELEV_FOV),e));
   const distance=lerp(o.halfH,f.halfH,e)/Math.tan(T.MathUtils.degToRad(camera.fov/2));
   const target=o.target.clone().lerp(new T.Vector3(0,ELEV_TARGET_Y,0),e);
   const orbit=new T.Spherical(distance,lerp(o.orbit.phi,Math.PI/2,e),o.theta*(1-e));
   camera.position.copy(target).add(new T.Vector3().setFromSpherical(orbit));camera.lookAt(target);
   camera.near=Math.max(.1,distance-45);camera.far=distance+220;
   offset.x=o.x*(1-e);offset.y=o.y*(1-e);applyOffset();
   explode=o.explode*(1-e);explodeTarget=explode;onExplode(explode);dirty=true;
   if(t===1){outro=null;mode='elevation';zoom=1;explode=explodeTarget=0;controls.enableDamping=true;elevationPose();o.resolve();}
  }else if(mode==='live'){
   if(resetMotion){
    const r=resetMotion,t=clamp((now-r.start)/r.duration,0,1),e=smoother(t);
    explode=lerp(r.explode,0,e);zoom=lerp(r.zoom,1,e);
    controls.target.lerpVectors(r.fromTarget,HOME_TARGET,e);
    const s=new T.Spherical((baseDistance+explode*9)*zoom,lerp(r.orbit.phi,r.home.phi,e),r.orbit.theta+r.dTheta*e);
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));dirty=true;
    if(t===1){resetMotion=null;controls.enabled=true;controls.enableDamping=true;}
   }else{
    explode=reduced||Math.abs(explode-explodeTarget)<.0001?explodeTarget:T.MathUtils.damp(explode,explodeTarget,8,dt);
    const shift=(explode-prevExplode)*4.9;camera.position.y+=shift;controls.target.y+=shift;
    const dir=camera.position.clone().sub(controls.target).normalize();
    const want=(baseDistance+explode*9)*zoom,cur=camera.position.distanceTo(controls.target);
    camera.position.copy(controls.target).addScaledVector(dir,Math.abs(cur-want)<.001?want:T.MathUtils.damp(cur,want,10,dt));
    if(Math.abs(cur-want)>.001)dirty=true;
   }
   controls.update();
  }
  if(model){
   for(const l of model.layers){const [x,y,z]=l.definition.offset;l.group.position.copy(l.origin).addScaledVector(new T.Vector3(x,y,z),explode/model.scale);}
   if(Math.abs(explode-prevExplode)>.00001){dirty=true;renderer.shadowMap.needsUpdate=true;}
  }
  prevExplode=explode;
  // The pond animates its water at ~30fps; otherwise the scene renders only when something changed.
  if(pond&&pond.update(now,dt,!closingEnvironment&&(mode==='intro'||mode==='live'))&&now-lastWater>33){lastWater=now;dirty=true;}
  if(dirty&&(model||pond)){pond?.reflect();renderer.render(scene,camera);dirty=false;}
  raf=requestAnimationFrame(frame);
 }
 function resume(){if(!paused||!renderer)return;paused=false;last=performance.now();dirty=true;raf=requestAnimationFrame(frame);}
 function pause(){clearSelectionFocus();paintSelection();paused=true;if(raf)cancelAnimationFrame(raf);raf=0;}
 function dispose(){
  disposed=true;pause();observer?.disconnect();controls?.dispose();
  // Restore source materials before the model disposer traverses the meshes.
  if(model)for(const l of model.layers)l.group.traverse(o=>{const orig=originals.get(o);if(orig)o.material=orig.material;});
  for(const material of dimmedMaterials.values())material.dispose();dimmedMaterials.clear();
  pond?.dispose();if(model)disposeArchitecture(model);ghost.dispose();
  renderer?.dispose();renderer?.forceContextLoss();host.remove();
 }

 return {
  load,reveal,conceal,reset,select,setIsolate,setExplode,setOffset,pause,resume,dispose,
  focus:()=>host.focus({preventScroll:true}),
  get hasPond(){return !!entry.pond;},
  // Test hook (only used with ?debug): direct camera access for inspection.
  get debug(){return {camera,controls,scene,renderer,markDirty:()=>{dirty=true;}};},
  get mode(){return mode;},get selected(){return selected;},get explode(){return explodeTarget;},get isolate(){return isolate;},
  get ready(){return !!model;},
  stats:()=>model&&{triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,textures:model.textureAudit,instancing:model.instancingAudit}
 };
}
