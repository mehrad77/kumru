// Small pieces Notebook sheets share.
import { closeSheet } from "../../ui/sheet.ts";
import { accErr } from "../account/index.ts";

/** A loading row: a spinner and what is loading. */
export const Loading = ({ text }: { text: string }) => (
  <div class="acc-loading" role="status"><span class="spin" aria-hidden="true" /><span>{text}</span></div>
);

/** A sheet whose data did not load: the reason and a way to try again, inside the sheet. */
export const SheetError = ({ error, retry }: { error: unknown; retry: () => void }) => (
  <>
    <p class="acc-err" role="alert">{accErr(error)}</p>
    <button class="btn primary block" type="button" onClick={retry}>Try again</button>
    <button class="btn block" type="button" onClick={closeSheet}>Close</button>
  </>
);
