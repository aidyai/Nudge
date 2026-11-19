// Hands the microphone to the page in small blocks of samples. It runs on the audio thread.
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) this.port.postMessage(channel.slice());
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
