import { describe, expect, it } from "vitest";
import { extractVersesFromApiPayload } from "./adapter";

describe("bible adapter payload normalization", () => {
  it("extracts verses from direct verses array", () => {
    const verses = extractVersesFromApiPayload({
      verses: [
        { verse: 1, text: "Au commencement" },
        { verse: 2, text: "La terre etait informe" },
      ],
    });

    expect(verses).toEqual([
      { verse: 1, text: "Au commencement" },
      { verse: 2, text: "La terre etait informe" },
    ]);
  });

  it("extracts verses from nested data.verses array", () => {
    const verses = extractVersesFromApiPayload({
      data: {
        verses: [
          { verse_number: 5, content: "Dieu vit que cela etait bon" },
          { verse_number: 6, content: "Puis Dieu dit" },
        ],
      },
    });

    expect(verses).toEqual([
      { verse: 5, text: "Dieu vit que cela etait bon" },
      { verse: 6, text: "Puis Dieu dit" },
    ]);
  });

  it("ignores invalid rows and returns empty list for invalid payload", () => {
    expect(extractVersesFromApiPayload({ verses: [{ verse: 0, text: "" }] })).toEqual([]);
    expect(extractVersesFromApiPayload(null)).toEqual([]);
  });
});
