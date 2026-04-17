# 🔧 Refactoring TODO

> Analyse de la codebase effectuée le 17 avril 2026
> Note globale : **6.5/10**

## 📋 Vue d'ensemble

Cette TODO liste les recommandations pour améliorer la qualité du code, réduire la complexité et améliorer la maintenabilité de l'application Livenotes.

---

## 🔴 Priorité HAUTE (Urgent - À faire immédiatement)

### 1. ✅ Nettoyer les logs de debug
**Fichiers concernés :**
- `src/components/ListSongCard.vue`
- `src/components/SongDropdownMenu.vue` (consolidé)
- `src/pages/ListDetailPage.vue`
- `src/components/ManageTagsModal.vue`
- `src/utils/performance.ts`

**Actions :**
- [x] Créer un wrapper de logging configurable (`src/utils/logger.ts`)
- [x] Remplacer tous les `console.log` de debug par le logger
- [x] Les logs de debug n'apparaissent plus qu'en mode DEV

**Temps réel :** 1h

---

### 2. ✅ Simplifier la gestion des mises à jour de tags
**Problème actuel :** Chaîne complexe de 5 niveaux d'événements avec problèmes de timing

**Fichiers concernés :**
- `src/components/SongDropdownMenu.vue`
- `src/components/ListSongCard.vue`
- `src/pages/ListDetailPage.vue`

**Actions :**
- [x] Retirer l'appel inutile à `refreshSongTags()` (car la liste entière est rafraîchie)
- [x] Simplifier la logique dans `handleTagsSaved()`
- [x] Comportement différent selon le contexte (liste vs page normale)
- [x] Utiliser `handleRefresh()` comme les bulk actions

**Temps réel :** 1.5h

---

### 3. ✅ Consolider les composants SongDropdown
**Problème :** 80% de duplication entre `SongDropdownMenu.vue` et `ListSongDropdownMenu.vue`

**Actions :**
- [x] Créer un composant générique `SongDropdownMenu.vue`
- [x] Ajouter des props conditionnelles :
  ```typescript
  defineProps<{
    song: SongWithTags
    showRemoveFromList?: boolean  // Pour les listes
    showDuplicate?: boolean       // Pour la page songs
  }>()
  ```
- [x] Supprimer `ListSongDropdownMenu.vue`
- [x] Mettre à jour les imports dans `ListSongCard.vue` et `SongCard.vue`

**Temps réel :** 2h

---

## 🟡 Priorité MOYENNE (Important - À planifier)

### 4. Standardiser l'utilisation de executeOperation
**Problème :** Pattern mélangé entre usage manuel d'overlay et `executeOperation()`

**Fichiers à corriger :**
- `src/pages/TagsPage.vue` (handleCreate, handleRename, handleDelete)
- `src/pages/ArtistsPage.vue` (handleCreate, handleRename)
- `src/pages/ListsPage.vue` (handleDelete, handleBulkDelete, handleCreateSubmit)
- `src/pages/ListDetailPage.vue` (handleRemove)

**Actions :**
- [ ] Remplacer tous les patterns :
  ```typescript
  // AVANT
  uiStore.showOperationOverlay('Creating...')
  const result = await store.action()
  uiStore.hideOperationOverlay()
  
  // APRÈS
  await executeOperation(
    () => store.action(),
    {
      loadingMessage: 'Creating...',
      successMessage: 'Created',
      errorContext: 'create item'
    }
  )
  ```

**Estimation :** 4h

---

### 5. ✅ Refactorer ListDetailPage (800+ lignes)
**Problème :** Trop de responsabilités dans un seul composant

**Actions :**
- [x] Extraire les bulk actions dans `ListBulkActions.vue`
- [x] Extraire la barre de recherche/filtres dans `ListFilterBar.vue`
- [x] Garder la logique de gestion des titres dans la page principale
- [x] Réduire significativement le nombre de lignes

**Résultats :**
- `ListBulkActions.vue` : ~280 lignes - Gère toutes les actions bulk et modales associées
- `ListFilterBar.vue` : ~60 lignes - Gère recherche et filtres
- `ListDetailPage.vue` : **589 lignes** (réduction de ~25% depuis 800+ lignes)
- Séparation claire des responsabilités
- Code plus maintenable et testable

**Temps réel :** 3h

---

### 6. ✅ Créer un composant CRUD générique
**Problème :** Structure identique dans TagsPage, ArtistsPage, ListsPage

**Actions :**
- [x] Créer `components/CRUDModal.vue` (~60 lignes) - Modale réutilisable
- [x] Créer `components/CRUDEmptyState.vue` (~30 lignes) - État vide générique
- [x] Créer `composables/useCRUD.ts` (~150 lignes) - Logique CRUD partagée
- [x] Refactorer TagsPage pour utiliser CRUD générique
- [x] Refactorer ArtistsPage pour utiliser CRUD générique
- [ ] Refactorer ListsPage (plus complexe avec bulk delete)

