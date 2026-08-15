#!/usr/bin/env python3
"""Met a jour data/book/data.json (uniquement books) depuis l'etagere Goodreads
"roman" : https://www.goodreads.com/review/list/194327776?tag=roman

Les reviews sont traduites FR -> EN (voir translate.py) avant d'etre ecrites,
puisque seul le texte EN est affiche sur le site.
"""

import json
from pathlib import Path

from goodreads import fetch_shelf
from translate import to_english

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "book" / "data.json"
COUNT = 2


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    entries = fetch_shelf("roman", COUNT)
    data["books"] = [
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
    print(f"data/book/data.json mis a jour : {len(data['books'])} derniers livres lus")


if __name__ == "__main__":
    main()
