(function(P){
'use strict';
// RC39 v031 — Owner/mobile presentation hotfix derived from physical phone screenshots.
// Scope: presentation + interaction feedback only. No physics, HP, enemy HP, collision,
// authored platform geometry, gate requirements, seals, save schema, timers or PASS thresholds change.
const S=P.World01Level01AAAReferenceSceneRC37;
if(typeof S!=='function')return;
const proto=S.prototype;
const oldBuildParallax=proto.buildParallax;
const oldAddGate=proto.addArenaGateRC37;
const oldUpdateGates=proto.updateArenaGatesRC37;
const oldReachGoal=proto.reachGoal;
const oldUpdateCoins=proto.updateCoinsAndGoal;

function finite(v,d=1){return Number.isFinite(v)?v:d;}
function gateReady(scene,g){
  if(!g||g.open)return true;
  const combat=(g.defeated||0)>=(g.required||0);
  const seals=g.id!=='GATE_C'||(scene.sealsCollectedRC37||0)>=3;
  return combat&&seals;
}
function goalReady(scene){return (scene.sealsCollectedRC37||0)>=3&&!(scene.lockGatesRC37||[]).some(g=>!g.open);}

// Phone evidence showed the horizontal parallax climbing with the camera during jumps.
// Phaser setScrollFactor(singleValue) applies the value to BOTH axes; this level is horizontal,
// so keep horizontal parallax while pinning all sky/horizon layers vertically to the viewport.
proto.buildParallax=function(){
  const before=new Set(this.children?.list||[]);
  const result=oldBuildParallax.call(this);
  const created=(this.children?.list||[]).filter(o=>!before.has(o));
  for(const o of created){
    if(!o||!o.active)continue;
    const depth=finite(o.depth,0);
    // RC37 hand-composed PHASE01 mountain frames at depth -33 include opaque rectangular
    // source backgrounds (not transparency). At alpha .48 they render as the dark floating
    // "banner" seen on the phone. The derived FAR/MID/NEAR parallax beneath them already
    // carries the mountain silhouette, so remove only these redundant overlays.
    if(depth===-33&&o.texture?.key===P.PHASE01_TEXTURE){o.destroy();continue;}
    // Zone tone rectangles created at depth -34 have hard world-space edges and appear as
    // translucent slabs while the camera moves. They are decorative only; remove them.
    if(depth===-34&&o.type==='Rectangle'){o.destroy();continue;}
    if(depth>=-40&&depth<=-24&&typeof o.setScrollFactor==='function'){
      o.setScrollFactor(finite(o.scrollFactorX,0),0);
    }
  }
  for(const c of this.clouds||[]){
    const sp=c?.sprite;if(sp?.active&&typeof sp.setScrollFactor==='function')sp.setScrollFactor(finite(sp.scrollFactorX,.16),0);
  }
  this.__ownerVisualV031={backgroundVerticalLocked:true,opaqueMountainOverlaysRemoved:true,toneSlabsRemoved:true};
  return result;
};

// Make authored combat locks self-explanatory. Requirements are unchanged; the gate still
// opens only through the existing RC37 combat/seal rules.
proto.addArenaGateRC37=function(x,id,arenaId,required){
  const g=oldAddGate.call(this,x,id,arenaId,required);
  if(g){
    g.__ownerLabelV031=this.add.text(x,Math.max(52,(g.visual?.y||300)-(g.visual?.displayHeight||72)-13),'',{
      fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#fff6d0',
      backgroundColor:'#071827dd',padding:{x:5,y:3},align:'center'
    }).setOrigin(.5,1).setDepth(62).setAlpha(0);
  }
  return g;
};

proto.updateArenaGatesRC37=function(){
  const result=oldUpdateGates.call(this);
  const px=this.player?.x??-99999,seals=this.sealsCollectedRC37||0;
  for(const g of this.lockGatesRC37||[]){
    const label=g.__ownerLabelV031;if(!label?.active)continue;
    if(g.open){label.setAlpha(0);continue;}
    const close=Math.abs(px-g.x)<=420;
    if(!close){label.setAlpha(0);continue;}
    const combat=`GUARDIÕES ${Math.min(g.defeated||0,g.required||0)}/${g.required||0}`;
    const text=g.id==='GATE_C'&&seals<3?`PORTÃO SELADO • ${combat} • SELOS ${seals}/3`:`PORTÃO SELADO • ${combat}`;
    label.setText(text).setAlpha(1);
  }
  return result;
};

function ensureGoalHint(scene){
  if(scene.__goalHintV031?.active)return scene.__goalHintV031;
  const g=(scene.coins||[]).find(c=>c.goal)?.sprite;
  if(!g)return null;
  scene.__goalHintV031=scene.add.text(g.x,g.y-58,'',{
    fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#fff6d0',
    backgroundColor:'#071827dd',padding:{x:5,y:3},align:'center'
  }).setOrigin(.5,1).setDepth(64).setAlpha(0);
  return scene.__goalHintV031;
}

// Base collection code marks the goal collectible consumed BEFORE RC37 checks its 3-seal /
// gate prerequisites. If the player touches it early, the old code can make the exit unable
// to trigger later. Reset only that premature consumed flag; the prerequisites themselves stay intact.
proto.reachGoal=function(goal){
  const ready=goalReady(this);
  if(!ready){
    const c=(this.coins||[]).find(x=>x.goal&&x.sprite===goal);if(c)c.collected=false;
    const h=ensureGoalHint(this);if(h){
      const seals=this.sealsCollectedRC37||0,closed=(this.lockGatesRC37||[]).filter(g=>!g.open).length;
      h.setText(`SAÍDA SELADA • SELOS ${seals}/3 • PORTÕES ${3-closed}/3`).setAlpha(1);
      this.time?.delayedCall?.(1300,()=>h?.active&&h.setAlpha(0));
    }
  }
  return oldReachGoal.call(this,goal);
};

// Keep the original collectible collision logic, then add a small mobile-friendly proximity
// tolerance at the final exit. This changes neither prerequisites nor world geometry.
proto.updateCoinsAndGoal=function(){
  const result=oldUpdateCoins.call(this);
  const goal=(this.coins||[]).find(c=>c.goal),p=this.player,h=ensureGoalHint(this);
  if(!goal?.sprite?.active||!p||this.goalReached)return result;
  const near=Math.abs(p.x-goal.sprite.x)<=74&&Math.abs(p.y-goal.sprite.y)<=96;
  if(h){
    if(near&&!goalReady(this)){
      const seals=this.sealsCollectedRC37||0,open=(this.lockGatesRC37||[]).filter(g=>g.open).length;
      h.setText(`SAÍDA SELADA • SELOS ${seals}/3 • PORTÕES ${open}/3`).setAlpha(1);
    }else if(!near)h.setAlpha(0);
  }
  if(near&&goalReady(this)&&!goal.collected){goal.collected=true;this.reachGoal(goal.sprite);}
  return result;
};

const oldSnapshot=proto.rc37Snapshot;
proto.rc37Snapshot=function(){const s=oldSnapshot.call(this);s.ownerVisualV031=this.__ownerVisualV031||null;s.gateFeedbackV031=true;return s;};
window.__KELVOR_RC39_OWNER_VISUAL_V031_READY__=true;
})(PlatformerSNESV04);
