// A story's thumbnail: its opening scene (data/thumbs, sahne/packages/sahne-gallery/thumbs.mjs), or a plain paper tile until it loads.
import { thumbUrl } from "./state.ts";

export function Thumb({ id, cls = "", eager = false }: { id: string; cls?: string; eager?: boolean }) {
  const src = thumbUrl(id);
  return (
    <span class={"st-th " + cls} aria-hidden="true">
      {src ? <img src={src} alt="" width={480} height={300} loading={eager ? "eager" : "lazy"} decoding="async" /> : null}
    </span>
  );
}
