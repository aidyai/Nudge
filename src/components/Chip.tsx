import type { Tone } from "@/lib/calls";

export function OutcomeChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`chip chip-${tone}`}>
      {children}
    </span>
  );
}
