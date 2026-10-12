import { describe, it, expect } from "vitest";
import { formatClockTime } from "./time";

describe("formatClockTime", () => {
  it("formats zero as 0:00", () => {
    expect(formatClockTime(0)).toBe("0:00");
  });

  it("floors fractional seconds", () => {
    expect(formatClockTime(12.9)).toBe("0:12");
  });

  it("pads single-digit seconds", () => {
    expect(formatClockTime(5)).toBe("0:05");
  });

  it("rolls over into minutes", () => {
    expect(formatClockTime(65)).toBe("1:05");
  });

  it("clamps negative values to 0:00", () => {
    expect(formatClockTime(-3)).toBe("0:00");
  });
});
