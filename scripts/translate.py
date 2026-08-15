"""Traduction FR -> EN 100% locale via Argos Translate (aucune API, aucune cle,
aucun appel reseau une fois le modele installe).

Reutilise par les differents scripts de recuperation (letterboxd, goodreads,
backloggd...) plutot que duplique dans chacun.
"""

import argostranslate.package
import argostranslate.translate

_installed = False


def _ensure_model_installed():
    global _installed
    if _installed:
        return

    installed_pairs = {
        (t.from_lang.code, t.to_lang.code)
        for lang in argostranslate.translate.get_installed_languages()
        for t in lang.translations_from
    }

    if ("fr", "en") not in installed_pairs:
        argostranslate.package.update_package_index()
        available = argostranslate.package.get_available_packages()
        pkg = next(p for p in available if p.from_code == "fr" and p.to_code == "en")
        argostranslate.package.install_from_path(pkg.download())

    _installed = True


def to_english(text):
    if not text:
        return ""
    _ensure_model_installed()
    return argostranslate.translate.translate(text, "fr", "en")


def paragraphs_to_english(paragraphs):
    return [to_english(p) for p in (paragraphs or [])]
