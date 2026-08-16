#!/usr/bin/env python3
"""Met a jour data/book/data.json (books + last_read + all_reviews) depuis
l'etagere Goodreads "roman" :
https://www.goodreads.com/review/list/194327776?tag=roman

- books : les 2 plus recents, avec review traduite FR -> EN (voir
  translate.py, puisque seul le texte EN est affiche sur le site)
- last_read : une liste plus large (juste titre + couverture, sans review)
- all_reviews : tout le lot recupere, avec review traduite -- pour la page
  d'archive book-reviews.html
"""

import json
from pathlib import Path

from goodreads import fetch_shelf
from translate import to_english

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "book" / "data.json"
BOOKS_COUNT = 2
LAST_READ_COUNT = 6
ARCHIVE_COUNT = 30


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    entries = fetch_shelf("roman", ARCHIVE_COUNT)

    data["books"] = [
        {
            "title": e["title"],
            "cover": e["image"],
            "rating": e["rating"],
            "review": to_english(e["review"]) if e["review"] else "",
        }
        for e in entries[:BOOKS_COUNT]
    ]
    data["last_read"] = [
        {"title": e["title"], "cover": e["image"]} for e in entries[:LAST_READ_COUNT]
    ]
    data["all_reviews"] = [
        {
            "title": e["title"],
            "cover": e["image"],
            "rating": e["rating"],
            "review": to_english(e["review"]) if e["review"] else "",
        }
        for e in entries
    ]

    DATA_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(
        f"data/book/data.json mis a jour : "
        f"{len(data['books'])} livres avec review, {len(data['last_read'])} en last_read, "
        f"{len(data['all_reviews'])} en archive"
    )


if __name__ == "__main__":
    main()
