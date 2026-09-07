(function(P){
'use strict';
// RC39 v032 — owner experience repair after physical mobile playtest.
// Fixes presentation, camera, menu/map responsiveness, gate feedback and authored vine traversal.
// No enemy HP, player HP, damage, jump velocity, run speed, pit geometry, seal requirements or PASS thresholds are reduced.

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// -----------------------------------------------------------------------------
// AUDIO: the legacy title/map cues are sub-2-second assets and sound like a click
// loop on a phone. Route those LOOPING menu requests to the real 35.5 s W01 score.
// -----------------------------------------------------------------------------
const A=P.AudioServiceRC25;
if(A&&!A.__ownerV032MusicRoute){
  const oldPlayMusic=A.playMusic.bind(A);
  A.playMusic=function(scene,cue,loop=true,opts={}){
    if(loop&&(cue==='MUS_GLOBAL_TITLE'||cue==='MUS_GLOBAL_WORLD_MAP')){
      const gain=cue==='MUS_GLOBAL_TITLE'?.54:.60;
      return oldPlayMusic(scene,'MUS_P1_EXPLORE_A',true,{...opts,gain});
    }
    return oldPlayMusic(scene,cue,loop,opts);
  };
  A.__ownerV032MusicRoute=true;
}

// -----------------------------------------------------------------------------
// MAIN MENU: responsive, centered, family-adventure presentation + fullscreen.
// Existing assets only; no new external media/dependency.
// -----------------------------------------------------------------------------
const Menu=P.MainMenuSceneV10;
if(Menu){
  Menu.prototype.create=function(){
    document.documentElement.dataset.kelvorScreen='main-menu';
    const w=this.scale.width,h=this.scale.height;
    this.cameras.main.setBackgroundColor('#071827');

    // Layered full-screen landscape rather than a small character floating in empty navy.
    const sky1=this.add.rectangle(w/2,h*.23,w,h*.46,0x123653,1).setDepth(-60);
    const sky2=this.add.rectangle(w/2,h*.59,w,h*.72,0x0a2439,1).setDepth(-59);
    const far=this.add.tileSprite(0,h*.48,w+24,124,P.PARALLAX_FAR).setOrigin(0,0).setAlpha(.78).setDepth(-50);
    const mid=this.add.tileSprite(0,h*.58,w+24,92,P.PARALLAX_MID).setOrigin(0,0).setAlpha(.80).setDepth(-49);
    const near=this.add.tileSprite(0,h*.68,w+24,92,P.PARALLAX_NEAR).setOrigin(0,0).setAlpha(.82).setDepth(-48);
    const floor=this.add.rectangle(w/2,h-22,w,44,0x071827,.90).setDepth(-30);
    const glow=this.add.ellipse(w*.72,h*.70,176,30,0xffe889,.15).setDepth(-15);
    const platform=this.add.image(w*.72,h*.71,P.PHASE01_TEXTURE,'phase_01_grassland/terrain/023').setOrigin(.5,0).setScale(.86).setDepth(-10);
    const hero=this.add.sprite(w*.72,h*.70,P.HERO_TEXTURE,'hero/idle/frame_00').setOrigin(.5,1).setScale(1.04).setDepth(1);
    hero.play('hero_idle');
    if(P.GameSettingsV10.get('menuMotion'))this.tweens.add({targets:glow,scaleX:1.18,alpha:.06,duration:1450,yoyo:true,repeat:-1,ease:'Sine.inOut'});

    const titleShadow=this.add.text(w*.34,h*.16,'KELVOR',{fontFamily:'Arial Black, sans-serif',fontSize:'52px',fontStyle:'bold',color:'#071827',stroke:'#071827',strokeThickness:8}).setOrigin(.5).setDepth(8);
    const title=this.add.text(w*.34,h*.15,'KELVOR',{fontFamily:'Arial Black, sans-serif',fontSize:'52px',fontStyle:'bold',color:'#fff1ae',stroke:'#934b1c',strokeThickness:2,shadow:{offsetX:2,offsetY:3,color:'#000000',blur:0,stroke:true,fill:true}}).setOrigin(.5).setDepth(9);
    const subtitle=this.add.text(w*.34,h*.27,'UMA GRANDE AVENTURA EM CINCO MUNDOS',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#d6ecf7',letterSpacing:1}).setOrigin(.5).setDepth(9);
    const tagline=this.add.text(w*.34,h*.33,'EXPLORAR  •  DESCOBRIR  •  VENCER',{fontFamily:'monospace',fontSize:'8px',color:'#9fd7a5'}).setOrigin(.5).setDepth(9);

    const bx=w*.34,by=h*.49;
    const start=new P.PixelButtonV10(this,bx,by,250,38,'JOGAR AGORA',()=>this.startAdventure(true));
    const music=new P.PixelButtonV10(this,bx-84,by+52,150,30,'MÚSICA',()=>this.scene.start('MusicPlayerSceneV10'));
    const options=new P.PixelButtonV10(this,bx+84,by+52,150,30,'OPÇÕES',()=>this.scene.start('OptionsSceneV10'));
    const credits=new P.PixelButtonV10(this,bx,by+92,150,27,'CRÉDITOS',()=>this.scene.start('CreditsSceneV10'));
    const fs=new P.PixelButtonV10(this,w-82,26,144,29,'TELA CHEIA',()=>this.scale.toggleFullscreen({navigationUI:'hide'}));
    this.ui=[start,music,options,credits,fs];this.setSelection(0);this.makeKeyset();
    this.add.text(14,h-16,'Dennys Pavanelli',{fontFamily:'monospace',fontSize:'7px',color:'#88a8ba'}).setOrigin(0,1).setDepth(20);
    this.add.text(w-14,h-16,'MOBILE • DESKTOP',{fontFamily:'monospace',fontSize:'7px',color:'#88a8ba'}).setOrigin(1,1).setDepth(20);
    P.AudioServiceRC25?.playMusic(this,'MUS_GLOBAL_TITLE',true,{gain:.54});

    const layout=()=>{
      const nw=this.scale.width,nh=this.scale.height;
      sky1.setPosition(nw/2,nh*.23).setDisplaySize(nw,nh*.46);sky2.setPosition(nw/2,nh*.59).setDisplaySize(nw,nh*.72);
      far.setPosition(0,nh*.48).setSize(nw+24,124);mid.setPosition(0,nh*.58).setSize(nw+24,92);near.setPosition(0,nh*.68).setSize(nw+24,92);floor.setPosition(nw/2,nh-22).setDisplaySize(nw,44);
      glow.setPosition(nw*.72,nh*.70);platform.setPosition(nw*.72,nh*.71);hero.setPosition(nw*.72,nh*.70);
      titleShadow.setPosition(nw*.34,nh*.16);title.setPosition(nw*.34,nh*.15);subtitle.setPosition(nw*.34,nh*.27);tagline.setPosition(nw*.34,nh*.33);
      const x=nw*.34,y=nh*.49;start.box.setPosition(x,y);start.label.setPosition(x,y);music.box.setPosition(x-84,y+52);music.label.setPosition(x-84,y+52);options.box.setPosition(x+84,y+52);options.label.setPosition(x+84,y+52);credits.box.setPosition(x,y+92);credits.label.setPosition(x,y+92);fs.box.setPosition(nw-82,26);fs.label.setPosition(nw-82,26);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE,layout);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.scale.off(Phaser.Scale.Events.RESIZE,layout));
    window.__KELVOR_MAIN_MENU_V032__=this;
  };
}

// -----------------------------------------------------------------------------
// WORLD MAP: old POS coordinates were absolute for 640x360 while EXPAND widens
// mobile landscape. This is why hero/locks floated outside the island. Re-anchor
// every node to normalized coordinates inside the artwork and make the HUD central.
// -----------------------------------------------------------------------------
const Map=P.WorldMapSceneRC1?.prototype;
if(Map){
  const REL={L01:[.20,.68],L02:[.39,.47],L03:[.61,.67],SECRET:[.39,.83],BOSS:[.79,.34]};
  const names={L01:'TRILHA DO DESPERTAR',L02:'CLAREIRA DAS RAÍZES',L03:'COPAS AO VENTO',SECRET:'COPA OCULTA',BOSS:'FOREST GUARDIAN'};
  function mapLayout(s){
    if(!s?.dynamic?.length)return;
    const w=s.scale.width,h=s.scale.height;
    const mapH=Math.min(h*.78,w*.53),mapW=mapH*(336/327),cx=w*.57,cy=h*.49;
    const left=cx-mapW/2,top=cy-mapH/2;
    let bg=null;
    for(const o of s.dynamic){
      const key=String(o?.texture?.key||'');
      if(key.startsWith('campaign_world')){bg=o;continue;}
      if(key.startsWith('campaign_portal_')){o.setVisible(false);continue;}
      if(key.startsWith('campaign_route_'))o.setVisible(false);
    }
    if(bg)bg.setPosition(cx,cy).setDisplaySize(mapW,mapH).setAlpha(1);
    for(const [n,p] of Object.entries(REL)){
      const sp=s.nodes?.[n];if(!sp)continue;const x=left+p[0]*mapW,y=top+p[1]*mapH;sp.setPosition(x,y).setScale(n==='BOSS'?.42:.40);
    }
    const rp=REL[s.selected]||REL.L01,x=left+rp[0]*mapW,y=top+rp[1]*mapH;
    s.selection?.setPosition(x,y).setScale(.48);s.hero?.setPosition(x,y-22).setScale(.38);
    s.title?.setPosition(w/2,14).setOrigin(.5,0).setText(`MUNDO ${String(s.world||'W01').replace('W','')}  •  ${s.world==='W01'?'PLANÍCIES VERDES':'AVENTURA'}`).setStyle({fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#fff2b5',backgroundColor:'#071827dd',padding:{x:9,y:5}});
    const st=s.save?.worlds?.[s.world]?.nodes?.[s.selected]||'';s.status?.setPosition(w/2,h-18).setOrigin(.5,1).setText(`${names[s.selected]||s.selected}  •  ${st==='AVAILABLE'?'DISPONÍVEL':st}`).setStyle({fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#e7f5e3',backgroundColor:'#071827dd',padding:{x:8,y:4}});
    const yb=h-50;
    const moveText=(o,xv)=>{if(!o)return;o.setPosition(xv,yb).setOrigin(.5).setStyle({fontFamily:'monospace',fontSize:'10px',backgroundColor:'#112a43',color:'#ffffff',padding:{x:9,y:7}});};
    moveText(s.prev,w/2-150);moveText(s.enter,w/2-78);moveText(s.next,w/2-2);moveText(s.worldPrevRC9,w/2+92);moveText(s.worldNextRC9,w/2+190);
    s.enter?.setText('JOGAR');
    s.__ownerMapV032={responsive:true,mapBounds:{left,top,width:mapW,height:mapH}};
  }
  const oldRender=Map.renderWorld;Map.renderWorld=function(...a){const r=oldRender.apply(this,a);mapLayout(this);return r;};
  const oldSelect=Map.selectNode;Map.selectNode=function(n,animate=false){const r=oldSelect.call(this,n,false);mapLayout(this);return r;};
  const oldCreate=Map.create;Map.create=function(...a){const r=oldCreate.apply(this,a);mapLayout(this);P.AudioServiceRC25?.playMusic(this,'MUS_GLOBAL_WORLD_MAP',true,{gain:.60});return r;};
}

// -----------------------------------------------------------------------------
// W01-L01: horizontal camera, clean gate dissolve, supported climbable vines.
// -----------------------------------------------------------------------------
const S=P.World01Level01AAAReferenceSceneRC37;
if(S){
  const proto=S.prototype;
  const oldCreate=proto.create,oldUpdate=proto.update,oldGateUpdate=proto.updateArenaGatesRC37,oldRestore=proto.restoreCheckpointProgressRC37;

  function removeLegacyVines(s){
    const vineFrames=new Set(['phase_01_grassland/terrain/029','phase_01_grassland/terrain/030','phase_01_grassland/terrain/031','phase_01_grassland/terrain/032']);
    for(const o of [...(s.children?.list||[])]){
      const f=String(o?.frame?.name||'');if(o?.texture?.key===P.PHASE01_TEXTURE&&vineFrames.has(f)&&o.y<170)o.destroy();
    }
  }
  function buildVines(s){
    removeLegacyVines(s);s.climbZonesV032=[];
    const anchors=[
      [11910,'phase_01_grassland/terrain/029'],
      [12690,'phase_01_grassland/terrain/030'],
      [13740,'phase_01_grassland/terrain/031'],
      [20310,'phase_01_grassland/terrain/032'],
      [22140,'phase_01_grassland/terrain/030']
    ];
    for(const [x,frame] of anchors){
      const top=s.platformTopByX?.get(x);if(!Number.isFinite(top))continue;
      const y0=top+8,bottom=P.FLOOR_TOP-2,height=Math.max(48,bottom-y0);
      const vine=s.add.image(x,y0,P.PHASE01_TEXTURE,frame).setOrigin(.5,0).setDisplaySize(24,height).setDepth(19).setAlpha(.96);
      s.add.circle(x,y0+1,7,0x4d7138,.95).setDepth(18).setStrokeStyle(2,0x263b25,.9);
      s.climbZonesV032.push({id:'w01_vine_'+x,x,top:y0,bottom,width:34,vine,hinted:false});
    }
  }
  function verticalAxis(s){
    const r=s.router;if(!r)return 0;
    const up=!!(r.cursors?.up?.isDown||r.keys?.w?.isDown),down=!!(r.cursors?.down?.isDown||r.keys?.s?.isDown);if(up!==down)return up?-1:1;
    let y=r.virtualAxisY||0;const pad=s.input.gamepad?.getPad(0),py=pad?.axes?.length>1?pad.axes[1].getValue():0;if(Math.abs(py)>Math.abs(y))y=py;
    return Math.abs(y)<P.TUNING.joystickDeadzone?0:clamp(y,-1,1);
  }
  function updateVines(s){
    if(s.lifeCycle!=='active'||!s.player||!s.climbZonesV032)return;
    const state=s.player.climbStateV09;if(state?.active||(state?.blockedUntil||0)>s.time.now)return;
    const ay=verticalAxis(s);if(Math.abs(ay)<.28)return;
    const feet=s.player.body.bottom,x=s.player.x;
    const zone=s.climbZonesV032.find(z=>Math.abs(x-z.x)<=z.width&&feet>=z.top-18&&feet<=z.bottom+24);if(!zone)return;
    s.player.climbStateV09={active:true,zone,reason:'owner_v032_vine',blockedUntil:0};s.player.body.setAllowGravity(false);s.player.body.setVelocity(clamp((zone.x-x)*8,-72,72),0);
    if(!zone.hinted){zone.hinted=true;const t=s.add.text(zone.x,zone.top-18,'CIPÓ • JOYSTICK ↑ / ↓',{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#f1ffd9',backgroundColor:'#071827dd',padding:{x:5,y:3}}).setOrigin(.5,1).setDepth(70);s.time.delayedCall(1500,()=>t?.active&&s.tweens.add({targets:t,alpha:0,duration:250,onComplete:()=>t.destroy()}));}
  }
  function openGateEffect(s,g){
    if(!g?.visual?.active||g.__v032Dissolved)return;g.__v032Dissolved=true;s.tweens.killTweensOf(g.visual);g.visual.setAlpha(1);
    const x=g.x,y=(g.visual.y||P.FLOOR_TOP)-42;
    const text=s.add.text(x,y-58,'CAMINHO LIBERADO',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#fff2a8',backgroundColor:'#071827dd',padding:{x:6,y:3}}).setOrigin(.5).setDepth(72);
    for(let i=0;i<16;i++){const a=Math.PI*2*i/16,p=s.add.rectangle(x,y,3,3,i%2?0xffe886:0x9ff7b0,.92).setDepth(71);s.tweens.add({targets:p,x:x+Math.cos(a)*(30+(i%4)*7),y:y+Math.sin(a)*(26+(i%5)*5),alpha:0,duration:420+i*16,onComplete:()=>p.destroy()});}
    s.tweens.add({targets:g.visual,alpha:0,scaleX:g.visual.scaleX*1.18,scaleY:g.visual.scaleY*.88,duration:360,ease:'Quad.Out',onComplete:()=>g.visual?.active&&g.visual.destroy()});
    s.tweens.add({targets:text,alpha:0,y:text.y-12,delay:620,duration:340,onComplete:()=>text.destroy()});
  }

  proto.create=function(...a){
    const r=oldCreate.apply(this,a);
    const cam=this.cameras.main;cam.scrollY=0;cam.startFollow(this.player.actor,true,.28,0,-26,0);cam.setDeadzone(104,10000);cam.followOffset.y=0;
    buildVines(this);this.__ownerV032={cameraYLocked:true,vines:this.climbZonesV032.length,gateDissolve:true};
    return r;
  };
  proto.update=function(time,delta){const r=oldUpdate.call(this,time,delta);if(this.cameras?.main){this.cameras.main.scrollY=0;this.cameras.main.followOffset.y=0;}updateVines(this);return r;};
  proto.updateCameraLookAhead=function(){
    const cam=this.cameras.main,speed01=Phaser.Math.Clamp(Math.abs(this.player.velocityX)/P.TUNING.runSpeed,0,1),target=-this.player.direction*Phaser.Math.Linear(24,P.TUNING.cameraLookAhead,speed01);cam.followOffset.x=Phaser.Math.Linear(cam.followOffset.x,target,.065);cam.followOffset.y=0;cam.scrollY=0;
  };
  proto.updateArenaGatesRC37=function(){
    const before=new Map((this.lockGatesRC37||[]).map(g=>[g.id,!!g.open])),r=oldGateUpdate.call(this);for(const g of this.lockGatesRC37||[])if(!before.get(g.id)&&g.open)openGateEffect(this,g);return r;
  };
  proto.restoreCheckpointProgressRC37=function(...a){const r=oldRestore.apply(this,a);for(const g of this.lockGatesRC37||[])if(g.open&&g.visual?.active){g.visual.setVisible(false).setAlpha(0);}return r;};
  const oldSnap=proto.rc37Snapshot;proto.rc37Snapshot=function(){const s=oldSnap.call(this);s.ownerExperienceV032=this.__ownerV032||null;s.climbZonesV032=(this.climbZonesV032||[]).map(z=>({id:z.id,x:z.x,top:z.top,bottom:z.bottom}));return s;};
}

window.__KELVOR_RC39_OWNER_EXPERIENCE_V032_READY__=true;
})(PlatformerSNESV04);
