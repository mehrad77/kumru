// Kerim the kumru as a Preact element (the drawing is ui/kerim/kerim.ts's `pup`), and her speech bubble.
import { useMemo } from "preact/hooks";
import { BuiltNode } from "./island.tsx";
import { pup, type PupOptions } from "./kerim/kerim.ts";

export function Pup({ mood, size, enter, pose, talk }: { mood: string; size?: number; enter?: boolean; pose?: PupOptions["pose"]; talk?: number | true }) {
  const render = useMemo(() => {
    const o: PupOptions = {};
    if (enter !== undefined) o.enter = enter;
    if (pose) o.pose = pose;
    if (talk) o.talk = talk;
    const node = pup(mood, size, o);
    return () => node;
  }, [mood, size, enter, pose, talk]);
  return <BuiltNode render={render} contents />;
}

