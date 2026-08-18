// L'îlot central (#site-image + #site) a des tailles figées en pixels un
// peu partout (posters, photos, largeur de #site...) -- pas vraiment
// responsive. Sur les résolutions plus petites que prévu, le contenu
// débordait de #page et se faisait couper (surtout à gauche, #page étant
// ancré à droite via justify-content:flex-end).
//
// Plutôt que de retoucher des dizaines de tailles fixes dans tout le site
// (gros risque de régressions), on mesure la taille naturelle de #page et
// on lui applique un scale() uniforme pour qu'il tienne toujours dans le
// viewport, SANS jamais changer ses proportions internes -- juste plus
// petit dans son ensemble quand il le faut. jamais agrandi au-delà de sa
// taille naturelle (pas de scale > 1) : ça laisse simplement de la marge
// sur les grands écrans, comme le reste du site le fait déjà.

const FIT_PAGE_BASE_TRANSFORM = "translateY(-10px)";

function fitPageToViewport() {
  const page = document.getElementById("page");
  const siteImage = document.getElementById("site-image");
  const site = document.getElementById("site");
  if (!page || !siteImage || !site) return;

  // reinitialise avant de mesurer, sinon on mesure une taille déjà réduite
  page.style.transform = FIT_PAGE_BASE_TRANSFORM;

  // page.scrollWidth ne marche PAS ici : #page a justify-content:flex-end,
  // donc quand le contenu est plus large que #page, il déborde par la
  // GAUCHE (le bord droit reste ancré) -- scrollWidth ne capte que le
  // débordement à droite/en bas par nature, jamais à gauche, et sous-
  // estimait silencieusement la largeur réelle. On mesure directement les
  // rects des deux enfants connus à la place, qui donnent l'étendue
  // géométrique réelle peu importe le sens du débordement.
  const imgRect = siteImage.getBoundingClientRect();
  const siteRect = site.getBoundingClientRect();
  const naturalWidth = Math.max(siteRect.right, imgRect.right) - Math.min(siteRect.left, imgRect.left);
  const naturalHeight = Math.max(siteRect.bottom, imgRect.bottom) - Math.min(siteRect.top, imgRect.top);
  if (!naturalWidth || !naturalHeight) return;

  const marqueeBar = document.getElementById("marquee-bar");
  const marqueeHeight = marqueeBar ? marqueeBar.getBoundingClientRect().height : 58;

  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight - marqueeHeight;

  // petite marge de securite (0.5%) pour absorber l'arrondi flottant du
  // scale CSS -- sans ca, le resultat retombe parfois 1-3px trop juste
  const SAFETY_MARGIN = 0.995;
  const scale = Math.min(1, (availableWidth / naturalWidth) * SAFETY_MARGIN, (availableHeight / naturalHeight) * SAFETY_MARGIN);

  page.style.transformOrigin = "top right";
  page.style.transform =
    scale < 0.999 ? `${FIT_PAGE_BASE_TRANSFORM} scale(${scale})` : FIT_PAGE_BASE_TRANSFORM;
}

let fitPageDebounce;
function scheduleFitPage() {
  clearTimeout(fitPageDebounce);
  fitPageDebounce = setTimeout(fitPageToViewport, 100);
}

window.addEventListener("resize", scheduleFitPage);

// le contenu (posters, reviews...) arrive par vagues via fetch -> on
// observe le DOM plutôt que de deviner un délai fixe, comme deja fait
// ailleurs sur le site (voir ascii-decor.js) pour les zones de review.
// attributes:true (pas juste childList) est indispensable ici :
// renderSiteImage() fixe la largeur de #site-image via node.style.width
// (une mutation d'attribut "style", pas un ajout/suppression de noeud) --
// sans ca, on mesure la page AVANT que #site-image ait sa taille finale et
// le scale calculé est trop grand -> l'image deborde a gauche.
function initFitPage() {
  const page = document.getElementById("page");
  if (!page) return;
  // ignore les mutations sur #page lui-meme (c'est fitPageToViewport qui
  // pose page.style.transform -> sans ce filtre, l'observer se
  // re-declencherait sur son propre changement en boucle infinie)
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.target !== page)) scheduleFitPage();
  });
  observer.observe(page, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
  });
  scheduleFitPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFitPage);
} else {
  initFitPage();
}
