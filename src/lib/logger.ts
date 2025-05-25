/**
 * Logger utility for consistent logging across the application
 *
 * Features:
 * - Automatically disables logs in production
 * - Supports different log levels
 * - Supports namespaced logs for better organization
 * - Respects user debug preferences from localStorage
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  namespace?: string;
  enabled?: boolean;
}

/**
 * Check if debug logging is enabled
 * Debug logging is enabled when debug mode is available and debug_logging is set to 'true' in localStorage
 */
function isDebugEnabled(): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebugModeEnabled = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
  const isLocalStorageDebugEnabled = typeof localStorage !== 'undefined' &&
                                    localStorage.getItem('debug_logging') === 'true';

  return isDevelopment && isDebugModeEnabled && isLocalStorageDebugEnabled;
}

/**
 * Check if we're in a production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Create a logger instance
 */
export function createLogger(options: LoggerOptions = {}) {
  const { namespace = '', enabled = true } = options;
  const prefix = namespace ? `[${namespace}]` : '';

  return {
    /**
     * Log a debug message
     * Only shown in development mode when debug_logging is enabled
     */
    debug(message: string, ...args: unknown[]): void {
      if (!enabled || isProduction() || !isDebugEnabled()) return;
      console.log(`${prefix} ${message}`, ...args);
    },

    /**
     * Log an info message
     * Only shown in development mode when debug_logging is enabled
     */
    info(message: string, ...args: unknown[]): void {
      if (!enabled || isProduction() || !isDebugEnabled()) return;
      console.info(`${prefix} ${message}`, ...args);
    },

    /**
     * Log a warning message
     * Always shown in development, only shown for critical issues in production
     */
    warn(message: string, ...args: unknown[]): void {
      if (!enabled) return;
      // In production, we only want to show critical warnings
      if (isProduction() && !message.includes('CRITICAL:')) return;
      console.warn(`${prefix} ${message}`, ...args);
    },

    /**
     * Log an error message
     * Always shown in both development and production
     */
    error(message: string, ...args: unknown[]): void {
      if (!enabled) return;
      console.error(`${prefix} ${message}`, ...args);
    }
  };
}

// Create a default logger instance
export const logger = createLogger();
