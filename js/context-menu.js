// menu clic droit personnalisé, façon vieux site perso, à la place du menu
// natif du navigateur.

const CONTEXT_MENU_ITEMS = [
  { label: "Reload", action: () => location.reload() },
  { label: "Home", action: () => { location.href = "index.html"; } },
  { label: "Profile", action: () => { location.href = "profil.html"; } },
  { label: "Guestbook", action: () => { location.href = "guestbook.html"; } },
  { label: "All film reviews", action: () => { location.href = "film-reviews.html"; } },
  { label: "All book reviews", action: () => { location.href = "book-reviews.html"; } },
  { label: "All game reviews", action: () => { location.href = "game-reviews.html"; } },
  { label: "Tier list", action: () => { location.href = "tier-list.html"; } },
  { label: "Copy page link", action: () => navigator.clipboard.writeText(location.href) },
];

function closeContextMenu() {
  const existing = document.getElementById("custom-context-menu");
  if (existing) existing.remove();
}

function showContextMenu(x, y) {
  closeContextMenu();

  const menu = document.createElement("div");
  menu.id = "custom-context-menu";
  menu.className = "context-menu";

  CONTEXT_MENU_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "context-menu-item";
    row.textContent = item.label;
    row.addEventListener("click", () => {
      item.action();
      closeContextMenu();
    });
    menu.appendChild(row);
  });

  document.body.appendChild(menu);

  // repositionne si ça dépasse de l'écran
  const rect = menu.getBoundingClientRect();
  const left = Math.min(x, window.innerWidth - rect.width - 4);
  const top = Math.min(y, window.innerHeight - rect.height - 4);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  document.addEventListener("click", closeContextMenu, { once: true });
}

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});
