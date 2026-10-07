import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LAYERS,MODEL_CONFIG} from './layers.js?v=architecture-2';
import {loadDetailedArchitecture,warmArchitecture} from './model-preload.js?v=architecture-2';
import {bindViewGestures} from './view-gestures.js';
const $=id=>document.getElementById(id);const host=$('scene');let model,selected='roof',progress=0,target=0,renderer,controls,camera,dirty=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const journeyEmbedded=window.parent!==window && new URLSearchParams(location.search).has('journey');
const notifyJourney=type=>{if(journeyEmbedded)parent.postMessage({type},location.origin);};
if(journeyEmbedded){
 document.documentElement.classList.add('journey-embedded');
 document.querySelectorAll('a[href="./"]').forEach(a=>{a.target='_top';});
}
$('layers').innerHTML=LAYERS.map((d,i)=>`<button class="layer" data-id="${d.id}" aria-pressed="false"><span class="number">0${i+1}</span><span class="swatch" style="--swatch:${d.color}"></span><span><strong>${d.name}</strong><small>${d.english}</small></span><span class="indicator"></span></button>`).join('');
function select(id){const d=LAYERS.find(x=>x.id===id);if(!d)throw new Error('알 수 없는 레이어');selected=id;dirty=true;document.querySelectorAll('.layer').forEach(b=>{b.classList.toggle('active',b.dataset.id===id);b.setAttribute('aria-pressed',String(b.dataset.id===id));});$('detail-title').textContent=d.name;$('detail-number').textContent=String(LAYERS.indexOf(d)+1).padStart(2,'0');$('detail-description').textContent=d.description;$('detail-tag').textContent=d.tag;model?.layers.forEach(l=>l.group.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))if(m.emissive){m.emissive.set(l.definition.id===id?'#8c642c':'#000000');m.emissiveIntensity=.035;}}));}
function setProgress(v){target=T.MathUtils.clamp(v,0,1);}
select(selected);document.querySelectorAll('.layer').forEach(b=>b.onclick=()=>select(b.dataset.id));
async function init(){
 renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:680px)').matches?1:1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.append(renderer.domElement);
 const scene=new T.Scene();camera=new T.PerspectiveCamera(36,1,.1,180);camera.position.set(20,15,24);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.enableZoom=false;controls.enablePan=true;controls.panSpeed=.65;controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.target.set(0,4.3,0);controls.update();controls.addEventListener('change',()=>{dirty=true;});
 scene.add(new T.HemisphereLight('#d4e6ee','#8a8580',2.5));const sun=new T.DirectionalLight('#fff0d3',3.2);sun.position.set(10,20,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:24,bottom:-20,near:1,far:65});sun.shadow.bias=-.001;sun.shadow.normalBias=.04;scene.add(sun);const rim=new T.DirectionalLight('#86b5c3',1.0);rim.position.set(-12,12,-8);scene.add(rim);
 const paper=await new T.TextureLoader().loadAsync('./assets/hanji.jpg');paper.colorSpace=T.SRGBColorSpace;paper.wrapS=paper.wrapT=T.RepeatWrapping;paper.repeat.set(14,14);paper.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
 const fadePixels=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const a=1-T.MathUtils.smoothstep(Math.hypot((x-63.5)/63.5,(y-63.5)/63.5),.42,.97);const i=(y*128+x)*4;fadePixels[i]=fadePixels[i+1]=fadePixels[i+2]=Math.round(a*255);fadePixels[i+3]=255;}const fade=new T.DataTexture(fadePixels,128,128);fade.needsUpdate=true;fade.magFilter=T.LinearFilter;
 const floor=new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshStandardMaterial({map:paper,alphaMap:fade,transparent:true,depthWrite:false,color:'#e5dbc4',roughness:1,metalness:0,side:T.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;floor.receiveShadow=true;scene.add(floor);
 const loadStarted=performance.now();
 controls.enabled=false;host.setAttribute('aria-busy','true');
 model=await loadDetailedArchitecture({...MODEL_CONFIG,renderer},LAYERS,message=>{$('loading').textContent=message;});scene.add(model.root);select(selected);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 let baseDistance=33;const direction=new T.Vector3(1,.62,1.25).normalize();
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();baseDistance=Math.max(37,27/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*camera.aspect));dirty=true;}
 new ResizeObserver(resize).observe(host);resize();
 camera.position.copy(direction.clone().multiplyScalar(baseDistance).add(controls.target));controls.update();
 await warmArchitecture(renderer,scene,camera,model,message=>{$('loading').textContent=message;});
 host.dataset.modelLoadMs=String(Math.round(performance.now()-loadStarted));host.dataset.preloaded='true';host.dataset.textureAudit=JSON.stringify(model.textureAudit);host.dataset.instancingAudit=JSON.stringify(model.instancingAudit);host.setAttribute('aria-busy','false');$('model-status').textContent='국가유산청 원본 에셋';
 controls.enabled=true;$('loading').hidden=true;$('loading-screen').hidden=true;
 let zoom=1;function zoomBy(f){zoom=T.MathUtils.clamp(zoom*f,.18,1.5);dirty=true;}
 let resetMotion=null;
 const homeTarget=new T.Vector3(0,4.3,0),homeOrbit=new T.Spherical().setFromVector3(direction);
 let arrivalMotion=null;
 if(journeyEmbedded){
  controls.enabled=false;
  const arrivalOrbit=new T.Spherical(baseDistance*2.1,Math.PI*.465,homeOrbit.theta-.10);
  camera.position.copy(homeTarget).add(new T.Vector3().setFromSpherical(arrivalOrbit));controls.update();
  addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='architecture-arrive')return;
   if(host.dataset.arrivalStarted)return;
   host.dataset.arrivalStarted='true';
   arrivalMotion={started:performance.now(),orbit:arrivalOrbit};
   document.documentElement.classList.add('journey-arriving');
  });
 }
 function cancelReset(){if(!resetMotion)return;resetMotion=null;target=progress;controls.enabled=true;controls.enableDamping=true;}
 for(const event of ['pointerdown','wheel','gesturestart','keydown'])host.addEventListener(event,cancelReset,{capture:true,passive:true});
 $('reset').onclick=()=>{
  const fromPosition=camera.position.clone(),fromTarget=controls.target.clone();
  // Flush OrbitControls inertia without changing the visible starting pose.
  controls.enableDamping=false;controls.update();camera.position.copy(fromPosition);controls.target.copy(fromTarget);controls.update();
  const orbit=new T.Spherical().setFromVector3(fromPosition.clone().sub(fromTarget));
  const thetaDelta=Math.atan2(Math.sin(homeOrbit.theta-orbit.theta),Math.cos(homeOrbit.theta-orbit.theta));
  resetMotion={started:performance.now(),duration:reduced?0:1100,fromTarget,orbit,thetaDelta,zoom,progress};
  target=0;controls.enabled=false;select('roof');dirty=true;
 };

 bindViewGestures(host,{zoomBy,explodeBy:delta=>setProgress(target+delta)});
 const ray=new T.Raycaster(),pointer=new T.Vector2();let down=null,moved=false;const pointers=new Set();host.addEventListener('pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size>1){moved=true;return;}down={x:e.clientX,y:e.clientY};moved=false;});host.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)moved=true;});host.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);down=null;});host.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);if(!down||moved||pointers.size){if(!pointers.size)down=null;return;}down=null;const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(model.pickRoots(),true).find(h=>h.object.userData.layerId);if(hit)select(hit.object.userData.layerId);});
 let previousProgress=0;let last=performance.now();
 function frame(now){
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(arrivalMotion){
   const t=reduced?1:T.MathUtils.clamp((now-arrivalMotion.started)/2400,0,1),ease=1-(1-t)**3;
   const from=arrivalMotion.orbit;
   const orbit=new T.Spherical(T.MathUtils.lerp(from.radius,baseDistance,ease),T.MathUtils.lerp(from.phi,homeOrbit.phi,ease),T.MathUtils.lerp(from.theta,homeOrbit.theta,ease));
   camera.position.copy(homeTarget).add(new T.Vector3().setFromSpherical(orbit));dirty=true;
   host.dataset.arrivalProgress=t.toFixed(3);host.dataset.arrivalDistance=orbit.radius.toFixed(3);
   if(t===1){arrivalMotion=null;controls.enabled=true;document.documentElement.classList.add('journey-arrived');notifyJourney('architecture-landed');}
  }else if(journeyEmbedded&&!host.dataset.arrivalStarted){
   // Keep the entrance pose until the map camera reaches the paper surface.
  }else if(resetMotion){
   const r=resetMotion,t=r.duration?T.MathUtils.clamp((now-r.started)/r.duration,0,1):1;
   const ease=t*t*t*(t*(t*6-15)+10);
   progress=T.MathUtils.lerp(r.progress,0,ease);zoom=T.MathUtils.lerp(r.zoom,1,ease);
   controls.target.lerpVectors(r.fromTarget,homeTarget,ease);
   const orbit=new T.Spherical((baseDistance+progress*9)*zoom,T.MathUtils.lerp(r.orbit.phi,homeOrbit.phi,ease),r.orbit.theta+r.thetaDelta*ease);
   camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(orbit));
   dirty=true;
   if(t===1){resetMotion=null;controls.enabled=true;controls.enableDamping=true;}
  }else{
   progress=reduced||Math.abs(progress-target)<.0001?target:T.MathUtils.damp(progress,target,9,dt);
   const shift=(progress-previousProgress)*4.9;camera.position.y+=shift;controls.target.y+=shift;
   const dir=camera.position.clone().sub(controls.target).normalize();
   camera.position.copy(controls.target).addScaledVector(dir,(baseDistance+progress*9)*zoom);
  }
  for(const l of model.layers){const [x,y,z]=l.definition.offset;l.group.position.copy(l.origin).addScaledVector(new T.Vector3(x,y,z),progress/model.scale);}
  if(Math.abs(progress-previousProgress)>.00001){dirty=true;renderer.shadowMap.needsUpdate=true;}
  previousProgress=progress;controls.update();
  host.dataset.detailLayers=String(model.layers.length);host.dataset.lod='disabled';
  if(dirty){renderer.render(scene,camera);if(host.dataset.triangles!==String(renderer.info.render.triangles)){host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.gpuGeometries=String(renderer.info.memory.geometries);host.dataset.gpuTextures=String(renderer.info.memory.textures);}dirty=false;}
  requestAnimationFrame(frame);
 }
 renderer.render(scene,camera);
 notifyJourney('architecture-ready');
 requestAnimationFrame(frame);
 // A structured counterpart to the same visible controls, where WebMCP is supported.
 if(document.modelContext?.registerTool){const lifecycle=new AbortController();try{await document.modelContext.registerTool({name:'set_architecture_view',description:'근정전의 레이어 선택과 분해 정도를 조절합니다.',inputSchema:{type:'object',properties:{layer:{type:'string',enum:LAYERS.map(l=>l.id)},progress:{type:'number',minimum:0,maximum:1}},additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['layer','progress'].includes(k))||(input.layer!==undefined&&!LAYERS.some(l=>l.id===input.layer))||(input.progress!==undefined&&(!Number.isFinite(input.progress)||input.progress<0||input.progress>1)))throw new Error('유효하지 않은 보기 설정');if(input.layer!==undefined)select(input.layer);if(input.progress!==undefined)setProgress(input.progress);await new Promise(r=>requestAnimationFrame(r));return {layer:selected,progress:target};}},{signal:lifecycle.signal});addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}catch(e){console.warn('Optional WebMCP unavailable',e);}}
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();notifyJourney('architecture-error');$('loading-screen').classList.add('load-failed');$('loading').textContent='3D 화면 연결이 끊겼습니다. 페이지를 새로고침해 주세요.';$('loading').hidden=false;$('loading-screen').hidden=false;});
}
init().catch(error=>{console.error(error);notifyJourney('architecture-error');$('loading-screen').classList.add('load-failed');$('loading').textContent='3D 화면을 불러오지 못했습니다. WebGL 지원과 모델 파일을 확인한 후 새로고침해 주세요.';$('loading').hidden=false;$('loading-screen').hidden=false;});
