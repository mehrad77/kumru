// The stats pill melts into the app bar as the page scrolls: --melt is 0 while it sits in the page and 1 once it has flowed into the
// bar, --drip bumps at mid-way, and the level headings stick under it, only the newest showing. The numbers are CSS variables on the
// pill and on #p-path (path.css); this reads where things are on screen, so it is DOM code, run on scroll, resize and after each draw.
import { S } from "../../core/store.ts";

const PT_MELT_RANGE = 110;
let raf = 0, wired = false;

export function meltTick(): void {
  raf = 0;
  const pill = document.querySelector<HTMLElement>("#p-path .pt-top"), bar = document.querySelector<HTMLElement>(".appbar .inner");
  if (!pill || !bar || S.tab !== "path") return;
  const stick = parseFloat(getComputedStyle(pill).top) || 0, host = pill.parentElement!.getBoundingClientRect(), start = Math.max(0, host.top + scrollY - stick);
  const m = Math.max(0, Math.min(1, (scrollY - start) / PT_MELT_RANGE)), b = bar.getBoundingClientRect(), dy = stick - (b.top + b.height / 2 - pill.offsetHeight / 2);
  pill.style.setProperty("--melt", m.toFixed(3));
  pill.style.setProperty("--drip", Math.sin(m * Math.PI).toFixed(3));
  pill.style.setProperty("--dy", dy.toFixed(1));
  const chip = document.getElementById("userchip"), logo = document.querySelector(".appbar .logo"), tabs = document.getElementById("tabs");
  // the compact strip needs room between the header's left items and the avatar chip; with none it dissolves in place instead
  if (chip) {
    const cl = chip.getBoundingClientRect().left, tr = tabs && tabs.getBoundingClientRect(), lr = logo && logo.getBoundingClientRect();
    const left = tr && tr.top < b.bottom && tr.width ? tr.right : lr ? lr.right : 0, room = cl - left - 16, cw = Math.min(168, room);
    pill.style.setProperty("--mr", Math.max(0, host.right - cl + 10).toFixed(1));
    pill.style.setProperty("--cw", Math.max(0, cw).toFixed(1));
    pill.classList.toggle("fade", cw < 120);
  }
  document.getElementById("p-path")!.style.setProperty("--melt", m.toFixed(3));
  const hs = [...document.querySelectorAll<HTMLElement>("#p-path .pt-level")];
  const pinned = hs.filter((h) => scrollY > start && h.getBoundingClientRect().top <= parseFloat(getComputedStyle(h).top) + 0.5), last = pinned[pinned.length - 1];
  // only the newest pinned level shows; earlier ones hide behind it whatever their width
  for (const h of hs) { h.classList.toggle("stuck", h === last); h.classList.toggle("behind", pinned.includes(h) && h !== last); }
  pill.classList.toggle("melting", m > 0.02);
  pill.classList.toggle("melted", m > 0.6);
}

/** Once per frame at most. The scroll and resize listeners are added the first time. */
export function meltSoon(): void {
  if (!wired) {
    wired = true;
    addEventListener("scroll", meltSoon, { passive: true });
    addEventListener("resize", meltSoon, { passive: true });
  }
  if (!raf) raf = requestAnimationFrame(meltTick);
}
