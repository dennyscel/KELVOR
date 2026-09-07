'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {EventEmitter} = require('node:events');
const M = require('../patches/116-world-map-model-v046.js');
const sceneSource = fs.readFileSync(path.join(__dirname,'../patches/117-world-map-scene-v046.js'),'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

// Only browser/Phaser surfaces are stubbed. The actual scene create, input, walking,
// camera, save selection, registry dispatch and model are exercised together.
class ElementStub extends EventTarget {
  constructor(tag = 'div') {
    super(); this.tag = tag; this.dataset = {}; this.children = []; this.selectors = new Map();
  }
  closest(selector) { return selector === 'button' && this.tag === 'button' ? this : null; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  get childElementCount() { return this.children.length; }
  querySelector(selector) {
    if (!this.selectors.has(selector)) this.selectors.set(selector,new ElementStub());
    return this.selectors.get(selector);
  }
  setAttribute() {}
  remove() { this.removed = true; }
}

function display(x = 0, y = 0) {
  const object = {x,y,width:64,height:100,animations:[]};
  for (const method of ['setOrigin','setDisplaySize','setDepth','setStrokeStyle','setInteractive',
    'setScale','setAlpha','setBlendMode','lineStyle','strokePoints','fillStyle','fillCircle','clear','on']) {
    object[method] = function() { return this; };
  }
  object.setPosition = function(nextX,nextY) { this.x=nextX; this.y=nextY; return this; };
  object.setFlipX = function(value) { this.flipX=value; return this; };
  object.play = function(key) { this.animations.push(key); return this; };
  object.destroy = function() { this.destroyed=true; };
  return object;
}

function initialCampaign() {
  return {version:2,currentWorld:'W01',selected:'W01_L01',saveMeta:{schemaVersion:2,migrator:'RC35'},worlds:{
    W01:{unlocked:true,secretExit:false,completed:false,nodes:{L01:'COMPLETED',L02:'AVAILABLE',L03:'LOCKED',SECRET:'LOCKED',BOSS:'LOCKED'},bonusRooms:{B01:false}},
    W02:{unlocked:false,secretExit:false,nodes:{L01:'LOCKED',L02:'LOCKED',L03:'LOCKED',SECRET:'LOCKED',BOSS:'LOCKED'}}
  }};
}

function harness({campaign = initialCampaign(), data = {}, reducedMotion = true} = {}) {
  let persisted = clone(campaign), pads = [];
  const saves = [], launches = [], viewWrites = [], storageValues = new Map();
  const storage = {
    getItem:key => storageValues.get(key) ?? null,
    setItem(key,value) { viewWrites.push({key,value}); storageValues.set(key,value); }
  };
  function Scene() {}
  Scene.prototype.preload = function() {};
  const P = {
    WorldMapSceneRC1:Scene, LivingWorldMapModel:M, HERO_TEXTURE:'hero',
    GameSettingsV10:{get:() => !reducedMotion},
    KelvorCampaignRC1:{load:() => clone(persisted),save(value) { persisted=clone(value); saves.push(clone(value)); }},
    levelRegistryRC4:{get:() => null,launch(scene,id,payload) { launches.push({scene,id,payload:clone(payload)}); return id; }}
  };
  const win = new EventTarget();
  Object.assign(win,{PlatformerSNESV04:P,localStorage:storage,matchMedia:() => ({matches:false})});
  const document = new EventTarget();
  Object.assign(document,{hidden:false,documentElement:{dataset:{}},
    getElementById:id => id === 'living-map-style-v046' ? {} : null,
    createElement:tag => new ElementStub(tag),head:new ElementStub('head')});
  const Phaser = {Scale:{Events:{RESIZE:'resize'}},Scenes:{Events:{SHUTDOWN:'shutdown'}},BlendModes:{ADD:'ADD'}};
  const context = {window:win,document,Phaser,Element:ElementStub,AbortController,navigator:{getGamepads:() => pads}};
  vm.runInNewContext(sceneSource,context,{filename:'117-world-map-scene-v046.js'});
  const scene = new Scene();
  const scale = new EventEmitter();
  Object.assign(scale,{width:1280,height:720,toggleFullscreen() {}});
  const camera = {setBackgroundColor(){return this;},setZoom(zoom){this.zoom=zoom;return this;},centerOn(x,y){this.x=x;this.y=y;return this;}};
  const add = {};
  for (const kind of ['image','rectangle','ellipse','circle','text','zone','sprite','graphics']) add[kind] = (x,y) => display(x,y);
  Object.assign(scene,{scale,add,cameras:{main:camera},events:new EventEmitter(),
    scene:{isActive:() => true,start() {}},
    buildUI() { this.hudV046=new ElementStub('section'); this.uiAbortV046=new AbortController(); }});
  scene.create(data);
  return {
    scene,P,win,document,saves,launches,viewWrites,storage,
    campaign:() => clone(persisted),
    changeCampaign:mutate => mutate(persisted),
    pads:value => { pads=value; },
    tick(delta=50) { scene.update(0,delta); },
    key(code) {
      const event = new Event('keydown',{cancelable:true});
      Object.defineProperties(event,{code:{value:code},key:{value:code},repeat:{value:false}});
      win.dispatchEvent(event); return event;
    }
  };
}

function arrive(h) {
  for (let ticks = 0; h.scene.walkV046 && ticks < 1000; ticks++) h.tick();
  assert.equal(h.scene.walkV046,null,'the authored path should finish in bounded simulated time');
}

test('ArrowUp goes through the actual input handler and model to start the connected path', () => {
  const h = harness();
  const before = h.campaign();
  const event = h.key('ArrowUp');
  assert.ok(event.defaultPrevented);
  assert.equal(h.scene.walkV046?.target,'L02');
  assert.deepEqual(Array.from(h.scene.walkV046.route),['L01','L02']);
  assert.equal(h.scene.selected,'L01');
  assert.deepEqual(h.campaign(),before);
  arrive(h);
  assert.equal(h.scene.selected,'L02');
  assert.equal(h.scene.heroV046.x,h.scene.nodes.L02.x);
  assert.equal(h.scene.heroV046.y,h.scene.nodes.L02.y-2);
  // Both branches above L02 are locked; upward input cannot enter either one.
  h.key('ArrowUp');
  assert.equal(h.scene.walkV046,null);
});

test('a held gamepad action on map entry waits for release and a new press before launching', () => {
  for (const button of [0,9]) {
    const h = harness();
    const pad = {connected:true,axes:[0,0],buttons:Array.from({length:16},() => ({pressed:false}))};
    pad.buttons[button].pressed=true; h.pads([pad]);
    h.tick(); h.tick();
    assert.equal(h.launches.length,0,'held input from the previous scene cannot launch a level');
    pad.buttons[button].pressed=false; h.tick();
    assert.equal(h.launches.length,0,'release only arms input');
    pad.buttons[button].pressed=true; h.tick();
    assert.equal(h.launches.length,1);
    assert.equal(h.launches[0].id,'W01_L01');
    h.tick();
    assert.equal(h.launches.length,1,'holding the new press cannot dispatch duplicate launches');
  }
});

test('travel commits selection only on arrival and preserves progress saved while walking', () => {
  const h = harness();
  const start = h.campaign(), initialSaves=h.saves.length, initialViewWrites=h.viewWrites.length;
  h.scene.selectNode('L02');
  assert.equal(h.scene.selected,'L01');
  h.tick();
  assert.ok(h.scene.walkV046);
  assert.deepEqual(h.campaign(),start);
  assert.equal(h.saves.length,initialSaves);
  assert.equal(h.viewWrites.length,initialViewWrites);
  h.changeCampaign(latest => {
    latest.worlds.W01.nodes.L01='MASTERED';
    latest.worlds.W01.bonusRooms.B01=true;
    latest.worlds.W01.nodes.L03='AVAILABLE';
    latest.saveMeta.externalRevision=7;
  });
  arrive(h);
  const arrived = h.campaign();
  assert.equal(arrived.selected,'W01_L02');
  assert.equal(arrived.worlds.W01.nodes.L01,'MASTERED');
  assert.equal(arrived.worlds.W01.nodes.L03,'AVAILABLE');
  assert.equal(arrived.worlds.W01.bonusRooms.B01,true);
  assert.equal(arrived.saveMeta.externalRevision,7);
  assert.equal(h.saves.length,initialSaves+1);
  assert.equal(h.viewWrites.length,initialViewWrites+1);
  assert.deepEqual(M.readVisited(h.storage,arrived),{W01:'L02'});
  assert.ok(h.viewWrites.every(write => write.key === M.STORAGE_KEY));
});

test('enterSelected blocks travel and locked selection, then dispatches an allowed phase once', () => {
  const h = harness();
  h.scene.selectNode('L02');
  h.scene.enterSelected();
  assert.equal(h.launches.length,0);
  arrive(h);
  h.changeCampaign(latest => { latest.worlds.W01.nodes.L02='LOCKED'; });
  h.scene.enterSelected();
  assert.equal(h.launches.length,0,'latest campaign lock overrides stale scene state');
  h.changeCampaign(latest => { latest.worlds.W01.nodes.L02='AVAILABLE'; });
  h.scene.enterSelected();
  assert.equal(h.launches.length,1);
  assert.equal(h.launches[0].scene,h.scene);
  assert.equal(h.launches[0].id,'W01_L02');
  assert.deepEqual(h.launches[0].payload,{fromWorldMap:true});
  h.scene.enterSelected();
  assert.equal(h.launches.length,1);
});

test('returnFromLevel restores the reached phase instead of an older saved map position', () => {
  const campaign = initialCampaign();
  campaign.worlds.W01.nodes.L02='COMPLETED';
  campaign.worlds.W01.nodes.L03='AVAILABLE';
  const h = harness({campaign,data:{returnFromLevel:'W01_L02'},reducedMotion:false});
  assert.equal(h.scene.selected,'L02');
  assert.equal(h.campaign().selected,'W01_L02');
  assert.equal(h.scene.phaseV046,'idle','returning from gameplay does not replay the world-entry panorama');
  assert.equal(h.scene.overviewV046,false);
  assert.equal(h.scene.heroV046.x,h.scene.nodes.L02.x);
  assert.deepEqual(M.readVisited(h.storage,h.campaign()),{W01:'L02'});
});

test('shutdown removes the HUD, resize listener and browser input listeners', () => {
  const h = harness();
  const hud=h.scene.hudV046, signal=h.scene.uiAbortV046.signal;
  assert.equal(h.scene.scale.listenerCount('resize'),1);
  h.scene.events.emit('shutdown');
  assert.ok(signal.aborted);
  assert.ok(hud.removed);
  assert.equal(h.scene.hudV046,null);
  assert.equal(h.scene.scale.listenerCount('resize'),0);
  assert.equal(h.win.__KELVOR_WORLD_MAP_V046__,undefined);
  h.key('ArrowUp');
  assert.equal(h.scene.walkV046,null,'inactive scene cannot receive stale keyboard events');
});
