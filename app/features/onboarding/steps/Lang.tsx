// The first step of a new learner: the help language (Profile → Language, app/core/lang.ts). It also sets the language the rest of
// the flow speaks (model/words.ts). The help language is saved when the learner goes on.
import { setPref } from "../../profile/prefs.ts";
import { Pup } from "../../../ui/Pup.tsx";
import { Nav, StepView, useFlow } from "../Flow.tsx";
import type { UiLang } from "../model/words.ts";

const LANGS: [UiLang, string][] = [["en", "English"], ["fa", "فارسی"], ["ru", "Русский"]];

export function LangStep() {
  const { O, t, setLang, go } = useFlow();
  const ok = () => { setPref("lang", O.lang); go(); };
  return (
    <StepView dots foot={<Nav onClick={ok} />}>
      <Pup mood="greet" size={130} pose="hero" />
      <h1 lang="tr">Hoş geldin!</h1>
      <p>{t("langAsk")}</p>
      <div class="onb-opts" role="radiogroup">
        {LANGS.map(([v, label]) => (
          <button class={"onb-opt onb-lang" + (O.lang === v ? " on" : "")} type="button" role="radio" aria-checked={O.lang === v} lang={v} dir={v === "fa" ? "rtl" : "ltr"} onClick={() => setLang(v)}>{label}</button>
        ))}
      </div>
      <p class="hint">{t("langNote")}</p>
    </StepView>
  );
}
