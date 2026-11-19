# PEC — Architecture cible avant tout usage ferroviaire réel

**Statut : proposition de conception ; aucune mise en exploitation autorisée.**

## Principe

GitHub Pages peut héberger le code public de la PWA, **pas** les fonds S11, photos, identités opérationnelles, habilitations ni le journal de sécurité. Le suivi réel exige un serveur authentifié administré par une organisation habilitée, des validations métier et un audit de cybersécurité. La PWA n'a aucune fonction autonome de consignation, déconsignation, autorisation ou remise sous tension.

## Modules serveur proposés

1. **Gestion des identités et des habilitations** : identité métier vérifiée, authentification forte, profil entreprise/chantier, rôle réel (responsable, agent affecté, contrôleur autorisé), habilitations et validité explicites, date d'expiration, révocation immédiate.
2. **Opération** : zone, identifiants internes, calendrier, responsables, état documentaire externe, régime électrique, version de plan et dépendances. Tout changement de plan crée une *nouvelle version*, jamais une modification silencieuse du plan approuvé.
3. **Dispositifs et ordre** : type de symbole, repère, coordonnées sur plan, vague/groupe de pose, identité de l'agent, prérequis approuvés. Autorisation d'éditer avant ouverture, gel du plan ensuite.
4. **Déclarations** : tentative d'agent, horodatage serveur, identité signée par la session, référence de version de plan, réponses déclaratives, pièce jointe, empreinte calculée côté serveur et accusé de dépôt. Chaque tentative est append-only.
5. **Recollement** : décision distincte et autorisée du responsable (accepté/écart), raison obligatoire en cas de rejet, lien immuable à la déclaration contrôlée, horodatage serveur et accusé de réception.
6. **Anomalies** : blocage des étapes dépendantes, nouveau cycle de déclaration après traitement externe et confirmation humaine documentée, jamais déblocage silencieux.
7. **Photos/plan** : stockage privé chiffré au repos, accès court par URL signée après autorisation, journal d'accès, règles de conservation approuvées, contrôle antivirus et formats, sauvegarde/restauration testée.
8. **Journal d'événements** : écriture côté serveur, immuable ou techniquement protégée (append-only + rétention), horodatage serveur, contrôle de séquence, suivi de révision et consultation auditée.

## API et transactions

- `GET operation/:id/current-plan` renvoie une **révision exacte** et les droits de lecture du titulaire.
- `POST /operations/:id/declare` reçoit `{pointId, phase, planVersion, expectedOperationRevision, idempotencyKey, evidenceObjectId, checks}` ; le serveur vérifie autorisation, agent affecté, groupe actif, documents requis, absence d'écart, état courant et rattachement à la bonne version.
- `POST /operations/:id/review` réservé au responsable autorisé, interdit l'auto-recollement, exige une déclaration actuelle non déjà examinée, enregistre la décision dans la même transaction atomique.
- Les mutations d'état (ouvrir pose, clore recollement, ouvrir retrait, terminer suivi) exigent un contrôle côté serveur des conditions au moment de la transaction. Jamais de décision de sécurité basée sur l'état d'une page web.
- Utiliser des clés d'idempotence et une gestion des révisions (optimistic locking) pour rejeter les duplications et les états périmés.
- Éviter toute action déterminante depuis un téléphone non synchronisé : une opération en attente de réseau reste **« non reçue »**, jamais « validée ».

## Synchronisation et mode dégradé

- Abonnement événements authentifiés (WebSocket ou mécanisme équivalent) avec séquences, reprise après reconnexion, accusé serveur, détection de pertes et d'écarts entre clients.
- La PWA peut stocker un **brouillon local**, mais doit toujours distinguer « enregistré localement », « envoyé », « reçu par le serveur », « examiné », « accepté ». Aucun état ne doit passer à accepté sans réponse du serveur.
- En cas d'absence de réseau, de preuve manquante, de plan périmé, de contestation ou d'identité non validée, l'application doit arrêter la progression numérique et orienter vers la procédure officielle définie par l'exploitant.
- Vérifier la résilience à la reprise de réseau en zone ferroviaire, conflits d'état, retards d'upload, doublons, photos défaillantes et changements de responsable pendant l'opération.

## Sécurité et confidentialité

- Modèle de moindre privilège par opération et par groupe d'agents ; isoler chaque organisation et chaque chantier.
- Prévenir les accès croisés aux opérations, usurpations d'identité, changements de rôle côté client, modification de numéros et injection de plan depuis un autre chantier.
- Politique de conservation adaptée aux responsabilités et aux règles de protection des données ; accord sur le partage des photos et documents internes, avec dispositif d'effacement/destruction conforme.
- Ne pas publier le PDF de procédure de l'employeur ou un plan S11 réel dans un dépôt public, dans des ressources PWA précachées, ni dans des journaux console.

## Validation préalable indispensable

La notice SERCE–OPPBTP–SNCF Réseau d'avril 2023 ne suffit pas à elle seule pour homologuer un logiciel de suivi. Il faut confronter les écrans et les enchaînements aux **consignes locales, procédures et règlements en vigueur à la date de mise en service**, puis faire valider par les responsables de la protection électrique, les responsables d'exploitation et les spécialistes cybersécurité. Les textes de 2026 peuvent avoir des dates d'application futures et doivent être considérés à leur date d'effet.

## Conditions de recette opérationnelle (non atteintes en V0.3.0)

- N'établit jamais une autorisation ou une dépêche officielle de son propre chef.
- Impossibilité de déclarer un autre point sans habilitation, sans identité authentifiée ou sur mauvais plan.
- Impossibilité d'émettre un recollement de sa propre déclaration.
- Impossible de passer une dépendance si un seul point du groupe requis est absent, contesté ou non recollé.
- Empêche le retrait numérique d'une vague non ouverte et interdit la fin de suivi si un retrait est non recollé.
- Les pannes réseau, erreurs de photo et décalages d'horodatage apparaissent clairement et bloquent le statut « reçu / accepté ».
- Les essais terrain et audits de sécurité ont été menés sur un environnement séparé du système opérationnel.