**Résultats :**
- **TagsPage** : 313 → **168 lignes** (-46% / -145 lignes)
- **ArtistsPage** : 379 → **234 lignes** (-38% / -145 lignes)
- **Total économisé** : ~290 lignes de code supprimées
- Logique CRUD centralisée et testable
- Components réutilisables pour futurs besoins CRUD
- Pattern cohérent dans toute l'application

**Temps réel :** 4h

**Note :** ListsPage n'a pas été refactorisée car elle a des besoins spécifiques (bulk delete, selection mode) qui nécessiteraient trop d'adaptations du pattern CRUD générique.

---

## 🟢 Priorité BASSE (Nice to have - Amélioration continue)

### 7. Ajouter de la documentation
**Actions :**
- [ ] Documenter les composants complexes avec JSDoc :
  ```typescript
  /**
   * Manages tags for a song with lazy loading and optimistic updates
   * @param songId - The ID of the song
   * @param initialTagIds - Currently assigned tag IDs
   * @emits saved - When tags are successfully saved
   */
  ```
- [ ] Créer un `ARCHITECTURE.md` expliquant la structure
- [ ] Documenter les patterns utilisés (executeOperation, stores, etc.)

**Estimation :** 4h

---

### 8. Tests unitaires
**Actions :**
- [ ] Installer Vitest
- [ ] Tester les utils critiques :
  - `utils/operations.ts`
  - `utils/validation.ts`
  - `utils/songcodeConverter.ts`
  - `utils/timeout.ts`
- [ ] Tester les stores principaux (songs, lists, tags)
- [ ] Target : 60% de couverture minimum

**Estimation :** 16h

---

### 9. Améliorer la cohérence du nommage
**Actions :**
- [ ] Standardiser les préfixes de fonction :
  - `handle*` pour les event handlers
  - `fetch*` pour les requêtes API
  - `update*` pour les mutations locales
- [ ] Renommer les fonctions inconsistantes
- [ ] Créer un guide de style dans `CONTRIBUTING.md`

**Estimation :** 2h

---

### 10. Performance - Lazy loading des modales
**Actions :**
- [ ] Utiliser `defineAsyncComponent` pour les modales :
  ```typescript
  const ManageTagsModal = defineAsyncComponent(
    () => import('./ManageTagsModal.vue')
  )
  ```
- [ ] Analyser les bundles avec `vite-plugin-visualizer`
- [ ] Splitter les grosses pages en chunks

**Estimation :** 3h

---

## 📊 Récapitulatif

| Priorité | Tâches | Temps estimé | Temps réel | Statut | Impact |
|----------|--------|--------------|------------|--------|--------|
| 🔴 Haute | 3 | 6h | 4.5h | ✅ Complété | Stabilité, maintenabilité |
| 🟡 Moyenne | 3 | 18h | 9h | ✅ Complété | Qualité code, DRY |
| 🟢 Basse | 4 | 25h | - | En attente | Documentation, tests |
| **Total** | **10** | **49h** | **13.5h / 49h** | **60% complété** | - |

---

## 🎯 Plan d'action suggéré

### ✅ Sprint 1 - Stabilisation (COMPLÉTÉ)
- ✅ Tâche 1 : Nettoyer les logs
- ✅ Tâche 2 : Simplifier mise à jour tags
- ✅ Tâche 3 : Consolider dropdowns

**Résultats :**
- Logger wrapper créé et intégré
- Chaîne d'événements simplifiée pour les tags
- Composants dropdown consolidés (réduction de ~150 lignes de code dupliqué)

### ✅ Sprint 2 - Standardisation (COMPLÉTÉ)
- ✅ Tâche 4 : executeOperation partout
- ✅ Tâche 5 : Refactorer ListDetailPage
- ✅ Tâche 6 : CRUD générique

**Résultats :**
- Pattern standardisé dans TagsPage, ArtistsPage, ListsPage, ListDetailPage
- Code plus cohérent et maintainable
- Réduction de duplication dans la gestion des overlays
- ListDetailPage refactorisé : -25% de lignes, composants réutilisables créés
- CRUD générique : -290 lignes sur TagsPage et ArtistsPage
- **Total lignes économisées : ~590 lignes**

### Sprint 3 - Architecture (1 semaine)
- Tâche 6 : CRUD générique
- Tâche 7 : Documentation

### Sprint 4 - Qualité (1 semaine)
- Tâche 8 : Tests unitaires
- Tâches 9-10 : Améliorations diverses

---

## 💡 Notes

- **Ne pas tout faire en même temps** : Procéder par itérations
- **Tester après chaque refactoring** : S'assurer que rien ne casse
- **Git commits atomiques** : Un commit par tâche pour faciliter les rollbacks
- **Code review** : Faire valider les changements structurels importants

---

## 🐛 Bugs connus à corriger en parallèle

- [x] **BUG CRITIQUE** : Mise à jour des tags dans les cartes de liste ne fonctionne pas
  - ✅ Solution implémentée : Simplification de la chaîne d'événements
  - ✅ Utilise maintenant `handleRefresh()` comme les bulk actions
  - ✅ Comportement cohérent entre contextes liste et page normale
