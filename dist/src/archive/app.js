import {ARCHIVE,NUMERALS,findEntry} from './registry.js?v=official-1';
import {createStage,elevationFrame} from './stage.js?v=29';

const $=id=>document.getElementById(id);
const html=document.documentElement,room=$('room'),gallery=$('gallery');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,reduced?0:ms));
const frameTick=()=>new Promise(r=>requestAnimationFrame(r));
const PANES=6;

/* ───────── 서가 · gallery of bound books ───────── */
// Every record is one thread-bound book (선장본); one blank book after them stands for the next record.
const slots=[...ARCHIVE,null];
let active=0;

const HOLES=[.09,.29,.5,.71,.91];
function bookHTML(e){
 const half=side=>e?`<span class="half half-${side}"><img src="${e.assets}painting.webp" alt="" decoding="async" draggable="false"></span>`:'';
 const thread=`<span class="thread" aria-hidden="true">${HOLES.map(y=>`<i style="--y:${y}"></i>`).join('')}</span>`;
 const slip=e?`<span class="slip"><b>${e.hanja}圖說</b><small>${e.site.split(' · ').pop()}</small></span>`:`<span class="slip is-blank"></span>`;
 return `<span class="book">
  <span class="b-back"></span><span class="b-edge"></span><span class="b-top"></span>
  <span class="b-page">${half('l')}</span>
  <span class="b-cover"><span class="cover-front">${slip}${thread}</span><span class="cover-inside">${half('r')}${e?`<span class="spread-title">${e.hanja}</span><span class="spread-seal">반닫이</span>`:''}</span></span>
 </span>`;
}
// The shelf is a ring: the blank book is followed by the first record again.
// Short archives repeat around the ring so it always reaches past both screen edges.
const RING_MIN=7,copies=Math.ceil(RING_MIN/slots.length);
const ring=Array.from({length:slots.length*copies},(_,r)=>({idx:r%slots.length,copy:Math.floor(r/slots.length)}));
const L=ring.length,mod=(a,n)=>((a%n)+n)%n,wrapD=d=>mod(d+L/2,L)-L/2;
let ringEls=[],pos=0,target=0,raf=0,last=0,dragging=false,introAt=0,step=300;

