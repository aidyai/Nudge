// Small browser helpers for the voice call: how loud is a sound, and play a reply while reporting its loudness.
export function rmsOf(samples: ArrayLike<number>): number {
  let sum = 0;
  for (const x of Array.from(samples)) sum += x * x;
  return samples.length ? Math.sqrt(sum / samples.length) : 0;
}

export function loudness(analyser: AnalyserNode, buffer: Float32Array<ArrayBuffer>): number {
  analyser.getFloatTimeDomainData(buffer);
  return rmsOf(buffer);
}

export type Playing = { done: Promise<void>; stop: () => void };

// Plays a reply and calls onLevel (0 to about 0.3) while it speaks. `done` resolves when it ends or is stopped.
export function play(blob: Blob, ctx: AudioContext, onLevel: (level: number) => void): Playing {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  const buffer = new Float32Array(analyser.fftSize);
  let timer: ReturnType<typeof setInterval> | undefined;
  let finish = () => {};
  const done = new Promise<void>((resolve) => {
    let over = false;
    finish = () => {
      if (over) return;
      over = true;
      clearInterval(timer);
      onLevel(0);
      URL.revokeObjectURL(url);
      source.disconnect();
      resolve();
    };
  });
  audio.onended = finish;
  audio.onerror = finish;
  audio
    .play()
    .then(() => {
      timer = setInterval(() => onLevel(loudness(analyser, buffer)), 40);
    })
    .catch(finish);
  return {
    done,
    stop: () => {
      audio.pause();
      finish();
    },
  };
}
