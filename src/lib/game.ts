/**
 * ShareKanji ゲームロジック
 *
 * Wordle ライクな 4字熟語当てゲーム。
 * - 答えは 4字熟語の辞書（src/data/yojijukugo.json）から日付ベースで決定論的に選ばれる
 * - プレイヤーは 6 回まで推測できる
 * - 各文字に対して色フィードバックを返す:
 *   - hit:    正しい位置に正しい字
 *   - present: 字は含むが位置が違う
 *   - miss:   含まれない
 */

import yojijukugoData from "../data/yojijukugo.json";

export interface Yojijukugo {
  word: string;
  reading: string;
  meaning: string;
}

export const DICTIONARY: Yojijukugo[] = yojijukugoData;
export const WORD_LENGTH = 4;
export const MAX_GUESSES = 6;

/** ゲーム開始日（この日を Puzzle #1 とする） */
const EPOCH = new Date("2026-06-01T00:00:00+09:00");
const DAY_MS = 24 * 60 * 60 * 1000;

export type LetterState = "hit" | "present" | "miss";

export interface EvaluatedGuess {
  word: string;
  states: LetterState[];
}

/**
 * 指定日に対応するパズル番号と答えを返す。
 *
 * 同じ日なら同じパズル。
 */
export function getPuzzleForDate(date: Date = new Date()): {
  puzzleNumber: number;
  answer: Yojijukugo;
} {
  const elapsed = Math.max(
    0,
    Math.floor((date.getTime() - EPOCH.getTime()) / DAY_MS),
  );
  const puzzleNumber = elapsed + 1;
  const answer = DICTIONARY[elapsed % DICTIONARY.length]!;
  return { puzzleNumber, answer };
}

/**
 * 推測語が辞書に含まれるか。
 */
export function isValidGuess(guess: string): boolean {
  return DICTIONARY.some((y) => y.word === guess);
}

/**
 * 推測語を答えと突き合わせて、各文字の状態を返す。
 *
 * 重複文字の扱いは Wordle と同じ:
 * - 1st pass: hit (緑) を確定
 * - 2nd pass: 残った答えの字を unmatched としてカウントし、present (黄) を判定
 */
export function evaluateGuess(guess: string, answer: string): EvaluatedGuess {
  if (guess.length !== WORD_LENGTH || answer.length !== WORD_LENGTH) {
    throw new Error(`Both must be ${WORD_LENGTH} characters`);
  }
  const guessChars = [...guess];
  const answerChars = [...answer];
  const states: LetterState[] = Array(WORD_LENGTH).fill("miss");

  // 残カウント。1st pass で hit を抜いた後、 present 判定で参照する
  const remaining: Record<string, number> = {};

  // 1st pass: hit
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === answerChars[i]) {
      states[i] = "hit";
    } else {
      const c = answerChars[i]!;
      remaining[c] = (remaining[c] ?? 0) + 1;
    }
  }

  // 2nd pass: present
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (states[i] === "hit") continue;
    const c = guessChars[i]!;
    if ((remaining[c] ?? 0) > 0) {
      states[i] = "present";
      remaining[c]! -= 1;
    }
  }

  return { word: guess, states };
}

/**
 * シェア用の絵文字グリッドを生成する。
 *
 * 例:
 *   ShareKanji #5  3/6
 *   🟨⬜🟩⬜
 *   🟩🟨🟩⬜
 *   🟩🟩🟩🟩
 *   https://ura-h.github.io/sharekanji/
 */
export function buildShareText(
  puzzleNumber: number,
  guesses: EvaluatedGuess[],
  solved: boolean,
  siteUrl: string,
): string {
  const score = solved ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const grid = guesses
    .map((g) =>
      g.states
        .map((s) => (s === "hit" ? "🟩" : s === "present" ? "🟨" : "⬜"))
        .join(""),
    )
    .join("\n");
  return `ShareKanji #${puzzleNumber}  ${score}\n${grid}\n${siteUrl}`;
}
