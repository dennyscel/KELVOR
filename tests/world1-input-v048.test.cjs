'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../patches/119-world1-input-v048.js'), 'utf8');

class Surface {
  constructor(tag = '') { this.tagName = tag.toUpperCase(); this.listeners = new Map(); this.children = []; this.parentNode = null; this.attributes = {}; this.dataset = {}; this.hidden = false; this.capture = new Set(); this.style = { setProperty(name, value) { this[name] = value; } }; this.rect = { left: 20, top: 200, width: 100, height: 100 }; }
  addEventListener(type, listener) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(listener); }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  fire(type, init = {}) { const event = { type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...init }; for (const listener of [...(this.listeners.get(type) || [])]) listener(event); return event; }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(value => value !== this); this.parentNode = null; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  contains(child) { return child === this || this.children.some(value => value.contains(child)); }
  closest(selector) {
    const selectors = selector.split(','); let element = this;
    while (element) {
      if (selectors.some(value => value === '[data-action]' ? !!element.dataset.action : value.startsWith('[') ? (() => { const match = value.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/); return match && (match[2] === undefined ? element.getAttribute(match[1]) !== null : element.getAttribute(match[1]) === match[2]); })() : element.tagName === value.toUpperCase())) return element;
      element = element.parentNode;
    }
    return null;
  }
  getBoundingClientRect() { return { ...this.rect }; }
  setPointerCapture(id) { this.capture.add(id); }
  hasPointerCapture(id) { return this.capture.has(id); }
  releasePointerCapture(id) { this.capture.delete(id); this.fire('lostpointercapture', { pointerId: id }); }
  listenerCount() { return [...this.listeners.values()].reduce((count, listeners) => count + listeners.size, 0) + this.children.reduce((count, child) => count + child.listenerCount(), 0); }
}
function setup({ settings = {}, forceTouch = false, maxTouchPoints = 0, coarse = false } = {}) {
  const window = new Surface(); const document = new Surface(); document.head = new Surface('head'); document.body = new Surface('body'); document.hidden = false;
  document.createElement = tag => new Surface(tag);
  document.getElementById = id => document.head.children.find(value => value.id === id) || null;
  let pads = []; const vibrations = []; const navigator = { maxTouchPoints, getGamepads: () => pads, vibrate: value => vibrations.push(value) };
  window.matchMedia = () => ({ matches: coarse }); window.PlatformerSNESV04 = {};
  vm.runInNewContext(source, { window, document, navigator, console });
  const host = new Surface('div'); document.body.appendChild(host);
  const values = { ...settings }; const saved = { get: name => values[name] };
  const input = new window.PlatformerSNESV04.World1InputV048({ host, settings: saved, forceTouch });
  const key = (type, code, extra = {}) => window.fire(type, { code, key: code, target: host, ...extra });
  const pointer = (target, type, id, x = 70, y = 250, extra = {}) => target.fire(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', button: 0, pressure: 0.5, ...extra });
  return { window, document, host, input, values, vibrations, key, pointer, setPads: next => { pads = next; } };
}
const makePad = (index = 0, id = 'Test controller') => ({ index, id, connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) });
const frame = input => input.frame(1 / 60);
const quiet = state => !state.x && !state.y && !Object.values(state.held).some(Boolean) && !Object.values(state.pressed).some(Boolean) && !state.pause && !state.back;

test('constructor demands a DOM host and exposes the independent class', () => {
  const { window, input } = setup(); assert.equal(typeof window.PlatformerSNESV04.World1InputV048, 'function');
  assert.throws(() => new window.PlatformerSNESV04.World1InputV048(), /DOM host/); assert.equal(quiet(frame(input)), true);
});

test('keyboard actions have one edge, hold state, and quick taps are not lost between frames', () => {
  const { input, key } = setup();
  assert.equal(key('keydown', 'Space').defaultPrevented, true);
  assert.equal(frame(input).pressed.jump, true); assert.equal(frame(input).held.jump, true); assert.equal(frame(input).pressed.jump, false);
  key('keydown', 'Space', { repeat: true }); assert.equal(frame(input).pressed.jump, false);
  key('keyup', 'Space'); assert.equal(frame(input).held.jump, false);
  key('keydown', 'KeyZ'); key('keyup', 'KeyZ'); const tap = frame(input); assert.equal(tap.pressed.jump, true); assert.equal(tap.held.jump, false); assert.equal(frame(input).pressed.jump, false);
});

