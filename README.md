# PROTECAT — PWA autonome V0.3.1

**Usage : prototype pédagogique de conception et suivi déclaratif de protections électriques caténaires.** Ne remplace ni les règles de protection électrique, ni les dépêches officielles, ni les autorisations délivrées par l'exploitant. Aucune donnée SNCF réelle ne doit être publiée sur GitHub Pages.

## Le projet

- `site/` : PWA HTML/CSS/JavaScript sans serveur permanent ; démo fictive et stockage sur le navigateur.
- `site/manifest.webmanifest` et `site/sw.js` : installation sur Android et mise en cache des ressources de la PWA.
- `site/app.js` : éditeur de plan et parcours d'attestations fictives (aucun backend).
- `.github/workflows/deploy-pages.yml` : tests et publication depuis la branche `main`.
- `tests/` : tests du modèle déclaratif et des fichiers PWA.
- `docs/` : guide PDF et feuille de route.
- `PROTECAT_MAJ_GITHUB_TERMUX.sh` : mise à jour directe depuis Termux vers GitHub.

## Nouveautés V0.3.x

- Nom PROTECAT, interface orientée bleu, logo renforcé.
- Import de fond image ; import PDF disponible à titre expérimental, avec rendu variable selon navigateur.
- Palette de symboles PPE sans fond blanc, numéros séparés avec lignes de liaison.
- Ajustement +/- de la taille, déplacement des numéros, poignées A/B pour les connexions volantes.
- Cache de la PWA mis à jour pour diffuser la version V0.3.1.

**Limite technique :** le PDF n'est pas encore rendu par un moteur PDF intégré. Pour une superposition précise et fiable, utiliser une image PNG/JPEG du plan pendant cette phase d'étude. La synchronisation entre appareils, l'authentification, les dépêches officielles et la gestion de documents protégés restent à développer.

## Mise à jour Android / Termux

Télécharger séparément dans **Téléchargements** ou **Documents** :

- `PROTECAT_PWA_V0_3_1_GITHUB.zip`
- `PROTECAT_MAJ_GITHUB_TERMUX.sh`

Puis lancer :

```bash
termux-setup-storage
bash "$(find -L "$HOME/storage/shared" -maxdepth 6 -type f -name 'PROTECAT_MAJ_GITHUB_TERMUX.sh' -print -quit 2>/dev/null)"
```

Le script recherche le ZIP dans les dossiers courants, installe `git`, `gh`, `unzip` si besoin, te connecte à GitHub avec le flux d'authentification officiel, valide les ressources, puis :

1. réutilise `catena-pwa` s'il existe, afin de préserver l'URL de ta PWA déjà installée ;
2. sinon met à jour `protecat-pwa` s'il existe ;
3. sinon crée un nouveau dépôt public `protecat-pwa` ;
4. commit puis `push` sur `main` sans écrasement forcé ;
5. demande l'activation de GitHub Pages et déclenche le workflow si nécessaire.

Tu peux forcer le choix du dépôt avec `PROTECAT_REPO=nom_du_depot` en préfixe de la commande, si nécessaire.

**À vérifier après exécution :** dans GitHub, le workflow **PROTECAT · Tests et publication PWA** doit être vert. Pour GitHub Pages, la source doit être **GitHub Actions**. Le script ne peut pas garantir qu'un déploiement est terminé au moment où il se termine.

## Tests

```bash
node tests/test_core.js
node tests/test_pwa.js
node --check site/app.js
```

## Confidentialité et séparation des projets

La PWA ne communique pas avec Journal de chantier ni avec Supabase, et n'est pas prête à l'emploi pour un chantier réel. Sur GitHub Pages, le code et les données embarquées sont accessibles publiquement : ne placer aucun plan S11 réel, relevé caténaire, dépêche, document de sécurité ni photographie opérationnelle dans `site/`.
