// mur de gif eye_wall.gif pour la page principale : instances éparpillées
// (position/taille/rotation aléatoires, horloges d'animation indépendantes)
// derrière l'îlot de blocs (#content-main), mesuré au runtime. N'est
// utilisé QUE sur index.html -- les pages secondaires ont leur propre mur
// codé en dur dans le HTML (voir .eye-deco* dans style.css).

function buildEyeWallInstances(container, areaWidth, areaHeight) {
  const aspect = 281 / 500;
  const area = areaWidth * areaHeight;
  // densité approximative pour couvrir "une bonne partie" de la zone sans
  // la tapisser entièrement -- avec chevauchement, c'est voulu (organique)
  const count = Math.max(10, Math.min(45, Math.round(area / 7000)));

  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.className = "eye-wall-instance";
    img.alt = "";
    // ?i=N force un décodage GIF indépendant par image (pas de partage de
    // décodeur/horloge entre instances) -> les boucles ne sont jamais
    // synchronisées entre elles
    img.src = `data/eye_wall.gif?i=${i}`;

    const w = 65 + Math.random() * 100;
    const h = w * aspect;
    const x = Math.random() * Math.max(0, areaWidth - w);
    const y = Math.random() * Math.max(0, areaHeight - h);
    const rotation = Math.random() * 70 - 35;

    img.style.width = `${w}px`;
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.transform = `rotate(${rotation}deg)`;

    // démarrage décalé : chaque image ne commence son décodage/sa boucle
    // qu'au moment où elle est réellement insérée dans le DOM
    setTimeout(() => container.appendChild(img), Math.random() * 1800);
  }
}

function initEyeWallMain() {
  const page = document.getElementById("page");
  const island = document.getElementById("content-main");
  if (!page || !island) return false;
  if (page.querySelector(".eye-wall-layer")) return true;

  const pageRect = page.getBoundingClientRect();
  const islandRect = island.getBoundingClientRect();
  if (!islandRect.width || !islandRect.height) return false;

  const layer = document.createElement("div");
  layer.className = "eye-wall-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.style.left = `${islandRect.left - pageRect.left}px`;
  layer.style.top = `${islandRect.top - pageRect.top}px`;
  layer.style.width = `${islandRect.width}px`;
  layer.style.height = `${islandRect.height}px`;
  page.appendChild(layer);

  buildEyeWallInstances(layer, islandRect.width, islandRect.height);
  return true;
}

// attend que le layout data-driven (posters, images...) se stabilise
// avant de mesurer la taille réelle de l'îlot de blocs
setTimeout(initEyeWallMain, 1500);
