import { useEffect, useRef, useState } from "react";
import { loudness } from "@/lib/audio";
import { newVad, step, type Vad } from "@/lib/vad";

const MAX_TALK_MS = 30_000; // one turn never records longer than this
const MAX_WAIT_MS = 25_000; // if nobody speaks for this long, start the recording over so it stays small

// Opens the microphone once, then listens: it records while the person talks and hands over the audio when they stop.
export function useVoice(onUtterance: (audio: Blob) => void, onLevel: (level: number) => void) {
  const [error, setError] = useState<string | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const spoke = useRef(false);
  const send = useRef(onUtterance);
  const level = useRef(onLevel);

  useEffect(() => {
    send.current = onUtterance;
    level.current = onLevel;
  });

  // Stops the recording. With keep=true the audio goes to onUtterance, otherwise it is thrown away.
  function finish(keep: boolean) {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    level.current(0);
    const rec = recorder.current;
    recorder.current = null;
    if (!rec || rec.state === "inactive") return;
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => keep && chunks.length && send.current(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    rec.stop();
  }

  async function open(): Promise<boolean> {
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      setError("The microphone is blocked. Allow it in the browser and try again.");
      return false;
    }
    ctx.current = new AudioContext();
    await ctx.current.resume();
    analyser.current = ctx.current.createAnalyser();
    analyser.current.fftSize = 1024;
    ctx.current.createMediaStreamSource(stream.current).connect(analyser.current);
    return true;
  }

  function listen() {
    if (!stream.current || !analyser.current || recorder.current) return;
    const rec = new MediaRecorder(stream.current);
    rec.start();
    recorder.current = rec;
    spoke.current = false;
    const vad: Vad = newVad(performance.now());
    const buffer = new Float32Array(analyser.current.fftSize);
    let shown = 0;
    timer.current = setInterval(() => {
      if (!analyser.current) return;
      const now = performance.now();
      const raw = loudness(analyser.current, buffer);
      shown = Math.max(raw, shown * 0.85); // rises at once, falls slowly, so the orb looks smooth
      level.current(shown);
      const event = step(vad, raw, now);
      if (event === "start") spoke.current = true;
      if (event === "end" || (spoke.current && now - vad.t0 > MAX_TALK_MS)) finish(true);
      else if (!spoke.current && now - vad.t0 > MAX_WAIT_MS) {
        finish(false);
        listen();
      }
    }, 40);
  }

  const sendNow = () => spoke.current && finish(true); // the person taps to say they are done
  const pause = () => finish(false);

  function close() {
    finish(false);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (ctx.current && ctx.current.state !== "closed") void ctx.current.close().catch(() => {});
    ctx.current = null;
    analyser.current = null;
  }

  useEffect(() => close, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { open, listen, sendNow, pause, close, error, context: () => ctx.current };
}
