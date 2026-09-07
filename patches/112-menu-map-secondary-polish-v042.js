(function(P){
'use strict';
// RC39 v042 — portrait art, authored map nodes/routes, secondary-menu mobile reflow.
// Presentation/UX only. Gameplay physics/progression unchanged.
const GOLD=0xf6d77a, MINT=0xa8dda6, PANEL=0x071827;
const portrait=s=>s.scale.height>s.scale.width*1.05;
const moveButton=(b,x,y)=>{if(!b)return;b.box.setPosition(x,y);b.label.setPosition(x,y);};

const Menu=P.MainMenuSceneV10?.prototype;
if(Menu){
  const old=Menu.create;
  Menu.create=function(...a){
    const r=old.apply(this,a),L=this.__layoutV039;
    if(!portrait(this)||!L)return r;
    const w=this.scale.width,h=this.scale.height;
    if(this.textures.exists('campaign_world01_map')){
      const aura=this.add.ellipse(w/2,h*.405,Math.min(w*.78,450),Math.min(w*.58,330),0x7bd39d,.035).setDepth(.5);
      const world=this.add.image(w/2,h*.405,'campaign_world01_map').setDepth(1).setAlpha(.18);
      const dw=Math.min(w*.70,420);world.setDisplaySize(dw,dw*(327/336));
      this.__storyWorldV042={aura,world};
      if(P.GameSettingsV10?.get?.('menuMotion')!==false)this.tweens.add({targets:world,alpha:{from:.14,to:.22},scale:{from:world.scaleX*.985,to:world.scaleX*1.015},duration:2800,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    L.badge.setPosition(w/2,h*.495);
    moveButton(L.start,w/2,h*.575);moveButton(L.music,w*.29,h*.655);moveButton(L.options,w*.71,h*.655);moveButton(L.credits,w/2,h*.725);
    const p=this.__portraitPremiumV041;if(p?.panel)p.panel.setPosition(w/2,h*.655).setDisplaySize(Math.min(w*.84,400),Math.min(h*.205,205));
    this.__v042={portraitStory:true,compactFlow:true};
    window.__KELVOR_MAIN_MENU_V042__=this;return r;
  };
}

const NORM={L01:[.52,.79],L02:[.73,.58],L03:[.40,.49],SECRET:[.79,.72],BOSS:[.52,.27]};
const WM=P.WorldMapSceneRC1?.prototype;
if(WM){
  WM.__nodePointV039=function(n){
    const L=this.__mapLayoutV039,p=NORM[n]||NORM.L01,map=L.map;
    return [map.x+(p[0]-.5)*map.displayWidth,map.y+(p[1]-.5)*map.displayHeight];
  };
  function route(scene){
    if(!scene.__mapLayoutV039?.map)return;
    const g=scene.add.graphics().setDepth(18),pt=n=>scene.__nodePointV039(n);
    g.lineStyle(2,0xe7e6a1,.28);
    const chains=[['L01','L02','L03','BOSS'],['L02','SECRET']];
    for(const chain of chains)for(let i=0;i<chain.length-1;i++){const a=pt(chain[i]),b=pt(chain[i+1]);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.strokePath();}
    for(const n of Object.keys(NORM)){const q=pt(n);g.fillStyle(n==='BOSS'?0xffe58a:0xb9dfad,.24);g.fillCircle(q[0],q[1],4);}
    scene.dynamic?.push(g);scene.__routeV042=g;
    const c=scene.__mapChromeV039;
    if(portrait(scene)&&c){
      c.nodeCard.setFillStyle(PANEL,.90).setStrokeStyle(1,GOLD,.28);
      c.nodeTitle.setColor('#fff1ae');c.nodeState.setColor('#a9dfb2');c.nodeHint.setColor('#8ea9b8');
    }
  }
  const old=WM.renderWorld;
  WM.renderWorld=function(...a){const r=old.apply(this,a);route(this);return r;};
  const oldCreate=WM.create;
  WM.create=function(...a){const r=oldCreate.apply(this,a);this.__v042={authoredNodes:true,route:true};window.__KELVOR_WORLD_MAP_V042__=this;return r;};
}

function singlePortraitBackdrop(scene){
  if(!portrait(scene))return;
  for(const o of scene.children?.list||[])if(o?.type==='TileSprite')o.setVisible(false);
  const w=scene.scale.width,h=scene.scale.height;
  const img=scene.add.image(w/2,h,P.PARALLAX_NEAR).setOrigin(.5,1).setDepth(-70).setAlpha(.62);
  img.setDisplaySize(w,Math.min(165,h*.17));scene.__secondaryBackdropV042=img;
}
function enlargeBack(scene){
  const b=scene.__backV034;if(!b)return;
  b.box.setPosition(72,30).setSize(124,40).setDisplaySize(124,40).setFillStyle(0x0b2439,.97).setStrokeStyle(1,GOLD,.75);
  b.label.setPosition(72,30).setFontSize(9);
}
function groupYs(objects){
  const vals=[];for(const o of objects||[]){if(Number.isFinite(o?.y)){const y=Math.round(o.y);if(!vals.some(v=>Math.abs(v-y)<=2))vals.push(y);}}
  return vals.sort((a,b)=>a-b);
}
function reflowOptions(scene){
  if(!portrait(scene))return;
  const w=scene.scale.width,h=scene.scale.height;singlePortraitBackdrop(scene);enlargeBack(scene);
  const panel=scene.add.rectangle(w/2,h*.38,w*.94,h*.53,0x061522,.42).setStrokeStyle(1,0x7899aa,.18).setDepth(0);
  const tabs=scene.tabObjects||[],ty=92;for(const o of tabs)if(Number.isFinite(o?.y))o.setY(ty);
  const rows=scene.rowObjects||[],ys=groupYs(rows),start=h*.165,end=h*.565;
  const mapY=y=>{let idx=0,best=999;ys.forEach((v,i)=>{const d=Math.abs(v-y);if(d<best){best=d;idx=i;}});return ys.length<2?(start+end)/2:start+idx*(end-start)/(ys.length-1);};
  for(const o of rows){if(!Number.isFinite(o?.y))continue;const ny=mapY(o.y);o.setY(ny);if(o.type==='Rectangle'){o.setPosition(w/2,ny);o.setDisplaySize(w*.90,Math.min(54,(end-start)/Math.max(1,ys.length-1)*.76));}else if(o.type==='Text'){if(o.x<w*.45)o.setX(30);else if(o.x>w*.55)o.setX(w-30);}}
  if(scene.note?.active)scene.note.setPosition(w/2,h*.625).setColor('#9ab1bd');
  scene.__secondaryPanelV042=panel;scene.__v042={portraitReflow:true};
}
const Opt=P.OptionsSceneV10?.prototype;if(Opt){const old=Opt.create;Opt.create=function(...a){const r=old.apply(this,a);reflowOptions(this);window.__KELVOR_OPTIONS_V042__=this;return r;};}
function polishSimple(scene){if(!portrait(scene))return;singlePortraitBackdrop(scene);enlargeBack(scene);const w=scene.scale.width,h=scene.scale.height;scene.add.ellipse(w/2,h*.42,w*.72,h*.34,0x0c2c3e,.12).setDepth(-5);scene.__v042={portraitPolish:true};}
const Music=P.MusicPlayerSceneV10?.prototype;if(Music){const old=Music.create;Music.create=function(...a){const r=old.apply(this,a);polishSimple(this);window.__KELVOR_MUSIC_V042__=this;return r;};}
const Credits=P.CreditsSceneV10?.prototype;if(Credits){const old=Credits.create;Credits.create=function(...a){const r=old.apply(this,a);polishSimple(this);window.__KELVOR_CREDITS_V042__=this;return r;};}
window.__KELVOR_RC39_MENU_MAP_V042_READY__=true;
})(PlatformerSNESV04);
