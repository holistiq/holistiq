/**
 * Utility functions for working with Supabase sessions
 */

/**
 * Interface for Supabase session data
 */
export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: SupabaseUser;
}

/**
 * Interface for Supabase user data
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  role?: string;
  aud?: string;
}

/**
 * Try to find an alternative auth key in localStorage
 *
 * @returns {SupabaseSession|null} The session object if found, null otherwise
 */
function findAlternativeAuthKey(): SupabaseSession | null {
  console.log("No Supabase session key found in localStorage");

  // Try to find any key that might contain auth data as a fallback
  const possibleAuthKey = Object.keys(localStorage).find(key =>
    (key.includes('auth') || key.includes('token') || key.includes('session')) &&
    localStorage.getItem(key)?.includes('access_token')
  );

  if (possibleAuthKey) {
    console.log("Found possible auth key:", possibleAuthKey);
    try {
      const data = JSON.parse(localStorage.getItem(possibleAuthKey) || '{}');
      if (data.access_token) {
        console.log("Found alternative auth data with access token");
        return data;
      }
    } catch (e) {
      console.log("Failed to parse alternative auth data", e);
      // Continue execution to return null below
    }
  }

  return null;
}

/**
 * Check if a session is expired and handle refresh tokens
 *
 * @param sessionData The session data to check
 * @returns {SupabaseSession|null} The session object if valid, null otherwise
 */
function handleSessionExpiration(sessionData: SupabaseSession): SupabaseSession | null {
  if (sessionData.expires_at) {
    const expiresAt = sessionData.expires_at;
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

    if (expiresAt < currentTime) {
      console.log("Supabase session is expired", {
        expiresAt,
        currentTime,
        difference: expiresAt - currentTime
      });

      // If we have a refresh token, return the session anyway
      // The Supabase client will attempt to refresh it
      if (sessionData.refresh_token) {
        console.log("Session is expired but has refresh token, attempting to use it anyway");
        return sessionData;
      }

      return null;
    }
  }

  console.log("Found valid Supabase session in localStorage", {
    hasAccessToken: !!sessionData.access_token,
    hasRefreshToken: !!sessionData.refresh_token,
    expiresAt: sessionData.expires_at,
    currentTime: Math.floor(Date.now() / 1000)
  });

  return sessionData;
}

/**
 * Parse and validate session data
 *
 * @param sessionStr The session string to parse
 * @returns {SupabaseSession|null} The session object if valid, null otherwise
 */
function parseAndValidateSession(sessionStr: string): SupabaseSession | null {
  try {
    const sessionData = JSON.parse(sessionStr);

    // Check if the session contains the necessary data
    if (!sessionData?.access_token || !sessionData?.refresh_token) {
      console.log("Supabase session data is incomplete", sessionData);

      // If we have at least an access token, try to use it
      if (sessionData?.access_token) {
        console.log("Session has access token but no refresh token, attempting to use it anyway");
        return sessionData;
      }

      return null;
    }

    return handleSessionExpiration(sessionData);
  } catch (parseError) {
    console.error("Error parsing Supabase session data", parseError);
    return null;
  }
}

/**
 * Directly checks localStorage for a valid Supabase session
 * This can be used as a fallback when the Supabase client's getSession method fails
 *
 * @returns {SupabaseSession|null} The session object if found, null otherwise
 */
export function getDirectSessionFromStorage(): SupabaseSession | null {
  try {
    // Check for Supabase session in localStorage
    const supabaseKey = Object.keys(localStorage).find(key =>
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (!supabaseKey) {
      return findAlternativeAuthKey();
    }

    // Get the session data
    const sessionStr = localStorage.getItem(supabaseKey);
    if (!sessionStr) {
      console.log("Supabase session key exists but value is empty");
      return null;
    }

    return parseAndValidateSession(sessionStr);
  } catch (error) {
    console.error("Error checking for direct Supabase session", error);
    return null;
  }
}

/**
 * Extracts user data from a Supabase session
 *
 * @param {SupabaseSession} session The Supabase session object
 * @returns {SupabaseUser|null} The user object if found, null otherwise
 */
export function extractUserFromSession(session: SupabaseSession | null): SupabaseUser | null {
  if (!session) return null;

  try {
    // If the session already has a user property, use it
    if (session.user) {
      return session.user;
    }

    // Otherwise, try to extract user data from the access token
    if (session.access_token) {
      // The access token is a JWT, which consists of three parts separated by dots
      const parts = session.access_token.split('.');
      if (parts.length !== 3) {
        console.log("Invalid access token format");
        return null;
      }

      // The second part is the payload, which is base64-encoded
      try {
        // Decode the base64 payload
        const payload = JSON.parse(atob(parts[1]));

        // Extract user data from the payload
        if (payload.sub) {
          return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            aud: payload.aud
          };
        }
      } catch (decodeError) {
        console.error("Error decoding access token payload", decodeError);
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting user from session", error);
    return null;
  }
}
