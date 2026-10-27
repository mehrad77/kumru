// The small pieces the Classes screens share: a class's badge, and its two switches (teacher view, book progress).
import type { Class, ClassColor, ClassIcon } from "../../../shared/api.ts";
import type { IconName } from "../../core/dom.ts";
import { Icon } from "../../ui/Icon.tsx";
import { SetRow, Switch } from "../../ui/settings.tsx";
import { toast } from "../../ui/toast.ts";
import { CLASS_ICONS } from "../../../shared/api.ts";
import { classesApi, clErr } from "./api.ts";
import { classList, putClass } from "./state.ts";
import { S } from "../../core/store.ts";

export const CL_BOOK_TEXT = "Let the class owner see my book progress from Notebook: units done, pages read and exercise scores. Never what I write.";
export const TEACHER_TEXT = "Let the class owner see your place, streak and hardest words. Nothing else.";

/** The class's icon on its colour. */
export function Badge({ c, big }: { c: { icon?: ClassIcon; color?: ClassColor }; big?: boolean }) {
  const icon = (CLASS_ICONS as readonly string[]).includes(c.icon || "") ? c.icon : "book";
  return <span class={"cl-badge cc-" + (c.color || "sage") + (big ? " cl-badge-lg" : "")} aria-hidden="true"><Icon name={icon as IconName} /></span>;
}

/** The two opt-in switches of a class: the teacher view (place, streak, hardest words) and, separately, book progress from the reader. */
export function Shares({ c }: { c: Class }) {
  const cur = (classList.value || []).find((x) => x.id === c.id) || c;
  const mine = cur.owner === S.me;
  const set = async (fields: { share?: boolean; shareBook?: boolean }) => {
    try { putClass(await classesApi.setShare(cur.id, fields)); }
    catch (e) { toast(clErr(e)); }
  };
  return (
    <div class="cl-shares">
      <SetRow title="Teacher view" sub={mine ? "You own this class, so you always share." : TEACHER_TEXT}>
        {mine ? <span class="pchip ok">On</span> : <Switch on={cur.share} label="Share with the class owner" onChange={(v) => void set({ share: v })} />}
      </SetRow>
      {mine ? null : (
        <SetRow title="Book progress" sub={CL_BOOK_TEXT}>
          <Switch on={cur.shareBook} label="Share book progress with the class owner" onChange={(v) => void set({ shareBook: v })} />
        </SetRow>
      )}
    </div>
  );
}
