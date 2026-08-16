// message caché derrière l'îlot de blocs centraux : "I SEE YOU" tracé comme
// à la main, trait par trait, façon écriture lente et tremblante -- pas un
// tracé géometrique parfait. z-index bas exprès : #content-main passe
// par-dessus (voir style.css), donc le fond des blocs étant transparent, le
// message ne perce que dans les interstices entre le contenu réel des
// blocs, jamais par-dessus.

// chaque lettre = 1 ou plusieurs traits, décrits comme une suite de
// commandes de points (dans une boîte locale 10 x 14) plutôt qu'une chaine
// "d" figée -- pour pouvoir perturber chaque coordonnée (jitter) et obtenir
// une lettre légèrement différente, jamais parfaitement géometrique
const GHOST_LETTER_STROKES = {
  I: [
    [["M", 2, 0.5], ["L", 8, 0.5]],
    [["M", 5, 0.5], ["L", 5, 13.5]],
    [["M", 2, 13.5], ["L", 8, 13.5]],
  ],
  S: [
    [
      ["M", 7.5, 2.5],
      ["Q", 7, 0.5, 5, 0.5],
      ["Q", 2, 0.5, 2, 3],
      ["Q", 2, 5.5, 5, 6.5],
      ["Q", 8, 7.5, 8, 10.5],
      ["Q", 8, 13.5, 5, 13.5],
      ["Q", 2.5, 13.5, 2, 11.5],
    ],
  ],
  E: [
    [["M", 2, 0.3], ["L", 2, 13.7]],
    [["M", 2, 0.3], ["L", 8, 0.3]],
    [["M", 2, 7], ["L", 6.5, 7]],
    [["M", 2, 13.7], ["L", 8, 13.7]],
  ],
  Y: [
    [["M", 1.5, 0.3], ["L", 5, 7], ["L", 8.5, 0.3]],
    [["M", 5, 7], ["L", 5, 13.7]],
  ],
  O: [
    [
      ["M", 5, 0.3],
      ["Q", 9, 0.3, 9, 7],
      ["Q", 9, 13.7, 5, 13.7],
      ["Q", 1, 13.7, 1, 7],
      ["Q", 1, 0.3, 5, 0.3],
    ],
  ],
  U: [
    [
      ["M", 1.5, 0.3],
      ["L", 1.5, 9],
      ["Q", 1.5, 13.7, 5, 13.7],
      ["Q", 8.5, 13.7, 8.5, 9],
      ["L", 8.5, 0.3],
    ],
  ],
};

const GHOST_MESSAGE_TEXT = "I SEE YOU";
const GHOST_DRAW_SPEED = 26;
const GHOST_JITTER = 0.85; // en unites locales (boite 10x14) -- trait tremblant, pas geometrique

function jitterCoord(v) {
  return v + (Math.random() * GHOST_JITTER * 2 - GHOST_JITTER);
}

// convertit une suite de points en chaine "d" SVG, en perturbant chaque
// coordonnee : jamais deux fois exactement le meme trait
function strokeToPathD(stroke) {
  return stroke
    .map(([cmd, ...coords]) => {
      const jittered = [];
      for (let i = 0; i < coords.length; i += 2) {
        jittered.push(jitterCoord(coords[i]).toFixed(2), jitterCoord(coords[i + 1]).toFixed(2));
      }
      return cmd + jittered.join(",");
    })
    .join(" ");
}

