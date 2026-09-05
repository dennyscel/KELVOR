(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V018;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function topY(s,x){return s.platformTopByX?.get(x);}
function centerY(s,x){const y=topY(s,x);return Number.isFinite(y)?y-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<60&&Math.abs(p.y-y)<11;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}
function axisTo(p,tx){const dx=tx-p.x;if(dx>100)return .98;if(dx>45)return .65;if(dx>12)return .22;if(dx>-25)return 0;return -.38;}

proto.update=function(t){
 const s=this.s,p=s?.player;if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
 if((s.sealsCollectedRC37||0)>=1||p.x<12050||p.x>13520)return oldUpdate.call(this,t);
 suppress(this,()=>oldUpdate.call(this,t));if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
 if(!this.__seal1V020)this.__seal1V020={stage:0};const n=this.__seal1V020;const x=p.x,y=p.y,vy=p.velocityY;
 const targets=[12300,12690,13040];
 if(n.stage<3){
   const tx=targets[n.stage];
   if(landed(s,p,tx)){n.stage++;this.log('seal1_v020_landed',{stage:n.stage,x:Math.round(x),y:Math.round(y)});this.jumpUntil=0;drive(this,.98,false);return;}
   let axis=axisTo(p,tx);
   if(n.stage<=1){
     // Stages 0/1 are climbs from low ground. Short hold releases the next pulse near the first apex (~330 ms), so the double adds full height.
     if(p.grounded&&Math.abs(tx-x)<155)this.pulseJump(t,'seal1_v020_early_primary_'+n.stage,210);
     if(!p.grounded&&p.airJumpsRemaining>0&&y<210&&vy>-150){this.pulseJump(t,'seal1_v020_early_double_'+n.stage,300);if(Math.abs(tx-x)<50)axis=0;}
   }else{
     // Stage 2 launches immediately from the second ledge; late double maximizes horizontal airtime for the ~350px center gap.
     if(p.grounded&&x>=12620&&x<=12755)this.pulseJump(t,'seal1_v020_long_primary_2',380);
     if(!p.grounded&&p.airJumpsRemaining>0&&t>=this.nextJumpAt&&vy>80)this.pulseJump(t,'seal1_v020_late_double_2',300);
     axis=.98;
     if(x>13015)axis=.18;
   }
   drive(this,axis,false);return;
 }
 // Third ledge -> actual seal x13280. Use sustained run and a mid-late double for 240px travel + 41px rise.
 let axis=.98;
 if(p.grounded&&Math.abs(x-13040)<75)this.pulseJump(t,'seal1_v020_pickup_primary',300);
 if(!p.grounded&&p.airJumpsRemaining>0&&t>=this.nextJumpAt&&x>=13100&&x<=13210)this.pulseJump(t,'seal1_v020_pickup_double',300);
 if(x>=13245&&x<=13320)axis=.04;
 drive(this,axis,true);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V020_INPUT_ONLY_PLATFORM_TIMING';o.seal1V020=this.__seal1V020||null;return o;};
P.CampaignAutoplayRC39V020=C;window.__KELVOR_RC39_V020_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
