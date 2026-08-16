// effets curseur horreur :
// 1. Creepy trails : quelques curseurs fantomes glitchent derriere le
//    pointeur reel pendant le mouvement, puis s'effacent rapidement.
// 2. Fake cursor : un faux pointeur secondaire apparait de temps en temps
//    (rarement, jamais permanent) et se deplace tout seul avec un
//    trajet realiste (plusieurs points, vitesse variable) avant de
//    disparaitre -- donne l'impression furtive d'avoir perdu le controle.

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

// ---- 2. FAKE CURSOR ----
// se declenche souvent (check toutes les 3s), jamais permanent : quelques
// secondes de trajet puis disparition definitive. Le trajet est pilote
// image par image (requestAnimationFrame) le long d'une courbe de Bezier
// quadratique, pas une simple transition CSS en ligne droite -- une vraie
// main ne va jamais d'un point A a B en ligne parfaitement droite a
// vitesse constante.
function buildFakeCursor() {
  const cursor = document.createElement("div");
  cursor.className = "fake-cursor";
  document.body.appendChild(cursor);
  return cursor;
}

// ease-in-out avec une pointe d'overshoot : accelere, puis depasse
// legerement la cible avant de "se corriger" -- signature d'un geste de
// main plutot que d'un traceur mecanique
function humanEase(t) {
  if (t < 0.5) return 2 * t * t;
  const eased = 1 - Math.pow(-2 * t + 2, 2) / 2;
  const overshoot = Math.sin(t * Math.PI) * 0.04;
  return Math.min(1, eased + (t > 0.75 ? overshoot * (1 - t) * 4 : 0));
}

function quadBezierPoint(p0, c, p1, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
    y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
  };
}

// deplace le curseur de `from` a `to` le long d'une courbe legerement
// bombee (pas une ligne droite), a une vitesse proportionnelle a la
// distance (comme un vrai geste : loin = plus long, court = plus vif)
function moveFakeCursorAlong(cursor, from, to, onDone) {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const duration = Math.min(1200, 180 + dist * (0.9 + Math.random() * 0.5));

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const norm = dist || 1;
  // decalage perpendiculaire au segment direct -> trajectoire courbe,
  // jamais deux fois la meme (signe et amplitude aleatoires)
  const curveAmount = (Math.random() * 0.6 - 0.3) * dist * 0.5;
  const perpX = -dy / norm;
  const perpY = dx / norm;
  const control = { x: midX + perpX * curveAmount, y: midY + perpY * curveAmount };

  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const pos = quadBezierPoint(from, control, to, humanEase(t));
    cursor.style.left = `${pos.x}px`;
    cursor.style.top = `${pos.y}px`;
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }

  requestAnimationFrame(step);
}

function animateFakeCursor(cursor, waypoints, index, current, onDone) {
  if (index >= waypoints.length) {
    cursor.style.transition = "opacity 0.35s ease";
    cursor.style.opacity = "0";
    setTimeout(() => {
      cursor.remove();
      onDone();
    }, 350);
    return;
  }

  const target = { x: waypoints[index][0], y: waypoints[index][1] };
  moveFakeCursorAlong(cursor, current, target, () => {
    // pause hesitante occasionnelle entre deux gestes, comme une vraie
    // main qui s'arrete un instant avant de repartir
    const pause = Math.random() < 0.35 ? 90 + Math.random() * 280 : 15 + Math.random() * 90;
    setTimeout(() => animateFakeCursor(cursor, waypoints, index + 1, target, onDone), pause);
  });
}

function triggerFakeCursor() {
  const cursor = buildFakeCursor();
  const start = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight };
  cursor.style.left = `${start.x}px`;
  cursor.style.top = `${start.y}px`;

  const waypointCount = 4 + Math.floor(Math.random() * 4);
  const waypoints = [];
  for (let i = 0; i < waypointCount; i++) {
    waypoints.push([Math.random() * window.innerWidth, Math.random() * window.innerHeight]);
  }

  requestAnimationFrame(() => {
    cursor.style.transition = "opacity 0.2s ease";
    cursor.style.opacity = "1";
    animateFakeCursor(cursor, waypoints, 0, start, () => {});
  });
}

// verifie toutes les 3 secondes, avec une chance de se declencher a chaque
// fois -- jamais permanent : chaque apparition se termine et disparait
// definitivement d'elle-meme (voir animateFakeCursor)
function scheduleFakeCursor() {
  if (Math.random() < 0.5) triggerFakeCursor();
  setTimeout(scheduleFakeCursor, 3000);
}

setTimeout(scheduleFakeCursor, 3000);

// ---- 3. GLITCH CURSOR ----
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
