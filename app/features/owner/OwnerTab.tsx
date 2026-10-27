// The Owner tab (docs/SPECS.md section 10.4): the dashboard for the account with the owner role. Stats, the last backup,
// the words and lessons learners miss, and the learners table with a filter and Undelete. Its styles are app/ui/people.css and app/styles/components.css.
import "../../ui/people.css";
import "./owner.css";
import { signal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import type { AdminBackup, AdminStats, AdminUser, AdminWeak } from "../../../shared/api.ts";
import { toast } from "../../ui/toast.ts";
import { S, redrawTick, signals } from "../../core/store.ts";
import { owner } from "../../host/owner.ts";
import { Avatar } from "../../ui/avatar/Avatar.tsx";
import { bytesLabel, relTime } from "./format.ts";

const GH = "https://github.com/mehrad77/yakerim/blob/main/kumru-data/";

interface Dashboard { stats: AdminStats; weak: AdminWeak; backups: AdminBackup[]; users: AdminUser[] }

/** null: not loaded yet (or to be loaded again). */
const dashboard = signal<{ data: Dashboard } | { error: string } | null>(null);
let loading = false;

async function load(): Promise<void> {
  if (loading) return;
  loading = true;
  try {
    const [stats, weak, backups, users] = await Promise.all([owner.stats(), owner.weak(), owner.backups(), owner.users()]);
    dashboard.value = { data: { stats, weak, backups, users } };
  } catch (e) {
    dashboard.value = { error: (e as { message?: string })?.message || "Couldn't load the dashboard." };
  }
  loading = false;
}
const reload = () => { dashboard.value = null; };
const failure = (e: unknown, fallback: string) => (e as { message?: string })?.message || fallback;

/** A card that starts collapsed and expands on tap; it stays open across the dashboard's reloads. */
const openFolds = new Set<string>();
function Fold({ title, count, hint, children }: { title: string; count: string; hint?: string; children: preact.ComponentChildren }) {
  return (
    <details class="card fr-card ow-fold" open={openFolds.has(title)} onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) openFolds.add(title); else openFolds.delete(title); }}>
      <summary><h2>{title}</h2><span class="hint">{count}</span></summary>
      {hint ? <p class="hint">{hint}</p> : null}
      {children}
    </details>
  );
}

const Table = ({ head, children }: { head: string[]; children: preact.ComponentChildren }) => (
  <div class="pp-scroll"><table class="pp-table"><thead><tr>{head.map((h) => <th scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
);

const Tile = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div class="tile"><span class="lbl">{label}</span><b>{String(value)}</b>{sub ? <small class="hint">{sub}</small> : null}</div>
);

function UserRow({ u }: { u: AdminUser }) {
  const now = Date.now();
  const note = (u.nick && u.nick !== u.username ? u.nick + " · " : "") + (u.role !== "learner" ? u.role + " · " : "") + (u.plan !== "free" ? u.plan + " · " : "")
    + (u.deleted ? "deleted " + relTime(u.deleted, now) : u.tz || "");
  const undelete = async () => {
    try {
      await owner.undelete(u.id);
      toast("Restored " + u.username);
      reload();
    } catch (e) {
      toast(failure(e, "Failed"));
    }
  };
  return (
    <tr class={u.deleted ? "pp-deleted" : undefined}>
      <td><div class="pp-who"><Avatar char={u.char} size={36} cls="fr-av" label={u.nick || u.username} /><div><b>{u.username}</b><div class="hint">{note}</div></div></div></td>
      <td>{u.code || "–"}</td>
      <td>{u.lv ? u.lv + " · U" + u.unit : "–"}</td>
      <td>{u.xp != null ? String(u.xp) : "–"}</td>
      <td>{u.xpWeek != null && u.week ? String(u.xpWeek) : "–"}</td>
      <td>{u.streak != null ? String(u.streak) : "–"}</td>
      <td>{u.lastSave ? relTime(u.lastSave, now) : "never"}</td>
      <td>{relTime(u.created, now)}</td>
      <td>{u.progressBytes ? bytesLabel(u.progressBytes) + " · " + (u.saves || 0) + " saves" : "–"}</td>
      <td>{String(u.devices)}</td>
      <td>{u.followers + " / " + u.following}</td>
      <td>{String(u.classes)}</td>
      <td>{u.reminders ? "on" : "–"}</td>
      <td>{u.deleted ? <button class="btn sm" type="button" onClick={undelete}>Undelete</button> : null}</td>
    </tr>
  );
}

const LEARNER_HEAD = ["Learner", "Code", "Path", "XP", "This week", "Streak", "Last save", "Joined", "Progress", "Devices", "Followers / following", "Classes", "Reminder", ""];

/** The learners table: who they are, how far, how active, what they have set up; a filter by username prefix. */
function Learners({ initial }: { initial: AdminUser[] }) {
  const [users, setUsers] = useState(initial);
  const [count, setCount] = useState(initial.length + " learners, most recently active first");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setUsers(initial); setCount(initial.length + " learners, most recently active first"); }, [initial]);
  const onInput = (e: Event) => {
    const v = (e.currentTarget as HTMLInputElement).value.trim();
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (v.length === 1) return;
      try {
        const us = await owner.users(v);
        setUsers(us);
        setCount(us.length + (v ? " match" : " learners, most recently active first"));
      } catch (err) {
        setCount(failure(err, "Failed"));
      }
    }, 250);
  };
  return (
    <div>
      <div class="pp-bar">
        <input class="fr-in pp-filter" type="search" placeholder="Find a username (2+ letters)" aria-label="Find a learner" dir="ltr" onInput={onInput} />
        <span class="hint pp-count">{count}</span>
      </div>
      <Table head={LEARNER_HEAD}>{users.map((u) => <UserRow key={u.id} u={u} />)}</Table>
    </div>
  );
}

