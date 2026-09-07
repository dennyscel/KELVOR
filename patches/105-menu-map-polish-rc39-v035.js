(function(P){
'use strict';
// RC39 v035 — focused visual cleanup after v034 screenshot review.
// Scope: menu/map presentation only; no gameplay/progression/physics changes.

const Menu=P.MainMenuSceneV10?.prototype;
if(Menu){
  const oldCreate=Menu.create;
  Menu.create=function(...a){
    const r=oldCreate.apply(this,a);
    const w=this.scale.width,h=this.scale.height;
    // v034 sun/glow was visually too large and read as an unfinished circular artifact.
    for(const o of this.children?.list||[]){
      if(o?.depth===-88&&(o.type==='Ellipse'||o.type==='Arc')){
        this.tweens?.killTweensOf?.(o);
        o.setScale(1).setAlpha(.025).setPosition(w*.79,h*.285);
        if(o.setDisplaySize)o.setDisplaySize(150,66);
      }
      if(o?.depth===-60&&o.type==='Ellipse'){
        this.tweens?.killTweensOf?.(o);
        o.setScale(1).setAlpha(.025);
        if(o.setDisplaySize)o.setDisplaySize(250,76);
      }
    }
    this.__v035={menuArtifactCleanup:true,legacyGlowTweenRemoved:true};
    return r;
  };
}

const WM=P.WorldMapSceneRC1?.prototype;
if(WM){
  function hideLegacyFullscreen(s){
    const f=s.fullscreenControllerCampaignRC1;
    f?.button?.setVisible(false)?.disableInteractive?.();
    f?.label?.setVisible(false);
  }
  const oldCreate=WM.create;
  WM.create=function(...a){
    const r=oldCreate.apply(this,a);
    hideLegacyFullscreen(this);
    const c=this.__mapChromeV034;
    if(c){
      c.mapPanel?.setFillStyle(0x0a2132,.52).setStrokeStyle(1,0xb8e3a4,.38);
      c.nodeCard?.setFillStyle(0x071827,.96).setStrokeStyle(1,0x9ecf91,.50);
      c.topCard?.setFillStyle(0x071827,.96).setStrokeStyle(1,0xf0d77f,.52);
      c.worldDesc?.setColor('#c9dce5');
      c.nodeHint?.setColor('#9db4c0');
      this.__v035={worldMapLegacyFullscreenHidden:true,visualCleanup:true};
    }
    const relock=()=>hideLegacyFullscreen(this);
    this.scale.on(Phaser.Scale.Events.RESIZE,relock);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.scale.off(Phaser.Scale.Events.RESIZE,relock));
    return r;
  };
  const oldRender=WM.renderWorld;
  WM.renderWorld=function(...a){const r=oldRender.apply(this,a);hideLegacyFullscreen(this);return r;};
}
window.__KELVOR_RC39_MENU_MAP_V035_READY__=true;
})(PlatformerSNESV04);
