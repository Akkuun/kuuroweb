"""Fetch HTTP partage par tous les scripts de recuperation.

On shell out a curl plutot que d'utiliser urllib : plusieurs des sites
cibles (Letterboxd, Backloggd) bloquent le fingerprint TLS d'urllib via
Cloudflare (403) alors que curl passe sans probleme.
"""

import subprocess

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)


def fetch(url):
    result = subprocess.run(
        ["curl", "-s", "-A", USER_AGENT, "--fail", url],
        capture_output=True,
        timeout=20,
        check=True,
    )
    return result.stdout.decode("utf-8")
