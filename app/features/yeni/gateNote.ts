// The note the sign-in gate shows on /connect/yeni (who is asking, and the way back to the reader). DOM only: this module
// is in the entry chunk.
import { el } from "../../core/dom.ts";
import { yeni } from "./api.ts";

/** On /connect/yeni the sign-in gate says who is asking and offers a way back to the reader. The gate takes a node, so this one is
 * plain DOM; a link that fails parseConnect says so here instead (the consent sheet repeats it after sign-in). */
export function gateNote(): HTMLElement {
  void import("./yeni.css");
  const txt = el("p", { class: "gate-ctx-t" }, el("b", { text: "Notebook wants to sync your notes." }), " Sign in or create a free account to continue.");
  const body = el("div", { class: "gate-ctx-b" }, txt);
  yeni.origins().then((o) => yeni.parseConnect(location.search, o)).then(
    (p) => { body.append(el("a", { class: "gate-ctx-back", href: p.ret + "#yk_error=denied&state=" + encodeURIComponent(p.state), text: "← Back to Notebook" })); },
    (e: { code?: string; message?: string } | null) => { if (e && (e.code === "bad_return" || e.code === "bad_link")) { txt.className = "gate-ctx-t acc-err"; txt.textContent = e.message || ""; } },
  );
  return el("div", { class: "gate-ctx", role: "note" }, el("span", { class: "yk-mark", "aria-hidden": "true", text: "Yİ" }), body);
}
