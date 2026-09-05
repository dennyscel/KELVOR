(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V018;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function topY(s,x){return s.platformTopByX?.get(x);}
function cy(s,x){const y=topY(s,x);return Number.isFinite(y)?y-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x){const y=cy(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<58&&Math.abs(p.y-y)<10;}
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}
function axisTo(p,tx){const dx=tx-p.x;if(dx>95)return .98;if(dx>35)return .58;if(dx>10)return .18;if(dx>-22)return 0;return -.34;}

proto.update=function(t){
 const s=this.s,p=s?.player;if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
 const seals=s.sealsCollectedRC37||0,x=p.x,y=p.y,vy=p.velocityY;
 // Override only the first-seal platform navigation; v018 remains authoritative everywhere else.
 if(seals<1&&x>=12050&&x<=13520){
   suppress(this,()=>oldUpdate.call(this,t));
   if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
   if(!this.__seal1V019)this.__seal1V019={stage:0};
   const n=this.__seal1V019,targets=[12300,12690,13040];
   if(n.stage<targets.length){
     const tx=targets[n.stage];
     if(landed(s,p,tx)){
       n.stage++;this.log('seal1_v019_landed',{stage:n.stage,x:Math.round(p.x),y:Math.round(p.y)});
       this.jumpUntil=0;drive(this,.98,false);return;
     }
     let axis=axisTo(p,tx);
     // Launch when close enough horizontally. If we fall under the target, climb almost vertically.
     if(p.grounded&&Math.abs(tx-p.x)<150)this.pulseJump(t,'seal1_v019_primary_'+n.stage,380);
     // Critical fix: vertical double-jump is allowed even when dx≈0. Height, not horizontal distance, is the gate.
     if(!p.grounded&&p.airJumpsRemaining>0&&y<225&&vy>-115){
       this.pulseJump(t,'seal1_v019_vertical_double_'+n.stage,375);
       if(Math.abs(tx-p.x)<45)axis=0;
     }
     drive(this,axis,false);return;
   }
   // From x13040 ledge, jump through actual SEAL_DAWN x13280,y≈29.
   let axis=axisTo(p,13280);
   if(p.grounded&&Math.abs(p.x-13040)<70)this.pulseJump(t,'seal1_v019_pickup_primary',390);
   if(!p.grounded&&p.airJumpsRemaining>0&&p.x>=13100&&p.x<=13215&&vy>-110)this.pulseJump(t,'seal1_v019_pickup_double',375);
   if(p.x>=13245&&p.x<=13315)axis=.03;
   drive(this,axis,true);return;
 }
 return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V019_INPUT_ONLY_VERTICAL_PLATFORM';o.seal1V019=this.__seal1V019||null;return o;};
P.CampaignAutoplayRC39V019=C;window.__KELVOR_RC39_V019_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
