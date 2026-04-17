# 🔧 Refactoring TODO

> Analyse de la codebase effectuée le 17 avril 2026
> Note globale : **6.5/10**

## 📋 Vue d'ensemble

Cette TODO liste les recommandations pour améliorer la qualité du code, réduire la complexité et améliorer la maintenabilité de l'application Livenotes.

---

## 🔴 Priorité HAUTE (Urgent - À faire immédiatement)

### 1. Nettoyer les logs de debug
**Fichiers concernés :**
- `src/components/ListSongCard.vue`
- `src/components/ListSongDropdownMenu.vue`
- `src/pages/ListDetailPage.vue`
- `src/stores/lists.ts`
- `src/components/ManageTagsModal.vue`

**Actions :**
- [ ] Retirer tous les `console.log` de debug
- [ ] OU créer un wrapper de logging configurable :
  ```typescript
  // src/utils/logger.ts
  export const logger = {
    debug: (message: string, ...args: any[]) => {
      if (import.meta.env.DEV) {
        console.log(`[DEBUG] ${message}`, ...args)
      }
    },
    error: (message: string, error: Error) => {
      console.error(`[ERROR] ${message}`, error)
    }
  }
  ```

**Estimation :** 1h

---

### 2. Simplifier la gestion des mises à jour de tags
**Problème actuel :** Chaîne complexe de 5 niveaux d'événements avec problèmes de timing

**Fichiers concernés :**
- `src/components/ListSongDropdownMenu.vue`
- `src/components/ListSongCard.vue`
- `src/pages/ListDetailPage.vue`

**Actions :**
- [ ] Dans `ListSongDropdownMenu.handleTagsSaved()` :
  - Retirer `emit('tagsUpdated')`
  - Juste fermer la modale et le dropdown
- [ ] Dans `ListDetailPage` :
  - Retirer `handleTagsUpdated()`
  - Utiliser un watcher ou refresh automatique après fermeture
- [ ] OU utiliser la solution simple qui fonctionne :
  ```typescript
  // Comme les bulk actions
  await handleRefresh()
  ```

**Estimation :** 2h

---

### 3. Consolider les composants SongDropdown
**Problème :** 80% de duplication entre `SongDropdownMenu.vue` et `ListSongDropdownMenu.vue`

**Actions :**
- [ ] Créer un composant générique `SongDropdownMenu.vue`
- [ ] Ajouter des props conditionnelles :
  ```typescript
  defineProps<{
    song: SongWithTags
    showRemoveFromList?: boolean  // Pour les listes
    onRemove?: () => void
  }>()
  ```
- [ ] Supprimer `ListSongDropdownMenu.vue`
- [ ] Mettre à jour les imports

**Estimation :** 3h

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

### 5. Refactorer ListDetailPage (800+ lignes)
**Problème :** Trop de responsabilités dans un seul composant

**Actions :**
- [ ] Extraire les bulk actions dans `ListBulkActions.vue`
- [ ] Extraire la barre de recherche/filtres dans `ListFilterBar.vue`
- [ ] Extraire la gestion des titres dans `ListItemManager.vue` ou hooks
- [ ] Garder seulement la logique principale dans `ListDetailPage.vue`

**Structure cible :**
```vue
<template>
  <ListFilterBar v-if="!selectionMode" />
  <ListBulkActions v-if="selectionMode" />
  <ListItems :items="displayedItems" />
</template>
```

**Estimation :** 6h

---

### 6. Créer un composant CRUD générique
**Problème :** Structure identique dans TagsPage, ArtistsPage, ListsPage

**Actions :**
- [ ] Créer `components/CRUDPage.vue` :
  ```vue
  <script setup lang="ts" generic="T extends { id: string, name: string }">
  defineProps<{
    items: T[]
    itemName: string        // "tag", "artist", "list"
    onCreate: (name: string) => Promise<void>
    onRename: (item: T, name: string) => Promise<void>
    onDelete: (item: T) => Promise<void>
  }>()
  </script>
  ```
- [ ] Refactorer TagsPage, ArtistsPage, ListsPage pour utiliser ce composant
- [ ] Passer les opérations du store en props

**Estimation :** 8h

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

| Priorité | Tâches | Temps estimé | Impact |
|----------|--------|--------------|--------|
| 🔴 Haute | 3 | 6h | Stabilité, maintenabilité |
| 🟡 Moyenne | 3 | 18h | Qualité code, DRY |
| 🟢 Basse | 4 | 25h | Documentation, tests |
| **Total** | **10** | **49h** | - |

---

## 🎯 Plan d'action suggéré

### Sprint 1 - Stabilisation (1 semaine)
- Tâche 1 : Nettoyer les logs
- Tâche 2 : Simplifier mise à jour tags
- Tâche 3 : Consolider dropdowns

### Sprint 2 - Standardisation (1 semaine)
- Tâche 4 : executeOperation partout
- Tâche 5 : Refactorer ListDetailPage

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

- [ ] **BUG CRITIQUE** : Mise à jour des tags dans les cartes de liste ne fonctionne pas
  - Solution simple : Utiliser `handleRefresh()` comme les bulk actions
  - Ne pas fermer le dropdown automatiquement, laisser l'utilisateur le faire
