// Raw audio helpers for the live call: the engine speaks and listens in 16-bit PCM.
export function toPcm16(samples: Float32Array): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i] ?? 0));
    out[i] = x < 0 ? x * 0x8000 : x * 0x7fff;
  }
  return out;
}

export function fromPcm16(bytes: ArrayBuffer): Float32Array {
  const ints = new Int16Array(bytes, 0, Math.floor(bytes.byteLength / 2));
  const out = new Float32Array(ints.length);
  for (let i = 0; i < ints.length; i++) out[i] = (ints[i] ?? 0) / 0x8000;
  return out;
}

// Collects small blocks until there are `size` samples, then hands them over as one chunk.
export function chunker(size: number, emit: (chunk: Float32Array) => void) {
  let held = new Float32Array(0);
  return (block: Float32Array) => {
    const joined = new Float32Array(held.length + block.length);
    joined.set(held);
    joined.set(block, held.length);
    let at = 0;
    while (joined.length - at >= size) {
      emit(joined.slice(at, at + size));
      at += size;
    }
    held = joined.slice(at);
  };
}
