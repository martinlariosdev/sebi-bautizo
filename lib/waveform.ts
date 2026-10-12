/**
 * Downsamples PCM audio data into a fixed number of peak-amplitude buckets,
 * suitable for rendering as waveform bars.
 */
export function computePeaks(
  channelData: Float32Array,
  startSample: number,
  bucketCount: number
): number[] {
  const usableLength = Math.max(channelData.length - startSample, 0);
  const bucketSize = Math.max(1, Math.floor(usableLength / bucketCount));
  const peaks: number[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = startSample + i * bucketSize;
    const end = Math.min(start + bucketSize, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(channelData[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  return peaks;
}
