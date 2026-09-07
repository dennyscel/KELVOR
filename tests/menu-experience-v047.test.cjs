'use strict';

// Controller contract tests execute the shipped patch. Browser layout and actual
// codec/device support remain separate visual/integration checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../patches/118-menu-experience-v047.js'), 'utf8');

class Hub {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, options = {}) {
    if (options.signal?.aborted) return;
    const list = this.listeners.get(type) || new Set(); list.add(fn); this.listeners.set(type, list);
    options.signal?.addEventListener('abort', () => list.delete(fn), {once:true});
  }
  dispatchEvent(event) {
    event.target ||= this;
    for (const fn of this.listeners.get(event.type) || []) fn(event);
    return !event.defaultPrevented;
  }
  listenerCount() { return [...this.listeners.values()].reduce((sum, list) => sum + list.size, 0); }
}
class Element extends Hub {
  constructor(document, properties = {}) {
    super(); Object.assign(this, {document, dataset:{}, attributes:{}, hidden:false, offsetWidth:100,
      innerHTML:'', textContent:'', tagName:'BUTTON', selectors:new Map(), all:[], removed:false}, properties);
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  querySelector(selector) { return this.selectors.get(selector) || null; }
  querySelectorAll() { return this.all; }
  getClientRects() { return this.hidden ? [] : [{}]; }
  contains(element) { return element === this || !!element?.inRoot; }
  focus() { this.document.activeElement = this; }
  click() { this.clicks = (this.clicks || 0) + 1; this.onClick?.(); }
  scrollIntoView() {}
  remove() { this.removed = true; }
  closest(selector) {
    if (selector === 'button') return this.tagName === 'BUTTON' ? this : this.buttonParent || null;
    if (selector === '[data-action="sound"]') return this.dataset.action === 'sound' ? this : null;
    return null;
  }
}
function deferred() {
  let resolve, reject; const promise = new Promise((yes, no) => { resolve=yes; reject=no; });
  return {promise, resolve, reject};
}
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture(screen = 'home', options = {}) {
  const document = new Hub();
  Object.assign(document, {hidden:false, fullscreenEnabled:false, documentElement:{dataset:{}}, activeElement:null});
  const root = new Element(document, {tagName:'SECTION'}), main = new Element(document, {tagName:'MAIN'});
  const saved = new Element(document), modal = new Element(document, {hidden:true}), toast = new Element(document, {hidden:true});
  const nodes = {saved, modal, toast};
  root.selectors.set('.km47-saved', saved); root.selectors.set('.km47-modal', modal); root.selectors.set('.km47-toast', toast);
  for (const name of ['title','detail','state']) root.selectors.set(`[data-music="${name}"]`, new Element(document));
  const toggle = new Element(document, {dataset:{action:'toggleTrack'}, inRoot:true});
  root.selectors.set('[data-action="toggleTrack"]', toggle);
  const sound = new Element(document, {dataset:{action:'sound'}, inRoot:true});
  sound.selectors.set('span', new Element(document)); root.selectors.set('[data-action="sound"]', sound);
  const defaults = {masterVolume:100,musicVolume:82,sfxVolume:88,uiVolume:80,ambienceVolume:68,menuMotion:true,muteWhenUnfocused:true,haptics:false,fullscreenOnPlay:false,debugOverlay:false};
  const campaign = JSON.stringify({currentWorld:'W02',selected:'W02_L02',worlds:{W01:{completed:true},W02:{nodes:{L02:'AVAILABLE'}}}});
  const data = new Map([['kelvor_campaign_rc1_v001',campaign]]), writes = [];
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem(key, value) { if(options.storageBlocked) throw new Error('Storage unavailable'); writes.push(key); data.set(key,value); }
  };
  const settings = {
    values:{...defaults},
    get(key) { return this.values[key]; },
    set(key, value) {
      this.values[key] = key.endsWith('Volume') ? Math.max(0, Math.min(100, Number(value))) : value;
      try { localStorage.setItem('kelvor_settings_v001', JSON.stringify(this.values)); } catch (_) {}
      return this.values[key];
    },
    reset() { this.values={...defaults}; try { localStorage.setItem('kelvor_settings_v001',JSON.stringify(this.values)); } catch (_) {} }
  };
  const audio = {
    currentMusic:null,currentCue:null,plays:[],stops:0,
    volume(cue, gain=1) { return settings.get('masterVolume') / 100 * settings.get(cue.startsWith('MUS_')?'musicVolume':'uiVolume') / 100 * gain; },
    play() {},
    playMusic(scene, cue, loop, opts) {
      if(options.audioUnavailable) return false;
      if (options.redirectTitle && cue === 'MUS_GLOBAL_TITLE') cue='MUS_P1_EXPLORE_A';
      const sound = {isPlaying:true, volume:this.volume(cue,opts.gain), events:new Map(),
        setVolume(value) { this.volume=value; },
        once(event, callback) { this.events.set(event, callback); },
        complete() { this.isPlaying=false; this.events.get('complete')?.(); }
      };
      this.currentCue=cue; this.currentMusic=sound; this.plays.push({cue,loop,opts,sound}); return true;
    },
    stopMusic() { this.stops++; if(this.currentMusic) this.currentMusic.isPlaying=false; this.currentMusic=null; this.currentCue=null; }
  };
  const starts = [], resume = options.resume || (()=>Promise.resolve());
  const scene = {scene:{start:key=>starts.push(key)},scale:{isFullscreen:false,startFullscreen:()=>Promise.resolve()},
    sound:{locked:false,mute:false,unlock(){},context:{state:options.resume?'suspended':'running',resume}}};
  const window = new Hub(); window.matchMedia=()=>({matches:false});
  const navigator = {getGamepads:()=>options.pad ? [options.pad] : [],vibrate(){}};
  const P = {GameSettingsV10:settings,AudioServiceRC25:audio,InputRouter:{hasTouch:()=>true}};
  window.PlatformerSNESV04=P;
  const context = vm.createContext({window,document,navigator,localStorage,AbortController,
    Event:class { constructor(type, init) { this.type=type; Object.assign(this,init); } },
    Phaser:{Scenes:{Events:{SHUTDOWN:'shutdown'}}},console});
  vm.runInContext(source, context, {filename:'118-menu-experience-v047.js'});
  const controller = Object.create(P.MenuExperienceV047.MenuController.prototype);
  Object.assign(controller,{scene,screen,root,main,alive:true,busy:false,tab:'audio',track:0,playing:false,audioSeq:0,
    soundRef:null,padNeutral:false,padButtons:[],padNext:0,time:0,lastMaster:100,abort:new AbortController()});
  window.__KELVOR_MENU_V047__=controller;
  return {controller,P,settings,audio,scene,starts,root,main,nodes,document,window,navigator,localStorage,data,writes,campaign,toggle,sound};
}

