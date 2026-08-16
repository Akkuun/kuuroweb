// une seule vignette "corrompue" parmi toutes les couvertures du site : un
// artefact visuel discret (inversion, dérive de couleur, dégradation...)
// choisi au hasard sur UNE SEULE image à chaque chargement de page. L'effet
// marche justement parce qu'il n'y en a qu'une -- en mettre partout en
// ferait un simple effet graphique au lieu d'un détail qui met mal à l'aise.
const CORRUPT_SELECTOR =
  ".poster, .manga-cover, .anime-thumb, .game-cover, .book-cover, .archive-cover";
const CORRUPT_VARIANTS = ["variant-invert", "variant-artifact", "variant-degraded", "variant-static"];

function applyCorruptedCover() {
  if (document.querySelector(".corrupted-cover")) return;

  // ne cible que les vignettes qui ont reellement une image chargee (pas
  // le motif de croix du placeholder tant qu'aucun fichier n'est en place)
  const candidates = Array.from(document.querySelectorAll(CORRUPT_SELECTOR)).filter(
    (el) => el.style.backgroundImage && el.style.backgroundImage !== "none"
  );
  if (!candidates.length) return;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const variant = CORRUPT_VARIANTS[Math.floor(Math.random() * CORRUPT_VARIANTS.length)];
  target.classList.add("corrupted-cover", variant);
}

// laisse le temps aux vignettes de charger leurs images reelles (fetch
// data.json + preload async dans setBackgroundImage) avant de choisir
setTimeout(applyCorruptedCover, 1800);
