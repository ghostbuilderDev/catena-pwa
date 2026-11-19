# PEC — Protection électrique caténaire
## Version 0.3.0 — Coordination déclarative / démonstration

Cette version ajoute un **espace Coordination** à l’application PEC et conserve le **concepteur de plan** de la V0.2.4 avec ses six symboles et la CV à arc unique.

### Accès
- `site/index.html` : application existante, lien vers la coordination
- `site/concepteur.html` : plan de perchage, symboles inchangés, import image/PDF
- `site/coordination.html` : suivi des agents, responsable, journal et déclarations

### Parcours implémenté (simulation, non opérationnel)
1. Import du plan préparé sur **ce même navigateur** depuis le concepteur. Affectation nominative et groupes d’ordre configurés manuellement.
2. Saisie d'une **référence documentaire externe** correspondant à l'attestation de fin de première étape ; préparation du plan déclarée vérifiée.
3. Collecte des déclarations de pose, avec cases d’attestation personnelles et **photo obligatoire**.
4. Recollement par le responsable, séparé du déclarant ; rejet/écart bloquant et correction déclarative.
5. Passage au suivi de la phase travaux **sans aucun ordre d'engager les travaux**.
6. Déclarations de retrait **par groupes dans l'ordre inverse** ; photos et recollement distinct.
7. Fin du suivi, avec référence documentaire externe. **Ne restitue pas une installation ni une attestation**.

Les agents d'un même groupe peuvent déposer leurs déclarations indépendamment, mais le groupe suivant reste verrouillé tant que tous les points du précédent ne sont pas recollés. L'ordre des groupes est une **configuration humaine à vérifier** : il n'est pas calculé automatiquement selon les règles de sécurité ferroviaire.

### Concepteur S11 : lisibilité locale
- Import PNG, JPEG, WEBP ou PDF ; PDF natif **non calibré** pour un placement précis.
- Traitement local d'une **image** : niveaux de contraste et renforcement de contours sans serveur et sans IA.
- Aperçu original/corrigé et possibilité de restaurer la source.
- **Aucune restauration réelle de détail perdu** ; ne modifie pas la géométrie de la caténaire ou le contenu métier.
- L'image d'origine doit être conservée et toute correction doit être comparée au document de référence approuvé.

### Limites essentielles
- Aucun compte vérifié, aucune habilitation certifiée, aucun horodatage serveur. Le choix d'un profil est une **simulation**.
- Les mises à jour d'état sont visibles entre onglets du **même navigateur/origine** via `localStorage` et `BroadcastChannel`. **Aucune synchronisation entre téléphones ou transmission sécurisée n'est implémentée.**
- Photos stockées dans IndexedDB local, non dans GitHub. Le JSON de suivi n'exporte pas les photos.
- Aucune dépêche officielle émise ; la « transmission » est un **brouillon non officiel** à copier.
- Le code PWA est public via GitHub Pages. **Ne jamais intégrer dans `site/` un plan S11 réel ou une procédure interne.**
- Non autorisé à piloter de véritables protections électriques, même en cas de tableau de bord entièrement vert.

### Contrôles
```sh
node tests/test_core.js
node tests/test_pwa.js
node tests/test_concepteur.js
node tests/test_workflow.js
node tests/test_coordination.js
```

### Mise à jour GitHub depuis Termux
Télécharger l'archive ZIP `PEC_PWA_V0_3_0_COORDINATION.zip` et lancer le script `MAJ_TERMUX.sh` contenu à sa racine. L'archive vérifie son contenu avant tout clonage et ne pousse **jamais** les exemples privés sur GitHub.

### Travail encore indispensable pour une version exploitable en entreprise
Validation métier et juridique des séquences et libellés, intégration d'un serveur authentifié avec comptes nominatifs/habilitations, RLS/contrôles côté serveur, traçabilité horodatée et inaltérable, stockage privé des photos, accusés de réception sécurisés, états de synchronisation, gestion offline sûre, tests de terrain, cybersécurité et circuit de dépêches homologué. Aucun de ces mécanismes n'est prétendu présent en V0.3.0.

Référentiel étudié : **SERCE / OPPBTP / SNCF Réseau — Consignation pour travaux caténaires, mode opératoire, version 2, avril 2023** (document remis par l'utilisateur, non embarqué dans le site). Des textes ultérieurs ont été publiés et nécessitent un examen de conformité avant tout déploiement.

### Architecture cible
Voir `docs/ARCHITECTURE_PRODUCTION_SECURITÉ.md` pour le schéma d’authentification, de synchronisation, de contrôle serveur, de mode dégradé et d’audit à concevoir avant tout usage réel.
