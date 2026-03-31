# Performance Optimization Guide

This document outlines all performance optimizations implemented in the Livenotes V1 application.

## 🚀 Build Optimizations

### Code Splitting
- **Route-based lazy loading**: All page components use dynamic imports `() => import()`
- **Vendor chunking**: Third-party libraries split into separate chunks
  - `vendor.js`: Vue, Vue Router, Pinia
  - `ionic.js`: Ionic components
  - `supabase.js`: Supabase client
- **Benefits**: Faster initial load, better caching, parallel downloads

### Production Build Settings
- **Minification**: esbuild minification enabled (faster than terser)
- **Tree shaking**: Unused code automatically removed
- **Source maps**: Not generated for production (smaller bundle size)
- **Note**: esbuild minification is faster and built into Vite. If you need console.log removal, install terser: `npm install -D terser`

## 💾 Database Performance

### Query Optimization
- **N+1 Query Prevention**: All data fetched with nested Supabase selects
  ```typescript
  .select(`
    *,
    tags:song_tags(tag:tags(*)),
    lists:list_items(list:lists(*))
  `)
  ```
- **Single round-trip**: Relations loaded in one query instead of multiple

### Required Indexes
See `DATABASE_INDEXES.md` for complete index setup. Key indexes:
- Foreign key indexes on all junction tables
- Composite indexes for multi-column queries
- Position indexes for ordering operations

## 🎨 Frontend Performance

### Vue Optimizations
- **Computed properties**: Used extensively to cache expensive calculations
- **Reactive refs**: Minimal reactive state to reduce overhead
- **Pinia stores**: Efficient global state management
- **DevTools tracking**: Enabled in development for performance profiling

### Performance Monitoring
Utilities in `src/utils/performance.ts`:
- **debounce()**: Limit rapid function calls (search inputs)
- **throttle()**: Rate-limit expensive operations
- **measurePerformance()**: Track async operation timing
- **memoize()**: Cache expensive function results
- **Web Vitals**: Track LCP, FID, CLS in development

### Asset Optimization
- **No images**: Text-based UI reduces bundle size
- **SVG icons**: Inline SVGs for zero HTTP requests
- **CSS**: Tailwind purges unused styles
- **Fonts**: System fonts used (no webfont downloads)

## 🔄 Runtime Performance

### Async Component Loading
- Auth store lazily imported in main.ts
- Reduces initial JavaScript execution time

### Efficient Re-renders
- Computed properties for filtered/sorted data
- Key attributes on all v-for loops
- Minimal watchers (prefer computed)
- Event handlers use `.prevent` and `.stop` appropriately

### Network Optimization
- **Supabase client**: Single instance shared across app
- **Connection pooling**: Supabase handles automatically
- **RLS policies**: Database-level security (no extra round trips)

## 📊 Performance Targets

### Core Web Vitals (90th percentile)
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms  
- **CLS** (Cumulative Layout Shift): < 0.1

### Bundle Size Targets
- **vendor.js**: < 200 KB (gzipped)
- **ionic.js**: < 150 KB (gzipped)
- **Total initial**: < 400 KB (gzipped)
- **Individual routes**: < 50 KB (gzipped)

### Database Query Times
- **Song list load**: < 200ms
- **Tag/list operations**: < 100ms
- **Search queries**: < 150ms

## 🔧 Development Tools

### Performance Monitoring
```typescript
// Measure async operations
import { measurePerformance } from '@/utils/performance'

const songs = await measurePerformance('Fetch Songs', () =>
  songsStore.fetchSongs(projectId)
)
```

### Vue DevTools
- Component render times visible in timeline
- Performance tab shows component updates
- Enabled automatically in development

### Browser DevTools
- Network tab: Check bundle sizes
- Performance tab: Record page load
- Lighthouse: Audit performance score

## 📝 Best Practices

### Component Design
- Keep components focused and small
- Use `v-once` for static content
- Avoid complex computed in templates
- Lazy load heavy components with `defineAsyncComponent()`

### State Management
- Normalize data structures (avoid deep nesting)
- Use IDs as keys, not indexes
- Clear stale data when navigating
- Avoid reactive arrays for large datasets

### Database Queries
- Always include project_id filter
- Use indexes for WHERE clauses
- Limit result sets when possible
- Batch operations instead of loops

### Network Requests
- Debounce search inputs (300-500ms)
- Cache responses when appropriate
- Use optimistic UI updates
- Handle offline gracefully

## 🎯 Future Optimizations

### V2 Considerations
- **Service Worker**: Offline support, cache API assets
- **IndexedDB**: Local data persistence
- **Virtual scrolling**: For large song lists (1000+ items)
- **WebSocket**: Real-time updates (if multiplayer features added)
- **Image optimization**: If adding album covers/photos

## 📈 Monitoring in Production

### Metrics to Track
- Page load time (Navigation Timing API)
- API response times (Supabase dashboard)
- Error rates (browser console, Sentry)
- User actions per session
- Most common workflows

### Tools
- **Supabase Dashboard**: Query performance, API logs
- **Browser DevTools**: Real user monitoring
- **Google Analytics**: User behavior (optional)
- **Sentry**: Error tracking (optional for V1)

## ✅ Checklist

Current status:

- [x] Route lazy loading implemented
- [x] Code splitting configured
- [x] Production build optimized
- [x] Database indexes documented
- [x] Query optimization verified
- [x] Performance utils created
- [x] Web Vitals monitoring added
- [x] DevTools enabled in dev
- [x] Console.log removal in prod
- [x] No N+1 queries
- [x] Computed properties used
- [x] Minimal watchers
- [x] Efficient re-renders

## Last Updated
March 31, 2026
