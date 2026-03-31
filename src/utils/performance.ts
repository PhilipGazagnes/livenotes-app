/**
 * Performance Monitoring Utilities
 * 
 * Helper functions for tracking and optimizing application performance
 */

/**
 * Debounce function to limit how often a function can be called
 * Useful for search inputs, scroll handlers, etc.
 * 
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait before calling function
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function to ensure a function is called at most once in a time period
 * Useful for resize handlers, scroll events, etc.
 * 
 * @param func - Function to throttle
 * @param limit - Milliseconds between function calls
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Measure execution time of async operations
 * Only logs in development mode
 * 
 * @param label - Label for the measurement
 * @param fn - Async function to measure
 * @returns Result of the function
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (import.meta.env.DEV) {
    const start = performance.now()
    try {
      const result = await fn()
      const end = performance.now()
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`)
      return result
    } catch (error) {
      const end = performance.now()
      console.log(`[Performance] ${label} (failed): ${(end - start).toFixed(2)}ms`)
      throw error
    }
  } else {
    return fn()
  }
}

/**
 * Memoize expensive computed values
 * Simple cache that stores last N results
 * 
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 10
): T {
  const cache = new Map<string, ReturnType<T>>()
  const keys: string[] = []
  
  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }
    
    const result = fn(...args)
    cache.set(key, result)
    keys.push(key)
    
    // Remove oldest entry if cache is full
    if (keys.length > maxSize) {
      const oldestKey = keys.shift()!
      cache.delete(oldestKey)
    }
    
    return result
  } as T
}

/**
 * Check if browser supports Web Vitals API
 */
export function supportsWebVitals(): boolean {
  return 'PerformanceObserver' in window
}

/**
 * Log Web Vitals metrics in development
 * Measures Core Web Vitals: LCP, FID, CLS
 */
export function logWebVitals() {
  if (!import.meta.env.DEV || !supportsWebVitals()) {
    return
  }

  // Largest Contentful Paint (LCP)
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1] as any
    console.log('[Web Vitals] LCP:', lastEntry.renderTime || lastEntry.loadTime)
  }).observe({ entryTypes: ['largest-contentful-paint'] })

  // First Input Delay (FID)
  new PerformanceObserver((list) => {
    const entries = list.getEntries() as any[]
    entries.forEach((entry) => {
      console.log('[Web Vitals] FID:', entry.processingStart - entry.startTime)
    })
  }).observe({ entryTypes: ['first-input'] })

  // Cumulative Layout Shift (CLS)
  let clsScore = 0
  new PerformanceObserver((list) => {
    const entries = list.getEntries() as any[]
    entries.forEach((entry) => {
      if (!entry.hadRecentInput) {
        clsScore += entry.value
      }
    })
    console.log('[Web Vitals] CLS:', clsScore)
  }).observe({ entryTypes: ['layout-shift'] })
}
