(function(P){
'use strict';
// RC39 v045 — final secondary-screen cleanup after v044 visual review.
// Presentation only.
const portrait=s=>s.scale.height>s.scale.width*1.05;
const GOLD=0xf6d77a;
const Opt=P.OptionsSceneV10?.prototype;
if(Opt){
  const old=Opt.create;
  Opt.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const f=this.__optionsFinishV044;
    if(f?.chips)for(const c of f.chips){c.box?.setVisible(false);c.tx?.setVisible(false);}
    if(f?.art){
      const w=this.scale.width,h=this.scale.height,x=w/2,y=h*.748;
      f.art.ring?.setPosition(x,y);f.art.ring2?.setPosition(x,y);f.art.ico?.setPosition(x,y-2);
      f.art.tt?.setPosition(x,h*.807);f.art.ss?.setPosition(x,h*.835).setText('Som, toque e visual em um só lugar');
    }
    this.__v045={optionsClean:true};window.__KELVOR_OPTIONS_V045__=this;return r;
  };
}
const Credits=P.CreditsSceneV10?.prototype;
if(Credits){
  const old=Credits.create;
  Credits.create=function(...a){
    const r=old.apply(this,a);if(!portrait(this))return r;
    const h44=this.__creditsFinishV044?.hdr;
    if(h44){for(const o of [h44.lineL,h44.lineR,h44.t,h44.s])o?.setVisible(false);}
    const w=this.scale.width;
    const cap=this.add.text(w/2,69,'CRÉDITOS',{fontFamily:'monospace',fontSize:'8px',fontStyle:'bold',color:'#b9d7bd'}).setOrigin(.5).setDepth(22);
    const rule=this.add.rectangle(w/2,84,150,1,GOLD,.18).setDepth(21);
    // Keep the original KELVOR title visually isolated from the credit card.
    for(const o of this.children?.list||[]){
      if(o?.type==='Text'&&o.text==='Powered by Phaser 4.2.1')o.setText('CRIADO COM PHASER 4.2.1');
      if(o?.type==='Text'&&o.text==='POWERED BY PHASER 4.2.1')o.setText('CRIADO COM PHASER 4.2.1');
    }
    this.__v045={creditsNoOverlap:true};this.__creditsCleanV045={cap,rule};window.__KELVOR_CREDITS_V045__=this;return r;
  };
}
window.__KELVOR_RC39_MENU_MAP_V045_READY__=true;
})(PlatformerSNESV04);
