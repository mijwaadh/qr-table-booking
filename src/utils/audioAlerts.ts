// ServeFlow Professional Web Audio Alert Engine
// Generates zero-latency synthesized audio alerts for KDS, POS Cashiers, and Mobile QR orders using Web Audio API.

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const isAudioAlertsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem('serveflow_audio_alerts_enabled');
  return saved !== null ? JSON.parse(saved) : true;
};

export const setAudioAlertsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('serveflow_audio_alerts_enabled', JSON.stringify(enabled));
};

// 1. New Order Sound (Bright 3-tone Kitchen/POS Bell: C5 -> E5 -> G5 -> C6)
export const playNewOrderSound = (): void => {
  if (!isAudioAlertsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  } catch (e) {
    console.error('Audio alert error:', e);
  }
};

// 2. Cash Payment Alert Sound (Register "Cha-Ching" Coin Slide: E6 -> G6 -> B6 -> E7 fast ring)
export const playCashPaymentSound = (): void => {
  if (!isAudioAlertsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [1318.51, 1567.98, 1975.53, 2637.02]; // E6, G6, B6, E7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.28, now + idx * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  } catch (e) {
    console.error('Audio alert error:', e);
  }
};

// 3. Bill Settlement / Settle Table Sound (Smooth POS Receipt Chord: G4 + C5 + E5 + G5 simultaneously)
export const playBilledSound = (): void => {
  if (!isAudioAlertsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    });
  } catch (e) {
    console.error('Audio alert error:', e);
  }
};

// 4. KOT Ready Sound (High Crystal Service Bell: A6 -> E7 harmonic chime)
export const playKOTReadySound = (): void => {
  if (!isAudioAlertsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [1760.00, 2637.02]; // A6, E7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.65);
    });
  } catch (e) {
    console.error('Audio alert error:', e);
  }
};

// 5. Soft Item Tap Sound (Subtle UI Click/Pop for adding items or quantity)
export const playItemTapSound = (): void => {
  if (!isAudioAlertsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.error('Audio alert error:', e);
  }
};

// 6. Warning / Delay Warning Sound (Low Alert Beep: E4 -> C4)
export const playWarningSound = (): void => {
  if (!isAudioAlertsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [329.63, 261.63]; // E4, C4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);

      gain.gain.setValueAtTime(0, now + idx * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.18);
    });
  } catch (e) {
    console.error('Audio alert error:', e);
  }
};