test('all four keyboard actions, aliases and simultaneous movement retain independent meaning', () => {
  const { input, key } = setup();
  ['KeyD', 'Space', 'KeyB', 'KeyX', 'KeyY'].forEach(code => key('keydown', code));
  const result = frame(input); assert.equal(result.x, 1); assert.deepEqual({ ...result.held }, { jump: true, attack: true, dash: true, interact: true });
  key('keydown', 'KeyJ'); key('keyup', 'KeyB'); assert.equal(frame(input).held.attack, true);
  key('keyup', 'KeyJ'); assert.equal(frame(input).held.attack, false);
  key('keydown', 'KeyA'); assert.equal(frame(input).x, 0);
});

test('external form fields, links and controls retain browser key behavior; accepted keys still release after focus moves', () => {
  const { input, key } = setup(); const external = new Surface('input');
  assert.equal(key('keydown', 'ArrowRight', { target: external }).defaultPrevented, false); assert.equal(quiet(frame(input)), true);
  assert.equal(key('keydown', 'Space', { target: new Surface('button') }).defaultPrevented, false);
  assert.equal(key('keydown', 'KeyA', { ctrlKey: true }).defaultPrevented, false);
  key('keydown', 'KeyD'); assert.equal(frame(input).x, 1); key('keyup', 'KeyD', { target: external }); assert.equal(frame(input).x, 0);
});

test('Escape emits pause once and never silently emits back', () => {
  const { input, key } = setup(); key('keydown', 'Escape'); const event = frame(input); assert.equal(event.pause, true); assert.equal(event.back, false);
  assert.equal(frame(input).pause, false); key('keydown', 'Escape', { repeat: true }); assert.equal(frame(input).pause, false);
  key('keyup', 'Escape'); key('keydown', 'Escape'); assert.equal(frame(input).pause, true);
});

test('touch stick reports continuous displacement, clamps radial travel and does not infer pressure', () => {
  const { input, pointer } = setup({ forceTouch: true });
  pointer(input.stick, 'pointerdown', 1, 70, 250, { pressure: 1 }); assert.equal(frame(input).x, 0);
  pointer(input.stick, 'pointermove', 1, 87, 250, { pressure: 0 }); assert.equal(frame(input).x, 0.5);
  pointer(input.stick, 'pointermove', 1, 104, 284); const diagonal = frame(input); assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-12); assert.ok(Math.abs(diagonal.x - Math.SQRT1_2) < 1e-12);
  assert.equal(input.stick.hasPointerCapture(1), true); pointer(input.stick, 'pointerup', 1); assert.equal(frame(input).x, 0); assert.equal(input.stick.hasPointerCapture(1), false);
});

test('stick and A B X Y accept simultaneous pointers and releasing a second finger does not steal the stick', () => {
  const { input, pointer } = setup({ forceTouch: true }); pointer(input.stick, 'pointerdown', 1, 104, 250);
  ['jump', 'attack', 'dash', 'interact'].forEach((action, index) => pointer(input.buttons[action], 'pointerdown', index + 2));
  let output = frame(input); assert.equal(output.x, 1); assert.equal(Object.values(output.held).every(Boolean), true);
  pointer(input.stick, 'pointerdown', 8, 36, 250); pointer(input.stick, 'pointerup', 8); assert.equal(frame(input).x, 1);
  pointer(input.buttons.jump, 'pointerup', 2); output = frame(input); assert.equal(output.x, 1); assert.equal(output.held.jump, false); assert.equal(output.held.attack, true);
});

test('two fingers on one action hold until both release, without double edges', () => {
  const { input, pointer } = setup({ forceTouch: true }); pointer(input.buttons.jump, 'pointerdown', 2); assert.equal(frame(input).pressed.jump, true);
  pointer(input.buttons.jump, 'pointerdown', 3); assert.equal(frame(input).pressed.jump, false); pointer(input.buttons.jump, 'pointerup', 2); assert.equal(frame(input).held.jump, true);
  pointer(input.buttons.jump, 'pointerup', 3); assert.equal(frame(input).held.jump, false);
});

test('pointer cancellation and lost capture release axes and actions without queued phantom actions', () => {
  const { input, pointer } = setup({ forceTouch: true }); pointer(input.stick, 'pointerdown', 1, 104, 250); pointer(input.buttons.attack, 'pointerdown', 2);
  pointer(input.buttons.attack, 'pointercancel', 2); pointer(input.stick, 'lostpointercapture', 1); assert.equal(quiet(frame(input)), true);
  pointer(input.buttons.jump, 'pointerdown', 3); pointer(input.buttons.jump, 'lostpointercapture', 3); assert.equal(quiet(frame(input)), true);
});

