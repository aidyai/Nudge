// Decides when a person starts and stops talking, from how loud the microphone is. No models, no network.
export const VAD = {
  calibrateMs: 400, // learn how noisy the room is before listening for speech
  minSpeechMs: 250, // a click or a cough is not speech
  endSilenceMs: 900, // this long without speech means they have finished
  gapMs: 150, // a dip this short inside a word does not count as quiet
  minLevel: 0.015,
  maxFloor: 0.05,
  ratio: 3, // speech must be this many times louder than the room
};

export type Vad = { t0: number; floor: number; loudSince: number | null; lastLoud: number | null; speaking: boolean };

export const newVad = (now: number): Vad => ({ t0: now, floor: 0, loudSince: null, lastLoud: null, speaking: false });

export function step(v: Vad, level: number, now: number, c = VAD): "start" | "end" | null {
  if (now - v.t0 < c.calibrateMs) {
    v.floor = Math.min(c.maxFloor, Math.max(v.floor, level));
    return null;
  }
  if (level > Math.max(c.minLevel, v.floor * c.ratio)) {
    v.lastLoud = now;
    v.loudSince ??= now;
    if (!v.speaking && now - v.loudSince >= c.minSpeechMs) {
      v.speaking = true;
      return "start";
    }
  } else if (!v.speaking && v.lastLoud !== null && now - v.lastLoud > c.gapMs) {
    v.loudSince = null;
  }
  if (v.speaking && v.lastLoud !== null && now - v.lastLoud >= c.endSilenceMs) {
    v.speaking = false;
    return "end";
  }
  return null;
}
