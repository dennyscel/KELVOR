(function(P){
'use strict';
// RC39 v039 — deterministic dual-layout rebuild for Main Menu + World Map.
// UI/presentation only. No gameplay physics, HP, enemy stats, level geometry or save thresholds changed.
const GOLD=0xf6d77a, GOLD2=0xffefad, NAVY=0x061827, NAVY2=0x0b2438, PANEL=0x0a2134, MINT=0xa8dda6;
const NODE_POS={L01:[205,235],L02:[295,185],L03:[390,235],SECRET:[300,290],BOSS:[490,175]};
const NODE_ORDER=['L01','L02','L03','SECRET','BOSS'];
const NODE_NAMES={L01:'TRILHA DO DESPERTAR',L02:'CLAREIRA DAS RAÍZES',L03:'COPAS AO VENTO',SECRET:'COPA OCULTA',BOSS:'GUARDIÃO DA FLORESTA'};
const STATE_NAMES={LOCKED:'BLOQUEADA',AVAILABLE:'DISPONÍVEL',CURRENT:'ATUAL',COMPLETED:'CONCLUÍDA',MASTERED:'DOMINADA',BOSS_AVAILABLE:'CHEFE LIBERADO',BOSS_DEFEATED:'CHEFE DERROTADO'};
const WORLD_NAMES={W01:'PLANÍCIES VERDES'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const isPortrait=(s)=>s.scale.height>s.scale.width*1.05;
const text=(s,x,y,t,style={},depth=30)=>s.add.text(x,y,t,{fontFamily:'monospace',fontSize:'10px',color:'#ffffff',...style}).setDepth(depth);

function bindDeterministicResize(scene,tag){
  scene.__v039Size=`${scene.scale.width}x${scene.scale.height}`;
  const onResize=()=>{
    const now=`${scene.scale.width}x${scene.scale.height}`;
    if(now===scene.__v039Size||scene.__v039RestartQueued)return;
    scene.__v039RestartQueued=true;
    scene.time.delayedCall(120,()=>{
      if(!scene.scene.isActive())return;
      scene.scene.restart({v039Resize:true,tag});
    });
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE,onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.scale.off(Phaser.Scale.Events.RESIZE,onResize));
}
function fullscreenButton(scene,w,portrait){
  const bw=portrait?118:150,bh=portrait?36:32;
  const b=new P.PixelButtonV10(scene,w-bw/2-10,10+bh/2,bw,bh,'⛶  TELA CHEIA',()=>scene.scale.toggleFullscreen({navigationUI:'hide'}));
  b.box.setFillStyle(0x0a2235,.93).setStrokeStyle(1,GOLD,.72);b.label.setFontSize(portrait?8:10);
  return b;
}
function addBackdrop(scene,portrait,variant='menu'){
  const w=scene.scale.width,h=scene.scale.height;
  scene.cameras.main.setBackgroundColor(variant==='map'?'#061522':'#081a2a');
  const sky=scene.add.graphics().setDepth(-100);
  const top=variant==='map'?0x0a2538:0x173f60,bottom=variant==='map'?0x061522:0x081a2a;
  sky.fillGradientStyle(top,top,bottom,bottom,1);sky.fillRect(0,0,w,h);
  const farH=portrait?Math.round(h*.22):Math.round(h*.43);
  const midH=portrait?Math.round(h*.20):Math.round(h*.34);
  const nearH=portrait?Math.round(h*.22):Math.round(h*.27);
  const farAlpha=portrait?(variant==='map'?.08:0):(variant==='map'?.24:.66);
  const midAlpha=portrait?(variant==='map'?.07:0):(variant==='map'?.18:.73);
  const nearAlpha=portrait?(variant==='map'?.13:.76):(variant==='map'?.15:.82);
  const far=scene.add.tileSprite(0,h,w,farH,P.PARALLAX_FAR).setOrigin(0,1).setAlpha(farAlpha).setDepth(-80);
  const mid=scene.add.tileSprite(0,h,w,midH,P.PARALLAX_MID).setOrigin(0,1).setAlpha(midAlpha).setDepth(-79);
  const near=scene.add.tileSprite(0,h,w,nearH,P.PARALLAX_NEAR).setOrigin(0,1).setAlpha(nearAlpha).setDepth(-78);
  const shade=scene.add.rectangle(w/2,h/2,w,h,0x03111c,variant==='map'?.24:.08).setDepth(-70);
  const motes=[];
  if(P.GameSettingsV10?.get?.('menuMotion')!==false){
    const count=portrait?12:18;
    for(let i=0;i<count;i++){
      const c=scene.add.circle(Phaser.Math.Between(12,w-12),Phaser.Math.Between(50,h-60),1+(i%3===0),i%2?0xffe58b:0x9de5c0,variant==='map'?.14:.22).setDepth(-50);
      scene.tweens.add({targets:c,y:c.y-Phaser.Math.Between(18,54),x:c.x+Phaser.Math.Between(-10,10),alpha:0,duration:Phaser.Math.Between(2100,3800),delay:Phaser.Math.Between(0,900),repeat:-1,onRepeat:()=>{if(c.active)c.setPosition(Phaser.Math.Between(12,scene.scale.width-12),scene.scale.height-Phaser.Math.Between(45,120)).setAlpha(variant==='map'?.14:.22);}});
      motes.push(c);
    }
  }
  return {sky,far,mid,near,shade,motes};
}

const Menu=P.MainMenuSceneV10;
if(Menu){
  Menu.prototype.create=function(){
    this.__v039RestartQueued=false;
    document.documentElement.dataset.kelvorScreen='main-menu';
    const w=this.scale.width,h=this.scale.height,portrait=isPortrait(this);
    const bg=addBackdrop(this,portrait,'menu');
    const titleSize=portrait?clamp(Math.round(w*.105),38,54):clamp(Math.round(h*.105),42,64);
    const fs=fullscreenButton(this,w,portrait);
    let title,subtitle,kicker,hero,platform,heroGlow,start,music,options,credits,badge;
    if(portrait){
      title=this.add.text(w/2,h*.105,'KELVOR',{fontFamily:'Arial Black, sans-serif',fontSize:`${titleSize}px`,fontStyle:'bold',color:'#fff0a8',stroke:'#9b5220',strokeThickness:2,shadow:{offsetX:3,offsetY:5,color:'#020a11',blur:0,stroke:true,fill:true}}).setOrigin(.5).setDepth(10);
      subtitle=text(this,w/2,h*.175,'UMA GRANDE AVENTURA EM CINCO MUNDOS',{fontSize:`${clamp(Math.round(w*.022),8,11)}px`,fontStyle:'bold',color:'#d8e8ef',align:'center'},10).setOrigin(.5);
      kicker=text(this,w/2,h*.215,'EXPLORAR  •  DESCOBRIR  •  VENCER',{fontSize:`${clamp(Math.round(w*.018),7,9)}px`,color:'#a7d8af',align:'center'},10).setOrigin(.5);
      heroGlow=this.add.ellipse(w/2,h*.47,150,28,GOLD,.10).setDepth(3);
      platform=this.add.image(w/2,h*.49,P.PHASE01_TEXTURE,'phase_01_grassland/terrain/023').setOrigin(.5,0).setScale(.78).setDepth(5);
      hero=this.add.sprite(w/2,h*.49,P.HERO_TEXTURE,'hero/idle/frame_00').setOrigin(.5,1).setScale(.95).setDepth(7);hero.play('hero_idle');
      badge=this.add.text(w/2,h*.57,'PLANÍCIES VERDES',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#eff8d8',backgroundColor:'#061827cc',padding:{x:9,y:5}}).setOrigin(.5).setDepth(9);
      const bw=Math.min(w*.76,350),bh=48;
      start=new P.PixelButtonV10(this,w/2,h*.675,bw,bh,'JOGAR AGORA',()=>this.startAdventure(true));
      start.box.setFillStyle(0x183e53,.98).setStrokeStyle(2,GOLD2,.98);start.label.setColor('#fff2ad').setFontSize(12);
      const sw=Math.min(w*.35,158),sh=42;
      music=new P.PixelButtonV10(this,w*.29,h*.755,sw,sh,'MÚSICA',()=>this.scene.start('MusicPlayerSceneV10'));
      options=new P.PixelButtonV10(this,w*.71,h*.755,sw,sh,'OPÇÕES',()=>this.scene.start('OptionsSceneV10'));
      credits=new P.PixelButtonV10(this,w/2,h*.825,Math.min(w*.46,200),40,'CRÉDITOS',()=>this.scene.start('CreditsSceneV10'));
      text(this,12,h-14,'DENNYS PAVANELLI',{fontSize:'7px',color:'#819cac'},30).setOrigin(0,1);
    }else{
      const lx=w*.30,rx=w*.76;
      title=this.add.text(lx,h*.13,'KELVOR',{fontFamily:'Arial Black, sans-serif',fontSize:`${titleSize}px`,fontStyle:'bold',color:'#fff0a8',stroke:'#9b5220',strokeThickness:2,shadow:{offsetX:3,offsetY:5,color:'#020a11',blur:0,stroke:true,fill:true}}).setOrigin(.5).setDepth(10);
      subtitle=text(this,lx,h*.245,'UMA GRANDE AVENTURA EM CINCO MUNDOS',{fontSize:'9px',fontStyle:'bold',color:'#d8e8ef'},10).setOrigin(.5);
      kicker=text(this,lx,h*.305,'EXPLORAR  •  DESCOBRIR  •  VENCER',{fontSize:'8px',color:'#a7d8af'},10).setOrigin(.5);
      heroGlow=this.add.ellipse(rx,h*.76,180,30,GOLD,.09).setDepth(3);
      platform=this.add.image(rx,h*.76,P.PHASE01_TEXTURE,'phase_01_grassland/terrain/023').setOrigin(.5,0).setScale(.96).setDepth(5);
      hero=this.add.sprite(rx,h*.76,P.HERO_TEXTURE,'hero/idle/frame_00').setOrigin(.5,1).setScale(1.06).setDepth(7);hero.play('hero_idle');
      badge=text(this,rx,h*.865,'PLANÍCIES VERDES',{fontSize:'8px',fontStyle:'bold',color:'#eff8d8',backgroundColor:'#061827cc',padding:{x:8,y:4}},9).setOrigin(.5);
      const bw=Math.min(w*.30,320);
      start=new P.PixelButtonV10(this,lx,h*.49,bw,46,'JOGAR AGORA',()=>this.startAdventure(true));start.box.setFillStyle(0x183e53,.98).setStrokeStyle(2,GOLD2,.98);start.label.setColor('#fff2ad').setFontSize(13);
      music=new P.PixelButtonV10(this,lx-84,h*.60,150,36,'MÚSICA',()=>this.scene.start('MusicPlayerSceneV10'));
      options=new P.PixelButtonV10(this,lx+84,h*.60,150,36,'OPÇÕES',()=>this.scene.start('OptionsSceneV10'));
      credits=new P.PixelButtonV10(this,lx,h*.69,160,34,'CRÉDITOS',()=>this.scene.start('CreditsSceneV10'));
      text(this,14,h-12,'DENNYS PAVANELLI',{fontSize:'7px',color:'#819cac'},30).setOrigin(0,1);
      text(this,w-14,h-12,'MOBILE  •  DESKTOP',{fontSize:'7px',color:'#819cac'},30).setOrigin(1,1);
    }
    if(P.GameSettingsV10?.get?.('menuMotion')!==false){
      this.tweens.add({targets:[hero,platform],y:'-=2',duration:1700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.tweens.add({targets:heroGlow,alpha:{from:.09,to:.035},scaleX:{from:1,to:1.14},duration:1600,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    this.ui=[start,music,options,credits,fs];this.setSelection(0);this.makeKeyset();
    this.__v039={screen:'menu',orientation:portrait?'portrait':'landscape',stable:true,dualLayout:true};
    this.__layoutV039={bg,title,subtitle,kicker,hero,platform,heroGlow,start,music,options,credits,fs,badge};
    window.__KELVOR_MAIN_MENU_V039__=this;window.__KELVOR_MAIN_MENU_V034__=this;
    bindDeterministicResize(this,'menu');
    P.AudioServiceRC25?.playMusic(this,'MUS_GLOBAL_TITLE',true,{gain:.58});
  };
}

const WM=P.WorldMapSceneRC1?.prototype;
if(WM){
  WM.buildUI=function(){
    const w=this.scale.width,h=this.scale.height,portrait=isPortrait(this);this.__portraitV039=portrait;
    this.__mapBackdropV039=addBackdrop(this,portrait,'map');
    const fs=fullscreenButton(this,w,portrait);
    const worldTitle=portrait?text(this,16,18,'MUNDO 1  •  PLANÍCIES VERDES',{fontSize:'10px',fontStyle:'bold',color:'#fff2b0'},3010):text(this,22,20,'PLANÍCIES VERDES',{fontFamily:'Arial Black, sans-serif',fontSize:'20px',color:'#fff2ad'},3010);
    const chapter=portrait?null:text(this,22,48,'CAPÍTULO 1  •  O DESPERTAR',{fontSize:'8px',fontStyle:'bold',color:'#9ed8a8'},3010);
    let nodeCard,nodeTitle,nodeState,nodeHint,prev,play,next,worldPrev,worldNext;
    if(portrait){
      nodeCard=this.add.rectangle(w/2,h*.675,w-28,118,PANEL,.94).setStrokeStyle(1,MINT,.45).setDepth(3005);
      nodeTitle=text(this,w/2,h*.638,'',{fontSize:'12px',fontStyle:'bold',color:'#fff2b0',align:'center'},3010).setOrigin(.5);
      nodeState=text(this,w/2,h*.682,'',{fontSize:'9px',color:'#a8deb1',align:'center'},3010).setOrigin(.5);
      nodeHint=text(this,w/2,h*.718,'TOQUE NOS MARCADORES OU USE OS BOTÕES',{fontSize:'7px',color:'#90aab8',align:'center'},3010).setOrigin(.5);
      const navY=h*.79,sideW=Math.min(106,w*.25),playW=Math.min(178,w*.42);
      prev=new P.PixelButtonV10(this,w*.17,navY,sideW,46,'ANTERIOR',()=>this.moveSelection(-1));
      play=new P.PixelButtonV10(this,w/2,navY,playW,50,'JOGAR FASE',()=>this.enterSelected());play.box.setFillStyle(0x173f55,.98).setStrokeStyle(2,GOLD2,.95);play.label.setColor('#fff2ad');
      next=new P.PixelButtonV10(this,w*.83,navY,sideW,46,'PRÓXIMA',()=>this.moveSelection(1));
      const worldY=h*.86;worldPrev=new P.PixelButtonV10(this,w*.30,worldY,Math.min(120,w*.30),38,'MUNDO ◀',()=>this.switchWorld?.(-1));worldNext=new P.PixelButtonV10(this,w*.70,worldY,Math.min(120,w*.30),38,'MUNDO ▶',()=>this.switchWorld?.(1));
    }else{
      const leftW=Math.min(330,w*.32),cardX=16+leftW/2;
      const topCard=this.add.rectangle(cardX,96,leftW,150,PANEL,.94).setStrokeStyle(1,GOLD,.42).setDepth(3005);
      chapter?.setPosition(24,48);worldTitle.setPosition(24,67).setOrigin(0,0);
      text(this,24,102,'Uma trilha viva entre raízes,\nruínas e segredos da floresta.',{fontSize:'8px',color:'#c3d8e2',lineSpacing:4},3010);
      nodeCard=this.add.rectangle(cardX,h-92,leftW,126,PANEL,.95).setStrokeStyle(1,MINT,.42).setDepth(3005);
      nodeTitle=text(this,24,h-132,'',{fontSize:'12px',fontStyle:'bold',color:'#fff2b0'},3010);
      nodeState=text(this,24,h-101,'',{fontSize:'9px',color:'#a8deb1'},3010);
      nodeHint=text(this,24,h-72,'TOQUE NOS MARCADORES  •  JOGAR PARA ENTRAR',{fontSize:'7px',color:'#90aab8'},3010);
      const areaL=leftW+28,areaW=w-areaL-20,navY=h-42;
      prev=new P.PixelButtonV10(this,areaL+areaW*.20,navY,118,44,'ANTERIOR',()=>this.moveSelection(-1));
      play=new P.PixelButtonV10(this,areaL+areaW*.50,navY,200,48,'JOGAR FASE',()=>this.enterSelected());play.box.setFillStyle(0x173f55,.98).setStrokeStyle(2,GOLD2,.95);play.label.setColor('#fff2ad');
      next=new P.PixelButtonV10(this,areaL+areaW*.80,navY,118,44,'PRÓXIMA',()=>this.moveSelection(1));
      worldPrev=new P.PixelButtonV10(this,cardX-66,h-30,118,36,'MUNDO ◀',()=>this.switchWorld?.(-1));worldNext=new P.PixelButtonV10(this,cardX+66,h-30,118,36,'MUNDO ▶',()=>this.switchWorld?.(1));
    }
    for(const b of [prev,next,worldPrev,worldNext]){b.box.setFillStyle(0x0a2236,.94).setStrokeStyle(1,0x6f91a4,.55);b.label.setFontSize(portrait?8:9);}play.label.setFontSize(portrait?9:11);
    this.__mapChromeV039={fs,worldTitle,chapter,nodeCard,nodeTitle,nodeState,nodeHint,prev,play,next,worldPrev,worldNext};
    this.title=worldTitle;this.status=nodeState;
  };
  WM.__nodePointV039=function(n){
    const L=this.__mapLayoutV039,p=NODE_POS[n]||NODE_POS.L01,k=L.k;return [L.cx+(p[0]-320)*k,L.cy+(p[1]-157)*k];
  };
  WM.clearMap=function(){for(const o of this.dynamic||[])try{o.destroy();}catch(e){}this.dynamic=[];this.nodes={};};
  WM.renderWorld=function(){
    this.clearMap();
    const w=this.scale.width,h=this.scale.height,portrait=this.__portraitV039===true;
    const leftW=portrait?0:Math.min(330,w*.32),areaL=portrait?0:leftW+28,areaW=portrait?w:w-areaL-20;
    const cx=portrait?w/2:areaL+areaW/2;
    const cy=portrait?h*.37:h*.46;
    const maxW=portrait?w*.82:Math.min(areaW*.74,560);
    const maxH=portrait?h*.41:h*.74;
    const key='campaign_world'+String(parseInt(this.world?.slice(1)||'1',10)).padStart(2,'0')+'_map';
    const map=this.add.image(cx,cy,key).setDepth(8).setAlpha(1);
    const scale=Math.min(maxW/map.width,maxH/map.height);map.setScale(scale);this.dynamic.push(map);
    const baseScale=270/327,k=scale/baseScale;this.__mapLayoutV039={cx,cy,scale,k,map,maxW,maxH};
    const d=this.save.worlds[this.world];
    for(const n of NODE_ORDER){
      const st=d.nodes[n],[x,y]=this.__nodePointV039(n);let tex='campaign_node_available';
      if(st==='LOCKED')tex='campaign_node_lock';else if(st==='COMPLETED'||st==='MASTERED')tex='campaign_node_completed';else if(n==='SECRET')tex='campaign_node_secret';else if(n==='BOSS')tex='campaign_node_boss';
      const sc=clamp(.46*k,.40,.72);const sp=this.add.image(x,y,tex).setScale(sc).setDepth(20).setAlpha(st==='LOCKED'?.55:1);this.nodes[n]=sp;this.dynamic.push(sp);
      if(st!=='LOCKED')sp.setInteractive({useHandCursor:true}).on('pointerup',()=>this.selectNode(n,true));
    }
    if(d.nodes[this.selected]==='LOCKED')this.selected=this.available()[0]||'L01';
    const [sx,sy]=this.__nodePointV039(this.selected);
    this.selection=this.add.image(sx,sy,'campaign_node_selected').setScale(clamp(.54*k,.48,.82)).setDepth(19).setAlpha(.92);this.dynamic.push(this.selection);
    this.hero=this.add.image(sx,sy-23*k,'campaign_kelvor_map_idle').setScale(clamp(.44*k,.42,.66)).setDepth(25);this.dynamic.push(this.hero);
    const unlockedWorlds=this.worldOrder?this.worldOrder().filter(x=>this.save.worlds[x]?.unlocked):[this.world];
    const showWorld=unlockedWorlds.length>1;for(const b of [this.__mapChromeV039.worldPrev,this.__mapChromeV039.worldNext]){b.box.setVisible(showWorld);b.label.setVisible(showWorld);if(showWorld)b.box.setInteractive({useHandCursor:true});else b.box.disableInteractive();}
    this.updateText();
  };
  WM.updateText=function(){
    const st=this.save.worlds[this.world].nodes[this.selected],c=this.__mapChromeV039;if(!c)return;
    const wn=WORLD_NAMES[this.world]||`MUNDO ${this.world?.slice(1)||''}`;
    c.worldTitle.setText(this.__portraitV039?`${this.world.replace('W','MUNDO ')}  •  ${wn}`:wn);
    c.nodeTitle.setText(NODE_NAMES[this.selected]||this.selected);
    c.nodeState.setText(`${STATE_NAMES[st]||st}${this.selected==='SECRET'?'  •  ROTA SECRETA':''}`);
  };
  WM.selectNode=function(n,animate=false){
    if(this.busy||this.save.worlds[this.world].nodes[n]==='LOCKED')return false;
    const old=this.selected;this.selected=n;this.save.currentWorld=this.world;this.save.selected=this.world+'_'+n;P.KelvorCampaignRC1.save(this.save);
    const [x,y]=this.__nodePointV039(n),k=this.__mapLayoutV039.k;this.selection?.setPosition(x,y);
    if(animate&&old!==n)this.moveHero(n);else this.hero?.setPosition(x,y-23*k);
    this.updateText();return true;
  };
  WM.moveHero=function(n){
    if(!this.hero)return;const [x,y]=this.__nodePointV039(n),k=this.__mapLayoutV039.k;this.busy=true;
    this.tweens.add({targets:this.hero,x,y:y-23*k,duration:240,ease:'Sine.easeInOut',onComplete:()=>{this.busy=false;}});
  };
  WM.create=function(){
    this.__v039RestartQueued=false;
    document.documentElement.dataset.kelvorScreen='world-map';
    this.save=P.KelvorCampaignRC1.load();this.world=this.save.currentWorld||'W01';if(!this.save.worlds[this.world]?.unlocked)this.world='W01';
    const p=(this.save.selected||'W01_L01').split('_');this.selected=(p[0]===this.world&&this.save.worlds[this.world].nodes[p.slice(1).join('_')]!=='LOCKED')?p.slice(1).join('_'):'L01';
    this.eventsLog=[];this.dynamic=[];this.nodes={};this.busy=false;this.buildUI();this.renderWorld();
    this.input.keyboard?.on('keydown-LEFT',()=>this.moveSelection(-1));this.input.keyboard?.on('keydown-A',()=>this.moveSelection(-1));this.input.keyboard?.on('keydown-RIGHT',()=>this.moveSelection(1));this.input.keyboard?.on('keydown-D',()=>this.moveSelection(1));this.input.keyboard?.on('keydown-ENTER',()=>this.enterSelected());this.input.keyboard?.on('keydown-Q',()=>this.switchWorld?.(-1));this.input.keyboard?.on('keydown-E',()=>this.switchWorld?.(1));
    this.__v039={screen:'world-map',orientation:this.__portraitV039?'portrait':'landscape',stable:true,dualLayout:true};
    window.__KELVOR_CAMPAIGN_MAP_SCENE__=this;window.__KELVOR_CAMPAIGN_MAP_READY__=true;window.__KELVOR_WORLD_MAP_V039__=this;
    bindDeterministicResize(this,'map');
    P.AudioServiceRC25?.playMusic(this,'MUS_GLOBAL_WORLD_MAP',true,{gain:.62});
  };
}
window.__KELVOR_RC39_MENU_MAP_V039_READY__=true;
})(PlatformerSNESV04);
