#!/usr/bin/env python3
"""Petit serveur de dev local qui desactive tout cache HTTP (Cache-Control:
no-store) sur chaque reponse. Sert uniquement a fiabiliser les tests locaux
pendant le developpement -- inutile en production (Nekoweb gere son propre
cache), ne pas confondre avec le site lui-meme.
"""

import http.server
from pathlib import Path

PORT = 8123


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    http.server.SimpleHTTPRequestHandler.directory = str(root)
    with http.server.ThreadingHTTPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"serveur sans cache sur http://localhost:{PORT} (racine: {root})")
        httpd.serve_forever()
