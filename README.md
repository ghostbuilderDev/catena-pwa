# PEC V0.2.2 — Correctif Termux

La mise à jour précédente s’arrêtait sur `ENOENT` dans `tests/test_concepteur.js` : le fichier
`EXEMPLE_LOCAL_PPE1_EXCEL/EXEMPLE_PPE1_Excel.png` est intentionnellement privé et absent de
GitHub. Le test prend maintenant en compte les deux contextes : ZIP local (avec exemple) et
GitHub (sans exemple). Aucune donnée PPE1 de chantier n’est transférée.

# PEC — PWA V0.2.1 (concepteur de plans)

Cette livraison repart exactement de la **PWA PEC V0.2.0** et ajoute un **concepteur séparé** (`site/concepteur.html`). Aucune modification à Journal de chantier ni à Supabase.

## Fonctions

- Import **PNG/JPEG/WEBP** et aperçu **PDF** ; le fichier reste local (IndexedDB), sans téléversement.
- Format A4 paysage/portrait ou proportions du fichier.
- Six symboles de légende, sans fond, posables sur le plan, avec numéro détachable et trait.
- Connexions volantes : deux extrémités repositionnables.
- Ajustement rapide de taille, zoom et export PNG (pour les fonds image).
- Sauvegarde automatique des repères sur l'appareil, export JSON des coordonnées.

## Plan PPE1 du fichier Excel : exemple privé

Dans l’archive, le fichier `EXEMPLE_LOCAL_PPE1_EXCEL/EXEMPLE_PPE1_Excel.png` est un rendu haute définition de la feuille **PPE1** du classeur fourni. Il contient des données de schéma qui ne doivent pas être publiées sur un dépôt public. Le dossier est **volontairement hors de `site/`**.

Pour l'utiliser : téléchargez ou extrayez la photo du ZIP sur votre appareil ; ouvrez `Concevoir un PPE` puis cliquez sur « Importer l'exemple PPE1 extrait d'Excel » et choisissez cette image. Les connexions déjà intégrées dans la feuille Excel sont dessinées dans l'image : ne les confondez pas avec les nouveaux symboles éditables que vous placez.

Pour créer un nouveau plan, chargez une **image sans annotations**, puis posez les symboles du concepteur.

## Limite PDF

La PWA peut importer le PDF localement pour visualisation dans le navigateur ; ce mode est une **prévisualisation native non calibrée**. Sur certains navigateurs (notamment mobiles), le PDF peut ne pas s'afficher ou comporter son propre zoom et ses marges. Les coordonnées de symboles ne sont alors **pas garanties**. Exportez la page PDF en PNG/JPEG pour la conception précise et pour exporter le résultat. Le PDF n'est pas envoyé à un service externe.

## GitHub Pages / confidentialité

Le workflow GitHub Pages ne publie que le dossier `site/`. Ne copiez jamais le rendu PPE1 privé dans `site/assets` ni dans un dépôt public. Le script Termux ne publie que les fichiers publics de l'application ; jamais le dossier `EXEMPLE_LOCAL_PPE1_EXCEL`.

## Tests

`node tests/test_core.js && node tests/test_pwa.js && node tests/test_concepteur.js`

**Démonstration non opérationnelle.** Ne pas utiliser pour valider, consigner, autoriser une pose ou un retrait de protection électrique caténaire. Le contrôle du plan et les procédures et documents SNCF restent extérieurs à cette application.

L'archive contient également `FOND_S11_SANS_CONNEXIONS_AJOUTEES.png`, le fond d'image S11 sous-jacent issu du même fichier Excel ; il facilite un essai à partir d'un fond moins chargé, sans les repères graphiques ajoutés par la feuille PPE1.

## Mise à jour GitHub depuis Termux

Télécharger le ZIP puis copier les commandes de la réponse ChatGPT, qui extraient automatiquement `PEC_MAJ_CONCEPTEUR_TERMUX.sh` depuis ce ZIP. Ce script clone le dépôt existant `ghostbuilderDev/catena-pwa`, ajoute uniquement les sources de la PWA, crée un commit et pousse sur `main`, sans forcer l'historique. Vérifiez ensuite le workflow GitHub Pages.


## Nouveautés 0.2.3
- Nom visible : PEC
- Le plan s’ajuste mieux dans sa fenêtre
- Le plan se déplace plus facilement
- Zoom plus intuitif dans l’image
- Connexion volante plus simple à positionner
- Fenêtre de réglage du symbole améliorée


### Correctif de publication Termux
Le premier ZIP de la v0.2.3 contenait le script de la v0.2.2, qui attendait un ancien nom de dossier. La livraison corrigée utilise le nom de dossier correct, vérifie la présence des fichiers avant le `git push` et conserve les clés de stockage de la v0.2.2 (`catena-concepteur-v021`, `catena-concepteur-fonds-v1`) afin de retrouver les plans locaux déjà préparés. Le cache PWA est relevé à `catena-pwa-0.2.3`.
