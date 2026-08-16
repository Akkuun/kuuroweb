Depose ici les deux fichiers de curseur personnalise :

- normal.png  -> curseur par defaut (partout sur le site)
- hover.png   -> curseur au survol des liens/boutons cliquables

Formats supportes par CSS cursor: .png, .gif, .cur, .svg (PNG recommande).
Tant que ces fichiers n'existent pas, le site retombe automatiquement sur
le curseur systeme (fallback "auto"/"pointer" deja en place dans style.css,
pas de JS necessaire).

Taille recommandee : 32x32 px, point chaud (le pixel actif du clic) dans
le coin haut-gauche de l'image pour un rendu naturel.
