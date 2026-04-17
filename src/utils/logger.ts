/**
 * Simple logger utility that only logs in development mode
 */

const isDev = import.meta.env.DEV

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  
  error: (message: string, error?: Error | any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  
  performance: (label: string, duration: number) => {
    if (isDev) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    }
  }
}
