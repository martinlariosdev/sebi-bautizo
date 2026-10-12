import { describe, it, expect } from "vitest";
import { computePeaks } from "./waveform";

describe("computePeaks", () => {
  it("returns one peak per bucket", () => {
    const data = new Float32Array(1000);
    const peaks = computePeaks(data, 0, 20);
    expect(peaks).toHaveLength(20);
  });

  it("ignores samples before startSample", () => {
    const data = new Float32Array(100);
    data[10] = 1; // loud sample before the offset
    data[90] = 0.2; // quiet sample after the offset
    const peaks = computePeaks(data, 50, 5);
    expect(Math.max(...peaks)).toBeCloseTo(0.2, 5);
  });

  it("takes the peak absolute value within each bucket", () => {
    const data = new Float32Array(10);
    data[2] = -0.9; // negative values count by magnitude
    data[7] = 0.1;
    const peaks = computePeaks(data, 0, 2);
    expect(peaks[0]).toBeCloseTo(0.9, 5);
    expect(peaks[1]).toBeCloseTo(0.1, 5);
  });

  it("returns zeros for silence", () => {
    const data = new Float32Array(100);
    const peaks = computePeaks(data, 0, 10);
    expect(peaks.every((p) => p === 0)).toBe(true);
  });
});