test('mouse secondary click is ignored; real primary pointer uses the same controls', () => {
  const { input, pointer } = setup({ forceTouch: true });
  assert.equal(pointer(input.buttons.jump, 'pointerdown', 2, 70, 250, { pointerType: 'mouse', button: 2 }).defaultPrevented, false); assert.equal(quiet(frame(input)), true);
  pointer(input.buttons.jump, 'pointerdown', 3, 70, 250, { pointerType: 'mouse', button: 0 }); assert.equal(frame(input).pressed.jump, true);
});

test('settings honor auto/on/off, handedness, scales, opacity and live haptic preference', () => {
  const { input, values, pointer, vibrations } = setup({ settings: { touchControls: 'off' }, forceTouch: true }); assert.equal(input.root.hidden, false); assert.equal(input.stick.hidden, true); assert.equal(input.diamond.hidden, true); assert.equal(input.pauseButton.hidden, false);
  values.touchControls = 'on'; values.leftHanded = true; values.joystickSize = 130; values.actionButtonScale = 80; values.joystickOpacity = 35; values.haptics = false; frame(input);
  assert.equal(input.root.hidden, false); assert.equal(input.stick.hidden, false); assert.equal(input.diamond.hidden, false); assert.equal(input.root.dataset.leftHanded, 'true'); assert.equal(input.root.style['--joy'], '145.6px'); assert.equal(input.root.style['--action'], '44px'); assert.equal(input.root.style['--control-opacity'], '0.35');
  pointer(input.buttons.jump, 'pointerdown', 2); assert.equal(vibrations.length, 0); pointer(input.buttons.jump, 'pointerup', 2);
  values.haptics = true; pointer(input.buttons.attack, 'pointerdown', 3); assert.equal(vibrations.length, 1);
  values.touchControls = 'off'; assert.equal(quiet(frame(input)), false, 'the already completed valid jump tap remains queued'); assert.equal(frame(input).held.attack, false); assert.equal(input.activePointers.size, 0);
});

test('automatic touch detection supports both maxTouchPoints and coarse pointers; desktop remains uncluttered', () => {
  const desktop = setup().input; assert.equal(desktop.root.hidden, false); assert.equal(desktop.root.dataset.touch, 'false'); assert.equal(desktop.stick.hidden, true); assert.equal(desktop.diamond.hidden, true); assert.equal(desktop.pauseButton.hidden, false);
  desktop.pauseButton.fire('click'); assert.equal(frame(desktop).pause, true, 'desktop player can pause without keyboard');
  assert.equal(setup({ maxTouchPoints: 1 }).input.stick.hidden, false); assert.equal(setup({ coarse: true }).input.diamond.hidden, false);
});

test('gamepad requires a neutral frame at entry and maps A B X Y to their precise actions', () => {
  const { input, setPads } = setup(); const pad = makePad(); pad.buttons[0].pressed = true; setPads([pad]); assert.equal(quiet(frame(input)), true); assert.equal(input.root.dataset.gamepad, 'waiting-neutral');
  pad.buttons[0].pressed = false; assert.equal(quiet(frame(input)), true); assert.equal(input.root.dataset.gamepad, 'ready');
  for (let index = 0; index < 4; index++) pad.buttons[index].pressed = true;
  const all = frame(input); assert.equal(Object.values(all.held).every(Boolean), true); assert.equal(Object.values(all.pressed).every(Boolean), true); assert.equal(Object.values(frame(input).pressed).some(Boolean), false);
});

test('radial gamepad deadzone preserves a precise continuous curve and diagonal unit length', () => {
  const { input, setPads } = setup(); const pad = makePad(); setPads([pad]); frame(input);
  pad.axes = [0.14, 0]; assert.equal(frame(input).x, 0);
  pad.axes = [0.575, 0]; assert.ok(Math.abs(frame(input).x - 0.5) < 1e-12);
  pad.axes = [0.2, 0.2]; const small = frame(input); assert.ok(small.x > 0 && small.x < 0.2); assert.equal(small.x, small.y);
  pad.axes = [1, 1]; const corner = frame(input); assert.ok(Math.abs(Math.hypot(corner.x, corner.y) - 1) < 1e-12);
});

