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

async function renderMarquee() {
  const data = await marqueeLoadJSON("data/marquee/data.json");
  const track = document.getElementById("marquee-content");
  if (!track) return;
  track.appendChild(buildMarqueeGroup(data.items));
  track.appendChild(buildMarqueeGroup(data.items));
}

renderMarquee().catch((err) => console.error(err));
