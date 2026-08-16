// rendu partage pour les pages d'archive (film/book/game-reviews.html) :
// charge un champ "liste complete" d'un data.json et affiche chaque entree
// en vignette + review, sans limite de nombre (contrairement à la page
// d'accueil qui n'en montre que quelques unes).

function archiveEl(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function archiveSetImage(node, src) {
  if (!src) return;
  const probe = new Image();
  probe.onload = () => {
    node.style.backgroundImage = `url("${src}")`;
    node.style.backgroundSize = "cover";
    node.style.backgroundPosition = "center";
  };
  probe.src = src;
}

async function renderArchive({ dataPath, field, imageKey, container }) {
  const res = await fetch(dataPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`impossible de charger ${dataPath}`);
  const data = await res.json();
  const list = document.getElementById(container);

  const entries = data[field] || [];
  if (!entries.length) {
    list.textContent = "Rien pour l'instant.";
    return;
  }

  entries.forEach((item) => {
    const row = archiveEl("div", "archive-item");

    const cover = archiveEl("div", "archive-cover");
    archiveSetImage(cover, item[imageKey]);
    row.appendChild(cover);

    const info = archiveEl("div", "archive-info");

    const title = archiveEl("h3");
    title.textContent = item.title || "";
    info.appendChild(title);

    const ratingValue = parseFloat(item.rating);
    if (ratingValue) {
      const full = Math.round(ratingValue);
      const stars = archiveEl("div", "stars");
      stars.textContent = "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
      info.appendChild(stars);
    }

    const paragraphs = Array.isArray(item.review_en)
      ? item.review_en
      : Array.isArray(item.review)
        ? item.review
        : item.review
          ? [item.review]
          : [];
    paragraphs.forEach((text) => {
      const p = archiveEl("p");
      p.textContent = text;
      info.appendChild(p);
    });

    row.appendChild(info);
    list.appendChild(row);
  });
}
