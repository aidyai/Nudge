// The shapes the engine sends for the dashboard, and the small helpers that turn them into words.
export type Tone = "green" | "amber" | "red" | "gray";

export type CallRow = {
  id: string;
  borrower_id: string;
  name: string;
  status: string;
  outcome: string | null;
  started_at: string;
  llm_backend: string | null;
  amount_due_ngn: number | null;
  reply_ms: number | null;
};

export type Stats = { calls: number; promises: number; promised_ngn: number; handoffs: number; open_handoffs: number; reply_ms: number | null };

export type Detail = {
  id: string;
  borrower_id: string;
  name: string;
  phone: string;
  status: string;
  outcome: string | null;
  started_at: string;
  ended_at: string | null;
  prompt_version: string | null;
  llm_backend: string | null;
  amount_due_ngn: number | null;
  transcript: { who: "agent" | "caller"; text: string; reply_ms?: number | null }[];
  tools: { name: string; result: Record<string, unknown> }[];
  checks: { rule: string; reason: string; allowed: boolean }[];
  promise: { option: string; amount_ngn: number | null; promise_date: string | null } | null;
  handoff: { reason: string; summary: string } | null;
  payment_link_sent: boolean;
};

const OUTCOMES: Record<string, [string, Tone]> = {
  promise_captured: ["Promise captured", "green"],
  paid_now: ["Paid now", "green"],
  part_payment_agreed: ["Part payment agreed", "green"],
  extension_granted: ["Extension granted", "green"],
  callback_scheduled: ["Callback scheduled", "gray"],
  refused: ["Refused", "amber"],
  opted_out: ["Opted out", "red"],
  wrong_person: ["Wrong person", "gray"],
  verification_failed: ["Verification failed", "amber"],
  no_answer: ["No answer", "gray"],
  handed_off: ["Handed to a human", "amber"],
  technical_failure: ["Technical failure", "red"],
};

export function outcome(code: string | null): { label: string; tone: Tone } {
  const [label, tone] = (code && OUTCOMES[code]) || ["In progress", "gray"];
  return { label, tone };
}

export const FILTERS = [
  { key: "all", label: "All" },
  { key: "promise", label: "Promise captured" },
  { key: "handoff", label: "Handed to a human" },
  { key: "noanswer", label: "No answer" },
] as const;

const FILTER_OUTCOME: Record<string, string> = { promise: "promise_captured", handoff: "handed_off", noanswer: "no_answer" };

export function matchesFilter(call: CallRow, key: string): boolean {
  return key in FILTER_OUTCOME ? call.outcome === FILTER_OUTCOME[key] : true;
}

export const naira = (n: number | null | undefined) => (n == null ? "—" : `₦${Math.round(n).toLocaleString("en-NG")}`);
export const seconds = (ms: number | null | undefined) => (ms == null ? "—" : `${(ms / 1000).toFixed(1)} s`);

export function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function duration(start: string, end: string | null): string {
  if (!end) return "—";
  const s = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

// One short line for what a tool answered, for the audit list.
export function summarise(result: Record<string, unknown>): string {
  for (const key of ["error", "rejected"]) if (typeof result[key] === "string") return `${key}: ${result[key]}`;
  for (const key of ["status", "saved", "result", "amount_due", "readback_text"]) if (typeof result[key] === "string") return result[key];
  const text = JSON.stringify(result);
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}
