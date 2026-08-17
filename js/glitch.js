// effet glitch : remplace temporairement des caracteres dans des noeuds de
// texte visibles par des symboles ASCII aleatoires (en les faisant defiler
// plusieurs fois avant de se stabiliser), puis restaure l'original --
// renforce l'ambiance horreur/terminal corrompu du site. Timing volontairement
// irregulier (delais aleatoires a tous les niveaux) pour un rendu etrange
// plutot que mecanique/periodique.
const GLITCH_CHARS = "▓▒░█▄▀■□×%$#@&*+~/\\<>";

// exclus du glitch : texte japonais, pseudo, coeurs/etoiles de note, et les
// barres ASCII deco elles-memes (dividers de bloc/review/marquee)
const GLITCH_EXCLUDE_SELECTOR =
  ".jp, .pseudo-inline, #pseudo-title, .heart, .stars, .ascii-divider, .review-divider, .marquee-divider, #marquee-bar";

// noeud -> Set des positions actuellement en cours de glitch, pour ne
// jamais lancer un 2e glitch sur une position deja en cours : sinon le
// nouveau pick capture le caractere DEJA glitche comme "original" et le
// restaure a la fin -> le vrai caractere d'origine est perdu
const glitchActivePositions = new WeakMap();

function glitchRandomChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
}

function glitchCollectTextNodes(root) {
  const skipTags = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (skipTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest(GLITCH_EXCLUDE_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  return nodes;
}

// fait defiler plusieurs symboles aleatoires a la position `pos` du noeud,
// a intervalles irreguliers, avant de restaurer le vrai caractere d'origine
function glitchAtPosition(node, pos, original, expectedLength, onDone) {
  const cycles = 2 + Math.floor(Math.random() * 7);
  let step = 0;

  function tick() {
    const current = node.nodeValue;
    // le noeud a ete remplace entre-temps (re-render data-driven) -> abandon
    if (!current || current.length !== expectedLength) {
      onDone();
      return;
    }

    if (step < cycles) {
      node.nodeValue = current.slice(0, pos) + glitchRandomChar() + current.slice(pos + 1);
      step++;
      setTimeout(tick, 25 + Math.random() * 140);
    } else {
      node.nodeValue = current.slice(0, pos) + original + current.slice(pos + 1);
      onDone();
    }
  }

  tick();
}

function glitchOnce() {
  const nodes = glitchCollectTextNodes(document.body);
  if (!nodes.length) return;

  const count = Math.min(6 + Math.floor(Math.random() * 30), nodes.length);
  for (let i = 0; i < count; i++) {
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const text = node.nodeValue;
    if (!text || text.trim().length < 2) continue;

    let pos = Math.floor(Math.random() * text.length);
    let attempts = 0;
    while (text[pos] === " " && attempts < 10) {
      pos = Math.floor(Math.random() * text.length);
      attempts++;
    }
    if (text[pos] === " ") continue;

    let active = glitchActivePositions.get(node);
    if (!active) {
      active = new Set();
      glitchActivePositions.set(node, active);
    }
    // position deja en cours de glitch : on l'ignore plutot que de repartir
    // d'un caractere "original" en fait deja glitche
    if (active.has(pos)) continue;

    active.add(pos);
    glitchAtPosition(node, pos, text[pos], text.length, () => active.delete(pos));
  }
}

// meme effet, applique au titre de l'onglet (document.title n'est pas un
// noeud du DOM -> logique separee, mais meme principe de glitch/restore)
const glitchTitleActivePositions = new Set();

function glitchTitleAtPosition(pos, original, expectedLength) {
  const cycles = 2 + Math.floor(Math.random() * 7);
  let step = 0;

  function tick() {
    const current = document.title;
    if (!current || current.length !== expectedLength) {
      glitchTitleActivePositions.delete(pos);
      return;
    }
    if (step < cycles) {
      document.title = current.slice(0, pos) + glitchRandomChar() + current.slice(pos + 1);
      step++;
      setTimeout(tick, 25 + Math.random() * 140);
    } else {
      document.title = current.slice(0, pos) + original + current.slice(pos + 1);
      glitchTitleActivePositions.delete(pos);
    }
  }

  tick();
}

function glitchTitleOnce() {
  const title = document.title;
  if (!title || title.trim().length < 2) return;

  let pos = Math.floor(Math.random() * title.length);
  let attempts = 0;
  while (title[pos] === " " && attempts < 10) {
    pos = Math.floor(Math.random() * title.length);
    attempts++;
  }
  if (title[pos] === " ") return;
  if (glitchTitleActivePositions.has(pos)) return;

  glitchTitleActivePositions.add(pos);
  glitchTitleAtPosition(pos, title[pos], title.length);
}

// re-planifie a chaque fois avec un delai aleatoire (pas de setInterval a
// cadence fixe) : tantot des rafales rapprochees, tantot des pauses plus
// longues, pour un cote imprevisible plutot qu'un tic-tac mecanique
function scheduleGlitch() {
  glitchOnce();
  setTimeout(scheduleGlitch, 150 + Math.random() * 2200);
}

setTimeout(scheduleGlitch, 300 + Math.random() * 1200);

// boucle totalement independante pour le titre de l'onglet -- cadence bien
// plus rapide que le glitch de page, sans rien changer a scheduleGlitch()
function scheduleTitleGlitch() {
  glitchTitleOnce();
  setTimeout(scheduleTitleGlitch, 15 + Math.random() * 110);
}

setTimeout(scheduleTitleGlitch, 50 + Math.random() * 150);
