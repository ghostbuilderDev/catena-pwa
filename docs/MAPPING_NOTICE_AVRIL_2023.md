# Correspondance PEC / Mode opératoire SERCE–OPPBTP–SNCF Réseau (avril 2023, version 2)

Cette grille est un **repérage de conception**, pas une copie des prescriptions ni une validation de conformité. Les pages ci-dessous sont les pages imprimées du PDF joint.

| Page | Élément décrit dans le document | Traitement PEC V0.3.0 | Limite |
|---|---|---|---|
| 2 | Consignation par l'exploitant / mesures complémentaires par l'entreprise | Deux périmètres explicitement séparés | PEC ne réalise jamais la première étape |
| 3 | Chronologie en dix phases | Repères de phase dans coordination | PEC ne pilote pas les autorisations/étapes SNCF |
| 4–6 | Documents et plan de protection électrique | Préparation, symboles et import S11 | Validation technique humaine requise |
| 7–9 | Demande et attestation de fin de première étape | Référence documentaire saisie manuellement | Aucune vérification d'authenticité |
| 10–11 | VAT sur installation 25 kV alternatif | Attestations génériques associées à la déclaration | Pas de prescription d'opération ni de contrôle à distance |
| 12–13 | Mesures complémentaires 25 kV | Déclaration photographique d'une connexion identifiée | Pas de validation physique |
| 14–15 | VAT sur installation 1500 V continu | Régime de l'installation à sélectionner | Procédure spécifique à consulter dans les consignes applicables |
| 16–17 | Mesures complémentaires 1500 V | Même suivi déclaratif, paramétrage documentaire | Pas de décision technique automatisée |
| 18 | Maintien de l'équipotentialité durant les travaux | Phase travaux et rappel responsabilité humaine | Aucune supervision électrique réelle |
| 19 | Levée des mesures complémentaires dans l'ordre inverse | Groupes de retrait en ordre inverse des groupes de pose | Groupes librement définis par responsable, non homologués |
| 20–21 | Avis de cessation / déconsignation par l'exploitant | Références externes, fin de suivi seulement | Aucune restitution ou déconsignation depuis PEC |

## Décisions de conception à valider
- Granularité de l’ordre : groupes parallèles possibles, groupes successifs imposés. Le classement proposé n'est pas calculé selon les normes.
- Nom et compétences de l'agent : démonstrateur, aucune preuve d'identité, habilitation ou formation.
- Acceptation par responsable séparée de la déclaration ; nécessite des contrôles physiques et documentaires externes.
- En cas d'absence de réseau : mécanisme d'acknowledgement et règles de non-progression à définir par l'exploitant, jamais état « réussi » hors ligne non synchronisé.
- Journal : horodatage fiable et non-répudiation à construire côté serveur.

## Veille réglementaire
Le référentiel utilisateur date de 2023 ; des textes de 2026 et des modifications d'application ont été publiés. La conformité de production doit être réexaminée sur les textes en vigueur et à leurs dates d'effet avec SNCF Réseau et les responsables de sécurité de l'entreprise.
