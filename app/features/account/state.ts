// The account feature's own state. Plain values (no Preact): the gate's reload poll reads them from the entry chunk.

/** The recovery code sheet is up: the gate's reload poll must not pull the page from under it. */
export const flags = { recoveryOpen: false };

/** Called after the password changes (the server also disconnects Notebook, so their count is 0). */
const passwordHooks: (() => void)[] = [];
export const onPasswordChanged = (fn: () => void): void => { passwordHooks.push(fn); };
export const passwordChanged = (): void => { for (const fn of passwordHooks) fn(); };
