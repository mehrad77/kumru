// The onboarding's own words in the three help languages (app/core/lang.ts): English, Persian and Russian. The headings stay
// Turkish (`lang="tr"`); everything a learner must understand to go on is here. `{n}`-style holes are filled by `fill`. Pure.
// model/answers.test.ts checks every key has all three.

export type UiLang = "en" | "fa" | "ru";

/** The flow's language from the help language: Persian for "fa" and "both", Russian for "ru", else English ("none" included). */
export const uiLangOf = (help: string): UiLang => (help === "fa" || help === "both" ? "fa" : help === "ru" ? "ru" : "en");

/** A first guess for a new learner from the browser's languages: Persian or Russian if the browser asks for one, else English. */
export function guessLang(langs: readonly string[]): UiLang {
  for (const l of langs) {
    const p = l.toLowerCase().slice(0, 2);
    if (p === "fa" || p === "ru" || p === "en") return p;
  }
  return "en";
}

export const WORDS = {
  next: { en: "Next", fa: "بعدی", ru: "Далее" },
  back: { en: "Back", fa: "قبلی", ru: "Назад" },
  skip: { en: "Skip", fa: "رد شدن", ru: "Пропустить" },
  notNow: { en: "Not now", fa: "فعلاً نه", ru: "Не сейчас" },
  step: { en: "Step {i} of {n}", fa: "مرحله {i} از {n}", ru: "Шаг {i} из {n}" },
  allSet: { en: "All set!", fa: "همه چیز آماده است!", ru: "Всё готово!" },
  oops: { en: "This step didn't open. You can go on.", fa: "این مرحله باز نشد. می‌توانید ادامه دهید.", ru: "Этот шаг не открылся. Можно идти дальше." },

  langAsk: { en: "Which language should help you with Turkish?", fa: "کدام زبان در یادگیری ترکی کمکتان کند؟", ru: "Какой язык поможет вам с турецким?" },
  langNote: { en: "You can change it later in Profile.", fa: "بعداً در پروفایل می‌توانید عوضش کنید.", ru: "Его можно поменять потом в профиле." },

  nameAsk: { en: "Let's learn Turkish together. What should we call you?", fa: "بیایید با هم ترکی یاد بگیریم. شما را چه صدا کنیم؟", ru: "Давайте учить турецкий вместе. Как вас называть?" },
  nameCheck: { en: "Check your name. The stories add Turkish endings to it.", fa: "نامتان را بررسی کنید. داستان‌ها به آن پسوندهای ترکی اضافه می‌کنند.", ru: "Проверьте имя. В историях к нему добавляются турецкие окончания." },
  namePh: { en: "Your name", fa: "نام شما", ru: "Ваше имя" },
  nameEnds: { en: "Turkish endings will look like this:", fa: "پسوندهای ترکی این‌طور می‌شوند:", ru: "Турецкие окончания будут такими:" },
  nameLatin: { en: "Write it in Latin letters so Turkish endings fit, like Mehrad'ın.", fa: "با حروف لاتین بنویسید تا پسوندهای ترکی به آن بخورد، مثل Mehrad'ın.", ru: "Напишите латиницей, чтобы подходили турецкие окончания, например Mehrad'ın." },
  nameAi: { en: "Latin spelling:", fa: "املای لاتین:", ru: "Латиницей:" },
  nameGuess: { en: "Rough guess, please edit:", fa: "حدس تقریبی، لطفاً اصلاح کنید:", ru: "Примерно так, поправьте:" },

  charNote: { en: "This is you in every story.", fa: "این شما هستید، در همهٔ داستان‌ها.", ru: "Это вы — в каждой истории." },
  charLoading: { en: "Loading your character…", fa: "در حال آماده کردن شخصیت شما…", ru: "Загружаем вашего персонажа…" },
  charSkip: { en: "Skip the character for now", fa: "فعلاً بدون شخصیت ادامه بده", ru: "Пока без персонажа" },
  charFailed: { en: "The character maker could not load. Go on, and make your character later from your profile.", fa: "سازندهٔ شخصیت بارگیری نشد. ادامه دهید و بعداً از پروفایل شخصیتتان را بسازید.", ru: "Конструктор персонажа не загрузился. Продолжайте, персонажа можно сделать потом в профиле." },
  body: { en: "Body", fa: "بدن", ru: "Тело" },
  face: { en: "Face", fa: "چهره", ru: "Лицо" },
  hair: { en: "Hair", fa: "مو", ru: "Волосы" },
  clothes: { en: "Clothes", fa: "لباس", ru: "Одежда" },
  extras: { en: "Extras", fa: "لوازم", ru: "Аксессуары" },
  resetAsk: { en: "Start over?", fa: "از اول شروع کنیم؟", ru: "Начать заново?" },
  resetBody: { en: "Your character goes back to the start. You can undo this.", fa: "شخصیت شما به حالت اول برمی‌گردد. می‌توانید آن را برگردانید.", ru: "Персонаж вернётся к началу. Это можно отменить." },
  resetOk: { en: "Start over", fa: "از اول", ru: "Заново" },
  looksLikeMe: { en: "Looks like me!", fa: "شبیه من است!", ru: "Похоже на меня!" },

  homeAsk: { en: "Where are you from? The characters will remember it.", fa: "اهل کجایید؟ شخصیت‌ها آن را به خاطر می‌سپارند.", ru: "Откуда вы? Персонажи это запомнят." },
  homeBusy: { en: "The tutor is writing it down…", fa: "معلم دارد آن را یادداشت می‌کند…", ru: "Репетитор записывает…" },
  homePh: { en: "e.g. Shiraz", fa: "مثلاً شیراز", ru: "например, Шираз" },

  classAsk: { en: "Learning with a class?", fa: "با کلاس یاد می‌گیرید؟", ru: "Учитесь в группе?" },
  classBody: { en: "Your teacher, admin, will see your position, streak and weakest words. You can stop sharing any time in Friends.", fa: "معلم شما (admin) جایگاه، روزهای پیاپی و ضعیف‌ترین کلمه‌هایتان را می‌بیند. هر وقت بخواهید در بخش دوستان می‌توانید اشتراک را قطع کنید.", ru: "Ваш преподаватель (admin) увидит ваше место, серию дней и самые трудные слова. Отключить это можно в любой момент в «Друзьях»." },
  classN: { en: "Class {n}", fa: "کلاس {n}", ru: "Группа {n}" },
  classNone: { en: "No class for now", fa: "فعلاً بدون کلاس", ru: "Пока без группы" },
  classFailed: { en: "Couldn't join the class. You can join later in Friends.", fa: "پیوستن به کلاس نشد. بعداً در بخش دوستان می‌توانید.", ru: "Не получилось вступить в группу. Это можно сделать позже в «Друзьях»." },

  remindBody: { en: "Kerim can tell you once a day when a new story is waiting for you, only on days you haven't read yet. Choose the time:", fa: "کریم می‌تواند روزی یک بار خبرتان کند که داستان تازه‌ای منتظرتان است، فقط روزهایی که هنوز نخوانده‌اید. ساعت را انتخاب کنید:", ru: "Керим может раз в день напоминать, что вас ждёт новая история, — только в те дни, когда вы ещё не читали. Выберите время:" },
  remindHour: { en: "Reminder hour", fa: "ساعت یادآوری", ru: "Время напоминания" },
  remindNo: { en: "This browser can't show reminders. On iPhone, add Kumru to the Home Screen first (Share → Add to Home Screen), then turn them on in Profile.", fa: "این مرورگر نمی‌تواند یادآوری نشان دهد. در آیفون اول Kumru را به صفحهٔ اصلی اضافه کنید (Share → Add to Home Screen) و بعد در پروفایل روشنش کنید.", ru: "Этот браузер не умеет показывать напоминания. На iPhone сначала добавьте Kumru на экран «Домой» (Поделиться → На экран «Домой»), потом включите их в профиле." },
  remindOn: { en: "Turn on", fa: "روشن کن", ru: "Включить" },

  castBody: { en: "In our stories you are the newcomer in Istanbul. These friends will help you:", fa: "در داستان‌های ما شما تازه‌وارد استانبول هستید. این دوستان کمکتان می‌کنند:", ru: "В наших историях вы — новичок в Стамбуле. Вам помогут эти друзья:" },
  castRead: { en: "Read your first story", fa: "اولین داستان را بخوانید", ru: "Читать первую историю" },
  castLook: { en: "Look around first", fa: "اول نگاهی بیندازم", ru: "Сначала осмотреться" },

  newBody: { en: "Make your own paper character: your friends see it, and it is you in Kerim's stories. Your progress is kept.", fa: "شخصیت کاغذی خودتان را بسازید: دوستانتان آن را می‌بینند و در داستان‌های کریم، آن شما هستید. پیشرفتتان حفظ می‌شود.", ru: "Сделайте своего бумажного персонажа: его видят друзья, и это вы в историях Керима. Ваш прогресс сохранится." },
  newGo: { en: "Let's go", fa: "برویم", ru: "Поехали" },
} satisfies Record<string, Record<UiLang, string>>;

export type WordKey = keyof typeof WORDS;

/** The word in `lang`, its `{holes}` filled. */
export const fill = (lang: UiLang, k: WordKey, vars: Record<string, string | number> = {}): string =>
  WORDS[k][lang].replace(/\{(\w+)\}/g, (m, v: string) => (v in vars ? String(vars[v]) : m));
