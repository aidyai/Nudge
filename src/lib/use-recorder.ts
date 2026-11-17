import { useEffect, useRef, useState } from "react";

/** Records from the microphone, tracks real-time audio level, and hands over the audio when stopped. */
export function useRecorder(onAudio: (blob: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const animFrame = useRef<number | null>(null);
  const callback = useRef(onAudio);

  useEffect(() => {
    callback.current = onAudio;
  });

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    if (animFrame.current) cancelAnimationFrame(animFrame.current);
    if (audioContext.current && audioContext.current.state !== "closed") {
      void audioContext.current.close().catch(() => {});
      audioContext.current = null;
    }
    setAudioLevel(0);
    if (recorder.current && recorder.current.state === "recording") {
      recorder.current.stop();
    }
    setRecording(false);
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      // Set up real-time audio level analyser
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContext.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (const val of dataArray) {
              sum += val;
            }
            const avg = sum / dataArray.length;
            // Normalize level between 0 and 1 with a slight curve for visibility
            const normalized = Math.min(1, Math.max(0, avg / 120));
            setAudioLevel(normalized);
            animFrame.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch {
        // Fallback gracefully if AudioContext fails (e.g. strict policy)
      }

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      rec.onstop = () => {
        if (animFrame.current) cancelAnimationFrame(animFrame.current);
        if (audioContext.current && audioContext.current.state !== "closed") {
          void audioContext.current.close().catch(() => {});
          audioContext.current = null;
        }
        setAudioLevel(0);
        stream.getTracks().forEach((track) => track.stop());
        callback.current(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };

      rec.start();
      recorder.current = rec;
      setRecording(true);
      timer.current = setTimeout(stop, 30_000);
    } catch {
      setError("The microphone is blocked. Allow it in the browser and try again.");
    }
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (audioContext.current && audioContext.current.state !== "closed") {
        void audioContext.current.close().catch(() => {});
      }
    };
  }, []);

  return { recording, error, audioLevel, start, stop };
}
