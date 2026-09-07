(function(P){
'use strict';
// RC39 v043 — final portrait polish for menu/music/credits after v042 review.
// UI/art only; no gameplay or progression changes.
const GOLD=0xf6d77a;
const portrait=s=>s.scale.height>s.scale.width*1.05;
const Menu=P.MainMenuSceneV10?.prototype;
if(Menu){
  const old=Menu.create;
  Menu.create=function(...a){
    const r=old.apply(this,a);
    if(!portrait(this))return r;
    const w=this.scale.width,h=this.scale.height;
    const frame=this.add.rectangle(w/2,h*.405,Math.min(w*.72,430),Math.min(h*.205,205),0x0a2638,.18).setStrokeStyle(1,0xaad59f,.11).setDepth(.8);
    const art=this.add.image(w/2,h*.405,P.PARALLAX_FAR).setDepth(1).setAlpha(.30);art.setDisplaySize(Math.min(w*.68,410),Math.min(h*.18,180));
    const haze=this.add.ellipse(w/2,h*.43,Math.min(w*.58,340),56,0x92d3ad,.045).setDepth(1.2);
    this.__storyWorldV042={fallback:true,frame,art,haze};
    this.__storyWorldV043=this.__storyWorldV042;
    if(P.GameSettingsV10?.get?.('menuMotion')!==false)this.tweens.add({targets:art,alpha:{from:.23,to:.34},scale:{from:art.scaleX*.99,to:art.scaleX*1.01},duration:2600,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.__v043={menuStoryFallback:true};window.__KELVOR_MAIN_MENU_V043__=this;return r;
  };
}
function relabel(scene,map){for(const o of scene.children?.list||[])if(o?.type==='Text'&&map[o.text])o.setText(map[o.text]);}
const Music=P.MusicPlayerSceneV10?.prototype;
if(Music){
  const old=Music.create;
  Music.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const w=this.scale.width,h=this.scale.height;
    relabel(this,{'◀ PREV':'◀ ANTERIOR','PLAY / STOP':'TOCAR / PARAR','NEXT ▶':'PRÓXIMA ▶','BACK':'VOLTAR','MUSIC PLAYER':'MÚSICA'});
    const disc=this.add.circle(w/2,h*.47,112,0x0b2d40,.52).setStrokeStyle(2,GOLD,.25).setDepth(2);
    const disc2=this.add.circle(w/2,h*.47,72,0x071827,.78).setStrokeStyle(1,0x93c9ac,.22).setDepth(2.1);
    const note=this.add.text(w/2,h*.465,'♪',{fontFamily:'Arial Black, sans-serif',fontSize:'76px',color:'#ffe99b',shadow:{offsetX:2,offsetY:3,color:'#000000',blur:0,fill:true}}).setOrigin(.5).setDepth(3);
    const cap=this.add.text(w/2,h*.595,'TRILHA SONORA DE KELVOR',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#bce1c2'}).setOrigin(.5).setDepth(3);
    if(P.GameSettingsV10?.get?.('menuMotion')!==false){this.tweens.add({targets:disc,angle:360,duration:12000,repeat:-1});this.tweens.add({targets:note,scale:{from:.96,to:1.05},duration:1100,yoyo:true,repeat:-1,ease:'Sine.inOut'});}
    this.__musicArtV043={disc,disc2,note,cap};this.__v043={musicPortrait:true};window.__KELVOR_MUSIC_V043__=this;return r;
  };
}
const Credits=P.CreditsSceneV10?.prototype;
if(Credits){
  const old=Credits.create;
  Credits.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const w=this.scale.width,h=this.scale.height;
    relabel(this,{'DEVELOPED BY':'DESENVOLVIDO POR','GAME DIRECTION':'DIREÇÃO','PROJECT CREATION':'CRIAÇÃO DO PROJETO','BACK TO MENU':'VOLTAR AO MENU'});
    const glow=this.add.ellipse(w/2,h*.49,210,56,0xffe28a,.055).setDepth(2);
    const plat=this.add.image(w/2,h*.515,P.PHASE01_TEXTURE,'phase_01_grassland/terrain/023').setOrigin(.5,0).setScale(.88).setDepth(4);
    const hero=this.add.sprite(w/2,h*.515,P.HERO_TEXTURE,'hero/idle/frame_00').setOrigin(.5,1).setScale(1.06).setDepth(5);hero.play('hero_idle');
    const thanks=this.add.text(w/2,h*.61,'OBRIGADO POR JOGAR',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#ffeaa0'}).setOrigin(.5).setDepth(5);
    const sub=this.add.text(w/2,h*.645,'A aventura está apenas começando.',{fontFamily:'monospace',fontSize:'8px',color:'#a9c6d2'}).setOrigin(.5).setDepth(5);
    if(P.GameSettingsV10?.get?.('menuMotion')!==false)this.tweens.add({targets:[hero,plat],y:'-=2',duration:1700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.__creditsArtV043={glow,plat,hero,thanks,sub};this.__v043={creditsPortrait:true};window.__KELVOR_CREDITS_V043__=this;return r;
  };
}
window.__KELVOR_RC39_MENU_MAP_V043_READY__=true;
})(PlatformerSNESV04);