test('double play requests produce one map entry without changing campaign progress', () => {
  const f=fixture(); f.controller.play(); f.controller.play(); f.controller.action('play');
  assert.deepEqual(f.starts,['WorldMapSceneRC1']);
  assert.equal(f.data.get('kelvor_campaign_rc1_v001'),f.campaign);
});

test('fullscreen rejection falls back to one map entry despite repeated taps', async () => {
  const f=fixture(), fullscreen=deferred();
  f.settings.values.fullscreenOnPlay=true; f.document.fullscreenEnabled=true;
  f.scene.scale.startFullscreen=()=>fullscreen.promise;
  f.controller.play(); f.controller.play(); assert.equal(f.starts.length,0);
  fullscreen.reject(new Error('Browser denied fullscreen')); await flush();
  assert.deepEqual(f.starts,['WorldMapSceneRC1']);
});

test('leaving the scene while fullscreen is pending prevents late map entry', async () => {
  const f=fixture(), fullscreen=deferred();
  f.settings.values.fullscreenOnPlay=true; f.document.fullscreenEnabled=true;
  f.scene.scale.startFullscreen=()=>fullscreen.promise;
  f.controller.play(); f.controller.destroy(); fullscreen.resolve(); await flush();
  assert.deepEqual(f.starts,[]);
});

test('range input applies service-clamped value to current sound and accessible output', () => {
  const f=fixture('options'); f.controller.bind();
  f.audio.playMusic(f.scene,'MUS_P1_EXPLORE_A',true,{gain:.54});
  const output=new Element(f.document), parent=new Element(f.document), range=new Element(f.document,
    {tagName:'INPUT',type:'range',value:'37',dataset:{setting:'musicVolume'},parentElement:parent});
  parent.selectors.set('output',output);
  f.root.dispatchEvent({type:'input',target:range});
  assert.equal(f.settings.get('musicVolume'),37);
  assert.ok(Math.abs(f.audio.currentMusic.volume-.37*.54)<1e-10);
  assert.equal(output.textContent,'37%'); assert.equal(range.attributes['aria-valuetext'],'37%');
  assert.match(f.nodes.saved.textContent,/salvos automaticamente/);
  range.value='120'; f.root.dispatchEvent({type:'input',target:range});
  assert.equal(f.settings.get('musicVolume'),100); assert.equal(output.textContent,'100%');
});

