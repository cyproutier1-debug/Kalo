# Kalo : suivi calories, protéines & glucides (Android + iPhone)

Web-app installable (PWA) : scan de code-barres, recherche Open Food Facts, aliments génériques, objectifs kcal + protéines calculés automatiquement, journal par repas, progrès semaine / mois / année, suivi du poids. Gratuit, sans compte ni serveur : les données restent sur le téléphone.

## 1. Mettre l'app en ligne (gratuit, une seule fois, ~10 min)

L'app doit être servie en **https** (sinon pas de caméra ni d'installation). GitHub Pages est gratuit et fait ça très bien.

1. Crée un compte sur https://github.com (gratuit).
2. Clique **New repository** → nom : `kalo` → **Public** → **Create repository**.
3. Sur la page du dépôt : **uploading an existing file** → glisse **le contenu** du dossier `kalo` (index.html, app.js, styles.css, foods.js, sw.js, manifest.webmanifest, et les dossiers `icons` et `vendor`) → **Commit changes**.
   - `index.html` doit être à la racine du dépôt, pas dans un sous-dossier.
4. **Settings** → **Pages** → Source : **Deploy from a branch** → Branch : `main` / `(root)` → **Save**.
5. Attends 1 à 2 minutes : l'adresse s'affiche en haut de la page Pages, du type `https://TON-PSEUDO.github.io/kalo/`.

**Vérification :** ouvre cette adresse sur ton ordinateur. Tu dois voir l'écran « Bienvenue sur Kalo ».

## 2. Installer sur le téléphone

- **Android (Chrome)** : ouvre l'adresse → menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
- **iPhone (Safari obligatoirement)** : ouvre l'adresse → **⋯** (à côté de la barre d'adresse, iOS 26) → **Partager** → fais défiler → **Sur l'écran d'accueil** → laisse « Ouvrir en tant qu'app web » activé → Ajouter.

Ensuite lance Kalo depuis son icône. Au premier scan, autorise la caméra.

## 3. Mettre à jour l'app plus tard

1. Remplace les fichiers modifiés dans le dépôt GitHub.
2. Dans `sw.js`, change `VERSION` (ex. `kalo-v1.3.2`). L'app charge toujours la version en ligne quand il y a du réseau ; le cache ne sert qu'hors connexion.
3. Ferme et rouvre l'app sur le téléphone.

## 4. Sauvegarde des données

Les données (journal, pesées, aliments perso) sont stockées **uniquement sur le téléphone**, dans l'app installée.
- Profil → **Exporter** de temps en temps : ça génère un fichier `.json`.
- Changement de téléphone : installe l'app sur le nouveau, puis Profil → **Importer**.
- Sur iPhone, supprimer l'icône de l'écran d'accueil efface les données de l'app.

## Bilan du jour et validation

- **Montre (Apple Watch)** : Journal → *Bilan du jour* → **⌚ Ma montre** → entre le **TOTAL** de l'app Forme (ligne « TOTAL : … KCAL » sous le graphique « Bouger »). Saisi en cours de journée, Kalo ajoute la dépense au repos restante jusqu'à minuit. Un chiffre inférieur à 1 200 est compris comme les calories « Bouger » (actives) : Kalo y ajoute alors la dépense au repos estimée.
- **Objectifs calés sur la montre** : dès 3 journées passées avec une dépense saisie, la *dépense de référence* devient la moyenne de la montre (28 derniers jours) au lieu de la formule ; objectif = cette moyenne − déficit du rythme choisi. Bascule Montre / Formule dans Profil.
- **Valider un repas** : coche le rond à gauche du nom du repas → il passe en bleu (« mangé »). Les repas non cochés comptent comme « prévu » : tu peux préparer ton dîner à l'avance et voir dans le résumé *mangé + prévu* par rapport à l'objectif (barre pleine = mangé, claire = prévu). Décoche pour modifier un repas validé.
- **Bilan** = dépense − consommé. Un nombre négatif est un déficit (perte), un positif un excédent.
- **Valider la journée** (bouton en bas du journal) : affiche le récap (objectifs atteints, déficit, projection sur 4 semaines) coche tous les repas et verrouille la journée. « Rouvrir » permet de la modifier.
- Dans Progrès, le bilan estimé utilise ta dépense réelle quand tu l'as saisie.

