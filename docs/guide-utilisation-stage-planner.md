# 📘 Guide d’utilisation – Stage Planner (v 2025)

Ce document vous accompagne **pas à pas** pour exploiter les nouvelles fonctionnalités sans écrire la moindre ligne de code.  
Toutes les captures d’écran citées se trouvent dans `docs/assets/`.

---

## 1. Appliquer les migrations de base de données

> Objectif : ajouter automatiquement les nouvelles tables (réponses, notifications…), les triggers et les colonnes.

### Étape 1 : Pré-requis

| Élément | Version minimum | Où le trouver |
|---------|-----------------|---------------|
| Supabase CLI | 1.155.0 | https://supabase.com/docs/guides/cli |
| Node.js | 18+ | https://nodejs.org |
| Variables d’environnement | `SUPABASE_DB_URL` + token service rôle | demandés au responsable technique |

### Étape 2 : lancer le script d’automatisation

1. Ouvrez un **terminal** dans le dossier racine du projet.  
2. Rendez le script exécutable :  
   ```bash
   chmod +x scripts/apply-migrations.sh
   ```
3. Exécutez :  
   ```bash
   ./scripts/apply-migrations.sh
   ```
4. Lisez les messages :  
   ✓ = migration appliquée | ⚠ = avertissement (ex. colonne déjà existante).

En cas d’erreur :

* Vérifiez la **connexion internet**.
* Contrôlez `SUPABASE_DB_URL`.
* Relancez simplement le script : il est **idempotent** (aucun risque de doublons).

---

## 2. Utiliser le nouveau calendrier « drag & drop »

![Gif Drag & Drop](/docs/assets/calendar-drag.gif)

1. Ouvrez le tableau de bord régisseur (`/dashboard/regisseur/calendar`).  
2. **Survolez** un évènement : un petit menu s’affiche (⚙️ voir capture `calendar-hover.png`)  
   * ✏️ Modifier  
   * 📄 Dupliquer  
   * 🗑️ Supprimer  
3. **Glisser-déposer pour dupliquer** :  
   * Cliquez, maintenez, déplacez l’évènement sur la cellule désirée.  
   * Relâchez : la copie est créée en **brouillon** (toast de confirmation vert).  
4. **Supprimer en un clic** :  
   * Survolez → 🗑️ Supprimer → confirmer dans la pop-up rouge.

> Astuce : le calendrier supporte les vues Mois / Semaine / Jour / Agenda (boutons en haut à gauche).

---

## 3. Gérer la validation d’équipe (3 états)

| Couleur | Signification | Action |
|---------|---------------|--------|
| 🟢 Vert | **Sélectionné** (sera « validé ») | 1ᵉʳ clic sur la carte |
| 🔴 Rouge | **Non retenu** | 2ᵉ clic |
| ⚪ Gris | **En attente** (stand-by) | 3ᵉ clic ou état initial |

### Procédure pas à pas

1. Depuis la page « Détails de l’évènement », faites défiler jusqu’à « Intermittents disponibles ».
2. **Cliquez** sur chaque carte pour faire cycler l’état.  
   * Une légende couleur rappelle les trois statuts (voir `team-legend.png`).
3. Appuyez sur **« Mettre à jour l’équipe »**.  
   * Les intermittents **verts** passent en statut `valide`.  
   * Les **rouges** passent en `non_retenu`.  
   * Les **gris** ne changent pas et pourront encore répondre plus tard.  
4. Répétez l’opération autant de fois que nécessaire : les statuts sont réversibles.

---

## 4. Corriger les couleurs personnalisées

Les couleurs proviennent des variables CSS générées par le thème de votre organisation.

### Vérifier / modifier

1. Allez dans **Paramètres → Personnalisation**.  
2. Choisissez les deux couleurs du **dégradé primaire / secondaire**.  
3. Sauvegardez : un toast « Thème mis à jour » apparaît.

### Si les couleurs ne s’appliquent pas :

| Solution | Détails |
|----------|---------|
| 🗑️ Vider le cache | `Ctrl + Maj + R` pour rafraîchir les variables CSS. |
| 🌗 Basculer Dark/Light | Cliquez sur l’icône lune/soleil pour forcer la ré-application. |
| 🔌 Déconnexion/reconnexion | Recharge le `themeStore` et les variables. |
| 🔑 Vérifier la base | Table `regisseur_profiles` → colonnes `couleur_gradient_1/2` contiennent bien un hex `#RRGGBB`. |

---

## 5. Résolution des problèmes courants

| Problème | Cause probable | Correctif rapide |
|----------|----------------|------------------|
| `supabase db push` refuse la migration | Migration déjà appliquée | Passer à l’étape suivante, rien à faire. |
| Drag & drop inactive | Navigateur vieux ou zoom > 90 % | Mettez Chrome/Edge à jour, réinitialisez le zoom (Ctrl + 0). |
| Toast « Erreur lors de la validation » | Connexion instable | Recharger la page ; la mise à jour est atomique. |
| Couleurs inversées | Hex invalide (ex : `#GGGGGG`) | Utilisez un code hex valide (0-9, A-F). |
| Notifications non lues bloquées | Ad-block désactive les web-sockets | Autorisez le domaine `*.supabase.co` dans l’Ad-block. |

---

## 6. Captures d’écran & supports visuels

| Nom | Description |
|-----|-------------|
| `calendar-hover.png` | Menu contextuel (modifier/dupliquer/supprimer) |
| `calendar-drag.gif` | Exemple complet de drag & drop |
| `team-legend.png` | Légende des trois statuts |
| `theme-settings.png` | Interface de personnalisation des couleurs |
| `notifications-panel.png` | Panneau de notifications temps réel |

> Les GIFs sont légers (< 2 Mo) : parfaits pour la documentation interne ou un Notion.

---

## 🏁 Vous êtes prêt !

Vous savez maintenant :

✅ Lancer les migrations.  
✅ Maîtriser le calendrier interactif.  
✅ Construire une équipe en trois clics.  
✅ Harmoniser la charte graphique.  
✅ Dépanner les incidents fréquents.

_Bonne planification avec Stage Planner !_  
