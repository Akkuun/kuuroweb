// charge les data.json de chaque bloc et peuple le HTML en conséquence.
// pensé pour être ré-exécuté après que des scripts (letterboxd/goodreads/backloggd)
// aient mis à jour les data.json au push : aucun contenu n'est écrit en dur ici.

async function loadJSON(path) {
  // no-store : les data.json sont réécrits régulièrement par les scripts
  // (letterboxd/goodreads/backloggd), un cache HTTP servirait du contenu
  // périmé au prochain chargement de la page.
  const res = await fetch(path, { cache: "no-store" });
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
function setBackgroundImage(node, src, size = "cover") {
  if (!src) return;
  const probe = new Image();
  probe.onload = () => {
    node.style.backgroundImage = `url("${src}")`;
    node.style.backgroundSize = size;
    node.style.backgroundPosition = "center";
  };
  probe.src = src;
}

function thumb(className, item, imageKey, titleKey = "title", bgSize = "cover") {
  const div = el("div", className);
  if (item[titleKey]) div.title = item[titleKey];
  setBackgroundImage(div, item[imageKey], bgSize);
  return div;
}

function stars(rating) {
  const value = parseFloat(rating);
  if (!value) return null;
  const full = Math.round(value);
  const node = el("div", "stars");
  node.textContent = "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
  node.title = `${value}/5`;
  return node;
}

// vignette + étoiles empilées, pour les entrées qui ont une note (rating)
function thumbWithRating(className, item, imageKey, titleKey = "title") {
  const wrap = el("div", "thumb-rating");
  wrap.appendChild(thumb(className, item, imageKey, titleKey));
  const starsNode = stars(item.rating);
  if (starsNode) wrap.appendChild(starsNode);
  return wrap;
}

// vignette + petit cœur doré, pour les rangées "favoris"
function thumbWithHeart(className, item, imageKey, titleKey = "title") {
  const wrap = el("div", "thumb-rating");
  wrap.appendChild(thumb(className, item, imageKey, titleKey));
  const heart = el("div", "heart");
  heart.textContent = "❤";
  wrap.appendChild(heart);
  return wrap;
}

// n'affiche que le texte traduit EN quand il existe, sinon le texte original
// (fallback pour les blocs qui n'ont pas encore de traduction, ex. les jeux)
function scrollableText(paragraphs, paragraphsEn) {
  const box = el("div", "scrollable-text");
  (paragraphs || []).forEach((text, i) => {
    const displayText = (paragraphsEn && paragraphsEn[i]) || text;
    const p = el("p");
    p.textContent = displayText;
    box.appendChild(p);
  });
  // certains navigateurs peuvent laisser un conteneur overflow:auto scrollé
  // ailleurs qu'en haut après remplissage dynamique : on force le début
  box.scrollTop = 0;
  return box;
}

function reviewItem(className, item, imageKey) {
  const wrap = el("div", "review-item");
  wrap.appendChild(thumbWithRating(className, item, imageKey));
  wrap.appendChild(scrollableText(item.review, item.review_en));
  return wrap;
}

function gameReviewRow(item) {
  const row = el("div", "game-review-row");
  row.appendChild(thumbWithRating("game-cover", item, "cover"));
  row.appendChild(scrollableText(item.review, item.review_en));
  return row;
}

// ---- FILM ----
async function renderFilm() {
  const data = await loadJSON("data/film/data.json");

  const favorites = document.getElementById("film-favorites");
  data.favorite_films.forEach((item) => favorites.appendChild(thumbWithHeart("poster", item, "image")));

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
    row.appendChild(thumbWithRating("book-cover", item, "cover"));
    row.appendChild(scrollableText([item.review || ""]));
    list.appendChild(row);
  });

  const lastRead = document.getElementById("book-last-read");
  (data.last_read || []).forEach((item) => lastRead.appendChild(thumb("book-cover", item, "cover")));
}

// ---- MANGA ----
async function renderManga() {
  const data = await loadJSON("data/manga/data.json");

  const lastRead = document.getElementById("manga-last-read");
  data.last_read.forEach((item) => lastRead.appendChild(thumbWithRating("manga-cover", item, "cover")));

  const favorite = document.getElementById("manga-favorite");
  data.favorite.forEach((item) => favorite.appendChild(thumb("manga-cover", item, "cover")));

  document.getElementById("manga-note").textContent = data.note || "";
}

// ---- COOL WEBSITE ----
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
  data.favorite_games.forEach((item) => favorites.appendChild(thumbWithHeart("game-cover", item, "cover")));

  const lastReview = document.getElementById("game-last-review");
  data.last_review.forEach((item) => lastReview.appendChild(gameReviewRow(item)));

  const anticipated = document.getElementById("game-anticipated");
  data.highly_anticipated.forEach((item) => anticipated.appendChild(thumb("game-cover", item, "cover")));
}