test('storage failure reports session-only settings without losing live audio adjustment', () => {
  const f=fixture('music',{storageBlocked:true});
  f.audio.playMusic(f.scene,'MUS_P1_EXPLORE_A',true,{gain:.72});
  f.controller.saveSetting('musicVolume',25);
  assert.ok(Math.abs(f.audio.currentMusic.volume-.25*.72)<1e-10);
  assert.match(f.nodes.saved.textContent,/nesta sessão/);
});

test('restore resets preferences and playing volume but preserves campaign bytes', () => {
  const f=fixture('options'); f.settings.values.musicVolume=14; f.settings.values.menuMotion=false;
  f.audio.playMusic(f.scene,'MUS_P1_EXPLORE_A',true,{gain:.54});
  f.controller.action('confirmReset');
  assert.equal(f.settings.get('musicVolume'),82); assert.equal(f.root.dataset.motion,'on');
  assert.ok(Math.abs(f.audio.currentMusic.volume-.82*.54)<1e-10);
  assert.equal(f.data.get('kelvor_campaign_rc1_v001'),f.campaign);
  assert.ok(f.writes.every(key=>key==='kelvor_settings_v001'));
});

test('title preview stops the effective redirected audio instance', async () => {
  const f=fixture('music',{redirectTitle:true});
  const index=f.P.MenuExperienceV047.tracks.findIndex(t=>t.cue==='MUS_GLOBAL_TITLE');
  await f.controller.playTrack(index);
  assert.equal(f.controller.playing,true); assert.equal(f.audio.currentCue,'MUS_P1_EXPLORE_A');
  const instance=f.audio.currentMusic; f.controller.action('toggleTrack');
  assert.equal(instance.isPlaying,false); assert.equal(f.audio.currentMusic,null); assert.equal(f.controller.playing,false);
});

test('one-shot completion updates replay control and allows another play', async () => {
  const f=fixture('music');
  const index=f.P.MenuExperienceV047.tracks.findIndex(t=>t.cue==='MUS_GLOBAL_VICTORY_STINGER');
  await f.controller.playTrack(index); assert.equal(f.audio.plays[0].loop,false);
  f.audio.currentMusic.complete();
  assert.equal(f.controller.playing,false); assert.equal(f.toggle.attributes['aria-label'],'Reproduzir faixa');
  await f.controller.playTrack(index); assert.equal(f.controller.playing,true); assert.equal(f.audio.plays.length,2);
});

test('unavailable audio stays stopped and presents a retry message', async () => {
  const f=fixture('music',{audioUnavailable:true});
  assert.equal(await f.controller.playTrack(),false); assert.equal(f.controller.playing,false);
  assert.match(f.nodes.toast.textContent,/Não foi possível/);
});

test('pending audio resume is cancelled when navigating out of the music screen', async () => {
  const pending=deferred(), f=fixture('music',{resume:()=>pending.promise});
  const attempt=f.controller.playTrack(); f.controller.navigate('home');
  pending.resolve(); assert.equal(await attempt,false);
  assert.deepEqual(f.starts,['MainMenuSceneV10']); assert.equal(f.audio.plays.length,0);
});

test('an already running sound manager never installs more unlock listeners or resumes again', async () => {
  const f=fixture('music'); let unlocks=0,resumes=0;
  f.scene.sound.unlock=()=>unlocks++;
  f.scene.sound.context.resume=()=>{resumes++; return Promise.resolve();};
  await f.controller.unlock(); await f.controller.playTrack(0); await f.controller.playTrack(1);
  assert.equal(unlocks,0); assert.equal(resumes,0);
});

test('a locked suspended sound manager registers its unlock listeners only once across attempts', async () => {
  const f=fixture('music'); let unlocks=0,resumes=0;
  f.scene.sound.locked=true; f.scene.sound.context.state='suspended';
  f.scene.sound.unlock=()=>unlocks++;
  f.scene.sound.context.resume=()=>{resumes++; return Promise.resolve();};
  await f.controller.unlock(); await f.controller.unlock(); await f.controller.unlock();
  assert.equal(unlocks,1); assert.ok(resumes>=1);
});

