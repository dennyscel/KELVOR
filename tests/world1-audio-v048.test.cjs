'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../patches/123-world1-audio-v048.js'), 'utf8');

class Param {
  constructor() { this.value = 0; this.events = []; }
  write(type, value, at, constant) { assert.ok(Number.isFinite(value)); assert.ok(Number.isFinite(at)); this.events.push({ type, value, at, constant }); this.value = value; }
  setValueAtTime(value, at) { this.write('set', value, at); }
  linearRampToValueAtTime(value, at) { this.write('linear', value, at); }
  exponentialRampToValueAtTime(value, at) { assert.ok(value > 0); this.write('exponential', value, at); }
  setTargetAtTime(value, at, constant) { this.write('target', value, at, constant); }
  cancelScheduledValues(at) { this.events.push({ type: 'cancel', at }); }
}
class AudioNode {
  constructor(context, kind) { this.context = context; this.kind = kind; this.connections = new Set(); this.gain = new Param(); this.frequency = new Param(); this.pan = new Param(); this.threshold = new Param(); this.ratio = new Param(); this.stopped = false; context.created.push(this); }
  connect(node) { this.connections.add(node); return node; }
  disconnect() { this.connections.clear(); }
  start(at = this.context.currentTime) { assert.ok(Number.isFinite(at)); this.startAt = at; }
  stop(at = this.context.currentTime) { assert.ok(Number.isFinite(at)); this.stopAt = at; }
}
class Context {
  constructor(state = 'running') { this.state = state; this.currentTime = 10; this.sampleRate = 1000; this.destination = { kind: 'destination' }; this.created = []; this.resumeCalls = 0; this.bufferCalls = 0; this.closed = false; }
  createGain() { return new AudioNode(this, 'gain'); }
  createBiquadFilter() { return new AudioNode(this, 'filter'); }
  createDynamicsCompressor() { return new AudioNode(this, 'compressor'); }
  createStereoPanner() { return new AudioNode(this, 'panner'); }
  createOscillator() { return new AudioNode(this, 'oscillator'); }
  createBufferSource() { return new AudioNode(this, 'noise'); }
  createBuffer(_channels, length) { this.bufferCalls++; const data = new Float32Array(length); return { getChannelData: () => data }; }
  resume() { this.resumeCalls++; if (this.onResume) return this.onResume(); this.state = 'running'; return Promise.resolve(); }
  close() { this.closed = true; }
  advance(seconds) {
    this.currentTime += seconds;
    for (const node of this.created) if (!node.stopped && node.stopAt !== undefined && node.stopAt <= this.currentTime) { node.stopped = true; node.onended?.(); }
  }
}
function setup({ state = 'running', context = new Context(state), values = {}, theme = 'day' } = {}) {
  const listeners = new Set(), document = { hidden: false, addEventListener(type, callback) { assert.equal(type, 'visibilitychange'); listeners.add(callback); }, removeEventListener(type, callback) { assert.equal(type, 'visibilitychange'); listeners.delete(callback); }, fire() { for (const callback of listeners) callback(); } };
  const window = { PlatformerSNESV04: {} }; vm.runInNewContext(source, { window, document, console });
  const settings = { get: key => values[key] }, scene = { sound: { context }, pausedV048: false };
  const score = new window.PlatformerSNESV04.World1ScoreV048(scene, theme, settings);
  return { score, scene, context, document, listeners, values };
}
const targets = node => node.gain.events.filter(event => event.type === 'target');

test('an already unlocked shared context starts a score on a gamepad-only scene transition', () => {
  const { score, context } = setup(); score.update(.2, false);
  assert.equal(score.started, true); assert.ok(score.nodes.size > 0); assert.equal(context.resumeCalls, 0);
  assert.ok([...score.nodes].every(node => node.startAt >= context.currentTime));
});

test('a suspended context is not resumed by animation frames; simultaneous activations share one resume', async () => {
  const { score, context } = setup({ state: 'suspended' }); let complete;
  context.onResume = () => new Promise(resolve => { complete = resolve; });
  score.update(.2, false); assert.equal(score.nodes.size, 0); assert.equal(context.resumeCalls, 0);
  const first = score.start(), second = score.start(); assert.equal(first, second); assert.equal(context.resumeCalls, 1);
  context.state = 'running'; complete(); assert.equal(await first, true); score.update(.2, false); assert.ok(score.nodes.size > 0);
});

test('resume rejection and synchronous failure remain retryable and do not throw through the input handler', async () => {
  const { score, context } = setup({ state: 'suspended' });
  context.onResume = () => Promise.reject(new Error('gesture required')); assert.equal(await score.start(), false); assert.equal(score.started, false);
  context.onResume = () => { throw new Error('context unavailable'); }; assert.equal(await score.start(), false);
  context.onResume = () => { context.state = 'running'; return Promise.resolve(); }; assert.equal(await score.start(), true);
});

test('late resume cannot restart a scene after destruction and never closes the shared context', async () => {
  const { score, context, listeners } = setup({ state: 'suspended' }); let complete;
  context.onResume = () => new Promise(resolve => { complete = resolve; }); const pending = score.start(); score.destroy();
  context.state = 'running'; complete(); assert.equal(await pending, false); assert.equal(score.started, false); assert.equal(context.closed, false); assert.equal(listeners.size, 0);
  assert.ok(context.created.every(node => node.connections.size === 0));
});

