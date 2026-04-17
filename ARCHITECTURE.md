# Architecture de l'application Livenotes

> Documentation générée le 17 avril 2026 après refactoring majeur

## 📁 Structure du projet

```
src/
├── components/       # Composants Vue réutilisables
│   ├── CRUD*.vue    # Composants CRUD génériques
│   ├── List*.vue    # Composants pour les listes
│   ├── Song*.vue    # Composants pour les chansons
│   └── ...
├── composables/      # Logique réutilisable (Vue Composition API)
│   └── useCRUD.ts   # Gestion CRUD générique
├── pages/            # Pages de l'application (routes)
├── router/           # Configuration Vue Router
├── stores/           # Pinia stores (state management)
├── types/            # Types TypeScript
├── utils/            # Utilitaires et helpers
└── constants/        # Constantes et messages
```

---

## 🏗️ Patterns et Conventions

### 1. Gestion des Opérations Asynchrones

**Pattern standardisé avec `executeOperation`**

```typescript
import { executeOperation } from '@/utils/operations'

await executeOperation(
  () => store.createItem(data),
  {
    loadingMessage: 'Creating...',
    successMessage: 'Created successfully',
    errorContext: 'create item',
    timeout: 10000, // optionnel
    onSuccess: () => {
      // Actions après succès
    },
    onError: (error) => {
      // Gestion d'erreur personnalisée
    },
  }
)
```

**Avantages :**
- Overlay automatique (loading)
- Toast de succès/erreur
- Gestion des timeouts
- Callbacks onSuccess/onError
- Code cohérent dans toute l'app

---

### 2. Logging

**Utiliser le logger wrapper** (`src/utils/logger.ts`)

```typescript
import { logger } from '@/utils/logger'

// Logs de debug (seulement en DEV)
logger.debug('User action:', { userId, action })

// Logs d'erreur (toujours affichés)
logger.error('Failed to save', error)

// Logs de performance
logger.performance('Data fetch', duration)
```

**Ne jamais utiliser `console.log` directement** - Utilisez le logger !

---

### 3. CRUD Pattern

**Pour les pages avec Create/Read/Update/Delete**

```typescript
import { useCRUD } from '@/composables/useCRUD'

const {
  showCreateModal,
  newItemName,
  createError,
  isCreating,
  handleCreate,
  // ... autres états/méthodes
} = useCRUD<YourType>({
  items: store.items,
  maxLength: 50,
  validateDuplicate: (name, excludeId) => {
    return store.items.some(item => 
      item.name === name && item.id !== excludeId
    )
  },
  onCreate: async (name) => await store.create(name),
  onUpdate: async (id, name) => await store.update(id, name),
  onDelete: async (id) => await store.delete(id),
  messages: { /* ... */ },
  confirmDelete: async (item) => await uiStore.showConfirm(/* ... */),
})
```

**Composants associés :**
- `<CRUDModal>` - Modale create/rename
- `<CRUDEmptyState>` - État vide générique

---

### 4. State Management (Pinia)

**Structure d'un store :**

```typescript
export const useMyStore = defineStore('myStore', () => {
  // State
  const items = ref<Item[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters (computed)
  const itemCount = computed(() => items.value.length)

  // Actions (fonctions)
  async function fetchItems(projectId: string) {
    isLoading.value = true
    error.value = null
    try {
      // ... fetch logic
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    isLoading,
    error,
    itemCount,
    fetchItems,
  }
})
```

**Stores disponibles :**
- `auth` - Authentification
- `songs` - Chansons
- `lists` - Listes
- `tags` - Tags
- `artists` - Artistes
- `ui` - État UI (overlays, toasts, selection mode)
- `settings` - Paramètres utilisateur
- `songcode` - Conversion de codes de chansons

---

### 5. Composants Réutilisables

#### ListBulkActions
Gère toutes les actions bulk dans une liste de chansons.

**Props :**
```typescript
{
  listId: string
  listName: string
}
```

**Events :**
```typescript
@selectAll
@refresh
@songsDeleted(songIds: string[])
```

#### ListFilterBar
Barre de recherche et filtres pour les listes.

**Props :**
```typescript
{
  searchQuery: string
  selectedTagIds: string[]
}
```

**Events :**
```typescript
@update:searchQuery(value: string)
@update:selectedTagIds(tagIds: string[])
```

#### SongDropdownMenu
Menu dropdown pour les chansons (consolidé).

**Props :**
```typescript
{
  song: SongWithTags
  showRemoveFromList?: boolean  // Affiche "Remove from List"
  showDuplicate?: boolean       // Affiche "Duplicate"
}
```

**Events :**
```typescript
@close
@remove
@tagsUpdated(songId: string)
@songDeleted(songId: string)
```

---

## 🔄 Flux de Données

### Chargement initial d'une page

```
1. onMounted hook
   ↓
2. authStore.initialize() si nécessaire
   ↓
3. authStore.getPersonalProjectId()
   ↓
4. store.fetchItems(projectId)
   ↓
5. Render avec données
   ↓
6. uiStore.hideOperationOverlay()
```

### Mise à jour de tags dans une liste

