(function(P){
'use strict';
// INPUT-ONLY stabilization of the already-authored ANCIENT_CROSSING.
// v028 proved the correct route but could occasionally leave the narrow x=28080 segment
// ~17 px short because it decelerated too early after launching from the left side of the
// prior ledge. v030 waits for a controlled takeoff point on each authored segment and keeps
// normal right input through the narrow landing window. It never enables bridge bodies,
// changes geometry, physics, collision, HP, damage, enemies, gates, seals, saves, timers,
// acceptance thresholds or PASS rules.
const C=P.CampaignAutoplayRC39V029;if(typeof C!=='function')return;
const proto=C.prototype,oldUpdate=proto.update,oldSnapshot=proto.snapshot;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function suppress(self,fn){const j=self.pulseJump,a=self.pulseAttack;self.pulseJump=()=>false;self.pulseAttack=()=>false;try{return fn();}finally{self.pulseJump=j;self.pulseAttack=a;}}
function bridgeReady(s){const a=s.ancientBridgeSegmentsRC37||[];return a.length>=5&&a.every(seg=>seg?.solid?.body?.enable===true&&seg?.solid?.active!==false);}
function centerY(s,x){const top=s.platformTopByX?.get(x);return Number.isFinite(top)?top-P.TUNING.bodyHeight/2:null;}
function landed(s,p,x){const y=centerY(s,x);return y!==null&&p.grounded&&Math.abs(p.x-x)<64&&Math.abs(p.y-y)<14;}
function foe(s,p){let best=null,score=1e9;for(const e of s.enemies||[]){if(!e?.alive||!e.sprite?.active)continue;const ex=e.sprite.x;if(ex<27720||ex>28620)continue;const ad=Math.abs(ex-p.x);if(ad<score){score=ad;best={e,ad,d:ex-p.x};}}return best;}
function drive(self,axis,attack=false){const t=self.s.time.now;self.r.setVirtualAxis(clamp(axis,-1,1),0);self.r.setVirtual('jump',t<self.jumpUntil);self.r.setVirtual('attack',attack&&t<self.attackUntil);self.publish();}
function flightAxis(p,tx){const d=tx-p.x;if(d>95)return .98;if(d>42)return .86;if(d>10)return .58;if(d>-18)return .24;if(d>-55)return -.18;return -.46;}

proto.update=function(t){
  const s=this.s,p=s?.player;if(!p||this.status!=='RUNNING')return oldUpdate.call(this,t);
  const seals=s.sealsCollectedRC37||0,x=p.x;
  if(seals>=2&&x>=27305&&x<28890&&s.lifeCycle==='active'){
    suppress(this,()=>oldUpdate.call(this,t));
    if(this.status!=='RUNNING'||s.lifeCycle!=='active')return;
    if(!this.__ancientV030)this.__ancientV030={stage:0,attacks:0,attempts:1,startedAtX:Math.round(x),readyAt:0};
    const n=this.__ancientV030,targets=[27620,27850,28080,28310,28540];
    if(x<27445&&n.stage>0){n.stage=0;n.attempts++;n.readyAt=t+120;this.log('ancient_v030_attempt_reset',{attempt:n.attempts,x:Math.round(x)});}
    if(!bridgeReady(s)){
      this.jumpUntil=0;this.attackUntil=0;drive(this,x<27388?.25:0,false);return;
    }
    if(!n.bridgeReady){n.bridgeReady=true;this.log('ancient_v030_bridge_ready',{x:Math.round(x)});}

    if(n.stage<targets.length){
      const tx=targets[n.stage];
      if(landed(s,p,tx)){
        n.stage++;n.lastLanded=tx;n.readyAt=t+135;this.jumpUntil=0;this.attackUntil=0;
        this.log('ancient_v030_landed',{stage:n.stage,target:tx,x:Math.round(p.x),y:Math.round(p.y)});
        drive(this,.20,false);return;
      }
      const prev=n.stage===0?null:targets[n.stage-1];
      const target=targets[n.stage],d=target-p.x;
      const f=foe(s,p);let attacking=false;
      if(f&&f.ad<165){if(this.pulseAttack(t,'ancient_v030_bridge_attack',115)){n.attacks++;attacking=true;}}

      if(p.grounded){
        if(n.stage===0){
          if(x<27398){drive(this,.62,attacking||!!f);return;}
          if(t>=n.readyAt&&x<=27448){
            if(this.pulseJump(t,'ancient_v030_primary_0',390))this.log('ancient_v030_takeoff',{stage:0,target,x:Math.round(x)});
            drive(this,.98,attacking||!!f);return;
          }
        }else if(prev!==null&&Math.abs(x-prev)<92){
          const launchX=prev+Math.min(22,n.stage===2?16:20);
          if(x<launchX){drive(this,.32,attacking||!!f);return;}
          if(t>=n.readyAt){
            if(this.pulseJump(t,'ancient_v030_primary_'+n.stage,390))this.log('ancient_v030_takeoff',{stage:n.stage,target,x:Math.round(x)});
            drive(this,.98,attacking||!!f);return;
          }
        }else if(d>0&&d<360&&t>=n.readyAt){
          this.pulseJump(t,'ancient_v030_ground_recover_'+n.stage,380);
        }
      }
      if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>-60&&d>38&&d<250)this.pulseJump(t,'ancient_v030_double_'+n.stage,360);
      drive(this,flightAxis(p,target),attacking||!!f);return;
    }

    // Normal exit from final authored segment to ground beginning at x=28680.
    if(!n.exitStarted&&p.grounded&&Math.abs(x-28540)<95&&t>=n.readyAt){
      n.exitStarted=true;this.pulseJump(t,'ancient_v030_exit_primary',340);this.log('ancient_v030_exit_takeoff',{x:Math.round(x)});
    }
    if(!p.grounded&&p.airJumpsRemaining>0&&p.velocityY>25&&x<28675)this.pulseJump(t,'ancient_v030_exit_double',300);
    const f=foe(s,p);let attacking=false;if(f&&f.ad<155){if(this.pulseAttack(t,'ancient_v030_exit_attack',115)){n.attacks++;attacking=true;}}
    drive(this,.98,attacking||!!f);
    if(x>=28760&&!n.done){n.done=true;n.clearedAtX=Math.round(x);this.log('ancient_v030_cleared',{x:n.clearedAtX,attacks:n.attacks,attempts:n.attempts});}
    return;
  }
  return oldUpdate.call(this,t);
};
proto.snapshot=function(){const o=oldSnapshot.call(this);o.version='RC39_V030_INPUT_ONLY_ANCIENT_CROSSING_STABLE';o.ancientV030=this.__ancientV030||null;return o;};
P.CampaignAutoplayRC39V030=C;window.__KELVOR_RC39_V030_AUTOPLAY_PATCH_READY__=true;
})(PlatformerSNESV04);
