"use client";

import { useRef } from "react";
import { CallStage } from "@/components/CallStage";
import { useLiveCall } from "@/lib/use-live-call";

// The live call: stream your voice to the engine and hear it answer. Nothing to press, you can talk over her.
export function LiveCall({ borrowerId, onUnavailable }: { borrowerId: string; onUnavailable: () => void }) {
  const pills = useRef<HTMLButtonElement>(null);
  const setLevel = (level: number) => pills.current?.style.setProperty("--level", Math.min(0.3, level).toFixed(3));
  const live = useLiveCall(borrowerId, setLevel, onUnavailable);

  return (
    <CallStage
      {...live}
      pills={pills}
      onTap={() => (live.phase === "idle" ? void live.start() : live.phase === "speaking" ? live.interrupt() : undefined)}
      onEnd={live.end}
      onMute={live.toggleMute}
      hint={live.phase === "listening" ? "Just talk. She hears when you stop." : ""}
    />
  );
}
