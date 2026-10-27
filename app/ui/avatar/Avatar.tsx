// A character as a Preact component: the learner's own (`char`, a Sahne portrait or the old parts) or a cast member's (`cast`).
// The drawing is a DOM node from portrait.ts, so the component only hosts it and redraws when its props change.
import { useLayoutEffect, useRef } from "preact/hooks";
import { avatarPortrait, chAvatar } from "./portrait.ts";

interface Props { size: number; cls?: string; label?: string; char?: unknown; cast?: string }

export function Avatar({ char, cast, size, cls = "", label = "" }: Props) {
  const host = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    host.current?.replaceChildren(cast ? chAvatar(cast, size, cls, null, label || null) : avatarPortrait(char ?? null, size, cls, label));
  }, [char, cast, size, cls, label]);
  return <span ref={host} style="display:contents" />;
}
