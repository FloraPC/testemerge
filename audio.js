/**
 * audio.js
 * -----------------------------------------------------------------------
 * Todos os sons do jogo são sintetizados em tempo real com a Web Audio
 * API (osciladores + envelopes suaves). Isso evita depender de arquivos
 * de áudio externos — o que soma robustez ao funcionamento 100% offline
 * do PWA — e garante sons calmos e consistentes com a identidade sonora
 * do jogo (sinos suaves, nada agressivo).
 * -----------------------------------------------------------------------
 */

const AudioFX = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let volume = 0.7;

  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  // Retoma o contexto em navegadores que exigem interação do usuário.
  function unlock() {
    const c = ensureContext();
    if (c && c.state === 'suspended') c.resume();
  }

  function setEnabled(value) {
    enabled = !!value;
  }
  function setVolume(value) {
    volume = Math.max(0, Math.min(1, value));
    if (masterGain) masterGain.gain.value = volume;
  }

  /**
   * Toca uma nota simples e suave (envelope ADSR curto).
   * freq: frequência em Hz | dur: duração em segundos.
   */
  function tone(freq, dur = 0.18, type = 'sine', delay = 0, gainPeak = 0.5) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Som suave ao soltar um objeto.
  function drop() {
    tone(320, 0.09, 'sine', 0, 0.25);
  }

  // Som agradável (acorde ascendente curto) ao fundir dois objetos.
  function merge(levelIndex = 0) {
    const base = 440 + levelIndex * 18;
    tone(base, 0.14, 'sine', 0, 0.35);
    tone(base * 1.25, 0.16, 'sine', 0.03, 0.28);
    tone(base * 1.5, 0.20, 'sine', 0.07, 0.22);
  }

  // Som especial (mini-fanfarra) para grandes combinações (níveis altos).
  function bigMerge() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.07, 0.3));
  }

  // Celebração ao criar "Pessoa".
  function celebrate() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.35, 'sine', i * 0.09, 0.32));
  }

  // Som discreto e descendente para Game Over (não assustador).
  function gameOver() {
    [420, 360, 300].forEach((f, i) => tone(f, 0.30, 'sine', i * 0.14, 0.28));
  }

  // Clique de interface, bem discreto.
  function uiClick() {
    tone(660, 0.05, 'sine', 0, 0.18);
  }

  function vibrate(pattern) {
    const settings = Storage.getSettings();
    if (!settings.vibrationOn) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* silencioso */ }
    }
  }

  return { unlock, setEnabled, setVolume, drop, merge, bigMerge, celebrate, gameOver, uiClick, vibrate };
})();
