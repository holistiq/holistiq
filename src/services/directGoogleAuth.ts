/**
 * Direct Google OAuth implementation to show myholistiq.com in consent screen
 * instead of Supabase URL
 */

import { supabase } from "@/integrations/supabase/client";

// Google OAuth configuration
const GOOGLE_CLIENT_ID =
  "863915966889-85t9cr3m09unadntge8oj0g9gh9nbc5r.apps.googleusercontent.com";

// Declare global google object for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            config: GoogleButtonConfig,
          ) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (
            config: GoogleTokenClientConfig,
          ) => GoogleTokenClient;
        };
      };
    };
  }
}

export interface GoogleAuthResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleCredentialResponse {
  credential: string; // This is the ID token
  select_by: string;
}

// Google OAuth button configuration interface
export interface GoogleButtonConfig {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: string | number;
  locale?: string;
}

// Google OAuth token client configuration interface
export interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleAuthResponse) => void;
  error_callback?: (error: GoogleOAuthError) => void;
}

// Google OAuth token client interface
export interface GoogleTokenClient {
  requestAccessToken: () => void;
}

// Google OAuth error interface
export interface GoogleOAuthError {
  type: string;
  message: string;
}

export class DirectGoogleAuthService {
  private isInitialized = false;

  /**
   * Initialize Google OAuth
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Wait for Google Identity Services to load
      const checkGoogleLoaded = () => {
        if (window.google?.accounts?.id) {
          this.setupGoogleSignIn();
          this.isInitialized = true;
          resolve();
        } else {
          setTimeout(checkGoogleLoaded, 100);
        }
      };

      // Start checking after a short delay to ensure script is loaded
      setTimeout(checkGoogleLoaded, 500);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isInitialized) {
          reject(new Error("Google Identity Services failed to load"));
        }
      }, 10000);
    });
  }

  /**
   * Set up Google Sign-In for ID tokens
   */
  private setupGoogleSignIn(): void {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  }

  private currentSignInResolve:
    | ((value: void | PromiseLike<void>) => void)
    | null = null;
  private currentSignInReject: ((reason?: Error) => void) | null = null;
  private currentRememberMe: boolean = false;

  /**
   * Handle credential response from Google
   */
  private async handleCredentialResponse(
    response: GoogleCredentialResponse,
  ): Promise<void> {
    try {
      console.log("DirectGoogleAuth: Received credential response");

      if (!response.credential) {
        throw new Error("No credential received from Google");
      }

      // Exchange the ID token for a Supabase session
      await this.exchangeIdTokenForSupabaseSession(
        response.credential,
        this.currentRememberMe,
      );

      if (this.currentSignInResolve) {
        this.currentSignInResolve();
        this.currentSignInResolve = null;
        this.currentSignInReject = null;
      }
    } catch (error) {
      console.error(
        "DirectGoogleAuth: Error processing credential response:",
        error,
      );
      if (this.currentSignInReject) {
        this.currentSignInReject(error);
        this.currentSignInResolve = null;
        this.currentSignInReject = null;
      }
    }
  }

  /**
   * Sign in with Google using direct OAuth
   */
  public async signInWithGoogle(rememberMe: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      console.log("DirectGoogleAuth: Starting Google OAuth sign-in");
      console.log("DirectGoogleAuth: Remember me:", rememberMe);

      // Store the resolve/reject functions and remember me preference
      this.currentSignInResolve = resolve;
      this.currentSignInReject = reject;
      this.currentRememberMe = rememberMe;

      // Trigger Google Sign-In
      window.google.accounts.id.prompt();
    });
  }

  /**
   * Exchange Google ID token for Supabase session
   */
  private async exchangeIdTokenForSupabaseSession(
    idToken: string,
    rememberMe: boolean,
  ): Promise<void> {
    console.log("DirectGoogleAuth: Exchanging ID token for Supabase session");

    try {
      // Use Supabase's signInWithIdToken method which is designed for this purpose
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        console.error(
          "DirectGoogleAuth: Supabase signInWithIdToken error:",
          error,
        );
        throw new Error(
          `Failed to authenticate with Supabase: ${error.message}`,
        );
      }

      if (!data.session) {
        throw new Error("No session returned from Supabase");
      }

      console.log("DirectGoogleAuth: Supabase session created successfully");

      // Set storage preference based on remember me
      const storageType = rememberMe ? "local" : "session";

      // Store the session preference
      const preferenceKey = "holistiq-session-preference";
      if (rememberMe) {
        localStorage.setItem(preferenceKey, "local");
      } else {
        sessionStorage.setItem(preferenceKey, "session");
      }

      console.log("DirectGoogleAuth: Session preference set to:", storageType);
    } catch (error) {
      console.error("DirectGoogleAuth: ID token exchange failed:", error);
      throw error;
    }
  }

  /**
   * Check if Google Identity Services is available
   */
  public isGoogleAvailable(): boolean {
    return typeof window !== "undefined" && !!window.google?.accounts?.id;
  }

  /**
   * Sign out from Google
   */
  public async signOut(): Promise<void> {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

// Export singleton instance
export const directGoogleAuth = new DirectGoogleAuthService();
