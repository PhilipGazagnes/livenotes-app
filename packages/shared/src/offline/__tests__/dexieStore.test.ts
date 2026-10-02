import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { DexieSnapshotStore, deleteOtherUsersDatabases, offlineDbName } from '../dexieStore'
import { makeSnapshot } from './fixtures'

const stores: DexieSnapshotStore[] = []
function open(userId: string) {
  const store = new DexieSnapshotStore(userId)
  stores.push(store)
  return store
}

afterEach(async () => {
  await Promise.all(stores.splice(0).map(s => s.destroy()))
})

describe('DexieSnapshotStore', () => {
  it('saves and loads a snapshot per project', async () => {
    const store = open('u1')
    await store.save(makeSnapshot())
    expect((await store.load('p1'))?.librarySongs).toHaveLength(3)
    expect(await store.load('other')).toBeNull()
  })

  it('replaces the previous snapshot as a whole', async () => {
    const store = open('u1')
    await store.save(makeSnapshot())
    await store.save(makeSnapshot({ librarySongs: [], syncedAt: '2026-10-03T00:00:00.000Z' }))
    const loaded = await store.load('p1')
    expect(loaded?.librarySongs).toEqual([])
    expect(loaded?.syncedAt).toBe('2026-10-03T00:00:00.000Z')
  })

  it('ignores snapshots from another schema version', async () => {
    const store = open('u1')
    await store.save(makeSnapshot({ schemaVersion: 0 }))
    expect(await store.load('p1')).toBeNull()
  })

  it('keeps users apart: one database per user', async () => {
    await open('u1').save(makeSnapshot())
    expect(await open('u2').load('p1')).toBeNull()
  })

  it('remove deletes one project snapshot', async () => {
    const store = open('u1')
    await store.save(makeSnapshot())
    await store.remove('p1')
    expect(await store.load('p1')).toBeNull()
  })
})

describe('deleteOtherUsersDatabases', () => {
  it('deletes other users offline databases and keeps the current one', async () => {
    const a = open('ua'), b = open('ub')
    await a.save(makeSnapshot())
    await b.save(makeSnapshot())
    a.close(); b.close()

    await deleteOtherUsersDatabases('ua')
    const names = await Dexie.getDatabaseNames()
    expect(names).toContain(offlineDbName('ua'))
    expect(names).not.toContain(offlineDbName('ub'))
  })

  it('deletes all offline databases when no user is kept', async () => {
    const a = open('uc')
    await a.save(makeSnapshot())
    a.close()
    await deleteOtherUsersDatabases()
    expect((await Dexie.getDatabaseNames()).filter(n => n.startsWith('livenotes-offline-'))).toEqual([])
  })
})
