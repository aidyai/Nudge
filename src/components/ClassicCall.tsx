"use client";

import { useEffect, useRef, useState } from "react";
import { play, type Playing } from "@/lib/audio";
import { useVoice } from "@/lib/use-voice";
import { CallStage } from "@/components/CallStage";
import type { Borrower, Phase, Turn } from "@/lib/use-live-call";

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

// The turn-by-turn call: one recording per sentence, sent when you stop talking. Slower, but works anywhere the live call cannot.
export function ClassicCall({ borrowerId }: { borrowerId: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [call, setCall] = useState<Reply | null>(null);
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pills = useRef<HTMLButtonElement>(null);
  const callId = useRef<string | null>(null);
  const playing = useRef<Playing | null>(null);
  const live = useRef(false); // false once the call is ended or the page is left

  const setLevel = (level: number) => pills.current?.style.setProperty("--level", Math.min(0.3, level).toFixed(3));
  const voice = useVoice((audio) => void hear(audio), setLevel);

  useEffect(() => {
    return () => {
      live.current = false;
      playing.current?.stop();
    };
  }, []);

  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : "Could not reach the server.");
    setPhase("listening");
    if (live.current) voice.listen();
  }

  // Says the agent's line out loud, then goes back to listening unless the call is over.
  async function say(text: string, done: boolean) {
    setPhase("speaking");
    try {
      const blob = await (await sendJson("speech/say", { text })).blob();
      const ctx = voice.context();
      if (!live.current || !ctx) return;
      playing.current = play(blob, ctx, setLevel);
      await playing.current.done;
    } catch {
      // the words are on the screen even if the voice failed
    }
    playing.current = null;
    if (!live.current) return;
    if (done) return hangUp(false);
    setPhase("listening");
    voice.listen();
  }

  async function hear(audio: Blob) {
    if (!live.current || !callId.current) return;
    setPhase("thinking");
    setError(null);
    try {
      const heard = (await (await send("speech/transcribe", audio, audio.type)).json()) as { transcript: string };
      if (!heard.transcript.trim()) {
        setPhase("listening");
        return voice.listen();
      }
      setTurns((t) => [...t, { who: "you", text: heard.transcript }]);
      const r = (await (await sendJson(`calls/${callId.current}/turns`, { text: heard.transcript })).json()) as Reply;
      setCall(r);
      if (!live.current) return;
      if (r.reply) {
        setTurns((t) => [...t, { who: "agent", text: r.reply }]);
        await say(r.reply, r.done);
      } else if (r.done) hangUp(false);
      else {
        setPhase("listening");
        voice.listen();
      }
    } catch (e) {
      fail(e);
    }
  }

  async function start() {
    setError(null);
    setTurns([]);
    setCall(null);
    setPhase("connecting");
    if (!(await voice.open())) return setPhase("idle");
    live.current = true;
    try {
      const r = (await (await sendJson("calls", { borrower_id: borrowerId })).json()) as Reply & { borrower?: Borrower };
      callId.current = r.call_id;
      setCall(r);
      setBorrower(r.borrower ?? null);
      setTurns([{ who: "agent", text: r.reply }]);
      await say(r.reply, r.done);
    } catch (e) {
      live.current = false;
      voice.close();
      setError(e instanceof Error ? e.message : "Could not reach the server.");
      setPhase("idle");
    }
  }

  // Ends the call. When the agent hangs up by itself the last line stays on screen.
  function hangUp(byPerson = true) {
    live.current = false;
    playing.current?.stop();
    voice.close();
    setLevel(0);
    setPhase("idle");
    if (byPerson) setError(null);
  }

  // One tap does what is useful right now: cut the agent off, or say "I have finished talking".
  function tap() {
    if (phase === "idle") return void start();
    if (phase === "speaking") {
      playing.current?.stop();
      return;
    }
    if (phase === "listening") voice.sendNow();
  }

  const hint =
    phase === "listening" ? "Just talk. It hears when you stop." : "";

  return (
    <CallStage
      phase={phase}
      borrower={borrower}
      call={call}
      turns={turns}
      error={error ?? voice.error}
      pills={pills}
      onTap={tap}
      onEnd={() => hangUp()}
      hint={hint}
    />
  );
}
