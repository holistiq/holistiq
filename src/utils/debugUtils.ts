/**
 * Debug utilities for the application
 *
 * This file contains utilities for debugging and logging in the application.
 * It provides a consistent way to handle debug logging across the application.
 */

/**
 * Type for console log arguments
 * Using unknown[] instead of any[] for better type safety
 */
type LogArgs = unknown[];

/**
 * Check if debug logging is enabled
 *
 * Debug logging is enabled if:
 * 1. The application is running in development mode (NODE_ENV === 'development')
 * 2. The 'debug_logging' flag is set to 'true' in localStorage
 *
 * @returns {boolean} True if debug logging is enabled, false otherwise
 */
export function isDebugLoggingEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true';
}

/**
 * Enable debug logging
 *
 * This function enables debug logging by setting the 'debug_logging' flag to 'true' in localStorage.
 * It only has an effect in development mode.
 *
 * @returns {boolean} True if debug logging was enabled, false otherwise
 */
export function enableDebugLogging(): boolean {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('debug_logging', 'true');
    console.log('Debug logging enabled');
    return true;
  }
  return false;
}

/**
 * Disable debug logging
 *
 * This function disables debug logging by setting the 'debug_logging' flag to 'false' in localStorage.
 *
 * @returns {boolean} True if debug logging was disabled, false otherwise
 */
export function disableDebugLogging(): boolean {
  localStorage.setItem('debug_logging', 'false');
  console.log('Debug logging disabled');
  return true;
}

/**
 * Toggle debug logging
 *
 * This function toggles debug logging by flipping the 'debug_logging' flag in localStorage.
 *
 * @returns {boolean} The new state of debug logging (true if enabled, false if disabled)
 */
export function toggleDebugLogging(): boolean {
  const isEnabled = isDebugLoggingEnabled();
  if (isEnabled) {
    disableDebugLogging();
    return false;
  } else {
    enableDebugLogging();
    return true;
  }
}

/**
 * Debug log function
 *
 * This function logs a message to the console if debug logging is enabled.
 * It's a wrapper around console.log that only logs if debug logging is enabled.
 *
 * @param {string} message - The message to log
 * @param {unknown[]} args - Additional arguments to log
 */
export function debugLog(message: string, ...args: LogArgs): void {
  if (isDebugLoggingEnabled()) {
    console.log(message, ...args);
  }
}

/**
 * Debug error function
 *
 * This function logs an error to the console if debug logging is enabled.
 * It's a wrapper around console.error that only logs if debug logging is enabled.
 *
 * @param {string} message - The error message to log
 * @param {unknown[]} args - Additional arguments to log
 */
export function debugError(message: string, ...args: LogArgs): void {
  if (isDebugLoggingEnabled()) {
    console.error(message, ...args);
  }
}

/**
 * Debug warn function
 *
 * This function logs a warning to the console if debug logging is enabled.
 * It's a wrapper around console.warn that only logs if debug logging is enabled.
 *
 * @param {string} message - The warning message to log
 * @param {unknown[]} args - Additional arguments to log
 */
export function debugWarn(message: string, ...args: LogArgs): void {
  if (isDebugLoggingEnabled()) {
    console.warn(message, ...args);
  }
}

/**
 * Initialize debug logging
 *
 * This function initializes debug logging by setting the default state.
 * In production, debug logging is always disabled.
 * In development, debug logging is disabled by default unless explicitly enabled.
 */
export function initializeDebugLogging(): void {
  // In production, always disable debug logging
  if (process.env.NODE_ENV === 'production') {
    disableDebugLogging();
    return;
  }

  // In development, check if debug_logging is set
  // If not set, disable it by default
  if (localStorage.getItem('debug_logging') === null) {
    disableDebugLogging();
  }
}
