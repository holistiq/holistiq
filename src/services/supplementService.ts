import { supabase } from '@/integrations/supabase/client';
import { Supplement, SupplementsResponse, SupplementCycleStatus } from '@/types/supplement';
import { cache, DEFAULT_CACHE_TTL } from '@/lib/cache';
import { debugLog, debugError } from '@/utils/debugUtils';

/**
 * Save a supplement to Supabase and local storage
 */
export async function saveSupplement(
  userId: string | undefined,
  supplement: Omit<Supplement, 'id' | 'color' | 'user_id'>
): Promise<{ success: boolean; error?: string; data?: Supplement }> {
  try {
    console.log(`Saving supplement for user ${userId}`);

    // Format the supplement for storage
    const formattedSupplement = {
      name: supplement.name,
      dosage: supplement.dosage,
      notes: supplement.notes || '',
      intake_time: supplement.intake_time || new Date().toISOString(),

      // New structured dosage fields
      amount: supplement.amount,
      unit: supplement.unit,

      // New timing and frequency fields
      frequency: supplement.frequency,
      time_of_day: supplement.time_of_day,
      with_food: supplement.with_food,
      schedule: supplement.schedule,
      specific_time: supplement.specific_time,

      // New brand and formulation fields
      manufacturer: supplement.manufacturer,
      brand: supplement.brand,
      brand_reputation: supplement.brand_reputation,
      formulation_type: supplement.formulation_type,
      batch_number: supplement.batch_number,
      expiration_date: supplement.expiration_date,
      third_party_tested: supplement.third_party_tested,
      certification: supplement.certification
    };

    // Create a supplement object for local storage
    const supplementData = {
      id: crypto.randomUUID(), // Generate a temporary ID for local storage
      ...formattedSupplement,
      color: '#4f46e5', // Default color
    };

    // Save to local storage first (as backup and for offline use)
    const storageKey = 'supplements';
    const existingSupplements = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedSupplements = [...existingSupplements, supplementData];
    localStorage.setItem(storageKey, JSON.stringify(updatedSupplements));
    console.log(`Updated localStorage with ${updatedSupplements.length} supplements`);

    // If user is logged in, save to Supabase
    if (userId) {
      console.log('Saving supplement to Supabase...');

      const { data, error } = await supabase
        .from('supplements')
        .insert({
          user_id: userId,
          ...formattedSupplement
        })
        .select();

      if (error) {
        console.error('Error saving supplement to Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully saved supplement to Supabase:', data);

      // Invalidate cache for this user's supplements
      cache.delete(`supplements_${userId}`);

      // Return the saved supplement with Supabase ID
      if (data && data.length > 0) {
        return {
          success: true,
          data: {
            ...data[0],
            color: '#4f46e5' // Add color for UI
          }
        };
      }
    } else {
      console.log('User not logged in, supplement saved to local storage only');
    }

    return { success: true, data: supplementData };
  } catch (error) {
    console.error('Unexpected error saving supplement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all supplements for a user from Supabase with caching
 */
export async function getSupplements(userId: string): Promise<SupplementsResponse> {
  try {
    debugLog(`Fetching supplements for user (ID: ${userId.substring(0, 8)}...)`);

    // Try to get from cache first
    const cacheKey = `supplements_${userId}`;

    return await cache.getOrSet(
      cacheKey,
      async () => {
        debugLog('Cache miss for supplements, fetching from Supabase');

        // Implement retry logic with exponential backoff
        const maxRetries = 3;
        let retryCount = 0;
        let lastError = null;

        while (retryCount < maxRetries) {
          try {
            const { data, error } = await supabase
              .from('supplements')
              .select('*')
              .eq('user_id', userId)
              .order('intake_time', { ascending: false });

            if (error) {
              debugError(`Error fetching supplements (attempt ${retryCount + 1}):`, error);
              lastError = error;
              retryCount++;
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
              continue;
            }

            debugLog(`Retrieved ${data?.length || 0} supplements from Supabase`);

            // Generate colors for supplements
            const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const supplementsWithColors: Supplement[] = data.map((supplement, index) => ({
              ...supplement,
              color: colors[index % colors.length]
            }));

            return {
              success: true,
              supplements: supplementsWithColors,
              recentSupplements: supplementsWithColors.slice(0, 3)
            };
          } catch (error) {
            debugError(`Unexpected error fetching supplements (attempt ${retryCount + 1}):`, error);
            lastError = error;
            retryCount++;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          }
        }

        // If we get here, all retries failed
        return {
          success: false,
          supplements: [],
          recentSupplements: []
        };
      },
      DEFAULT_CACHE_TTL.SHORT // Cache for 5 minutes
    );
  } catch (error) {
    debugError('Unexpected error in getSupplements:', error);
    return {
      success: false,
      supplements: [],
      recentSupplements: []
    };
  }
}

/**
 * Load supplements from local storage
 */
export function loadSupplementsFromLocalStorage(): Supplement[] {
  try {
    const supplements = localStorage.getItem('supplements');
    if (!supplements) return [];

    return JSON.parse(supplements);
  } catch (error) {
    console.error('Error loading supplements from localStorage:', error);
    return [];
  }
}

/**
 * Update an existing supplement in Supabase and local storage
 */
export async function updateSupplement(
  userId: string | undefined,
  supplementId: string,
  supplementData: Omit<Supplement, 'id' | 'color' | 'user_id'>
): Promise<{ success: boolean; error?: string; data?: Supplement }> {
  try {
    console.log(`Updating supplement ${supplementId} for user ${userId}`);

    // Format the supplement for storage
    const formattedSupplement = {
      name: supplementData.name,
      dosage: supplementData.dosage,
      notes: supplementData.notes || '',
      intake_time: supplementData.intake_time || new Date().toISOString(),

      // Structured dosage fields
      amount: supplementData.amount,
      unit: supplementData.unit,

      // Timing and frequency fields
      frequency: supplementData.frequency,
      time_of_day: supplementData.time_of_day,
      with_food: supplementData.with_food,
      schedule: supplementData.schedule,
      specific_time: supplementData.specific_time,

      // Brand and formulation fields
      manufacturer: supplementData.manufacturer,
      brand: supplementData.brand,
      brand_reputation: supplementData.brand_reputation,
      formulation_type: supplementData.formulation_type,
      batch_number: supplementData.batch_number,
      expiration_date: supplementData.expiration_date,
      third_party_tested: supplementData.third_party_tested,
      certification: supplementData.certification
    };

    // Update in local storage first
    const storageKey = 'supplements';
    const existingSupplements = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const updatedSupplements = existingSupplements.map((supplement: Supplement) =>
      supplement.id === supplementId
        ? { ...supplement, ...formattedSupplement }
        : supplement
    );
    localStorage.setItem(storageKey, JSON.stringify(updatedSupplements));
    console.log(`Updated supplement in localStorage`);

    // If user is logged in, update in Supabase
    if (userId) {
      console.log('Updating supplement in Supabase...');

      const { data, error } = await supabase
        .from('supplements')
        .update(formattedSupplement)
        .eq('id', supplementId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Error updating supplement in Supabase:', error);
        return { success: false, error: error.message };
      }

      console.log('Successfully updated supplement in Supabase:', data);

      // Invalidate cache for this user's supplements
      cache.delete(`supplements_${userId}`);

      // Return the updated supplement with Supabase ID
      if (data && data.length > 0) {
        return {
          success: true,
          data: {
            ...data[0],
            color: '#4f46e5' // Add color for UI
          }
        };
      }
    } else {
      console.log('User not logged in, supplement updated in local storage only');
    }

    // Return the updated supplement from local storage
    const updatedSupplement = updatedSupplements.find((s: Supplement) => s.id === supplementId);
    return { success: true, data: updatedSupplement };
  } catch (error) {
    console.error('Unexpected error updating supplement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update the cycle status of a supplement
 */
export async function updateSupplementCycleStatus(
  userId: string,
  supplementId: string,
  status: SupplementCycleStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Updating cycle status for supplement ${supplementId} to ${status}`);

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (!supplementId) {
      return { success: false, error: 'Supplement ID is required' };
    }

    // Prepare update data based on status
    const updateData: Record<string, any> = {
      cycle_status: status
    };

    // Add timestamps based on status
    if (status === SupplementCycleStatus.IN_PROGRESS) {
      updateData.cycle_started_at = new Date().toISOString();
    } else if (status === SupplementCycleStatus.COMPLETED) {
      updateData.cycle_completed_at = new Date().toISOString();
    }

    // Update in Supabase
    const { error } = await supabase
      .from('supplements')
      .update(updateData)
      .eq('id', supplementId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating supplement cycle status:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully updated supplement cycle status');

    // Invalidate cache for this user's supplements
    cache.delete(`supplements_${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating supplement cycle status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}