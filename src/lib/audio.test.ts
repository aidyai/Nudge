import { rmsOf } from "@/lib/audio";

describe("how loud a sound is", () => {
  it("is zero for silence and for nothing", () => {
    expect(rmsOf([0, 0, 0])).toBe(0);
    expect(rmsOf([])).toBe(0);
  });

  it("is the size of a steady wave", () => {
    expect(rmsOf([0.5, -0.5, 0.5, -0.5])).toBeCloseTo(0.5);
  });
});