function renderGallery(){
 $('track').innerHTML=ring.map(({idx,copy},r)=>{const e=slots[idx];
  return `<li class="slot${e?'':' is-empty'}" id="ring-${r}" data-ring="${r}" ${copy?'aria-hidden="true"':`role="option" aria-selected="false" aria-label="${e?`${e.name} ${e.hanja} — ${e.site}`:'다음 기록 — 준비 중'}"`}>${bookHTML(e)}<span class="book-shadow" aria-hidden="true"></span></li>`;}).join('');
 ringEls=[...document.querySelectorAll('#track .slot')];
 measure();
}
// Keep book size unchanged; double the former 0.32-book-width gap.
function measure(){step=(ringEls[0]?.offsetWidth||300)*(1+.32*2);}
// Every frame: place each book by its signed distance from the shelf position.
function place(now){
 for(let r=0;r<L;r++){
  const el=ringEls[r],d=wrapD(r-pos),a=Math.min(1,Math.abs(d));
  const seam=Math.max(0,Math.min(1,(L/2-.6-Math.abs(d))/.9));
  const t=reduced?1:Math.max(0,Math.min(1,(now-introAt-Math.min(5,Math.abs(Math.round(d))+1)*140)/900)),rise=1-(1-t)**3;
  el.style.transform=`translate3d(${(d*step).toFixed(2)}px,${(-6*(1-a)+40*(1-rise)).toFixed(2)}px,${(-220*a).toFixed(2)}px)`;
  el.style.setProperty('--tilt',`${(16+10*a).toFixed(2)}deg`);
  el.style.opacity=((1-.45*a)*(slots[ring[r].idx]?1:.72)*seam*rise).toFixed(3);
  el.classList.toggle('is-active',Math.abs(d)<.5);
 }
 const r=mod(Math.round(pos),L),idx=ring[r].idx;
 if(idx!==active||!gallery.dataset.ready){active=idx;gallery.dataset.ready='1';paintCaption();
  $('screens').setAttribute('aria-activedescendant',`ring-${idx}`);
  ringEls.forEach(el=>el.getAttribute('role')&&el.setAttribute('aria-selected',String(+el.dataset.ring===idx)));}
}
function tick(now){
 raf=0;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
 if(!dragging)pos=reduced||Math.abs(target-pos)<.0004?target:pos+(target-pos)*(1-Math.exp(-dt*7.5));
 place(now);
 if(dragging||pos!==target||now-introAt<2200)raf=requestAnimationFrame(tick);
 else last=0;
}
function kick(){if(!raf)raf=requestAnimationFrame(tick);}
function goTo(t){target=t;kick();}
function goToRecord(i,{instant=false}={}){
 // Travel the short way round the ring to the nearest copy of record i.
 let best=0,bd=Infinity;for(let r=0;r<L;r++)if(ring[r].idx===i){const d=wrapD(r-pos);if(Math.abs(d)<Math.abs(bd)){bd=d;best=r;}}
 target=Math.round(pos+bd);if(instant)pos=target;kick();return best;
}
const activeEl=()=>ringEls[mod(Math.round(target),L)];
function paintCaption(){
 const e=slots[active];
 $('caption').innerHTML=e?`<h2 class="cap-title"><b>${e.hanja}</b><span>${e.name}</span></h2>
  <p class="cap-meta"><span>${e.site}</span><span>${e.era}</span><span>${e.designation}</span><span>${e.form}</span></p>
  <p class="cap-summary">${e.summary}</p>
  <button type="button" class="enter" data-enter="${e.id}"><span class="enter-seal" aria-hidden="true">入</span><span>책을 펼쳐 들어가기</span></button>`
  :`<h2 class="cap-title is-blank"><b>다음 기록</b></h2><p class="cap-summary">아직 엮지 않은 빈 책입니다. 건축물이 더해질 때마다 서가에 한 권씩 늘어납니다.</p>`;
 // Count records only; the blank book sits outside the numbering.
 const pi=$('pager-index');pi.classList.toggle('is-next',!e);
 pi.innerHTML=e?`<b>第${NUMERALS[active]}卷</b><span>/</span>전 ${ARCHIVE.length}권`:'다음 기록';
}
function bindGallery(){
 const sc=$('screens'),idle=()=>state==='home';
 let start=null,moved=false,samples=[];
 $('prev').addEventListener('click',()=>idle()&&goTo(Math.round(target)-1));
 $('next').addEventListener('click',()=>idle()&&goTo(Math.round(target)+1));
 sc.addEventListener('keydown',e=>{
  if(!idle())return;
  if(e.key==='ArrowLeft'){e.preventDefault();goTo(Math.round(target)-1);}
  else if(e.key==='ArrowRight'){e.preventDefault();goTo(Math.round(target)+1);}
  else if((e.key==='Enter'||e.key===' ')&&slots[active]){e.preventDefault();enter(slots[active].id);}
 });
 // Trackpad: the shelf follows the finger continuously, then settles on the nearest book.
 let settle=0;
 sc.addEventListener('wheel',e=>{
  const dx=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:(e.shiftKey?e.deltaY:0);
  if(!dx||!idle())return;
  e.preventDefault();
  target+=dx/step;kick();clearTimeout(settle);settle=setTimeout(()=>goTo(Math.round(target)),130);
 },{passive:false});
 // Dragging across the shelf turns books; it must never pick up the drawing or select the slip text.
 sc.addEventListener('dragstart',e=>e.preventDefault());
 sc.addEventListener('pointerdown',e=>{
  if(!idle()||e.button!==0)return;
  start={x:e.clientX,pos};moved=false;samples=[{t:e.timeStamp,p:pos}];
 });
 sc.addEventListener('pointermove',e=>{
  if(!start)return;const dx=e.clientX-start.x;
  if(!moved&&Math.abs(dx)>6){moved=true;dragging=true;try{sc.setPointerCapture(e.pointerId);}catch{}kick();}
  if(!moved)return;
  pos=target=start.pos-dx/step;samples.push({t:e.timeStamp,p:pos});if(samples.length>6)samples.shift();
 });
 const release=e=>{
  if(!start)return;start=null;
  if(moved){
   dragging=false;const a=samples[0],b=samples[samples.length-1],v=b.t>a.t?(b.p-a.p)/((b.t-a.t)/1000):0;
   goTo(Math.round(pos+Math.max(-3,Math.min(3,v*.22))));
   sc.addEventListener('click',ev=>ev.stopPropagation(),{capture:true,once:true});
  }
 };
 sc.addEventListener('pointerup',release);sc.addEventListener('pointercancel',release);
 $('track').addEventListener('click',e=>{
  const el=e.target.closest('.slot');if(!el||!idle())return;
  const r=+el.dataset.ring,d=wrapD(r-pos);
  if(Math.abs(d)<.5&&slots[ring[r].idx])enter(slots[ring[r].idx].id);
  else goTo(Math.round(pos+d));
 });
 addEventListener('resize',()=>{measure();kick();});
}
function renderLedger(){
 const rows=ARCHIVE.map((e,i)=>`<li class="record">
  <span class="rec-no">第${NUMERALS[i]}卷</span>
  <figure class="rec-figure" aria-hidden="true"><img src="${e.assets}painting.webp" alt="" loading="lazy" decoding="async"></figure>
  <div class="rec-body">
   <h3><b>${e.hanja}</b>${e.name}</h3>
   <p>${e.summary}</p>
   <p><a href="${e.source.href}" target="_blank" rel="noopener">설명 출처 · ${e.source.label}</a></p>
   <dl><div><dt>자리</dt><dd>${e.site}</dd></div><div><dt>때</dt><dd>${e.era}</dd></div><div><dt>지정</dt><dd>${e.designation}</dd></div><div><dt>짜임</dt><dd>${e.form}</dd></div></dl>
   <button type="button" class="enter" data-enter="${e.id}"><span class="enter-seal" aria-hidden="true">入</span><span>책을 펼쳐 들어가기</span></button>
  </div></li>`).join('');
 $('ledger').innerHTML=rows+`<li class="record is-next"><span class="rec-no">第${NUMERALS[ARCHIVE.length]}卷</span><p>다음 책을 엮고 있습니다.</p></li>`;
 $('credit').innerHTML=ARCHIVE.map(e=>`<a href="${e.credit.href}" target="_blank" rel="noopener">${e.credit.text}</a>`).join(' · ');
}

