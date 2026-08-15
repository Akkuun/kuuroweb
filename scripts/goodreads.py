"""Helper commun pour les scripts Goodreads : flux RSS officiel par etagere
(pas de scraping HTML, pas de cle API pour une etagere publique).

Reutilise par update_goodreads_manga.py et update_goodreads_books.py.
"""

import html
import re
import xml.etree.ElementTree as ET

from http_fetch import fetch

USER_ID = "194327776"


def _strip_html(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def fetch_shelf(shelf, count):
    """Recupere les `count` entrees les plus recemment lues d'une etagere
    Goodreads publique (triee par date de lecture, la plus recente d'abord)."""
    url = (
        f"https://www.goodreads.com/review/list_rss/{USER_ID}"
        f"?shelf={shelf}&sort=date_read&order=d"
    )
    xml_text = fetch(url)
    root = ET.fromstring(xml_text)
    items = root.findall("./channel/item")[:count]

    entries = []
    for item in items:
        title = (item.findtext("title") or "").strip()
        image = (
            item.findtext("book_medium_image_url")
            or item.findtext("book_image_url")
            or ""
        )
        review = _strip_html(item.findtext("user_review"))
        rating = item.findtext("user_rating") or "0"
        entries.append(
            {"title": title, "image": image, "review": review, "rating": rating}
        )
    return entries
