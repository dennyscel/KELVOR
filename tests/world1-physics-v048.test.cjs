'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const C=require('../patches/120-world1-content-v048.js');
const P=require('../patches/121-world1-physics-v048.js');
const action=(x=0,y=0,pressed={},held={})=>({x,y,pressed,held});
const frames=(w,n,input=action())=>{for(let i=0;i<n;i++)w.step(1/120,typeof input==='function'?input(i):input);};
const close=(a,b,epsilon=.001)=>assert.ok(Math.abs(a-b)<=epsilon,`${a} ~= ${b}`);
function lab(surfaces=[{id:'floor',x:0,y:900,w:4000,h:600,kind:'ground',oneWay:false}],entities=[],vines=[]){
  const def=C.getLevel('W01_L01');Object.assign(def,{width:4000,spawn:{x:180,y:900},goal:{x:3900,y:900},surfaces,entities,vines,requiredBells:0});return new P.World(def);
}
// Unit fixtures deliberately position an actor to isolate one contact; the campaign runs below never do.
function pose(w,x,y,other={}){Object.assign(w.player,{x,y,vx:0,vy:0,grounded:false,coyote:0,surface:null,climbing:null,buffer:0,...other});}

test('feet settle exactly on visible floor and remain there for 30 seconds without drift',()=>{
  const w=lab();pose(w,500,400);frames(w,3600);close(w.player.y,900);close(w.player.vy,0);assert.equal(w.player.grounded,true);assert.equal(w.player.surface,'floor');assert.equal(w.deaths,0);
});

test('solid side collision stops the body from both directions and a head strike stops ascent',()=>{
  const base={id:'floor',x:0,y:900,w:4000,h:600,kind:'ground',oneWay:false};
  const wall={id:'wall',x:400,y:760,w:100,h:140,kind:'stone',oneWay:false};let w=lab([base,wall]);pose(w,250,900,{grounded:true});frames(w,120,action(1));close(w.player.x,383);close(w.player.y,900);
  pose(w,660,900,{grounded:true});frames(w,120,action(-1));close(w.player.x,517);
  w=lab([base,{id:'ceiling',x:100,y:700,w:250,h:30,kind:'stone',oneWay:false}]);let minimum=900;w.step(1/120,action(0,0,{jump:true},{jump:true}));for(let i=0;i<120;i++){w.step(1/120,action(0,0,{}, {jump:true}));minimum=Math.min(minimum,w.player.y);}assert.ok(minimum>=794-.001,'head cannot enter ceiling');assert.ok(minimum<805,'jump actually reached ceiling');
});

test('one-way platform permits upward passage and lands on its exact top',()=>{
  const w=lab([{id:'floor',x:0,y:900,w:4000,h:600,kind:'ground',oneWay:false},{id:'ledge',x:100,y:830,w:220,h:22,kind:'branch',oneWay:true}]);
  w.step(1/120,action(0,0,{jump:true},{jump:true}));let minimum=900;for(let i=0;i<140;i++){w.step(1/120,action(0,0,{}, {jump:true}));minimum=Math.min(minimum,w.player.y);}assert.ok(minimum<820);close(w.player.y,830);assert.equal(w.player.surface,'ledge');
});

test('analogue amplitude gives proportional stable speed and reversal brakes through zero',()=>{
  const a=lab(),b=lab();frames(a,120,action(.25));frames(b,120,action(1));close(a.player.vx,P.T.run*.25);close(b.player.vx,P.T.run);assert.ok(b.player.x-a.player.x>120);
  const previous=b.player.vx;b.step(1/120,action(-1));assert.ok(b.player.vx>0&&b.player.vx<previous);frames(b,120,action(-1));close(b.player.vx,-P.T.run);frames(b,30);close(b.player.vx,0);
});

test('coyote jump works after walking off a real edge; double jump is available only once in air',()=>{
  const w=lab([{id:'edge',x:0,y:900,w:400,h:600,kind:'ground',oneWay:false},{id:'far',x:540,y:900,w:3460,h:600,kind:'ground',oneWay:false}]);
  frames(w,40,action(1));while(w.player.grounded&&w.time<4)w.step(1/120,action(1));assert.equal(w.player.grounded,false);assert.ok(w.player.coyote>0);w.drainEvents();w.step(1/120,action(1,0,{jump:true},{jump:true}));assert.ok(w.drainEvents().some(e=>e.type==='jump'));assert.ok(w.player.vy<-500);
  frames(w,12,action(0,0,{}, {jump:true}));w.step(1/120,action(0,0,{jump:true},{jump:true}));assert.ok(w.drainEvents().some(e=>e.type==='doubleJump'));assert.equal(w.player.jumps,0);const vy=w.player.vy;w.step(1/120,action(0,0,{jump:true},{jump:true}));assert.ok(w.player.vy>vy);assert.equal(w.drainEvents().filter(e=>e.type==='doubleJump').length,0);
});

