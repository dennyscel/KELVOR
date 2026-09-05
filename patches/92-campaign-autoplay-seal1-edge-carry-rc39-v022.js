(function(P){
'use strict';
// INPUT-ONLY diagnostic patch: retain authored single jumps, but carry horizontal
// momentum to the real platform edge. No gameplay/physics/collision/save changes.
const C=P.CampaignAutoplayRC39V021;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function topY(s,x){return s.platformTopByX?.get(x);}
function centerY(s,x){const y=topY(s,x);return Number.isFinite(y)?y-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x,tolX=66,tolY=14){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<tolX&&Math.abs(p.y-y)<tolY;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
 const s=this.s,p=s?.player;
 if(!p||this.status!=='RUNNING'||(s.sealsCollectedRC37||0)>=1||p.x<12530||p.x>13630||(this.__seal1V020?.stage||0)<2)return oldUpdate.call(this,t);
 if(s.lifeCycle!=='active')return oldUpdate.call(this,t);
 if(!this.__seal1V022)this.__seal1V022={stage:2,attempts:0,recoveries:0};
 const n=this.__seal1V022,x=p.x,y=p.y,vy=p.velocityY;

 if(n.stage===2){
   if(landed(s,p,13040,70,15)){
     n.stage=3;this.jumpUntil=0;this.log('seal1_v022_landed_13040',{x:Math.round(x),y:Math.round(y)});drive(this,.18,false);return;
   }
   // Authored cue: single jump. v021 fell short because it braked around x12945.
   if(p.grounded&&x>=12620&&x<=12765&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v022_single_to_13040',270);n.attempts++;}
   // Physical recovery from the continuous ground if the edge was missed by a small amount.
   const cy=centerY(s,13040);
   if(p.grounded&&cy!==null&&y>cy+55&&x>=12870&&x<13020&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v022_ground_recovery_13040',270);n.recoveries++;}
   let axis=.98;
   if(x>=12988&&x<13018)axis=.45;
   else if(x>=13018)axis=-.32;
   if(!p.grounded&&x>=13000&&vy>120)axis=-.42;
   if(p.grounded&&cy!==null&&y>cy+55&&x>=13020)axis=-.48;
   drive(this,axis,false);return;
 }

 if(n.stage===3){
   if((s.sealsCollectedRC37||0)>=1)return oldUpdate.call(this,t);
   if(landed(s,p,13390,82,16)){
     n.stage=4;this.jumpUntil=0;this.log('seal1_v022_landed_13390_without_pickup',{x:Math.round(x),y:Math.round(y)});drive(this,-.18,false);return;
   }
   if(p.grounded&&x>=12970&&x<=13120&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v022_single_through_dawn_to_13390',275);n.attempts++;}
   const cy=centerY(s,13390);
   if(p.grounded&&cy!==null&&y>cy+55&&x>=13190&&x<13345&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v022_ground_recovery_13390',300);n.recoveries++;}
   let axis=.98;
   if(x>=13270&&x<13325)axis=.38;
   else if(x>=13325)axis=-.28;
   if(!p.grounded&&x>=13305&&vy>110)axis=-.38;
   drive(this,axis,true);return;
 }

 // If the first pass reaches the tiny 13390 ledge without intersecting the floating
 // seal, hop left through x13280. This remains ordinary player input.
 if(n.stage===4){
   if((s.sealsCollectedRC37||0)>=1)return oldUpdate.call(this,t);
   if(p.grounded&&x>=13320&&x<=13470&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v022_fallback_left_through_dawn',255);n.attempts++;}
   let axis=x>13292?-.60:-.08;if(!p.grounded&&x<13252)axis=.22;
   drive(this,axis,true);return;
 }
 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V022_INPUT_ONLY_SEAL1_EDGE_CARRY';o.seal1V022=this.__seal1V022||null;return o;};
P.CampaignAutoplayRC39V022=C;window.__KELVOR_RC39_V022_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
