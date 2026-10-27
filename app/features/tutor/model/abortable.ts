// A Stop button reacts at once, even if the request itself can't be cancelled. Pure.

/** `p`, or a rejection `{code: "cancelled"}` as soon as `sig` aborts. */
export const abortable = <T>(p: Promise<T>, sig?: AbortSignal): Promise<T> =>
  !sig ? p : Promise.race([p, new Promise<never>((_, rej) => {
    if (sig.aborted) rej({ code: "cancelled" });
    else sig.addEventListener("abort", () => rej({ code: "cancelled" }), { once: true });
  })]);
