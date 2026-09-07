(function (P) {
  'use strict';
  // v046: isolated overworld presentation. Campaign progression remains RC4/RC35.
  const WM = P.WorldMapSceneRC1 && P.WorldMapSceneRC1.prototype;
  const M = P.LivingWorldMapModel;
  if (!WM || !M) throw new Error('Living map requires the campaign scene and v046 model.');
  const W = 2048, H = 1365;
  const IDS = ['L01', 'L02', 'L03', 'SECRET', 'BOSS'];
  const WORLDS = ['W01', 'W02', 'W03', 'W04', 'W05'];
  const EDGES = [{from:'L01',to:'L02'}, {from:'L02',to:'L03'}, {from:'L03',to:'BOSS'}, {from:'L02',to:'SECRET',secret:true}];
  const NAMES = {L01:'Trilha do Despertar',L02:'Clareira das Raízes',L03:'Copas ao Vento',SECRET:'Copa Oculta',BOSS:'Guardião da Floresta'};
  const STATES = {AVAILABLE:'Disponível',CURRENT:'Sua próxima aventura',COMPLETED:'Concluída',MASTERED:'Dominada',BOSS_AVAILABLE:'Guardião liberado',BOSS_DEFEATED:'Guardião vencido',SECRET:'Caminho secreto'};
  const ANCHORS = {L01:[.374,.750],L02:[.356,.550],L03:[.756,.532],BOSS:[.599,.278],SECRET:[.234,.400]};
  const PATHS = {
    'L01:L02': [[.374,.750],[.387,.720],[.382,.681],[.359,.644],[.350,.603],[.356,.550]],
    'L02:L03': [[.356,.550],[.379,.506],[.425,.478],[.481,.474],[.545,.477],[.578,.508],[.607,.563],[.643,.594],[.686,.599],[.723,.581],[.756,.532]],
    'L03:BOSS': [[.756,.532],[.723,.581],[.686,.599],[.643,.594],[.607,.563],[.578,.508],[.545,.477],[.559,.442],[.553,.415],[.539,.383],[.549,.349],[.570,.313],[.599,.278]],
    'L02:SECRET': [[.356,.550],[.358,.517],[.332,.485],[.308,.466],[.285,.449],[.260,.432],[.239,.420],[.234,.400]]
  };
  const LEGACY_ANCHORS = {L01:[.22,.72],L02:[.41,.55],L03:[.62,.67],SECRET:[.38,.85],BOSS:[.75,.32]};
  const worldName = id => id === 'W01' ? 'Planícies Verdes' : 'Mundo ' + Number(id.slice(1));
  const point = xy => ({x:xy[0]*W,y:xy[1]*H});
  const safeStorage = () => { try { return window.localStorage; } catch (_) { return null; } };
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const oldPreload = WM.preload;
  WM.preload = function () {
    oldPreload.call(this);
    if (!this.textures.exists('living_map_w01_v046')) this.load.image('living_map_w01_v046','./assets/world-map/w01-living-map-v046.png');
  };

  function installStyle() {
    if (document.getElementById('living-map-style-v046')) return;
    const style = document.createElement('style');
    style.id = 'living-map-style-v046';
    style.textContent = `
      .kelvor-map-ui{position:absolute;inset:0;z-index:200;pointer-events:none;color:#fff5d8;font:500 15px/1.3 system-ui,sans-serif;--edge:clamp(12px,2.4vw,34px);isolation:isolate}
      .kelvor-map-ui *{box-sizing:border-box}.kelvor-map-ui [hidden]{display:none!important}
      .kelvor-map-ui button{pointer-events:auto;min-width:44px;min-height:44px;cursor:pointer;border:1px solid #e8ce925c;border-radius:12px;background:#0b241ef0;color:#fff5d8;font:700 14px/1.2 system-ui,sans-serif;padding:10px 15px;box-shadow:0 3px 12px #00170f40;touch-action:manipulation}
      .kelvor-map-ui button:hover{background:#254638}.kelvor-map-ui button:focus-visible{outline:3px solid #ffe1a0;outline-offset:4px}
      .kelvor-map-ui button:disabled{opacity:.45;cursor:default}.kelvor-map-ui .km-gold{background:#ffe0a1;color:#183325;border-color:#fff0c6}.kelvor-map-ui .km-gold:hover{background:#fff1c9}
      .km-top{position:absolute;top:max(var(--edge),env(safe-area-inset-top));left:max(var(--edge),env(safe-area-inset-left));right:max(var(--edge),env(safe-area-inset-right));display:flex;gap:12px;align-items:flex-start;justify-content:space-between}
      .km-heading{display:flex;align-items:center;gap:12px;min-width:0}.km-heading-text{text-shadow:0 2px 6px #001a0f,0 0 16px #001a0f;min-width:0}
      .km-eyebrow{display:block;font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#f0d89c;margin-bottom:3px}.km-world-name{display:block;font-family:Georgia,serif;font-weight:700;font-size:clamp(19px,2.2vw,30px);line-height:1.12}
      .km-tools{display:flex;gap:8px;flex-shrink:0}.km-bottom{position:absolute;left:max(var(--edge),env(safe-area-inset-left));right:max(var(--edge),env(safe-area-inset-right));bottom:max(var(--edge),env(safe-area-inset-bottom));display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
      .km-stage{pointer-events:auto;background:linear-gradient(135deg,#102d24f7,#061a17f2);border:1px solid #dfc58b5c;border-radius:18px;padding:15px 18px;box-shadow:0 10px 38px #00170c55;max-width:520px;min-width:285px}
      .km-stage-line{display:flex;gap:18px;align-items:center;justify-content:space-between}.km-stage-title{margin:0 0 4px;font-family:Georgia,serif;font-size:clamp(18px,2vw,25px);line-height:1.16}.km-state{font-size:12px;color:#c7dcc9}.km-stage small{display:block;color:#c9d6c8;font-size:11px;margin-top:9px}
      .km-travel{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.km-travel button{font-size:12px;padding:8px 11px;min-height:44px;flex:1}
      .km-worlds{display:flex;gap:8px;align-items:center;text-shadow:0 2px 4px #00180e}.km-world-count{font-size:11px;letter-spacing:.1em}
      .km-intro{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(#001b1328,transparent 25%,transparent 70%,#001b1328);text-align:center}
      .km-intro-card{padding:30px 36px;max-width:90vw;text-shadow:0 3px 10px #00140c,0 0 30px #00140c;animation:km-arrive 1.2s ease-out both}
      .km-intro-title{font:700 clamp(34px,6vw,76px)/1.03 Georgia,serif;margin:10px 0 14px;color:#fff4ca}.km-intro-card p{font-size:14px;letter-spacing:.02em;margin:0 0 22px}.km-intro-card button{margin-top:4px}
      .km-toast{position:absolute;left:50%;top:24%;transform:translateX(-50%);padding:12px 18px;border-radius:12px;max-width:85vw;background:#08271ef2;text-align:center;font-size:13px;border:1px solid #f3d69d66;box-shadow:0 4px 24px #00150e55}
      .kelvor-map-ui[data-phase="intro"] .km-bottom,.kelvor-map-ui[data-phase="intro"] .km-heading-text{visibility:hidden}
      .kelvor-map-ui[data-phase="walking"] .km-stage{opacity:.85}
      @keyframes km-arrive{from{opacity:0;transform:translateY(18px);letter-spacing:.02em}to{opacity:1;transform:translateY(0)}}
      @media(max-width:600px){.km-top{gap:8px}.km-heading{gap:8px}.km-heading-text{max-width:155px}.km-tools{gap:5px}.kelvor-map-ui button{padding:9px 11px}.km-world-name{font-size:21px}.km-tools .km-fullscreen{display:none}.km-bottom{display:block}.km-stage{min-width:0;max-width:none;padding:12px 14px}.km-stage-line{gap:10px}.km-stage-title{font-size:20px}.km-worlds{justify-content:center;margin-top:8px}.km-worlds button{min-height:44px;padding:7px 12px}.km-world-count{font-size:10px}.km-stage small{font-size:10px}.km-intro-card{padding:20px 16px}}
      @media(max-height:450px){.kelvor-map-ui{--edge:10px}.km-stage{padding:10px 13px;max-width:500px}.km-stage-title{font-size:19px}.km-stage small{display:none}.km-travel{margin-top:6px}.km-heading-text .km-eyebrow{display:none}.km-world-name{font-size:22px}.km-intro-title{font-size:38px}.km-intro-card p{margin-bottom:6px}.km-intro-card{padding:12px}.km-worlds{margin-top:0}}
      @media(max-height:450px) and (orientation:landscape){.km-stage{min-width:0;max-width:44vw}.km-stage-title{font-size:17px}.km-stage-line{gap:7px}.km-stage-line>button{padding:8px}.km-travel{gap:4px}.km-travel button{padding:6px;font-size:11px}.km-bottom{display:flex}.km-worlds{flex-shrink:0}}
      @media(prefers-reduced-motion:reduce){.km-intro-card{animation:none}}
    `;
    document.head.appendChild(style);
  }
  WM.create = function (data = {}) {
    document.documentElement.dataset.kelvorScreen = 'world-map';
    installStyle();
    this.save = P.KelvorCampaignRC1.load();
    this.world = WORLDS.includes(this.save.currentWorld) && this.save.worlds[this.save.currentWorld]?.unlocked ? this.save.currentWorld : 'W01';
    this.phaseV046 = 'idle'; this.overviewV046 = false; this.elapsedV046 = 0;
    this.walkV046 = null; this.effectsV046 = []; this.objectsV046 = [];
    this.cameraV046 = null; this.padButtonsV046 = []; this.padNextV046 = 0; this.padNeutralV046 = false;
    this.reducedV046 = P.GameSettingsV10?.get?.('menuMotion') === false || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.returnV046 = data.returnFromLevel || null;
    this.buildUI();
    this.renderWorld();
    this.bindInputsV046();
    const resize = () => { if (this.cameraV046) { this.updateCameraV046(1,true); this.updateText(); } };
    this.scale.on(Phaser.Scale.Events.RESIZE,resize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE,resize);
      this.uiAbortV046?.abort(); this.hudV046?.remove(); this.hudV046 = null;
      if (window.__KELVOR_WORLD_MAP_V046__ === this) delete window.__KELVOR_WORLD_MAP_V046__;
      if (window.__KELVOR_CAMPAIGN_MAP_SCENE__ === this) { delete window.__KELVOR_CAMPAIGN_MAP_SCENE__; window.__KELVOR_CAMPAIGN_MAP_READY__ = false; }
    });
    window.__KELVOR_WORLD_MAP_V046__ = this;
    window.__KELVOR_CAMPAIGN_MAP_SCENE__ = this; window.__KELVOR_CAMPAIGN_MAP_READY__ = true;
    if (P.AudioServiceRC25?.playMusic) P.AudioServiceRC25.playMusic(this,'MUS_GLOBAL_WORLD_MAP',true,{gain:.62});
  };
  WM.buildUI = function () {
    document.getElementById('kelvor-map-ui-v046')?.remove();
    const hud = document.createElement('section');
    hud.id = 'kelvor-map-ui-v046'; hud.className = 'kelvor-map-ui'; hud.setAttribute('aria-label','Mapa do mundo');
    hud.innerHTML = `
      <header class="km-top"><div class="km-heading"><button data-action="menu" aria-label="Voltar ao menu">‹</button><div class="km-heading-text"><span class="km-eyebrow" data-text="worldNumber"></span><span class="km-world-name" data-text="worldName"></span></div></div><div class="km-tools"><button data-action="overview">Ver mapa</button><button class="km-fullscreen" data-action="fullscreen" aria-label="Alternar tela cheia">⛶</button></div></header>
      <div class="km-intro" hidden><div class="km-intro-card"><span class="km-eyebrow" data-text="introNumber"></span><h1 class="km-intro-title" data-text="introName"></h1><p>Todo grande caminho começa com um passo.</p><button class="km-gold" data-action="skip">Explorar</button></div></div>
      <div class="km-bottom"><div class="km-stage"><div class="km-stage-line"><div><span class="km-eyebrow" data-text="stageNumber"></span><h2 class="km-stage-title" data-text="stageName"></h2><div class="km-state" data-text="state" aria-live="polite"></div></div><button class="km-gold" data-action="play">Jogar</button></div><nav class="km-travel" aria-label="Caminhos disponíveis"></nav><small>Setas / WASD para caminhar · Enter para jogar · M para ver o mapa</small></div><nav class="km-worlds" aria-label="Trocar de mundo"><button data-action="previous" aria-label="Mundo anterior">‹</button><span class="km-world-count" data-text="worldCount"></span><button data-action="next" aria-label="Próximo mundo">›</button></nav></div>
      <div class="km-toast" role="status" hidden></div>`;
    (document.getElementById('platformer-snes-v04-root') || document.body).appendChild(hud);
    this.hudV046 = hud; this.uiAbortV046 = new AbortController();
    hud.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const action = b.dataset.action;
      if (action === 'menu') this.scene.start('MainMenuSceneV10');
      if (action === 'overview') this.toggleOverviewV046();
      if (action === 'fullscreen') this.scale.toggleFullscreen();
      if (action === 'skip') this.finishIntroV046();
      if (action === 'play') this.enterSelected();
      if (action === 'previous') this.switchWorld(-1);
      if (action === 'next') this.switchWorld(1);
      if (b.dataset.node) this.selectNode(b.dataset.node);
    }, {signal:this.uiAbortV046.signal});
  };
  WM.nodeNameV046 = function (id) {
    if (this.world === 'W01') return NAMES[id];
    return P.levelRegistryRC4?.get(this.world+'_'+id)?.metadata?.displayName || (id==='BOSS'?'Guardião':id==='SECRET'?'Caminho secreto':'Fase '+Number(id.slice(1)));
  };
  WM.renderWorld = function () {
    this.objectsV046.forEach(o => o.destroy()); this.objectsV046 = []; this.effectsV046 = [];
    this.walkV046 = null; this.save = P.KelvorCampaignRC1.load();
    this.wsV046 = this.save.worlds[this.world];
    const positions = M.readVisited(safeStorage(),this.save);
    const returned = this.returnV046?.startsWith(this.world+'_') ? this.returnV046.slice(4) : null;
    let id = returned || positions[this.world] || (this.save.selected?.startsWith(this.world+'_') ? this.save.selected.slice(4) : 'L01');
    if (!M.findRoute(EDGES,this.wsV046.nodes,'L01',id,{secretExit:this.wsV046.secretExit})) id = 'L01';
    this.selected = id; this.returnV046 = null;
    const anchors = this.world === 'W01' ? ANCHORS : LEGACY_ANCHORS;
    this.nodesV046 = IDS.map(key => ({id:key,...point(anchors[key])}));
    this.nodes = Object.fromEntries(this.nodesV046.map(n => [n.id,n]));
    const add = o => { this.objectsV046.push(o); return o; };
    this.cameras.main.setBackgroundColor('#0b241d');
    const key = this.world === 'W01' ? 'living_map_w01_v046' : 'campaign_world0'+Number(this.world.slice(1))+'_map';
    add(this.add.image(0,0,key).setOrigin(0).setDisplaySize(W,H).setDepth(-30));
    if (this.world !== 'W01') add(this.add.rectangle(W/2,H/2,W,H,0x061b1c,.15).setDepth(-29));
    this.routeInkV046 = add(this.add.graphics().setDepth(-3));
    this.markerV046 = {};
    for (const n of this.nodesV046) {
      const available = !!M.findRoute(EDGES,this.wsV046.nodes,'L01',n.id,{secretExit:this.wsV046.secretExit});
      const complete = ['COMPLETED','MASTERED','BOSS_DEFEATED'].includes(this.wsV046.nodes[n.id]);
      const color = complete ? 0xb5e9c6 : available ? 0xffdf95 : 0x7a9680;
      add(this.add.ellipse(n.x,n.y+4,48,21,0x001e12,.35).setDepth(2));
      const ring = add(this.add.circle(n.x,n.y,17,0x123c2c,available?.9:.65).setStrokeStyle(3,color).setDepth(3));
      const label = n.id==='BOSS' ? '◆' : n.id==='SECRET' ? '✧' : n.id.slice(-1);
      add(this.add.text(n.x,n.y,label,{fontFamily:'system-ui',fontSize:'19px',fontStyle:'bold',color:available?'#fff2c6':'#c3d2c0'}).setOrigin(.5).setDepth(4));
      const hit = add(this.add.zone(n.x,n.y,80,80).setInteractive({useHandCursor:true}).setDepth(6));
      hit.on('pointerdown', () => this.selectNode(n.id)); this.markerV046[n.id] = ring;
    }
    this.selectionRingV046 = add(this.add.ellipse(0,0,64,27,0xffe4a4,.16).setStrokeStyle(2,0xffdf91,.9).setDepth(5));
    this.shadowV046 = add(this.add.ellipse(0,0,43,14,0x062414,.4).setDepth(7));
    this.heroV046 = add(this.add.sprite(0,0,P.HERO_TEXTURE,'hero/idle/frame_00').setOrigin(.5,1).setDepth(9));
    this.heroV046.setScale(85/this.heroV046.height); this.heroV046.play('hero_idle');
    this.heroV046.setPosition(this.nodes[id].x,this.nodes[id].y-2);
    this.shadowV046.setPosition(this.nodes[id].x,this.nodes[id].y);
    this.selectionRingV046.setPosition(this.nodes[id].x,this.nodes[id].y);
    this.addNatureV046(add);
    this.persistArrivalV046(); this.drawRoutesV046();
    this.phaseV046 = this.reducedV046 || returned ? 'idle' : 'intro';
    this.overviewV046 = this.phaseV046 === 'intro'; this.introTimeV046 = this.elapsedV046;
    this.cameraV046 = null; this.updateCameraV046(1,true); this.updateText();
  };
  WM.pathV046 = function (from,to) {
    if (this.world !== 'W01') return [this.nodes[from],this.nodes[to]].map(n => ({x:n.x,y:n.y}));
    const path = PATHS[from+':'+to];
    if (path) return path.map(point);
    return (PATHS[to+':'+from] || []).slice().reverse().map(point);
  };
  WM.drawRoutesV046 = function () {
    const g = this.routeInkV046; g.clear();
    // W01 already has painted paths. Draw only subtle unlocked breadcrumb lights.
    for (const edge of EDGES) {
      if (!M.findRoute(EDGES,this.wsV046.nodes,edge.from,edge.to,{secretExit:this.wsV046.secretExit})) continue;
      const pts = this.pathV046(edge.from,edge.to);
      if (this.world !== 'W01') { g.lineStyle(5,0xffd889,.6); g.strokePoints(pts,false); }
      const total = M.samplePath(pts,Infinity)?.total || M.samplePath(pts,0)?.total || 0;
      for (let d=42;d<total-28;d+=45) {
        const p = M.samplePath(pts,d); g.fillStyle(edge.secret?0xabecda:0xffe9a8,.4); g.fillCircle(p.x,p.y,2.4);
      }
    }
  };
  WM.addNatureV046 = function (add) {
    if (this.reducedV046) return;
    // Deterministic and bounded; sprites remain attached to world coordinates.
    for (let i=0;i<30;i++) {
      const base = {x:180+((i*173)%1670),y:260+((i*251)%950)};
      const mote = add(this.add.circle(base.x,base.y,i%3===0?2.5:1.8,i%2?0xf7edbc:0xb1efb0,.35).setDepth(13));
      this.effectsV046.push({kind:'mote',object:mote,base,seed:i*1.73});
    }
    if (this.world === 'W01') {
      const portal = add(this.add.ellipse(W*.632,H*.139,86,115,0x92ff77,.07).setDepth(-5).setBlendMode(Phaser.BlendModes.ADD));
      this.effectsV046.push({kind:'portal',object:portal});
      for (let i=0;i<16;i++) {
        const waterfall = i<8 ? {x:W*.031,y:H*.302,w:40,h:115} : {x:W*.136,y:H*.596,w:100,h:153};
        const drop = add(this.add.rectangle(0,0,2+(i%2),7+(i%3)*3,0xc8fbff,.25).setDepth(-4));
        this.effectsV046.push({kind:'water',object:drop,waterfall,seed:i*83});
      }
    }
  };
  WM.persistArrivalV046 = function () {
    // Reload before changing selection: never write an outdated progress snapshot.
    const latest = P.KelvorCampaignRC1.load();
    if (!latest.worlds[this.world]?.unlocked || !M.findRoute(EDGES,latest.worlds[this.world].nodes,'L01',this.selected,{secretExit:latest.worlds[this.world].secretExit})) return false;
    latest.currentWorld = this.world; latest.selected = this.world+'_'+this.selected;
    P.KelvorCampaignRC1.save(latest); M.writeVisited(safeStorage(),this.world,this.selected);
    this.save = latest; this.wsV046 = latest.worlds[this.world]; return true;
  };
  WM.selectNode = function (id) {
    if (this.phaseV046==='intro') { this.finishIntroV046(); return; }
    if (this.walkV046 || this.phaseV046==='launching' || !this.nodes[id]) return;
    const latest = P.KelvorCampaignRC1.load().worlds[this.world];
    const route = M.findRoute(EDGES,latest.nodes,this.selected,id,{secretExit:latest.secretExit});
    if (!route) { this.toastV046(id==='SECRET'?'Descubra a saída secreta para abrir este caminho.':'Conclua o caminho anterior para liberar esta fase.'); return; }
    if (id === this.selected) { if (this.overviewV046) this.toggleOverviewV046(); return; }
    const points = [];
    for (let i=1;i<route.length;i++) points.push(...this.pathV046(route[i-1],route[i]).slice(i===1?0:1));
    if (points.length<2) return;
    this.walkV046 = {target:id,route,points,distance:0};
    this.phaseV046 = 'walking'; this.overviewV046 = false; this.heroV046.play('hero_walk',true); this.updateText();
  };
  WM.finishIntroV046 = function () {
    if (this.phaseV046 !== 'intro') return;
    this.phaseV046 = 'idle'; this.overviewV046 = false; this.updateText();
  };
  WM.toggleOverviewV046 = function () {
    if (this.phaseV046==='intro') return this.finishIntroV046();
    if (this.walkV046 || this.phaseV046==='launching') return;
    this.overviewV046 = !this.overviewV046; this.updateText();
  };
  WM.moveHero = function () {}; // Legacy tween entrypoint deliberately replaced by path walking.
  WM.moveSelection = function (direction) { this.directionV046(direction,0); };
  WM.directionV046 = function (dx,dy) {
    if (this.phaseV046==='intro') { this.finishIntroV046(); return; }
    const target = M.chooseDirectionalNeighbor(this.nodes,EDGES,this.wsV046.nodes,this.selected,dx,dy,this.wsV046.secretExit);
    if (target) this.selectNode(target);
  };
  WM.switchWorld = function (direction) {
    if (this.walkV046 || this.phaseV046==='launching') return;
    const next = WORLDS[WORLDS.indexOf(this.world)+Math.sign(direction)];
    if (!next) return;
    const latest = P.KelvorCampaignRC1.load();
    if (!latest.worlds[next]?.unlocked) { this.toastV046('Vença o guardião deste mundo para seguir viagem.'); return; }
    this.world = next; this.renderWorld();
  };
  WM.enterSelected = function () {
    if (this.phaseV046==='intro') { this.finishIntroV046(); return; }
    if (this.walkV046 || this.phaseV046==='launching') return;
    if (this.overviewV046) { this.toggleOverviewV046(); return; }
    if (!this.persistArrivalV046()) return;
    this.phaseV046 = 'launching'; this.updateText();
    const id = this.world+'_'+this.selected;
    const launched = P.levelRegistryRC4?.launch(this,id,{fromWorldMap:true});
    if (!launched) { this.phaseV046='idle';this.updateText();this.toastV046('Esta fase ainda não está pronta para abrir.'); }
  };
  WM.toastV046 = function (message) {
    const toast = this.hudV046?.querySelector('.km-toast'); if (!toast) return;
    toast.textContent=message; toast.hidden=false; this.toastUntilV046=this.elapsedV046+3400;
  };
  WM.updateText = function () {
    const hud=this.hudV046; if (!hud) return;
    hud.dataset.phase=this.phaseV046;hud.dataset.world=this.world;hud.dataset.node=this.selected;
    hud.dataset.target=this.walkV046?.target || '';hud.dataset.overview=String(this.overviewV046);
    const set=(key,value)=>{hud.querySelector('[data-text="'+key+'"]').textContent=value;};
    const wi=WORLDS.indexOf(this.world);
    hud.querySelector('.km-stage small').textContent=window.innerWidth<=600?'Toque em uma fase ou escolha um caminho para explorar.':'Setas / WASD para caminhar · Enter para jogar · M para ver o mapa';
    set('worldNumber','Mundo '+String(wi+1).padStart(2,'0'));set('introNumber','Mundo '+String(wi+1).padStart(2,'0'));
    set('worldName',worldName(this.world));set('introName',worldName(this.world));set('worldCount',String(wi+1).padStart(2,'0')+' / 05');
    const shown=this.walkV046?.target || this.selected;
    set('stageNumber',shown==='SECRET'?'Caminho secreto':shown==='BOSS'?'O guardião':'Fase '+String(Number(shown.slice(1))).padStart(2,'0'));
    set('stageName',this.nodeNameV046(shown));
    set('state',this.walkV046?'Percorrendo o caminho…':this.overviewV046?'Uma nova perspectiva da sua jornada':STATES[this.wsV046.nodes[this.selected]] || 'Explore');
    hud.querySelector('.km-intro').hidden=this.phaseV046!=='intro';
    const play=hud.querySelector('[data-action="play"]');play.disabled=!!this.walkV046 || this.phaseV046==='launching';play.textContent=this.overviewV046?'Voltar':'Jogar';
    const overview=hud.querySelector('[data-action="overview"]');overview.textContent=this.overviewV046?'Voltar ao Kelvor':'Ver mapa';overview.disabled=!!this.walkV046;
    hud.querySelector('[data-action="previous"]').disabled=wi===0 || !!this.walkV046;
    hud.querySelector('[data-action="next"]').disabled=wi===4 || !!this.walkV046;
    const nav=hud.querySelector('.km-travel');nav.replaceChildren();
    for (const edge of EDGES) {
      const neighbor=edge.from===this.selected?edge.to:edge.to===this.selected?edge.from:null;
      if (!neighbor || !M.findRoute(EDGES,this.wsV046.nodes,this.selected,neighbor,{secretExit:this.wsV046.secretExit})) continue;
      const dx=this.nodes[neighbor].x-this.nodes[this.selected].x,dy=this.nodes[neighbor].y-this.nodes[this.selected].y;
      const arrow=Math.abs(dy)>Math.abs(dx)?(dy<0?'↑':'↓'):(dx<0?'←':'→');
      const b=document.createElement('button');b.dataset.node=neighbor;b.textContent=arrow+' '+(neighbor==='SECRET'?'Segredo':neighbor==='BOSS'?'Guardião':'Fase '+Number(neighbor.slice(1)));b.setAttribute('aria-label','Ir para '+this.nodeNameV046(neighbor));b.title=this.nodeNameV046(neighbor);b.disabled=!!this.walkV046;nav.appendChild(b);
    }
    nav.hidden=!nav.childElementCount;
  };
  WM.bindInputsV046 = function () {
    const signal=this.uiAbortV046.signal;
    window.addEventListener('keydown', e => {
      if (!this.scene.isActive() || e.repeat) return;
      // Native focused button activation must not also launch a phase underneath.
      if ((e.code==='Enter'||e.code==='Space') && e.target instanceof Element && e.target.closest('button')) return;
      const directions={ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0],ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1]};
      if (directions[e.code]) {e.preventDefault();this.directionV046(...directions[e.code]);}
      else if (e.code==='Enter'||e.code==='Space') {e.preventDefault();this.enterSelected();}
      else if (e.code==='KeyM') this.toggleOverviewV046();
      else if (e.code==='KeyQ') this.switchWorld(-1);
      else if (e.code==='KeyE') this.switchWorld(1);
      else if (e.code==='Escape'||e.key==='GoBack'||e.key==='BrowserBack') {e.preventDefault();if(this.phaseV046==='intro')this.finishIntroV046();else if(this.overviewV046)this.toggleOverviewV046();else this.scene.start('MainMenuSceneV10');}
      else if (e.code==='KeyF') this.scale.toggleFullscreen();
    },{signal});
    const clear=()=>{this.padButtonsV046=[];this.padNeutralV046=false;this.padNextV046=this.elapsedV046+250;};
    window.addEventListener('blur',clear,{signal});document.addEventListener('visibilitychange',clear,{signal});
  };
  WM.updateCameraV046 = function (dt,snap=false) {
    if (!this.heroV046) return;
    const width=this.scale.width,height=this.scale.height;
    const frame=M.cameraFrame({width,height,worldWidth:W,worldHeight:H,mode:this.overviewV046?'overview':'focus',target:{x:this.heroV046.x,y:this.heroV046.y+(height>width?70:-35)}});
    const desired={x:frame.scrollX+width/(2*frame.zoom),y:frame.scrollY+height/(2*frame.zoom),zoom:frame.zoom};
    const a=snap||this.reducedV046?1:1-Math.exp(-dt*(this.walkV046?5:3.4));
    if (!this.cameraV046) this.cameraV046={...desired};
    const c=this.cameraV046;c.x+=(desired.x-c.x)*a;c.y+=(desired.y-c.y)*a;c.zoom+=(desired.zoom-c.zoom)*a;
    this.cameras.main.setZoom(c.zoom).centerOn(c.x,c.y);
    // DOM telemetry is read-only and mirrors the visible camera/character for QA.
    if(this.hudV046){this.hudV046.dataset.heroX=this.heroV046.x.toFixed(1);this.hudV046.dataset.heroY=this.heroV046.y.toFixed(1);this.hudV046.dataset.cameraX=c.x.toFixed(1);this.hudV046.dataset.cameraY=c.y.toFixed(1);this.hudV046.dataset.zoom=c.zoom.toFixed(3);}
  };
  WM.update = function (_time,delta) {
    if (!this.hudV046 || document.hidden) return;
    const dt=clamp(delta||16,0,50)/1000;this.elapsedV046+=dt*1000;
    if(this.phaseV046==='intro'&&this.elapsedV046-this.introTimeV046>3200)this.finishIntroV046();
    if(this.toastUntilV046&&this.elapsedV046>this.toastUntilV046){this.hudV046.querySelector('.km-toast').hidden=true;this.toastUntilV046=0;}
    if(this.walkV046){
      const walk=this.walkV046;walk.distance+=230*dt;const pos=M.samplePath(walk.points,walk.distance);
      this.heroV046.setPosition(pos.x,pos.y-2);this.heroV046.setFlipX(Math.cos(pos.angle)<-.05);
      this.shadowV046.setPosition(pos.x,pos.y);
      if(pos.done){this.selected=walk.target;this.walkV046=null;this.phaseV046='idle';this.heroV046.play('hero_idle',true);this.selectionRingV046.setPosition(pos.x,pos.y);this.persistArrivalV046();this.updateText();}
    }
    this.updateCameraV046(dt);
    const t=this.elapsedV046/1000;
    for(const effect of this.effectsV046){
      if(effect.kind==='mote'){effect.object.setPosition(effect.base.x+Math.sin(t*.3+effect.seed)*24,effect.base.y+Math.sin(t*.5+effect.seed)*16).setAlpha(.13+(1+Math.sin(t+effect.seed))*.14);}
      else if(effect.kind==='portal')effect.object.setAlpha(.045+(1+Math.sin(t*1.6))*.025);
      else{const q=effect.waterfall;effect.object.setPosition(q.x+(effect.seed%q.w),q.y+((t*95+effect.seed)%q.h)).setAlpha(.12+(1+Math.sin(t+effect.seed))*.06);}
    }
    let pads=[];try{pads=navigator.getGamepads?navigator.getGamepads():[];}catch(_){}
    const pad=Array.from(pads).find(p=>p?.connected);if(!pad){this.padButtonsV046=[];this.padNeutralV046=false;return;}
    // On scene entry, reconnect, or focus recovery, wait for actual release.
    if(!this.padNeutralV046){this.padButtonsV046=pad.buttons.map(b=>b.pressed);if(!pad.buttons.some(b=>b.pressed)&&!pad.axes.some(a=>Math.abs(a)>.35))this.padNeutralV046=true;return;}
    const down=i=>!!pad.buttons[i]?.pressed;
    const pressed=i=>down(i)&&!this.padButtonsV046[i];
    if(pressed(0)||pressed(9))this.enterSelected();
    else if(pressed(1)){if(this.phaseV046==='intro')this.finishIntroV046();else if(this.overviewV046)this.toggleOverviewV046();else this.scene.start('MainMenuSceneV10');}
    else if(pressed(2))this.toggleOverviewV046();
    else if(pressed(4))this.switchWorld(-1);else if(pressed(5))this.switchWorld(1);
    if(this.elapsedV046>this.padNextV046){let dx=down(14)?-1:down(15)?1:Math.abs(pad.axes[0]||0)>.55?Math.sign(pad.axes[0]):0;let dy=down(12)?-1:down(13)?1:Math.abs(pad.axes[1]||0)>.55?Math.sign(pad.axes[1]):0;if(dx||dy){if(Math.abs(pad.axes[1]||0)>Math.abs(pad.axes[0]||0)&&!down(14)&&!down(15))dx=0;else if(dx)dy=0;this.directionV046(dx,dy);this.padNextV046=this.elapsedV046+220;}}
    this.padButtonsV046=pad.buttons.map(b=>b.pressed);
  };
  P.LivingWorldMapV046 = {version:'v046',worldSize:{width:W,height:H},anchors:ANCHORS};
})(window.PlatformerSNESV04);
