/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// In dev mode index.html is not injected into the precache manifest, so guard before registering
const hasIndexHtml = (self.__WB_MANIFEST as Array<string | { url: string }>).some(
  e => (typeof e === 'string' ? e : e.url) === 'index.html'
)
if (hasIndexHtml) {
  registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))
}

const supabasePlugins = [
  new CacheableResponsePlugin({ statuses: [0, 200] }),
  new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 }),
]

const networkFirst = new NetworkFirst({
  cacheName: 'supabase-data',
  networkTimeoutSeconds: 3,
  plugins: supabasePlugins,
})

registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1'),
  async (context) => {
    if (!navigator.onLine) {
      const cached = await caches.match(context.request)
      if (cached) return cached
      return new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return networkFirst.handle(context)
  },
  'GET'
)
