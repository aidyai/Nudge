"use client";

import type { Ref } from "react";
import { Icon } from "@/components/icons";
import type { Borrower, CallInfo, Phase, Turn } from "@/lib/use-live-call";

const STATUS: Record<Phase, string> = {
  idle: "Ready to call",
  connecting: "Calling",
  speaking: "Idara is speaking",
  listening: "Listening",
  thinking: "Thinking",
};

type Props = {
  phase: Phase;
  borrower: Borrower | null;
  call: CallInfo | null;
  turns: Turn[];
  error: string | null;
  pills: Ref<HTMLButtonElement>;
  onTap: () => void;
  onEnd: () => void;
  hint?: string;
  muted?: boolean;
  onMute?: () => void;
  tapDisabled?: boolean;
  onBack?: () => void;
};

// What the page shows during a call. Four pills move with the voice: yours when listening, hers when speaking.
export function CallStage({ phase, borrower, call, turns, error, pills, onTap, onEnd, hint, muted, onMute, tapDisabled, onBack }: Props) {
  const last = [...turns].reverse().find((t) => t.who === "agent");
  const finished = phase === "idle" && call?.done;
  const busy = phase === "connecting" || phase === "thinking";

  return (
    <div className="voice-stage">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--divider)" }}>
        <div className="stack" style={{ gap: "2px" }}>
          <span className="strong">{borrower ? `${borrower.name} (Simulation)` : "Borrower"}</span>
          <span className="small muted">
            {borrower ? `${borrower.company ? `${borrower.company}. ` : ""}You are ${borrower.name}. Your birthday is ${borrower.birthday}.` : "Start the call to see who you are playing."}
          </span>
        </div>
        <div className="row" style={{ gap: "12px" }}>
          {call ? (
            <>
              <span className="chip chip-gray">Step: {call.state}</span>
              <span className={call.verified ? "chip chip-green" : "chip chip-amber"}>{call.verified ? "ID Verified" : "Verification Pending"}</span>
              {call.done && <span className="chip chip-gray">{call.outcome?.replaceAll("_", " ") ?? "Closed"}</span>}
            </>
          ) : (
            <span className="chip chip-gray">Standby</span>
          )}
        </div>
      </div>

      <section className="voice-console-open fx fx-dots-a" aria-labelledby="voice-status">
        <button
          ref={pills}
          type="button"
          className={`pills-button pills-${phase}`}
          onClick={onTap}
          disabled={tapDisabled ?? busy}
          aria-label={phase === "idle" ? "Start the call" : phase === "speaking" ? "Interrupt" : "Voice"}
        >
          <span className="pills" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>

        <h2 id="voice-status" className="voice-status" aria-live="polite">
          {finished ? "Call ended" : STATUS[phase]}
          {busy && (
            <span className="dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          )}
        </h2>

        <p className="voice-caption">
          {phase === "idle" ? (finished ? "The call is over. You can start it again." : "Press start, then talk like on a normal phone call.") : (last?.text ?? "")}
        </p>
        {hint && phase !== "idle" && phase !== "speaking" && <p className="small muted">{hint}</p>}

        {phase === "idle" ? (
          <div className="voice-controls">
            {onBack && (
              <button type="button" className="ghost-btn" onClick={onBack}>
                Edit details
              </button>
            )}
            <button type="button" className="primary-btn" onClick={onTap}>
              {finished ? "Call again" : "Start call"}
            </button>
          </div>
        ) : (
          <div className="voice-bar">
            {onMute ? (
              <button type="button" className="voice-ctrl-btn" onClick={onMute} aria-pressed={muted} aria-label={muted ? "Unmute" : "Mute"}>
                <Icon name={muted ? "volume" : "mic"} size={20} />
              </button>
            ) : (
              <span className="voice-ctrl-spacer" />
            )}
            <button type="button" className="tap-label" onClick={onTap} disabled={phase !== "speaking"} aria-hidden={phase !== "speaking"}>
              {phase === "speaking" && (
                <>
                  <Icon name="mic" size={16} /> Tap to interrupt
                </>
              )}
            </button>
            <button type="button" className="voice-ctrl-btn end" onClick={onEnd} aria-label="End call">
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        {error && (
          <p className="small" style={{ color: "#ffffff" }} role="alert">
            {error}
          </p>
        )}
      </section>

      {turns.length > 0 && (
        <section aria-label="Conversation Transcript" className="stack" style={{ gap: "16px", paddingTop: "20px", borderTop: "1px solid var(--divider)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="caption">Transcript</span>
            <span className="small muted mono">{turns.length} {turns.length === 1 ? "turn" : "turns"}</span>
          </div>
          <div className="voice-lines">
            {turns.map((t, i) => (
              <div key={i} className="voice-line">
                <span className="who">{t.who === "agent" ? "Idara" : "You"}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