function Backup({ stats, backups }: { stats: AdminStats; backups: AdminBackup[] }) {
  const b = stats.backup;
  const old = !b || Date.now() - b.finished > 36 * 36e5;
  const [busy, setBusy] = useState(false);
  const backUp = async () => {
    setBusy(true);
    try {
      const r = await owner.backupNow();
      toast("Backed up " + r.date + ": " + r.rows + " rows");
      reload();
    } catch (e) {
      toast(failure(e, "Backup failed"));
      setBusy(false);
    }
  };
  return (
    <div class={"card fr-card ow-backup" + (old ? " bad" : "")}>
      <h2>Backup</h2>
      <p class={old ? "acc-danger" : "hint"}>
        {b ? "Last complete backup " + b.date + " · " + bytesLabel(b.bytes) + " · " + b.rows + " rows" + (old ? " · older than 36 hours" : "") : "No complete backup yet."}
      </p>
      <div class="acc-actions"><button class="btn sm primary" type="button" disabled={busy} onClick={backUp}>Back up now</button></div>
      {backups.length > 1 ? <p class="hint">{backups.length + " backups kept"}</p> : null}
    </div>
  );
}

function Loaded({ data }: { data: Dashboard }) {
  const { stats: s, weak: w, backups } = data;
  const plural = (n: number, one: string, many: string) => n + (n === 1 ? one : many);
  return (
    <div class="pp">
      <h1 class="fr-title">Owner</h1>
      <p class="hint">
        {"Version " + s.version + ". Request and database usage are in the "}
        <a href="https://dash.cloudflare.com/?to=/:account/workers/services/view/yakerim" target="_blank" rel="noopener">Cloudflare dashboard ↗</a>.
      </p>
      <div class="tiles">
        <Tile label="Learners" value={s.users.total} sub={s.users.signups7d + " new this week · " + s.users.deleted + " deleted"} />
        <Tile label="Active" value={s.active.d7} sub={"last 7 days · " + s.active.d30 + " in 30"} />
        <Tile label="Progress stored" value={bytesLabel(s.docs.bytes)} sub={s.docs.rows + " documents"} />
        <Tile label="Classes" value={s.classes.rows} sub={s.classes.members + " members · " + s.push.rows + " reminders"} />
      </div>
      <Backup stats={s} backups={backups} />
      <Fold title="Hardest words" count={plural(w.cards.length, " word", " words")} hint="Words many learners get wrong. Tap one to open its file and fix the card.">
        {w.cards.length ? (
          <Table head={["Word", "Learners", "Tries", "Wrong"]}>
            {w.cards.map((c) => {
              const k = S.cards.get(c.id);
              return <tr><td><a href={GH + "cards/" + c.id + ".json"} target="_blank" rel="noopener" lang="tr">{k ? k.tr : c.id}</a></td><td>{String(c.learners)}</td><td>{String(c.tries)}</td><td>{String(c.wrong)}</td></tr>;
            })}
          </Table>
        ) : <p class="hint">Nothing yet: summaries arrive as learners practise.</p>}
      </Fold>
      <Fold title="Lessons learners miss" count={plural(w.lessons.length, " lesson", " lessons")}>
        {w.lessons.length ? (
          <Table head={["Lesson", "Learners", "Tries", "Misses"]}>
            {w.lessons.map((c) => {
              const g = S.grammar.find((x: { id: string }) => x.id === c.id);
              return <tr><td><a href={GH + "grammar/" + c.id + ".json"} target="_blank" rel="noopener">{g ? g.title : c.id}</a></td><td>{String(c.learners)}</td><td>{String(c.tries)}</td><td>{String(c.misses)}</td></tr>;
            })}
          </Table>
        ) : <p class="hint">Nothing yet.</p>}
      </Fold>
      <div class="card fr-card"><h2>Learners</h2><Learners initial={data.users} /></div>
    </div>
  );
}

export function OwnerTab() {
  void redrawTick.value;   // a redraw refreshes the tab after it changes cards or lessons
  const canEdit = signals.canEdit.value;
  const d = dashboard.value;
  useEffect(() => { if (canEdit && !d) load(); }, [canEdit, d]);
  if (!canEdit) return null;
  if (!d) return <div class="empty">Loading the dashboard…</div>;
  if ("error" in d) {
    return <div class="empty"><b>Dashboard</b><p class="hint">{d.error}</p><button class="btn sm" type="button" onClick={reload}>Try again</button></div>;
  }
  return <Loaded data={d.data} />;
}
