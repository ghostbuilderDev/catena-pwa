# CATÉNA — PWA de démonstration indépendante · v0.2.0

**Projet :** prototype de protection électrique caténaire destiné à devenir un futur module de Journal de chantier.

**Statut : DÉMONSTRATION UNIQUEMENT — aucun usage opérationnel.** Aucun dépôt de preuves, dépêche officielle, contrôle d’habilitation, réseau multiagents ni autorisation de restitution.

## Fonctionnalités conservées
- Plan schématique interactif, 12 repères **fictifs**, affectation à des acteurs de démonstration.
- Parcours de déclaration de pose (VAT / contrôles déclaratifs) avec photographie locale.
- Recollement par acteur distinct et indication des anomalies.
- Retrait, recollement, verrouillage de clôture avant vérification de tous les repères.
- Historique local et exports de démonstration.
- Installation PWA Android / iOS à partir d’une URL HTTPS, mode hors ligne après première ouverture, notification de nouvelles versions.

## Important : protection des données
Cette version **n’embarque ni le schéma S11 original ni les coordonnées/repères du chantier réel**. Tous les identifiants et positions affichés sont fictifs. C’est intentionnel : GitHub Pages est un site Internet public. Ne pas importer de vrais plans ou photos de sécurité SNCF dans cette PWA non authentifiée.

Les données de l’exercice sont conservées dans le stockage du navigateur **sur un seul appareil** et peuvent être supprimées. Le mode hors ligne n’est **pas** une synchronisation multiagents. Les appareils ne voient pas les saisies des autres.

## Structure
- `site/` : application statique publiée sur GitHub Pages (aucun serveur permanent à gérer).
- `site/sw.js` : service worker, cache des fichiers publics de la PWA, sans cache des informations personnelles.
- `site/manifest.webmanifest` : installation sur l’écran d’accueil.
- `.github/workflows/deploy-pages.yml` : contrôle et publication automatique à chaque `push` sur `main`.
- `tests/` : tests métiers et contrôles de structure PWA.
- `docs/` : plan de travail pour l’intégration future.

## Tests
`node tests/test_core.js && node tests/test_pwa.js`

## Publication sur GitHub Pages
1. Créer un dépôt distinct `catena-pwa` sous votre compte GitHub, de préférence avec l’installateur Termux du paquet.
2. Importer **tout** le contenu de la racine de ce dossier dans le dépôt, **pas seulement `site/`**.
3. Dans GitHub `Settings > Pages > Build and deployment > Source`, choisir **GitHub Actions**.
4. La publication automatique provient de `.github/workflows/deploy-pages.yml` ; depuis `Actions`, relancer le workflow si nécessaire.
5. L’adresse prend la forme `https://VOTRE-COMPTE.github.io/catena-pwa/` (à vérifier après déploiement réel).
6. Ouvrir l’adresse avec Chrome Android, menu ⋮ > **Installer l’application**. Sur iOS Safari : Partager > **Sur l’écran d’accueil**.

Pour les mises à jour, conserver `main` comme version publiable et créer une branche pour les changements. Chaque modification doit incrémenter la version du cache de `site/sw.js`, modifier la version affichée et passer les tests. **Ne jamais remplacer la base de Journal de chantier sans validation et recette.**

## Choix techniques
HTML/CSS/JavaScript natifs, sans CDN externe, sans abonnement et sans serveur Termux. GitHub Pages sert uniquement les fichiers statiques ; rien n’est envoyé en base de données. Le code peut être hébergé ailleurs ultérieurement sans réécriture fondamentale.

## Installation initiale avec un seul script Termux

Télécharger `CATENA_PWA_V0_2_0_GITHUB.zip` et `CATENA_CREER_GITHUB_TERMUX.sh` sur le téléphone. Dans Termux :

```sh
termux-setup-storage
bash "$(find -L "$HOME/storage/shared" -maxdepth 5 -name CATENA_CREER_GITHUB_TERMUX.sh -print -quit 2>/dev/null)"
```

Le script installe `gh`, `git` et `unzip` si nécessaire, cherche automatiquement le ZIP dans Téléchargements ou Documents, invite à autoriser GitHub (OAuth dans le navigateur) et crée un dépôt **public contenant uniquement les fichiers fictifs**. Il prépare ensuite GitHub Pages et relance le workflow.

**Limite** : aucune création ni publication dans ton compte GitHub ne peut être confirmée avant l'exécution de ce script et la réussite du workflow sur GitHub. Si GitHub Pages ne peut être activé automatiquement, l'activer via `Settings > Pages > Source = GitHub Actions`.