// ---- IMAGE TOUT À GAUCHE DU BLOC CENTRAL ----
// pas de crop : la largeur du conteneur s'ajuste au ratio réel de l'image.
// la hauteur vient de align-self:stretch (CSS) sur toute la hauteur de
// #page, donc du haut en bas de la page, pas juste calée sur #site.
async function renderSiteImage() {
  const data = await loadJSON("data/site-image/data.json");
  const node = document.getElementById("site-image");
  if (data.credit) node.title = data.credit;

  if (!data.image) return;

  const probe = new Image();
  probe.onload = () => {
    node.style.backgroundImage = `url("${data.image}")`;
    node.style.backgroundSize = "contain";
    node.style.backgroundPosition = "center";
    node.style.backgroundRepeat = "no-repeat";
    const ratio = probe.naturalWidth / probe.naturalHeight;
    node.style.width = `${node.getBoundingClientRect().height * ratio}px`;
  };
  probe.src = data.image;
}

// ---- LAST POLAROID ----
async function renderPolaroid() {
  const data = await loadJSON("data/polaroid/data.json");
  setBackgroundImage(document.getElementById("polaroid-photo"), data.photo);
}

// ---- BANDE MARQUEE : icône + nom + lien cliquable par réseau social ----
// deux groupes identiques (pas une liste d'items à plat) : chaque groupe
// inclut son propre gap de fin dans sa largeur, donc les deux groupes ont
// une largeur strictement égale et translateX(-50%) tombe pile sur la
// frontière -> plus de saut visible ("rollback") à la reprise de la boucle.
function buildMarqueeGroup(items) {
  const group = el("div", "marquee-group");
  items.forEach((item) => {
    const a = el("a", "marquee-item");
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener";

    const icon = el("span", "marquee-item-icon");
    setBackgroundImage(icon, item.icon, "contain");
    a.appendChild(icon);

    a.appendChild(document.createTextNode(item.label));

    group.appendChild(a);
  });
  return group;
}

async function renderMarquee() {
  const data = await loadJSON("data/marquee/data.json");
  const track = document.getElementById("marquee-content");
  track.appendChild(buildMarqueeGroup(data.items));
  track.appendChild(buildMarqueeGroup(data.items));
}

// ---- MUSIC : une ligne par piste (titre), celle en cours surlignée en violet ----
// local plutôt qu'en ligne : pas de dépendance à un hébergeur externe (ni
// CORS, ni lien mort), et Nekoweb sert très bien de simples fichiers statiques.
async function renderMusic() {
  const data = await loadJSON("data/music/data.json");
  const container = document.getElementById("music-player");
  const tracks = data.tracks || [];
  if (!tracks.length) return;

  const audio = el("audio");
  audio.controls = true;

  const list = el("div", "track-list");
  const rows = [];

  function play(i) {
    rows.forEach((row, j) => row.classList.toggle("active", j === i));
    audio.src = tracks[i].src;
    audio.play();
  }

  tracks.forEach((track, i) => {
    const row = el("div", "track-row");
    row.textContent = track.title || track.src;
    row.addEventListener("click", () => play(i));
    list.appendChild(row);
    rows.push(row);
  });

  audio.addEventListener("ended", () => {
    const current = rows.findIndex((row) => row.classList.contains("active"));
    play((current + 1) % tracks.length);
  });

  container.appendChild(list);
  container.appendChild(audio);
}

// ---- CHAT : shoutbox Cbox (cbox.ws) ----
async function renderChat() {
  const data = await loadJSON("data/chat/data.json");
  const container = document.getElementById("chat-embed");
  if (!data.cbox_boxid || !data.cbox_boxtag) return;

  const iframe = el("iframe");
  iframe.src = `https://www5.cbox.ws/box/?boxid=${data.cbox_boxid}&boxtag=${data.cbox_boxtag}`;
  iframe.width = "100%";
  iframe.height = "100%";
  iframe.frameBorder = "0";
  iframe.allowTransparency = "true";
  container.appendChild(iframe);
}

// ---- FOLLOW ----
async function renderFollow() {
  const data = await loadJSON("data/follow/data.json");

  // même bouton que Follow, réaffiché dans le bloc "My Button" sous Book
  setBackgroundImage(document.getElementById("my-button"), data.site_button);

  if (data.site_button) {
    const buttonUrl = new URL(data.site_button, location.href).href;
    document.getElementById("my-button-code").value =
      `<a href="${location.origin}" target="_blank">\n` +
      `  <img src="${buttonUrl}" width="88" height="31">\n` +
      `</a>`;
  }

  const copyBtn = document.getElementById("copy-code-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          document.getElementById("my-button-code").value
        );
        copyBtn.textContent = "✓";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.textContent = "📋";
          copyBtn.classList.remove("copied");
        }, 1200);
      } catch (err) {
        console.error(err);
      }
    });
  }

  const countEl = document.getElementById("follow-count");
  if (data.nekoweb_domain && countEl) {
    try {
      const res = await fetch(
        `https://nekoweb.org/api/site/info/${data.nekoweb_domain}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const info = await res.json();
        countEl.textContent = `${info.followers} follower${info.followers === 1 ? "" : "s"}`;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// chaque bloc se charge indépendamment : si un data.json manque ou est mal
// formé, ça ne doit pas empêcher les autres blocs de s'afficher.
[
  renderFilm,
  renderAboutMe,
  renderBook,
  renderManga,
  renderAnime,
  renderGame,
  renderSiteImage,
  renderPolaroid,
  renderMarquee,
  renderMusic,
  renderChat,
  renderFollow,
].forEach((fn) => fn().catch((err) => console.error(err)));