test('D-pad, Start and Back use edge events, and connection replacement repeats the neutral gate', () => {
  const { input, setPads } = setup(); const pad = makePad(); setPads([pad]); frame(input);
  pad.buttons[15].pressed = true; pad.buttons[9].pressed = true; let output = frame(input); assert.equal(output.x, 1); assert.equal(output.pause, true); assert.equal(frame(input).pause, false);
  pad.buttons[8].pressed = true; assert.equal(frame(input).back, true); assert.equal(frame(input).back, false);
  const replacement = makePad(0, 'A new controller'); replacement.axes = [1, 0]; setPads([replacement]); assert.equal(quiet(frame(input)), true);
  replacement.axes = [0, 0]; frame(input); replacement.axes = [-1, 0]; assert.equal(frame(input).x, -1);
  setPads([]); assert.equal(quiet(frame(input)), true); assert.equal(input.root.dataset.gamepad, 'none');
});

test('overlapping keyboard, stick and gamepad use a complete vector without multiplying speed', () => {
  const { input, setPads, key, pointer } = setup({ forceTouch: true }); const pad = makePad(); setPads([pad]); frame(input); pad.axes = [0, 1]; pointer(input.stick, 'pointerdown', 1, 87, 250);
  assert.equal(frame(input).y, 1); assert.equal(frame(input).x, 0); key('keydown', 'KeyD'); let output = frame(input); assert.equal(output.x, 1); assert.equal(output.y, 0);
  key('keydown', 'KeyW'); output = frame(input); assert.ok(Math.abs(Math.hypot(output.x, output.y) - 1) < 1e-12);
});

test('blur, hidden tabs and resizing clear touches; inactive windows cannot resume pad input', () => {
  const { input, key, pointer, window, document, setPads } = setup({ forceTouch: true }); const pad = makePad(); setPads([pad]); frame(input);
  key('keydown', 'Space'); pointer(input.stick, 'pointerdown', 1, 104, 250); window.fire('blur'); assert.equal(quiet(frame(input)), true);
  frame(input); pad.axes = [1, 0]; assert.equal(quiet(frame(input)), true); window.fire('focus'); assert.equal(quiet(frame(input)), true);
  pad.axes = [0, 0]; frame(input); pad.axes = [1, 0]; assert.equal(frame(input).x, 1);
  document.hidden = true; document.fire('visibilitychange'); assert.equal(quiet(frame(input)), true); document.hidden = false; document.fire('visibilitychange'); pad.axes = [0, 0]; frame(input);
  pointer(input.buttons.dash, 'pointerdown', 2); window.fire('resize'); assert.equal(quiet(frame(input)), true);
});

test('disable/re-enable clears all input and requires fresh gamepad neutrality', () => {
  const { input, key, setPads } = setup({ forceTouch: true }); const pad = makePad(); setPads([pad]); frame(input); pad.buttons[0].pressed = true; key('keydown', 'KeyD'); frame(input);
  input.setEnabled(false); assert.equal(quiet(frame(input)), true); assert.equal(input.root.hidden, true); key('keydown', 'Space');
  input.setEnabled(true); assert.equal(quiet(frame(input)), true); assert.equal(input.root.hidden, false); pad.buttons[0].pressed = false; frame(input); pad.buttons[0].pressed = true; assert.equal(frame(input).pressed.jump, true);
});

test('pause click and keyboard-focused actions are accessible without hijacking the pause button', () => {
  const { input, key } = setup({ forceTouch: true }); input.pauseButton.fire('click'); assert.equal(frame(input).pause, true);
  assert.equal(key('keydown', 'Space', { target: input.pauseButton }).defaultPrevented, false); assert.equal(quiet(frame(input)), true);
  key('keydown', 'Space', { target: input.buttons.attack }); let output = frame(input); assert.equal(output.pressed.attack, true); assert.equal(output.pressed.jump, false); key('keyup', 'Space', { target: input.buttons.attack });
  input.buttons.interact.fire('click', { detail: 0 }); assert.equal(frame(input).pressed.interact, true);
  assert.equal(input.buttons.jump.getAttribute('aria-label'), 'A · Pular');
});

test('destroy removes every listener and the overlay; old controls cannot affect the next scene', () => {
  const { input, host, window, document, pointer, key } = setup({ forceTouch: true }); const oldRoot = input.root;
  pointer(input.buttons.jump, 'pointerdown', 1); input.destroy(); input.destroy();
  assert.equal(host.children.length, 0); assert.equal(oldRoot.listenerCount(), 0); assert.equal(window.listenerCount(), 0); assert.equal(document.listenerCount(), 0);
  key('keydown', 'Space'); input.buttons.jump.fire('click', { detail: 0 }); assert.equal(quiet(frame(input)), true); assert.equal(input.activePointers.size, 0);
});
