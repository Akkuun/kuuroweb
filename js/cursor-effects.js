// effets curseur horreur (partages sur toutes les pages) :
// 1. Creepy trails : quelques curseurs fantomes glitchent derriere le
//    pointeur reel pendant le mouvement, puis s'effacent rapidement.
// 2. Glitch cursor : rafale de curseurs empiles en diagonale.
// Le faux curseur autonome (fake cursor) est desormais dans
// js/fake-cursor.js, inclus uniquement sur index.html.

// forme par defaut : fleche generique dessinee en CSS via clip-path (voir
// .cursor-trail-ghost / .fake-cursor / .cursor-glitch-stamp dans
// style.css). Si le vrai curseur perso (data/cursor/auto.cur) charge
// correctement, on bascule dessus a la place -- coherent avec le design
// du curseur reel plutot qu'une forme generique sans rapport.
(function () {
  const probe = new Image();
  probe.onload = () => document.documentElement.classList.add("cursor-effects-custom");
  probe.src = "data/cursor/auto.cur";
})();

// ---- 1. CREEPY TRAILS ----
const TRAIL_MIN_INTERVAL = 45; // ms : throttle, sinon un fantome par pixel
let lastTrailSpawn = 0;

function spawnCursorTrail(x, y) {
  const now = Date.now();
  if (now - lastTrailSpawn < TRAIL_MIN_INTERVAL) return;
  lastTrailSpawn = now;

  const ghost = document.createElement("div");
  ghost.className = "cursor-trail-ghost";
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
  // leger decalage + rotation aleatoires : plusieurs fantomes qui se
  // chevauchent legerement au lieu d'un empilement parfait -> effet glitche
  ghost.style.setProperty("--trail-dx", `${(Math.random() * 12 - 6).toFixed(1)}px`);
  ghost.style.setProperty("--trail-dy", `${(Math.random() * 12 - 6).toFixed(1)}px`);
  ghost.style.setProperty("--trail-rot", `${(Math.random() * 30 - 15).toFixed(1)}deg`);
  document.body.appendChild(ghost);

  setTimeout(() => ghost.remove(), 700);
}

let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;

document.addEventListener("mousemove", (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  spawnCursorTrail(e.clientX, e.clientY);
});

// ---- 2. GLITCH CURSOR ----
// rafale de curseurs empiles en diagonale a la position actuelle de la
// souris, comme si le rendu avait "copie-colle" le motif du curseur
// plusieurs fois -- apparait d'un coup, disparait juste apres (pas un
// deplacement comme le fake cursor, un artefact instantane)
function triggerGlitchCursorBurst() {
  const count = 6 + Math.floor(Math.random() * 6);
  const stepX = 12 + Math.random() * 12;
  const stepY = 12 + Math.random() * 12;
  const dirX = Math.random() < 0.5 ? 1 : -1;
  const dirY = Math.random() < 0.5 ? 1 : -1;

  const stamps = [];
  for (let i = 0; i < count; i++) {
    const stamp = document.createElement("div");
    stamp.className = "cursor-glitch-stamp";
    stamp.style.left = `${lastMouseX + dirX * i * stepX}px`;
    stamp.style.top = `${lastMouseY + dirY * i * stepY}px`;
    stamp.style.opacity = (0.22 + Math.random() * 0.38).toFixed(2);
    document.body.appendChild(stamp);
    stamps.push(stamp);
  }

  setTimeout(() => {
    stamps.forEach((stamp) => {
      stamp.style.transition = "opacity 0.25s ease";
      stamp.style.opacity = "0";
      setTimeout(() => stamp.remove(), 300);
    });
  }, 250 + Math.random() * 250);
}

function scheduleGlitchCursor() {
  if (Math.random() < 0.3) triggerGlitchCursorBurst();
  setTimeout(scheduleGlitchCursor, 6000);
}

setTimeout(scheduleGlitchCursor, 6000);
