/**
 * Hook for executing Supabase queries with caching
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseCache, CACHE_CONFIG } from '@/lib/supabaseCache';
import { cache } from '@/lib/cache';
import { useSupabaseAuth } from './useSupabaseAuth';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

interface QueryOptions<T> {
  // The type of entity being queried
  entityType: keyof typeof CACHE_CONFIG;

  // The specific cache key pattern to use
  cacheKeyPattern: string;

  // Whether to skip the cache and always fetch fresh data
  skipCache?: boolean;

  // Custom TTL for this specific query
  ttl?: number;

  // Dependencies that should trigger a refetch when changed
  dependencies?: any[];

  // Whether to execute the query immediately
  enabled?: boolean;
}

interface QueryResult<T> {
  // The query data
  data: T | null;

  // Whether the query is loading
  isLoading: boolean;

  // Any error that occurred
  error: Error | null;

  // Function to manually refetch the data
  refetch: () => Promise<void>;

  // Whether the data came from cache
  isFromCache: boolean;
}

/**
 * Hook for executing Supabase queries with caching
 * @param queryFn Function that returns a Supabase query
 * @param options Query options
 * @returns Query result
 */
export function useSupabaseQuery<T>(
  queryFn: () => PostgrestFilterBuilder<any, any, any>,
  options: QueryOptions<T>
): QueryResult<T> {
  const { user } = useSupabaseAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Default to enabled if not specified
  const enabled = options.enabled ?? true;

  // Execute the query
  const executeQuery = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If skipCache is true, invalidate the cache first
      if (options.skipCache) {
        cache.delete(options.cacheKeyPattern);
      }

      // Check if we have a cached value before executing the query
      const cachedValue = cache.get<T>(options.cacheKeyPattern);
      const hasCachedValue = cachedValue !== undefined;

      // Execute the query with caching
      const result = await supabaseCache.query<{ data: T; error: any }>(
        options.entityType,
        options.cacheKeyPattern,
        async () => {
          const query = queryFn();
          return await query;
        },
        options.ttl
      );

      // Set the from cache flag based on whether we had a cached value before executing
      setIsFromCache(hasCachedValue);

      if (result.error) {
        throw new Error(result.error.message ?? 'An error occurred');
      }

      setData(result.data);
    } catch (err) {
      console.error('Error executing Supabase query:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    options.entityType,
    options.cacheKeyPattern,
    options.skipCache,
    options.ttl,
    ...(options.dependencies || [])
  ]);

  // Execute the query when the component mounts or dependencies change
  useEffect(() => {
    if (user || !options.cacheKeyPattern.includes('undefined')) {
      executeQuery();
    } else {
      setIsLoading(false);
    }
  }, [executeQuery, user]);

  // Function to manually refetch the data
  const refetch = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isFromCache
  };
}

/**
 * Hook for executing a Supabase RPC call with caching
 * @param functionName The name of the RPC function
 * @param params The parameters to pass to the function
 * @param options Query options
 * @returns Query result
 */
export function useSupabaseRpc<T>(
  functionName: string,
  params: Record<string, any>,
  options: QueryOptions<T>
): QueryResult<T> {
  const { user } = useSupabaseAuth();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Default to enabled if not specified
  const enabled = options.enabled ?? true;

  // Execute the RPC call
  const executeRpc = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If skipCache is true, invalidate the cache first
      if (options.skipCache) {
        cache.delete(options.cacheKeyPattern);
      }

      // Check if we have a cached value before executing the query
      const cachedValue = cache.get<T>(options.cacheKeyPattern);
      const hasCachedValue = cachedValue !== undefined;

      // Execute the RPC call with caching
      const result = await supabaseCache.query<{ data: T; error: any }>(
        options.entityType,
        options.cacheKeyPattern,
        async () => {
          return await supabase.rpc(functionName, params);
        },
        options.ttl
      );

      // Set the from cache flag based on whether we had a cached value before executing
      setIsFromCache(hasCachedValue);

      if (result.error) {
        throw new Error(result.error.message ?? 'An error occurred');
      }

      setData(result.data);
    } catch (err) {
      console.error(`Error executing Supabase RPC call to ${functionName}:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    functionName,
    JSON.stringify(params),
    options.entityType,
    options.cacheKeyPattern,
    options.skipCache,
    options.ttl,
    ...(options.dependencies || [])
  ]);

  // Execute the RPC call when the component mounts or dependencies change
  useEffect(() => {
    if (user || !options.cacheKeyPattern.includes('undefined')) {
      executeRpc();
    } else {
      setIsLoading(false);
    }
  }, [executeRpc, user]);

  // Function to manually refetch the data
  const refetch = useCallback(async () => {
    await executeRpc();
  }, [executeRpc]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isFromCache
  };
}
