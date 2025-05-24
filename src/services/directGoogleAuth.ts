/**
 * Direct Google OAuth implementation to show myholistiq.com in consent screen
 * instead of Supabase URL
 */

import { supabase } from '@/integrations/supabase/client';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '863915966889-85t9cr3m09unadntge8oj0g9gh9nbc5r.apps.googleusercontent.com';

// Declare global google object for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
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

export class DirectGoogleAuthService {
  private tokenClient: any = null;
  private isInitialized = false;

  /**
   * Initialize Google OAuth
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Wait for Google Identity Services to load
      const checkGoogleLoaded = () => {
        if (window.google?.accounts?.oauth2) {
          this.setupTokenClient();
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
          reject(new Error('Google Identity Services failed to load'));
        }
      }, 10000);
    });
  }

  /**
   * Set up the Google OAuth token client
   */
  private setupTokenClient(): void {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: '', // Will be set dynamically
    });
  }

  /**
   * Sign in with Google using direct OAuth
   */
  public async signInWithGoogle(rememberMe: boolean = false): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      console.log('DirectGoogleAuth: Starting Google OAuth sign-in');
      console.log('DirectGoogleAuth: Remember me:', rememberMe);

      // Set up the callback for this specific sign-in attempt
      this.tokenClient.callback = async (response: GoogleAuthResponse) => {
        try {
          console.log('DirectGoogleAuth: Received OAuth response');

          if (response.error) {
            console.error('DirectGoogleAuth: OAuth error:', response.error);
            reject(new Error(`OAuth error: ${response.error}`));
            return;
          }

          // Exchange the Google tokens for a Supabase session
          await this.exchangeTokensForSupabaseSession(response, rememberMe);
          resolve();
        } catch (error) {
          console.error('DirectGoogleAuth: Error processing OAuth response:', error);
          reject(error);
        }
      };

      // Request the access token
      this.tokenClient.requestAccessToken({
        prompt: 'select_account',
      });
    });
  }

  /**
   * Exchange Google tokens for Supabase session
   */
  private async exchangeTokensForSupabaseSession(
    googleResponse: GoogleAuthResponse,
    rememberMe: boolean
  ): Promise<void> {
    console.log('DirectGoogleAuth: Exchanging tokens for Supabase session');

    try {
      console.log('DirectGoogleAuth: Exchanging access token with Supabase');

      // Exchange the token via Supabase's REST API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          provider: 'google',
          access_token: googleResponse.access_token,
          id_token: googleResponse.id_token ?? googleResponse.access_token,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(`Supabase auth failed: ${errorData.error_description ?? errorData.error}`);
      }

      const authData = await authResponse.json();

      // Set the session in Supabase client
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
      });

      if (sessionError) {
        console.error('DirectGoogleAuth: Supabase session error:', sessionError);
        throw new Error(`Failed to create Supabase session: ${sessionError.message}`);
      }

      if (!sessionData.session) {
        throw new Error('No session returned from Supabase');
      }

      console.log('DirectGoogleAuth: Supabase session created successfully');

      // Set storage preference based on remember me
      const storageType = rememberMe ? 'local' : 'session';

      // Store the session preference
      const preferenceKey = 'holistiq-session-preference';
      if (rememberMe) {
        localStorage.setItem(preferenceKey, 'local');
      } else {
        sessionStorage.setItem(preferenceKey, 'session');
      }

      console.log('DirectGoogleAuth: Session preference set to:', storageType);
    } catch (error) {
      console.error('DirectGoogleAuth: Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Check if Google Identity Services is available
   */
  public isGoogleAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.google?.accounts?.oauth2;
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
