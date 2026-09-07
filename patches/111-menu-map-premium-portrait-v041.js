(function(P){
'use strict';
// RC39 v041 — premium portrait composition after v040 technical PASS.
// Presentation only. No gameplay/progression/physics changes.
const GOLD=0xf6d77a, GOLD2=0xffefad;
const M=P.MainMenuSceneV10?.prototype;
if(M){
  const old=M.create;
  M.create=function(...a){
    const r=old.apply(this,a),L=this.__layoutV039;
    if(this.__v039?.orientation!=='portrait'||!L)return r;
    const w=this.scale.width,h=this.scale.height;
    L.title.setPosition(w/2,h*.085).setScale(1.04);
    L.subtitle.setPosition(w/2,h*.145);
    L.kicker.setPosition(w/2,h*.185);
    const chapter=this.add.text(w/2,h*.245,'MUNDO 1  •  O DESPERTAR',{fontFamily:'monospace',fontSize:'9px',fontStyle:'bold',color:'#bce6bd',backgroundColor:'#071827cc',padding:{x:10,y:6}}).setOrigin(.5).setDepth(12);
    const heroAura=this.add.ellipse(w/2,h*.405,238,112,0x73cfa4,.055).setStrokeStyle(1,0xf6d77a,.12).setDepth(2);
    L.heroGlow.setPosition(w/2,h*.405).setDisplaySize(224,38).setAlpha(.08);
    L.platform.setPosition(w/2,h*.43).setScale(1.08);
    L.hero.setPosition(w/2,h*.43).setScale(1.24);
    L.badge.setPosition(w/2,h*.515).setFontSize(9);
    const panel=this.add.rectangle(w/2,h*.685,Math.min(w*.84,400),Math.min(h*.205,205),0x061522,.30).setStrokeStyle(1,0x9bc7a0,.12).setDepth(4);
    const moveButton=(b,x,y)=>{b.box.setPosition(x,y);b.label.setPosition(x,y);};
    moveButton(L.start,w/2,h*.600);L.start.box.setSize(Math.min(w*.76,350),50).setDisplaySize(Math.min(w*.76,350),50);L.start.label.setFontSize(12);
    moveButton(L.music,w*.29,h*.680);moveButton(L.options,w*.71,h*.680);moveButton(L.credits,w/2,h*.750);
    const ruleL=this.add.rectangle(w*.30,h*.285,w*.20,1,0xf6d77a,.17).setDepth(11),ruleR=this.add.rectangle(w*.70,h*.285,w*.20,1,0xf6d77a,.17).setDepth(11);
    if(P.GameSettingsV10?.get?.('menuMotion')!==false){
      this.tweens.add({targets:heroAura,alpha:{from:.035,to:.075},scale:{from:.96,to:1.05},duration:1900,yoyo:true,repeat:-1,ease:'Sine.inOut'});
      this.tweens.add({targets:[ruleL,ruleR],alpha:{from:.08,to:.22},duration:1500,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    }
    this.__v041={portraitPremium:true,chapter:true,compactCTA:true};
    this.__portraitPremiumV041={chapter,heroAura,panel,ruleL,ruleR};
    window.__KELVOR_MAIN_MENU_V041__=this;
    return r;
  };
}
const WM=P.WorldMapSceneRC1?.prototype;
if(WM){
  const old=WM.create;
  WM.create=function(...a){
    const r=old.apply(this,a);
    if(this.__v039?.orientation==='portrait'&&this.__mapChromeV039){
      const w=this.scale.width,c=this.__mapChromeV039;
      c.worldTitle.setPosition(w/2,25).setOrigin(.5).setFontSize(10);
      const rule=this.add.rectangle(w/2,50,Math.min(w*.58,330),1,0xf6d77a,.16).setDepth(3006);
      this.__portraitMapRuleV041=rule;
    }
    this.__v041={mapHeaderPolish:true};
    window.__KELVOR_WORLD_MAP_V041__=this;
    return r;
  };
}
window.__KELVOR_RC39_MENU_MAP_V041_READY__=true;
})(PlatformerSNESV04);
