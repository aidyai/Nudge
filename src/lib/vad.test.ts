import { newVad, step, VAD } from "@/lib/vad";

// Feeds one loudness value every 40 ms and lists the events.
function run(levels: number[]): { event: string; at: number }[] {
  const v = newVad(0);
  const out: { event: string; at: number }[] = [];
  levels.forEach((level, i) => {
    const event = step(v, level, i * 40);
    if (event) out.push({ event, at: i * 40 });
  });
  return out;
}
const quiet = (ms: number, level = 0.004) => Array(Math.round(ms / 40)).fill(level);
const talk = (ms: number, level = 0.12) => Array(Math.round(ms / 40)).fill(level);

describe("hearing a person start and stop", () => {
  it("hears a sentence and its end", () => {
    const events = run([...quiet(600), ...talk(1500), ...quiet(1500)]);
    expect(events.map((e) => e.event)).toEqual(["start", "end"]);
  });

  it("waits until they have been quiet for the end-of-turn time", () => {
    const events = run([...quiet(600), ...talk(1000), ...quiet(1500)]);
    const end = events.find((e) => e.event === "end")!;
    expect(end.at).toBeGreaterThanOrEqual(600 + 1000 + VAD.endSilenceMs - 40);
  });

  it("does not end the turn on a short pause between words", () => {
    const events = run([...quiet(600), ...talk(800), ...quiet(400), ...talk(800), ...quiet(1500)]);
    expect(events.map((e) => e.event)).toEqual(["start", "end"]);
  });

  it("ignores a click that is too short to be speech", () => {
    expect(run([...quiet(600), ...talk(120), ...quiet(2000)])).toEqual([]);
  });

  it("ignores a steady noisy room", () => {
    expect(run(quiet(3000, 0.03))).toEqual([]);
  });

  it("still hears speech over a noisy room", () => {
    const events = run([...quiet(600, 0.03), ...talk(1500, 0.3), ...quiet(1500, 0.03)]);
    expect(events.map((e) => e.event)).toEqual(["start", "end"]);
  });

  it("hears nothing while it is still learning the room", () => {
    expect(run(talk(300))).toEqual([]);
  });
});
