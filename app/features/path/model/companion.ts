// What Kerim says at the top of the Path, from the learner's day: [mood, Turkish, Persian]. Pure.

export interface Day {
  /** The learner's name, if they gave one. */
  name: string;
  goal: number;
  /** XP today. */
  today: number;
  /** Days in a row. */
  streak: number;
  /** Whether they have answered anything yet. */
  started: boolean;
  /** The hour of the day, 0-23. */
  hour: number;
}

export function companionLine(d: Day): [string, string, string] {
  const { name, goal, today, streak: stk, hour: h } = d;
  if (!d.started) return ["happy", "Merhaba! Hadi başlayalım.", "سلام! بیا شروع کنیم."];
  if (today >= goal) return ["cheer", "Bugünkü hedef tamam! Aferin" + (name ? " " + name : "") + "!", "هدف امروز انجام شد! آفرین!"];
  if (today > 0) return ["happy", "Az kaldı! " + (goal - today) + " puan daha.", "چیزی نمانده! " + (goal - today) + " امتیاز دیگر."];
  if (stk >= 2) return ["happy", stk + " gündür devam ediyorsun! Serini bozma.", "تو " + stk + " روزه ادامه می‌دهی! زنجیره را نشکن."];
  if (h < 5 || h >= 23) return ["sleepy", "Geç oldu… ama bir adım atalım mı?", "دیر شده… ولی یک قدم برداریم؟"];
  return ["idle", (h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar") + (name ? " " + name : "") + "! Sıradaki adım seni bekliyor.", (h < 12 ? "صبح بخیر" : h < 18 ? "روز بخیر" : "عصر بخیر") + "! قدم بعدی منتظر توست."];
}
