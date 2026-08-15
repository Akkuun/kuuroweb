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


def fetch_reviews():
    reviews_html = fetch(f"https://backloggd.com/u/{USERNAME}/reviews/")

    chunks = reviews_html.split('<div class="row pt-2 pb-1 review-card">')[1:]

    reviews = []
    for chunk in chunks[:REVIEWS_COUNT]:
        card_html = chunk.split("<hr>")[0]

        cover_match = re.search(
            r'<img class="card-img height" src="([^"]+)" alt="([^"]+)"', card_html
        )
        if not cover_match:
            continue
        image, title = cover_match.group(1), html.unescape(cover_match.group(2))

        rating_match = re.search(r'class="stars-top" style="width:(\d+)%"', card_html)
        rating = round(int(rating_match.group(1)) / 100 * 5, 1) if rating_match else 0

        body_match = re.search(
            r'class="collapse mb-0 card-text"[^>]*>(.*?)</div>', card_html, re.DOTALL
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
    return reviews


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    data["favorite_games"] = [
        {"title": e["title"], "cover": e["image"]} for e in fetch_favorite_games()
    ]
    data["last_review"] = fetch_reviews()

    DATA_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(
        f"data/game/data.json mis a jour : "
        f"{len(data['favorite_games'])} favoris, "
        f"{len(data['last_review'])} reviews recentes"
    )


if __name__ == "__main__":
    main()
