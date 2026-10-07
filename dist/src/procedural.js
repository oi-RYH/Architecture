import * as T from 'three';
const mat=(color)=>new T.MeshStandardMaterial({color,roughness:.82});
export function createPalace(){
 const root=new T.Group();const groups={};for(const id of ['Roof','Brackets','Frame','Walls','Base']){const g=new T.Group();g.name='Layer_'+id;root.add(g);groups[id]=g;}
 const stone=mat('#9b9e93'),trim=mat('#c7c4b3'),wood=mat('#984d37'),ochre=mat('#bd8952'),green=mat('#427a66'),mint=mat('#90b79c'),tile=mat('#3d505a'),ridge=mat('#849396'),paper=mat('#c0b58d'),dark=mat('#382f29');
 const box=(g,w,h,d,x,y,z,m)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;};
 const beam=(g,a,b,r,m)=>{const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),m);o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);};
 const {Base:B,Walls:W,Frame:F,Brackets:C,Roof:R}=groups;
 box(B,14,.48,10.8,0,.24,0,stone);box(B,13.2,.16,10,0,.56,0,trim);box(B,11.8,.62,8.7,0,.95,0,stone);box(B,12.2,.15,9.1,0,1.33,0,trim);
 for(let i=0;i<6;i++)box(B,2.7,.22,2.1-i*.29,0,.12+i*.22,5.4-i*.145,trim);
 for(const z of [-4.9,4.9])for(let x=-6.2;x<=6.3;x+=1.25){if(z>0&&Math.abs(x)<1.5)continue;box(B,.13,.7,.13,x,.98,z,trim);box(B,1.16,.1,.12,x+.55,1.15,z,trim);}
 for(const x of [-6.2,6.2])for(let z=-4.5;z<=4.5;z+=1.25){box(B,.13,.7,.13,x,.98,z,trim);box(B,.12,.1,1.15,x,1.15,z+.5,trim);}
 box(W,10.2,.16,7,0,1.47,0,dark);
 for(let x=-4.8;x<=4.81;x+=1.92)for(const z of [-3.2,3.2]){beam(W,[x,1.5,z],[x,4.8,z],.15,wood);box(W,.48,.2,.48,x,1.55,z,trim);}
 for(const x of [-4.8,4.8])for(const z of [-1.6,0,1.6])beam(W,[x,1.5,z],[x,4.8,z],.15,wood);
 function panel(x,z,rotate=false){const g=new T.Group();g.position.set(x,0,z);if(rotate)g.rotation.y=Math.PI/2;W.add(g);box(g,1.6,2.55,.07,0,2.95,0,paper);for(let a=-.72;a<=.73;a+=.24)box(g,.035,2.55,.1,a,2.95,.02,green);for(let a=1.75;a<4.3;a+=.3)box(g,1.6,.035,.11,0,a,.025,green);box(g,1.7,.22,.14,0,1.78,0,wood);}
 for(let x=-3.84;x<=3.85;x+=1.92){panel(x,-3.2);if(Math.abs(x)>.1)panel(x,3.2);}
 for(const x of [-4.8,4.8])for(const z of [-2.4,-.8,.8,2.4])panel(x,z,true);
 for(const y of [4.65,5.05]){for(const z of [-3.2,3.2])box(F,10.2,.23,.24,0,y,z,ochre);for(const x of [-4.8,4.8])box(F,.24,.23,6.5,x,y,0,ochre);}
 for(let x=-4.8;x<4.9;x+=1.92){box(F,.2,.28,6.8,x,4.95,0,wood);beam(F,[x,5.1,-2.8],[x,5.75,0],.08,ochre);beam(F,[x,5.75,0],[x,5.1,2.8],.08,ochre);}
 box(F,7.5,1.18,4.7,0,6.05,0,wood);for(const z of [-2.38,2.38])for(let x=-3.5;x<=3.6;x+=.5)box(F,.17,.8,.09,x,6.1,z,mint);
 function brackets(w,d,y){for(const z of [-d/2,d/2])for(let x=-w/2;x<=w/2+.01;x+=w/10){box(C,.2,.34,.65,x,y,z,wood);box(C,.58,.15,.85,x,y+.23,z,green);box(C,.8,.13,1.08,x,y+.4,z,mint);box(C,.16,.17,1.25,x,y+.55,z,green);}for(const x of [-w/2,w/2])for(let z=-d/2;z<=d/2+.01;z+=d/7){box(C,.65,.34,.2,x,y,z,wood);box(C,.85,.15,.58,x,y+.23,z,green);box(C,1.1,.13,.8,x,y+.4,z,mint);}for(const z of [-d/2-.35,d/2+.35])box(C,w+1,.12,.2,0,y+.64,z,ochre);}
 brackets(10,6.7,4.83);brackets(7.8,4.9,6.65);
 function roof(w,d,y,rise){
  const positions=[],indices=[],n=36,m=22;
  function height(x,z){const a=Math.abs(x)/(w/2),b=Math.abs(z)/(d/2),t=Math.max(Math.max(0,(a-.43)/.57),b);return y+rise*Math.pow(Math.max(0,1-t),1.65)+.28*Math.pow(t,7)+.28*Math.pow(a*b,4);}
  for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){let x=(i/n-.5)*w,z=(j/m-.5)*d;positions.push(x,height(x,z),z);}
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*(m+1)+j,b=a+m+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(positions,3));geom.setIndex(indices);geom.computeVertexNormals();const material=tile.clone();material.side=T.DoubleSide;const mesh=new T.Mesh(geom,material);mesh.castShadow=true;mesh.receiveShadow=true;R.add(mesh);
  // Continuous raised tile seams follow each curved roof slope.
  for(let x=-w/2+.1;x<w/2;x+=.22){for(const sign of [-1,1]){const points=[];for(let k=0;k<=16;k++){const z=sign*k/16*d/2;points.push(new T.Vector3(x,height(x,z)+.028,z));}const seam=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),16,.022,4,false),ridge);R.add(seam);}}
  const points=[];for(let k=0;k<=36;k++){let x=(k/36-.5)*w;points.push(new T.Vector3(x,height(x,0)+.09,0));}R.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),36,.075,6,false),ridge));
  for(const sign of [-1,1]){const p=[];for(let k=0;k<=36;k++){let x=(k/36-.5)*w;p.push(new T.Vector3(x,height(x,sign*d/2),sign*d/2));}R.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(p),36,.055,6,false),ridge));}
 }
 roof(12.4,8.8,5.32,1.52);roof(10.2,7.2,7.08,1.65);
 // Front name plaque, with no external image dependency.
 const c=document.createElement('canvas');c.width=384;c.height=144;const ctx=c.getContext('2d');ctx.fillStyle='#233631';ctx.fillRect(0,0,384,144);ctx.strokeStyle='#c9ad74';ctx.lineWidth=8;ctx.strokeRect(9,9,366,126);ctx.fillStyle='#e5ca91';ctx.font='bold 86px serif';ctx.textAlign='center';ctx.fillText('勤政殿',192,104);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const plaque=new T.Mesh(new T.PlaneGeometry(1.6,.6),new T.MeshStandardMaterial({map:tex}));plaque.position.set(0,6.17,2.43);F.add(plaque);
 return root;
}
