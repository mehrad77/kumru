// `BuiltNode` shows a node a plain DOM function builds inside a Preact tree (the other direction is `mountIsland`, ui/mount.ts).
import { useEffect, useRef } from "preact/hooks";

/** A node built by a plain DOM function, shown inside a Preact tree; redrawn when `render` changes. With `contents` the wrapper
 * takes no box of its own (`display: contents`), so the node lays out as a child of the Preact parent. */
export function BuiltNode({ render: build, contents }: { render: () => Node | null; contents?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const n = build(); ref.current?.replaceChildren(...(n ? [n] : [])); }, [build]);
  return <div ref={ref} style={contents ? "display:contents" : undefined} />;
}
