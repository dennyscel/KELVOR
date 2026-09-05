(function(P){
'use strict';
// INPUT-ONLY diagnostic candidate derived from measured RC37 geometry/physics.
// It changes only virtual player inputs. No physics, collision, hitbox, lives,
// save data, collectibles, assets, timing gates or PASS criteria are modified.
const C=P.CampaignAutoplayRC39V022;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function centerY(s,x){const y=s.platformTopByX?.get(x);return Number.isFinite(y)?y-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x,tolX=82,tolY=16){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<tolX&&Math.abs(p.y-y)<tolY;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}

proto.update=function(t){
  const s=this.s,p=s?.player;
  if(!p||this.status!=='RUNNING'||(s.sealsCollectedRC37||0)>=1||p.x<12610||p.x>13620||(this.__seal1V020?.stage||0)<2)return oldUpdate.call(this,t);
  if(s.lifeCycle!=='active')return oldUpdate.call(this,t);
  // Canonical stage-2 tuple selected by the 48-trial Windows/Chrome physics sweep:
  // launchX=12725, doubleX=12840, hold=240ms -> physical landing x=13006.11/y=70.32.
  if(!this.__seal1V023){
    this.__seal1V023={stage:2,primary:false,double:false,launchX:12725,doubleX:12840,doubleHoldMs:240};
    // v021/v022 are older wrappers in the prototype chain. They may not have been
    // instantiated yet, so create explicit retired sentinels now; otherwise they
    // can initialize themselves after v023 lands and steal stage 3 from v020.
    this.__seal1V021={stage:999,attempts:0,retiredBy:'v023'};
    this.__seal1V022={stage:999,attempts:0,recoveries:0,retiredBy:'v023'};
  }
  const n=this.__seal1V023,x=p.x,y=p.y,vy=p.velocityY;

  if(n.stage===2){
    if(landed(s,p,13040)){
      n.stage=3;this.jumpUntil=0;
      // Return stage 3 to the original v020 pickup logic, which targets the real
      // SEAL_DAWN at x13280. Keep older wrappers permanently retired.
      if(this.__seal1V020)this.__seal1V020.stage=3;
      this.__seal1V021.stage=999;
      this.__seal1V022.stage=999;
      this.log('seal1_v023_landed_13040',{x:Math.round(x),y:Math.round(y),launchX:n.launchX,doubleX:n.doubleX,doubleHoldMs:n.doubleHoldMs});
      drive(this,.98,false);return;
    }

    const ledgeY=centerY(s,12690);
    const onLaunchLedge=ledgeY!==null&&p.grounded&&Math.abs(y-ledgeY)<16&&x>=12645&&x<=12745;
    if(onLaunchLedge&&!n.primary){
      if(x<n.launchX){this.jumpUntil=0;drive(this,.98,false);return;}
      if(t>=this.nextJumpAt){this.pulseJump(t,'seal1_v023_measured_primary',380);n.primary=true;}
      drive(this,.98,false);return;
    }
    if(n.primary&&!n.double&&!p.grounded&&p.airJumpsRemaining>0&&x>=n.doubleX&&vy>50&&t>=this.nextJumpAt){
      if(this.pulseJump(t,'seal1_v023_measured_double',n.doubleHoldMs))n.double=true;
    }
    drive(this,.98,false);return;
  }

  // Stage >=3 intentionally delegates through retired v022/v021 to v020.
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V023_INPUT_ONLY_SEAL1_MEASURED_STAGE2';o.seal1V023=this.__seal1V023||null;return o;};
P.CampaignAutoplayRC39V023=C;window.__KELVOR_RC39_V023_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