function buildGhostLetter(svgNS, char, x, y, cellSize, allPaths) {
  const strokes = GHOST_LETTER_STROKES[char];
  if (!strokes) return;

  const scale = cellSize / 10;
  // rotation par lettre plus marquee (main qui tremble/hesite), et
  // legere variation de taille pour casser l'alignement mecanique
  const wobbleAngle = (Math.random() * 12 - 6).toFixed(2);
  const scaleJitter = 0.88 + Math.random() * 0.24;

  strokes.forEach((stroke) => {
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", strokeToPathD(stroke));
    path.setAttribute("class", "ghost-message-path");
    path.setAttribute(
      "transform",
      `translate(${x},${y}) scale(${scale * scaleJitter}) rotate(${wobbleAngle} 5 7)`
    );
    // epaisseur inegale d'un trait a l'autre -- moins "trace au marqueur",
    // plus "griffure hesitante"
    path.style.strokeWidth = (0.35 + Math.random() * 0.55).toFixed(2);
    allPaths.push(path);

    // ~1 trait sur 3 est repasse une seconde fois, legerement decale et
    // plus faible : effet main nerveuse qui repasse sur son propre trait
    if (Math.random() < 0.35) {
      const retrace = document.createElementNS(svgNS, "path");
      retrace.setAttribute("d", strokeToPathD(stroke));
      retrace.setAttribute("class", "ghost-message-path ghost-message-retrace");
      retrace.setAttribute(
        "transform",
        `translate(${x + (Math.random() * 1.2 - 0.6)},${y + (Math.random() * 1.2 - 0.6)}) scale(${scale * scaleJitter}) rotate(${(Number(wobbleAngle) + (Math.random() * 6 - 3)).toFixed(2)} 5 7)`
      );
      retrace.style.strokeWidth = (0.25 + Math.random() * 0.3).toFixed(2);
      allPaths.push(retrace);
    }
  });
}

// revele chaque trait dans l'ordre (gauche a droite), a vitesse a peu pres
// constante mais avec un timing "par a-coups" (steps()) plutot qu'un
// deroule fluide -- une main qui hesite/tremble, pas un traceur mecanique
function revealGhostStrokes(paths) {
  let delay = 0;
  paths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    const duration = Math.max(0.4, length / (GHOST_DRAW_SPEED / 8));
    const steps = 4 + Math.floor(Math.random() * 6);
    path.style.animation = `ghost-message-reveal ${duration}s steps(${steps}, end) ${delay}s forwards`;
    delay += duration * (0.55 + Math.random() * 0.25);
    // pause hesitante occasionnelle entre deux traits
    if (Math.random() < 0.25) delay += 0.3 + Math.random() * 0.6;
  });
  return delay;
}

function initGhostMessage() {
  const page = document.getElementById("page");
  const island = document.getElementById("content-main");
  if (!page || !island) return;
  if (page.querySelector(".ghost-message")) return;

  const pageRect = page.getBoundingClientRect();
  const islandRect = island.getBoundingClientRect();
  if (!islandRect.width || !islandRect.height) return;

  const chars = GHOST_MESSAGE_TEXT.split("");
  const cellSize = Math.max(24, Math.min(130, islandRect.width / (chars.length * 1.15)));
  const totalWidth = chars.length * cellSize;
  const cellHeight = cellSize * 1.4;

  const startX = (islandRect.width - totalWidth) / 2;
  const startY = (islandRect.height - cellHeight) / 2;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "ghost-message");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", String(islandRect.width));
  svg.setAttribute("height", String(islandRect.height));

  svg.style.left = `${islandRect.left - pageRect.left}px`;
  svg.style.top = `${islandRect.top - pageRect.top}px`;

  const allPaths = [];
  let x = startX;
  chars.forEach((char) => {
    if (char !== " ") buildGhostLetter(svgNS, char, x, startY, cellSize, allPaths);
    x += cellSize;
  });

  allPaths.forEach((p) => svg.appendChild(p));
  page.appendChild(svg);

  const writeDuration = revealGhostStrokes(allPaths);
  svg.style.animationDelay = `${writeDuration}s`;
}

// "I SEE YOU" désactivé pour le moment. Pour le réactiver :
// setTimeout(initGhostMessage, 1500);
// (le mur de gif eye_wall.gif a été déplacé dans js/eye-wall.js, partagé
// avec les pages secondaires)