test('tone endings release envelopes, filters, panners and harmonic gains as well as oscillators', () => {
  const { score, context } = setup(); const backbone = new Set(context.created);
  score.tone(74, context.currentTime, .25, 'flute'); score.tone(62, context.currentTime, .8, 'pad');
  assert.equal(score.voices.size, 2); assert.equal(score.nodes.size, 4); context.advance(1);
  assert.equal(score.nodes.size, 0); assert.equal(score.voices.size, 0);
  assert.ok(context.created.filter(node => !backbone.has(node)).every(node => node.connections.size === 0));
  assert.ok([...backbone].some(node => node.connections.size > 0), 'the shared score buses remain usable');
});

test('a long sequence of effects and percussion releases every finished voice and reuses one noise buffer', () => {
  const { score, context } = setup(); const backbone = new Set(context.created);
  for (let index = 0; index < 200; index++) { score.effect('coin'); score.percussion(context.currentTime, index % 2 === 0); context.advance(.5); }
  assert.equal(score.nodes.size, 0); assert.equal(score.voices.size, 0); assert.equal(context.bufferCalls, 1);
  assert.ok(context.created.filter(node => !backbone.has(node)).every(node => node.connections.size === 0));
});

test('gain automation changes only with volume or pause state and applies master/music/effects independently', () => {
  const { score, context, values } = setup({ values: { masterVolume: 100, musicVolume: 80, sfxVolume: 60 } });
  for (let index = 0; index < 240; index++) { score.update(.1, false); context.advance(1 / 60); }
  assert.equal(targets(score.music).length, 1); assert.equal(targets(score.sfx).length, 1); assert.equal(score.lastMusicGain, .8 * .68); assert.equal(score.lastSfxGain, .6 * .7);
  values.musicVolume = 0; score.update(.1, false); assert.equal(score.lastMusicGain, 0); assert.equal(targets(score.sfx).length, 1);
  values.masterVolume = 50; score.update(.1, false); assert.equal(score.lastSfxGain, .5 * .6 * .7);
  values.masterVolume = NaN; values.sfxVolume = 1000; score.update(.1, false); assert.equal(score.lastSfxGain, .7);
});

test('visibility mutes immediately without another frame; a paused scene remains muted on returning', () => {
  const { score, scene, document, values } = setup(); score.update(.1, false); assert.ok(score.lastMusicGain > 0);
  document.hidden = true; document.fire(); assert.equal(score.lastMusicGain, 0); assert.equal(score.lastSfxGain, 0);
  const count = score.nodes.size; score.effect('coin'); assert.equal(score.nodes.size, count);
  values.muteWhenUnfocused = false; document.fire(); assert.ok(score.lastMusicGain > 0);
  scene.pausedV048 = true; document.hidden = false; document.fire(); assert.equal(score.lastMusicGain, 0);
  scene.pausedV048 = false; score.update(.1, false); assert.ok(score.lastMusicGain > 0);
});

test('pause stops scheduling and resume continues without trying to catch up the hidden interval', () => {
  const { score, context } = setup(); score.update(.8, false); const step = score.step;
  score.update(.8, true); context.advance(50); score.update(.8, true); assert.equal(score.step, step); assert.equal(score.lastMusicGain, 0);
  score.update(.8, false); assert.ok(score.step <= step + 1); assert.ok(score.next >= context.currentTime); assert.ok(score.lastMusicGain > 0);
});

test('a scene pausing later in the visibility event still mutes before any further animation frame', async () => {
  const { score, scene, document } = setup({ values: { muteWhenUnfocused: false } }); score.update(.1, false);
  document.hidden = true; document.fire(); scene.pausedV048 = true; await Promise.resolve();
  assert.equal(score.lastMusicGain, 0); assert.equal(score.lastSfxGain, 0);
});

test('finale follows the music bus even with effects muted and schedules only once', () => {
  const { score, context } = setup({ values: { sfxVolume: 0, musicVolume: 100 } }); score.update(.1, false);
  const previous = new Set(score.voices); score.finale(); const finale = [...score.voices].filter(voice => !previous.has(voice));
  assert.ok(finale.length > 0); assert.ok(finale.every(voice => voice.bus === 'music'));
  assert.ok([...previous].every(voice => [...voice.sources].every(node => node.stopAt <= context.currentTime + .051)));
  const count = context.created.length; score.finale(); score.update(.8, false); assert.equal(context.created.length, count); assert.equal(score.lastSfxGain, 0); assert.ok(score.lastMusicGain > 0);
  context.advance(8); assert.equal(score.voices.size, 0); assert.equal(score.nodes.size, 0);
});

test('devices without stereo panners and without a WebAudio context fail gracefully', async () => {
  const context = new Context(); context.createStereoPanner = undefined; const { score } = setup({ context });
  score.update(.8, false); context.advance(4); assert.equal(score.voices.size, 0); score.destroy();
  const fallback = setup({ context: null }).score; assert.equal(await fallback.start(), false); assert.doesNotThrow(() => { fallback.update(); fallback.effect('jump'); fallback.finale(); fallback.destroy(); });
});

test('destroy releases all active and future voices and late effect/update calls cannot create audio', () => {
  const { score, context, listeners } = setup(); score.update(.8, false); score.effect('bell'); score.finale(); const created = context.created.length;
  score.destroy(); score.destroy(); score.update(.8, false); score.effect('jump'); score.finale(); score.percussion(context.currentTime, true);
  assert.equal(context.created.length, created); assert.equal(score.nodes.size, 0); assert.equal(score.voices.size, 0); assert.equal(listeners.size, 0); assert.equal(context.closed, false);
  assert.ok(context.created.every(node => node.connections.size === 0));
});
