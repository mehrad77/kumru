// A signed-in learner's next page load says hello: signing in reloads the page, which would swallow a toast, so the message
// waits in sessionStorage (`kumru:welcome`) and boot shows it once.
const KEY = "kumru:welcome";

export function welcomeNext(msg: string): void {
  try { sessionStorage.setItem(KEY, msg); } catch { /* blocked */ }
}

export function takeWelcome(): string | null {
  try {
    const m = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return m;
  } catch { return null; }
}
