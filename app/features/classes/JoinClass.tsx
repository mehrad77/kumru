// "Join a class": the code, and two opt-in switches (the teacher view; book progress from the reader) before joining.
import "./classes.css";
import { useState } from "preact/hooks";
import { S } from "../../core/store.ts";
import { closeSheet } from "../../ui/sheet.ts";
import { SetRow, Switch } from "../../ui/settings.tsx";
import { toast } from "../../ui/toast.ts";
import { accForm } from "../account/index.ts";
import { classesApi, clErr } from "./api.ts";
import { CL_BOOK_TEXT } from "./parts.tsx";
import { openClassBoard } from "./sheets.ts";
import { loadClasses } from "./state.ts";

function JoinShares({ onChange }: { onChange: (share: boolean, shareBook: boolean) => void }) {
  const [share, setShare] = useState(true), [book, setBook] = useState(false);
  return (
    <div class="cl-shares">
      <SetRow title="Teacher view" sub="Let the class owner see your place, streak and hardest words. You can change this later.">
        <Switch on={share} label="Share with the class owner" onChange={(v) => { setShare(v); onChange(v, book); }} />
      </SetRow>
      <SetRow title="Book progress" sub={CL_BOOK_TEXT + " Off unless you switch it on."}>
        <Switch on={book} label="Share book progress with the class owner" onChange={(v) => { setBook(v); onChange(share, v); }} />
      </SetRow>
    </div>
  );
}

export function openJoinForm(code: string): void {
  let share = true, shareBook = false;
  accForm("Join a class", [{ k: "code", label: "Class code (6 characters)" }], "Join", async (v) => {
    const c = await classesApi.join(v.code, share);
    // the join route only knows `share`; book sharing starts off and is switched on afterwards, only if asked for and only for a class that is new to the learner
    let joined = c;
    if (shareBook && !c.shareBook && c.owner !== S.me) { try { joined = await classesApi.setShare(c.id, { shareBook: true }); } catch (e) { toast(clErr(e)); } }
    closeSheet();
    toast("You joined " + c.name);
    await loadClasses();
    void openClassBoard(joined);
  }, { extra: <JoinShares onChange={(s, b) => { share = s; shareBook = b; }} />, values: { code: code || "" } });
}