```
1. User clique "Manage Tags" sur une chanson
   ↓
2. Lazy load: tagsStore.fetchTags()
   ↓
3. Ouvre ManageTagsModal
   ↓
4. User modifie et save
   ↓
5. ManageTagsModal @saved
   ↓
6. SongDropdownMenu @tagsUpdated
   ↓
7. ListDetailPage handleRefresh()
   ↓
8. listsStore.fetchListById() - Refresh complet
```

**Pourquoi un refresh complet ?**
Simplifie la logique et évite les problèmes de synchronisation. Les bulk actions utilisent aussi `handleRefresh()`.

---

## 🎨 Conventions de Nommage

### Fonctions

- `handle*` - Event handlers (ex: `handleCreate`, `handleDelete`)
- `fetch*` - Requêtes API (ex: `fetchTags`, `fetchSongs`)
- `update*` - Mutations locales (ex: `updateLocalState`)
- `open*` - Ouverture de modales (ex: `openFilterModal`)
- `show*` - Affichage (ex: `showToast`)

### Composants

- `*Page.vue` - Pages (routes)
- `*Card.vue` - Cartes d'affichage
- `*Modal.vue` - Modales
- `*Dropdown*.vue` - Menus dropdown
- `CRUD*.vue` - Composants CRUD génériques

### Variables d'état

- `is*` - Booléens (ex: `isLoading`, `isCreating`)
- `show*` - Visibilité (ex: `showModal`, `showFilterBar`)
- `*Error` - Messages d'erreur (ex: `createError`, `renameError`)

---

## 🔧 Utilitaires Clés

### `utils/operations.ts`

**`executeOperation()`** - Wrapper pour opérations asynchrones
**`executeConfirmedOperation()`** - Avec confirmation préalable

### `utils/logger.ts`

**`logger.debug()`** - Logs en DEV seulement
**`logger.error()`** - Logs d'erreur
**`logger.performance()`** - Mesure de performance

### `utils/validation.ts`

**`normalizeText()`** - Normalisation de texte
**Validators** - Validation de formulaires

### `utils/timeout.ts`

**`TIMEOUTS`** - Constantes de timeout standardisées

---

## 📦 Types Importants

### Database Types (`types/database.ts`)

```typescript
interface Song {
  id: string
  project_id: string
  title: string
  artist?: string
  notes?: string
  livenotes_poc_id?: string | null
  created_at: string
  updated_at: string
}

interface SongWithTags extends Song {
  tags?: Tag[]
  lists?: List[]
  artists?: Artist[]
}

interface Tag {
  id: string
  name: string
  project_id: string
  created_at: string
}

interface List {
  id: string
  name: string
  description?: string
  project_id: string
  created_by: string
  created_at: string
}

interface ListWithItems extends List {
  items: ListItem[]
}

interface ListItem {
  id: string
  list_id: string
  song_id: string
  type: 'song' | 'title'
  title?: string
  position: number
  song?: SongWithTags
}
```

---

## 🚀 Performance

### Lazy Loading

Les tags et listes sont chargés uniquement quand nécessaire :

```typescript
async function handleManageTags() {
  // Lazy load tags uniquement à l'ouverture de la modale
  const projectId = await authStore.getPersonalProjectId()
  if (projectId) {
    await tagsStore.fetchTags(projectId)
  }
  showManageTagsModal.value = true
}
```

### Optimistic Updates

Certaines opérations mettent à jour l'état local immédiatement :

```typescript
// Remove from list - mise à jour locale immédiate
await listsStore.removeSongFromList(listId, songId)
// Le store met à jour currentList.items directement
```

---

## 🧪 Testing (à venir)

Structure recommandée :

```
tests/
├── unit/
│   ├── utils/
│   │   ├── operations.spec.ts
│   │   ├── validation.spec.ts
│   │   └── logger.spec.ts
│   ├── stores/
│   │   ├── songs.spec.ts
│   │   └── lists.spec.ts
│   └── composables/
│       └── useCRUD.spec.ts
└── e2e/
    └── ...
```

---

## 💡 Bonnes Pratiques

### ✅ À FAIRE

- Utiliser `executeOperation` pour toutes les opérations async
- Logger avec `logger.debug()` au lieu de `console.log`
- Utiliser le pattern CRUD pour les pages simples
- Typer correctement avec TypeScript
- Extraire la logique complexe dans des composables
- Valider les entrées utilisateur avant envoi

### ❌ À ÉVITER

- `console.log` en production
- Gestion manuelle des overlays (utiliser `executeOperation`)
- Duplication de code (vérifier si un composant/composable existe)
- Mutations directes du state Pinia (utiliser des actions)
- Chaînes d'événements complexes (simplifier avec `handleRefresh()`)

---

## 📚 Ressources

- **Pinia** : https://pinia.vuejs.org/
- **Vue 3** : https://vuejs.org/
- **TypeScript** : https://www.typescriptlang.org/
- **Ionic Vue** : https://ionicframework.com/docs/vue/overview
- **Supabase** : https://supabase.com/docs

---

**Dernière mise à jour :** 17 avril 2026
**Version :** Post-refactoring v2.0
