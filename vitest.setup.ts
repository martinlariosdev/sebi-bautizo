import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement HTMLMediaElement playback — stub the minimum
// needed for components that call play()/pause() on an <audio> element.
window.HTMLMediaElement.prototype.play = function () {
  return Promise.resolve();
};
window.HTMLMediaElement.prototype.pause = function () {};
