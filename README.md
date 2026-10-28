# Kalo : suivi calories & protéines (Android + iPhone)

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
2. Dans `sw.js`, change `VERSION` (ex. `kalo-v1.0.1`). Sans ça, les téléphones gardent l'ancienne version en cache.
3. Ferme et rouvre l'app deux fois sur le téléphone.

## 4. Sauvegarde des données

Les données (journal, pesées, aliments perso) sont stockées **uniquement sur le téléphone**, dans l'app installée.
- Profil → **Exporter** de temps en temps : ça génère un fichier `.json`.
- Changement de téléphone : installe l'app sur le nouveau, puis Profil → **Importer**.
- Sur iPhone, supprimer l'icône de l'écran d'accueil efface les données de l'app.

## Fonctionnement des objectifs

- Métabolisme de base : formule Mifflin-St Jeor, multiplié par le niveau d'activité, ce qui donne la dépense estimée.
- Objectif calories = dépense − déficit (rythme choisi × 7 700 kcal / 7 jours), plafonné à −1 000 kcal/j, plancher 1 500 kcal (homme) / 1 200 kcal (femme).
- Protéines = 1,8 g × poids objectif.
- En mode **Auto**, chaque pesée recalcule les objectifs. En mode **Manuel**, tu fixes les valeurs toi-même.
- Ce sont des estimations ±10–15 %. Si le poids ne bouge pas en 3 semaines de saisie fidèle, baisse l'objectif de 100 à 150 kcal.

## Sources de données

- Produits : [Open Food Facts](https://world.openfoodfacts.org) (base collaborative, licence ODbL). Si un produit est absent ou incomplet, crée-le dans l'app : il sera reconnu au prochain scan.
- Aliments génériques (`foods.js`) : valeurs moyennes, modifiables.
- Scanner : détecteur natif du navigateur sur Android, bibliothèque ZXing (Apache 2.0, dans `vendor/`) sur iPhone.
