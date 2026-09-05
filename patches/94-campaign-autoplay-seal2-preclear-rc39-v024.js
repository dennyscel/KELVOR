(function(P){
'use strict';
// INPUT-ONLY RC39 diagnostic patch. Before SEAL_SPIRIT platform navigation,
// clear the optional Arena-B slime that can remain alive after GATE_B already opens.
// No enemy HP, player HP, physics, collision, hitbox, save state or PASS rule changes.
const C=P.CampaignAutoplayRC39V023;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function enemyAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function gateAt(s,id){return s.lockGatesRC37?.find(g=>g.id===id)||null;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const slime=enemyAt(s,12),gateB=gateAt(s,'GATE_B'),seals=s.sealsCollectedRC37||0,x=p.x;
  // Only intervene when Dawn is already collected and Gate B is already legitimately open.
  // This keeps the patch from helping satisfy the arena requirement itself.
  if(seals===1&&gateB?.open&&slime&&x>=21440&&x<=21930&&s.lifeCycle==='active'){
    if(!this.__seal2V024)this.__seal2V024={preclear:true,attacks:0,startedAtX:Math.round(x)};
    const n=this.__seal2V024,d=slime.sprite.x-p.x,ad=Math.abs(d);
    let axis=0;
    if(d>118)axis=.40;
    else if(d>92)axis=.20;
    else if(d>58)axis=0;
    else if(d>=0)axis=-.34;
    else if(d>-45)axis=-.22;
    else axis=.18;
    if(ad<=118){
      if(this.pulseAttack(t,'seal2_v024_preclear_slime12',125))n.attacks++;
      // Emergency spacing remains ordinary input; it does not grant invulnerability.
      if(p.grounded&&d>=0&&d<48&&t>=this.nextJumpAt)this.pulseJump(t,'seal2_v024_spacing_jump',240);
    }
    drive(this,axis,true);return;
  }
  if(this.__seal2V024?.preclear&&(!slime||!slime.alive)){
    this.__seal2V024.preclear=false;this.__seal2V024.clearedAtX=Math.round(x);this.log('seal2_v024_slime12_cleared',{x:Math.round(x),attacks:this.__seal2V024.attacks});
    this.jumpUntil=0;this.attackUntil=0;
  }
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V024_INPUT_ONLY_SEAL2_PRECLEAR';o.seal2V024=this.__seal2V024||null;return o;};
P.CampaignAutoplayRC39V024=C;window.__KELVOR_RC39_V024_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