test('pending audio resume is cancelled on shutdown and cannot mutate a later scene', async () => {
  const pending=deferred(), f=fixture('music',{resume:()=>pending.promise});
  const attempt=f.controller.playTrack(); f.controller.destroy(); pending.resolve();
  assert.equal(await attempt,false); assert.equal(f.audio.plays.length,0); assert.equal(f.root.removed,true);
});

test('rapid track choices permit only the latest asynchronous selection to play', async () => {
  const first=deferred(),second=deferred(); let calls=0;
  const f=fixture('music',{resume:()=>++calls===1?first.promise:second.promise});
  const a=f.controller.playTrack(0), b=f.controller.playTrack(1);
  second.resolve(); assert.equal(await b,true); first.resolve(); assert.equal(await a,false);
  assert.equal(f.audio.plays.length,1); assert.equal(f.audio.currentCue,'MUS_P1_BOSS_LOOP_A');
});

test('completion from a replaced sound cannot stop the newly selected track', async () => {
  const f=fixture('music'); await f.controller.playTrack(2); const oldSound=f.audio.currentMusic;
  await f.controller.playTrack(1); const newSound=f.audio.currentMusic;
  oldSound.complete();
  assert.equal(newSound.isPlaying,true); assert.equal(f.controller.playing,true);
});

function pad() { return {connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))}; }

test('gamepad waits for neutral on scene entry and fires confirm only on press edges', () => {
  const gamepad=pad(), f=fixture('home',{pad:gamepad});
  const target=new Element(f.document,{inRoot:true}); f.document.activeElement=target;
  gamepad.buttons[0].pressed=true; f.controller.update(100); assert.equal(target.clicks||0,0);
  gamepad.buttons[0].pressed=false; f.controller.update(120);
  gamepad.buttons[0].pressed=true; f.controller.update(140); f.controller.update(600);
  assert.equal(target.clicks,1);
  gamepad.buttons[0].pressed=false; f.controller.update(700); gamepad.buttons[0].pressed=true; f.controller.update(710);
  assert.equal(target.clicks,2);
});

test('blur requires gamepad neutral before accepting input again', () => {
  const gamepad=pad(), f=fixture('home',{pad:gamepad}); f.controller.bind();
  const target=new Element(f.document,{inRoot:true}); f.document.activeElement=target;
  f.controller.update(100); gamepad.buttons[0].pressed=true; f.controller.update(150);
  assert.equal(target.clicks,1); f.window.dispatchEvent({type:'blur'});
  f.controller.update(400); assert.equal(target.clicks,1);
  gamepad.buttons[0].pressed=false; f.controller.update(500); gamepad.buttons[0].pressed=true; f.controller.update(600);
  assert.equal(target.clicks,2);
});

test('holding Tab cannot move focus out of an open confirmation dialog', () => {
  const f=fixture('options'); f.controller.bind(); f.nodes.modal.hidden=false;
  const first=new Element(f.document,{inRoot:true}),last=new Element(f.document,{inRoot:true});
  f.nodes.modal.all=[first,last]; f.document.activeElement=last;
  const event={type:'keydown',key:'Tab',repeat:true,shiftKey:false,preventDefault(){this.defaultPrevented=true;}};
  f.window.dispatchEvent(event);
  assert.equal(event.defaultPrevented,true); assert.equal(f.document.activeElement,first);
});

test('shutdown removes DOM/global listeners, stops preview and clears only its own global reference', async () => {
  const f=fixture('music'); f.controller.bind(); await f.controller.playTrack();
  assert.ok(f.root.listenerCount()>0); assert.ok(f.window.listenerCount()>0); assert.ok(f.document.listenerCount()>0);
  f.controller.destroy();
  assert.equal(f.root.listenerCount(),0); assert.equal(f.window.listenerCount(),0); assert.equal(f.document.listenerCount(),0);
  assert.equal(f.controller.alive,false); assert.equal(f.root.removed,true); assert.equal(f.audio.currentMusic,null);
  assert.equal(f.window.__KELVOR_MENU_V047__,undefined);
  f.window.__KELVOR_MENU_V047__={newScene:true}; f.controller.destroy();
  assert.equal(f.window.__KELVOR_MENU_V047__.newScene,true);
});
