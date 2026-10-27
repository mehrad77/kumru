// A segmented control (`.seg`): a radio group of buttons, the one whose value is `cur` pressed. Used by the Profile cards and the
// onboarding steps.
import { bidiTxt } from "../core/i18n.ts";

export function Seg<T extends string | number>({ cur, opts, onPick, disabled }: { cur: T; opts: [T, string][]; onPick: (v: T) => void; disabled?: (v: T) => boolean }) {
  return (
    <div class="seg set-seg" role="radiogroup">
      {opts.map(([v, t]) => (
        <button type="button" role="radio" aria-checked={cur === v} aria-pressed={cur === v} disabled={disabled ? disabled(v) : undefined} onClick={() => onPick(v)}>{bidiTxt(t)}</button>
      ))}
    </div>
  );
}