/* ───────── 방 · room ───────── */
let state='home',current=null,stage=null,stageFor=null,stageLoad=null,openSlot=null,drawing=null,revealed=false;

function resetRoom(){
 room.classList.remove('is-live','is-revealing','is-stamped','is-drafting','is-failed','is-single');
 $('room-error').hidden=true;
 document.querySelectorAll('.modes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='whole')));
}
function buildRoom(entry){
 room.classList.toggle('has-environment',!!entry.pond);
 $('pond-note').hidden=!entry.pond;
 room.style.setProperty('--plates',`url('${entry.assets}')`);
 $('plaque').innerHTML=`<span class="plaque-board" aria-label="${entry.name}">${[...entry.hanja].map(c=>`<span>${c}</span>`).join('')}</span>`;
 $('room-meta').innerHTML=`<b>${entry.name}</b> ${entry.role} · ${entry.era} · ${entry.designation}`;
 $('drafting-title').innerHTML=`<span>${entry.hanja}</span><small>${entry.name} 밑그림</small>`;
 $('elevation').innerHTML=entry.drawOrder.map((id,k)=>`<img class="plate" data-k="${k}" src="${entry.assets}plate-${id}.webp" alt="" decoding="async">`).join('');
 $('layer-list').innerHTML=entry.layers.map((l,i)=>`<li><button type="button" data-layer="${l.id}" aria-pressed="false" style="--tone:${l.tone}"><span class="seal">${NUMERALS[i]}</span><span class="nm">${l.name}</span><span class="en">${l.english}</span></button></li>`).join('');
}
function placePlates(entry){
 const f=elevationFrame(innerWidth,innerHeight,entry.elevation),el=$('elevation');
 Object.assign(el.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px'});
 room.style.setProperty('--seal-x',(f.x+f.w*.9)+'px');room.style.setProperty('--seal-y',(f.y+f.h*.62)+'px');
}

function paintSelected(id){
 const l=current.layers.find(x=>x.id===id),i=current.layers.indexOf(l);
 document.querySelectorAll('#layer-list button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===id)));
 $('detail-name').innerHTML=`<span class="seal">${NUMERALS[i]}</span>${l.name}`;
 $('detail-en').textContent=l.english;
 const hasDescription=Boolean(l.description&&l.source);
 $('detail-text').textContent=hasDescription?l.description:'';
 $('detail-text').hidden=!hasDescription;
 $('detail-tag').replaceChildren();
 $('detail-tag').hidden=!hasDescription;
 if(hasDescription){
  const a=document.createElement('a');a.href=l.source.href;a.target='_blank';a.rel='noopener';
  a.textContent='설명 출처 · '+l.source.label;$('detail-tag').append(a);
 }
 $('layer-detail').style.setProperty('--tone',l.tone);
 const d=$('layer-detail');d.classList.remove('is-fresh');void d.offsetWidth;d.classList.add('is-fresh');
}
function bindRoomUI(){
 $('layer-list').addEventListener('click',e=>{const b=e.target.closest('button[data-layer]');if(b)stage?.select(b.dataset.layer);});
 document.querySelector('.modes').addEventListener('click',e=>{
  const b=e.target.closest('button[data-mode]');if(!b||!stage)return;
  const single=b.dataset.mode==='single';stage.setIsolate(single);
  document.querySelectorAll('.modes button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  room.classList.toggle('is-single',single);
 });
 $('reset-view').addEventListener('click',()=>stage?.reset());
 $('close-door').addEventListener('click',()=>history.state?.room?history.back():leave());
 $('room-retry').addEventListener('click',()=>location.reload());
 addEventListener('keydown',e=>{if(e.key==='Escape'&&(state==='room'||state==='drafting'))$('close-door').click();});
 addEventListener('resize',()=>{if(current&&room.classList.contains('is-drafting'))placePlates(current);if(state==='room')layoutOffset();});
}
function layoutOffset(){
 if(!stage)return;
 const W=innerWidth,H=innerHeight;
 if(W<760){const sheet=$('panel').getBoundingClientRect().height,top=110,bottom=H-sheet;stage.setOffset(0,H/2-(top+bottom)/2,W,bottom-top);}
 else{const left=24,right=$('panel').getBoundingClientRect().left-12;stage.setOffset(W/2-(left+right)/2,-12,right-left,H-150);}
}

// The ink plates are drawn bottom-up while the real model loads. Their pace is
// capped so even a cached load is read as a drawing, then stamped and lifted into 3D.
function draft(entry){
 const plates=[...document.querySelectorAll('#elevation .plate')],span=.3,n=plates.length;
 let goal=.02,shown=0,ready=false,last=performance.now(),milestone=.06,cancelled=false;
 const report=msg=>{
  const m=/\((\d+)\/(\d+)\)/.exec(msg);
  if(msg.startsWith('1/2')&&m){const i=+m[1],t=+m[2];goal=Math.max(goal,.04+(i-1)/t*.6);milestone=.04+i/t*.6;}
  else if(msg.includes('반복 부재')){goal=Math.max(goal,.66);milestone=.72;}
  else if(msg.startsWith('2/2')&&m){const i=+m[1],t=+m[2];goal=Math.max(goal,.74+(i-1)/t*.26);milestone=.74+i/t*.26;}
  else if(msg.startsWith('2/2')){goal=Math.max(goal,.72);milestone=.74;}
 };
 let done;const finished=new Promise(r=>done=r);
 function tick(now){
  if(cancelled)return;
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(!ready)goal=Math.min(milestone-.005,goal+dt*.012);
  const target=ready?1:goal;
  shown=Math.min(target,shown+Math.max(dt*.36*(reduced?20:1),(target-shown)*dt*.8));
  if(ready&&!reduced)shown=Math.min(shown,1);
  let active=0;
  plates.forEach((p,k)=>{const r=Math.max(0,Math.min(1,(shown-k*(1-span)/(n-1))/span));p.style.setProperty('--r',r.toFixed(4));if(r>0)active=k;});
  $('drafting-step').textContent=entry.layers.find(l=>l.id===entry.drawOrder[active]).step;
  $('drafting-pct').textContent=Math.round((ready?1:goal)*100);
  if(shown>=.999&&ready)return done();
  requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
 return {report,complete(){ready=true;},cancel(){cancelled=true;},finished};
}

async function enter(id,{instant=false}={}){
 const entry=findEntry(id);if(!entry||state!=='home')return;
 state='entering';current=entry;
 if(location.hash!==`#/${id}`)history.pushState({room:id},'',`#/${id}`);
 const idx=slots.findIndex(e=>e?.id===id);
 const animate=!instant&&!reduced&&idx>=0;
 const travel=idx>=0&&(idx!==active||Math.abs(target-pos)>.01);
 if(idx>=0)goToRecord(idx,{instant:!animate});
 openSlot=activeEl();
 if(animate){
  if(scrollY>4){scrollTo({top:0,behavior:'smooth'});for(let i=0;i<60&&scrollY>2;i++)await wait(16);}
  if(travel)await wait(750);
  // Open the cover along its thread binding, then dive into the drawn spread.
  html.classList.add('is-entering');openSlot.classList.add('is-open');
  await wait(1250);
  openSlot.classList.add('is-diving');
  await wait(700);
 }
 if(!stage||stageFor!==entry.id){
  // One building's model lives in GPU memory at a time; switching releases the previous one.
  if(stage){stage.dispose();drawing?.cancel();}
  resetRoom();buildRoom(entry);
  drawing=draft(entry);stageFor=entry.id;revealed=false;
  stage=createStage($('stage'),entry,{reduced,
   onSelect:id=>paintSelected(id),
   onLost:()=>fail('3D 화면 연결이 끊겼습니다. 다시 시도해 주세요.')});
  if(/[?&]debug\b/.test(location.search))globalThis.__bandajiStage=stage;
  paintSelected(stage.selected);
  // Loading continues even if the visitor steps back out mid-drawing.
  stageLoad=stage.load(drawing.report).then(()=>drawing.complete());
 }
 const myStage=stage;
 room.classList.toggle('no-fade',!animate);
 room.hidden=false;html.classList.add('room-open');
 await frameTick();
 room.classList.add('is-shown');
 await frameTick();room.classList.remove('no-fade');
 if(!revealed){
  state='drafting';room.classList.add('is-drafting');placePlates(entry);
  try{await stageLoad;}catch(err){if(stage!==myStage)return;console.error(err);fail('3D 모델을 불러오지 못했습니다. WebGL 지원과 네트워크를 확인해 주세요.');return;}
  await drawing.finished;
  if(state!=='drafting'||stage!==myStage)return;
  state='revealing';stage.resume();
  room.classList.add('is-stamped');await wait(900);
  layoutOffset();
  room.classList.add('is-revealing');
  const done=stage.reveal(3600);
  await wait(1500);room.classList.add('is-live');room.classList.remove('is-drafting');
  await done;revealed=true;
 }else{
  stage.resume();layoutOffset();room.classList.add('is-live');
 }
 state='room';stage.focus();
}
function fail(message){
 $('room-error-text').textContent=message;$('room-error').hidden=false;room.classList.add('is-failed');state='room';
}
async function leave(){
 if(state!=='room'&&state!=='drafting')return;state='leaving';
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 room.classList.add('is-closing');room.classList.remove('is-live');
 if(stage?.mode==='live'){
  await stage.conceal(1800);
  placePlates(current);
  document.querySelectorAll('#elevation .plate').forEach(p=>p.style.setProperty('--r','1'));
  room.classList.add('is-illustration');
  await wait(1000);
  revealed=false;
 }
 // Prepare the already-open book behind the opaque room, including deep links.
 if(openSlot){
  openSlot.classList.add('return-ready','is-open','is-diving');
  html.classList.add('is-entering');void openSlot.offsetWidth;
  await frameTick();openSlot.classList.remove('return-ready');await frameTick();
 }
 html.classList.add('is-leaving');scrollTo(0,0);
 html.classList.add('is-returning');
 room.classList.remove('is-shown');
 if(openSlot?.classList.contains('is-diving')){
  openSlot.classList.remove('is-diving');await wait(1500);
  openSlot.classList.remove('is-open');await wait(1250);
 }else await wait(650);
 stage?.pause();room.hidden=true;html.classList.remove('room-open');
 room.classList.remove('is-closing','is-illustration','is-revealing','is-stamped','is-drafting','is-single');
 document.querySelectorAll('.modes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='whole')));
 html.classList.remove('is-entering','is-leaving','is-returning');openSlot?.classList.remove('is-open');state='home';
 $('screens').focus({preventScroll:true,focusVisible:false});
}

/* ───────── routing ───────── */
function route({instant}={}){
 const id=/^#\/([\w-]+)/.exec(location.hash)?.[1];
 if(id&&findEntry(id)){if(state==='home')enter(id,{instant});}
 else if(state==='room'||state==='drafting')leave();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-enter]');if(b){e.preventDefault();enter(b.dataset.enter);}});
addEventListener('popstate',()=>route({instant:true}));

if('scrollRestoration' in history)history.scrollRestoration='manual';
renderGallery();introAt=performance.now();kick();renderLedger();bindGallery();bindRoomUI();
setTimeout(()=>html.classList.add('is-awake'),60);
route({instant:true});
