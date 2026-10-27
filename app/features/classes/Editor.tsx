// The class editor: name, description, when it meets, an icon and a colour (used to start a class and to edit one), and for an
// existing class the danger zone that deletes it.
import "./classes.css";
import { useEffect, useRef, useState } from "preact/hooks";
import type { Class, ClassColor, ClassIcon, ClassStyle } from "../../../shared/api.ts";
import { CLASS_COLORS, CLASS_ICONS } from "../../../shared/api.ts";
import { bidiTxt } from "../../core/i18n.ts";
import { Icon } from "../../ui/Icon.tsx";
import { closeSheet } from "../../ui/sheet.ts";
import { toast } from "../../ui/toast.ts";
import { classesApi, clErr } from "./api.ts";
import { Badge } from "./parts.tsx";
import { closePage } from "./page.ts";
import { confirmClass, openClassBoard } from "./sheets.ts";
import { loadClasses } from "./state.ts";

function ClassEditor({ c, submit, action, focus = "input" }: { c: Partial<Class> | null; submit: string; action: (v: ClassStyle) => Promise<void>; focus?: "input" | "textarea" }) {
  const [icon, setIcon] = useState<ClassIcon>(CLASS_ICONS.includes(c?.icon as ClassIcon) ? (c!.icon as ClassIcon) : "book");
  const [color, setColor] = useState<ClassColor>(CLASS_COLORS.includes(c?.color as ClassColor) ? (c!.color as ClassColor) : "sage");
  const [name, setName] = useState(c?.name || "");
  const [desc, setDesc] = useState(c?.description || "");
  const [sched, setSched] = useState(c?.schedule || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(() => { const i = form.current?.querySelector(focus); if (i && !form.current!.contains(document.activeElement)) i.focus(); }, 50);
    return () => clearTimeout(t);
  }, []);
  const onSubmit = async (e: Event) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try { await action({ name: name.trim(), description: desc.trim(), schedule: sched.trim(), icon, color }); }
    catch (x) { setErr(clErr(x)); }
    finally { setBusy(false); }
  };
  return (
    <form ref={form} class="acc-form" onSubmit={onSubmit}>
      <div class="cl-prev"><Badge c={{ icon, color }} big /><b>{bidiTxt(name.trim() || "Your class")}</b></div>
      <label>Class name (up to 40 characters)<input type="text" maxLength={40} autocomplete="off" value={name} required onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} /></label>
      <label>Description (optional)<textarea rows={3} maxLength={280} placeholder="What the class is about, who it's for" value={desc} onInput={(e) => setDesc((e.currentTarget as HTMLTextAreaElement).value)} /></label>
      <label>When it meets (optional)<input type="text" maxLength={60} autocomplete="off" placeholder="e.g. Tuesdays 18:00" value={sched} onInput={(e) => setSched((e.currentTarget as HTMLInputElement).value)} /></label>
      <span class="lbl">Icon</span>
      <div class="cl-pick" role="group" aria-label="Icon">
        {CLASS_ICONS.map((k) => <button type="button" aria-label={k} aria-pressed={icon === k} class={"cl-opt cc-" + color} onClick={() => setIcon(k)}><Icon name={k} /></button>)}
      </div>
      <span class="lbl">Colour</span>
      <div class="cl-pick" role="group" aria-label="Colour">
        {CLASS_COLORS.map((k) => <button type="button" aria-label={k} aria-pressed={color === k} class={"cl-sw cc-" + k} onClick={() => setColor(k)} />)}
      </div>
      <p class="acc-err" role="alert">{err}</p>
      <button class="btn primary block" type="submit" disabled={busy}>{submit}</button>
    </form>
  );
}

/** "Start a class". */
export function CreateClass() {
  return <ClassEditor c={null} submit="Create class" action={async (v) => { const c = await classesApi.create(v.name || "", v); closeSheet(); await loadClasses(); void openClassBoard(c); }} />;
}

/** "Manage class": the editor, then the danger zone. */
export function EditClass({ c, focus }: { c: Class; focus?: "description" }) {
  const n = c.members || 1;
  const who = n === 1 ? "its only member" : "all " + n + " members";
  return (
    <>
      <ClassEditor c={c} submit="Save" focus={focus === "description" ? "textarea" : "input"} action={async (v) => { const u = await classesApi.update(c.id, v); closeSheet(); await loadClasses(); void openClassBoard({ ...c, ...u }); }} />
      <div class="cl-danger">
        <span class="lbl">Danger zone</span>
        <p class="hint">{"Deleting a class removes it for " + who + ": the board and the memberships. Nobody's own progress is touched."}</p>
        <button class="btn bad block" type="button" onClick={() => confirmClass({
          title: "Delete " + c.name + "?", body: "This permanently deletes the class for " + who + ". It can't be undone.", label: "Delete class", type: c.name,
          action: async () => { await classesApi.remove(c.id); closePage(); void loadClasses(); toast("Deleted " + c.name); },
        })}>Delete this class…</button>
      </div>
    </>
  );
}
