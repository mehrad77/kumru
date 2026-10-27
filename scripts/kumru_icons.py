#!/usr/bin/env python3
"""Write the Kumru brand files in brand/ from Kerim's head in the Sahne kit.

    uv run scripts/kumru_icons.py            # write icon.svg, the PNGs and manifest.webmanifest
    uv run scripts/kumru_icons.py --check    # exit 1 if icon.svg or the manifest differ from a fresh build

The single source is sahne/packages/sahne-kit/src/kerim/art.ts in the Sahne submodule: K_HEAD (the head group), K_BUST (the neck behind it in the crop)
and K_HEAD_VB (the crop viewBox). Change them there, then run this script, so the icon can't drift from the
mascot. icon.svg is 512 square: a full-bleed cream background with the head inside the maskable safe zone
(the central circle of 80%), so it works as both `any` and `maskable`.

PNGs (icon-192, icon-512, apple-touch-icon-180) are rendered with macOS `qlmanage -t`, falling back to headless
Chrome. scripts/vite/page.ts reads data_uri() (--head-tags) for the page's inline favicon. Stdlib only.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
from pathlib import Path

from kumru_paths import BRAND, ROOT, SAHNE  # noqa: E402
SRC = SAHNE / "sahne-kit" / "src" / "kerim" / "art.ts"
THEME_LIGHT = "#FFF8EC"  # --bg, light
THEME_DARK = "#191A12"   # --bg, dark
PNGS = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon-180.png": 180}
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def const(name: str) -> str:
    """The value of `const NAME=`…`;` or `const NAME="…";` in sahne/packages/sahne-kit/src/kerim/art.ts (no ${} interpolation allowed)."""
    src = SRC.read_text(encoding="utf-8")
    m = re.search(rf"\bconst {name}=(`([^`]*)`|\"([^\"]*)\");", src)
    if not m:
        sys.exit(f"{name} not found in {SRC.relative_to(ROOT)}")
    val = m.group(2) if m.group(2) is not None else m.group(3)
    if "${" in val:
        sys.exit(f"{name} must be a plain literal for {Path(__file__).name}")
    return val


def head() -> tuple[str, str]:
    """(viewBox, markup) of the cropped head, as the page's KERIM_HEAD draws it."""
    return const("K_HEAD_VB"), const("K_BUST") + const("K_HEAD").replace("\n", "")


def favicon_svg() -> str:
    vb, art = head()
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{art}</svg>'


def data_uri() -> str:
    return "data:image/svg+xml," + urllib.parse.quote(favicon_svg(), safe=" /:=;,.-()'")


def icon_svg() -> str:
    """512 square: cream background, a soft sand disc, the bust rising from the bottom edge, head in the safe zone."""
    vb, art = head()
    w = 340
    x, y = (512 - w) // 2, 512 - w
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">\n'
            f'<rect width="512" height="512" fill="{THEME_LIGHT}"/>\n'
            f'<circle cx="256" cy="262" r="196" fill="#F2E6D0"/>\n'
            f'<svg x="{x}" y="{y}" width="{w}" height="{w}" viewBox="{vb}">{art}</svg>\n'
            f'</svg>\n')


def manifest() -> str:
    icons = [{"src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable"}]
    icons += [{"src": n, "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any maskable"}
              for n, s in PNGS.items() if n.startswith("icon-")]
    return json.dumps({"name": "Kumru · Turkish Notebook", "short_name": "Kumru", "display": "standalone",
                       "start_url": "/", "scope": "/", "id": "/", "background_color": THEME_LIGHT, "theme_color": THEME_LIGHT,
                       "icons": icons}, ensure_ascii=False, indent=2) + "\n"


def render_png(svg: Path, out: Path, size: int) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        r = subprocess.run(["qlmanage", "-t", "-s", str(size), "-o", tmp, str(svg)], capture_output=True, text=True)
        got = Path(tmp) / (svg.name + ".png")
        if r.returncode == 0 and got.exists():
            shutil.move(str(got), out)
        elif Path(CHROME).exists():
            page = Path(tmp) / "icon.html"
            page.write_text(f'<html><body style="margin:0"><img src="{svg.as_uri()}" width="{size}" height="{size}"></body></html>')
            subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars", f"--window-size={size},{size}",
                            f"--screenshot={out}", page.as_uri()], capture_output=True, check=True)
        else:
            sys.exit("neither qlmanage nor Chrome could render the PNGs")
    # qlmanage keeps the aspect ratio of the svg; make sure the size is exact
    subprocess.run(["sips", "-z", str(size), str(size), str(out)], capture_output=True)


def main(argv: list[str]) -> int:
    if "--head-tags" in argv:   # the page's favicon and theme colours, read by scripts/vite/page.ts
        print(json.dumps({"icon": data_uri(), "light": THEME_LIGHT, "dark": THEME_DARK}))
        return 0
    want = {"icon.svg": icon_svg(), "manifest.webmanifest": manifest()}
    if "--check" in argv:
        stale = [n for n, t in want.items() if not (BRAND / n).exists() or (BRAND / n).read_text(encoding="utf-8") != t]
        stale += [n for n in PNGS if not (BRAND / n).exists()]
        if stale:
            print("brand is stale (" + ", ".join(stale) + "): run uv run scripts/kumru_icons.py", file=sys.stderr)
            return 1
        print("brand is up to date")
        return 0
    BRAND.mkdir(exist_ok=True)
    for n, t in want.items():
        (BRAND / n).write_text(t, encoding="utf-8")
    for n, s in PNGS.items():
        render_png(BRAND / "icon.svg", BRAND / n, s)
    for p in sorted(BRAND.iterdir()):
        print(f"{p.relative_to(ROOT)}  {p.stat().st_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
