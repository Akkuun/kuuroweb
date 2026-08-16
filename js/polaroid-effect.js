// effet "carte holographique" façon carte Pokémon sur le polaroid : le tilt
// 3D et la position du reflet arc-en-ciel suivent la souris (voir le CSS de
// .polaroid-photo pour comment ces variables sont utilisées).
(function () {
  const card = document.getElementById("polaroid-photo");
  if (!card) return;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const rotateY = (x - 50) / 4;
    const rotateX = (50 - y) / 4;

    card.style.setProperty("--holo-x", `${x}%`);
    card.style.setProperty("--holo-y", `${y}%`);
    card.style.setProperty("--holo-rx", `${rotateX}deg`);
    card.style.setProperty("--holo-ry", `${rotateY}deg`);
    card.style.setProperty("--holo-scale", "1.08");
  });

  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--holo-rx", "0deg");
    card.style.setProperty("--holo-ry", "0deg");
    card.style.setProperty("--holo-scale", "1");
  });

  // pulses de "glitch" chromatique tres brefs et irreguliers, en plus du
  // shader de distorsion permanent (voir #polaroid-shader dans index.html
  // + .polaroid-photo dans style.css) -- rend la photo legerement
  // instable/inquietante plutot que juste holographique
  function schedulePolaroidGlitch() {
    card.classList.add("glitching");
    setTimeout(() => card.classList.remove("glitching"), 90 + Math.random() * 220);
    setTimeout(schedulePolaroidGlitch, 3500 + Math.random() * 8000);
  }
  setTimeout(schedulePolaroidGlitch, 2500 + Math.random() * 4000);
})();
