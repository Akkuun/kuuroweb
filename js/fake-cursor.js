// faux curseur : uniquement sur la page principale (index.html), pas sur
// les autres pages -- voir js/cursor-effects.js pour les traits/rafales de
// glitch, qui restent partages sur toutes les pages.
//
// Un faux pointeur secondaire apparait de temps en temps (rarement, jamais
// permanent) et se deplace tout seul avec un trajet realiste (plusieurs
// points, vitesse variable) avant de disparaitre -- donne l'impression
// furtive d'avoir perdu le controle. Reprend le motif du vrai curseur
// (classe .cursor-effects-custom, posee par js/cursor-effects.js) si ce
// dernier a charge correctement.

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
