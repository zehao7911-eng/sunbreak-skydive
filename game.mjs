import {GAME,routes,profile,gates,grade,unlocked} from './core.mjs';
import {SkyWorld} from './view.mjs';
import {BeaconHost} from './sdk.mjs';
import {Music} from './audio.mjs';
const $=id=>document.getElementById(id),key=GAME+'-v1';
let local=null;try{local=JSON.parse(localStorage.getItem(key))}catch{}
let saved=profile(local),level=unlocked(saved.best),world;
const music=new Music();music.enabled=saved.sound;
const run={phase:'menu',x:0,y:132,z:0,tilt:0,gates:[],intro:0};
let hits=0,combo=0,feedbackTime=0,targetX=0,targetZ=0,drag=null,landingDistance=0,ending=0,support={};
const host=new BeaconHost(window,{
 status(s){support=s;social()},
 reward(name){
  if(saved[name])return;
  saved[name]=true;save();social();
  if(name==='gold')world?.player.traverse(o=>{if(o.isMesh&&o.material.color.getHex()===0xff8b18)o.material=world.material(0xffd833)});
 },
 load(data){
  const remote=profile(data);
  saved.best=saved.best.map((n,i)=>Math.max(n,remote.best[i]));
  saved.gold ||= remote.gold;saved.confetti ||= remote.confetti;
  if(run.phase==='menu')level=unlocked(saved.best);
  save();menuRecord();social();
 }
});
function save(){try{localStorage.setItem(key,JSON.stringify(saved))}catch{}host.save(saved)}
function social(){
 const items=[];
 if(support.gold)items.push(saved.gold?'Gold pack unlocked':'Like in GameWave to unlock a gold pack');
 if(support.confetti)items.push(saved.confetti?'Victory sparks unlocked':'Comment in GameWave to unlock victory sparks');
 $('social').textContent=items.join(' · ');$('social').hidden=!items.length;
}
function menuRecord(){$('record').textContent='FLIGHT '+(level+1)+' / '+routes.length+' · '+routes[level].name.toUpperCase()+' · BEST '+saved.best[level]+' / 3 STARS'}
function say(text){$('feedback').textContent=text;feedbackTime=1.5}
function startIntro(){
 music.start();run.phase='intro';run.intro=0;$('panel').hidden=true;$('skip').hidden=false;
}
function startDive(){
 if(run.phase!=='intro')return;
 host.start();run.phase='dive';run.x=0;run.y=132;run.z=0;run.tilt=0;
 targetX=0;targetZ=0;hits=0;combo=0;ending=0;run.gates=gates(level);world.setGates(run.gates);
 $('skip').hidden=true;$('hud').hidden=false;$('steer').hidden=false;$('reticle').hidden=false;
 $('stage').textContent='FREEFALL';$('steer').firstChild.textContent='DRAG TO STEER ';
 $('flight').textContent='FLIGHT '+(level+1);say('LET’S FLY!');music.mode='dive';
}
function result(){
 if(run.phase==='result')return;
 run.phase='result';host.end();music.mode='chute';
 const stars=grade(hits,run.gates.length,landingDistance);
 saved.best[level]=Math.max(saved.best[level],stars);save();
 $('panel').hidden=false;$('steer').hidden=true;$('reticle').hidden=true;
 $('eyebrow').textContent=routes[level].name.toUpperCase()+' / COMPLETE';
 $('title').textContent=stars===3?'Sky-high style!':stars?'Touchdown!':'Another leap?';
 $('description').textContent=hits+' / '+run.gates.length+' rings · '+landingDistance.toFixed(1)+' m from the bullseye'+(stars?' · Next flight unlocked.':' · Catch at least 40% of the rings to progress.');
 $('badges').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
 $('primary').textContent=stars&&level<routes.length-1?'NEXT FLIGHT ↗':'FLY AGAIN ↗';
 $('secondary').hidden=!(stars&&level<routes.length-1);
 $('secondary').textContent='Retry this flight';
 menuRecord();
 if(saved.confetti)world.burst(world.player.position);
}
function replay(next){
 if(next&&saved.best[level]>0&&level<routes.length-1)level++;
 $('hud').hidden=true;$('badges').textContent='';$('secondary').hidden=true;
 startIntro();
}
$('primary').onclick=()=>{if(!world)return;if(run.phase==='menu')startIntro();else if(run.phase==='result')replay(true)};
$('secondary').onclick=()=>{if(run.phase==='result')replay(false)};
$('skip').onclick=startDive;
$('sound').onclick=()=>{music.toggle();saved.sound=music.enabled;$('sound').setAttribute('aria-pressed',String(music.enabled));$('sound').textContent=music.enabled?'♫':'♪';save()};
$('sound').setAttribute('aria-pressed',String(saved.sound));
const canvas=document.querySelector('canvas');
function steer(event){
 if(!drag||drag.id!==event.pointerId)return;
 const rect=canvas.getBoundingClientRect();
 targetX=Math.max(-7,Math.min(7,drag.x+(event.clientX-drag.px)/rect.width*15));
 targetZ=Math.max(-6,Math.min(6,drag.z+(event.clientY-drag.py)/rect.height*17));
}
canvas.addEventListener('pointerdown',event=>{
 if(!['dive','chute'].includes(run.phase))return;
 drag={id:event.pointerId,x:targetX,z:targetZ,px:event.clientX,py:event.clientY};canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove',steer);
canvas.addEventListener('pointerup',event=>{steer(event);drag=null});
canvas.addEventListener('pointercancel',()=>drag=null);
addEventListener('keydown',event=>{
 if(!['dive','chute'].includes(run.phase))return;
 if(event.key==='ArrowLeft')targetX=Math.max(-7,targetX-.6);
 if(event.key==='ArrowRight')targetX=Math.min(7,targetX+.6);
 if(event.key==='ArrowUp')targetZ=Math.max(-6,targetZ-.6);
 if(event.key==='ArrowDown')targetZ=Math.min(6,targetZ+.6);
 if(event.key.startsWith('Arrow'))event.preventDefault();
});
try{world=new SkyWorld(canvas)}catch{$('title').textContent='3D unavailable';$('description').textContent='Please open in a WebGL-enabled browser.';$('primary').disabled=true}
let last=performance.now();
function frame(now){
 const dt=Math.min(.045,(now-last)/1000);last=now;
 if(document.hidden){requestAnimationFrame(frame);return}
 if(run.phase==='intro'){run.intro+=dt;if(run.intro>4.6)startDive()}
 if(['dive','chute'].includes(run.phase)){
  const oldY=run.y;
  run.y=Math.max(.7,run.y-dt*(run.phase==='dive'?5.4:2.5));
  const oldX=run.x;run.x+=(targetX-run.x)*(1-Math.exp(-dt*4.8));run.z+=(targetZ-run.z)*(1-Math.exp(-dt*4.8));
  run.tilt+=(Math.max(-1,Math.min(1,(run.x-oldX)/Math.max(.001,dt)*.2))-run.tilt)*Math.min(1,dt*6);
  for(const gate of run.gates){
   if(!gate.passed&&oldY>=gate.y&&run.y<gate.y){
    gate.passed=true;gate.hit=Math.hypot(run.x-gate.x,run.z-gate.z)<gate.radius;
    if(gate.hit){hits++;combo++;say(combo>1?combo+'× SKY STREAK':'CLEAN PASS!');music.hit(combo);world.burst(world.player.position)}
    else{combo=0;say('NEXT RING AHEAD')}
   }
  }
  if(run.phase==='dive'&&run.y<=24){run.phase='chute';music.mode='chute';say('CHUTE OPEN!');$('stage').textContent='LANDING';$('steer').firstChild.textContent='STEER TO THE RED TARGET '}
  if(run.y<=.7){landingDistance=Math.hypot(run.x,run.z);run.phase='landed';ending=0;say(landingDistance<1.6?'BULLSEYE!':'TOUCHDOWN!')}
  $('altitude').textContent=Math.round(run.y*25)+' FT';$('rings').textContent=hits+' / '+run.gates.length;
  $('progress').value=1-run.y/132;
 }
 if(run.phase==='landed'){ending+=dt;if(ending>1.1)result()}
 if(feedbackTime>0){feedbackTime-=dt;$('feedback').style.opacity=String(Math.min(1,feedbackTime*3))}else $('feedback').style.opacity='0';
 run.gold=saved.gold;world?.draw(run,dt,now/1000);requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();music.context?.suspend().catch(()=>{})}else if(music.enabled&&music.context)music.context.resume().catch(()=>{})});
addEventListener('pagehide',()=>{save();host.stop();music.stop()});
addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
menuRecord();host.poll();requestAnimationFrame(frame);
