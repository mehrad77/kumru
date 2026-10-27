// The Lab's art: the bench scene (a shelf of letter jars, a bubbling pot on a flame, a flask) and the goggles and lab-coat
// collar drawn into Kerim's own art so they follow her head. Colours are fixed like the cast's (they are not themed).
import { pup } from "../../ui/kerim/kerim.ts";

const LETTERS = ["ç","ğ","ı","ö","ş","ü"],JARS=["#E98FA6","#9BD36A","#F2C14E","#7FC4E8","#C7A6E8","#F59E6C"];
export const LAB_SCENE=`<svg class="lab-scene" viewBox="0 0 400 220" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="220" fill="#F4ECDD"/><rect y="96" width="400" height="56" fill="#DCEBE4"/>
  <g stroke="#C5DACF" stroke-width="1.2">${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].map(i=>`<path d="M${i*25} 96V152"/>`).join("")}<path d="M0 110H400M0 124H400M0 138H400"/></g>
  <g class="lab-sign"><path d="M34 8V16M104 8V16" stroke="#8C6A3C" stroke-width="1.5"/><rect x="14" y="14" width="110" height="24" rx="4" fill="#8C5634"/><rect x="17" y="17" width="104" height="18" rx="2.5" fill="#2F5D4A"/>
   <text x="69" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="9.6" font-weight="700" fill="#F4F4F4" letter-spacing=".5">KERİM'İN LAB'I</text></g>
  <rect x="184" y="64" width="206" height="5" rx="2" fill="#B98D52"/><path d="M194 69v8M380 69v8" stroke="#8C6A3C" stroke-width="3" stroke-linecap="round"/>
  ${LETTERS.map((l,i)=>`<g transform="translate(${192+i*33} 38)"><rect x="9" y="0" width="8" height="4" rx="1" fill="#8C6A3C"/><rect x="2" y="4" width="22" height="22" rx="5" fill="#FFFDF7" stroke="#CDBBA3" stroke-width="1.2"/><rect x="4" y="13" width="18" height="11" rx="3.5" fill="${JARS[i]}" opacity=".85"/><text x="13" y="21.4" text-anchor="middle" font-family="Georgia,serif" font-size="9.5" font-weight="700" fill="#fff">${l}</text></g>`).join("")}
  <rect y="150" width="400" height="70" fill="#B98D52"/><rect y="150" width="400" height="6" fill="#D4A96A"/><rect y="156" width="400" height="64" fill="#9A6F3C"/><g stroke="#82592F" stroke-width="1.5"><path d="M0 188H400M130 156V220M270 156V220"/></g>
  <ellipse cx="285" cy="112" rx="70" ry="44" fill="#BDEB8F" opacity=".28" class="lab-glow"/>
  <g class="lab-spoon"><path d="M288 104L322 50" stroke="#B98D52" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="286" cy="108" rx="5.5" ry="3.2" fill="#B98D52" transform="rotate(-30 286 108)"/></g>
  <g class="lab-steam" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"><path d="M268 96c-5-7 5-11 0-18"/><path d="M286 94c-5-7 5-11 0-18"/><path d="M304 96c-5-7 5-11 0-18"/></g>
  ${[[262,"ç",0],[280,"ğ",.7],[298,"ı",1.4],[272,"ö",2.1],[290,"ş",2.8],[306,"ü",3.5]].map(([x,l,d])=>`<g transform="translate(${x} 96)"><g class="lb" style="animation-delay:-${d}s"><circle r="7.2" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width="1.2"/><text y="3.4" text-anchor="middle" font-family="Georgia,serif" font-size="9.5" font-weight="700" fill="#2F6B6B">${l}</text></g></g>`).join("")}
  <path d="M242 98H328V126Q328 138 316 138H254Q242 138 242 126Z" fill="#2F6B6B"/><path d="M242 98H328V104H242Z" fill="#3E8585"/><ellipse cx="285" cy="98" rx="43" ry="6" fill="#3E8585"/><ellipse cx="285" cy="98.6" rx="38" ry="4.4" fill="#9BD36A"/>
  <rect x="233" y="105" width="11" height="5" rx="2.5" fill="#245555"/><rect x="326" y="105" width="11" height="5" rx="2.5" fill="#245555"/>
  <text x="285" y="124" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" fill="#F4ECDD" letter-spacing="1.5">DENEY</text>
  <rect x="256" y="138" width="58" height="12" rx="3" fill="#4B4B55"/><g class="lab-flame"><path d="M266 138q-3-6 1-11 1 4 4 5 1-6 5-9 0 6 5 8 3-3 3-7 4 5 4 14Z" fill="#F59E6C"/><path d="M272 138q-1-4 2-7 1 3 3 3 1-3 3-5 0 4 2 5 1 2 1 4Z" fill="#FFE08A"/></g>
  <g><path d="M356 150L346 150L358 124V108H372V124L384 150Z" fill="#FFFDF7" fill-opacity=".7" stroke="#B9C8CF" stroke-width="1.6" stroke-linejoin="round"/><path d="M351 146L358 130H372L379 146Z" fill="#E98FA6" opacity=".9"/><circle class="lab-fb" cx="364" cy="136" r="2" fill="#fff" opacity=".8"/><circle class="lab-fb b2" cx="368" cy="140" r="1.5" fill="#fff" opacity=".8"/></g>
</svg>`;
/* the goggles on Kerim's forehead and a white lab-coat collar, drawn into her own art so they follow her head */
const GOGGLES=`<g class="k-gog"><path d="M42.6 26C45.6 19 53 15.2 61 15.2C69.4 15.2 75.4 18.6 78.2 23.6" fill="none" stroke="#2B3A44" stroke-width="2.6" stroke-linecap="round"/><circle cx="53.6" cy="20.8" r="4.8" fill="#9ADCF0" fill-opacity=".7" stroke="#B8863B" stroke-width="2.6"/><ellipse cx="70.4" cy="20" rx="3.4" ry="4.4" fill="#9ADCF0" fill-opacity=".7" stroke="#B8863B" stroke-width="2.6"/><path d="M51.2 19.2a2.8 2.8 0 0 1 2.2-1.4M68.8 18.6a2 2.4 0 0 1 1.6-1.3" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/></g>`;
const COLLAR=`<g class="k-coat"><path d="M47.5 46Q58 57.5 73.5 46.5L76 53Q60 64 45.5 53Z" fill="#fff" stroke="#CFC8BC"/><path d="M57.6 55L55.4 61.6M66.2 54.8L68.4 61.4" stroke="#CFC8BC" stroke-width="1.1" stroke-linecap="round"/><circle cx="61.9" cy="59.2" r="1.1" fill="#8C6A3C"/></g>`;

/** Kerim for the lab: perched, thinking, with goggles on her forehead and a white collar. */
export function labKerim(mood: string = "think"): HTMLElement {
  const p = pup(mood, 0, { pose: "perched", enter: false, label: "Kerim in her lab" });
  p.classList.add("lab-kerim");
  const h = p.querySelector(".k-head"), b = p.querySelector(".k-bird");
  if (b && h) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = COLLAR;
    if (g.firstChild) b.insertBefore(g.firstChild, h);
    h.insertAdjacentHTML("beforeend", GOGGLES);
  }
  return p;
}
