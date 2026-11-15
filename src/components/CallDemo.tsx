"use client";

import { useEffect, useRef, useState } from "react";
import { useRecorder } from "@/lib/use-recorder";

type Turn = { who: "you" | "agent"; text: string };
type Reply = { call_id: string; reply: string; state: string; verified: boolean; outcome: string | null; done: boolean };

async function send(path: string, body: BodyInit, contentType: string): Promise<Response> {
  const response = await fetch(`/api/${path}`, { method: "POST", headers: { "Content-Type": contentType }, body });
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = (await response.json()).detail;
    } catch {
      // the body was not JSON
    }
    throw new Error(typeof detail === "string" && detail ? detail : `Something went wrong (HTTP ${response.status}).`);
  }
  return response;
}

const sendJson = (path: string, body: unknown) => send(path, JSON.stringify(body), "application/json");

export function CallDemo() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [call, setCall] = useState<Reply | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  async function speak(text: string) {
    const url = URL.createObjectURL(await (await sendJson("speech/say", { text })).blob());
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    setLastUrl(url);
    void new Audio(url).play().catch(() => setError("Press play on the player to hear the reply."));
  }

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const startCall = () =>
    run(async () => {
      const r = (await (await sendJson("calls", {})).json()) as Reply;
      setCall(r);
      setTurns([{ who: "agent", text: r.reply }]);
      await speak(r.reply);
    });

  const takeTurn = (audio: Blob) =>
    run(async () => {
      if (!call) return;
      const heard = (await (await send("speech/transcribe", audio, audio.type)).json()) as { transcript: string };
      if (!heard.transcript.trim()) throw new Error("Nothing was heard. Try again a little closer to the microphone.");
      setTurns((t) => [...t, { who: "you", text: heard.transcript }]);
      const r = (await (await sendJson(`calls/${call.call_id}/turns`, { text: heard.transcript })).json()) as Reply;
      setCall(r);
      if (r.reply) {
        setTurns((t) => [...t, { who: "agent", text: r.reply }]);
        await speak(r.reply);
      }
    });

  const { recording, error: micError, start, stop } = useRecorder(takeTurn);

  return (
    <section className="panel demo" aria-labelledby="demo-title">
      <h2 id="demo-title">
        Talk to the agent <span className="muted small">the real agent, with its rules</span>
      </h2>
      {!call || call.done ? (
        <>
          <p className="muted">
            The agent phones a made-up borrower, and you answer as that borrower. Confirm the name, give the birthday the database holds, then arrange a payment.
          </p>
          <button type="button" className="primary" onClick={startCall} disabled={busy}>
            {busy ? "Connecting…" : call?.done ? "Start a new call" : "Start the call"}
          </button>
        </>
      ) : (
        <>
          <p className="muted small">Press Record, answer, press Stop. The agent replies out loud.</p>
          <button type="button" className={recording ? "primary recording" : "primary"} onClick={recording ? stop : start} disabled={busy}>
            {recording ? "Stop" : busy ? "Thinking…" : "Record"}
          </button>
        </>
      )}
      {call ? (
        <p className="small">
          <span className="chip chip-gray">Step: {call.state}</span>{" "}
          <span className={call.verified ? "chip chip-green" : "chip chip-amber"}>{call.verified ? "Identity verified" : "Not verified yet"}</span>
          {call.done ? <> <span className="chip chip-green">Call ended: {(call.outcome ?? "no outcome").replaceAll("_", " ")}</span></> : null}
        </p>
      ) : null}
      {micError ? <p className="error" role="alert">{micError}</p> : null}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {turns.map((t, i) => (
        <div key={i} className={t.who === "agent" ? "bubble-row" : "bubble-row right"}>
          <div className={t.who === "agent" ? "bubble agent" : "bubble caller"}>
            <span className="muted small">{t.who === "agent" ? "Agent" : "You"}</span>
            <span>{t.text}</span>
          </div>
        </div>
      ))}
      {lastUrl ? <audio controls src={lastUrl} /> : null}
    </section>
  );
}
