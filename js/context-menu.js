// menu clic droit personnalisé, façon vieux site perso, à la place du menu
// natif du navigateur.

const CONTEXT_MENU_ITEMS = [
  { label: "↻ Reload", action: () => location.reload() },
  {
    label: "✉ Guestbook",
    action: () => window.open("https://nekoweb.org/guestbook?u=akkuunamatata", "_blank"),
  },
  { label: "📋 Copy page link", action: () => navigator.clipboard.writeText(location.href) },
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
