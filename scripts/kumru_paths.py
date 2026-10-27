"""Where things live in the Kumru repo; the Python scripts take their paths from here.

`uv run scripts/<script>.py` puts scripts/ on sys.path, so a script imports these with
`from kumru_paths import ROOT, DATA, ...`.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"                       # the content; the five private folders are linked in by scripts/data.mjs
SCHEMA = ROOT / "shared" / "schema"        # the schemas of the cards, the grammar lessons and the path
BRAND = ROOT / "brand"
SAHNE = ROOT / "sahne" / "packages"        # the Sahne submodule: sahne, sahne-kit, sahne-tr, sahne-story, sahne-gallery
