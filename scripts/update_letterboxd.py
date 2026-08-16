#!/usr/bin/env python3
"""Recupere les favoris et les dernieres reviews Letterboxd et met a jour
data/film/data.json (uniquement les champs favorite_films et
last_on_letterboxd -- last_4k_bought et highly_anticipated ne viennent pas
de Letterboxd et restent inchanges).

Seule dependance externe : argostranslate (traduction EN 100% locale, voir
translate.py). Le reste ne s'appuie que sur la stdlib + curl.
"""

import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from http_fetch import fetch
from translate import paragraphs_to_english

USERNAME = "Akkuunamatata"
NS = {"letterboxd": "https://letterboxd.com"}
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "film" / "data.json"

RECENT_REVIEWS_COUNT = 3
# le flux RSS de letterboxd ne renvoie de toute facon jamais plus qu'une
# cinquantaine d'entrees -> 100 pour ne jamais tronquer avant la vraie limite
# imposee par letterboxd lui-meme
ARCHIVE_REVIEWS_COUNT = 100
FAVORITES_COUNT = 5


def fetch_recent_reviews(count):
    xml_text = fetch(f"https://letterboxd.com/{USERNAME}/rss/")
    root = ET.fromstring(xml_text)
    items = root.findall("./channel/item")[:count]

    reviews = []
    for item in items:
        film_title = item.findtext("letterboxd:filmTitle", namespaces=NS) or ""
        film_year = item.findtext("letterboxd:filmYear", namespaces=NS) or ""
        rating = item.findtext("letterboxd:memberRating", namespaces=NS) or ""
        description = item.findtext("description") or ""

        image_match = re.search(r'<img src="([^"]+)"', description)
        image = image_match.group(1) if image_match else ""

        # le premier <p> de la description est juste l'affiche, le texte de
        # review (s'il y en a un) vient dans les <p> suivants
        paragraphs = re.findall(r"<p>(.*?)</p>", description, re.DOTALL)
        review_paragraphs = [
            html.unescape(re.sub(r"<[^>]+>", "", p)).strip() for p in paragraphs[1:]
        ]
        review_paragraphs = [p for p in review_paragraphs if p]

        reviews.append(
            {
                "title": f"{film_title} ({film_year})".strip(),
                "image": image,
                "rating": rating,
                "review": review_paragraphs,
                "review_en": paragraphs_to_english(review_paragraphs),
            }
        )
    return reviews


def fetch_favorite_films():
    profile_html = fetch(f"https://letterboxd.com/{USERNAME}/")
    section_match = re.search(
        r'<section id="favourites".*?</section>', profile_html, re.DOTALL
    )
    if not section_match:
        return []
    section_html = section_match.group(0)

    entries = re.findall(
        r'data-item-slug="([^"]+)"\s+data-item-link="[^"]*"\s+'
        r'data-item-full-display-name="([^"]+)"',
        section_html,
    )
    if not entries:
        # ordre des attributs different : fallback plus permissif
        slugs = re.findall(r'data-item-slug="([^"]+)"', section_html)
        names = re.findall(r'data-item-full-display-name="([^"]+)"', section_html)
        entries = list(zip(slugs, names))

    favorites = []
    for slug, name in entries[:FAVORITES_COUNT]:
        image = ""
        try:
            film_page = fetch(f"https://letterboxd.com/film/{slug}/")
            image_match = re.search(
                r'<meta property="og:image" content="([^"]+)"', film_page
            )
            if image_match:
                image = image_match.group(1)
        except Exception as err:
            print(f"impossible de recuperer l'affiche de {slug}: {err}")

        favorites.append({"title": html.unescape(name), "image": image})
    return favorites


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    data["favorite_films"] = fetch_favorite_films()
    # une seule requete RSS : la page d'accueil affiche les RECENT_REVIEWS_COUNT
    # premieres, la page d'archive (film-reviews.html) affiche tout le lot
    archive = fetch_recent_reviews(ARCHIVE_REVIEWS_COUNT)
    data["last_on_letterboxd"] = archive[:RECENT_REVIEWS_COUNT]
    data["all_reviews"] = archive

    DATA_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(
        f"data/film/data.json mis a jour : "
        f"{len(data['favorite_films'])} favoris, "
        f"{len(data['all_reviews'])} reviews au total"
    )


if __name__ == "__main__":
    main()
