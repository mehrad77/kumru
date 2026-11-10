// The version of the onboarding, alone in its module: open.ts (in the entry chunk) needs only this, and importing model/flow.ts
// there would carry the steps' table into the entry.

/** A learner who has done an older version is shown the "update" flow once. */
export const ONB_V = 4;
