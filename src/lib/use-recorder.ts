import { useEffect, useRef, useState } from "react";

/** Records from the microphone, at most 30 seconds, and hands over the audio when stopped. */
export function useRecorder(onAudio: (blob: Blob) => void) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onAudio);
  useEffect(() => {
    callback.current = onAudio;
  });

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    setRecording(false);
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
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

  return { recording, error, start, stop };
}
