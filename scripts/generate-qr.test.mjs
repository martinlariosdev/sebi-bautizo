import { describe, it, expect, afterEach } from "vitest";
import { existsSync, statSync, rmSync } from "node:fs";
import { generateQr } from "./generate-qr.mjs";

const outputPath = "./test-qr.png";

describe("generateQr", () => {
  afterEach(() => {
    if (existsSync(outputPath)) rmSync(outputPath);
  });

  it("writes a non-empty PNG file for a given URL", async () => {
    await generateQr("https://sebi-bautizo.vercel.app", outputPath);
    expect(existsSync(outputPath)).toBe(true);
    expect(statSync(outputPath).size).toBeGreaterThan(0);
  });
});
