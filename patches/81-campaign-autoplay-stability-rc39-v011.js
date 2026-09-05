(function(P){
'use strict';
const C=P.CampaignAutoplayRC39V009;if(typeof C!=='function')return;
const proto=C.prototype;
const oldSnapshot=proto.snapshot;
const oldUpdate=proto.update;

proto.update=function(t){
 const s=this.s,p=s?.player;
 if(this.status!=='RUNNING'||!p)return oldUpdate.call(this,t);
 const x=p.x,playerRight=x+P.TUNING.bodyWidth*.5;
 let hz=null;
 for(let idx=0;idx<s.hazards.length;idx++){
   const h=s.hazards[idx];
   if(x>=h.left-120&&x<=h.right+90){hz={h,idx,d:h.left-playerRight};break;}
 }
 if(!hz)return oldUpdate.call(this,t);

 // During a hazard crossing, suppress attack scheduling so combat cannot stop the player on top of damage geometry.
 const originalPulseAttack=this.pulseAttack;
 this.pulseAttack=()=>false;
 try{oldUpdate.call(this,t);}finally{this.pulseAttack=originalPulseAttack;}
 if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;

 const {h,idx,d}=hz,grounded=p.grounded,vy=p.velocityY;
 if(grounded&&d<=132&&d>=62){this.pulseJump(t,'hazard_'+idx+'_v011_takeoff',355);}
 const crossing=x>=h.left-45&&x<=h.right+72;
 if(!grounded&&p.airJumpsRemaining>0&&crossing&&vy>-95){this.pulseJump(t,'hazard_'+idx+'_v011_extend',315);}

 // Preserve forward momentum through the whole hazard envelope. This is still only normal InputRouter movement.
 this.attackUntil=0;
 this.r.setVirtualAxis(.98,0);
 this.r.setVirtual('jump',t<this.jumpUntil);
 this.r.setVirtual('attack',false);
 this.publish();
};

proto.snapshot=function(){const s=oldSnapshot.call(this);s.version='RC39_V011_INPUT_ONLY';return s;};
P.CampaignAutoplayRC39V011=C;
window.__KELVOR_RC39_V011_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
