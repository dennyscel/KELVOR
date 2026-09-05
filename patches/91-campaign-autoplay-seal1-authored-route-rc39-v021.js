(function(P){
'use strict';
// INPUT-ONLY diagnostic patch. It follows the authored RC37 jump cues for SEAL_DAWN
// and never changes game physics, collision, assets, lives, save data or PASS rules.
const C=P.CampaignAutoplayRC39V020;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function topY(s,x){return s.platformTopByX?.get(x);}
function centerY(s,x){const y=topY(s,x);return Number.isFinite(y)?y-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x,tolX=64,tolY=12){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<tolX&&Math.abs(p.y-y)<tolY;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}
function authoredReady(self){return (self.__seal1V020?.stage||0)>=2;}

proto.update=function(t){
 const s=this.s,p=s?.player;
 if(!p||this.status!=='RUNNING'||(s.sealsCollectedRC37||0)>=1||p.x<12540||p.x>13620||!authoredReady(this))return oldUpdate.call(this,t);
 if(s.lifeCycle!=='active')return oldUpdate.call(this,t);
 if(!this.__seal1V021)this.__seal1V021={stage:2,attempts:0};
 const n=this.__seal1V021,x=p.x,y=p.y,vy=p.velocityY;

 // RC37 authored cue #1: from the 12690 ledge toward 13040 is a SINGLE jump.
 // v020 used a late double here and overflew the 13040 landing. Brake on descent.
 if(n.stage===2){
   if(landed(s,p,13040,72,14)){
     n.stage=3;this.jumpUntil=0;this.log('seal1_v021_landed_13040',{x:Math.round(x),y:Math.round(y)});drive(this,.12,false);return;
   }
   if(p.grounded&&x>=12605&&x<=12775&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v021_authored_single_12690_to_13040',245);n.attempts++;}
   let axis=x<12870?.94:x<12945?.68:x<12995?.32:x<13025?.08:-.34;
   if(!p.grounded&&x>=12970&&vy>10)axis=-.42;
   // If the attempt falls to the continuous ground, re-approach instead of running past the objective.
   const cy=centerY(s,13040);if(p.grounded&&cy!==null&&y>cy+45&&x>13020){axis=-.72;this.jumpUntil=0;}
   drive(this,axis,false);return;
 }

 // RC37 authored cue #2: 13010-13140 is another SINGLE jump. The SEAL_DAWN
 // pickup at x13280 is positioned from the 13390 ledge height, so this hop crosses it naturally.
 if(n.stage===3){
   if((s.sealsCollectedRC37||0)>=1)return oldUpdate.call(this,t);
   if(landed(s,p,13390,78,15)){
     n.stage=4;this.jumpUntil=0;this.log('seal1_v021_landed_13390_without_pickup',{x:Math.round(x),y:Math.round(y)});drive(this,-.12,false);return;
   }
   if(p.grounded&&x>=12970&&x<=13125&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v021_authored_single_13040_to_13390',255);n.attempts++;}
   let axis=x<13175?.92:x<13235?.62:x<13270?.28:x<13315?.06:-.22;
   // Do not spend the air jump here: the source RC37 cue is explicitly single.
   drive(this,axis,true);return;
 }

 // Fallback only if the player landed on 13390 while narrowly missing the floating pickup:
 // make the authored local correction back left through x13280. Still input-only.
 if(n.stage===4){
   if((s.sealsCollectedRC37||0)>=1)return oldUpdate.call(this,t);
   if(p.grounded&&x>=13310&&x<=13465&&t>=this.nextJumpAt){this.pulseJump(t,'seal1_v021_pickup_fallback_left',235);n.attempts++;}
   let axis=x>13295?-.52:-.08;
   if(!p.grounded&&x<13255)axis=.18;
   drive(this,axis,true);return;
 }
 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V021_INPUT_ONLY_SEAL1_AUTHORED_ROUTE';o.seal1V021=this.__seal1V021||null;return o;};
P.CampaignAutoplayRC39V021=C;window.__KELVOR_RC39_V021_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
