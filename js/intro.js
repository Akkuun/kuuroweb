// rendu pour la page d'intro (index.html) : reprend tel quel le sous-ensemble
// de render.js dont cette page a besoin (about me, follow/my button),
// plutôt que d'inclure tout render.js qui tenterait aussi de peupler des
// blocs film/book/manga/etc. absents de cette page (erreurs console inutiles).
// chat/follow-count vivent uniquement sur profil.html désormais.

async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`impossible de charger ${path}`);
  return res.json();
}

function setBackgroundImage(node, src, size = "cover") {
  if (!src) return;
  const probe = new Image();
  probe.onload = () => {
    node.style.backgroundImage = `url("${src}")`;
    node.style.backgroundSize = size;
    node.style.backgroundPosition = "center";
  };
  probe.src = src;
}

// ---- ABOUT ME ----
// le bio (data/about-me/data.json) contient un dernier paragraphe "Click
// Here to go to the main page..." -- sorti du reste du texte et affiché à
// part, en plus grand (voir .gifzone-cta), avec "Here" en lien vers
// profil.html (texte avant/après gardé en simples noeuds texte, pas
// d'innerHTML, pour rester sûr même si le bio contenait des caractères
// spéciaux)
async function renderAboutMe() {
  const data = await loadJSON("data/about-me/data.json");
  document.getElementById("pseudo-title").textContent = data.pseudo || "";
  setBackgroundImage(document.getElementById("about-me-photo"), data.photo);

  const bio = data.bio || "";
  const paragraphs = bio.split(/\n\s*\n/);
  const ctaIndex = paragraphs.findIndex((p) => p.includes("Here"));

  const bioEl = document.getElementById("about-me-bio");
  const ctaEl = document.getElementById("about-me-cta");

  const mainParagraphs =
    ctaIndex === -1 ? paragraphs : paragraphs.filter((_, i) => i !== ctaIndex);
  bioEl.textContent = mainParagraphs.join("\n\n").trim();

  if (ctaEl) {
    ctaEl.textContent = "";
    if (ctaIndex !== -1) {
      const cta = paragraphs[ctaIndex].trim();
      const idx = cta.indexOf("Here");
      ctaEl.appendChild(document.createTextNode(cta.slice(0, idx)));
      const link = document.createElement("a");
      link.href = "profil.html";
      link.textContent = "Here";
      ctaEl.appendChild(link);
      ctaEl.appendChild(document.createTextNode(cta.slice(idx + "Here".length)));
    }
  }
}

// ---- MY BUTTON (image + code d'embed) ----
async function renderFollow() {
  const data = await loadJSON("data/follow/data.json");

  setBackgroundImage(document.getElementById("my-button"), data.site_button);

  if (data.site_button) {
    const buttonUrl = new URL(data.site_button, location.href).href;
    document.getElementById("my-button-code").value =
      `<a href="${location.origin}" target="_blank">\n` +
      `  <img src="${buttonUrl}" width="88" height="31">\n` +
      `</a>`;
  }
}

// ---- BOUTONS DE NAV EN GIF ----
// "Profile" réutilise directement le portrait (déjà chargé par
// renderAboutMe) plutôt qu'un gif dédié -- voir le lien qui enveloppe
// .intro-photo dans le HTML.
const NAV_GIFS = {
  "nav-gif-films": "data/gif/movie.gif",
  "nav-gif-books": "data/gif/book.gif",
  "nav-gif-games": "data/gif/gaming.gif",
  "nav-gif-tierlist": "data/gif/tier_list.gif",
};

function renderNavGifs() {
  Object.entries(NAV_GIFS).forEach(([id, src]) => {
    const node = document.getElementById(id);
    if (node) setBackgroundImage(node, src);
  });
}

// ---- VISITS : vrai total (API Nekoweb, meme endpoint que le follow count
// sur profil.html) -- affiche le nombre reel de vues du site, pas une
// approximation locale. Le compteur local reste comme repli honnete si
// l'API est indisponible (le libelle change en consequence, jamais
// d'etiquette qui ne correspond pas a ce qui est reellement affiche) ----
function renderVisitsLocalFallback() {
  const KEY = "kuuro_visit_count";
  const count = parseInt(localStorage.getItem(KEY) || "0", 10) + 1;
  localStorage.setItem(KEY, String(count));
  return count;
}

async function renderVisits() {
  const localCount = renderVisitsLocalFallback();
  const node = document.getElementById("visit-count");
  const noteEl = document.getElementById("visit-count-note");
  if (node) node.textContent = String(localCount).padStart(5, "0");
  if (noteEl) noteEl.textContent = "this browser only";

  try {
    const data = await loadJSON("data/follow/data.json");
    if (!data.nekoweb_domain) return;
    const res = await fetch(
      `https://nekoweb.org/api/site/info/${data.nekoweb_domain}`,
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const info = await res.json();
    if (typeof info.views === "number") {
      if (node) node.textContent = String(info.views).padStart(5, "0");
      if (noteEl) noteEl.textContent = "total site views";
    }
  } catch (err) {
    console.error(err);
  }
}

renderVisits().catch((err) => console.error(err));
renderNavGifs();

[renderAboutMe, renderFollow].forEach((fn) => fn().catch((err) => console.error(err)));
