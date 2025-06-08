#!/bin/bash

# Script d'application des migrations Supabase pour PLANNER Suite
# Ce script applique les nouvelles migrations dans l'ordre chronologique

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Chemins
MIGRATIONS_DIR="./supabase/migrations"
LOG_FILE="./migration_$(date +%Y%m%d_%H%M%S).log"

# Fonction pour afficher les messages d'information
info() {
  echo -e "${BLUE}[INFO]${NC} $1"
  echo "[INFO] $1" >> "$LOG_FILE"
}

# Fonction pour afficher les messages de succès
success() {
  echo -e "${GREEN}[SUCCÈS]${NC} $1"
  echo "[SUCCÈS] $1" >> "$LOG_FILE"
}

# Fonction pour afficher les avertissements
warning() {
  echo -e "${YELLOW}[ATTENTION]${NC} $1"
  echo "[ATTENTION] $1" >> "$LOG_FILE"
}

# Fonction pour afficher les erreurs et quitter
error() {
  echo -e "${RED}[ERREUR]${NC} $1"
  echo "[ERREUR] $1" >> "$LOG_FILE"
  exit 1
}

# Vérifier si le dossier des migrations existe
if [ ! -d "$MIGRATIONS_DIR" ]; then
  error "Le dossier de migrations '$MIGRATIONS_DIR' n'existe pas."
fi

# Initialiser le journal de logs
echo "=== Journal d'application des migrations PLANNER Suite ===" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "==================================================" >> "$LOG_FILE"

# Annoncer le début du processus
info "Démarrage de l'application des migrations Supabase..."
info "Les logs seront enregistrés dans $LOG_FILE"

# Trouver toutes les migrations SQL et les trier par ordre chronologique
migrations=($(find "$MIGRATIONS_DIR" -name "*.sql" | sort))

if [ ${#migrations[@]} -eq 0 ]; then
  warning "Aucun fichier de migration trouvé dans $MIGRATIONS_DIR"
  exit 0
fi

info "Nombre de migrations trouvées: ${#migrations[@]}"

# Compteurs pour les statistiques
success_count=0
error_count=0

# Appliquer chaque migration
for migration in "${migrations[@]}"; do
  migration_name=$(basename "$migration")
  
  info "Application de la migration: $migration_name"
  
  # Exécuter la migration avec Supabase CLI
  # Note: Remplacer cette commande par celle appropriée à votre environnement
  if supabase db push --db-url "$SUPABASE_DB_URL" --file "$migration" 2>> "$LOG_FILE"; then
    success "Migration '$migration_name' appliquée avec succès"
    ((success_count++))
  else
    error_code=$?
    warning "Échec de l'application de la migration '$migration_name' (code: $error_code)"
    warning "Consultez $LOG_FILE pour plus de détails"
    ((error_count++))
    
    # Demander à l'utilisateur s'il souhaite continuer malgré l'erreur
    read -p "Voulez-vous continuer avec les migrations suivantes? (o/n): " choice
    case "$choice" in
      o|O|oui|Oui|OUI )
        info "Poursuite des migrations..."
        ;;
      * )
        error "Application des migrations interrompue par l'utilisateur"
        ;;
    esac
  fi
done

# Afficher le résumé
echo -e "\n=== Résumé de l'application des migrations ==="
echo "Total des migrations: ${#migrations[@]}"
echo -e "Migrations réussies: ${GREEN}$success_count${NC}"
echo -e "Migrations échouées: ${RED}$error_count${NC}"
echo "================================================="

# Enregistrer le résumé dans le journal
echo -e "\n=== Résumé de l'application des migrations ===" >> "$LOG_FILE"
echo "Total des migrations: ${#migrations[@]}" >> "$LOG_FILE"
echo "Migrations réussies: $success_count" >> "$LOG_FILE"
echo "Migrations échouées: $error_count" >> "$LOG_FILE"
echo "=================================================" >> "$LOG_FILE"

# Sortir avec le code approprié
if [ $error_count -gt 0 ]; then
  exit 1
else
  success "Toutes les migrations ont été appliquées avec succès!"
  exit 0
fi
