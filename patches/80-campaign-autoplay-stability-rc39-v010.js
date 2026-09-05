(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V009;if(typeof C!=='function')return;
const proto=C.prototype;
const oldSnapshot=proto.snapshot;
const oldUpdate=proto.update;

proto.update=function(t){
 const s=this.s,p=s?.player;
 if(this.status!=='RUNNING'||!p){return oldUpdate.call(this,t);}
 const x=p.x,playerRight=x+P.TUNING.bodyWidth*.5;
 let protectedHazard=null;
 for(let idx=0;idx<s.hazards.length;idx++){
   const h=s.hazards[idx];
   if(idx<3)continue;
   const d=h.left-playerRight;
   if(x>=h.left-115&&x<=h.right+85){protectedHazard={h,idx,d};break;}
 }
 if(!protectedHazard)return oldUpdate.call(this,t);

 // Run the normal v009 logic first, then override only the hazardous edge zone.
 oldUpdate.call(this,t);
 if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
 const {h,idx,d}=protectedHazard;
 const grounded=p.grounded,vy=p.velocityY;
 let axis=.98;
 if(grounded&&d<=128&&d>=68){this.pulseJump(t,'hazard_'+idx+'_v010_early_takeoff',360);}
 const crossing=x>=h.left-42&&x<=h.right+68;
 if(!grounded&&p.airJumpsRemaining>0&&crossing&&vy>-85){this.pulseJump(t,'hazard_'+idx+'_v010_extend',320);}
 this.attackUntil=0;
 this.r.setVirtualAxis(axis,0);
 this.r.setVirtual('jump',t<this.jumpUntil);
 this.r.setVirtual('attack',false);
 this.publish();
};
proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V010_INPUT_ONLY';return s;};
P.CampaignAutoplayRC39V010=C;
window.__KELVOR_RC39_V010_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
