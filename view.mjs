const T=globalThis.THREE; T.ColorManagement.legacyMode=false;
export class SkyWorld{
 constructor(canvas){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  this.renderer.outputEncoding=T.sRGBEncoding;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.0;
  this.scene=new T.Scene();this.scene.background=new T.Color(0x09b9f2);
  this.scene.fog=new T.Fog(0x94e6f7,190,410);
  this.camera=new T.PerspectiveCamera(52,1,.1,550);
  this.scene.add(new T.HemisphereLight(0xffffff,0x52814f,.85));
  const sun=new T.DirectionalLight(0xfff2c5,1.2);sun.position.set(-35,90,25);this.scene.add(sun);
  this.boxGeometry=new T.BoxGeometry();this.materials=new Map();
  this.makeGround();this.makeAirport();
  this.player=this.person(0xff8b18);this.scene.add(this.player);
  this.player.scale.setScalar(1.05);
  this.canopy=new T.Group();this.player.add(this.canopy);
  for(let i=0;i<9;i++){
   const mesh=this.box(.5,.18,1.5,[0xff5339,0xffe949,0xff5339][i%3],(i-4)*.46,3.9-Math.abs(i-4)*.12,0,this.canopy);
   mesh.rotation.z=-(i-4)*.075;
  }
  for(const side of [-1,1])for(const z of [-.58,.58]){
   const line=this.box(.018,3.1,.018,0xe9f8ff,side*.98,2.2,z*.7,this.canopy);
   line.rotation.z=side*.29;
  }
  this.canopy.visible=false;
  this.rivals=[-1,1].map((side,i)=>{const p=this.person(i?0xf64783:0x754aff);this.scene.add(p);return p});
  this.ringGroup=new T.Group();this.scene.add(this.ringGroup);
  this.makeStory();
  this.particles=[];
  const geo=new T.BoxGeometry(.10,.10,.22),mat=new T.MeshBasicMaterial({color:0xffed47});
  for(let i=0;i<34;i++){const m=new T.Mesh(geo,mat);m.visible=false;this.scene.add(m);this.particles.push(m)}
  this.pulse=0;this.resize(canvas);new ResizeObserver(()=>this.resize(canvas)).observe(canvas);
 }
 material(color){if(!this.materials.has(color))this.materials.set(color,new T.MeshStandardMaterial({color,roughness:.7}));return this.materials.get(color)}
 box(w,h,d,color,x,y,z,parent=this.scene){
  const mesh=new T.Mesh(this.boxGeometry,this.material(color));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
 }
 group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 person(accent){
  const root=new T.Group(),skin=0xe8b28b;
  this.box(.68,.77,.42,0xf4f9ef,0,1.10,0,root);
  for(let i=0;i<4;i++)this.box(.69,.057,.435,0x164f7c,0,.83+i*.17,0,root);
  this.box(.70,.23,.45,0x174564,0,.63,0,root);
  this.box(.29,.12,.29,skin,0,1.57,0,root);
  this.box(.48,.47,.44,skin,0,1.87,0,root);
  this.box(.51,.14,.47,0x674027,0,2.12,0,root);
  this.box(.20,.10,.36,0x80502d,-.13,2.22,-.03,root);
  this.box(.10,.21,.12,0x674027,-.19,2.0,-.18,root);
  this.box(.51,.14,.035,0x12394c,0,1.91,.24,root);
  for(const x of [-.13,.13]){
   this.box(.18,.105,.035,0x2bd0ef,x,1.92,.264,root);
   this.box(.06,.027,.01,0xb7f9ff,x-.04,1.95,.285,root);
  }
  this.box(.10,.035,.03,0x995544,0,1.73,.23,root);
  const pack=this.box(.58,.66,.23,accent,0,1.11,-.32,root);
  this.box(.40,.42,.025,0x233d4b,0,1.11,-.45,root);
  for(const x of [-.23,.23])this.box(.06,.69,.025,0x313d43,x,1.12,.23,root);
  const limbs=[];
  for(const side of [-1,1]){
   const arm=this.group(root,side*.44,1.40,0);arm.rotation.z=-side*.95;
   this.box(.22,.32,.24,0xf5f9f4,0,-.13,0,arm);
   const fore=this.group(arm,0,-.29,0);fore.rotation.x=-.35;
   this.box(.19,.32,.20,skin,0,-.14,0,fore);
   this.box(.20,.11,.21,0xffffff,0,-.30,0,fore);
   for(let i=0;i<3;i++)this.box(.044,.10,.05,skin,-.06+i*.06,-.37,.02,fore);
   const leg=this.group(root,side*.19,.55,0);
   this.box(.26,.35,.27,0x134d73,0,-.15,0,leg);
   this.box(.22,.28,.23,skin,0,-.43,0,leg);
   this.box(.26,.15,.39,0xf4f8ee,0,-.61,.06,leg);
   this.box(.27,.04,.40,0x183443,0,-.70,.06,leg);
   limbs.push({arm,fore,leg,side});
  }
  root.userData={limbs,pack};return root;
 }
 makeGround(){
  this.box(280,.4,280,0x2dbdf0,0,-.9,0);
  this.box(125,.7,160,0x78e346,0,-.35,0);
  this.box(131,.18,165,0xffe897,0,-.7,0);
  // City blocks use instancing so distant detail remains inexpensive.
  const buildings=new T.InstancedMesh(this.boxGeometry,this.material(0xffffff),196);
  const dummy=new T.Object3D();
  for(let i=0;i<196;i++){
   const col=i%14,row=Math.floor(i/14),x=(col-6.5)*7.2,z=-(row*7.2+10);
   const h=1.6+((i*31)%11)*.7;
   dummy.position.set(x,h/2,z);dummy.scale.set(2.1+(i%3)*.4,h,2.5);dummy.updateMatrix();
   buildings.setMatrixAt(i,dummy.matrix);buildings.setColorAt(i,new T.Color([0xffffef,0x49d8ed,0xffa754,0x91dffd][i%4]));
  }
  this.scene.add(buildings);
  for(let i=-6;i<=6;i++)this.box(1.5,.04,115,0x405875,i*7.2,.02,-55);
  for(let i=0;i<14;i++)this.box(110,.05,1.5,0x405875,0,.03,-10-i*7.2);
  for(let i=0;i<35;i++){
   const x=Math.sin(i*7)*48,z=10+(i%7)*7;
   this.box(.22,1.4,.22,0x9b623a,x,.7,z);
   this.box(1.9,1.8,1.9,0x2dc66c,x,2,z);
  }
  const target=new T.Group();this.scene.add(target);
  for(const [radius,color] of [[5.2,0xffffff],[3.8,0xff4e4b],[2.5,0xffffff],[1.2,0xff4e4b]]){
   const m=new T.Mesh(new T.CircleGeometry(radius,48),new T.MeshStandardMaterial({color}));
   m.rotation.x=-Math.PI/2;m.position.y=.10+(5.2-radius)*.006;target.add(m);
  }
  for(const x of [-7,7]){
   this.box(.10,3,.10,0xffffff,x,1.5,0);
   const flag=this.box(1.4,.7,.04,0xffdc2a,x+.65,2.6,0);
   flag.rotation.y=.1;
  }
  this.clouds=[];
  for(let i=0;i<22;i++){
   const g=this.group(this.scene,Math.sin(i*2.1)*40,35+(i%8)*12,Math.cos(i*2.1)*36);
   for(let j=0;j<3;j++){
    const m=new T.Mesh(new T.IcosahedronGeometry(2.5+j*.5,1),this.material(0xffffff));
    m.position.set(j*2.3,Math.sin(j)*.7,0);m.scale.y=.6;g.add(m);
   }
   this.clouds.push(g);
  }
 }
 makeAirport(){
  this.airport=this.group(this.scene,0,0,33);
  this.box(11,.05,65,0x304c66,19,.10,-10,this.airport);
  for(let i=0;i<17;i++)this.box(.25,.01,1.8,0xffffff,19,.14,i*3.8-38,this.airport);
  this.box(12,4,9,0xffffff,-13,2,0,this.airport);
  this.box(12,.6,9.3,0x04b5cf,-13,4.1,0,this.airport);
  for(let i=0;i<6;i++)this.box(1.3,1.5,.05,0x39cdea,-18+i*2,2.5,4.53,this.airport);
  this.box(2.6,9,2.6,0xf2f9ed,-22,4.5,-8,this.airport);
  this.box(4,2,4,0x15adcc,-22,9.4,-8,this.airport);
  this.box(4.3,.3,4.3,0xffffff,-22,10.6,-8,this.airport);
  this.plane=this.group(this.airport,0,2,0);
  this.box(1.9,1.6,7.8,0xffffff,0,0,0,this.plane);
  this.box(2.0,.28,7.8,0x04acc5,0,-.35,0,this.plane);
  this.box(10,.18,1.65,0xfff8dc,0,-.2,.25,this.plane);
  this.box(4,.13,1.1,0xf4f9ef,0,.65,-3.6,this.plane);
  this.box(.13,1.8,1.8,0xff7b23,0,1.4,-3.4,this.plane);
  for(let i=0;i<4;i++)for(const side of [-1,1])this.box(.035,.45,.65,0x0aaac6,side*.966,.22,-2+i*1.3,this.plane);
  this.box(1.5,.55,.08,0x164c69,0,.4,3.94,this.plane);
  for(const x of [-.7,.7])for(const z of [-2.2,2.2])this.box(.3,.6,.5,0x263744,x,-1,z,this.plane);
  this.propeller=this.box(2.8,.16,.12,0x21415b,0,0,4.25,this.plane);
  this.queue=[];
  for(let i=0;i<4;i++){const p=this.person([0xff9225,0xf353a9,0x5f61ee,0x13c6bb][i]);p.scale.setScalar(.65);p.position.set(-2.3,0,3+i*1.3);p.rotation.y=Math.PI;this.airport.add(p);this.queue.push(p)}
 }
 makeStory(){
  this.gull=this.group(this.scene);
  this.box(.34,.29,.72,0xffffff,0,0,0,this.gull);
  this.box(.31,.29,.31,0xffffff,0,.20,.30,this.gull);
  this.box(.14,.09,.27,0xffb824,0,.17,.53,this.gull);
  for(const x of [-.16,.16])this.box(.036,.055,.06,0x143744,x,.25,.38,this.gull);
  this.wings=[-1,1].map(side=>{
   const wing=this.group(this.gull,side*.15,.02,-.06);
   this.box(.66,.07,.35,0xffffff,side*.32,0,0,wing);
   this.box(.25,.07,.32,0x31495b,side*.76,0,-.04,wing);
   return wing;
  });
  this.lunch=this.sandwich(this.gull);
  this.lunch.position.set(0,-.28,.22);this.lunch.scale.setScalar(.7);
  this.picnic=this.group(this.scene);
  this.box(3.3,.04,2.3,0xff6c49,0,.04,0,this.picnic);
  for(let i=-2;i<=2;i++)this.box(.2,.01,2.3,0xffe5b4,i*.6,.07,0,this.picnic);
  this.box(.67,.62,.59,0xffbf30,-1,.4,-.5,this.picnic);
  this.box(.73,.1,.65,0xffe472,-1,.75,-.5,this.picnic);
  this.snacks=[];
  this.heldLunch=this.sandwich(this.scene);
 }
 sandwich(parent){
  const g=this.group(parent);
  for(const [y,h,color] of [[-.10,.13,0xe9a64e],[0,.045,0x44ba43],[.045,.045,0xff6548],[.09,.10,0xffd988]]){
   this.box(.55,h,.40,color,0,y,0,g);
  }
  for(const x of [-.17,0,.17])this.box(.035,.015,.065,0xfff0b5,x,.148,.01,g);
  return g;
 }
 setGates(items){
  for(const snack of this.snacks)this.scene.remove(snack);
  this.snacks=[];
  for(const mesh of [...this.ringGroup.children]){mesh.geometry.dispose();this.ringGroup.remove(mesh)}
  this.snacks=items.slice(0,3).map(()=>{const snack=this.sandwich(this.scene);snack.scale.setScalar(1.8);return snack});
  this.gateMeshes=items.map(g=>{
   const mesh=new T.Mesh(new T.TorusGeometry(g.radius,.14,7,40),this.material(0xffd82b));
   mesh.rotation.x=Math.PI/2;mesh.position.set(g.x,g.y,g.z);
   this.ringGroup.add(mesh);return mesh;
  });
 }
 story(run,time){
  const intro=run.phase==='intro', finish=['landed','result'].includes(run.phase);
  this.heldLunch.visible=intro&&run.intro<2.1||finish&&run.snacks>=3;
  if(intro)this.heldLunch.position.set(-2.3,1.12,36.4);
  else this.heldLunch.position.set(run.x,1.25,run.z+.75);
  this.picnic.visible=finish;
  this.picnic.position.set(run.x,.13,run.z);
  this.gull.visible=intro||run.phase==='dive'||finish;
  this.wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*Math.sin(time*17)*.65);
  this.lunch.visible=true;
  if(intro){
   const t=run.intro;
   const swoop=Math.max(0,Math.min(1,(t-1.5)/1.5));
   this.gull.position.set(-2.3+swoop*3.5,1.75+Math.sin(swoop*Math.PI)*.5+Math.max(0,t-3)*1.8,36.2-swoop*1.5);
   this.gull.rotation.y=t<3?Math.PI/2:0;
   this.lunch.visible=t>=2.1;
   this.queue.forEach((person,i)=>{
    const shock=t>2.1?Math.sin(Math.min(1,(t-2.1)*3)*Math.PI)*.35:0;
    person.position.y=shock*(i? .5:1);
    person.userData.limbs.forEach(({arm,side})=>arm.rotation.z=side*(t>2.1?-2.4:-.38));
   });
  }else if(finish){
   this.gull.position.set(run.x+1.4,1.25+Math.abs(Math.sin(time*4))*.17,run.z+.1);
   this.gull.rotation.y=-.8;
   this.lunch.visible=run.snacks<3;
   this.wings.forEach(wing=>wing.rotation.z=0);
  }else{
   this.gull.position.set(run.x+2.8+Math.sin(time)*.5,run.y-2,run.z-2.7);
   this.gull.rotation.y=Math.PI;
  }
  this.snacks.forEach((snack,i)=>{
   snack.visible=!run.gates[i].passed;
   snack.position.set(run.gates[i].x,run.gates[i].y+1,run.gates[i].z);
   snack.rotation.y=time*1.5;
  });
 }
 burst(position){this.pulse=1;this.burstPosition=position.clone()}
 resize(canvas){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
 }
 draw(run,dt,time){
  this.story(run,time);
  this.pulse=Math.max(0,this.pulse-dt*2.2);
  this.propeller.rotation.z=time*45;
  if(run.phase==='dive'&&this.previousPhase!=='dive')this.camera.position.set(run.x+5,run.y+11,run.z+9);
  this.previousPhase=run.phase;
  const intro=run.phase==='intro', idle=run.phase==='menu';
  this.airport.visible=intro||idle;
  this.player.visible=!intro&&!idle;
  this.canopy.visible=run.phase==='chute'||run.phase==='landed'||run.phase==='result';
  const p=this.player;
  p.position.set(run.x,run.y,run.z);
  p.userData.pack.material=this.material(run.gold?0xffd833:0xff8b18);
  const falling=run.phase==='dive';
  p.rotation.set(falling?-1.25:0,Math.PI,falling?-run.tilt*.40:0);
  for(const {arm,fore,leg,side} of p.userData.limbs){
   arm.rotation.z=side*(falling?-1.2:run.phase==='result'?(run.snacks>=3?-2.5:-.65):-.38);
   fore.rotation.x=falling?-.45:-1;
   leg.rotation.x=falling?.20+Math.sin(time*7+side)*.10:0;
  }
  this.canopy.rotation.z=-run.tilt*.08;
  for(let i=0;i<this.rivals.length;i++){
   const rival=this.rivals[i];
   rival.visible=falling;
   rival.position.set(run.x+(i?4:-4)+Math.sin(time+i),run.y+(i?2:-1),run.z-3);
   rival.rotation.set(-1.2,Math.PI,Math.sin(time+i)*.2);rival.scale.setScalar(.66);
  }
  this.gateMeshes?.forEach((m,i)=>{m.visible=!run.gates[i].passed;m.rotation.z=time*.2;});
  this.particles.forEach((m,i)=>{
   m.visible=this.pulse>0&&!!this.burstPosition;
   if(m.visible){const age=1-this.pulse;m.position.copy(this.burstPosition);m.position.x+=Math.sin(i*4.3)*age*4;m.position.z+=Math.cos(i*4.3)*age*4;m.position.y+=age*(i%3-1)*3;m.rotation.x=time+i;}
  });
  if(idle){
   this.camera.position.set(15,13,58);this.camera.lookAt(-3,1.8,31);
  }else if(intro){
   const t=run.intro;
   if(t<1.5){
    this.camera.position.set(8-t*3,6,46);this.camera.lookAt(-2,1.8,36);
   }else if(t<3.3){
    this.camera.position.set(.6,3.0,40.8);this.camera.lookAt(-1.3,1.7,36);
   }else{
    this.camera.position.set(3.6,5.0,41);this.camera.lookAt(this.gull.position);
   }
  }else{
   const chute=this.canopy.visible;
   const target=new T.Vector3(run.x+(chute?8:5),run.y+(chute?9:11),run.z+(chute?13:9));
   this.camera.position.lerp(target,1-Math.exp(-dt*4));
   this.camera.lookAt(run.x,run.y+(chute?1.6:-3),run.z-1.3);
   const fov=falling?58+this.pulse*5:48;
   this.camera.fov+=(fov-this.camera.fov)*Math.min(1,dt*4);this.camera.updateProjectionMatrix();
  }
  this.renderer.render(this.scene,this.camera);
 }
}

