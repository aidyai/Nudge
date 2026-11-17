import type { Tone } from "@/lib/sample";

export function OutcomeChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`chip chip-${tone}`}>
      {children}
    </span>
  );
}
