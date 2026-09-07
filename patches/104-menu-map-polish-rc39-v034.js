(function(P){
'use strict';
// RC39 v034 — Menu + World Map + mobile navigation polish.
// Presentation/UX only. No player physics, combat values, enemy HP, save schema,
// level geometry, gate requirements or progression thresholds are changed.

const GOLD=0xf6d77a, GOLD2=0xffefad, NAVY=0x071827, PANEL=0x0c2237, PANEL2=0x153955;
const txt=(scene,x,y,text,style={},depth=100)=>scene.add.text(x,y,text,{fontFamily:'monospace',fontSize:'10px',color:'#ffffff',...style}).setDepth(depth);

function addFireflies(scene,count,w,h,depth=2){
  const arr=[];
  if(!P.GameSettingsV10?.get?.('menuMotion'))return arr;
  for(let i=0;i<count;i++){
    const c=scene.add.circle(Phaser.Math.Between(30,w-30),Phaser.Math.Between(70,h-50),Phaser.Math.Between(1,2),i%3===0?0xffe785:0x9ee8c5,Phaser.Math.FloatBetween(.14,.34)).setDepth(depth);
    scene.tweens.add({targets:c,y:c.y-Phaser.Math.Between(20,54),x:c.x+Phaser.Math.Between(-14,14),alpha:0,duration:Phaser.Math.Between(1800,3400),delay:Phaser.Math.Between(0,900),repeat:-1,onRepeat:()=>{c.setPosition(Phaser.Math.Between(30,scene.scale.width-30),scene.scale.height-Phaser.Math.Between(35,110)).setAlpha(Phaser.Math.FloatBetween(.14,.34));}});
    arr.push(c);
  }
  return arr;
}

const Menu=P.MainMenuSceneV10;
if(Menu){
  Menu.prototype.create=function(){
    document.documentElement.dataset.kelvorScreen='main-menu';
    const w=this.scale.width,h=this.scale.height;
    this.cameras.main.setBackgroundColor('#071827');
    const skyA=this.add.rectangle(w/2,h*.22,w,h*.44,0x173f60,1).setDepth(-90);
    const skyB=this.add.rectangle(w/2,h*.67,w,h*.70,0x0b2438,1).setDepth(-89);
    const sun=this.add.circle(w*.77,h*.25,72,0xf9d987,.08).setDepth(-88);
    const far=this.add.tileSprite(0,h*.39,w+40,160,P.PARALLAX_FAR).setOrigin(0,0).setDepth(-70).setAlpha(.72);
    const mid=this.add.tileSprite(0,h*.51,w+40,150,P.PARALLAX_MID).setOrigin(0,0).setDepth(-69).setAlpha(.82);
    const near=this.add.tileSprite(0,h*.64,w+40,130,P.PARALLAX_NEAR).setOrigin(0,0).setDepth(-68).setAlpha(.90);
    const floor=this.add.rectangle(w/2,h-22,w,44,0x061522,.96).setDepth(-20);
    const leftGlow=this.add.ellipse(w*.30,h*.28,330,120,0x6bd7b1,.05).setDepth(-60);
    const heroGlow=this.add.ellipse(w*.76,h*.77,185,34,0xffdf79,.12).setDepth(-10);
    addFireflies(this,22,w,h,-5);
    const titleShadow=this.add.text(w*.30,h*.125,'KELVOR',{fontFamily:'Arial Black, sans-serif',fontSize:'58px',fontStyle:'bold',color:'#05111d',stroke:'#05111d',strokeThickness:9}).setOrigin(.5).setDepth(6);
    const title=this.add.text(w*.30,h*.115,'KELVOR',{fontFamily:'Arial Black, sans-serif',fontSize:'58px',fontStyle:'bold',color:'#fff2ad',stroke:'#a65e27',strokeThickness:2,shadow:{offsetX:2,offsetY:4,color:'#000000',blur:0,stroke:true,fill:true}}).setOrigin(.5).setDepth(7);
    const chapter=txt(this,w*.30,h*.235,'MUNDO 1  •  O DESPERTAR',{fontSize:'9px',fontStyle:'bold',color:'#b7eac0',letterSpacing:1},8).setOrigin(.5);
    const sub=txt(this,w*.30,h*.285,'UMA AVENTURA PARA DESCOBRIR, EXPLORAR E VENCER',{fontSize:'8px',color:'#d7e7f1',letterSpacing:.5},8).setOrigin(.5);
    const heroPlatform=this.add.image(w*.76,h*.765,P.PHASE01_TEXTURE,'phase_01_grassland/terrain/023').setOrigin(.5,0).setScale(.96).setDepth(3);
    const hero=this.add.sprite(w*.76,h*.765,P.HERO_TEXTURE,'hero/idle/frame_00').setOrigin(.5,1).setScale(1.08).setDepth(5);hero.play('hero_idle');
    const badgeBg=this.add.rectangle(w*.76,h*.865,174,25,0x071827,.82).setStrokeStyle(1,0xcce6aa,.42).setDepth(5);
    const badge=txt(this,w*.76,h*.865,'PLANÍCIES VERDES',{fontSize:'8px',fontStyle:'bold',color:'#e8f7d0'},6).setOrigin(.5);
    if(P.GameSettingsV10?.get?.('menuMotion')){
      this.tweens.add({targets:heroGlow,scaleX:1.2,alpha:.05,duration:1500,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.tweens.add({targets:[hero,heroPlatform],y:'-=2',duration:1700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.tweens.add({targets:sun,alpha:.13,scale:1.12,duration:2200,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    const bx=w*.30, by=h*.47;
    const start=new P.PixelButtonV10(this,bx,by,300,44,'JOGAR AGORA',()=>this.startAdventure(true));
    start.box.setFillStyle(0x183e53,.98).setStrokeStyle(2,GOLD2,.98);start.label.setColor('#fff2ad').setFontSize(13);
    const startAura=this.add.rectangle(bx,by,314,56,0x000000,0).setStrokeStyle(1,0xffefad,.28).setDepth(18);
    if(P.GameSettingsV10?.get?.('menuMotion'))this.tweens.add({targets:startAura,alpha:{from:.28,to:.05},scaleX:{from:1,to:1.035},scaleY:{from:1,to:1.16},duration:1200,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    const music=new P.PixelButtonV10(this,bx-84,by+58,150,32,'MÚSICA',()=>this.scene.start('MusicPlayerSceneV10'));
    const options=new P.PixelButtonV10(this,bx+84,by+58,150,32,'OPÇÕES',()=>this.scene.start('OptionsSceneV10'));
    const credits=new P.PixelButtonV10(this,bx,by+99,150,28,'CRÉDITOS',()=>this.scene.start('CreditsSceneV10'));
    const fs=new P.PixelButtonV10(this,w-91,27,164,30,'⛶  TELA CHEIA',()=>this.scale.toggleFullscreen({navigationUI:'hide'}));
    this.ui=[start,music,options,credits,fs];this.setSelection(0);this.makeKeyset();
    txt(this,16,h-14,'DENNYS PAVANELLI',{fontSize:'7px',color:'#89a8b9'},30).setOrigin(0,1);
    txt(this,w-16,h-14,'MOBILE  •  DESKTOP',{fontSize:'7px',color:'#89a8b9'},30).setOrigin(1,1);
    P.AudioServiceRC25?.playMusic(this,'MUS_GLOBAL_TITLE',true,{gain:.54});
    const layout=()=>{
      const nw=this.scale.width,nh=this.scale.height;
      skyA.setPosition(nw/2,nh*.22).setDisplaySize(nw,nh*.44);skyB.setPosition(nw/2,nh*.67).setDisplaySize(nw,nh*.70);sun.setPosition(nw*.77,nh*.25);
      far.setPosition(0,nh*.39).setSize(nw+40,160);mid.setPosition(0,nh*.51).setSize(nw+40,150);near.setPosition(0,nh*.64).setSize(nw+40,130);floor.setPosition(nw/2,nh-22).setDisplaySize(nw,44);
      leftGlow.setPosition(nw*.30,nh*.28);heroGlow.setPosition(nw*.76,nh*.77);titleShadow.setPosition(nw*.30,nh*.125);title.setPosition(nw*.30,nh*.115);chapter.setPosition(nw*.30,nh*.235);sub.setPosition(nw*.30,nh*.285);
      heroPlatform.setPosition(nw*.76,nh*.765);hero.setPosition(nw*.76,nh*.765);badgeBg.setPosition(nw*.76,nh*.865);badge.setPosition(nw*.76,nh*.865);
      const x=nw*.30,y=nh*.47;
      for(const [b,px,py] of [[start,x,y],[music,x-84,y+58],[options,x+84,y+58],[credits,x,y+99],[fs,nw-91,27]]){b.box.setPosition(px,py);b.label.setPosition(px,py);}
      startAura.setPosition(x,y);
    };
    this.scale.on(Phaser.Scale.Events.RESIZE,layout);this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.scale.off(Phaser.Scale.Events.RESIZE,layout));
    this.__v034={screen:'menu',premium:true,fullscreenVisible:true};
    window.__KELVOR_MAIN_MENU_V034__=this;
  };
}

function addBackButton(scene,label='←  VOLTAR'){
  if(scene.__backV034)return scene.__backV034;
  const b=new P.PixelButtonV10(scene,65,21,110,28,label,()=>scene.scene.start('MainMenuSceneV10'));
  b.box.setFillStyle(0x0b2439,.96).setStrokeStyle(1,GOLD,.75);b.label.setFontSize(9);
  scene.__backV034=b;return b;
}
function polishSecondary(scene,titlePt){
  for(const o of scene.children?.list||[]){
    if(o?.type==='Text'&&/ESC\s*\/\s*B\s*BACK/i.test(String(o.text||'')))o.setVisible(false);
    if(o?.type==='Text'&&['OPTIONS','MUSIC PLAYER'].includes(String(o.text||'')))o.setText(titlePt).setOrigin(.5,0).setPosition(scene.scale.width/2,11).setStyle({fontFamily:'Arial Black, sans-serif',fontSize:'20px',color:'#fff1ae'});
  }
  addBackButton(scene);
}
const Opt=P.OptionsSceneV10?.prototype;
if(Opt){
  const oldCreate=Opt.create;Opt.create=function(...a){const r=oldCreate.apply(this,a);polishSecondary(this,'OPÇÕES');this.__v034={mobileBack:true};return r;};
  const oldTabs=Opt.buildTabs;Opt.buildTabs=function(...a){const r=oldTabs.apply(this,a);const tr={AUDIO:'ÁUDIO',GAMEPLAY:'JOGABILIDADE',CONTROLS:'CONTROLES',DISPLAY:'TELA'};for(const o of this.tabObjects||[])if(o?.type==='Text'&&tr[o.text])o.setText(tr[o.text]);return r;};
  const oldPage=Opt.buildPage;Opt.buildPage=function(...a){const r=oldPage.apply(this,a);const tr={
    'MASTER VOLUME':'VOLUME GERAL','MUSIC VOLUME':'VOLUME DA MÚSICA','SFX VOLUME':'EFEITOS SONOROS','AMBIENCE VOLUME':'AMBIÊNCIA','UI VOLUME':'SONS DA INTERFACE','MUTE WHEN APP IS IN BACKGROUND':'SILENCIAR AO SAIR DO APP',
    'AUTO GAMEPLAY / AI DEMO':'DEMO AUTOMÁTICA / IA','SHOW CONTROL HINTS':'MOSTRAR DICAS DE CONTROLE','FULLSCREEN WHEN PLAY IS TAPPED':'TELA CHEIA AO JOGAR','ANIMATED MENU BACKGROUND':'FUNDO DE MENU ANIMADO',
    'TOUCH CONTROLS':'CONTROLES DE TOQUE','LEFT-HANDED TOUCH LAYOUT':'LAYOUT PARA CANHOTO','JOYSTICK SIZE':'TAMANHO DO JOYSTICK','TOUCH CONTROL OPACITY':'OPACIDADE DOS CONTROLES','ACTION BUTTON SIZE':'TAMANHO DOS BOTÕES','TOUCH HAPTIC FEEDBACK':'VIBRAÇÃO TÁTIL',
    'CAMERA SHAKE':'TREMER CÂMERA','REDUCE BRIGHT FLASHES':'REDUZIR FLASHES','RESET ALL OPTIONS TO DEFAULT':'RESTAURAR PADRÕES'};
    for(const o of this.rowObjects||[])if(o?.type==='Text'&&tr[o.text])o.setText(tr[o.text]);
    if(this.note?.active)this.note.setText('Configurações salvas automaticamente.').setColor('#92adbd');return r;};
}
const Credits=P.CreditsSceneV10?.prototype;if(Credits){const old=Credits.create;Credits.create=function(...a){const r=old.apply(this,a);addBackButton(this);return r;};}
const Music=P.MusicPlayerSceneV10?.prototype;if(Music){const old=Music.create;Music.create=function(...a){const r=old.apply(this,a);polishSecondary(this,'MÚSICA');return r;};}

const WMProto=P.WorldMapSceneRC1?.prototype;
if(WMProto){
  function buildWorldChrome(s){
    if(s.__mapChromeV034)return;
    const w=s.scale.width,h=s.scale.height;
    const bg0=s.add.rectangle(w/2,h/2,w,h,0x061622,1).setDepth(-120).setScrollFactor(0);
    const far=s.add.tileSprite(0,h*.48,w+40,150,P.PARALLAX_FAR).setOrigin(0,0).setAlpha(.27).setDepth(-110).setScrollFactor(0);
    const mid=s.add.tileSprite(0,h*.65,w+40,118,P.PARALLAX_MID).setOrigin(0,0).setAlpha(.22).setDepth(-109).setScrollFactor(0);
    const vign=s.add.rectangle(w/2,h/2,w,h,0x03101b,.30).setDepth(-100).setScrollFactor(0);
    const mapPanel=s.add.rectangle(w*.60,h*.49,Math.min(w*.57,430),Math.min(h*.80,310),0x0a2132,.36).setStrokeStyle(1,0xa6d69a,.28).setDepth(-30).setScrollFactor(0);
    const mapGlow=s.add.ellipse(w*.60,h*.51,Math.min(w*.52,390),Math.min(h*.62,230),0x6bd7a2,.06).setDepth(-29).setScrollFactor(0);
    const topCard=s.add.rectangle(w*.21,68,Math.min(w*.34,300),92,0x071827,.88).setStrokeStyle(1,GOLD,.45).setDepth(3010).setScrollFactor(0);
    const eyebrow=txt(s,26,33,'CAPÍTULO 1',{fontSize:'8px',fontStyle:'bold',color:'#8ed6aa',letterSpacing:1},3011).setScrollFactor(0);
    const worldTitle=txt(s,26,51,'PLANÍCIES VERDES',{fontFamily:'Arial Black, sans-serif',fontSize:'19px',color:'#fff1ad'},3011).setScrollFactor(0);
    const worldDesc=txt(s,26,80,'Uma trilha viva entre raízes,\nruínas e segredos da floresta.',{fontSize:'7px',color:'#b8cfda',lineSpacing:3},3011).setScrollFactor(0);
    const nodeCard=s.add.rectangle(w*.21,h-64,Math.min(w*.35,320),84,0x071827,.90).setStrokeStyle(1,0x7cae87,.42).setDepth(3010).setScrollFactor(0);
    const nodeTitle=txt(s,26,h-88,'',{fontSize:'11px',fontStyle:'bold',color:'#fff4c0'},3011).setScrollFactor(0);
    const nodeState=txt(s,26,h-67,'',{fontSize:'8px',color:'#9fd5af'},3011).setScrollFactor(0);
    const nodeHint=txt(s,26,h-48,'← / → escolher   •   JOGAR para entrar',{fontSize:'7px',color:'#8ba6b6'},3011).setScrollFactor(0);
    const prev=new P.PixelButtonV10(s,w*.49,h-34,102,30,'‹  ANTERIOR',()=>s.moveSelection(-1));
    const play=new P.PixelButtonV10(s,w*.64,h-34,142,34,'JOGAR FASE',()=>s.enterSelected());play.box.setFillStyle(0x183e53,.98).setStrokeStyle(2,GOLD2,.95);play.label.setColor('#fff2ad');
    const next=new P.PixelButtonV10(s,w*.79,h-34,102,30,'PRÓXIMA  ›',()=>s.moveSelection(1));
    const fs=new P.PixelButtonV10(s,w-78,22,130,28,'⛶  TELA CHEIA',()=>s.scale.toggleFullscreen({navigationUI:'hide'}));
    const dots=[];for(let i=0;i<5;i++){const x=w-166+i*23;const c=s.add.circle(x,57,7,i===0?0x6ec678:0x162b3c,i===0?.95:.72).setStrokeStyle(1,i===0?0xd9edaa:0x4a6171,.7).setDepth(3012).setScrollFactor(0);const t=txt(s,x,57,String(i+1),{fontSize:'6px',fontStyle:'bold',color:i===0?'#071827':'#8da2af'},3013).setOrigin(.5).setScrollFactor(0);dots.push(c,t);}
    addFireflies(s,18,w,h,-22);
    if(P.GameSettingsV10?.get?.('menuMotion'))s.tweens.add({targets:mapGlow,alpha:{from:.04,to:.095},scaleX:{from:.96,to:1.04},scaleY:{from:.96,to:1.04},duration:1900,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    s.prev?.setVisible(false).disableInteractive?.();s.enter?.setVisible(false).disableInteractive?.();s.next?.setVisible(false).disableInteractive?.();s.worldPrevRC9?.setVisible(false).disableInteractive?.();s.worldNextRC9?.setVisible(false).disableInteractive?.();s.title?.setVisible(false);s.status?.setVisible(false);
    s.__mapChromeV034={bg0,far,mid,vign,mapPanel,mapGlow,topCard,eyebrow,worldTitle,worldDesc,nodeCard,nodeTitle,nodeState,nodeHint,prev,play,next,fs,dots};
    const layout=()=>{const nw=s.scale.width,nh=s.scale.height,c=s.__mapChromeV034;c.bg0.setPosition(nw/2,nh/2).setDisplaySize(nw,nh);c.far.setPosition(0,nh*.48).setSize(nw+40,150);c.mid.setPosition(0,nh*.65).setSize(nw+40,118);c.vign.setPosition(nw/2,nh/2).setDisplaySize(nw,nh);c.mapPanel.setPosition(nw*.60,nh*.49).setDisplaySize(Math.min(nw*.57,430),Math.min(nh*.80,310));c.mapGlow.setPosition(nw*.60,nh*.51).setDisplaySize(Math.min(nw*.52,390),Math.min(nh*.62,230));c.topCard.setPosition(nw*.21,68).setDisplaySize(Math.min(nw*.34,300),92);c.nodeCard.setPosition(nw*.21,nh-64).setDisplaySize(Math.min(nw*.35,320),84);c.eyebrow.setPosition(26,33);c.worldTitle.setPosition(26,51);c.worldDesc.setPosition(26,80);c.nodeTitle.setPosition(26,nh-88);c.nodeState.setPosition(26,nh-67);c.nodeHint.setPosition(26,nh-48);for(const [b,x,y] of [[c.prev,nw*.49,nh-34],[c.play,nw*.64,nh-34],[c.next,nw*.79,nh-34],[c.fs,nw-78,22]]){b.box.setPosition(x,y);b.label.setPosition(x,y);}for(let i=0;i<5;i++){const x=nw-166+i*23;c.dots[i*2].setPosition(x,57);c.dots[i*2+1].setPosition(x,57);}};
    s.scale.on(Phaser.Scale.Events.RESIZE,layout);s.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>s.scale.off(Phaser.Scale.Events.RESIZE,layout));
  }
  function refreshWorldChrome(s){const c=s.__mapChromeV034;if(!c)return;const names={L01:'TRILHA DO DESPERTAR',L02:'CLAREIRA DAS RAÍZES',L03:'COPAS AO VENTO',SECRET:'COPA OCULTA',BOSS:'FOREST GUARDIAN'};const states={AVAILABLE:'DISPONÍVEL',CURRENT:'ATUAL',COMPLETED:'CONCLUÍDA',MASTERED:'DOMINADA',BOSS_AVAILABLE:'CHEFE LIBERADO',BOSS_DEFEATED:'CHEFE DERROTADO'};const st=s.save?.worlds?.[s.world]?.nodes?.[s.selected]||'';c.nodeTitle.setText(names[s.selected]||s.selected);c.nodeState.setText(states[st]||st);if(s.selection?.active&&P.GameSettingsV10?.get?.('menuMotion')&&!s.selection.__pulseV034){s.selection.__pulseV034=true;s.tweens.add({targets:s.selection,scaleX:'*=1.14',scaleY:'*=1.14',alpha:{from:.55,to:1},duration:680,yoyo:true,repeat:-1,ease:'Sine.inOut'});}}
  const oldCreate=WMProto.create;WMProto.create=function(...a){const r=oldCreate.apply(this,a);buildWorldChrome(this);refreshWorldChrome(this);this.__v034={screen:'world-map',animated:true,technicalButtonsHidden:true};return r;};
  const oldSelect=WMProto.selectNode;WMProto.selectNode=function(...a){const r=oldSelect.apply(this,a);refreshWorldChrome(this);return r;};
  const oldRender=WMProto.renderWorld;WMProto.renderWorld=function(...a){const r=oldRender.apply(this,a);if(this.__mapChromeV034){this.prev?.setVisible(false);this.enter?.setVisible(false);this.next?.setVisible(false);this.worldPrevRC9?.setVisible(false);this.worldNextRC9?.setVisible(false);this.title?.setVisible(false);this.status?.setVisible(false);refreshWorldChrome(this);}return r;};
}

window.__KELVOR_RC39_MENU_MAP_V034_READY__=true;
})(PlatformerSNESV04);
