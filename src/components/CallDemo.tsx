"use client";

import { useEffect, useRef, useState } from "react";
import { useRecorder } from "@/lib/use-recorder";
import { Icon } from "@/components/icons";

type Turn = { who: "you" | "agent"; text: string };
type Reply = { call_id: string; reply: string; state: string; verified: boolean; outcome: string | null; done: boolean };

async function send(path: string, body: BodyInit, contentType: string): Promise<Response> {
  const response = await fetch(`/api/${path}`, { method: "POST", headers: { "Content-Type": contentType }, body });
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json()).detail;
    } catch {
      // not JSON
    }
    throw new Error(typeof detail === "string" && detail ? detail : `Request failed (HTTP ${response.status}).`);
  }
  return response;
}

const sendJson = (path: string, body: unknown) => send(path, JSON.stringify(body), "application/json");

export function CallDemo() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [call, setCall] = useState<Reply | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyPhase, setBusyPhase] = useState<"connecting" | "transcribing" | "thinking" | "speaking" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [isPlayingReply, setIsPlayingReply] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  async function speak(text: string) {
    setBusyPhase("speaking");
    try {
      const blob = await (await sendJson("speech/say", { text })).blob();
      const url = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setLastAudioUrl(url);

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }

      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setIsPlayingReply(true);

      audio.onended = () => {
        setIsPlayingReply(false);
        setBusyPhase(null);
      };
      audio.onerror = () => {
        setIsPlayingReply(false);
        setBusyPhase(null);
      };

      await audio.play().catch(() => {
        setIsPlayingReply(false);
        setBusyPhase(null);
      });
    } catch {
      setIsPlayingReply(false);
      setBusyPhase(null);
    }
  }

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the server.");
      setBusyPhase(null);
    } finally {
      setBusy(false);
    }
  }

  const startCall = () =>
    run(async () => {
      setBusyPhase("connecting");
      const r = (await (await sendJson("calls", {})).json()) as Reply;
      setCall(r);
      setTurns([{ who: "agent", text: r.reply }]);
      await speak(r.reply);
    });

  const takeTurn = (audio: Blob) =>
    run(async () => {
      if (!call) return;
      setBusyPhase("transcribing");
      const heard = (await (await send("speech/transcribe", audio, audio.type)).json()) as { transcript: string };
      if (!heard.transcript.trim()) {
        setBusyPhase(null);
        throw new Error("No speech detected. Please speak clearly into your microphone.");
      }

      setTurns((t) => [...t, { who: "you", text: heard.transcript }]);
      setBusyPhase("thinking");

      const r = (await (await sendJson(`calls/${call.call_id}/turns`, { text: heard.transcript })).json()) as Reply;
      setCall(r);

      if (r.reply) {
        setTurns((t) => [...t, { who: "agent", text: r.reply }]);
        await speak(r.reply);
      } else {
        setBusyPhase(null);
      }
    });

  const { recording, error: micError, audioLevel, start, stop } = useRecorder(takeTurn);

  const toggleReplay = () => {
    if (!currentAudioRef.current || !lastAudioUrl) return;
    if (isPlayingReply) {
      currentAudioRef.current.pause();
      setIsPlayingReply(false);
    } else {
      currentAudioRef.current.currentTime = 0;
      void currentAudioRef.current.play().then(() => setIsPlayingReply(true));
    }
  };

  const getStatusText = () => {
    if (recording) return "Listening to voice input…";
    if (busyPhase === "connecting") return "Connecting to engine…";
    if (busyPhase === "transcribing") return "Transcribing speech…";
    if (busyPhase === "thinking") return "Evaluating loan policy…";
    if (isPlayingReply || busyPhase === "speaking") return "Agent replying…";
    if (call?.done) return "Call complete";
    if (call) return "Ready for response";
    return "Voice session ready";
  };

  // 7 minimal bars
  const barHeights = [
    Math.max(4, Math.round(audioLevel * 14)),
    Math.max(4, Math.round(audioLevel * 22)),
    Math.max(4, Math.round(audioLevel * 28)),
    Math.max(6, Math.round(audioLevel * 32)),
    Math.max(4, Math.round(audioLevel * 28)),
    Math.max(4, Math.round(audioLevel * 22)),
    Math.max(4, Math.round(audioLevel * 14)),
  ];

  return (
    <div className="voice-stage">
      {/* Borrower Simulation Context (Seamless Row, No Box Card) */}
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--divider)" }}>
        <div className="stack" style={{ gap: "2px" }}>
          <span className="strong">Musa Bello (Simulation)</span>
          <span className="small muted">₦25,000 due 10 Nov · DOB: 14 March</span>
        </div>

        <div className="row" style={{ gap: "12px" }}>
          {call ? (
            <>
              <span className="chip chip-gray">Step: {call.state}</span>
              <span className={call.verified ? "chip chip-green" : "chip chip-amber"}>
                {call.verified ? "ID Verified" : "Verification Pending"}
              </span>
              {call.done && (
                <span className="chip chip-gray">
                  {call.outcome?.replaceAll("_", " ") ?? "Closed"}
                </span>
              )}
            </>
          ) : (
            <span className="chip chip-gray">Standby</span>
          )}
        </div>
      </div>

      {/* Open Voice Console (No Outer Rectangle Box) */}
      <section className="voice-console-open" aria-labelledby="console-status">
        {/* Subtle Audio Reactive Meter Bars */}
        <div className="voice-meter-bars" aria-hidden="true">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className={recording ? "meter-bar active" : "meter-bar"}
              style={{ height: `${recording ? h : 4}px` }}
            />
          ))}
        </div>

        <div className="stack" style={{ alignItems: "center", gap: "6px" }}>
          <h2 id="console-status" style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "-0.025em" }}>
            {getStatusText()}
          </h2>
          <p className="small muted" style={{ maxWidth: "460px", lineHeight: 1.55 }}>
            {!call || call.done
              ? "Confirm identity with DOB (14 March), then negotiate a promise to pay."
              : "Press Record, speak your answer, and press Stop."}
          </p>
        </div>

        {/* Tactical Mic Trigger Button */}
        {!call || call.done ? (
          <button
            type="button"
            className="primary-btn"
            onClick={startCall}
            disabled={busy}
          >
            <Icon name="phone" size={14} />
            {busy ? "Connecting…" : call?.done ? "Start New Call" : "Connect Call"}
          </button>
        ) : (
          <div className="row" style={{ gap: "16px" }}>
            <button
              type="button"
              className={recording ? "mic-trigger-btn recording" : "mic-trigger-btn"}
              onClick={recording ? stop : start}
              disabled={busy}
              aria-label={recording ? "Stop Recording" : "Start Recording"}
            >
              <Icon name={recording ? "pause" : "mic"} size={22} />
            </button>
          </div>
        )}

        {/* Minimal Audio Replay Trigger */}
        {lastAudioUrl && (
          <div className="voice-player-pill">
            <button
              type="button"
              onClick={toggleReplay}
              className="icon-btn"
              aria-label={isPlayingReply ? "Pause replay" : "Replay agent speech"}
            >
              <Icon name={isPlayingReply ? "pause" : "play"} size={13} />
            </button>
            <span>Agent Audio Response</span>
            {isPlayingReply && (
              <div className="wave-dots" aria-hidden="true">
                <span className="wave-dot" />
                <span className="wave-dot" />
                <span className="wave-dot" />
              </div>
            )}
          </div>
        )}

        {/* Error States */}
        {micError && (
          <p className="small" style={{ color: "#ffffff" }} role="alert">
            {micError}
          </p>
        )}
        {error && (
          <p className="small" style={{ color: "#ffffff" }} role="alert">
            {error}
          </p>
        )}
      </section>

      {/* Verbatim Exchange Timeline (Borderless Linear Comment Style) */}
      {turns.length > 0 && (
        <section aria-label="Conversation Transcript" className="stack" style={{ gap: "20px", paddingTop: "20px", borderTop: "1px solid var(--divider)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="caption">Turn Stream</span>
            <span className="small muted mono">{turns.length} Turns</span>
          </div>

          <div className="conversation-feed">
            {turns.map((t, i) => (
              <div key={i} className="feed-item">
                <div className="feed-avatar">
                  {t.who === "agent" ? "N" : "MB"}
                </div>
                <div className="feed-content">
                  <div className="feed-header">
                    <span className="name">{t.who === "agent" ? "Agent" : "Borrower (You)"}</span>
                  </div>
                  <div className="feed-text">{t.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
