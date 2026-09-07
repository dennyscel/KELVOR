(function(P){
'use strict';
// RC39 v040 — focused stabilization over v039 after repeated orientation QA.
// Scope: menu/map presentation + scene resize lifecycle only.
// No gameplay physics, combat, save thresholds or level geometry changes.
const RESIZE=Phaser.Scale.Events.RESIZE;

function installSafeResize(scene,tag){
  // Disable v039's legacy resize callback without touching Phaser's global Scale listeners.
  scene.__v039RestartQueued=true;
  scene.__v040Size=`${scene.scale.width}x${scene.scale.height}`;
  scene.__v040ResizeQueued=false;
  const onResize=()=>{
    const now=`${scene.scale.width}x${scene.scale.height}`;
    if(now===scene.__v040Size||scene.__v040ResizeQueued)return;
    scene.__v040ResizeQueued=true;
    if(scene.__v040ResizeTimer?.remove)scene.__v040ResizeTimer.remove(false);
    scene.__v040ResizeTimer=scene.time.delayedCall(150,()=>{
      scene.__v040ResizeTimer=null;
      if(!scene.scene.isActive())return;
      scene.scene.restart({v040Resize:true,tag});
    });
  };
  scene.scale.on(RESIZE,onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
    scene.scale.off(RESIZE,onResize);
    if(scene.__v040ResizeTimer?.remove)scene.__v040ResizeTimer.remove(false);
    scene.__v040ResizeTimer=null;
    scene.__v040ResizeQueued=false;
  });
}
function portraitPosterBackdrop(scene){
  const L=scene.__layoutV039,bg=L?.bg;if(!bg)return;
  bg.far?.setAlpha(0);bg.mid?.setAlpha(0);bg.near?.setAlpha(0);
  const w=scene.scale.width,h=scene.scale.height;
  const art=scene.add.image(w/2,h,P.PARALLAX_NEAR).setOrigin(.5,1).setDepth(-77).setAlpha(.78);
  art.setDisplaySize(w,Math.min(210,h*.205));
  const mist=scene.add.rectangle(w/2,h-Math.min(210,h*.205),w,22,0x102f3d,.34).setDepth(-76);
  scene.__portraitPosterV040={art,mist};
}

const Menu=P.MainMenuSceneV10?.prototype;
if(Menu){
  const old=Menu.create;
  Menu.create=function(...a){
    const r=old.apply(this,a);
    const portrait=this.__v039?.orientation==='portrait';
    if(portrait)portraitPosterBackdrop(this);
    installSafeResize(this,'menu');
    this.__v040={stableResize:true,portraitPoster:portrait};
    window.__KELVOR_MAIN_MENU_V040__=this;
    return r;
  };
}

const WM=P.WorldMapSceneRC1?.prototype;
if(WM){
  function fitMap(scene){
    const L=scene.__mapLayoutV039,map=L?.map;if(!map?.active)return;
    const w=scene.scale.width,h=scene.scale.height,portrait=scene.__v039?.orientation==='portrait';
    const leftW=portrait?0:Math.min(300,w*.265),areaL=portrait?0:leftW+24,areaW=portrait?w:w-areaL-18;
    L.cx=portrait?w/2:areaL+areaW*.54;
    L.cy=portrait?h*.345:h*.43;
    const maxW=portrait?w*.84:Math.min(areaW*.82,620);
    const maxH=portrait?h*.50:h*.87;
    const scale=Math.min(maxW/map.width,maxH/map.height);
    map.setPosition(L.cx,L.cy).setScale(scale).setAlpha(1).setVisible(true);
    L.scale=scale;L.k=scale/(270/327);L.maxW=maxW;L.maxH=maxH;
    for(const [name,sp] of Object.entries(scene.nodes||{})){
      if(!sp?.active)continue;const [x,y]=scene.__nodePointV039(name);sp.setPosition(x,y).setScale(Math.max(.40,Math.min(.78,.46*L.k)));
    }
    const [sx,sy]=scene.__nodePointV039(scene.selected);
    scene.selection?.setPosition(sx,sy).setScale(Math.max(.48,Math.min(.86,.54*L.k)));
    scene.hero?.setPosition(sx,sy-23*L.k).setScale(Math.max(.42,Math.min(.70,.44*L.k)));
    if(!scene.__mapGlowV040?.active){
      scene.__mapGlowV040=scene.add.ellipse(L.cx,L.cy,map.displayWidth*1.02,map.displayHeight*.82,0x7adf9d,.065).setDepth(7);
    }else scene.__mapGlowV040.setPosition(L.cx,L.cy).setDisplaySize(map.displayWidth*1.02,map.displayHeight*.82).setAlpha(.065);
  }
  const oldRender=WM.renderWorld;
  WM.renderWorld=function(...a){const r=oldRender.apply(this,a);fitMap(this);return r;};
  const oldCreate=WM.create;
  WM.create=function(...a){
    const r=oldCreate.apply(this,a);
    fitMap(this);
    installSafeResize(this,'map');
    this.__v040={stableResize:true,mapFocus:true};
    window.__KELVOR_WORLD_MAP_V040__=this;
    return r;
  };
}
window.__KELVOR_RC39_MENU_MAP_V040_READY__=true;
})(PlatformerSNESV04);