test('buffered press during descent produces a jump at landing even with double jump spent',()=>{
  const w=lab();pose(w,500,885,{vy:400,jumps:0});w.step(1/120,action(0,0,{jump:true},{jump:true}));frames(w,10,action(0,0,{}, {jump:true}));assert.ok(w.player.y<880);assert.ok(w.player.vy<0);assert.ok(w.drainEvents().some(e=>e.type==='jump'));
});

test('jump release shortens ascent and dash obeys duration and cooldown',()=>{
  const held=lab(),cut=lab();for(const w of [held,cut])w.step(1/120,action(0,0,{jump:true},{jump:true}));let heldMin=900,cutMin=900;
  for(let i=0;i<100;i++){held.step(1/120,action(0,0,{}, {jump:true}));cut.step(1/120);heldMin=Math.min(heldMin,held.player.y);cutMin=Math.min(cutMin,cut.player.y);}assert.ok(heldMin<cutMin-25);
  const w=lab();w.step(1/120,action(1,0,{dash:true}));assert.equal(w.player.vx,P.T.dashSpeed);frames(w,5,action(1,0,{dash:true}));assert.equal(w.drainEvents().filter(e=>e.type==='dash').length,1);frames(w,40,action(1));assert.equal(w.player.dash,0);assert.ok(w.player.dashCooldown>0);
});

test('vine climbs from its grounded base to the anchored platform and permits a jump release',()=>{
  const w=lab([{id:'floor',x:0,y:900,w:4000,h:600,kind:'ground',oneWay:false},{id:'top',x:430,y:410,w:140,h:22,kind:'branch',oneWay:true}],[],[{id:'vine',x:500,top:410,bottom:900,anchorSurfaceId:'top'}]);
  pose(w,500,900,{grounded:true});frames(w,480,action(0,-1));close(w.player.y,410);assert.equal(w.player.climbing,'vine');w.step(1/120,action(.5,0,{jump:true},{jump:true}));assert.equal(w.player.climbing,null);assert.ok(w.player.vy<0);assert.ok(w.player.y<410);
});

test('moving platforms carry a resting actor vertically and horizontally without foot separation',()=>{
  for(const axis of ['x','y']){const w=lab([{id:'floor',x:0,y:900,w:4000,h:600,kind:'ground',oneWay:false},{id:'moving',x:420,y:750,w:180,h:22,kind:'bridge',oneWay:true,move:{axis,range:25,speed:.7,phase:0}}]);pose(w,500,750,{grounded:true,surface:'moving'});const offset=80;
    for(let i=0;i<1200;i++){w.step(1/120);const s=w.surfaces[1];close(w.player.y,s.y);if(axis==='x')close(w.player.x,s.x+offset);assert.equal(w.player.surface,'moving');}
  }
});

test('fallen branches slow the runner without removing a heart; attacks break a nearby crate once',()=>{
  const w=lab(undefined,[{id:'branch',type:'branch',x:310,y:900},{id:'crate',type:'crate',x:500,y:900}]);frames(w,90,action(1));assert.equal(w.player.hearts,3);assert.ok(w.drainEvents().some(e=>e.type==='trip'));pose(w,450,900,{grounded:true,facing:1});w.step(1/120,action(0,0,{attack:true}));assert.equal(w.entities[1].alive,false);assert.equal(w.player.coins,3);frames(w,60,action(0,0,{attack:true}));assert.equal(w.player.coins,3);
});

