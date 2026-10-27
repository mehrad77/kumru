// Mixed English/Persian text. Persian is first-class: each Persian piece is laid out as its own isolated run
// (first-strong isolate), so its punctuation stays on the correct side, and Latin runs inside Persian text are
// left-to-right isolates.

export const FA_CH = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
export const LAT_CH = /[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/;

/** English text with Persian in it: each Persian run is a first-strong isolate. */
export function bidiTxt<T>(value: T): T {
  const s: unknown = value;
  if (typeof s !== "string" || !FA_CH.test(s) || s.includes("\u2068")) return value;
  const iso = (t: string) => {
    const m = t.match(/^([\s·•|–—]*)([\s\S]*?)(\s*)$/)!;
    return m[2] ? m[1] + "\u2068" + m[2] + "\u2069" + m[3] : t;
  };
  if (!LAT_CH.test(s)) return iso(s) as T;
  const runs = (t: string) => t.replace(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF][\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D\s0-9۰-۹،؛؟!?.,«»-]*/g, iso);
  return s.split(/(\s+[·•|–—≈=→]\s+|:\s+|\n)/).map((p, i) => {
    if (i % 2 || !FA_CH.test(p)) return p;
    const f = p.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]|[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]/)!;
    return FA_CH.test(f[0]) ? iso(p) : runs(p);
  }).join("") as T;
}

/** Persian text with Turkish or English in it: each Latin run (with a leading -, ( or ‑) is a left-to-right isolate, so -(I)yor doesn't come out as yor(I)- */
export function faTxt<T>(value: T): T {
  const s: unknown = value;
  if (typeof s !== "string" || !LAT_CH.test(s) || /[\u2066\u2068]/.test(s)) return value;
  return s.replace(/[-–(‑]*[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû][A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû0-9()'’\-‑/]*(?:[ .·→]+[-–(‑]*[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû][A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû0-9()'’\-‑/]*)*/g, (m) => "\u2066" + m + "\u2069") as T;
}