## Projection jusqu'à l'objectif (onglet Progrès)

- Date estimée d'arrivée au poids objectif, % du chemin parcouru, poids estimé à la fin de chaque mois, courbe pesées + projection.
- **Rythme réel** : tendance (régression linéaire) de tes pesées des 28 derniers jours, dès qu'elles couvrent au moins 10 jours ; sinon déficit moyen de tes 14 derniers jours saisis (au moins 5 jours).
- **Rythme prévu** : le rythme choisi dans ton profil.
- Si le poids réel ne baisse pas, l'app l'indique au lieu d'afficher une date fictive.

## Photo IA (estimation d'un plat)

- Ajouter → **Photo IA** → photo du plat (appareil photo ou galerie) + description (cuisson, sauces, quantité réellement mangée) → **Analyser**.
- L'IA renvoie chaque composant avec grammes et macros ; tu peux décocher un élément, corriger les grammes, ou appliquer un multiplicateur de portion (×0,5 à ×1,5), puis ajouter au repas. Chaque composant devient une entrée modifiable du journal.
- Fournisseur au choix (Profil → *Photo IA*) : **Gemini** (clé gratuite sur aistudio.google.com/apikey ; en gratuit, Google peut utiliser les données) ou **Claude** (clé payante sur console.anthropic.com, < 1 centime par photo avec Sonnet 5.5). La clé reste sur le téléphone et n'est jamais exportée.
- Précision : ±20–30 % sur une photo seule ; la description réduit l'écart.

## Accueil (v2)

- **Compléments** (entre le résumé du jour et le bilan) : crayon → ajoute tes compléments (suggestions créatine, magnésium, oméga 3, D3 + K2… ou nom/dose libres). Touche une pastille pour la cocher ; elles se décochent chaque nouveau jour. « Tous pris ✓ » quand tout est coché.

- **Photo objectif** : Profil → *Ma photo objectif* → Ajouter. L'image (idéalement générée par IA à ton poids objectif) s'affiche en haut de l'accueil. Le Profil fournit le texte à coller dans ChatGPT / Gemini avec ta photo. L'image est compressée et stockée sur le téléphone (incluse dans l'export).
- **Repas** : sous chaque nom de repas, total protéines (P), glucides (G) et lipides (L) du repas, à côté des kcal.
- **Anneau calories** : calories restantes, arc plein = mangé, arc clair = prévu.
- **Barres protéines et glucides** : couleur selon la progression : rouge au départ, orange à mi-chemin, vert quand l'objectif est atteint.
- Bouton **+** central : ajoute un aliment au repas en cours (scan, recherche, ajout rapide).

## Couleur de l'app

- Profil → **Couleur de l'app** : 8 couleurs prêtes (vert, cyan, bleu, violet, rose, rouge, orange, jaune) ou couleur personnalisée. Appliquée partout instantanément, conservée et incluse dans l'export.
- Couleurs de sens fixes : vert = objectif atteint / déficit, orange = dépassement, bleu = repas validé. L'icône de l'écran d'accueil ne change pas (limite iOS / Android).

## Fonctionnement des objectifs

- Métabolisme de base : formule Mifflin-St Jeor, multiplié par le niveau d'activité, ce qui donne la dépense estimée.
- Objectif calories = dépense − déficit (rythme choisi × 7 700 kcal / 7 jours), plafonné à −1 000 kcal/j, plancher 1 500 kcal (homme) / 1 200 kcal (femme).
- Protéines = 1,8 g × poids objectif.
- Lipides ≈ 25 % des calories ; glucides = calories restantes après protéines et lipides (modifiable en mode Manuel).
- En mode **Auto**, chaque pesée recalcule les objectifs. En mode **Manuel**, tu fixes les valeurs toi-même.
- Ce sont des estimations ±10–15 %. Si le poids ne bouge pas en 3 semaines de saisie fidèle, baisse l'objectif de 100 à 150 kcal.

## Sources de données

- Produits : [Open Food Facts](https://world.openfoodfacts.org) (base collaborative, licence ODbL). Si un produit est absent ou incomplet, crée-le dans l'app : il sera reconnu au prochain scan.
- Aliments génériques (`foods.js`) : valeurs moyennes, modifiables.
- Scanner : détecteur natif du navigateur sur Android, bibliothèque ZXing (Apache 2.0, dans `vendor/`) sur iPhone.
