// rendu partage pour les pages d'archive (film/book/game-reviews.html) :
// charge un champ "liste complete" d'un data.json et affiche chaque entree
// en vignette + review, avec pagination (pas de scroll infini).

const ARCHIVE_PAGE_SIZE = 10;

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

function archiveRenderItem(item, imageKey) {
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
  return row;
}

async function renderArchive({ dataPath, field, imageKey, container }) {
  const res = await fetch(dataPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`impossible de charger ${dataPath}`);
  const data = await res.json();
  const root = document.getElementById(container);

  const entries = data[field] || [];
  if (!entries.length) {
    root.textContent = "Rien pour l'instant.";
    return;
  }

  const itemsEl = archiveEl("div", "archive-items");
  const pagerEl = archiveEl("div", "archive-pager");
  root.appendChild(itemsEl);
  root.appendChild(pagerEl);

  const pageCount = Math.max(1, Math.ceil(entries.length / ARCHIVE_PAGE_SIZE));
  let currentPage = 1;

  function renderPage(page) {
    currentPage = Math.min(Math.max(1, page), pageCount);
    itemsEl.innerHTML = "";
    const start = (currentPage - 1) * ARCHIVE_PAGE_SIZE;
    entries
      .slice(start, start + ARCHIVE_PAGE_SIZE)
      .forEach((item) => itemsEl.appendChild(archiveRenderItem(item, imageKey)));
    renderPager();
    itemsEl.scrollIntoView({ block: "start", behavior: "instant" });
  }

  function pagerButton(label, page, opts = {}) {
    const btn = archiveEl("button", "archive-pager-btn");
    btn.type = "button";
    btn.textContent = label;
    if (opts.active) btn.classList.add("active");
    if (opts.disabled) btn.disabled = true;
    btn.addEventListener("click", () => renderPage(page));
    return btn;
  }

  function renderPager() {
    pagerEl.innerHTML = "";
    if (pageCount <= 1) return;

    pagerEl.appendChild(
      pagerButton("← Prev", currentPage - 1, { disabled: currentPage === 1 })
    );

    for (let p = 1; p <= pageCount; p++) {
      pagerEl.appendChild(pagerButton(String(p), p, { active: p === currentPage }));
    }

    pagerEl.appendChild(
      pagerButton("Next →", currentPage + 1, { disabled: currentPage === pageCount })
    );
  }

  renderPage(1);
}
