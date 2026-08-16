// décor ASCII : remplace les bordures classiques par des séparateurs en
// hachures unicode (░▒▓█), façon terminal horreur. Un seul <span> "plein"
// très long + flex:1 + overflow:hidden suffit à s'adapter à n'importe
// quelle largeur de bloc sans avoir à mesurer quoi que ce soit en JS.
const ASCII_FADE_IN = "░▒▓";
const ASCII_FADE_OUT = "▓▒░";
const ASCII_FILL = "█".repeat(400);
const REVIEW_FILL = "─".repeat(400);

function buildAsciiDivider() {
  const div = document.createElement("div");
  div.className = "ascii-divider";
  div.setAttribute("aria-hidden", "true");

  const left = document.createElement("span");
  left.className = "ascii-fade";
  left.textContent = ASCII_FADE_IN;

  const fill = document.createElement("span");
  fill.className = "ascii-fill";
  fill.textContent = ASCII_FILL;

  const right = document.createElement("span");
  right.className = "ascii-fade";
  right.textContent = ASCII_FADE_OUT;

  div.append(left, fill, right);
  return div;
}

// une ligne juste sous le titre de chaque bloc, à la place du border-bottom
// classique du <h2> (ou de .about-me-header, qui enveloppe le h2 pour le
// bloc About Me)
function applyAsciiDividers() {
  document.querySelectorAll(".block").forEach((block) => {
    if (block.querySelector(":scope > .ascii-divider")) return;
    const header = block.querySelector(":scope > .about-me-header") || block.querySelector(":scope > h2");
    if (!header) return;
    header.insertAdjacentElement("afterend", buildAsciiDivider());
  });
}

function buildReviewDivider() {
  const div = document.createElement("div");
  div.className = "review-divider";
  div.setAttribute("aria-hidden", "true");

  const left = document.createElement("span");
  left.className = "review-fill";
  left.textContent = REVIEW_FILL;

  const cross = document.createElement("span");
  cross.className = "review-cross";
  cross.textContent = "╂";

  const right = document.createElement("span");
  right.className = "review-fill";
  right.textContent = REVIEW_FILL;

  div.append(left, cross, right);
  return div;
}

// remplace le cadre classique des zones de review (.scrollable-text) par
// une ligne ───╂─── en tête -- ces zones sont peuplées dynamiquement par
// render.js/archive.js (fetch async), d'où le MutationObserver plus bas
// plutot qu'un seul passage a DOMContentLoaded
function applyReviewDividers() {
  document.querySelectorAll(".scrollable-text").forEach((box) => {
    if (box.querySelector(":scope > .review-divider")) return;
    box.insertBefore(buildReviewDivider(), box.firstChild);
  });
}

// remplace le border-bottom de la bande marquee par une ligne de ":"
function applyMarqueeDivider() {
  const bar = document.getElementById("marquee-bar");
  if (!bar || bar.querySelector(".marquee-divider")) return;
  const div = document.createElement("div");
  div.className = "marquee-divider";
  div.setAttribute("aria-hidden", "true");
  div.textContent = ":".repeat(2000);
  bar.appendChild(div);
}

function initAsciiDecor() {
  applyAsciiDividers();
  applyReviewDividers();
  applyMarqueeDivider();

  // .block existe des le chargement de la page, mais son contenu (dont les
  // .scrollable-text) arrive plus tard via fetch -> on observe le DOM pour
  // decorer les zones de review des qu'elles apparaissent
  const observer = new MutationObserver(() => {
    applyReviewDividers();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAsciiDecor);
} else {
  initAsciiDecor();
}
