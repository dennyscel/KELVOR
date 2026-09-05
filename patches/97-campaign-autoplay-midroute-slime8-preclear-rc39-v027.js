(function(P){
'use strict';
// INPUT-ONLY RC39 robustness patch for optional slime #8 between SEAL_DAWN and Gate B.
// Authored slime #8 patrols x=16240..16860 and the next pit begins at x=17180.
// Clear it on continuous ground before committing to that pit. No physics, collision,
// hitbox, player/enemy HP, damage, save, collectible, gate or PASS-rule changes.
const C=P.CampaignAutoplayRC39V026;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function enemyAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const slime=enemyAt(s,8),seals=s.sealsCollectedRC37||0,x=p.x;
  if(seals>=1&&slime&&x>=16170&&x<17070&&s.lifeCycle==='active'){
    if(!this.__midRouteV027)this.__midRouteV027={preclear:true,attacks:0,startedAtX:Math.round(x)};
    const n=this.__midRouteV027,d=slime.sprite.x-x,ad=Math.abs(d);
    // Keep the encounter inside the broad safe lane and away from the pit at 17180.
    let axis;
    if(x<16230)axis=.55;
    else if(x>16920)axis=-.48;
    else if(d>118)axis=.38;
    else if(d>82)axis=.18;
    else if(d>=10)axis=-.28;
    else if(d>-45)axis=-.18;
    else axis=.22;
    if(ad<=122){
      if(this.pulseAttack(t,'midroute_v027_slime8_attack',125))n.attacks++;
      if(p.grounded&&d>=0&&d<52&&t>=this.nextJumpAt)this.pulseJump(t,'midroute_v027_slime8_spacing_jump',250);
    }
    drive(this,axis,true);return;
  }
  if(this.__midRouteV027?.preclear&&(!slime||!slime.alive)){
    this.__midRouteV027.preclear=false;this.__midRouteV027.clearedAtX=Math.round(x);
    this.log('midroute_v027_slime8_cleared',{x:Math.round(x),attacks:this.__midRouteV027.attacks});
    this.jumpUntil=0;this.attackUntil=0;
  }
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V027_INPUT_ONLY_MIDROUTE_SLIME8_PRECLEAR';o.midRouteV027=this.__midRouteV027||null;return o;};
P.CampaignAutoplayRC39V027=C;window.__KELVOR_RC39_V027_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
