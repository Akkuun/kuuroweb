// bande marquee (liens sociaux "[ NOM ]" + ligne ":") : script autonome,
// inclus sur toutes les pages (index + archives + guestbook) pour que
// #marquee-bar ait le meme rendu partout, sans dependre du reste de
// render.js (qui, lui, ne s'execute que sur index.html).

async function marqueeLoadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`impossible de charger ${path}`);
  return res.json();
}

function marqueeEl(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// deux groupes identiques (pas une liste d'items a plat) : chaque groupe
// inclut son propre gap de fin dans sa largeur, donc les deux groupes ont
// une largeur strictement egale et translateX(-50%) tombe pile sur la
// frontiere -> plus de saut visible ("rollback") a la reprise de la boucle.
function buildMarqueeGroup(items) {
  const group = marqueeEl("div", "marquee-group");
  items.forEach((item) => {
    const a = marqueeEl("a", "marquee-item");
    a.href = item.url;
    // seuls les vrais liens externes (reseaux sociaux) s'ouvrent dans un
    // nouvel onglet ; les pages du site restent dans le meme onglet
    if (item.external) {
      a.target = "_blank";
      a.rel = "noopener";
    }
    a.textContent = `[ ${(item.label || "").toUpperCase()} ]`;
    group.appendChild(a);
  });
  return group;
}

// point de depart precis de l'animation d'entree (voir @keyframes
// marquee-enter) : la largeur reelle de la barre, mesuree au runtime,
// plutot que l'approximation CSS 100vw (peut deborder legerement sur les
// pages avec scrollbar, ex. les pages secondaires en overflow:auto)
function setMarqueeBarWidthVar() {
  const bar = document.getElementById("marquee-bar");
  if (!bar) return;
  bar.style.setProperty("--marquee-bar-width", `${bar.getBoundingClientRect().width}px`);
}

async function renderMarquee() {
  setMarqueeBarWidthVar();
  const data = await marqueeLoadJSON("data/marquee/data.json");
  const track = document.getElementById("marquee-content");
  if (!track) return;

  // 2 groupes identiques suffisent pour une boucle sans saut *seulement*
  // si un groupe est deja plus large que la barre -- avec peu d'items (ex.
  // seulement les pages du site, sans les reseaux sociaux), un groupe peut
  // etre plus etroit que l'ecran, laissant un grand trou vide apres le 2e
  // passage avant que la boucle ne revienne. On mesure un groupe une
  // premiere fois, puis on en genere autant qu'il faut pour couvrir au
  // moins 2x la largeur de la barre, et on ajuste le pourcentage de la
  // boucle en consequence (toujours exactement 1 groupe de large).
  const probeGroup = buildMarqueeGroup(data.items);
  track.appendChild(probeGroup);
  const groupWidth = probeGroup.getBoundingClientRect().width || 1;
  const barWidth = document.getElementById("marquee-bar").getBoundingClientRect().width;
  const repeats = Math.max(2, Math.ceil((barWidth * 2) / groupWidth));

  track.innerHTML = "";
  for (let i = 0; i < repeats; i++) {
    track.appendChild(buildMarqueeGroup(data.items));
  }
  track.style.setProperty("--marquee-loop-percent", `${100 / repeats}%`);
}

renderMarquee().catch((err) => console.error(err));
