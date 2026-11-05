# Kalo : suivi calories, protéines & glucides (Android + iPhone)

Web-app installable (PWA) : scan de code-barres, recherche Open Food Facts, aliments génériques, objectifs kcal + protéines calculés automatiquement, journal par repas, progrès semaine / mois / année, suivi du poids. Gratuit, sans compte ni serveur : les données restent sur le téléphone.

## 1. Mettre l'app en ligne (gratuit, une seule fois, ~10 min)

L'app doit être servie en **https** (sinon pas de caméra ni d'installation). GitHub Pages est gratuit et fait ça très bien.

1. Crée un compte sur https://github.com (gratuit).
2. Clique **New repository** → nom : `kalo` → **Public** → **Create repository**.
3. Sur la page du dépôt : **uploading an existing file** → glisse **le contenu** du dossier `kalo` (index.html, app.js, styles.css, foods.js, fx.js, exercises.js, body.js, muscu.js, boost.js, sw.js, manifest.webmanifest, et les dossiers `icons`, `vendor`, `fonts` et `exo-img`) → **Commit changes**.
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
- **Correction montre** (par défaut −25 %, réglable 0 / 15 / 25 / 35 % dans l'écran de saisie) : appliquée aux calories **actives** uniquement, car les montres surestiment surtout l'activité ; la dépense au repos n'est pas réduite. En mode TOTAL, la part active = total − dépense au repos écoulée à l'heure de saisie.
- **Objectifs calés sur la montre** : dès 3 journées passées avec une dépense saisie, la *dépense de référence* devient la moyenne de la montre (28 derniers jours) au lieu de la formule ; objectif = cette moyenne − déficit du rythme choisi. Bascule Montre / Formule dans Profil.
- **Valider un repas** : coche le rond à gauche du nom du repas → il passe en bleu (« mangé »). Les repas non cochés comptent comme « prévu » : tu peux préparer ton dîner à l'avance et voir dans le résumé *mangé + prévu* par rapport à l'objectif (barre pleine = mangé, claire = prévu). Décoche pour modifier un repas validé.
- **Bilan** = dépense − consommé. Un nombre négatif est un déficit (perte), un positif un excédent.
- **Valider la journée** (bouton en bas du journal) : affiche le récap (objectifs atteints, déficit, projection sur 4 semaines) coche tous les repas et verrouille la journée. « Rouvrir » permet de la modifier.
- Dans Progrès, le bilan estimé utilise ta dépense réelle quand tu l'as saisie.
- **Animation de validation** (repas ou journée) : flammes qui montent le long des bords de la carte du bas jusqu'en haut, léger zoom de la carte, puis feu d'artifice (5 fusées qui partent du sommet de la carte et explosent en gerbes colorées qui retombent), avec sons de mèche, de flammes, de sifflement de fusée, d'explosion et de crépitements (sons synthétisés dans `fx.js`, aucun fichier audio). Profil → *Animation de validation* pour couper l'animation ou les sons. Sur iPhone, le mode silencieux coupe les sons.

## Version 3 : coach, eau, favoris, séries, trophées

- **Coach du jour** (Journal, aujourd'hui) : protéines et calories restantes, rappel d'hydratation et de compléments, et 3 idées tirées de **tes** aliments (les plus riches en protéines par calorie qui rentrent dans ce qu'il te reste). Touche une idée : la fiche s'ouvre avec la quantité habituelle.
- **Hydratation** : objectif 35 ml par kg de poids (arrondi à 25 cl), boutons + 1 verre (25 cl), + 50 cl, −. Bouteille animée, fête quand l'objectif est atteint.
- **Repas favoris** : dans un repas, « ⭐ Favori » enregistre tous ses aliments ; dans Ajouter, la section *Repas favoris* les ajoute en un geste (× pour supprimer un favori).
- **Séries** (Progrès) : jours saisis d'affilée, jours protéines atteintes, jours sous l'objectif calories. La série en cours s'affiche aussi sous la date du Journal à partir de 2 jours.
- **Trophées** (Progrès) : 24 trophées (régularité, protéines, déficit cumulé, kilos perdus, eau, compléments, muscu, records…), barre de progression vers le prochain, écran de célébration avec feu d'artifice au déblocage.
- **Bilan des 7 derniers jours** (haut de Progrès) : note S / A / B / C / D sur 100 (protéines atteintes + calories tenues, pondéré par le nombre de jours saisis), moyenne kcal, jours dans l'objectif, graisse estimée, variation de poids, séances de muscu.
- **Rappel de sauvegarde** : à partir de 5 jours saisis, si aucune sauvegarde depuis 14 jours, une carte propose l'export (« Plus tard » = 7 jours).

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
- **Animations d'ambiance** : halos de fond qui dérivent, particules lumineuses qui montent, logo qui tourne, photo objectif en zoom lent, halo tournant et flamme qui vacille dans l'anneau, reflet qui balaie les barres, bouton + qui respire, muscles travaillés qui pulsent, enfoncement léger au toucher. À l'ouverture d'un onglet : cartes en cascade, anneau et barres qui se remplissent, compteur de calories qui défile. Tout est coupé si l'iPhone a « Réduire les animations » activé (Réglages → Accessibilité).

## Musculation (onglet Muscu)

- **Séance libre** ou **routine** (Push, Jambes…) : pour chaque exercice, lignes Série · Précédent · kg · Reps · ✓. La colonne *Précédent* et les champs vides reprennent ta dernière performance : cocher ✓ sur une ligne vide valide la même charge que la dernière fois.
- **Minuteur de repos** : démarre à chaque série validée (90 s par défaut ; touche « ⏱ Repos » pour 0 / 60 / 90 / 120 / 150 / 180 s), ±15 s, bip + vibration à la fin.
- La séance en cours est enregistrée en continu : tu peux quitter l'app ou changer d'onglet (bandeau « Séance en cours » au-dessus des onglets).
- **Fin de séance** : durée, volume soulevé (kg × reps), séries, records battus (1RM estimé Epley = charge × (1 + reps/30), ou charge max), kcal estimées (MET 5, indicatif, non ajoutées au bilan car la montre les compte déjà). Possibilité d'enregistrer la séance comme routine.
- **Suivi** : semaines d'affilée avec au moins une séance, séances sur 30 jours, volume sur 7 jours, carte des muscles travaillés sur 7 jours (séries par muscle, un muscle secondaire compte pour ½), volume par semaine sur 8 semaines, historique, fiche par exercice (records, courbe du 1RM estimé, historique).
- Carte musculaire : silhouette homme ou femme au choix (bouton au-dessus de la carte ; par défaut selon le sexe du profil). Dessins issus de la bibliothèque libre react-native-body-highlighter (licence MIT, `vendor/body-map-data.js` + `vendor/BODY-MAP-LICENSE`).
- **Fiche exercice** (touche la vignette avec « i » dans la liste, ou le nom d'un exercice pendant la séance) : illustration animée du mouvement (3 positions), bouton « Voir une vidéo du mouvement » (recherche YouTube), carte des muscles principal / secondaires, équipement, records et historique.
- **Programmes** (haut de l'onglet Muscu) : *Choisir un programme* → programme proposé « Haut / Bas · 5 jours (75 séries) » ou *Créer mon propre programme* (séances par jour de la semaine, exercices avec séries, fourchette de répétitions et repos). Le programme actif affiche la semaine (jours d'entraînement, séances faites ✓) et la séance du jour, ou le jour de repos et la prochaine séance.
  - Pendant une séance de programme : objectif affiché sous chaque exercice (ex. 3 × 6-8 reps · repos 2-3 min), minuteur de repos réglé par exercice (2 min 30 pour les lourds, 1 min 45 pour l'isolation), 2 séries d'échauffement (É) sur le premier exercice à ~50 % et ~70 % de la charge de travail, exclues des statistiques.
  - **Progression automatique** : si toutes les séries de la dernière fois ont atteint le haut de la fourchette, Kalo propose +2,5 à 5 % de charge et pré-remplit la nouvelle charge.
  - Exercice avec alternative (ex. curl incliné ↔ curl bayésien) : bouton pour échanger pendant la séance.
  - Chaque téléphone a ses propres programmes : rien n'est partagé entre utilisateurs.
- Bibliothèque d'environ 100 exercices (`exercises.js`) + exercices personnalisés (charge × reps, poids du corps + lest, durée, cardio).
- *Mes aliments* (aliments créés, récents) est maintenant dans Profil.

## Polices

Unbounded 900 (grands titres), Oxanium 800 (chiffres), Sora 700/600 (titres de cartes, noms d'aliments), Inter 500/400 (textes secondaires). Fichiers inclus dans `fonts/` (SIL Open Font License), donc disponibles hors connexion.

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
- Illustrations d'exercices (`exo-img/`) : [Workout Guide](https://github.com/bryllim/workout-guide) de Bryl Lim, d'après [Everkinetic](https://github.com/everkinetic/data), licence CC BY-SA 4.0 (converties en WebP 320 px ; voir `exo-img/LICENSE-ASSETS` et `exo-img/ATTRIBUTION.md`).
- Carte musculaire : react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham).
- Scanner : détecteur natif du navigateur sur Android, bibliothèque ZXing (Apache 2.0, dans `vendor/`) sur iPhone.
