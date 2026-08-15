#!/usr/bin/env python3
"""Met a jour data/manga/data.json (uniquement last_read) depuis l'etagere
Goodreads "manga" : https://www.goodreads.com/review/list/194327776?shelf=manga

"favorite" n'est pas derive de Goodreads (pas de notion de favori sur une
etagere de lecture) et reste inchange.
"""

import json
from pathlib import Path

from goodreads import fetch_shelf

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "manga" / "data.json"
COUNT = 3


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))

    entries = fetch_shelf("manga", COUNT)
    data["last_read"] = [
        {"title": e["title"], "cover": e["image"], "rating": e["rating"]}
        for e in entries
    ]

    DATA_PATH.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"data/manga/data.json mis a jour : {len(data['last_read'])} derniers mangas lus")


if __name__ == "__main__":
    main()