test('door requires its key locally, becomes non-solid after opening and never remotely gates a valid exit',()=>{
  const w=lab(undefined,[{id:'door',type:'door',x:500,y:900,keyId:'forest'},{id:'key',type:'key',x:700,y:856,keyId:'forest'}]);pose(w,445,900,{grounded:true});w.step(1/120,action(0,0,{interact:true}));assert.equal(w.entities[0].open,0);assert.ok(w.dynamicSolids().some(s=>s.id==='door'));
  pose(w,700,900,{grounded:true});w.step(1/120);assert.ok(w.keys.has('forest'));pose(w,445,900,{grounded:true});w.step(1/120,action(0,0,{interact:true}));frames(w,120);assert.ok(w.entities[0].open>=.8);assert.ok(!w.dynamicSolids().some(s=>s.id==='door'));
  const shortcut=lab(undefined,[{id:'locked',type:'door',x:500,y:900,keyId:'missing'}]);pose(shortcut,shortcut.def.goal.x,900,{grounded:true});shortcut.step(1/120);assert.equal(shortcut.status,'celebrating');assert.equal(shortcut.entities[0].open,0);
});

test('a checkpoint respawn preserves a collected key and opened door so an earlier gate cannot softlock return',()=>{
  const w=lab(undefined,[{id:'key',type:'key',x:250,y:856,keyId:'test'},{id:'door',type:'door',x:500,y:900,keyId:'test'},{id:'checkpoint',type:'checkpoint',x:800,y:900}]);pose(w,250,900,{grounded:true});w.step(1/120);pose(w,445,900,{grounded:true});w.step(1/120,action(0,0,{interact:true}));frames(w,120);pose(w,800,900,{grounded:true});w.step(1/120);pose(w,1100,1600);w.step(1/120);assert.equal(w.deaths,1);close(w.player.x,800);close(w.player.y,900);assert.ok(w.keys.has('test'));assert.ok(w.entities.find(e=>e.id==='door').open>=.8);assert.equal(w.entities.find(e=>e.id==='key').alive,false);
});

test('bonus uses authored count and duration and retains independent completion IDs',()=>{
  for(const id of ['W01_L01','W01_L03','W01_SECRET']){const w=new P.World(C.getLevel(id));const e=w.entities.find(e=>e.type==='bonus');pose(w,e.x,e.y,{grounded:true});w.step(1/120,action(0,0,{interact:true}));assert.equal(w.bonus.id,e.bonusId);assert.equal(w.bonus.targets.length,e.target,id+' target');assert.ok(Math.abs(w.bonus.time-e.durationMs/1000)<.02,id+' duration');
    for(const target of w.bonus.targets){pose(w,target.x,target.y+34,{grounded:true});w.step(1/120);}assert.ok(w.bonusIds.has(e.bonusId));assert.ok(w.drainEvents().some(event=>event.type==='bonusComplete'&&event.bonusId===e.bonusId));assert.equal(w.bonus,null);
  }
});

test('optional Guardian remains dormant indefinitely and directed portal contact completes only once while alive',()=>{
  const w=new P.World(C.getLevel('W01_BOSS'));frames(w,7200);assert.equal(w.boss.state,'idle');assert.equal(w.boss.hp,12);assert.equal(w.projectiles.length,0);
  pose(w,w.def.goal.x,900,{grounded:true});w.step(1/120);assert.equal(w.status,'celebrating');assert.equal(w.boss.defeated,false);frames(w,100);assert.equal(w.drainEvents().filter(e=>e.type==='complete').length,1);
});

test('spore and seed projectiles stop at visible walls, crates and closed doors before hitting the hero',()=>{
  for(const kind of ['spore','seed'])for(const barrier of ['stone','crate','door']){
    const surfaces=[{id:'floor',x:0,y:900,w:4000,h:600,kind:'ground',oneWay:false}];
    if(barrier==='stone')surfaces.push({id:'wall',x:400,y:720,w:100,h:180,kind:'stone',oneWay:false});
    const entities=barrier==='stone'?[]:[{id:'barrier',type:barrier,x:450,y:900,keyId:'absent'}];
    const w=lab(surfaces,entities);pose(w,700,900,{grounded:true});w.projectiles.push({x:200,y:860,vx:155,vy:0,r:7,life:4,kind});frames(w,450);assert.equal(w.player.hearts,3,kind+' through '+barrier);assert.equal(w.projectiles.length,0);assert.ok(!w.drainEvents().some(e=>e.type==='hurt'));
  }
  const open=lab();pose(open,700,900,{grounded:true});open.projectiles.push({x:200,y:860,vx:155,vy:0,r:7,life:4,kind:'spore'});frames(open,450);assert.equal(open.player.hearts,2,'unobstructed projectile remains dangerous');
});

