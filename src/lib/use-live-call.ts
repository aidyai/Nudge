import { useEffect, useRef, useState } from "react";
import { rmsOf } from "@/lib/audio";
import { chunker, fromPcm16, toPcm16 } from "@/lib/pcm";

export type Phase = "idle" | "connecting" | "listening" | "thinking" | "speaking";
export type Turn = { who: "you" | "agent"; text: string };
export type Borrower = { name: string; birthday: string; company?: string | null };
export type CallInfo = { state: string; verified: boolean; outcome: string | null; done: boolean };

const MIC_RATE = 16_000;
const VOICE_RATE = 24_000; // what the engine speaks at
const SEND_SAMPLES = 640; // 40 ms of microphone per message
const CONNECT_MS = 60_000; // a sleeping engine can take a while to wake

type Message =
  | { type: "user"; text: string }
  | { type: "agent"; text: string; state: string; verified: boolean; outcome: string | null; done: boolean }
  | { type: "interrupt" };

// One live call: the microphone streams to the engine, the engine streams its voice back. Nothing to press.
// onLevel gets how loud the person (listening) or the agent (speaking) is right now, to move the pills.
// onUnavailable is called if the call never got going, so the page can offer another way.
export function useLiveCall(borrowerId: string, onLevel: (level: number) => void, onUnavailable: () => void) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [call, setCall] = useState<CallInfo | null>(null);
  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const live = useRef<{ stop: () => void; interrupt: () => void } | null>(null);
  const mutedRef = useRef(false);
  const level = useRef(onLevel);
  const unavailable = useRef(onUnavailable);

  useEffect(() => {
    level.current = onLevel;
    unavailable.current = onUnavailable;
  });
  useEffect(() => () => live.current?.stop(), []);

  async function start() {
    setError(null);
    setTurns([]);
    setCall(null);
    setPhase("connecting");

    let stream: MediaStream | undefined;
    let ctx: AudioContext | undefined;
    let socket: WebSocket | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let ended = false;
    let opened = false;

    function stop() {
      if (ended) return;
      ended = true;
      clearInterval(timer);
      level.current(0);
      if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
      stream?.getTracks().forEach((t) => t.stop());
      if (ctx && ctx.state !== "closed") void ctx.close().catch(() => {});
      live.current = null;
      setPhase("idle");
    }
    let cut = () => {};
    live.current = { stop, interrupt: () => cut() };

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      setError("The microphone is blocked. Allow it in the browser and try again.");
      return stop();
    }

    try {
      const response = await fetch("/api/realtime/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ borrower_id: borrowerId }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { ticket, ws_url, borrower: who } = (await response.json()) as { ticket: string; ws_url: string; borrower: Borrower };
      setBorrower(who);

      ctx = new AudioContext({ sampleRate: MIC_RATE });
      await ctx.resume();
      await ctx.audioWorklet.addModule("/pcm-worklet.js");
      const audioCtx = ctx;

      // what comes back: the agent's voice, queued so the pieces play one after another
      const speaker = audioCtx.createAnalyser();
      speaker.fftSize = 512;
      speaker.connect(audioCtx.destination);
      const speakerBuffer = new Float32Array(speaker.fftSize);
      const playing = new Set<AudioBufferSourceNode>();
      let nextAt = 0;
      let waiting = true; // the agent has been asked and has not started to speak yet
      let finishing = false; // the agent said its last words

      const queue = (bytes: ArrayBuffer) => {
        const samples = fromPcm16(bytes);
        if (!samples.length) return;
        const buffer = audioCtx.createBuffer(1, samples.length, VOICE_RATE);
        buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(speaker);
        const at = Math.max(nextAt, audioCtx.currentTime + 0.03);
        source.start(at);
        nextAt = at + buffer.duration;
        playing.add(source);
        source.onended = () => playing.delete(source);
        waiting = false;
      };
      const silence = () => {
        playing.forEach((s) => s.stop());
        playing.clear();
        nextAt = 0;
      };
      cut = () => {
        silence();
        waiting = false; // she has stopped: it is your turn
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "interrupt" })); // tell the engine to stop too
      };

      // what goes out: the microphone, in small chunks
      const mic = audioCtx.createMediaStreamSource(stream);
      const capture = new AudioWorkletNode(audioCtx, "pcm-capture");
      const mute = audioCtx.createGain(); // the worklet only runs while it is connected to something
      mute.gain.value = 0;
      mic.connect(capture).connect(mute).connect(audioCtx.destination);
      let heard = 0;
      const send = chunker(SEND_SAMPLES, (chunk) => {
        if (socket?.readyState === WebSocket.OPEN && !mutedRef.current) socket.send(toPcm16(chunk).buffer as ArrayBuffer);
      });
      capture.port.onmessage = (e: MessageEvent<Float32Array>) => {
        heard = Math.max(rmsOf(e.data), heard * 0.9);
        send(e.data);
      };

      socket = new WebSocket(`${ws_url}?ticket=${encodeURIComponent(ticket)}`);
      socket.binaryType = "arraybuffer";
      const gaveUp = setTimeout(() => !opened && stop(), CONNECT_MS);
      socket.onopen = () => {
        opened = true;
        clearTimeout(gaveUp);
      };
      socket.onerror = () => !opened && setError("Could not open the live connection.");
      socket.onclose = () => {
        clearTimeout(gaveUp);
        if (!opened) unavailable.current();
        stop();
      };
      socket.onmessage = (e: MessageEvent<string | ArrayBuffer>) => {
        if (typeof e.data !== "string") return queue(e.data);
        const m = JSON.parse(e.data) as Message;
        if (m.type === "interrupt") silence();
        else if (m.type === "user") {
          waiting = true;
          setTurns((t) => [...t, { who: "you", text: m.text }]);
        } else if (m.type === "agent") {
          finishing = m.done;
          setCall({ state: m.state, verified: m.verified, outcome: m.outcome, done: m.done });
          setTurns((t) => [...t, { who: "agent", text: m.text }]);
        }
      };

      let shown = 0;
      let last: Phase = "connecting";
      timer = setInterval(() => {
        const speaking = playing.size > 0 && audioCtx.currentTime < nextAt;
        let now: Phase = speaking ? "speaking" : waiting ? "thinking" : "listening";
        if (!opened) now = "connecting";
        if (finishing && !speaking && !waiting) return stop(); // the agent finished and its voice has played out
        speaker.getFloatTimeDomainData(speakerBuffer);
        const raw = speaking ? rmsOf(speakerBuffer) : now === "listening" && !mutedRef.current ? heard : 0;
        shown = Math.max(raw, shown * 0.85); // rises at once, falls slowly, so the orb looks smooth
        level.current(shown);
        if (now !== last) {
          last = now;
          setPhase(now);
        }
      }, 40);
    } catch (e) {
      if (!opened) unavailable.current();
      setError(e instanceof Error && e.message ? `Could not start the live call (${e.message}).` : "Could not start the live call.");
      stop();
    }
  }

  function toggleMute() {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }

  return { phase, turns, call, borrower, error, muted, start, end: () => live.current?.stop(), interrupt: () => live.current?.interrupt(), toggleMute };
}
