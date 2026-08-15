// charge les data.json de chaque bloc et peuple le HTML en conséquence.
// pensé pour être ré-exécuté après que des scripts (letterboxd/goodreads/backloggd)
// aient mis à jour les data.json au push : aucun contenu n'est écrit en dur ici.

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`impossible de charger ${path}`);
  return res.json();
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// n'applique le fond que si l'image existe vraiment (évite d'écraser le
// motif en croix de la CSS avec une image cassée tant que le fichier
// n'a pas été déposé dans img/)
function setBackgroundImage(node, src) {
  if (!src) return;
  const probe = new Image();
  probe.onload = () => {
    node.style.backgroundImage = `url("${src}")`;
    node.style.backgroundSize = "cover";
    node.style.backgroundPosition = "center";
  };
  probe.src = src;
}

function thumb(className, item, imageKey, titleKey = "title") {
  const div = el("div", className);
  if (item[titleKey]) div.title = item[titleKey];
  setBackgroundImage(div, item[imageKey]);
  return div;
}

function scrollableText(paragraphs) {
  const box = el("div", "scrollable-text");
  (paragraphs || []).forEach((text) => {
    const p = el("p");
    p.textContent = text;
    box.appendChild(p);
  });
  return box;
}

function reviewItem(className, item, imageKey) {
  const wrap = el("div", "review-item");
  wrap.appendChild(thumb(className, item, imageKey));
  wrap.appendChild(scrollableText(item.review));
  return wrap;
}

function gameReviewRow(item) {
  const row = el("div", "game-review-row");
  row.appendChild(thumb("game-cover", item, "cover"));
  row.appendChild(scrollableText(item.review));
  return row;
}

// ---- FILM ----
async function renderFilm() {
  const data = await loadJSON("data/film/data.json");

  const favorites = document.getElementById("film-favorites");
  data.favorite_films.forEach((item) => favorites.appendChild(thumb("poster", item, "image")));

  const letterboxd = document.getElementById("film-letterboxd");
  data.last_on_letterboxd.forEach((item) => letterboxd.appendChild(reviewItem("poster", item, "image")));

  const fourK = document.getElementById("film-4k");
  data.last_4k_bought.forEach((item) => fourK.appendChild(thumb("dvd-cover", item, "image")));

  const anticipated = document.getElementById("film-anticipated");
  data.highly_anticipated.forEach((item) => anticipated.appendChild(thumb("poster", item, "image")));
}

// ---- ABOUT ME ----
async function renderAboutMe() {
  const data = await loadJSON("data/about-me/data.json");

  document.getElementById("pseudo-title").textContent = data.pseudo || "";
  setBackgroundImage(document.getElementById("about-me-photo"), data.photo);
  document.getElementById("about-me-bio").textContent = data.bio || "";
}

// ---- BOOK ----
async function renderBook() {
  const data = await loadJSON("data/book/data.json");
  const list = document.getElementById("book-list");

  data.books.forEach((item) => {
    const row = el("div", "book-item-row");
    row.appendChild(thumb("book-cover", item, "cover"));
    const p = el("p", "review-text");
    p.textContent = item.review || "";
    row.appendChild(p);
    list.appendChild(row);
  });
}

// ---- MANGA ----
async function renderManga() {
  const data = await loadJSON("data/manga/data.json");

  const lastRead = document.getElementById("manga-last-read");
  data.last_read.forEach((item) => lastRead.appendChild(thumb("manga-cover", item, "cover")));

  const favorite = document.getElementById("manga-favorite");
  data.favorite.forEach((item) => favorite.appendChild(thumb("manga-cover", item, "cover")));
}

// ---- FAVORITE ANIME ----
async function renderAnime() {
  const data = await loadJSON("data/anime/data.json");
  const favorite = document.getElementById("anime-favorite");
  data.favorite_anime.forEach((item) => favorite.appendChild(thumb("anime-thumb", item, "image")));
}

// ---- PHYSICAL VIDEO GAME ----
async function renderGame() {
  const data = await loadJSON("data/game/data.json");

  const favorites = document.getElementById("game-favorites");
  data.favorite_games.forEach((item) => favorites.appendChild(thumb("game-cover", item, "cover")));

  const lastReview = document.getElementById("game-last-review");
  data.last_review.forEach((item) => lastReview.appendChild(gameReviewRow(item)));

  const anticipated = document.getElementById("game-anticipated");
  data.highly_anticipated.forEach((item) => anticipated.appendChild(gameReviewRow(item)));

  const consoles = document.getElementById("game-consoles");
  data.physical_consoles_owned.forEach((item) => consoles.appendChild(thumb("console-thumb", item, "icon", "name")));
}

// ---- LAST POLAROID ----
async function renderPolaroid() {
  const data = await loadJSON("data/polaroid/data.json");
  setBackgroundImage(document.getElementById("polaroid-photo"), data.photo);
}

// ---- BANDE MARQUEE ----
async function renderMarquee() {
  const data = await loadJSON("data/marquee/data.json");
  const track = document.getElementById("marquee-content");

  // dupliqué pour boucler le défilement sans coupure
  const items = [...data.items, ...data.items];
  items.forEach((text) => {
    const span = el("span", "marquee-item");
    span.textContent = text;
    track.appendChild(span);
  });
}

// chaque bloc se charge indépendamment : si un data.json manque ou est mal
// formé, ça ne doit pas empêcher les autres blocs de s'afficher.
[renderFilm, renderAboutMe, renderBook, renderManga, renderAnime, renderGame, renderPolaroid, renderMarquee]
  .forEach((fn) => fn().catch((err) => console.error(err)));
