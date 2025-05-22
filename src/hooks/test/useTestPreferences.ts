/**
 * Test Preferences Hook
 * 
 * Provides functionality for managing test preferences
 */
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';

// Local storage key for test preferences
const TEST_PREFERENCES_KEY = 'holistiq_test_preferences';

// Default preferences
const DEFAULT_PREFERENCES = {
  defaultTestType: 'selection',
  showFullScreenPrompt: true
};

/**
 * Interface for test preferences
 */
export interface TestPreferences {
  defaultTestType: string;
  showFullScreenPrompt: boolean;
}

/**
 * Hook for managing test preferences
 * 
 * @returns Object containing preferences, loading state, error state, and functions to save and refresh preferences
 * 
 * @example
 * ```tsx
 * const { preferences, loading, error, savePreferences } = useTestPreferences();
 * 
 * // Update preferences
 * const handleToggleFullScreen = () => {
 *   savePreferences({
 *     ...preferences,
 *     showFullScreenPrompt: !preferences.showFullScreenPrompt
 *   });
 * };
 * ```
 */
export function useTestPreferences() {
  const { user } = useSupabaseAuth();
  const [preferences, setPreferences] = useState<TestPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load from user profile if logged in
      if (user) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('test_preferences')
          .eq('user_id', user.id)
          .single();

        if (data && !error && data.test_preferences) {
          setPreferences(data.test_preferences);
          // Also update local storage for offline access
          localStorage.setItem(TEST_PREFERENCES_KEY, JSON.stringify(data.test_preferences));
          setLoading(false);
          return;
        }
      }

      // Fall back to local storage
      const storedPreferences = localStorage.getItem(TEST_PREFERENCES_KEY);
      if (storedPreferences) {
        setPreferences(JSON.parse(storedPreferences));
      }
    } catch (err) {
      console.error('Error loading test preferences:', err);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save preferences
  const savePreferences = useCallback(async (newPreferences: TestPreferences) => {
    setLoading(true);
    setError(null);
    
    try {
      // Update state
      setPreferences(newPreferences);
      
      // Save to local storage
      localStorage.setItem(TEST_PREFERENCES_KEY, JSON.stringify(newPreferences));

      // Save to user profile if logged in
      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            test_preferences: newPreferences,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          throw error;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error saving test preferences:', err);
      setError('Failed to save preferences');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    refreshPreferences: loadPreferences
  };
}
