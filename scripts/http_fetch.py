"""Fetch HTTP partage par tous les scripts de recuperation.

On shell out a curl plutot que d'utiliser urllib : plusieurs des sites
cibles (Letterboxd, Backloggd) bloquent le fingerprint TLS d'urllib via
Cloudflare (403) alors que curl passe sans probleme.

Depuis une CI (GitHub Actions), l'IP du runner (plage cloud connue et tres
sollicitee) se fait bloquer par Cloudflare bien plus facilement qu'une IP
residentielle, meme avec un User-Agent credible -- des en-tetes plus
complets (Accept/Accept-Language/Referer, comme un vrai navigateur) aident
parfois, mais ne garantissent pas de passer un blocage base sur l'IP.
"""

import subprocess

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def fetch(url):
    result = subprocess.run(
        [
            "curl", "-s", "-A", USER_AGENT, "--fail",
            "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "-H", "Accept-Language: en-US,en;q=0.9,fr;q=0.8",
            "-H", f"Referer: {url}",
            url,
        ],
        capture_output=True,
        timeout=20,
        check=True,
    )
    return result.stdout.decode("utf-8")
