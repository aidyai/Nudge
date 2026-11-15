// Sample data for the design. The real calls arrive when the agent runs.
export type Tone = "green" | "amber" | "red" | "gray";

export type CallRow = {
  id: string;
  name: string;
  outcome: string;
  tone: Tone;
  amount: string;
  reply: string;
  model: string;
  time: string;
  hasDetail: boolean;
};

export const CALLS: CallRow[] = [
  { id: "B001", name: "Musa Bello", outcome: "Promise captured", tone: "green", amount: "₦25,000", reply: "1.2 s", model: "Modal", time: "10:42", hasDetail: true },
  { id: "B002", name: "Ngozi Adebayo", outcome: "Paid now", tone: "green", amount: "₦7,500", reply: "1.0 s", model: "Modal", time: "10:31", hasDetail: false },
  { id: "B003", name: "Chinedu Yakubu", outcome: "Handed to a human", tone: "amber", amount: "—", reply: "1.3 s", model: "Modal", time: "10:18", hasDetail: false },
  { id: "B004", name: "Yetunde Danjuma", outcome: "Part payment agreed", tone: "green", amount: "₦4,000", reply: "1.1 s", model: "Modal", time: "10:05", hasDetail: false },
  { id: "B005", name: "Sani Danjuma", outcome: "No answer", tone: "gray", amount: "—", reply: "—", model: "—", time: "09:52", hasDetail: false },
  { id: "B019", name: "Emeka Lawal", outcome: "Opted out", tone: "red", amount: "—", reply: "0.9 s", model: "Modal", time: "09:40", hasDetail: false },
];

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "promise", label: "Promise captured" },
  { key: "handoff", label: "Handed to a human" },
  { key: "noanswer", label: "No answer" },
] as const;

export function matchesFilter(call: CallRow, key: string): boolean {
  if (key === "promise") return call.outcome === "Promise captured";
  if (key === "handoff") return call.outcome === "Handed to a human";
  if (key === "noanswer") return call.outcome === "No answer";
  return true;
}

export const TRANSCRIPT = [
  { who: "agent", text: "Hello, this is an automated assistant calling for Sample Lender. May I speak with Musa Bello?", note: "Opening line" },
  { who: "caller", text: "Yes, speaking.", note: "" },
  { who: "agent", text: "Thank you. To confirm it is you, what is your date of birth, day and month?", note: "Reply time 1.0 s" },
  { who: "caller", text: "Fourteen March.", note: "" },
  { who: "agent", text: "Thanks, you are verified. You have twenty-five thousand naira due on Tuesday, the tenth of November. What would you like to do?", note: "Reply time 1.4 s" },
  { who: "caller", text: "I can pay on Friday.", note: "" },
  { who: "agent", text: "Just to confirm: a promise to pay twenty-five thousand naira on Friday, the thirteenth of November. Is that right?", note: "Reply time 1.1 s" },
  { who: "caller", text: "Yes.", note: "" },
  { who: "agent", text: "Done. I have saved it and I am sending a payment link by text. Thank you, goodbye.", note: "Reply time 0.9 s" },
] as const;

export const TOOLS = [
  ["verify_identity", "verified"],
  ["get_loan", "₦25,000 due 10 Nov"],
  ["get_offers", "5 options"],
  ["propose_option", "read-back created"],
  ["confirm_option", "1 promise saved"],
  ["end_call", "promise_captured"],
] as const;

export const CHECKS = [
  "loan details shared only after verification",
  "offer within the allowed limits",
  "every spoken number came from a tool result",
  "no banned content in any reply",
] as const;

export const TURN_TIMES = [
  { label: "Turn 2", seconds: 1.0 },
  { label: "Turn 3", seconds: 1.4 },
  { label: "Turn 4", seconds: 1.1 },
  { label: "Turn 5", seconds: 0.9 },
] as const;
