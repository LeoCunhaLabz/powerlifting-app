/**
 * Aviso de fim do descanso (#341): três bipes pelo Web Audio e vibração. O bipe não toca com o
 * celular no silencioso; a vibração cobre esse caso onde o navegador suporta (Android).
 */
export function alertRestEnd(): void {
  try {
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    /* sem suporte: segue só com o som */
  }
  try {
    const AudioCtxClass: (new (options?: AudioContextOptions) => AudioContext) | undefined =
      window.AudioContext ||
      (window as { webkitAudioContext?: new (options?: AudioContextOptions) => AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;
    const audioCtx = new AudioCtxClass();
    const beep = (time: number, freq: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      osc.start(time);
      osc.stop(time + duration);
    };
    const now = audioCtx.currentTime;
    beep(now, 880, 0.25);
    beep(now + 0.3, 880, 0.25);
    beep(now + 0.6, 1200, 0.45);
  } catch (e) {
    console.warn('Web Audio not supported or blocked:', e);
  }
}
