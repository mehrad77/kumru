// Which screen a URL asks for: the tabs, their old names and paths, and `parseRoute`. Pure: no DOM, no state.
//
// Every screen has a path, no # routes (the Worker serves the page at all of them): /path /stories /lab /friends /owner are
// the tabs; the Profile tab is the learner's own /@username; a lesson is /lesson/<id>, a story /stories/<id>, a class
// /c/<code>, a card /card/<id>, a unit /unit/<REF> (the Path at that unit; the reader links here); /onboarding and /kerim
// are dev screens; /connect/yeni?return=<url> is Notebook's consent sheet. Old #links still work.

/** stories (home) · path · lab (editors, or ?lab) · friends · profile · people (admin, desktop only). */
export const TABS = ["stories", "path", "lab", "friends", "profile", "people"] as const;
export type TabId = (typeof TABS)[number];

/** Old hashes and names still land somewhere sensible. */
export const TAB_ALIAS: Record<string, string> = {
  home: "path", practice: "path", words: "path", word: "path", sentence: "path", links: "path", grammar: "path",
  settings: "profile", notes: "profile", note: "profile",
};

export const TAB_PATH: Record<TabId, string> = { path: "/path", stories: "/stories", lab: "/lab", friends: "/friends", profile: "/profile", people: "/owner" };
export const PATH_TAB: Record<string, TabId> = Object.fromEntries((Object.entries(TAB_PATH) as [TabId, string][]).map(([k, v]) => [v, k]));

const isTab = (t: string): t is TabId => (TABS as readonly string[]).includes(t);

/** What a path (or an old #hash) asks for: a tab, or a screen to open once the data is in. */
export interface Route {
  tab?: string | null;
  lesson?: string;
  story?: string;
  card?: string;
  unit?: string;
  onb?: boolean;
  kerim?: boolean;
  connect?: "yeni";
}

export function parseRoute(path: string, hash?: string): Route {
  const R: Route = {};
  const h = (hash || "").replace(/^#/, "");
  const hm = /^card=([A-Za-z0-9_.~-]+)$/.exec(h);
  if (hm) R.card = hm[1];
  else if (h === "onb") R.onb = true;
  else if (h === "kerim") R.kerim = true;
  else if (h && isTab(TAB_ALIAS[h] || h)) R.tab = TAB_ALIAS[h] || h;
  const m = /^\/(lesson|stories|card)\/([A-Za-z0-9_.~-]+)\/?$/.exec(path);
  if (m) {
    if (m[1] === "lesson") R.lesson = m[2];
    else if (m[1] === "stories") R.story = m[2];
    else R.card = m[2];
  } else if (/^\/unit\/(?:a1|a2|b1)_[1-6]\/?$/i.test(path)) R.unit = path.replace(/^\/unit\/|\/$/g, "").toUpperCase();
  else if (PATH_TAB[path.replace(/\/$/, "")]) R.tab = PATH_TAB[path.replace(/\/$/, "")];
  else if (path === "/onboarding") R.onb = true;
  else if (path === "/kerim") R.kerim = true;
  else if (path.replace(/\/$/, "") === "/connect/yeni") R.connect = "yeni";
  if ((R.lesson || R.story || R.card || R.onb || R.kerim || R.unit) && !R.tab) R.tab = R.story ? "stories" : R.lesson || R.unit ? "path" : null;
  return R;
}
