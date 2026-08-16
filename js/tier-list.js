// page tier-list : grille de grosses icones cliquables, une par tier list.
// Cliquer une icone affiche l'image complete de cette tier list en grand
// (lightbox plein ecran).
async function initTierList() {
  const res = await fetch("data/tier-list/data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("impossible de charger data/tier-list/data.json");
  const data = await res.json();

  const grid = document.getElementById("tier-list-grid");
  const lightbox = document.getElementById("tier-list-lightbox");
  const lightboxImg = document.getElementById("tier-list-lightbox-img");
  const closeBtn = document.getElementById("tier-list-lightbox-close");

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt;
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
  }

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  (data.lists || []).forEach((tier) => {
    const wrap = document.createElement("div");
    wrap.className = "tier-list-icon";

    const thumb = document.createElement("div");
    thumb.className = "tier-list-icon-thumb";
    // n'applique le fond que si la vignette existe vraiment (sinon le
    // motif en croix du placeholder reste visible, meme pattern que
    // partout ailleurs sur le site)
    const probe = new Image();
    probe.onload = () => {
      thumb.style.backgroundImage = `url("${tier.thumbnail}")`;
      thumb.style.backgroundSize = "cover";
      thumb.style.backgroundPosition = "center";
    };
    probe.src = tier.thumbnail;

    const label = document.createElement("div");
    label.className = "tier-list-icon-label";
    label.textContent = tier.title || "";
    if (tier.jp) {
      const jp = document.createElement("span");
      jp.className = "jp";
      jp.textContent = tier.jp;
      label.appendChild(document.createTextNode(" "));
      label.appendChild(jp);
    }

    wrap.appendChild(thumb);
    wrap.appendChild(label);
    wrap.addEventListener("click", () => openLightbox(tier.image, tier.title || ""));

    grid.appendChild(wrap);
  });
}

initTierList().catch((err) => console.error(err));
