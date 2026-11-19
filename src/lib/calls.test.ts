import { duration, matchesFilter, naira, outcome, seconds, summarise, type CallRow } from "@/lib/calls";

const row = (outcome: string | null) => ({ outcome }) as CallRow;

describe("words for the dashboard", () => {
  it("names every outcome and treats a missing one as in progress", () => {
    expect(outcome("promise_captured")).toEqual({ label: "Promise captured", tone: "green" });
    expect(outcome(null).label).toBe("In progress");
    expect(outcome("something_new").label).toBe("In progress");
  });

  it("filters by outcome", () => {
    expect(matchesFilter(row("handed_off"), "handoff")).toBe(true);
    expect(matchesFilter(row("promise_captured"), "handoff")).toBe(false);
    expect(matchesFilter(row(null), "all")).toBe(true);
  });

  it("formats money, seconds and call length", () => {
    expect(naira(25000)).toBe("₦25,000");
    expect(naira(null)).toBe("—");
    expect(seconds(1234)).toBe("1.2 s");
    expect(duration("2026-11-17T10:00:00Z", "2026-11-17T10:02:05Z")).toBe("2m 05s");
    expect(duration("2026-11-17T10:00:00Z", null)).toBe("—");
  });

  it("sums up a tool answer in one line", () => {
    expect(summarise({ status: "verified" })).toBe("verified");
    expect(summarise({ error: "call get_offers first" })).toBe("error: call get_offers first");
    expect(summarise({ a: 1 })).toBe('{"a":1}');
  });
});
