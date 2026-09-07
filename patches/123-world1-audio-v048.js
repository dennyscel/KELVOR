(function (P) {
  'use strict';
  const midi = note => 440 * Math.pow(2, (note - 69) / 12);
  const normalizedVolume = (value, fallback) => { const number = Number(value ?? fallback); return Math.max(0, Math.min(100, Number.isFinite(number) ? number : fallback)) / 100; };
  // Original eight-bar phrases: woodwind, plucked ostinato, bass, soft pads and percussion.
  // Every voice uses the shared AudioContext and releases its whole audio graph when finished.
  const DAY = [[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61],[50,57,62,66],[54,57,62,69],[43,55,59,62],[45,52,57,61]];
  const NIGHT = [[50,57,62,65],[46,53,58,62],[43,50,55,58],[45,52,57,61],[50,57,60,65],[48,55,60,64],[46,53,58,62],[45,52,57,61]];
  const MELODY = [[74,0,78,81,78,76,74,0],[71,0,74,78,76,74,71,0],[67,71,74,0,79,78,74,71],[69,0,73,76,81,0,76,73],[74,78,81,86,0,81,78,76],[78,81,86,0,85,81,78,0],[79,78,74,71,74,0,71,67],[69,73,76,81,85,81,76,0]];

  class Score {
    constructor(scene, theme, settings) {
      this.scene = scene; this.context = scene.sound?.context; this.settings = settings; this.theme = theme;
      this.alive = true; this.nodes = new Set(); this.voices = new Set(); this.step = 0; this.next = 0;
      this.started = false; this.paused = false; this.intensity = 0; this.ending = false; this.startPromise = null; this.startSequence = 0;
      this.lastMusicGain = null; this.lastSfxGain = null;
      const context = this.context; if (!context) return;
      this.music = context.createGain(); this.sfx = context.createGain(); this.music.gain.value = 0; this.sfx.gain.value = 0;
      this.filter = context.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 4300;
      this.compressor = context.createDynamicsCompressor(); this.compressor.threshold.value = -18; this.compressor.ratio.value = 3;
      this.music.connect(this.filter); this.filter.connect(this.compressor); this.sfx.connect(this.compressor); this.compressor.connect(context.destination);
      this.noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = this.noise.getChannelData(0); let seed = 20260907;
      for (let index = 0; index < data.length; index++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[index] = seed / 2147483648 - 1; }
      this.visibilityHandler = () => {
        this.applyGains();
        // The scene's later visibility listener can enter pause during the same event.
        Promise.resolve().then(() => this.applyGains());
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
    activate() {
      if (!this.alive || !this.context || this.context.state !== 'running') return false;
      if (!this.started) { this.started = true; this.next = this.context.currentTime + .06; }
      return true;
    }
    start() {
      const context = this.context;
      if (!this.alive || !context || context.state === 'closed') return Promise.resolve(false);
      if (context.state === 'running') { this.activate(); return Promise.resolve(true); }
      if (this.startPromise) return this.startPromise;
      const sequence = ++this.startSequence; let resume;
      try { resume = context.resume(); } catch (_) { return Promise.resolve(false); }
      this.startPromise = Promise.resolve(resume).then(() => this.alive && sequence === this.startSequence && this.activate()).catch(() => false).finally(() => {
        if (sequence === this.startSequence) this.startPromise = null;
      });
      return this.startPromise;
    }
    volume(key, fallback = 100) {
      return normalizedVolume(this.settings?.get('masterVolume'), 100) * normalizedVolume(this.settings?.get(key), fallback);
    }
    muted() {
      return this.paused || !!this.scene.pausedV048 || (!!document.hidden && this.settings?.get('muteWhenUnfocused') !== false);
    }
    applyGains() {
      if (!this.alive || !this.context) return;
      const muted = this.muted(), time = this.context.currentTime;
      const music = muted ? 0 : this.volume('musicVolume', 82) * .68, sfx = muted ? 0 : this.volume('sfxVolume', 88) * .7;
      // Append automation only when its target changes, not at every rendering frame.
      if (music !== this.lastMusicGain) { this.music.gain.setTargetAtTime(music, time, muted ? .025 : .12); this.lastMusicGain = music; }
      if (sfx !== this.lastSfxGain) { this.sfx.gain.setTargetAtTime(sfx, time, muted ? .025 : .06); this.lastSfxGain = sfx; }
    }
    voice(nodes, bus, envelope) {
      const voice = { nodes: new Set(nodes), sources: new Set(), bus, envelope, disposed: false };
      this.voices.add(voice); return voice;
    }
    track(node, voice) {
      this.nodes.add(node); voice.nodes.add(node); voice.sources.add(node);
      node.onended = () => {
        this.nodes.delete(node); voice.sources.delete(node);
        try { node.disconnect(); } catch (_) {}
        if (!voice.sources.size) this.releaseVoice(voice);
      };
      return node;
    }
    releaseVoice(voice) {
      if (voice.disposed) return; voice.disposed = true;
      for (const node of voice.nodes) { try { node.disconnect(); } catch (_) {} }
      for (const source of voice.sources) { source.onended = null; this.nodes.delete(source); try { source.stop(); } catch (_) {} }
      voice.sources.clear(); voice.nodes.clear(); this.voices.delete(voice);
    }
    tone(note, at, duration, voiceName = 'pluck', gain = .1, pan = 0) {
      const context = this.context; if (!context || !this.alive) return;
      const frequency = midi(note), envelope = context.createGain(), filter = context.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = voiceName === 'pad' ? 1450 : voiceName === 'flute' ? 3000 : 4500;
      envelope.connect(filter); let output = filter;
      const bus = voiceName === 'effect' ? 'sfx' : 'music', voice = this.voice([envelope, filter], bus, envelope);
      if (context.createStereoPanner) { const panner = context.createStereoPanner(); panner.pan.value = pan; filter.connect(panner); output = panner; voice.nodes.add(panner); }
      output.connect(this[bus]);
      const attack = voiceName === 'pad' ? .22 : voiceName === 'flute' ? .055 : .008;
      envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(gain, at + attack);
      envelope.gain.exponentialRampToValueAtTime(Math.max(.0001, gain * .38), at + duration * .65); envelope.gain.linearRampToValueAtTime(0, at + duration);
      const oscillator = this.track(context.createOscillator(), voice); oscillator.type = voiceName === 'pad' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at); oscillator.connect(envelope); oscillator.start(at); oscillator.stop(at + duration + .02);
      if (voiceName === 'flute' || voiceName === 'pad' || voiceName === 'pluck') {
        const harmonic = this.track(context.createOscillator(), voice), harmonicGain = context.createGain(); voice.nodes.add(harmonicGain);
        harmonic.type = voiceName === 'pad' ? 'sine' : 'triangle'; harmonic.frequency.value = frequency * (voiceName === 'pluck' ? 2 : 1.003);
        harmonicGain.gain.value = voiceName === 'pluck' ? .13 : .18; harmonic.connect(harmonicGain); harmonicGain.connect(envelope);
        harmonic.start(at); harmonic.stop(at + duration + .02);
      }
    }
    percussion(at, strong) {
      const context = this.context; if (!context || !this.alive) return;
      const filter = context.createBiquadFilter(), envelope = context.createGain(), voice = this.voice([filter, envelope], 'music', envelope);
      const source = this.track(context.createBufferSource(), voice); source.buffer = this.noise;
      filter.type = strong ? 'lowpass' : 'highpass'; filter.frequency.value = strong ? 160 : 5800;
      envelope.gain.setValueAtTime(strong ? .035 : .009, at); envelope.gain.exponentialRampToValueAtTime(.0001, at + .14);
      source.connect(filter); filter.connect(envelope); envelope.connect(this.music); source.start(at); source.stop(at + .16);
    }
    update(intensity = 0, paused = false) {
      if (!this.context || !this.alive) return;
      const context = this.context; this.intensity = intensity; this.paused = paused; this.applyGains();
      // Gamepad scene transitions need no new gesture when the shared context is already running.
      if (context.state === 'running') this.activate();
      if (!this.started || context.state !== 'running' || this.muted() || this.ending) { this.next = context.currentTime + .08; return; }
      if (this.next < context.currentTime - .1) this.next = context.currentTime + .04;
      const boss = this.theme === 'boss', night = this.theme === 'moon', beat = 60 / (boss ? 112 : night ? 76 : 92), tick = beat / 2;
      while (this.next < context.currentTime + .18) {
        const index = this.step % 64, bar = Math.floor(index / 8), within = index % 8, chord = (night || boss ? NIGHT : DAY)[bar], time = this.next;
        if (within === 0) { this.tone(chord[0] - 12, time, beat * 3.8, 'bass', .12); for (let index = 1; index < 4; index++) this.tone(chord[index], time, beat * 3.9, 'pad', .026, (index - 2) * .45); }
        if (within % 2 === 0 || intensity > .4) this.tone(chord[1 + (within % 3)] + 12, time, tick * 1.5, 'pluck', .035, Math.sin(this.step) * .6);
        const melody = MELODY[bar][within];
        if (melody && (!night || within % 2 === 0)) { const offset = night && [78,81,86].includes(melody) ? -1 : 0; this.tone(melody + offset, time, beat * (within === 6 ? 1.8 : .9), 'flute', boss ? .038 : .052, .12); }
        if (boss || intensity > .28) this.percussion(time, within === 0 || within === 4);
        this.next += tick; this.step++;
      }
    }
    effect(type) {
      const context = this.context; if (!context || !this.alive || context.state !== 'running' || this.muted()) return;
      const now = context.currentTime;
      const notes = { coin:[86,93], key:[74,81,86], bell:[74,81,86,90], checkpoint:[62,69,74,78], door:[50,57,62,69], secret:[74,78,81,86,93], bonusComplete:[74,81,86,90,93], jump:[62,69], doubleJump:[74,81], spring:[62,74,86], attack:[50,45], enemyHit:[55,50], enemyDefeat:[67,74], guard:[81,86], hurt:[43,38], trip:[48], land:[38], dash:[57,69], bossWarn:[38,45], bossAttack:[31,38], bossDefeat:[50,57,62,66,74,78] }[type] || [];
      notes.forEach((note, index) => this.tone(note, now + index * .07, type === 'bossDefeat' ? 1.3 : .25, 'effect', type === 'coin' ? .06 : .085));
    }
    finale() {
      if (!this.context || !this.alive || this.ending) return;
      this.ending = true; const time = this.context.currentTime;
      // Retire the exploration chord before the concluding phrase without a hard cut.
      for (const voice of this.voices) if (voice.bus === 'music') {
        voice.envelope.gain.cancelScheduledValues(time); voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, time);
        voice.envelope.gain.linearRampToValueAtTime(0, time + .045);
        for (const source of voice.sources) { try { source.stop(time + .05); } catch (_) {} }
      }
      [50,57,62,66,69,74,78,81,86].forEach((note, index) => this.tone(note, time + .07 + index * .16, 2.4, 'flute', .075));
      [62,66,69,74].forEach(note => this.tone(note, time + 1.5, 4.5, 'pad', .07));
    }
    destroy() {
      if (!this.alive) return;
      this.alive = false; this.startSequence++; this.startPromise = null;
      if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
      for (const voice of [...this.voices]) this.releaseVoice(voice);
      this.nodes.clear();
      for (const node of [this.music, this.sfx, this.filter, this.compressor]) { try { node?.disconnect(); } catch (_) {} }
      this.noise = null; this.started = false;
    }
  }
  P.World1ScoreV048 = Score;
})(window.PlatformerSNESV04);
