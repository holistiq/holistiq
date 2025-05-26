/**
 * Logout Intent Utilities
 *
 * Utilities for tracking and managing logout intent to distinguish between
 * manual and automatic signouts, improving user experience by preventing
 * unnecessary "signed out" warnings after intentional logout.
 */

/**
 * Check if the current page load is after a manual logout
 * This helps prevent showing "signed out" warnings when a user
 * manually logs out and then refreshes the page
 */
export function isAfterManualLogout(): boolean {
  try {
    // Check sessionStorage flag (short-term)
    const manualLogoutFlag = sessionStorage.getItem("holistiq_manual_logout");
    if (manualLogoutFlag === "true") {
      return true;
    }

    // Check localStorage intent (longer-term but with timestamp)
    const intentStr = localStorage.getItem("holistiq_logout_intent");
    if (!intentStr) return false;

    const intent = JSON.parse(intentStr);

    // Check if intent is recent (within 5 minutes) and manual
    const isRecent = Date.now() - intent.timestamp < 5 * 60 * 1000;
    const isManual = intent.isManual === true;

    return isRecent && isManual;
  } catch (error) {
    console.error("Error checking manual logout status:", error);
    return false;
  }
}

/**
 * Clear all logout intent tracking
 * Should be called after successfully handling a logout scenario
 */
export function clearLogoutIntent(): void {
  try {
    localStorage.removeItem("holistiq_logout_intent");
    sessionStorage.removeItem("holistiq_manual_logout");
  } catch (error) {
    console.error("Error clearing logout intent:", error);
  }
}

/**
 * Check if we should show a "signed out" warning
 * Returns true only for unexpected/automatic signouts
 */
export function shouldShowSignedOutWarning(): boolean {
  return !isAfterManualLogout();
}
