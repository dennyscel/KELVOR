(function(P){
'use strict';
// INPUT-ONLY RC39 robustness patch for the optional bee immediately after SEAL_DAWN.
// Authored bee #7 patrols x=13320..14140 and the next pit begins at x=14210.
// Clear it on continuous safe ground before committing to the pit. No physics,
// collision, hitbox, player/enemy HP, damage, save, collectible or PASS changes.
const C=P.CampaignAutoplayRC39V025;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function enemyAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const bee=enemyAt(s,7),seals=s.sealsCollectedRC37||0,x=p.x;
  if(seals>=1&&bee&&x>=13300&&x<14165&&s.lifeCycle==='active'){
    if(!this.__postDawnV026)this.__postDawnV026={preclear:true,attacks:0,startedAtX:Math.round(x)};
    const n=this.__postDawnV026,d=bee.sprite.x-x,ad=Math.abs(d);
    // Keep Kelvor on the broad ground lane and never intentionally enter the pit
    // while this bee remains alive. Shadow the bee only inside the safe band.
    let axis;
    if(x<13540)axis=.46;
    else if(x>13935)axis=-.46;
    else axis=clamp(d/420,-.24,.24);
    if(ad<205){
      if(this.pulseAttack(t,'post_dawn_v026_bee7_attack',120))n.attacks++;
      if(p.grounded&&ad<175&&t>=this.nextJumpAt)this.pulseJump(t,'post_dawn_v026_bee7_jump',310);
      else if(!p.grounded&&p.airJumpsRemaining>0&&ad<155&&p.velocityY>20&&t>=this.nextJumpAt)this.pulseJump(t,'post_dawn_v026_bee7_double',270);
    }
    drive(this,axis,true);return;
  }
  if(this.__postDawnV026?.preclear&&(!bee||!bee.alive)){
    this.__postDawnV026.preclear=false;this.__postDawnV026.clearedAtX=Math.round(x);
    this.log('post_dawn_v026_bee7_cleared',{x:Math.round(x),attacks:this.__postDawnV026.attacks});
    this.jumpUntil=0;this.attackUntil=0;
  }
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V026_INPUT_ONLY_POST_DAWN_BEE7_PRECLEAR';o.postDawnV026=this.__postDawnV026||null;return o;};
P.CampaignAutoplayRC39V026=C;window.__KELVOR_RC39_V026_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
