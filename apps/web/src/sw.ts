/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

declare let self: ServiceWorkerGlobalScope

// App shell only. Offline data lives in IndexedDB (offline data layer), so
// Supabase API responses are no longer cached here (ADR-004).

// Cache of the previous implementation, which cached Supabase REST responses
const LEGACY_DATA_CACHE = 'supabase-data'

// A new version waits until the user chooses to reload (update banner),
// so the page never reloads by itself in the middle of a performance.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.delete(LEGACY_DATA_CACHE))
})

clientsClaim()

const manifest = self.__WB_MANIFEST
precacheAndRoute(manifest)
cleanupOutdatedCaches()

// In dev mode index.html is not injected into the precache manifest, so guard before registering
const hasIndexHtml = (manifest as Array<string | { url: string }>).some(
  e => (typeof e === 'string' ? e : e.url) === 'index.html'
)
if (hasIndexHtml) {
  registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
}
