#!/usr/bin/env python3
"""Met a jour data/game/data.json (favorite_games et last_review) depuis le
compte Backloggd Akkuunamatata :
- favoris : https://backloggd.com/u/Akkuunamatata/  (section "Favorite Games")
- reviews : https://backloggd.com/u/Akkuunamatata/reviews/

Backloggd n'a pas d'API/RSS officielle -> scraping HTML. highly_anticipated
et physical_consoles_owned ne viennent pas de Backloggd et restent inchanges.
"""

import html
import json
import re
from pathlib import Path

from http_fetch import fetch
from translate import paragraphs_to_english

USERNAME = "Akkuunamatata"
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "game" / "data.json"

FAVORITES_COUNT = 5
REVIEWS_COUNT = 3
# backloggd n'a pas de RSS/API : la page /reviews/ est paginee via
# ?page=N (15 reviews par page) -> fetch_reviews parcourt les pages
# jusqu'a en trouver une vide ou incomplete pour recuperer le total reel
ARCHIVE_COUNT = 100


def fetch_favorite_games():
    profile_html = fetch(f"https://backloggd.com/u/{USERNAME}/")

    start = profile_html.find('id="profile-favorites"')
    end = profile_html.find('profile-section-header', start)
    section_html = profile_html[start:end]

    cards = re.findall(
        r'<img class="lazy card-img height" src="[^"]*" alt="([^"]+)" data-src="([^"]+)"',
        section_html,
    )

    favorites = []
    for title, image in cards[:FAVORITES_COUNT]:
        favorites.append({"title": html.unescape(title), "image": image})
    return favorites


def fetch_reviews(count):
    reviews = []
    page = 1
    max_pages = 20  # garde-fou pour eviter une boucle infinie

    while len(reviews) < count and page <= max_pages:
        reviews_html = fetch(f"https://backloggd.com/u/{USERNAME}/reviews?page={page}")
        chunks = reviews_html.split('<div class="row pt-2 pb-1 review-card">')[1:]
        if not chunks:
            break

        for chunk in chunks:
            if len(reviews) >= count:
                break
            card_html = chunk.split("<hr>")[0]

            cover_match = re.search(
                r'<img class="card-img height" src="([^"]+)" alt="([^"]+)"', card_html
            )
            if not cover_match:
                continue
            image, title = cover_match.group(1), html.unescape(cover_match.group(2))

            rating_match = re.search(r'class="stars-top" style="width:(\d+)%"', card_html)
            rating = round(int(rating_match.group(1)) / 100 * 5, 1) if rating_match else 0

            # backloggd n'ajoute la classe "collapse" que sur les reviews assez
            # longues pour avoir un bouton "show more" -> les reviews courtes
            # ont juste class=" mb-0 card-text", d'ou le [^"]* permissif
            body_match = re.search(
                r'class="[^"]*card-text[^"]*"[^>]*>(.*?)</div>', card_html, re.DOTALL
            )
            review_paragraphs = []
            if body_match:
                body = body_match.group(1)
                # chaque <br> (simple ou double) devient un saut de ligne a part
                # entiere : les puces "- xxxx" ne doivent pas s'enchainer sur la
                # meme ligne dans le bloc review
                body = re.sub(r"<br\s*/?>", "\n", body)
                body = html.unescape(re.sub(r"<[^>]+>", "", body))
                review_paragraphs = [p.strip() for p in body.split("\n") if p.strip()]

            reviews.append(
                {
                    "title": title,
                    "cover": image,
                    "rating": rating,
                    "review": review_paragraphs,
                    "review_en": paragraphs_to_english(review_paragraphs),
                }
            )

        if len(chunks) < 15:
            # page incomplete -> c'etait la derniere
            break
        page += 1

    return reviews


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    data["favorite_games"] = [
        {"title": e["title"], "cover": e["image"]} for e in fetch_favorite_games()
    ]
    # une seule requete : la page d'accueil affiche les REVIEWS_COUNT
    # premieres, la page d'archive (game-reviews.html) affiche tout le lot
    archive = fetch_reviews(ARCHIVE_COUNT)
    data["last_review"] = archive[:REVIEWS_COUNT]
    data["all_reviews"] = archive

    DATA_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(
        f"data/game/data.json mis a jour : "
        f"{len(data['favorite_games'])} favoris, "
        f"{len(data['all_reviews'])} reviews au total"
    )


if __name__ == "__main__":
    main()
