import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom doesn't implement HTMLMediaElement playback — stub the minimum
// needed for components that call play()/pause() on an <audio> element.
window.HTMLMediaElement.prototype.play = function () {
  return Promise.resolve();
};
window.HTMLMediaElement.prototype.pause = function () {};

// jsdom doesn't implement the Web Audio API either — stub just enough of
// fetch + AudioContext.decodeAudioData for components that compute a
// waveform from an audio file. Tests can override these with their own
// vi.fn() when they need specific sample data.
global.fetch = vi.fn(() =>
  Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
) as unknown as typeof fetch;

class FakeAudioContext {
  decodeAudioData() {
    const sampleRate = 48000;
    const channelData = new Float32Array(sampleRate * 21).fill(0.5);
    return Promise.resolve({ sampleRate, getChannelData: () => channelData });
  }
  close() {}
}
// @ts-expect-error — jsdom has no real AudioContext to type against
window.AudioContext = FakeAudioContext;