const naturalReports=[];
function naturalRun(id){
  const w=new P.World(C.getLevel(id)),p=w.player;let jumpUntil=0,nextJump=0,nextAttack=0,nextInteract=0,stuckSince=0,lastProgress=p.x,recoveries=0,damage=0,completes=0;const samples=[];
  const limit=w.def.width/P.T.run*2.8+80,dt=1/60;
  while(w.status==='playing'&&w.time<limit){
    const pressed={},held={};let x=1;
    if(p.x>lastProgress+12){lastProgress=p.x;stuckSince=w.time;}
    const physical=w.surfaces.filter(s=>!s.oneWay&&s.kind!=='ground').concat(w.dynamicSolids());
    const obstacle=physical.filter(s=>s.x>=p.x-17&&s.x-p.x<90&&s.y<p.y-8&&s.y+s.h>p.y-64).sort((a,b)=>a.x-b.x)[0];
    const floor=w.surfaces.find(s=>s.kind==='ground'&&p.x>=s.x&&p.x<=s.x+s.w);
    const edge=floor&&floor.x+floor.w<w.def.width&&floor.x+floor.w-p.x<100;
    const enemy=w.entities.find(e=>e.alive&&e.type==='enemy'&&e.x-p.x>0&&e.x-p.x<100&&Math.abs(e.y-p.y)<150);
    const door=w.entities.find(e=>e.alive&&e.type==='door'&&e.open<.8&&e.x-p.x>0&&e.x-p.x<75);
    if(door&&w.keys.has(door.keyId)){x=0;if(w.time>=nextInteract){pressed.interact=true;nextInteract=w.time+.25;}}
    const crate=w.entities.find(e=>e.alive&&e.type==='crate'&&e.x-p.x>0&&e.x-p.x<85);
    if((crate||enemy)&&w.time>=nextAttack){pressed.attack=true;nextAttack=w.time+.38;}
    if(p.grounded&&!door&&!crate&&(edge||obstacle||enemy)&&w.time>=nextJump){pressed.jump=true;jumpUntil=w.time+.42;nextJump=w.time+.3;}
    const beneath=w.surfaces.some(s=>s.kind==='ground'&&p.x>=s.x&&p.x<=s.x+s.w);
    if(!p.grounded&&!beneath&&p.vy>-40&&p.jumps>0&&w.time>=nextJump){pressed.jump=true;jumpUntil=w.time+.42;nextJump=w.time+.3;}
    if(w.time-stuckSince>2&&w.time>=nextJump){pressed.jump=true;pressed.attack=true;jumpUntil=w.time+.45;nextJump=w.time+.45;stuckSince=w.time;recoveries++;}
    held.jump=w.time<jumpUntil;w.step(dt,action(x,0,pressed,held));
    for(const e of w.drainEvents()){if(e.type==='hurt')damage++;if(e.type==='complete')completes++;if(e.type==='respawn')samples.push({time:+w.time.toFixed(2),x:p.x,event:'respawn',reason:e.reason});}
  }
  const r={id,status:w.status,authoredWidth:w.def.width,goalX:w.def.goal.x,finalX:+p.x.toFixed(2),maximumX:+w.distance.toFixed(2),simulatedSeconds:+w.time.toFixed(2),deaths:w.deaths,damageEvents:damage,recoveryInputs:recoveries,completeEvents:completes,coins:p.coins,keys:[...w.keys],guardianDefeated:w.boss?.defeated??null,teleports:0,checkpoints:w.entities.filter(e=>e.type==='checkpoint'&&e.active).length,trace:samples.slice(-15)};
  naturalReports.push(r);return r;
}
for(const id of Object.keys(C.levels))test('natural ground-route simulation completes '+id+' using only walking/jumping/attacking/local door input',()=>{const r=naturalRun(id);assert.equal(r.status,'celebrating',JSON.stringify(r));assert.equal(r.completeEvents,1);assert.ok(r.finalX>=r.goalX-65);assert.equal(r.teleports,0);});

test.after(()=>{
  if(!process.env.KELVOR_WRITE_SIM_REPORT)return;
  const file=path.resolve(process.env.KELVOR_WRITE_SIM_REPORT);fs.mkdirSync(path.dirname(file),{recursive:true});
  const sha=name=>crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../patches',name))).digest('hex');
  fs.writeFileSync(file,JSON.stringify({method:'Actual World.step simulation; start at each authored spawn; input only; no position edits in campaign runs. Directed contact tests use explicitly positioned unit fixtures.',contentSHA256:sha('120-world1-content-v048.js'),physicsSHA256:sha('121-world1-physics-v048.js'),dt:1/60,levels:naturalReports},null,2)+'\n');
});
