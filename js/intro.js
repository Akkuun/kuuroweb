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
async function renderAboutMe() {
  const data = await loadJSON("data/about-me/data.json");
  document.getElementById("pseudo-title").textContent = data.pseudo || "";
  setBackgroundImage(document.getElementById("about-me-photo"), data.photo);
  document.getElementById("about-me-bio").textContent = data.bio || "";
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

  const copyBtn = document.getElementById("copy-code-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          document.getElementById("my-button-code").value
        );
        copyBtn.textContent = "✓";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.textContent = "📋";
          copyBtn.classList.remove("copied");
        }, 1200);
      } catch (err) {
        console.error(err);
      }
    });
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

// ---- VISITS : compteur honnête, local au navigateur (pas de backend, donc
// pas de faux total "global" -- affichage façon compteur LCD rétro
// (zéros de tête), mais la mention "this browser only" à côté dans le HTML
// reste claire sur ce que le chiffre représente réellement ----
function renderVisits() {
  const KEY = "kuuro_visit_count";
  const count = parseInt(localStorage.getItem(KEY) || "0", 10) + 1;
  localStorage.setItem(KEY, String(count));
  const node = document.getElementById("visit-count");
  if (node) node.textContent = String(count).padStart(5, "0");
}

renderVisits();
renderNavGifs();

[renderAboutMe, renderFollow].forEach((fn) => fn().catch((err) => console.error(err)));
