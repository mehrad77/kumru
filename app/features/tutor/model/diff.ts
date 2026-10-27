// Comparing what the learner wrote with the corrected sentence. Pure.

/** A word with its punctuation and capitals ignored. */
export const normW = (w: unknown): string => String(w || "").toLocaleLowerCase("tr").replace(/[.,!?;:«»"“”'’…]/g, "");

/** A sentence in a form two sentences can be compared in. */
export const normSent = (s: unknown): string => normW(s).replace(/\s+/g, " ").trim();

/** Whether two sentences are the same but for case, punctuation and spacing. */
export const sameSent = (a: unknown, b: unknown): boolean => normSent(a) === normSent(b);

/** A word and how it changed: 0 kept, -1 only in the first sentence, 1 only in the second. */
export type DiffPart = [string, -1 | 0 | 1];

/** Word diff (longest common subsequence) between what the learner wrote (`src`) and the corrected sentence (`dst`). */
export function wordDiff(a: unknown, b: unknown): { src: DiffPart[]; dst: DiffPart[] } {
  const A = String(a).trim().split(/\s+/).filter(Boolean), B = String(b).trim().split(/\s+/).filter(Boolean);
  const n = A.length, m = B.length;
  const T = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) T[i][j] = normW(A[i]) === normW(B[j]) ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
  }
  const src: DiffPart[] = [], dst: DiffPart[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (normW(A[i]) === normW(B[j])) { src.push([A[i], 0]); dst.push([B[j], 0]); i++; j++; }
    else if (T[i + 1][j] >= T[i][j + 1]) { src.push([A[i], -1]); i++; }
    else { dst.push([B[j], 1]); j++; }
  }
  while (i < n) src.push([A[i++], -1]);
  while (j < m) dst.push([B[j++], 1]);
  return { src, dst };
}
