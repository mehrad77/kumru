/* Globals the host and the app share: window.kumru (app/host/index.ts) and the dev build's switches. */
interface Window {
  kumru?: { host: import("./host/index.ts").Host; merge: { progress: typeof import("../shared/progress.ts").mergeProgress; tutor: typeof import("../shared/tutor.ts").mergeTutor } };
  __DEV?: boolean;
  __KUMRU_DEV__?: { learner: unknown; tree: [string, string[]][] };
}

/* Stylesheets are imported for their side effect (Vite bundles them). */
declare module "*.css";
