(function(P){
'use strict';
// RC39 v038 — W01-L01 finishing pass after v037 visual review (8.5/10).
// Presentation only: richer forest plane, sculpted ravines, real Ancient Crossing supports,
// clearer key altars / door integration. No gameplay constants or progression thresholds changed.
const S=P.World01Level01AAAReferenceSceneRC37;if(typeof S!=='function')return;const proto=S.prototype,F=P.FLOOR_TOP,T=P.PHASE01_TEXTURE;
const SEC=[[0,3600],[3600,7600],[7600,10800],[10800,15000],[15000,18800],[18800,22600],[22600,26600],[26600,30600],[30600,34800],[34800,38200]];
const BGT=[['007','001','009'],['009','011','007'],['007','010','009'],['010','011','006'],['008','009','001'],['003','005','009'],['001','006','009'],['009','010','007'],['010','011','009'],['001','003','006']];
const FGS=[['016','022','003'],['013','023','014'],['028','045','023'],['022','023','016'],['023','028','013'],['018','020','004'],['029','045','023'],['014','043','023'],['043','046','023'],['016','018','003']];
function p(s,x,n,sc,d,a=.9,flip=false){return s.add.image(x,F+4,T,'phase_01_grassland/props/'+n).setOrigin(.5,1).setScale(sc).setDepth(d).setAlpha(a).setFlipX(flip);}
function forestDepth(s){
  s.__forestFinishV038=[];
  // Strengthen v037 background layer so trees read as forest depth, not pale ghosts.
  for(const o of s.__sectionArtV037||[])if(o?.active&&o.depth===6&&o.texture?.key===T){o.setAlpha(.69);o.setScale(o.scaleX*1.07,o.scaleY*1.07);}
  SEC.forEach(([a,b],si)=>{
    const w=b-a,bg=BGT[si],fg=FGS[si];
    [0.18,0.42,0.64,0.84].forEach((q,i)=>{const im=p(s,a+w*q,bg[(i+1)%bg.length],.55+((si+i)%3)*.08,5.8,.58+(i%2)*.08,i%2===1);s.__forestFinishV038.push(im);});
    [0.12,0.31,0.53,0.72,0.91].forEach((q,i)=>{const im=p(s,a+w*q,fg[(i+si)%fg.length],.27+((i+si)%2)*.055,13.5,.94,i%3===1);s.__forestFinishV038.push(im);});
    // Small grass tufts/flowers break the perfectly repeated floor cadence without implying collision.
    [0.08,0.24,0.46,0.68,0.86].forEach((q,i)=>{const n=['022','023','016','017','018'][(i+si)%5];const im=p(s,a+w*q,n,.20+(i%2)*.03,12.6,.88,i%2===0);s.__forestFinishV038.push(im);});
  });
}
function sculptRavines(s){
  s.__ravineFinishV038=[];
  for(const r of s.__ravinesV036||[]){
    const w=r.b-r.a,c=(r.a+r.b)/2,wide=w>500;
    r.back?.setAlpha(.82);r.mid?.setAlpha(.36);r.deep?.setAlpha(.88);r.mist?.setAlpha(.07);
    const g=s.add.graphics().setDepth(6.35);
    // Tapered earth walls form an actual canyon profile rather than a rectangular missing tile.
    const shoulder=Math.min(w*.38,wide?210:58),depth=wide?152:118;
    g.fillStyle(0x563722,.96);g.fillPoints([{x:r.a,y:F},{x:r.a+shoulder*.42,y:F+42},{x:r.a+shoulder,y:F+depth},{x:r.a,y:F+depth}],true);
    g.fillStyle(0x4a2e1e,.96);g.fillPoints([{x:r.b,y:F},{x:r.b-shoulder*.42,y:F+42},{x:r.b-shoulder,y:F+depth},{x:r.b,y:F+depth}],true);
    g.fillStyle(0x29412f,.55);g.fillTriangle(r.a+3,F+8,r.a+shoulder*.42,F+49,r.a+15,F+91);g.fillTriangle(r.b-3,F+8,r.b-shoulder*.42,F+49,r.b-15,F+91);
    s.__ravineFinishV038.push(g);
    // Visible stone floor silhouettes and roots at different depths.
    const count=wide?10:Math.max(2,Math.floor(w/70));
    for(let k=0;k<count;k++){
      const x=r.a+22+(k+1)*(w-44)/(count+1),y=F+70+(k%3)*23;
      const rock=p(s,x,['042','043','044'][k%3],wide?.17:.14,7.4,.48,k%2===1);rock.setY(Math.min(348,y));s.__ravineFinishV038.push(rock);
    }
    for(let k=0;k<(wide?8:3);k++){
      const side=k%2===0?r.a+14:r.b-14,len=35+(k%4)*15;
      const root=s.add.rectangle(side,F+3,2.5,len,0x45613b,.72).setOrigin(.5,0).setAngle(k%2?-12:12).setDepth(7.8);s.__ravineFinishV038.push(root);
    }
    if(!wide){
      const inner=s.add.ellipse(c,F+104,Math.max(34,w*.55),18,0x050b09,.68).setDepth(5.9);s.__ravineFinishV038.push(inner);
    }else{
      // Ancient Crossing receives cliff terraces and distant mist bands.
      [62,100,137].forEach((dy,j)=>{const band=s.add.rectangle(c,F+dy,w*(.78-j*.08),3,0xb8c7b1,.065-j*.014).setDepth(7);s.__ravineFinishV038.push(band);});
      for(let k=0;k<7;k++){
        const x=r.a+100+k*(w-200)/6,ruin=s.add.rectangle(x,F+78+(k%2)*21,16,75,0x24261f,.58).setOrigin(.5,0).setDepth(6.7);ruin.setAngle(k%2?3:-3);s.__ravineFinishV038.push(ruin);
      }
    }
  }
}
function fixAncientSupportGeometry(s){
  s.__ancientCrossbeamsV038=[];
  for(const a of s.__ancientSupportsV037||[]){
    const beam=s.add.rectangle(a.seg.x,335,44,5,0x4b321f,.48).setDepth(8.2);s.__ancientCrossbeamsV038.push({a,beam});
  }
}
function updateAncient(s){
  for(const q of s.__ancientCrossbeamsV038||[]){
    const a=q.a,seg=a.seg,img=seg?.image;if(!img?.active)continue;
    const top=Math.min(330,img.y-2),bottom=348,h=Math.max(12,bottom-top),alpha=Math.max(.05,Math.min(.78,(img.alpha||0)*.82));
    a.post.setPosition(seg.x,top).setSize(6,h).setDisplaySize(6,h).setAlpha(alpha);
    a.braceL.setPosition(seg.x-14,top+8).setSize(3,Math.max(10,h-10)).setDisplaySize(3,Math.max(10,h-10)).setAngle(-8).setAlpha(alpha*.78);
    a.braceR.setPosition(seg.x+14,top+8).setSize(3,Math.max(10,h-10)).setDisplaySize(3,Math.max(10,h-10)).setAngle(8).setAlpha(alpha*.78);
    a.base.setPosition(seg.x,348).setAlpha(alpha*.85);
    q.beam.setPosition(seg.x,Math.min(340,top+h*.70)).setAlpha(alpha*.70);
  }
}
function finishGates(s){
  s.__gateFinishV038=[];
  for(const g of s.lockGatesRC37||[]){
    if(g.pedestal?.active){g.pedestal.setScale(g.id==='GATE_A'?.38:.34).setAlpha(1);}
    const c=g.__archV037;if(c){c.left?.setScale(.31).setAlpha(1);c.right?.setScale(.31).setAlpha(1);c.plantL?.setScale(.31).setAlpha(.96);c.plantR?.setScale(.31).setAlpha(.96);}
    const shadow=s.add.ellipse(g.x,F+3,112,12,0x06100b,.28).setDepth(37);
    const step=s.add.rectangle(g.x,F-1,84,5,0x5f6944,.92).setDepth(40);
    const runeBase=s.add.circle(g.x,F-49,13,g.keyTint||0xffdf76,.025).setStrokeStyle(1,g.keyTint||0xffdf76,.22).setDepth(41);
    if(P.GameSettingsV10?.get?.('menuMotion')!==false)s.tweens.add({targets:runeBase,alpha:{from:.018,to:.065},scale:{from:.92,to:1.18},duration:1700,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    s.__gateFinishV038.push({g,shadow,step,runeBase});
  }
}
const oldCreate=proto.create;
proto.create=function(...a){const r=oldCreate.apply(this,a);forestDepth(this);sculptRavines(this);fixAncientSupportGeometry(this);finishGates(this);this.__v038={ready:true,forestObjects:(this.__forestFinishV038||[]).length,ravineObjects:(this.__ravineFinishV038||[]).length,crossbeams:(this.__ancientCrossbeamsV038||[]).length,gateFinish:(this.__gateFinishV038||[]).length};window.__KELVOR_W01_L01_V038__=this;return r;};
const oldUpdate=proto.update;proto.update=function(t,d){const r=oldUpdate.call(this,t,d);updateAncient(this);return r;};
const oldSnap=proto.rc37Snapshot;proto.rc37Snapshot=function(){const z=oldSnap.call(this);z.ownerV038=this.__v038||null;return z;};
window.__KELVOR_RC39_W01L01_V038_READY__=true;
})(PlatformerSNESV04);
