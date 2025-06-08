# 📜 Stage Planner — Récapitulatif des Améliorations (Juin 2025)

Ce document présente l’ensemble des évolutions livrées pour **Stage Planner** afin d’atteindre la parité fonctionnelle demandée pour la gestion des intermittents, la « Feuille de route » et le flux complet de proposition / réponse de dates.

---

## 1. Fonctionnalités ajoutées

| Domaine | Nouveautés |
|---------|-----------|
| Feuille de route | • Sélecteur *Artistes / Techniques* par item de planning.<br>• Badges colorés dans toutes les vues.<br>• Bouton « Télécharger la feuille de route » avec filtre (artistes, techniques, complet) et génération *print-first* (PDF via impression). |
| Création / édition d’événement | • UI mise à jour (design cyber-cristal).<br>• Validation champs manquants.<br>• Ajout automatique du champ `groupe` dans `event_planning_items`. |
| Gestion des intermittents | • Tableau de bord inchangé mais flux complété.<br>• Nouveau formulaire « Répondre à la proposition » : accepter, refuser ou proposer des dates alternatives (+ commentaire).<br>• Historique des réponses visible.<br>• Mise à jour automatique du statut dans `event_intermittent_assignments`. |
| Remplacement | • Politique RLS et UI refinées pour envoyer une demande de remplacement. |
| CRUD global | • Suppression d’événement sécurisée avec modale.<br>• Re-insertion propre des sous-tables lors de l’édition. |
| Dev / DX | • Script `scripts/apply-migrations.sh` pour appliquer les migrations.<br>• Couleurs, animations et composants UI factorisés. |

---

## 2. Migrations de base de données

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/20250608_add_planning_group.sql` | Ajout colonne **`groupe`** (`artistes` / `techniques`) dans `event_planning_items` + contrainte CHECK. |
| `supabase/migrations/20250608_add_event_responses.sql` | Nouvelle table **`event_intermittent_responses`** (accept / refuse / propose_alternative) ; triggers, index et politiques RLS ; fonction de synchronisation de statut dans `event_intermittent_assignments`. |

Les migrations sont idempotentes et commentées ; exécutez-les via le script ci-dessous.

---

## 3. Composants créés ou modifiés

| Fichier | Type | Résumé des changements |
|---------|------|------------------------|
| `src/pages/regisseur/CreateEvent.tsx` | ⚙️ Modifié | Champ `groupe`, sélecteur visuel, sauvegarde Supabase. |
| `src/pages/regisseur/EventDetails.tsx` | ⚙️ Modifié | Affichage des groupes + bouton téléchargement feuille de route. |
| `src/pages/intermittent/IntermittentEventDetails.tsx` | ⚙️ Modifié | Intégration du **EventResponseForm** + historique réponses. |
| `src/components/events/FeuilleDeRouteDownload.tsx` | 🆕 | Génération & impression de la feuille de route filtrée. |
| `src/components/intermittent/EventResponseForm.tsx` | 🆕 | Formulaire accept/refuse/propose_alternative + dates multiples. |
| `scripts/apply-migrations.sh` | 🆕 | Automatisation CLI Supabase. |

---

## 4. Installation & Utilisation

1. **Cloner le dépôt et installer les dépendances**
   ```bash
   git clone <repo-url>
   cd planner-suite-01
   pnpm install   # ou npm / yarn
   ```
2. **Configurer les variables d’environnement**
   ```
   SUPABASE_URL=https://xyz.supabase.co
   SUPABASE_ANON_KEY=xxxxx
   SUPABASE_DB_URL=postgresql://user:pass@host:5432/db
   ```
3. **Appliquer les migrations**
   ```bash
   chmod +x scripts/apply-migrations.sh
   ./scripts/apply-migrations.sh
   ```
4. **Lancer le serveur de développement**
   ```bash
   pnpm dev
   ```
5. **Build & preview**
   ```bash
   pnpm build && pnpm preview
   ```

---

## 5. Prochaines étapes recommandées

| Priorité | Action |
|----------|--------|
| ★★★ | Couverture **tests e2e** (Playwright) sur le nouveau flux de réponse / feuille de route. |
| ★★★ | Auditer et verrouiller les politiques **RLS** pour `event_intermittent_responses`. |
| ★★☆ | Génération PDF serveur pour un rendu pixel-perfect hors navigateur. |
| ★★☆ | Mode hors-ligne PWA (cache feuille de route + réponses en différé). |
| ★★☆ | Benchmarks et index supplémentaires (`groupe`, dates) pour planner volumineux. |
| ★☆☆ | Storybook : ajouter les deux nouveaux composants + variantes de badges. |
| ★☆☆ | Pipeline CI : lancer `scripts/apply-migrations.sh` sur environnement de test. |

---

✅ **Stage Planner** est désormais aligné avec la feuille de route 2025 : modules intermittents complets, feuille de route polyvalente et UX modernisée.  
Pour toute question : `david.marchand@...` ou canal #xo-004.  
Merci de contribuer !
