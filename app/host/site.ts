// The site's public address. Kumru moved from turk.shab.boo to kumru.shab.boo (2026-11-11): both serve the same Worker, API
// and accounts. A learner signed in on the old address keeps using it (their device's storage lives there); a newcomer there
// is sent to the new one before the app starts (index.html's first script). Links people share always name the new address,
// so they bring new learners straight there. Elsewhere (localhost, a preview) links keep the page's own origin.
export const NEW_SITE = "https://kumru.shab.boo";
const OUR_HOSTS = ["turk.shab.boo", "kumru.shab.boo"];

/** The origin a shared link (a profile, a class, pairing a device) names. */
export const shareOrigin = (): string => (OUR_HOSTS.includes(location.hostname) ? NEW_SITE : location.origin);
