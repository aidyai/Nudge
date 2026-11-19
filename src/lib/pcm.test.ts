import { chunker, fromPcm16, toPcm16 } from "@/lib/pcm";

describe("raw audio", () => {
  it("turns samples into 16-bit numbers and back", () => {
    const pcm = toPcm16(new Float32Array([0, 0.5, -0.5, 1, -1]));
    expect(Array.from(pcm)).toEqual([0, 16383, -16384, 32767, -32768]);
    const back = fromPcm16(pcm.buffer as ArrayBuffer);
    expect(back[1]).toBeCloseTo(0.5, 3);
    expect(back[4]).toBeCloseTo(-1, 3);
  });

  it("clips what is too loud", () => {
    expect(Array.from(toPcm16(new Float32Array([2, -2])))).toEqual([32767, -32768]);
  });

  it("ignores a stray odd byte", () => {
    expect(fromPcm16(new Uint8Array([1, 0, 9]).buffer).length).toBe(1);
  });

  it("collects small blocks into chunks of the wanted size", () => {
    const seen: number[][] = [];
    const add = chunker(4, (c) => seen.push(Array.from(c)));
    add(new Float32Array([1, 2, 3]));
    expect(seen).toEqual([]);
    add(new Float32Array([4, 5, 6, 7, 8, 9]));
    expect(seen).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
    add(new Float32Array([10, 11, 12]));
    expect(seen.length).toBe(3);
    expect(seen[2]).toEqual([9, 10, 11, 12]);
  });
});
