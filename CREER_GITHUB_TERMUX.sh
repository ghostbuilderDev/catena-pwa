#!/data/data/com.termux/files/usr/bin/bash
# CATÉNA PWA 0.2.0 — création ponctuelle du dépôt et activation GitHub Pages.
# Aucune modification de Journal de chantier. Aucune donnée SNCF réelle publiée.
set -Eeuo pipefail
ARCHIVE='CATENA_PWA_V0_2_0_GITHUB.zip'
REPO='catena-pwa'
HERE="$HOME"

fail(){ printf '\nERREUR : %s\n' "$*" >&2; exit 1; }
info(){ printf '\n→ %s\n' "$*"; }

find_archive(){
  local override="${1:-}" dir hit
  if [[ -n "$override" && -f "$override" ]]; then printf '%s\n' "$override"; return 0; fi
  for dir in "$PWD" "$HOME/storage/downloads" "$HOME/storage/shared/Download" "$HOME/storage/shared/Documents" "$HOME/storage/documents" "$HOME/storage/shared/Téléchargements" "$HOME/storage/shared/Downloads" "$HOME"; do
    [[ -d "$dir" ]] || continue
    if [[ -f "$dir/$ARCHIVE" ]]; then printf '%s\n' "$dir/$ARCHIVE"; return 0; fi
  done
  for dir in "$HOME/storage/downloads" "$HOME/storage/shared/Documents" "$HOME/storage/shared/Download" "$HOME/storage/shared"; do
    [[ -d "$dir" ]] || continue
    hit="$(find -L "$dir" -maxdepth 5 -type f -name "$ARCHIVE" -print -quit 2>/dev/null || true)"
    if [[ -n "$hit" ]]; then printf '%s\n' "$hit"; return 0; fi
  done
  return 1
}

if [[ "${1:-}" == '--aide' ]]; then
  echo "Usage : bash CATENA_CREER_GITHUB_TERMUX.sh [chemin du ZIP]"
  echo "Lance la création de catena-pwa et son hébergement GitHub Pages."
  exit 0
fi

info 'CATÉNA — publication PWA GitHub Pages (démonstration uniquement)'
[[ -d "$HOME/storage" ]] || { info 'Autorisation du stockage Android'; termux-setup-storage || true; }
ZIP="$(find_archive "${1:-}")" || fail "Archive $ARCHIVE introuvable. Télécharge-la puis place-la dans Téléchargements ou Documents."
info "Archive trouvée : $ZIP"

for cmd in unzip git gh; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    command -v pkg >/dev/null 2>&1 || fail "Commande $cmd absente. Utilise Termux pour exécuter cet installateur."
    info 'Installation des outils GitHub, git et unzip'
    pkg install gh git unzip -y || fail 'Installation des outils Termux impossible.'
    break
  fi
done
unzip -tq "$ZIP" >/dev/null || fail 'Archive corrompue : télécharge le ZIP de nouveau.'

if ! gh auth status >/dev/null 2>&1; then
  info 'Connexion GitHub personnelle nécessaire (OAuth sécurisé, aucun mot de passe à transmettre)'
  gh auth login --hostname github.com --git-protocol https --web || fail 'Connexion GitHub non autorisée.'
fi
gh auth setup-git || fail "Impossible de préparer l'identification GitHub pour git."
LOGIN="$(gh api user --jq '.login')" || fail 'Profil GitHub inaccessible.'
USER_ID="$(gh api user --jq '.id')" || fail 'Identifiant GitHub inaccessible.'
FULL="$LOGIN/$REPO"

# Ne jamais écraser un dépôt existant : mises à jour incrémentales séparées.
if gh repo view "$FULL" --json name -q '.name' >/dev/null 2>&1; then
  echo "Le dépôt $FULL existe déjà : aucune modification effectuée."
  echo "Pour le consulter : https://github.com/$FULL"
  exit 0
fi
if [[ -e "$HOME/$REPO" ]]; then
  fail "Le dossier $HOME/$REPO existe déjà. Pour éviter un écrasement, renomme-le avant la création."
fi

STAGE="$(mktemp -d "$HOME/catena-prep-XXXXXX")"
trap '[[ -d "$STAGE" ]] && rm -rf "$STAGE"' EXIT
unzip -qo "$ZIP" -d "$STAGE" || fail 'Extraction impossible.'
SRC="$STAGE/CATENA_PWA_V0_2_0_GITHUB"
[[ -f "$SRC/site/index.html" && -f "$SRC/.github/workflows/deploy-pages.yml" ]] || fail "Le ZIP n'est pas le paquet de publication CATÉNA attendu."
# Contrôle critique : jamais de vrais plans SNCF inclus dans la publication.
[[ ! -f "$SRC/site/assets/schema_s11_extrait.png" ]] || fail 'Arrêt sécurité : un vrai plan est présent dans les fichiers publics.'

info "Préparation locale du projet $HOME/$REPO"
mv "$SRC" "$HOME/$REPO"
cd "$HOME/$REPO"
git init -b main >/dev/null
git config user.name "$LOGIN"
git config user.email "$USER_ID+$LOGIN@users.noreply.github.com"
git add -A
git commit -m 'CATENA: initialiser PWA autonome de démonstration v0.2.0' >/dev/null

info "Création du dépôt public GitHub $FULL (données fictives uniquement)"
if ! gh repo create "$FULL" --public --description 'CATÉNA : PWA pédagogique de préparation et de suivi de protections électriques (démonstration, non opérationnelle)' --source . --remote origin --push; then
  fail "La publication GitHub a échoué. Les fichiers locaux sont conservés dans $HOME/$REPO."
fi

info 'Activation de GitHub Pages (publication GitHub Actions)'
if gh api -X POST "repos/$FULL/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo 'GitHub Pages activé.'
elif gh api "repos/$FULL/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/$FULL/pages" -f build_type=workflow >/dev/null 2>&1 || true
  echo 'GitHub Pages existe déjà ; vérifie le mode GitHub Actions dans Settings > Pages.'
else
  echo 'Activation automatique non autorisée par GitHub. Ouvre Settings > Pages > Source > GitHub Actions.'
fi
# Un premier workflow peut avoir démarré avant l'activation de Pages ; relance explicite.
gh workflow run deploy-pages.yml --repo "$FULL" --ref main >/dev/null 2>&1 || true

printf '\n=============================================\n'
printf 'GitHub : https://github.com/%s\n' "$FULL"
printf 'URL PWA prévue : https://%s.github.io/%s/\n' "$LOGIN" "$REPO"
printf 'Actions : https://github.com/%s/actions\n' "$FULL"
printf 'Code local : %s/%s\n' "$HOME" "$REPO"
printf '=============================================\n'
echo "Ne pas utiliser CATÉNA pour des protections électriques réelles."
echo "Vérifie que le workflow « CATENA · Tests et publication PWA » est vert avant d'installer l'application."
