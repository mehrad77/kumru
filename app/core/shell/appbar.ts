// The app bar and the status line: what is on screen whichever tab is showing. The tab bar is core/router.ts's.
import { avatarPortrait } from "../../ui/avatar/portrait.ts";
import { pup } from "../../ui/kerim/kerim.ts";
import { $, el } from "../dom.ts";
import { setTab } from "../router.ts";
import { S } from "../store.ts";

/** The signed-in learner's chip at the right of the bar: their character and name, or "Add your name". */
export function renderUser(): void {
  const box = $("#userchip");
  const name: string = S.nick || S.profileName || "";
  const av = S.char || !S.avatar || S.nick ? avatarPortrait(S.char, name ? 44 : 36, "ring", "") : el("img", { class: "av", src: S.avatar, alt: "" });
  box.replaceChildren(el("button", { class: "uchip" + (name ? "" : " ask"), type: "button", title: "Your profile", "aria-label": (name || "Your") + " profile", onclick: () => setTab("profile") },
    av, el("span", { class: "un", text: name || "Add your name" })));
}

/** A line under the bar for what needs the learner's attention (a lost connection); empty hides it. */
export function status(msg?: string): void {
  const s = $("#status");
  s.replaceChildren(...(msg ? [pup(/^Lost/.test(msg) ? "sad" : "idle", 40, { enter: false }), el("span", { text: msg })] : []));
  s.hidden = !msg;
}
