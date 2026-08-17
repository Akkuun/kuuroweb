// rendu de la liste de changelog, partagé entre changelog.html (page
// complète) et le widget CHANGELOG de index.html (aperçu défilant) --
// mêmes données (data/changelog/data.json), pas de contenu en dur.

async function loadChangelogData() {
  const res = await fetch("data/changelog/data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("impossible de charger data/changelog/data.json");
  return res.json();
}

function buildChangelogEntry(entry) {
  const wrap = document.createElement("div");
  wrap.className = "changelog-entry";

  const date = document.createElement("div");
  date.className = "changelog-date";
  date.textContent = entry.date || "";
  wrap.appendChild(date);

  const ul = document.createElement("ul");
  (entry.items || []).forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });
  wrap.appendChild(ul);

  return wrap;
}

// `limit` optionnel : n'affiche que les N entrées les plus récentes (widget
// compact) -- omis ou 0 = toutes les entrées (page changelog complète)
async function renderChangelogInto(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const data = await loadChangelogData();
  let entries = data.entries || [];
  if (limit) entries = entries.slice(0, limit);
  entries.forEach((entry) => container.appendChild(buildChangelogEntry(entry)));
}
