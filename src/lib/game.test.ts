import { describe, it, expect } from "vitest";
import {
  buildShareText,
  evaluateGuess,
  getPuzzleForDate,
  isValidGuess,
  WORD_LENGTH,
} from "./game.js";

describe("evaluateGuess", () => {
  it("returns all hits when guess equals answer", () => {
    const r = evaluateGuess("一期一会", "一期一会");
    expect(r.states).toEqual(["hit", "hit", "hit", "hit"]);
  });

  it("marks present chars at wrong positions as 'present'", () => {
    // 答え 一期一会 vs 推測 期一会一 (全て字は含むが位置が違う)
    const r = evaluateGuess("期一会一", "一期一会");
    expect(r.states).toEqual(["present", "present", "present", "present"]);
  });

  it("handles miss chars", () => {
    const r = evaluateGuess("猪突猛進", "一期一会");
    expect(r.states).toEqual(["miss", "miss", "miss", "miss"]);
  });

  it("respects duplicate-character bookkeeping (Wordle rule)", () => {
    // 答え 一期一会 に 一 が2つ。推測 一一一一 では:
    //   位置0: hit (1つ消費)
    //   位置1: miss (答えの位置1は 期)
    //   位置2: hit (1つ消費)
    //   位置3: miss (残カウント 0)
    const r = evaluateGuess("一一一一", "一期一会");
    expect(r.states).toEqual(["hit", "miss", "hit", "miss"]);
  });

  it("rejects mismatched lengths", () => {
    expect(() => evaluateGuess("一二三", "一期一会")).toThrow();
  });
});

describe("isValidGuess", () => {
  it("accepts dictionary entries", () => {
    expect(isValidGuess("一期一会")).toBe(true);
    expect(isValidGuess("臨機応変")).toBe(true);
  });
  it("rejects unknown words", () => {
    expect(isValidGuess("適当文字")).toBe(false);
  });
});

describe("getPuzzleForDate", () => {
  it("epoch day returns puzzle #1", () => {
    const { puzzleNumber, answer } = getPuzzleForDate(new Date("2026-06-01T09:00:00+09:00"));
    expect(puzzleNumber).toBe(1);
    expect(answer.word.length).toBe(WORD_LENGTH);
  });
  it("same date returns same puzzle", () => {
    const a = getPuzzleForDate(new Date("2026-08-15T01:00:00+09:00"));
    const b = getPuzzleForDate(new Date("2026-08-15T23:00:00+09:00"));
    expect(a.puzzleNumber).toBe(b.puzzleNumber);
    expect(a.answer.word).toBe(b.answer.word);
  });
});

describe("buildShareText", () => {
  it("solved case shows score and grid", () => {
    const text = buildShareText(
      5,
      [
        { word: "千差万別", states: ["miss", "miss", "hit", "miss"] },
        { word: "一期一会", states: ["hit", "hit", "hit", "hit"] },
      ],
      true,
      "https://ura-h.github.io/sharekanji/",
    );
    expect(text).toContain("ShareKanji #5  2/6");
    expect(text).toContain("⬜⬜🟩⬜");
    expect(text).toContain("🟩🟩🟩🟩");
    expect(text).toContain("https://ura-h.github.io/sharekanji/");
  });
  it("failed case shows X/6", () => {
    const text = buildShareText(7, [], false, "https://ex.test/");
    expect(text).toContain("X/6");
  });
});
