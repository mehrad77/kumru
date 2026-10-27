#!/usr/bin/env python3
"""Validate Kumru's course content (data/) against its schemas and cross-references.

    uv run scripts/kumru_data.py --check     # exit 1 on any error

Every file under data/<collection>/ is one document. --check validates
each card, grammar lesson and path section against
shared/schema/<collection>.json (a small JSON-schema subset: type,
enum, pattern, minLength, minimum, minItems, required, properties,
additionalProperties, items) and then the references between collections
(docs/SPECS_SCHEMA.md section 4.1):

- every path skill's and story's `lessons[]` id exists in grammar;
- every path skill's `words[]` and `sentences[]` id, and every story's `words[]`
  id, exists in cards or cards-extra (the stories' only on the real data: on
  data-sample/, which scripts/data.mjs copies when there is no private data,
  the public stories name cards and lessons the sample does not have);
- a card id is in only one of cards/ and cards-extra/;
- every story's `cast[]` and `extras[]` id exists in characters, and its `place`
  in places;
- no path skill reuses an id from path/retired.json, and skill ids are unique.

Stories, characters and places have no schema here: their one schema source is
sahne-story/schema/ in the Sahne submodule, run by the story check
(node sahne/packages/sahne-story/stories.ts --check). The deeper rules of the tree
and of the lessons are the course repo's generators' --check. Stdlib only.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from kumru_paths import DATA, SCHEMA  # noqa: E402
COLLECTIONS = ("cards", "grammar", "path")  # with a schema in shared/schema/; stories, characters and places: the story check
TYPES = {"string": str, "integer": int, "number": (int, float), "boolean": bool, "array": list, "object": dict,
         "null": type(None)}


def is_type(v, t: str) -> bool:
    if t in ("integer", "number") and isinstance(v, bool):
        return False
    return isinstance(v, TYPES[t])


def validate(v, s: dict, where: str, out: list[str]) -> None:
    if "type" in s:
        ts = s["type"] if isinstance(s["type"], list) else [s["type"]]
        if not any(is_type(v, t) for t in ts):
            out.append(f"{where}: expected {'/'.join(ts)}")
            return
    if "enum" in s and v not in s["enum"]:
        out.append(f"{where}: {v!r} is not one of {s['enum']}")
    if isinstance(v, str):
        if "minLength" in s and len(v) < s["minLength"]:
            out.append(f"{where}: empty")
        if "pattern" in s and not re.search(s["pattern"], v):
            out.append(f"{where}: {v!r} does not match {s['pattern']}")
    if isinstance(v, (int, float)) and not isinstance(v, bool) and "minimum" in s and v < s["minimum"]:
        out.append(f"{where}: below {s['minimum']}")
    if isinstance(v, list):
        if "minItems" in s and len(v) < s["minItems"]:
            out.append(f"{where}: fewer than {s['minItems']} items")
        if "items" in s:
            for i, x in enumerate(v):
                validate(x, s["items"], f"{where}[{i}]", out)
    if isinstance(v, dict):
        for k in s.get("required", []):
            if k not in v:
                out.append(f"{where}: missing {k}")
        props = s.get("properties", {})
        for k, x in v.items():
            if k in props:
                validate(x, props[k], f"{where}.{k}", out)
            elif s.get("additionalProperties") is False:
                out.append(f"{where}: unexpected field {k}")


def load(sub: str, pattern: str = "*.json") -> dict[str, dict]:
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in sorted((DATA / sub).glob(pattern))}


def collections() -> dict[str, dict[str, dict]]:
    return {
        "cards": load("cards"), "cards-extra": load("cards-extra"), "grammar": load("grammar"),
        "path": load("path", "s[0-9][0-9].json"), "stories": load("stories"), "characters": load("characters"),
        "places": load("places"),
    }


def check() -> int:
    errors: list[str] = []
    data = collections()
    for name in COLLECTIONS:
        schema = json.loads((SCHEMA / f"{name}.json").read_text(encoding="utf-8"))
        subs = ("cards", "cards-extra") if name == "cards" else (name,)
        for sub in subs:
            for doc_id, doc in data[sub].items():
                validate(doc, schema, f"{sub}/{doc_id}", errors)

    def err(where: str, msg: str):
        errors.append(f"{where}: {msg}")

    for i in sorted(set(data["cards"]) & set(data["cards-extra"])):
        err(f"cards/{i}", "also in cards-extra")
    cards = set(data["cards"]) | set(data["cards-extra"])
    lessons, chars, places = set(data["grammar"]), set(data["characters"]), set(data["places"])
    # The stories are public and name the private cards and lessons; on data-sample/ those references cannot resolve.
    real = (DATA / "cards").is_symlink()
    for doc_id, d in data["stories"].items():
        where = f"stories/{doc_id}"
        for g in (d.get("lessons") or []) if real else []:
            if g not in lessons:
                err(where, f"lesson {g} does not exist")
        for c in (d.get("words") or []) if real else []:
            if c not in cards:
                err(where, f"card {c} does not exist")
        for c in (d.get("cast") or []) + (d.get("extras") or []):
            if c not in chars:
                err(where, f"{c} is not a character")
        if d.get("place") and d["place"] not in places:
            err(where, f"place {d['place']} does not exist")
    retired_path = DATA / "path" / "retired.json"
    retired = set(json.loads(retired_path.read_text(encoding="utf-8"))) if retired_path.exists() else set()
    skills: set[str] = set()
    for sec_id, sec in data["path"].items():
        for sk in sec.get("skills") or []:
            where = f"path/{sec_id}/{sk.get('id')}"
            if sk.get("id") in skills:
                err(where, "skill id used twice")
            if sk.get("id") in retired:
                err(where, "skill id is retired")
            skills.add(sk.get("id"))
            for g in sk.get("lessons") or []:
                if g not in lessons:
                    err(where, f"lesson {g} does not exist")
            for c in (sk.get("words") or []) + (sk.get("sentences") or []):
                if c not in cards:
                    err(where, f"card {c} does not exist")
    for e in errors:
        print(e)
    counts = ", ".join(f"{len(data[c])} {c}" for c in data)
    note = "" if real else " (sample data: the stories' cards and lessons not checked)"
    print(f"{counts}: {len(errors)} errors{note}")
    return 1 if errors else 0


def main(argv: list[str]) -> int:
    if argv and argv[0] not in ("--check",):
        print(__doc__)
        return 2
    return check()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
