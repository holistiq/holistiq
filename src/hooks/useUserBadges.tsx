/**
 * User Badges Hook
 *
 * Provides functionality for managing user badges
 */
import React, { useState, useEffect, useCallback } from 'react';
import { UserBadgeWithDetails } from '@/types/achievement';
import {
  getUserBadges,
  addUserBadge,
  removeUserBadge,
  updateBadgeOrder,
  invalidateUserBadgesCache
} from '@/services/badgeService';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';

// Error categories for badge operations
export enum BadgeErrorCategory {
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NETWORK = 'network',
  DATABASE = 'database',
  NOT_FOUND = 'not_found',
  LIMIT_REACHED = 'limit_reached',
  SYSTEM_UNAVAILABLE = 'system_unavailable',
  UNKNOWN = 'unknown'
}

// Enhanced error response type
export interface BadgeOperationError {
  message: string;
  category: BadgeErrorCategory;
  details?: string;
  suggestion?: string;
}

// Helper functions to categorize string errors
function categorizeStringError(errorMsg: string): BadgeOperationError {
  // Validation errors
  if (errorMsg.includes('required') || errorMsg.includes('must be')) {
    return {
      message: errorMsg,
      category: BadgeErrorCategory.VALIDATION,
      suggestion: 'Please check your input and try again'
    };
  }

  // Not found errors
  if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
    return {
      message: errorMsg,
      category: BadgeErrorCategory.NOT_FOUND,
      suggestion: 'The requested item could not be found'
    };
  }

  // Limit reached errors
  if (errorMsg.includes('Maximum') || errorMsg.includes('allowed')) {
    return {
      message: errorMsg,
      category: BadgeErrorCategory.LIMIT_REACHED,
      suggestion: 'Remove some badges before adding new ones'
    };
  }

  // System unavailable errors
  if (errorMsg.includes('not fully set up') || errorMsg.includes('try again later')) {
    return {
      message: errorMsg,
      category: BadgeErrorCategory.SYSTEM_UNAVAILABLE,
      suggestion: 'This feature is currently unavailable. Please try again later'
    };
  }

  // Already exists errors
  if (errorMsg.includes('already exists')) {
    return {
      message: errorMsg,
      category: BadgeErrorCategory.VALIDATION,
      suggestion: 'This badge is already in your collection'
    };
  }

  // Return with the original message but unknown category
  return {
    message: errorMsg,
    category: BadgeErrorCategory.UNKNOWN,
    suggestion: 'Please try again or contact support if the issue persists'
  };
}

// Helper function to categorize Error object errors
function categorizeErrorObject(error: Error): BadgeOperationError {
  // Network errors
  if (error.message.includes('network') || error.message.includes('connection')) {
    return {
      message: 'Network connection issue',
      category: BadgeErrorCategory.NETWORK,
      details: error.message,
      suggestion: 'Please check your internet connection and try again'
    };
  }

  // Database errors
  if (error.message.includes('database') || error.message.includes('query')) {
    return {
      message: 'Database operation failed',
      category: BadgeErrorCategory.DATABASE,
      details: error.message,
      suggestion: 'Please try again later'
    };
  }

  // Return with the original message
  return {
    message: error.message,
    category: BadgeErrorCategory.UNKNOWN,
    details: error.stack,
    suggestion: 'Please try again or contact support if the issue persists'
  };
}

// Main error categorization function
function categorizeError(error: unknown): BadgeOperationError {
  // Default error
  const defaultError: BadgeOperationError = {
    message: 'An unexpected error occurred',
    category: BadgeErrorCategory.UNKNOWN,
    suggestion: 'Please try again later or contact support if the issue persists'
  };

  // Handle string errors
  if (typeof error === 'string') {
    return categorizeStringError(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    return categorizeErrorObject(error);
  }

  return defaultError;
}

// Enhanced return type for badge operations
export interface BadgeOperationResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: BadgeOperationError;
}

