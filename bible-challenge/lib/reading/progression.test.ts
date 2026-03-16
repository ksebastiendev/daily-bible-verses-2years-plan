import { describe, expect, it } from "vitest";
import { getInitialStep, getProgress, getStepVerses } from "./progression";

describe("reading progression helpers", () => {
  it("computes initial step from verses done", () => {
    expect(getInitialStep(0, 24, 3)).toBe(0);
    expect(getInitialStep(3, 24, 3)).toBe(1);
    expect(getInitialStep(7, 24, 3)).toBe(2);
  });

  it("clamps initial step within valid bounds", () => {
    expect(getInitialStep(999, 4, 3)).toBe(1);
  });

  it("returns verses for current block", () => {
    const verses = [1, 2, 3, 4, 5, 6, 7];
    expect(getStepVerses(verses, 0, 3)).toEqual([1, 2, 3]);
    expect(getStepVerses(verses, 1, 3)).toEqual([4, 5, 6]);
    expect(getStepVerses(verses, 2, 3)).toEqual([7]);
  });

  it("computes progress metadata", () => {
    expect(getProgress(24, 0, 3)).toEqual({
      totalSteps: 8,
      versesShown: 3,
      isLastStep: false,
      progressPercent: 13,
    });

    expect(getProgress(24, 7, 3)).toEqual({
      totalSteps: 8,
      versesShown: 24,
      isLastStep: true,
      progressPercent: 100,
    });
  });
});
