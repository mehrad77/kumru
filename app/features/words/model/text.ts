// Turkish lower-casing as the cards and the glosses key their words. Pure.
export const trLow = (s: unknown): string => String(s || "").toLocaleLowerCase("tr");
