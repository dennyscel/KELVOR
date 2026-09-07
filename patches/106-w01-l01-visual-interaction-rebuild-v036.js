(function(P){
'use strict';
// RC39 v036 — W01-L01 visual & interaction rebuild candidate.
// Owner-approved scope: logical key/door ceremony, grounded terrain art, authored ravines,
// meaningful solid props, modest encounter density, contact shadow and visual section polish.
// Locked values preserved: player HP, enemy HP, jump/run physics, pit coordinates, seal counts,
// gate combat counts, checkpoints and completion prerequisites.

const S=P.World01Level01AAAReferenceSceneRC37;
if(typeof S!=='function')return;
const proto=S.prototype,FLOOR=P.FLOOR_TOP;
const KEY_TEX='w01l01_v036_forest_key';
const GROUND_TOP={
  'phase_01_grassland/terrain/001':5,
  'phase_01_grassland/terrain/002':5,
  'phase_01_grassland/terrain/003':6,
  'phase_01_grassland/terrain/004':5,
  'phase_01_grassland/terrain/006':4,
  'phase_01_grassland/terrain/016':5
};
const GATE_CFG={
  GATE_A:{name:'CHAVE DA RAIZ',x:10170,tint:0xffd66e,pedestal:'phase_01_grassland/props/014',hint:'OS GUARDIÕES LIBERARAM A CHAVE'},
  GATE_B:{name:'CHAVE DO ESPÍRITO',x:22215,tint:0x82e9ff,pedestal:'phase_01_grassland/props/028',hint:'O BOSQUE MATERIALIZOU A CHAVE'},
  GATE_C:{name:'CHAVE DO GUARDIÃO',x:34370,tint:0xffe884,pedestal:'phase_01_grassland/props/043',hint:'OS TRÊS SELOS FORJARAM A CHAVE'}
};

function rawAttack(s){
  const r=s.router,pad=s.input.gamepad?.getPad(0);
  return !!(r?.virtual?.attack||r?.keys?.attackX?.isDown||r?.keys?.attackJ?.isDown||pad?.buttons?.[1]?.pressed||pad?.buttons?.[2]?.pressed);
}
function requirementsMet(s,g){return (g.defeated||0)>=(g.required||0)&&(g.id!=='GATE_C'||(s.sealsCollectedRC37||0)>=3);}
function label(s,g,text,alpha=1){const l=g.__ownerLabelV031;if(l?.active)l.setText(text).setAlpha(alpha).setDepth(120);}

const oldPreload=proto.preload;
proto.preload=function(){oldPreload.call(this);if(!this.textures.exists(KEY_TEX))this.load.image(KEY_TEX,'./assets/w01-l02-rc6/forest_key.png');};

proto.addGroundSection=function(start,end,variant){
  this.add.rectangle((start+end)/2,FLOOR+4,end-start,P.GAME_HEIGHT-FLOOR+86,0x75482e,1).setOrigin(.5,0).setDepth(8);
  this.add.rectangle((start+end)/2,FLOOR+1,end-start,7,0x426d2c,.92).setOrigin(.5,0).setDepth(9);
  const list=['phase_01_grassland/terrain/001','phase_01_grassland/terrain/002','phase_01_grassland/terrain/003','phase_01_grassland/terrain/004','phase_01_grassland/terrain/006','phase_01_grassland/terrain/016'];
  let x=start,index=variant*3;const scale=.70;
  while(x<end+15){
    const name=list[(index*5+variant*2)%list.length],fr=this.textures.getFrame(P.PHASE01_TEXTURE,name);if(!fr)break;
    const topPx=GROUND_TOP[name]??5,w=fr.width*scale,bottomY=FLOOR+(fr.height-topPx)*scale;
    const im=this.add.image(x+w/2,bottomY,P.PHASE01_TEXTURE,name).setOrigin(.5,1).setScale(scale).setDepth(10);
    im.__groundSurfaceV036={surfaceY:FLOOR,frame:name,topPx,bottomY};
    if(x+w>end+20)im.setCrop(0,0,Math.max(2,(end-x)/scale),fr.height);
    x+=w-1;index++;
  }
  this.add.rectangle((start+end)/2,FLOOR+1,end-start,2,0x213c20,.38).setOrigin(.5,0).setDepth(11);
  this.addSolid((start+end)/2,FLOOR,end-start,P.GAME_HEIGHT-FLOOR+90);
};

function buildRavines(s){
  s.__ravinesV036=[];
  s.pitRanges.forEach(([a,b],i)=>{
    const w=b-a,cx=(a+b)/2,wide=w>350;
    const back=s.add.rectangle(cx,FLOOR,w,150,wide?0x0a1718:0x0d1c19,.98).setOrigin(.5,0).setDepth(4);
    const mid=s.add.rectangle(cx,FLOOR+30,w,130,wide?0x16322d:0x172c26,.96).setOrigin(.5,0).setDepth(5);
    const deep=s.add.rectangle(cx,FLOOR+82,w,105,0x06100f,.98).setOrigin(.5,0).setDepth(6);
    const mist=s.add.rectangle(cx,FLOOR+18,Math.max(18,w-12),5,0x9fc8b4,.10).setOrigin(.5,0).setDepth(7);
    const rootL=s.add.image(a+10,FLOOR+1,P.PHASE01_TEXTURE,i%2?'phase_01_grassland/terrain/029':'phase_01_grassland/terrain/030').setOrigin(.5,0).setScale(.18).setDepth(7).setAlpha(.58);
    const rootR=s.add.image(b-10,FLOOR+1,P.PHASE01_TEXTURE,i%2?'phase_01_grassland/terrain/030':'phase_01_grassland/terrain/029').setOrigin(.5,0).setScale(.18).setFlipX(true).setDepth(7).setAlpha(.58);
    const rockL=s.add.image(a+12,FLOOR+4,P.PHASE01_TEXTURE,'phase_01_grassland/props/043').setOrigin(.5,1).setScale(.22).setDepth(13).setAlpha(.90);
    const rockR=s.add.image(b-12,FLOOR+4,P.PHASE01_TEXTURE,'phase_01_grassland/props/044').setOrigin(.5,1).setScale(.22).setFlipX(true).setDepth(13).setAlpha(.90);
    if(wide){
      for(let k=0;k<5;k++){const x=a+90+k*(w-180)/4;const pillar=s.add.rectangle(x,FLOOR+42+(k%2)*13,18,120,0x15251f,.72).setOrigin(.5,0).setDepth(6);pillar.setAngle(k%2?4:-4);}
      s.add.text(cx,FLOOR+54,'ANTIGA RAVINA',{fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#9eb3a1'}).setOrigin(.5).setDepth(7).setAlpha(.30);
    }
    s.__ravinesV036.push({i,a,b,width:w,back,mid,deep,mist,rootL,rootR,rockL,rockR});
  });
}

function addSolidProp(s,x,frame,scale=.42,widthFactor=.68,height=22){
  const im=s.add.image(x,FLOOR+2,P.PHASE01_TEXTURE,frame).setOrigin(.5,1).setScale(scale).setDepth(18).setAlpha(.98);
  const w=Math.max(24,im.displayWidth*widthFactor),h=Math.min(height,Math.max(14,im.displayHeight*.55));
  const solid=s.addSolid(x,FLOOR-h,w,h+4);solid.__solidPropV036=true;im.__solidPropV036={w,h};return {im,solid,x,w,h};
}
function buildSolidLandmarks(s){
  const defs=[
    [3840,'phase_01_grassland/props/014',.38,.70,21],[5410,'phase_01_grassland/props/015',.42,.72,20],
    [8080,'phase_01_grassland/props/045',.46,.78,22],[15120,'phase_01_grassland/props/043',.38,.70,22],
    [19040,'phase_01_grassland/props/014',.36,.70,20],[23080,'phase_01_grassland/props/028',.40,.70,23],
    [26870,'phase_01_grassland/props/046',.46,.78,22],[29280,'phase_01_grassland/props/042',.39,.70,23],
    [30970,'phase_01_grassland/props/014',.36,.70,20],[35540,'phase_01_grassland/props/013',.43,.72,20]
  ];s.__solidLandmarksV036=defs.map(d=>addSolidProp(s,...d));
}

const oldBuildTerrain=proto.buildTerrain;
proto.buildTerrain=function(){const r=oldBuildTerrain.call(this);buildRavines(this);buildSolidLandmarks(this);return r;};

const oldBuildEnemies=proto.buildEnemies;
proto.buildEnemies=function(){
  const r=oldBuildEnemies.call(this);
  const add=(x,kind,min,max,speed,flying=false)=>{const anim=kind==='beetle'?'v04_beetle_walk':kind==='bee'?'v04_bee_fly':'v04_slime_idle';const y=flying?155:FLOOR+2,scale=flying?.35:(kind==='beetle'?.42:.41),w=flying?48:(kind==='beetle'?52:44),h=flying?34:(kind==='beetle'?31:28);this.addEnemy(x,y,anim,scale,min,max,speed,w,h,flying,(x%800)/280,kind==='beetle');const e=this.enemies[this.enemies.length-1];e.__densityV036=true;};
  add(3470,'slime',3300,3650,34);add(10920,'beetle',10680,11160,43);add(23130,'bee',22880,23380,49,true);add(35380,'slime',35080,35720,35);return r;
};

function initGateState(s){
  s.__gateFlowV036={version:'v036',held:null,consumed:[],opened:[],keysSpawned:[],keysCollected:[]};
  s.__keyHudV036={box:s.add.rectangle(s.scale.width/2,55,178,28,0x071827,.88).setStrokeStyle(1,0xffe287,.48).setScrollFactor(0).setDepth(1710).setVisible(false),icon:s.add.image(s.scale.width/2-69,55,KEY_TEX).setScale(.18).setScrollFactor(0).setDepth(1711).setVisible(false),text:s.add.text(s.scale.width/2+7,55,'',{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#fff0af'}).setOrigin(.5).setScrollFactor(0).setDepth(1711).setVisible(false)};
  for(const g of s.lockGatesRC37||[]){
    const c=GATE_CFG[g.id];if(!c)continue;Object.assign(g,{keyName:c.name,keyTint:c.tint,keySpawnX:c.x,keySpawned:false,keyCollected:false,keyConsumed:false,opening:false,keySprite:null,keyGlow:null,pedestal:null});
    const ped=s.add.image(c.x,FLOOR+2,P.PHASE01_TEXTURE,c.pedestal).setOrigin(.5,1).setScale(g.id==='GATE_A'?.27:.25).setDepth(17).setAlpha(.92);g.pedestal=ped;
    const halo=s.add.circle(c.x,FLOOR-30,g.id==='GATE_C'?34:27,c.tint,.035).setDepth(16);s.tweens.add({targets:halo,scale:1.18,alpha:.07,duration:1500+(g.id==='GATE_B'?180:0),yoyo:true,repeat:-1,ease:'Sine.inOut'});g.pedestalHalo=halo;
    if(g.visual?.active){g.visual.clearCrop?.();g.visual.setTexture('w01l01_rc37_gate_closed').setScale(.58).setAlpha(1).setVisible(true);}
  }
  const relayout=()=>{const h=s.__keyHudV036,w=s.scale.width;h.box.setPosition(w/2,55);h.icon.setPosition(w/2-69,55);h.text.setPosition(w/2+7,55);};s.scale.on(Phaser.Scale.Events.RESIZE,relayout);s.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>s.scale.off(Phaser.Scale.Events.RESIZE,relayout));
}
function updateHud(s){const h=s.__keyHudV036,held=s.__gateFlowV036?.held;if(!h)return;const on=!!held;h.box.setVisible(on);h.icon.setVisible(on);h.text.setVisible(on);if(on){const g=s.lockGatesRC37.find(x=>x.id===held);h.icon.setTint(g?.keyTint||0xffffff);h.text.setText(g?.keyName||'CHAVE RÚNICA');}}
function spawnKey(s,g){
  if(g.keySpawned||g.open)return;g.keySpawned=true;s.__gateFlowV036.keysSpawned.push(g.id);const c=GATE_CFG[g.id],y=FLOOR-48;
  const glow=s.add.circle(g.keySpawnX,y,22,g.keyTint,.12).setDepth(52),sp=s.add.image(g.keySpawnX,y,KEY_TEX).setOrigin(.5).setScale(.42).setTint(g.keyTint).setDepth(54);s.tweens.add({targets:[glow,sp],y:'-=7',duration:700,yoyo:true,repeat:-1,ease:'Sine.inOut'});s.tweens.add({targets:glow,scale:1.25,alpha:.025,duration:900,yoyo:true,repeat:-1});g.keyGlow=glow;g.keySprite=sp;
  const msg=s.add.text(g.keySpawnX,y-44,c.hint,{fontFamily:'monospace',fontSize:'7px',fontStyle:'bold',color:'#fff5c4',backgroundColor:'#071827dd',padding:{x:5,y:3}}).setOrigin(.5).setDepth(90);s.tweens.add({targets:msg,alpha:0,delay:1250,duration:330,onComplete:()=>msg.destroy()});P.AudioServiceRC25?.play(s,'SFX_SWITCH_PRESS',{cooldown:0,gain:.55});s.logDesign?.('key_spawned',{gate:g.id,key:g.keyName});
}
function collectKey(s,g){
  if(!g.keySprite?.active||g.keyCollected)return;g.keyCollected=true;s.__gateFlowV036.held=g.id;s.__gateFlowV036.keysCollected.push(g.id);P.AudioServiceRC25?.play(s,'SFX_COLLECT_COIN',{cooldown:0,gain:.66});s.tweens.killTweensOf(g.keySprite);s.tweens.killTweensOf(g.keyGlow);s.tweens.add({targets:g.keySprite,y:g.keySprite.y-28,scale:.62,alpha:0,duration:260,onComplete:()=>g.keySprite?.destroy()});s.tweens.add({targets:g.keyGlow,scale:1.7,alpha:0,duration:260,onComplete:()=>g.keyGlow?.destroy()});updateHud(s);s.logDesign?.('key_collected',{gate:g.id,key:g.keyName});
}
function renderOpenGate(g){if(!g?.visual?.active)return;g.visual.setTexture('w01l01_rc37_gate_open');g.visual.clearCrop?.();g.visual.setCrop(212,0,107,112).setScale(.58).setAlpha(1).setVisible(true);if(g.solid?.body)g.solid.body.enable=false;g.solid?.setActive(false);}
function ceremony(s,g){
  if(g.open||g.opening||!g.keyCollected||s.__gateFlowV036.held!==g.id)return;g.opening=true;g.keyConsumed=true;s.__gateFlowV036.held=null;s.__gateFlowV036.consumed.push(g.id);updateHud(s);s.player.controlsLocked=true;s.player.body.stop();
  const ky=s.player.body.bottom-36,ghost=s.add.image(s.player.x,ky,KEY_TEX).setScale(.32).setTint(g.keyTint).setDepth(130),lockY=FLOOR-53;label(s,g,'INSERINDO A CHAVE...',1);P.AudioServiceRC25?.play(s,'SFX_SWITCH_PRESS',{cooldown:0,gain:.65});
  s.tweens.add({targets:ghost,x:g.x,y:lockY,angle:90,scale:.20,duration:300,ease:'Quad.InOut',onComplete:()=>{ghost.destroy();s.cameras.main.shake(170,.0024);P.AudioServiceRC25?.play(s,'SFX_DOOR_OPEN',{cooldown:0,gain:.78});for(let i=0;i<28;i++){const p=i%2?s.add.circle(g.x,lockY,2,i%3?g.keyTint:0xffffff,.92):s.add.rectangle(g.x,lockY,3,2,i%3?g.keyTint:0xffffff,.88);p.setDepth(135);const ang=(i/28)*Math.PI*2,dist=26+(i%7)*7;s.tweens.add({targets:p,x:g.x+Math.cos(ang)*dist,y:lockY+Math.sin(ang)*dist,alpha:0,scale:.3,duration:420+(i%4)*60,onComplete:()=>p.destroy()});}g.open=true;g.opening=false;renderOpenGate(g);s.__gateFlowV036.opened.push(g.id);label(s,g,'CAMINHO LIBERADO',1);s.time.delayedCall(900,()=>label(s,g,'',0));s.logDesign?.('gate_open_key',{id:g.id,key:g.keyName,defeated:g.defeated,seals:s.sealsCollectedRC37});s.time.delayedCall(180,()=>{s.player.controlsLocked=false;});}});
}
function updateGateFlow(s){
  const px=s.player?.x||0,py=s.player?.y||0,raw=rawAttack(s),pressed=raw&&!s.__prevAttackV036;s.__prevAttackV036=raw;
  for(const g of s.lockGatesRC37||[]){
    if(g.open){label(s,g,'',0);continue;}const ready=requirementsMet(s,g);if(ready&&!g.keySpawned&&!g.keyCollected)spawnKey(s,g);if(g.keySprite?.active&&!g.keyCollected&&Math.abs(px-g.keySpawnX)<42&&Math.abs(py-g.keySprite.y)<80)collectKey(s,g);
    const near=Math.abs(px-g.x)<150;if(!near){if(g.__ownerLabelV031?.active)g.__ownerLabelV031.setAlpha(0);continue;}
    if(g.keyCollected&&s.__gateFlowV036.held===g.id){label(s,g,'X  •  INSERIR CHAVE',1);if(pressed||s.autoplayRC37?.status==='RUNNING')ceremony(s,g);}else if(!ready){const final=g.id==='GATE_C'&&s.sealsCollectedRC37<3?` • SELOS ${s.sealsCollectedRC37}/3`:'';label(s,g,`PORTA TRANCADA • GUARDIÕES ${Math.min(g.defeated||0,g.required||0)}/${g.required}${final}`,1);}else label(s,g,'A CHAVE ESTÁ PRÓXIMA',1);
  }
}

const oldCreate=proto.create;
proto.create=function(...a){const r=oldCreate.apply(this,a);initGateState(this);this.__footShadowV036=this.add.ellipse(this.player.x,FLOOR+1,24,6,0x08110c,.22).setDepth(42);this.__v036={ready:true,terrainAligned:true,ravines:this.__ravinesV036?.length||0,solidLandmarks:this.__solidLandmarksV036?.length||0,extraEnemies:this.enemies.filter(e=>e.__densityV036).length,keyDoors:true};window.__KELVOR_W01_L01_V036__=this;return r;};
proto.updateArenaGatesRC37=function(){updateGateFlow(this);};
const oldRestore=proto.restoreCheckpointProgressRC37;
proto.restoreCheckpointProgressRC37=function(state){const r=oldRestore.call(this,state);for(const g of this.lockGatesRC37||[]){if(g.open){g.keyCollected=true;g.keyConsumed=true;renderOpenGate(g);}}return r;};
const oldUpdate=proto.update;
proto.update=function(time,delta){const r=oldUpdate.call(this,time,delta);if(this.lifeCycle==='active'&&this.player){updateGateFlow(this);const sh=this.__footShadowV036;if(sh?.active){sh.setPosition(this.player.x,this.player.body.bottom+2).setVisible(this.player.grounded&&!this.player.controlsLocked);const vx=Math.abs(this.player.velocityX||0);sh.setScale(1+Math.min(.18,vx/1200),1);sh.setAlpha(this.player.grounded?.20:0);}}return r;};
const oldSnap=proto.rc37Snapshot;
proto.rc37Snapshot=function(){const z=oldSnap.call(this);z.ownerV036={...(this.__v036||{}),gateFlow:this.__gateFlowV036?JSON.parse(JSON.stringify({held:this.__gateFlowV036.held,consumed:this.__gateFlowV036.consumed,opened:this.__gateFlowV036.opened,keysSpawned:this.__gateFlowV036.keysSpawned,keysCollected:this.__gateFlowV036.keysCollected})):null,groundSurfaces:(this.children?.list||[]).filter(o=>o.__groundSurfaceV036).length};return z;};
window.__KELVOR_RC39_W01L01_V036_READY__=true;
})(PlatformerSNESV04);
