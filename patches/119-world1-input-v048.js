(function (P) {
  'use strict';
  const ACTIONS = ['jump', 'attack', 'dash', 'interact'];
  const KEY_ACTIONS = { Space: 'jump', KeyZ: 'jump', KeyJ: 'attack', KeyB: 'attack', KeyK: 'dash', KeyX: 'dash', KeyE: 'interact', KeyY: 'interact' };
  const DIRECTIONS = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] };
  const DEFAULTS = { touchControls: 'auto', leftHanded: false, joystickSize: 100, actionButtonScale: 100, joystickOpacity: 65, haptics: true };
  const emptyActions = () => Object.fromEntries(ACTIONS.map(action => [action, false]));
  const clamp = (number, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(number)) ? Number(number) : 0));
  const unit = (x, y) => { const length = Math.hypot(x, y); return length > 1 ? { x: x / length, y: y / length } : { x, y }; };
  const pressedButton = button => !!(button && (button.pressed || button.value > 0.25));
  const STYLE = `
.kw48-input{position:absolute;inset:0;z-index:32;pointer-events:none;user-select:none;-webkit-user-select:none;color:#fff4cf;font:600 12px/1.2 system-ui,sans-serif;--joy:112px;--action:48px;--control-opacity:.65;--edge:16px}
.kw48-input[hidden],.kw48-input [hidden]{display:none!important}.kw48-input[data-touch='false'] .kw48-stick,.kw48-input[data-touch='false'] .kw48-diamond{display:none}.kw48-input *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.kw48-stick,.kw48-action,.kw48-pause{pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.kw48-stick{position:absolute;width:var(--joy);height:var(--joy);left:max(var(--edge),env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));border-radius:50%;border:1.5px solid #ebd695a6;background:radial-gradient(circle at 35% 25%,#497061ad,#071e20d9 75%);box-shadow:0 5px 22px #0005,inset 0 0 0 6px #152f3280,inset 0 0 0 7px #e6d49936;opacity:var(--control-opacity)}
.kw48-stick:before{content:'';position:absolute;inset:24%;border:1px solid #f1e0aa3d;border-radius:50%}.kw48-stick:after{content:'✧';position:absolute;inset:0;display:grid;place-items:center;font-size:24px;color:#e3d6a830}
.kw48-thumb{position:absolute;width:38%;height:38%;left:31%;top:31%;border-radius:50%;background:radial-gradient(circle at 35% 25%,#bfd9a3,#446d5b 52%,#173b39);border:1.5px solid #fae3a5;box-shadow:0 3px 7px #001d23a6,inset 0 0 0 3px #fce5b12b;will-change:transform;z-index:1}
.kw48-stick[data-active='true']{opacity:1;border-color:#fff0bb;box-shadow:0 0 25px #ddca4c35,inset 0 0 0 6px #152f3280}
.kw48-stick-caption{position:absolute;left:50%;bottom:-16px;transform:translateX(-50%);color:#fff1c8c9;font-size:9px;letter-spacing:1.4px;text-shadow:0 2px 3px #001618;white-space:nowrap}
.kw48-diamond{position:absolute;right:max(var(--edge),env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));width:calc(var(--action)*2.86);height:calc(var(--action)*2.86);pointer-events:none;opacity:var(--control-opacity)}
.kw48-diamond:has([data-held='true']){opacity:1}.kw48-action{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:var(--action);height:var(--action);padding:0;border-radius:50%;border:1px solid #e9d49eab;color:#fff3cf;background:radial-gradient(circle at 35% 20%,#416955eb,#102e30eb 78%);box-shadow:0 4px 9px #001d27a1,inset 0 0 0 3px #e5d9a016;cursor:pointer}
.kw48-action strong{font-size:clamp(15px,calc(var(--action)*.35),24px);font-weight:750;line-height:1}.kw48-action span{font-size:clamp(8px,calc(var(--action)*.16),10px);letter-spacing:.1px;color:#f4e5b6;line-height:1.25}.kw48-action[data-action='jump']{left:calc(var(--action)*.93);top:calc(var(--action)*1.86);border-color:#b6e7a5;background:radial-gradient(circle at 35% 20%,#5b895de8,#17423ae8 78%)}
.kw48-action[data-action='attack']{left:calc(var(--action)*1.86);top:calc(var(--action)*.93);border-color:#edb58a}.kw48-action[data-action='dash']{left:0;top:calc(var(--action)*.93);border-color:#a9d4e8}.kw48-action[data-action='interact']{left:calc(var(--action)*.93);top:0;border-color:#f4d57c}
.kw48-action[data-held='true']{background:radial-gradient(circle at 35% 20%,#c3bf6c,#345f45 70%);box-shadow:0 0 17px #eed66f66,inset 0 2px 6px #1933288c;border-color:#fff2b8}
.kw48-action:focus-visible,.kw48-pause:focus-visible{outline:3px solid #fff0bc;outline-offset:3px}.kw48-pause{position:absolute;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));width:44px;height:44px;padding:0;display:grid;place-items:center;background:#102c30ca;border:1px solid #e2ca8e80;color:#ffeab5;border-radius:14px;box-shadow:0 3px 10px #00182455;cursor:pointer}.kw48-pause svg{width:17px;height:19px;fill:currentColor}
.kw48-input[data-left-handed='true'] .kw48-stick{left:auto;right:max(var(--edge),env(safe-area-inset-right))}.kw48-input[data-left-handed='true'] .kw48-diamond{right:auto;left:max(var(--edge),env(safe-area-inset-left))}
@media(max-width:420px){.kw48-input{--edge:10px}.kw48-stick{width:min(calc(var(--joy)*.86),120px);height:min(calc(var(--joy)*.86),120px)}}
@media(max-height:390px){.kw48-input{--edge:12px}.kw48-stick{width:calc(var(--joy)*.82);height:calc(var(--joy)*.82);bottom:14px}.kw48-diamond{bottom:14px}.kw48-stick-caption{display:none}.kw48-pause{top:max(9px,env(safe-area-inset-top));width:44px;height:44px}}
@media(prefers-reduced-motion:reduce){.kw48-input *{transition:none!important}}
`;

  class World1InputV048 {
    constructor({ host, settings = P.GameSettingsV10, forceTouch = false } = {}) {
      if (!host || typeof host.appendChild !== 'function') throw new TypeError('World1InputV048 requires a DOM host.');
      this.host = host; this.settings = settings; this.forceTouch = !!forceTouch;
      this.enabled = true; this.destroyed = false; this.hidden = !!document.hidden; this.focused = true;
      this.keys = new Set(); this.keyActions = new Map(); this.touchActions = new Map();
      this.padHeld = emptyActions(); this.held = emptyActions(); this.pending = emptyActions();
      this.touchAxis = { x: 0, y: 0 }; this.padAxis = { x: 0, y: 0 }; this.stickPointer = null;
      this.pausePending = false; this.backPending = false; this.padId = null; this.padNeutral = false; this.padPause = false; this.padBack = false;
      this.listeners = []; this.buttons = {}; this.lastStyle = ''; this.activePointers = new Map();
      this.build();
      this.listen(window, 'keydown', event => this.keyDown(event));
      this.listen(window, 'keyup', event => this.keyUp(event));
      this.listen(window, 'blur', () => { this.focused = false; this.releaseAll(); });
      this.listen(window, 'focus', () => { this.focused = true; this.releaseAll(); });
      this.listen(document, 'visibilitychange', () => { this.hidden = !!document.hidden; this.releaseAll(); });
      this.listen(window, 'gamepaddisconnected', () => { this.padId = null; this.releasePad(); });
      this.listen(window, 'resize', () => this.releasePointers());
      this.applySettings(); this.writeState({ x: 0, y: 0 });
    }

    setting(key) { const value = this.settings?.get ? this.settings.get(key) : this.settings?.[key]; return value === undefined ? DEFAULTS[key] : value; }
    listen(target, type, handler, options) { target.addEventListener(type, handler, options); this.listeners.push(() => target.removeEventListener(type, handler, options)); }
    active() { return this.enabled && !this.destroyed && !this.hidden && this.focused; }
    haptic() { if (this.setting('haptics')) { try { navigator.vibrate?.(7); } catch (_) {} } }

    build() {
      if (!document.getElementById('kw48-input-style')) {
        const style = document.createElement('style'); style.id = 'kw48-input-style'; style.textContent = STYLE; document.head.appendChild(style);
      }
      this.root = document.createElement('div'); this.root.className = 'kw48-input'; this.root.setAttribute('aria-label', 'Controles da aventura');
      this.root.dataset.version = 'v048';
      this.stick = document.createElement('div'); this.stick.className = 'kw48-stick'; this.stick.setAttribute('role', 'img'); this.stick.setAttribute('aria-label', 'Direcional analógico. Arraste para andar ou escalar.');
      this.thumb = document.createElement('div'); this.thumb.className = 'kw48-thumb'; this.thumb.setAttribute('aria-hidden', 'true'); this.stick.appendChild(this.thumb);
      const caption = document.createElement('span'); caption.className = 'kw48-stick-caption'; caption.textContent = 'MOVER'; this.stick.appendChild(caption); this.root.appendChild(this.stick);
      this.diamond = document.createElement('div'); this.diamond.className = 'kw48-diamond'; this.root.appendChild(this.diamond);
      const labels = { jump: ['A', 'Pular'], attack: ['B', 'Atacar'], dash: ['X', 'Impulso'], interact: ['Y', 'Interagir'] };
      ACTIONS.forEach(action => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'kw48-action'; button.dataset.action = action;
        button.setAttribute('aria-label', `${labels[action][0]} · ${labels[action][1]}`); button.setAttribute('aria-pressed', 'false');
        const letter = document.createElement('strong'); letter.textContent = labels[action][0]; const word = document.createElement('span'); word.textContent = labels[action][1];
        button.appendChild(letter); button.appendChild(word); this.diamond.appendChild(button); this.buttons[action] = button;
        this.listen(button, 'pointerdown', event => this.actionDown(event, action));
        ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => this.listen(button, type, event => this.pointerEnd(event)));
        this.listen(button, 'contextmenu', event => { if (this.active()) event.preventDefault(); });
        // Assistive technologies may dispatch click without a preceding pointer or key event.
        this.listen(button, 'click', event => { if (this.active() && event.detail === 0 && !this.keyActions.size) { this.pending[action] = true; this.haptic(); } });
      });
      this.pauseButton = document.createElement('button'); this.pauseButton.type = 'button'; this.pauseButton.className = 'kw48-pause'; this.pauseButton.setAttribute('aria-label', 'Pausar aventura');
      this.pauseButton.innerHTML = '<svg viewBox="0 0 18 20" aria-hidden="true"><rect x="2" y="1" width="5" height="18" rx="1.5"/><rect x="11" y="1" width="5" height="18" rx="1.5"/></svg>';
      this.listen(this.pauseButton, 'click', () => { if (this.active()) { this.pausePending = true; this.haptic(); } }); this.root.appendChild(this.pauseButton);
      this.listen(this.stick, 'pointerdown', event => this.stickDown(event)); this.listen(this.stick, 'pointermove', event => this.stickMove(event));
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => this.listen(this.stick, type, event => this.pointerEnd(event)));
      this.listen(this.stick, 'contextmenu', event => { if (this.active()) event.preventDefault(); });
      this.host.appendChild(this.root);
    }

    applySettings() {
      const touchMode = this.setting('touchControls');
      const coarse = this.forceTouch || navigator.maxTouchPoints > 0 || !!window.matchMedia?.('(pointer: coarse)').matches;
      const visible = touchMode === 'on' || (touchMode !== 'off' && coarse);
      if (this.touchVisible && !visible) this.releasePointers();
      this.touchVisible = visible;
      // Pause stays reachable with mouse/keyboard when touch controls are hidden.
      this.root.hidden = !this.enabled;
      this.stick.hidden = !visible; this.diamond.hidden = !visible;
      this.root.dataset.touch = String(visible); this.root.dataset.leftHanded = String(!!this.setting('leftHanded'));
      const values = [clamp(this.setting('joystickSize'), 80, 130), clamp(this.setting('actionButtonScale'), 80, 130), clamp(this.setting('joystickOpacity'), 35, 100)];
      const signature = values.join(':');
      if (signature !== this.lastStyle) {
        this.lastStyle = signature; this.root.style.setProperty('--joy', `${112 * values[0] / 100}px`);
        this.root.style.setProperty('--action', `${Math.max(44, 48 * values[1] / 100)}px`); this.root.style.setProperty('--control-opacity', String(values[2] / 100));
      }
    }

    captures(event, element) {
      try { element.setPointerCapture(event.pointerId); } catch (_) {}
      this.activePointers.set(event.pointerId, element);
    }
    actionDown(event, action) {
      if (!this.active() || !this.touchVisible || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); this.captures(event, this.buttons[action]); this.touchActions.set(event.pointerId, action); this.reconcile(); this.haptic();
    }
    stickDown(event) {
      if (!this.active() || !this.touchVisible || this.stickPointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); this.stickPointer = event.pointerId; this.captures(event, this.stick); this.stickMove(event);
    }
    stickMove(event) {
      if (!this.active() || event.pointerId !== this.stickPointer) return;
      event.preventDefault(); const box = this.stick.getBoundingClientRect();
      const radius = Math.max(1, Math.min(box.width, box.height) * 0.34);
      const vector = unit((event.clientX - box.left - box.width / 2) / radius, (event.clientY - box.top - box.height / 2) / radius);
      // The displacement is the real input intensity. PointerEvent.pressure is never invented or required.
      this.touchAxis = vector; this.thumb.style.transform = `translate(${vector.x * radius}px,${vector.y * radius}px)`;
      this.stick.dataset.active = 'true'; this.stick.dataset.x = vector.x.toFixed(3); this.stick.dataset.y = vector.y.toFixed(3);
    }
    pointerEnd(event) {
      const element = this.activePointers.get(event.pointerId), action = this.touchActions.get(event.pointerId); this.activePointers.delete(event.pointerId);
      if (event.pointerId === this.stickPointer) { this.stickPointer = null; this.touchAxis = { x: 0, y: 0 }; this.drawNeutralStick(); }
      this.touchActions.delete(event.pointerId); this.reconcile();
      if (event.type !== 'pointerup' && action && !this.held[action]) this.pending[action] = false;
      if (element) { try { if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId); } catch (_) {} }
    }
    drawNeutralStick() { this.thumb.style.transform = 'translate(0px,0px)'; this.stick.dataset.active = 'false'; this.stick.dataset.x = '0.000'; this.stick.dataset.y = '0.000'; }
    releasePointers() {
      const captures = [...this.activePointers], actions = [...this.touchActions.values()]; this.activePointers.clear(); this.touchActions.clear(); this.stickPointer = null; this.touchAxis = { x: 0, y: 0 }; this.drawNeutralStick(); this.reconcile();
      actions.forEach(action => { if (!this.held[action]) this.pending[action] = false; });
      captures.forEach(([id, element]) => { try { if (element.hasPointerCapture?.(id)) element.releasePointerCapture(id); } catch (_) {} });
    }

    externalTarget(target) {
      if (!target || this.root.contains(target)) return false;
      return !!target.closest?.('input,textarea,select,button,a,[contenteditable=""],[contenteditable="true"],[role="dialog"]');
    }
    keyDown(event) {
      if (!this.active() || this.externalTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (this.pauseButton.contains(event.target) && event.code !== 'Escape' && event.key !== 'BrowserBack' && event.key !== 'GoBack') return;
      const focusedAction = this.root.contains(event.target) && event.target.closest?.('[data-action]')?.dataset.action;
      const action = focusedAction && (event.code === 'Space' || event.code === 'Enter') ? focusedAction : KEY_ACTIONS[event.code];
      if (action || DIRECTIONS[event.code] || event.code === 'Escape' || event.key === 'BrowserBack' || event.key === 'GoBack') {
        event.preventDefault();
        if (event.repeat || this.keys.has(event.code)) return;
        this.keys.add(event.code);
        if (action) this.keyActions.set(event.code, action);
        if (event.code === 'Escape') this.pausePending = true;
        if (event.key === 'BrowserBack' || event.key === 'GoBack') this.backPending = true;
        this.reconcile();
      }
    }
    keyUp(event) {
      // Always release a key previously accepted, even if focus changed to an external input.
      if (!this.keys.has(event.code)) return;
      this.keys.delete(event.code); this.keyActions.delete(event.code); this.reconcile();
      if (this.active() && !this.externalTarget(event.target)) event.preventDefault();
    }

    releasePad() { this.padNeutral = false; this.padPause = false; this.padBack = false; this.padAxis = { x: 0, y: 0 }; this.padHeld = emptyActions(); this.reconcile(); }
    readPad() {
      let pads; try { pads = navigator.getGamepads?.() || []; } catch (_) { pads = []; }
      const pad = Array.from(pads).find(value => value && value.connected !== false);
      if (!pad) { if (this.padId !== null) { this.padId = null; this.releasePad(); } return; }
      const identity = `${pad.index}:${pad.id}`;
      if (identity !== this.padId) { this.padId = identity; this.releasePad(); }
      const rawX = clamp(pad.axes?.[0] || 0, -1, 1), rawY = clamp(pad.axes?.[1] || 0, -1, 1);
      const physicalMagnitude = Math.hypot(rawX, rawY);
      if (!this.padNeutral) {
        if (physicalMagnitude <= 0.15 && !Array.from(pad.buttons || []).some(pressedButton)) this.padNeutral = true;
        return;
      }
      let axis = { x: 0, y: 0 };
      if (physicalMagnitude > 0.15) {
        const amount = clamp((physicalMagnitude - 0.15) / 0.85, 0, 1);
        axis = { x: rawX / physicalMagnitude * amount, y: rawY / physicalMagnitude * amount };
      }
      const dpad = unit(Number(pressedButton(pad.buttons?.[15])) - Number(pressedButton(pad.buttons?.[14])), Number(pressedButton(pad.buttons?.[13])) - Number(pressedButton(pad.buttons?.[12])));
      this.padAxis = Math.hypot(dpad.x, dpad.y) > Math.hypot(axis.x, axis.y) ? dpad : axis;
      ACTIONS.forEach((action, index) => { this.padHeld[action] = pressedButton(pad.buttons?.[index]); });
      const pause = pressedButton(pad.buttons?.[9]), back = pressedButton(pad.buttons?.[8]);
      if (pause && !this.padPause) this.pausePending = true;
      if (back && !this.padBack) this.backPending = true;
      this.padPause = pause; this.padBack = back; this.reconcile();
    }

    reconcile() {
      const keyboard = new Set(this.keyActions.values()), touch = new Set(this.touchActions.values());
      ACTIONS.forEach(action => {
        const next = this.active() && (keyboard.has(action) || touch.has(action) || this.padHeld[action]);
        if (next && !this.held[action]) this.pending[action] = true;
        this.held[action] = next;
        if (this.buttons[action]) { this.buttons[action].dataset.held = String(next); this.buttons[action].setAttribute('aria-pressed', String(next)); }
      });
    }
    frame(_dtSeconds) {
      if (this.destroyed) return { x: 0, y: 0, held: emptyActions(), pressed: emptyActions(), pause: false, back: false };
      this.applySettings();
      if (this.active()) this.readPad();
      let axis = { x: 0, y: 0 };
      if (this.active()) {
        let x = 0, y = 0; for (const code of this.keys) { const direction = DIRECTIONS[code]; if (direction) { x += direction[0]; y += direction[1]; } }
        const keyboard = unit(clamp(x, -1, 1), clamp(y, -1, 1));
        // Select a complete vector to avoid diagonal acceleration when sources overlap.
        axis = Math.hypot(this.padAxis.x, this.padAxis.y) > Math.hypot(this.touchAxis.x, this.touchAxis.y) ? this.padAxis : this.touchAxis;
        if (keyboard.x || keyboard.y) axis = keyboard;
      }
      const output = { x: axis.x, y: axis.y, held: { ...this.held }, pressed: { ...this.pending }, pause: this.pausePending, back: this.backPending };
      this.pending = emptyActions(); this.pausePending = false; this.backPending = false; this.writeState(axis); return output;
    }
    writeState(axis) {
      this.root.dataset.enabled = String(this.active()); this.root.dataset.x = axis.x.toFixed(3); this.root.dataset.y = axis.y.toFixed(3);
      this.root.dataset.held = ACTIONS.filter(action => this.held[action]).join(' '); this.root.dataset.gamepad = this.padId === null ? 'none' : (this.padNeutral ? 'ready' : 'waiting-neutral');
    }
    releaseAll() {
      this.keys.clear(); this.keyActions.clear(); this.padId = null; this.releasePad(); this.releasePointers();
      this.held = emptyActions(); this.pending = emptyActions(); this.pausePending = false; this.backPending = false; this.writeState({ x: 0, y: 0 });
    }
    setEnabled(value) { if (this.destroyed) return; this.enabled = !!value; this.releaseAll(); this.applySettings(); }
    destroy() { if (this.destroyed) return; this.enabled = false; this.releaseAll(); this.destroyed = true; this.listeners.splice(0).forEach(remove => remove()); this.root.remove(); }
  }
  P.World1InputV048 = World1InputV048;
})(window.PlatformerSNESV04 = window.PlatformerSNESV04 || {});