export function useUserBadges() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [badges, setBadges] = useState<UserBadgeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BadgeOperationError | null>(null);

  // Helper function to display error toast with appropriate message and suggestion
  const showErrorToast = useCallback((errorInfo: BadgeOperationError) => {
    toast({
      title: errorInfo.category === BadgeErrorCategory.UNKNOWN
        ? "Error"
        : `${errorInfo.category.charAt(0).toUpperCase()}${errorInfo.category.slice(1)} Error`,
      description: (
        <div>
          <p>{errorInfo.message}</p>
          {errorInfo.suggestion && (
            <p className="text-sm mt-1 text-muted-foreground">{errorInfo.suggestion}</p>
          )}
        </div>
      ),
      variant: "destructive"
    });
  }, [toast]);

  // Enhanced logging function - only log in development and avoid excessive details
  const logError = useCallback((operation: string, error: unknown, errorInfo: BadgeOperationError) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, just log the basic error
      console.error(`Error ${operation}:`, errorInfo.message);
    } else {
      // In development, log more details but avoid circular references
      console.error(`Error ${operation}:`, {
        message: errorInfo.message,
        category: errorInfo.category,
        details: errorInfo.details || 'No additional details'
      });
    }
  }, []);

  // Track if a fetch is in progress to prevent duplicate calls
  const isFetchingRef = React.useRef(false);

  // Fetch user badges
  // IMPORTANT: Removed 'badges' from dependency array to prevent circular dependency
  const fetchBadges = useCallback(async (): Promise<BadgeOperationResult<UserBadgeWithDetails[]>> => {
    // If no user, return empty array
    if (!user) {
      setBadges([]);
      setLoading(false);
      setError(null);
      return { success: true, data: [] };
    }

    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      // Return current badges without triggering a re-render
      return { success: true, data: badges };
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await getUserBadges(user.id);

      if (response.success && response.data) {
        // Only update state if the data has actually changed
        // This prevents unnecessary re-renders
        const newBadges = response.data;
        setBadges(prevBadges => {
          // Check if the badges have actually changed
          if (prevBadges.length === newBadges.length &&
              JSON.stringify(prevBadges.map(b => b.id).sort()) ===
              JSON.stringify(newBadges.map(b => b.id).sort())) {
            return prevBadges; // Return the same reference to prevent re-render
          }
          return newBadges; // Only update if changed
        });

        setLoading(false);
        return { success: true, data: response.data };
      } else if (response.error) {
        // Handle error from service
        const errorInfo = categorizeError(response.error);
        setError(errorInfo);
        setBadges([]);

        // Only show toast for certain error categories
        if (errorInfo.category !== BadgeErrorCategory.SYSTEM_UNAVAILABLE) {
          showErrorToast(errorInfo);
        }

        logError('fetching badges', response.error, errorInfo);
        setLoading(false);
        return {
          success: false,
          error: errorInfo
        };
      } else {
        // Fallback for unexpected response format
        setBadges([]);
        setLoading(false);
        return { success: true, data: [] };
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      logError('fetching badges', error, errorInfo);
      setBadges([]);
      setLoading(false);
      return {
        success: false,
        error: errorInfo
      };
    } finally {
      isFetchingRef.current = false;
    }
  }, [user, showErrorToast, logError]);

  // Add a badge
  const addBadge = useCallback(async (achievementId: string): Promise<BadgeOperationResult<UserBadgeWithDetails>> => {
    if (!user) {
      const errorInfo: BadgeOperationError = {
        message: 'You must be signed in to add badges',
        category: BadgeErrorCategory.PERMISSION,
        suggestion: 'Please sign in to continue'
      };
      setError(errorInfo);
      showErrorToast(errorInfo);
      return { success: false, error: errorInfo };
    }

    try {
      const response = await addUserBadge(user.id, achievementId);

      if (response.success && response.data) {
        toast({
          title: "Badge Added",
          description: "The badge has been added to your profile"
        });
        await fetchBadges();
        setError(null);
        return { success: true, data: response.data };
      } else if (response.error) {
        // Handle error from service
        const errorInfo = categorizeError(response.error);
        setError(errorInfo);
        showErrorToast(errorInfo);
        logError('adding badge', response.error, errorInfo);
        return { success: false, error: errorInfo };
      } else {
        // Fallback for unexpected response format
        const errorInfo: BadgeOperationError = {
          message: 'Failed to add badge',
          category: BadgeErrorCategory.UNKNOWN,
          suggestion: 'Please try again later'
        };
        setError(errorInfo);
        showErrorToast(errorInfo);
        logError('adding badge', 'Unexpected response format', errorInfo);
        return { success: false, error: errorInfo };
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      showErrorToast(errorInfo);
      logError('adding badge', error, errorInfo);
      return { success: false, error: errorInfo };
    }
  }, [user, fetchBadges, showErrorToast, logError, toast]);

  // Remove a badge
  const removeBadge = useCallback(async (badgeId: string): Promise<BadgeOperationResult> => {
    if (!user) {
      const errorInfo: BadgeOperationError = {
        message: 'You must be signed in to remove badges',
        category: BadgeErrorCategory.PERMISSION,
        suggestion: 'Please sign in to continue'
      };
      setError(errorInfo);
      showErrorToast(errorInfo);
      return { success: false, error: errorInfo };
    }

    if (!badgeId) {
      const errorInfo: BadgeOperationError = {
        message: 'Badge ID is required',
        category: BadgeErrorCategory.VALIDATION,
        suggestion: 'Please select a valid badge to remove'
      };
      setError(errorInfo);
      showErrorToast(errorInfo);
      return { success: false, error: errorInfo };
    }

    try {
      const response = await removeUserBadge(user.id, badgeId);

      if (response.success) {
        toast({
          title: "Badge Removed",
          description: "The badge has been removed from your profile"
        });
        await fetchBadges();
        setError(null);
        return { success: true };
      } else if (response.error) {
        // Handle error from service
        const errorInfo = categorizeError(response.error);
        setError(errorInfo);
        showErrorToast(errorInfo);
        logError('removing badge', response.error, errorInfo);
        return { success: false, error: errorInfo };
      } else {
        // Fallback for unexpected response format
        const errorInfo: BadgeOperationError = {
          message: 'Failed to remove badge',
          category: BadgeErrorCategory.UNKNOWN,
          suggestion: 'Please try again later'
        };
        setError(errorInfo);
        showErrorToast(errorInfo);
        logError('removing badge', 'Unexpected response format', errorInfo);
        return { success: false, error: errorInfo };
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      showErrorToast(errorInfo);
      logError('removing badge', error, errorInfo);
      return { success: false, error: errorInfo };
    }
  }, [user, fetchBadges, showErrorToast, logError, toast]);

  // Update badge order
  const updateOrder = useCallback(async (badgeId: string, newOrder: number): Promise<BadgeOperationResult> => {
    if (!user) {
      const errorInfo: BadgeOperationError = {
        message: 'You must be signed in to update badge order',
        category: BadgeErrorCategory.PERMISSION,
        suggestion: 'Please sign in to continue'
      };
      setError(errorInfo);
      showErrorToast(errorInfo);
      return { success: false, error: errorInfo };
    }

    if (!badgeId) {
      const errorInfo: BadgeOperationError = {
        message: 'Badge ID is required',
        category: BadgeErrorCategory.VALIDATION,
        suggestion: 'Please select a valid badge to reorder'
      };
      setError(errorInfo);
      showErrorToast(errorInfo);
      return { success: false, error: errorInfo };
    }

    if (typeof newOrder !== 'number' || newOrder < 1) {
      const errorInfo: BadgeOperationError = {
        message: 'Valid display order is required',
        category: BadgeErrorCategory.VALIDATION,
        suggestion: 'Display order must be a positive number'
      };
      setError(errorInfo);
      showErrorToast(errorInfo);
      return { success: false, error: errorInfo };
    }

    try {
      const response = await updateBadgeOrder(user.id, badgeId, newOrder);

      if (response.success) {
        // Success toast for order update (optional, can be uncommented if desired)
        // toast({
        //   title: "Order Updated",
        //   description: "Badge display order has been updated"
        // });
        await fetchBadges();
        setError(null);
        return { success: true };
      } else if (response.error) {
        // Handle error from service
        const errorInfo = categorizeError(response.error);
        setError(errorInfo);
        showErrorToast(errorInfo);
        logError('updating badge order', response.error, errorInfo);
        return { success: false, error: errorInfo };
      } else {
        // Fallback for unexpected response format
        const errorInfo: BadgeOperationError = {
          message: 'Failed to update badge order',
          category: BadgeErrorCategory.UNKNOWN,
          suggestion: 'Please try again later'
        };
        setError(errorInfo);
        showErrorToast(errorInfo);
        logError('updating badge order', 'Unexpected response format', errorInfo);
        return { success: false, error: errorInfo };
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      setError(errorInfo);
      showErrorToast(errorInfo);
      logError('updating badge order', error, errorInfo);
      return { success: false, error: errorInfo };
    }
  }, [user, fetchBadges, showErrorToast, logError]);

  // Fetch badges on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user, fetchBadges]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh badges - with debounce to prevent multiple rapid calls
  const refreshTimeoutRef = React.useRef<number | null>(null);
  // Track the last refresh time to prevent too frequent refreshes
  const lastRefreshTimeRef = React.useRef<number>(0);
  // Minimum time between refreshes (500ms)
  const MIN_REFRESH_INTERVAL = 500;

  const refreshBadges = useCallback(async () => {
    // Check if we've refreshed recently
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

    // If we've refreshed too recently and a fetch is already in progress, skip this refresh
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL && isFetchingRef.current) {
      return;
    }

    // Clear any existing timeout
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    // Set a new timeout with debounce
    refreshTimeoutRef.current = window.setTimeout(async () => {
      // Only refresh if we're not already fetching
      if (!isFetchingRef.current && user) {
        // Invalidate cache before refreshing
        invalidateUserBadgesCache(user.id);

        // Update the last refresh time
        lastRefreshTimeRef.current = Date.now();
        await fetchBadges();
      }
      refreshTimeoutRef.current = null;
    }, 300); // 300ms debounce for better performance
  }, [fetchBadges, user]);

  return {
    // Data
    badges,
    loading,
    error,

    // Operations
    addBadge,
    removeBadge,
    updateOrder,
    refreshBadges,

    // Error handling
    clearError
  };
}
