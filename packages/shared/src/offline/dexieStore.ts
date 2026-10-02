import Dexie, { type Table } from 'dexie'
import { SNAPSHOT_SCHEMA_VERSION, type ProjectSnapshot } from './snapshot'
import type { SnapshotStore } from './store'

export const OFFLINE_DB_PREFIX = 'livenotes-offline-'

export function offlineDbName(userId: string): string {
  return `${OFFLINE_DB_PREFIX}${userId}`
}

class OfflineDatabase extends Dexie {
  snapshots!: Table<ProjectSnapshot, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({ snapshots: 'projectId' })
  }
}

/**
 * IndexedDB adapter: one database per user, one record per project.
 * A whole snapshot is a single `put`, so saves are atomic by construction.
 */
export class DexieSnapshotStore implements SnapshotStore {
  private db: OfflineDatabase

  constructor(userId: string) {
    this.db = new OfflineDatabase(offlineDbName(userId))
  }

  async load(projectId: string): Promise<ProjectSnapshot | null> {
    const snapshot = await this.db.snapshots.get(projectId)
    if (!snapshot || snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) return null
    return snapshot
  }

  async save(snapshot: ProjectSnapshot): Promise<void> {
    await this.db.snapshots.put(snapshot)
  }

  async remove(projectId: string): Promise<void> {
    await this.db.snapshots.delete(projectId)
  }

  close(): void {
    this.db.close()
  }

  async destroy(): Promise<void> {
    await this.db.delete()
  }
}

/**
 * Delete the offline databases of every user except `keepUserId`
 * (or of all users when omitted). Used on login/logout so one user's data
 * never stays readable on a device after someone else signs in.
 */
export async function deleteOtherUsersDatabases(keepUserId?: string): Promise<void> {
  const names = await Dexie.getDatabaseNames()
  const keep = keepUserId ? offlineDbName(keepUserId) : null
  await Promise.all(
    names
      .filter(name => name.startsWith(OFFLINE_DB_PREFIX) && name !== keep)
      .map(name => Dexie.delete(name))
  )
}
