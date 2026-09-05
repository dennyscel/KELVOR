(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V016;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
function eAt(s,i){const e=s.enemies?.[i];return e&&e.alive&&e.sprite?.active?e:null;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
proto.update=function(t){
 const s=this.s,p=s?.player;if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
 const x=p.x,bee=eAt(s,6);
 // Hold a safe ground position until the first canopy bee is actually defeated.
 if(bee&&x>=11680&&x<12240){
   suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   const d=bee.sprite.x-p.x;let axis=x<12020?.38:Math.max(-.16,Math.min(.16,d/500));
   if(Math.abs(d)<190){
     if(p.grounded)this.pulseJump(t,'preclear_bee6_v017',330);
     else if(p.airJumpsRemaining>0&&p.velocityY>20)this.pulseJump(t,'preclear_bee6_double_v017',285);
     this.pulseAttack(t,'preclear_bee6_attack_v017',120);
   }
   this.r.setVirtualAxis(axis,0);this.r.setVirtual('jump',t<this.jumpUntil);this.r.setVirtual('attack',t<this.attackUntil);this.publish();return;
 }
 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V017_INPUT_ONLY_PLATFORM_PRECLEAR';o.bee6Alive=!!eAt(this.s,6);return o;};
P.CampaignAutoplayRC39V017=C;window.__KELVOR_RC39_V017_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
