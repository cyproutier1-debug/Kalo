# Kalo : suivi calories, protéines & glucides (Android + iPhone)

Web-app installable (PWA) : scan de code-barres, recherche Open Food Facts, aliments génériques, objectifs kcal + protéines calculés automatiquement, journal par repas, progrès semaine / mois / année, suivi du poids. Gratuit, sans compte ni serveur : les données restent sur le téléphone.

- **v3.9.2** : rubrique Trophées supprimée (onglet Progrès) et plus d'écran « Trophée débloqué » ; les Séries restent.
- **v3.9.1** : Coach poids déplacé sous les pesées ; conseils personnalisés à partir des 14 derniers jours du journal (calories vs objectif, week-ends, protéines, sel, variations de glucides, fibres, fruits & légumes, eau, aliments incomplets, féculents comptés crus à plus de 170 g, pesées après 11 h) avec points forts ; causes du jour complétées (volume d'aliments, fibres et eau de la veille, heure de la pesée). L'heure des pesées du jour est désormais enregistrée.
- **v3.9.0** : **Coach poids** (onglet Progrès, au-dessus des pesées + une phrase dans le Coach du jour) : poids tendance lissé, tendance par semaine, moyenne 7 j vs 7 j précédents ; quand la balance remonte malgré la tendance ou le déficit, il chiffre pourquoi ce n'est pas de la graisse (≈ 7 700 kcal par kg) et détecte les causes probables (sel, glucides de la veille, séance de muscu, rebond après une grosse baisse) ; alerte stagnation 2 semaines ou perte trop rapide ; 8 conseils pour bien lire la balance. Module `poids.js`.
- **v3.8.19** : sélecteurs : la pastille coulisse simplement d'un bouton à l'autre (0,42 s, démarrage vif puis arrivée en douceur façon iOS, léger flou de mouvement au départ).
- **v3.8.18** : animation des sélecteurs deux fois plus rapide (0,34 s).
- **v3.8.17** : animation des sélecteurs 100 % GPU (uniquement déplacement, étirement, transparence ; flou de mouvement par fondu vers une copie floutée) pour une fluidité maximale sur iPhone.
- **v3.8.16** : animation des sélecteurs sans effet de rétrécissement en hauteur (le liquide garde toute la hauteur du bouton).
- **v3.8.15** : flou de mouvement sur l'animation des sélecteurs (le liquide se floute pendant le passage le plus rapide, net au départ et à l'arrivée).
- **v3.8.14** : filet entre les boutons retiré (le bouton quitté se vide, le bouton choisi se remplit).
- **v3.8.13** : sélecteurs en effet sablier : le bouton quitté se vide vers un goulot, un filet de liquide traverse, le bouton choisi se remplit (ease-in-out, 0,76 s, tout reste dans le cadre) ; la couleur du texte suit le liquide.
- **v3.8.12** : animation « liquide » des sélecteurs (Rythme réel / prévu, 7j / 30j / 90j, Ma montre / Formule, etc.) : la pastille s'étire vers le bouton choisi, s'affine puis rebondit.
- **v3.8.11** : zone de la barre d'état (heure, batterie) à la couleur du haut de l'appli (#04060E). Elle ne peut plus être transparente depuis iOS 26.1 (bug Apple WebKit 301994).
- **v3.8.10** : plus de rebond en haut et en bas des pages (le fond ne déborde plus) ; indicateur de défilement iOS repoussé hors de l'écran.
- **v3.8.9** : barres de défilement masquées partout.
- **v3.8.8** : zoom désactivé (pincement, double-tap, zoom automatique sur les champs de saisie iOS) ; le recadrage photo garde son pincement.
- **v3.8.7** : la barre d'onglets ne se décolle plus du bas sur iPhone (seul le contenu défile, la page reste fixe ; plus de rebond qui déplace la barre).
- **v3.8.6** : ligne Compléments + Hydratation plus basse (≈ −25 %) : compléments sur une ligne « nom · dose », hydratation plus compacte.
- **v3.8.5** : ordre du Journal : Qualité du jour, Compléments + Hydratation, puis Coach du jour.
- **v3.8.4** : « Qualité du jour » au-dessus du « Coach du jour » (v3.8.3 : adresse du serveur social corrigée).
- **v3.8.2** : Social → « 🩺 Tester la connexion au serveur » (joignabilité, clé, connexion anonyme, tables) avec messages bruts.
- **v3.8.1** : social branché sur le projet Supabase de Kalo ; messages d'erreur explicites si le serveur est mal configuré.
- **v3.8.0** : onglet **Social** au centre de la barre (amis par code, résumés nutrition/entraînement, classement 7 jours, fiche ami) ; l'ajout d'aliment passe sur un bouton + flottant dans le Journal. Serveur Supabase (`social.js`, `social-config.js`, `supabase/schema.sql`).
- **v3.7.4** : photo de profil séparée de la photo objectif (Profil → touche ton avatar, recadrage rond, Retirer).
- **v3.7.3** : « Données partielles » → bouton « Compléter » (fibres et sel par aliment, estimations rapides 0 / 1 / 3 / 6 g, valeur réutilisée tous les jours) ; 0 g automatique pour les aliments sans fibres par nature (viande, poisson, œufs, laitiers, whey, boissons, matières grasses) ; rattrapage Open Food Facts étendu aux aliments perso avec code-barres.
- **v3.7.2** : photo objectif recadrable (glisser, pincer/curseur pour zoomer, flèches, réinitialiser) avant validation et depuis Profil → « Recadrer / déplacer » ; aperçu identique au haut du Journal.
- **v3.7.1** : « Qualité du jour » → menu déroulant d'idées d'aliments classées par points gagnés (chaque aliment testé sur ta journée, adapté aux calories restantes et au repas), conseil sel ; bouton ⓘ pour les explications.
- **v3.7.0** : carte « Qualité du jour » (fibres, sel, fruits & légumes, laitiers, score /100), données Open Food Facts (fibres, sel, % fruits/légumes estimé des ingrédients) + rattrapage des produits déjà saisis, planificateur « Compléter ma journée » (combinaisons d'aliments simples respectant kcal/macros restants, adapté au repas, ajout en 1 tap), fibres/sel dans la fiche aliment, le formulaire et le scan IA. Module `nutri.js`.
- **v3.6.8** : féculents étiquetés CRU / CUIT (recherche + fiche), unité « g cuits » avec conversion automatique (pâtes ÷2,3, riz ÷2,6…), journal affiché « 150 g cuits (≈ 65 g crus) ».
- **v3.6.7** : main pointeuse + anneau sous le point de poids sélectionné (Journal, Progrès, projection) ; service worker restauré.

## 1. Mettre l'app en ligne (gratuit, une seule fois, ~10 min)

L'app doit être servie en **https** (sinon pas de caméra ni d'installation). GitHub Pages est gratuit et fait ça très bien.

1. Crée un compte sur https://github.com (gratuit).
2. Clique **New repository** → nom : `kalo` → **Public** → **Create repository**.
3. Sur la page du dépôt : **uploading an existing file** → glisse **le contenu** du dossier `kalo` (index.html, app.js, styles.css, foods.js, fx.js, exercises.js, body.js, anim.js, anim3d.js, muscu.js, boost.js, sw.js, manifest.webmanifest, nutri.js, social.js, social-config.js, et les dossiers `icons`, `vendor`, `thumbs`, `fonts` et `supabase`) → **Commit changes**.
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

- **Coach du jour** (Journal, aujourd'hui) : une phrase (protéines et calories restantes). Le bouton en dessous déroule les rappels (hydratation, compléments) et 3 idées tirées de **tes** aliments (les plus riches en protéines par calorie qui rentrent dans ce qu'il te reste). Touche une idée : la fiche s'ouvre avec la quantité habituelle.
- **Compléments et hydratation** côte à côte sur une même ligne : compléments en colonne, 4 visibles, les suivants dans un menu déroulant « + N autres » (touche pour cocher, crayon pour modifier la liste). Hydratation : l'eau remplit toute la carte d'un bord à l'autre au fur et à mesure, pourcentage au centre et boutons − / +25 cl / +50 cl ; l'eau reste bleue (double vague animée, montée fluide avec le pourcentage qui défile) et le pourcentage change de couleur comme les barres protéines / glucides (rouge à 0 %, orange à 50 %, vert à 100 %). À 100 % : flammes et feu d'artifice comme à la validation d'un repas.
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

- **Photo de profil** (avatar) : séparée de la photo objectif. Profil → touche l'avatar rond → choisis une photo → recadrage dans un cercle → Valider (« Retirer » en la retouchant). Incluse dans l'export.
- **Photo objectif** : Profil → *Ma photo objectif* → Ajouter → écran de cadrage (glisse pour déplacer, pince ou curseur pour zoomer, flèches pour ajuster, aperçu au format exact du haut du Journal) → Valider. « ✥ Recadrer / déplacer » pour reprendre le cadrage plus tard. L'image (idéalement générée par IA à ton poids objectif) s'affiche en haut de l'accueil. Le Profil fournit le texte à coller dans ChatGPT / Gemini avec ta photo. L'image est compressée et stockée sur le téléphone (incluse dans l'export).
- **Repas** : sous chaque nom de repas, total protéines (P), glucides (G) et lipides (L) du repas, à côté des kcal.
- **Anneau calories** : calories restantes, arc plein = mangé, arc clair = prévu.
- **Barres protéines et glucides** : couleur selon la progression : rouge au départ, orange à mi-chemin, vert quand l'objectif est atteint.
- Bouton **+** flottant (en bas à droite du Journal) : ajoute un aliment au repas en cours (scan, recherche, ajout rapide).
- **Animations d'ambiance** : halos de fond qui dérivent, particules lumineuses qui montent, logo qui tourne, photo objectif en zoom lent, halo tournant et flamme qui vacille dans l'anneau, reflet qui balaie les barres, bouton + qui respire, muscles travaillés qui pulsent, enfoncement léger au toucher. À l'ouverture d'un onglet : cartes en cascade, anneau et barres qui se remplissent, compteur de calories qui défile. Tout est coupé si l'iPhone a « Réduire les animations » activé (Réglages → Accessibilité).

## Musculation (onglet Muscu)

- **Séance libre** ou **routine** (Push, Jambes…) : pour chaque exercice, lignes Série · Précédent · kg · Reps · ✓. La colonne *Précédent* et les champs vides reprennent ta dernière performance : cocher ✓ sur une ligne vide valide la même charge que la dernière fois.
- **Minuteur de repos** : démarre à chaque série validée (90 s par défaut ; touche « ⏱ Repos » pour 0 / 60 / 90 / 120 / 150 / 180 s), ±15 s, bip + vibration à la fin.
- La séance en cours est enregistrée en continu : tu peux quitter l'app ou changer d'onglet (bandeau « Séance en cours » au-dessus des onglets).
- **Fin de séance** : durée, volume soulevé (kg × reps), séries, records battus (1RM estimé Epley = charge × (1 + reps/30), ou charge max), kcal estimées (MET 5, indicatif, non ajoutées au bilan car la montre les compte déjà). Possibilité d'enregistrer la séance comme routine.
- **Suivi** : semaines d'affilée avec au moins une séance, séances sur 30 jours, volume sur 7 jours, carte des muscles travaillés sur 7 jours (séries par muscle, un muscle secondaire compte pour ½), volume par semaine sur 8 semaines, historique, fiche par exercice (records, courbe du 1RM estimé, historique).
- Carte musculaire : silhouette homme ou femme au choix (bouton au-dessus de la carte ; par défaut selon le sexe du profil). Dessins issus de la bibliothèque libre react-native-body-highlighter (licence MIT, `vendor/body-map-data.js` + `vendor/BODY-MAP-LICENSE`).
- **Fiche exercice** (touche la vignette avec « i » dans la liste, ou le nom d'un exercice pendant la séance) : **animation 3D** du mouvement en boucle : personnage humain au physique athlétique (épaules larges, dos en V, abdos), rendu en style illustré (ombres en aplats, contour encré, traits aux séparations musculaires), short, cheveux ; muscle principal en rouge et muscles secondaires en orange directement sur le corps. Le personnage est animé par un squelette (bras, jambes, doigts fermés sur les poignées) et respecte les amplitudes articulaires (coudes et genoux qui plient dans le bon sens, flexion ≤ 150°, chevilles bornées, pieds à plat). Le matériel (barre et disques, haltères, kettlebell, poignées, câbles, barres de traction et de dips) est placé dans les poings réels du personnage à chaque image ; bancs, sièges et machines en 3D, ombres au sol. Version femme (queue de cheval, brassière) selon le choix de la carte musculaire. La caméra tourne doucement autour du mouvement ; **glisse le doigt** sur l'animation pour la faire pivoter (haut / bas pour changer la hauteur de vue). Moteur 3D three.js (licence MIT, `vendor/three.min.js`, chargé seulement à l'ouverture d'une fiche, ~140 ko compressé). Si le téléphone ne gère pas la 3D (WebGL), l'animation 2D (`anim.js`) s'affiche à la place. Vignettes 3D de la position d'effort dans toutes les listes (`thumbs/`, dessin 2D pour les exercices personnalisés), bouton « Voir une vidéo du mouvement » (recherche YouTube), carte des muscles principal / secondaires, équipement, records et historique.
- **Programmes** (haut de l'onglet Muscu) : *Choisir un programme* → programmes proposés « Haut / Bas · 5 jours (75 séries) » et « Fessiers / Quads / Ischios + haut du corps » (lundi fessiers, mardi épaules / triceps, jeudi quadriceps, vendredi dos / biceps, samedi ischios ; circuit abdos ×3 à la fin de chaque séance du bas du corps ; charges de départ) ou *Créer mon propre programme* (séances par jour de la semaine, exercices avec séries, fourchette de répétitions et repos). Le programme actif affiche la semaine (jours d'entraînement, séances faites ✓) et la séance du jour avec la liste de ses exercices. **Touche un jour de la semaine** pour voir sa séance de la même façon (exercices, séries × reps, notes) et la lancer ; « Revenir à aujourd'hui » pour revenir.
  - Pendant une séance de programme : objectif affiché sous chaque exercice (ex. 3 × 6-8 reps · repos 2-3 min), minuteur de repos réglé par exercice (2 min 30 pour les lourds, 1 min 45 pour l'isolation), 2 séries d'échauffement (É) sur le premier exercice à ~50 % et ~70 % de la charge de travail, exclues des statistiques.
  - **Progression automatique** : si toutes les séries de la dernière fois ont atteint le haut de la fourchette, Kalo propose +2,5 à 5 % de charge et pré-remplit la nouvelle charge.
  - Séances « Libre » (sans jour fixe) : boutons sous la séance du jour pour les lancer n'importe quel jour ; dans *Modifier*, choisis un jour pour les fixer.
  - Charge de départ notée dans le programme (ex. tirage vertical 45 kg) : pré-remplie tant qu'il n'y a pas d'historique.
  - Exercice avec alternative (ex. curl incliné ↔ curl bayésien) : bouton pour échanger pendant la séance.
  - Chaque téléphone a ses propres programmes : rien n'est partagé entre utilisateurs. Une copie non modifiée d'un programme proposé se met à jour automatiquement quand le modèle évolue.
- Bibliothèque d'environ 100 exercices (`exercises.js`) + exercices personnalisés (charge × reps, poids du corps + lest, durée, cardio).
- *Mes aliments* (aliments créés, récents) est maintenant dans Profil.
- **Modifier un aliment** : sur la fiche d'un aliment (en l'ajoutant ou en touchant un aliment du journal), bouton « ✎ Modifier l'aliment » → nom, marque, valeurs pour 100 g, portion. Pour tes aliments, les ajouts déjà faits dans le journal sont recalculés ; un produit Open Food Facts ou générique modifié devient « Mon aliment » (reconnu au prochain scan).

## Polices

Unbounded 900 (grands titres), Oxanium 800 (chiffres), Sora 700/600 (titres de cartes, noms d'aliments), Inter 500/400 (textes secondaires). Fichiers inclus dans `fonts/` (SIL Open Font License), donc disponibles hors connexion.

## Couleur de l'app

- Profil → **Couleur de l'app** : 8 couleurs prêtes (vert, cyan, bleu, violet, rose, rouge, orange, jaune) ou couleur personnalisée. Jaune par défaut pour un nouveau compte (les comptes existants gardent leur couleur). Appliquée partout instantanément, conservée et incluse dans l'export.
- Couleurs de sens fixes : vert = objectif atteint / déficit, orange = dépassement, bleu = repas validé. L'icône de l'écran d'accueil ne change pas (limite iOS / Android).

## Fonctionnement des objectifs

- Métabolisme de base : formule Mifflin-St Jeor, multiplié par le niveau d'activité, ce qui donne la dépense estimée.
- Objectif calories = dépense − déficit (rythme choisi × 7 700 kcal / 7 jours), plafonné à −1 000 kcal/j, plancher 1 500 kcal (homme) / 1 200 kcal (femme).
- Protéines = 1,8 g × poids objectif.
- Lipides ≈ 25 % des calories ; glucides = calories restantes après protéines et lipides (modifiable en mode Manuel).
- En mode **Auto**, chaque pesée recalcule les objectifs. En mode **Manuel**, tu fixes les valeurs toi-même.
- Ce sont des estimations ±10–15 %. Si le poids ne bouge pas en 3 semaines de saisie fidèle, baisse l'objectif de 100 à 150 kcal.

## Qualité du jour (v3.7)

- Carte dans le Journal : **fibres** (objectif ≥ 30 g, Anses), **sel** (≤ 6 g, trait = limite), **fruits & légumes** (5 portions de 80 g, feuilles), **laitiers** (2 portions, PNNS 2019 : yaourt/skyr 125 g, fromage blanc 100 g, lait 150 ml, fromage 30 g). Score /100 = fibres 30 + fruits & légumes 35 + laitiers 15 + sel 20. Bouton ⓘ pour les explications. Menu déroulant « N idées · jusqu'à +X pts » : aliments simples testés un par un sur ta journée, classés par points gagnés, adaptés aux calories restantes et au repas (2 max par famille) ; touche une idée pour ouvrir sa fiche avec la bonne quantité. Conseil sel quand la limite approche.
- Produits scannés : fibres, sel et **% de fruits/légumes/légumineuses estimé depuis les ingrédients** par Open Food Facts (une salade composée compte pour sa part de légumes). Jus, confitures et fruits secs ne comptent pas. Légumineuses = ½ portion. Les produits saisis avant la v3.7 sont complétés automatiquement au premier affichage (réseau requis).
- Les fibres sont **facultatives** sur l'étiquette européenne : beaucoup de produits ne les indiquent pas. Kalo met 0 g automatiquement pour les aliments qui n'en contiennent pas par nature (viande, poisson, œufs, laitiers, whey, boissons, matières grasses : par catégorie Open Food Facts ou par le nom). Pour le reste, le bandeau « Fibres inconnues pour X % des calories · Compléter → » ouvre la liste des aliments concernés : saisis la valeur de l'emballage ou une estimation (0 / 1 / 3 / 6 g pour 100 g, total pour un ajout rapide) ; elle est réutilisée tous les jours et incluse dans l'export.
- **Compléter ma journée** : teste ~14 000 combinaisons de 1 à 3 aliments simples et garde celles qui comblent protéines, fibres, fruits & légumes et laitiers **sans dépasser** les calories, glucides et lipides restants (sel limité si la journée est déjà salée). 3 propositions avec une source de protéines différente, adaptées au repas choisi (collation : laitiers, fruits, crudités, oléagineux ; repas : protéine + légumes). Ajout au journal en un geste.
- Fiche aliment : fibres, sel, portion de fruits & légumes et de laitier pour la quantité saisie. Formulaire « Créer / Modifier un aliment » : champs fibres et sel. Photo IA : fibres, sel et grammes de fruits/légumes demandés à l'IA.

## Social (v3.8)

- **Onglet Social** (au centre de la barre). L'ajout d'aliment se fait avec le **bouton + flottant** en bas à droite du Journal (et « + Ajouter » sous chaque repas).
- **Activation volontaire** : pseudo + case de consentement. Compte anonyme (pas d'e-mail ni de mot de passe), code ami de 6 caractères.
- **Ajouter un ami** : saisis son code, ou ouvre son lien `…/Kalo/?ami=CODE` (bouton « Partager »). L'amitié est réciproque : donner son code = accepter d'être suivi. Retirer un ami coupe le partage dans les deux sens. 50 amis max.
- **Partagé** : pseudo, photo de profil (96 px), pour les 14 derniers jours le % de calories et de protéines par rapport à l'objectif, le score qualité, les séries de jours ; les séances (nom, durée, séries, volume, muscles principaux, records) ; le poids **en % seulement** (30 jours, depuis le début, % du chemin vers l'objectif). **Jamais** : kg, taille, âge, aliments, photo objectif.
- **Fiche ami** : stats 7 jours, barres calories vs objectif sur 14 jours (vert 80-105 %, point jaune = protéines atteintes), poids en %, séances récentes avec muscles et records.
- **Classement 7 jours** : 2 pts/jour saisi, 3 pts/jour dans l'objectif kcal (80-105 %), 3 pts/jour protéines atteintes, 5 pts/séance, + qualité moyenne ÷ 20. Récompense la régularité, jamais le fait de manger moins.
- **Réglages** (roue dentée) : pseudo et photo, mettre le partage en pause, changer de code, supprimer le compte social (efface profil, résumé et amitiés du serveur ; le journal du téléphone n'est pas touché).
- Synchronisation : résumé envoyé quelques secondes après une modification et quand l'app passe en arrière-plan, seulement s'il a changé. Le compte social n'est pas dans l'export (changer de téléphone = réactiver et réajouter ses amis).
- **Serveur** : projet Supabase gratuit. Une fois : coller `supabase/schema.sql` dans SQL Editor → Run ; Authentication → Sign In / Providers → activer « Allow anonymous sign-ins » ; mettre l'URL du projet et la clé publique (anon / publishable) dans `social-config.js`. Jamais la clé `service_role`. La sécurité repose sur les règles RLS : chacun ne lit que son profil et ceux de ses amis.

## Sources de données

- Produits : [Open Food Facts](https://world.openfoodfacts.org) (base collaborative, licence ODbL). Si un produit est absent ou incomplet, crée-le dans l'app : il sera reconnu au prochain scan.
- Aliments génériques (`foods.js`) : valeurs moyennes, modifiables. Fibres, sel, part de fruits/légumes et portion laitière des génériques dans `nutri.js` (moyennes proches de la table Ciqual, Anses, Licence Ouverte).
- Animations d'exercices : créées par Kalo (`anim.js` en 2D, `anim3d.js` en 3D, vignettes `thumbs/` générées à partir de `anim3d.js`), aucune image externe. Corps du personnage : maillage, squelette et morphologies MakeHuman (licence CC0, domaine public), préparés pour Kalo dans `vendor/human/` (~430 ko par version, chargés à l'ouverture d'une fiche). Moteur 3D : three.js r187 (MIT, © 2010-2026 three.js authors, `vendor/THREE-LICENSE.txt`).
- Carte musculaire : react-native-body-highlighter (MIT, © 2022 ELABBASSI Hicham).
- Scanner : détecteur natif du navigateur sur Android, bibliothèque ZXing (Apache 2.0, dans `vendor/`) sur iPhone.
