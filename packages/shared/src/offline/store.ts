import type { ProjectSnapshot } from './snapshot'

/**
 * Storage adapter for project snapshots (ADR-005).
 * Web: Dexie/IndexedDB (`dexieStore.ts`). Mobile: SQLite later.
 *
 * `save` must be atomic: a reader sees either the previous snapshot or the
 * new one, never a mix.
 */
export interface SnapshotStore {
  load(projectId: string): Promise<ProjectSnapshot | null>
  save(snapshot: ProjectSnapshot): Promise<void>
  remove(projectId: string): Promise<void>
  /** Approximate size in bytes of one project's stored copy (0 when absent) */
  size(projectId: string): Promise<number>
  /** Close the underlying database (does not delete data) */
  close(): void
  /** Delete the whole database of this store */
  destroy(): Promise<void>
}
