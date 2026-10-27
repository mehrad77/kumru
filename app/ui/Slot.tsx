// Draws a slot's fills in order (core/slots.ts): the screen that owns the slot places this where the fills go.
import type { ComponentType } from "preact";
import { useEffect, useState } from "preact/hooks";
import { slot, type SlotName } from "../core/slots.ts";

export function Slot({ name }: { name: SlotName }) {
  const [parts, setParts] = useState<ComponentType[]>([]);
  useEffect(() => {
    let live = true;
    Promise.all(slot(name).map((f) => f.load())).then((cs) => { if (live) setParts(cs); }, (e) => console.warn("slot " + name + " failed to load", e));
    return () => { live = false; };
  }, [name]);
  return <>{parts.map((C) => <C />)}</>;
}
