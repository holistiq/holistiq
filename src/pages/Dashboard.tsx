import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Hooks
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTestResults } from "@/hooks/useTestResults";
import { useRefreshState } from "@/hooks/useRefreshState";

// Utils
import { getSupplements, loadSupplementsFromLocalStorage } from "@/services/supplementService";
import { getConfoundingFactors } from "@/services/confoundingFactorService";
import { getWashoutPeriods } from "@/services/washoutPeriodService";
import { debounce } from "@/lib/utils";

// Components
import { DashboardLayout } from "@/components/dashboard/layout";
import { ModernDashboardOverview } from "@/components/dashboard/tabs/overview";
// Removed SupplementsOverview import as the tab has been removed
// Removed FactorsAnalysis import as the tab has been removed
import { CognitivePerformanceDashboard } from "@/components/dashboard/tabs/performance";
import { BaselinePrompt, LoadingState } from "@/components/dashboard/common";
import { RefreshIndicator } from "@/components/dashboard/common/RefreshIndicator";

// Types
import { Supplement } from "@/types/supplement";
import { ConfoundingFactor } from "@/types/confoundingFactor";
import { ActiveWashoutPeriod } from "@/types/washoutPeriod";
import { DashboardTabValue } from "@/components/dashboard/layout/DashboardLayout";

export default function Dashboard() {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTabValue>("overview");

  // Use the TestResultsContext to get test results data
  const {
    baselineResult,
    latestResult,
    testHistory,
    isLoadingTests,
    refreshTestResults
  } = useTestResults();

  const [recentSupplements, setRecentSupplements] = useState<Supplement[]>([]);
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(true);
  const [recentFactors, setRecentFactors] = useState<ConfoundingFactor[]>([]);
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [activeWashoutPeriods, setActiveWashoutPeriods] = useState<ActiveWashoutPeriod[]>([]);
  const [isLoadingWashoutPeriods, setIsLoadingWashoutPeriods] = useState(true);

  // Use the new refresh state hook for better state management
  const {
    isRefreshing,
    startRefresh,
    completeRefresh,
    updateProgress
  } = useRefreshState({
    minRefreshInterval: 2000,
    autoResetTimeout: 8000,
    debug: process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true'
  });

  // Use refs to prevent double fetching and track state
  const isFetchingRef = useRef(false);
  const isFirstMount = useRef(true);
  const hasHandledAuthCallback = useRef(false);

  // Memoize the current loading state to prevent unnecessary re-renders
  const currentLoadingState = useMemo(() =>
    isLoadingTests ||
    isLoadingSupplements ||
    isLoadingFactors ||
    isLoadingWashoutPeriods ||
    isRefreshing
  , [isLoadingTests, isLoadingSupplements, isLoadingFactors, isLoadingWashoutPeriods, isRefreshing]);

  // Check if we have any test results - memoize to prevent unnecessary recalculations
  const hasAnyTestResults = useMemo(() => testHistory.length > 0, [testHistory.length]);

  // Add debug logging to help diagnose loading state issues
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
      console.log("Dashboard loading state changed:", {
        isLoadingTests,
        isLoadingSupplements,
        isLoadingFactors,
        isLoadingWashoutPeriods,
        isFetching: isFetchingRef.current,
        isRefreshing,
        testHistoryLength: testHistory.length
      });
    }
  }, [isLoadingTests, isLoadingSupplements, isLoadingFactors, isLoadingWashoutPeriods, isRefreshing, testHistory.length]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Handle case where activeTab might be set to the removed tabs
  useEffect(() => {
    if (activeTab === 'supplements' as any) {
      navigate('/supplements');
    } else if (activeTab === 'factors' as any) {
      navigate('/confounding-factors');
    }
  }, [activeTab, navigate]);

  // Create a debounced version of refreshTestResults to prevent rapid multiple calls
  const debouncedRefreshTestResults = useMemo(() =>
    debounce((forceRefresh = false) => {
      // The actual refresh is now handled by the TestResultsContext with proper state management
      refreshTestResults(forceRefresh);

      // Set a timeout to ensure the fetching flag is reset
      // This is a safety measure in case the TestResultsContext doesn't properly reset it
      setTimeout(() => {
        if (isFetchingRef.current) {
          if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
            console.log("Safety reset of isFetchingRef after debounced refresh");
          }
          isFetchingRef.current = false;
        }
      }, 3000); // 3 second safety timeout
    }, 300), // 300ms debounce time
  [refreshTestResults]);

  // Function to fetch test results - now uses debounced refresh
  const fetchTestResults = useCallback((forceRefresh = false) => {
    // Prevent double fetching unless forced
    if (isFetchingRef.current && !forceRefresh) {
      if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
        console.log("Skipping duplicate fetch request - already fetching");
      }
      return () => {}; // Return empty cleanup function
    }

    // Set fetching flag
    isFetchingRef.current = true;

    try {
      // Use the debounced refresh function
      debouncedRefreshTestResults(forceRefresh);

      // Set a safety timeout to ensure we don't get stuck in loading state
      const safetyTimeout = setTimeout(() => {
        if (isFetchingRef.current) {
          // Only log in development or if it's a real issue
          if (process.env.NODE_ENV === 'development') {
            console.warn("Test results fetch safety timeout triggered - resetting loading state");
          }
          isFetchingRef.current = false;
        }
      }, 8000); // 8 second safety timeout (reduced from 10s)

      // Set a shorter timeout to reset the fetching flag after a reasonable time
      // This helps ensure we don't block future fetches if the current one is slow
      const resetTimeout = setTimeout(() => {
        isFetchingRef.current = false;
      }, 5000); // Reset after 5 seconds

      // Return cleanup function to clear both timeouts
      return () => {
        clearTimeout(safetyTimeout);
        clearTimeout(resetTimeout);
      };
    } catch (error) {
      console.error("Error refreshing test results:", error);
      // Reset fetching flag immediately on error
      isFetchingRef.current = false;
      return () => {}; // Return empty cleanup function
    }
  }, [debouncedRefreshTestResults]);

  // Function to fetch supplements
  const fetchSupplements = useCallback(async () => {
    if (!user) return;

    setIsLoadingSupplements(true);
    try {
      // First try to load from local storage for immediate display
      const localSupplements = loadSupplementsFromLocalStorage();
      if (localSupplements.length > 0) {
        // Take the 3 most recent supplements
        setRecentSupplements(localSupplements.slice(0, 3));
      }

      // If user is logged in, fetch from Supabase for the most up-to-date data
      const result = await getSupplements(user.id);
      if (result.success) {
        setRecentSupplements(result.recentSupplements);
      }
    } catch (error) {
      console.error('Error fetching supplements:', error);
    } finally {
      setIsLoadingSupplements(false);
    }
  }, [user]);

  // Function to fetch confounding factors
  const fetchConfoundingFactors = useCallback(async () => {
    if (!user) return;

    setIsLoadingFactors(true);
    try {
      const result = await getConfoundingFactors(user.id);
      if (result.success) {
        setRecentFactors(result.factors);
      }
    } catch (error) {
      console.error('Error fetching confounding factors:', error);
    } finally {
      setIsLoadingFactors(false);
    }
  }, [user]);

  // Function to fetch washout periods
  const fetchWashoutPeriods = useCallback(async () => {
    if (!user) return;

    setIsLoadingWashoutPeriods(true);
    try {
      const result = await getWashoutPeriods(user.id);
      if (result.success) {
        setActiveWashoutPeriods(result.activeWashoutPeriods);
      }
    } catch (error) {
      console.error('Error fetching washout periods:', error);
    } finally {
      setIsLoadingWashoutPeriods(false);
    }
  }, [user]);

  // Create a memoized handler for tab changes
  const handleTabChange = useCallback((tab: DashboardTabValue) => {
    // If someone tries to access the removed supplements tab, redirect to the main supplements page
    if (tab === 'supplements' as any) {
      navigate('/supplements');
      return;
    }
    // If someone tries to access the removed factors tab, redirect to the confounding factors page
    if (tab === 'factors' as any) {
      navigate('/confounding-factors');
      return;
    }
    setActiveTab(tab);
  }, [setActiveTab, navigate]);

  // Create a single coordinated refresh function for all data
  const refreshAllData = useCallback((forceRefresh = false) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
        console.log("Refresh already in progress, skipping duplicate refresh");
      }
      return;
    }

    // Track completion of each data source
    const completionStatus = {
      tests: false,
      supplements: false,
      factors: false,
      washouts: false
    };

    // Track if the operation has timed out
    let hasTimedOut = false;
    let isCleanedUp = false;

    // Create a function to check if all refreshes are complete
    const checkAllComplete = () => {
      // Don't update state if we've already timed out or cleaned up
      if (hasTimedOut || isCleanedUp) {
        return;
      }

      if (completionStatus.tests &&
          completionStatus.supplements &&
          completionStatus.factors &&
          completionStatus.washouts) {
        if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
          console.log("All data refresh operations completed successfully");
        }

        // Set progress to 100% and complete the refresh
        updateProgress(100);
        setTimeout(() => {
          completeRefresh();
          isFetchingRef.current = false;
        }, 300); // Small delay for visual feedback
      }
    };

    // Set a safety timeout to ensure we don't get stuck in loading state
    const refreshTimeout = setTimeout(() => {
      if (isRefreshing) {
        hasTimedOut = true;
        console.warn("Dashboard refresh timeout triggered - forcing reset of loading state");

        // Log which operations didn't complete
        if (process.env.NODE_ENV === 'development') {
          const pendingOps = [];
          if (!completionStatus.tests) pendingOps.push('tests');
          if (!completionStatus.supplements) pendingOps.push('supplements');
          if (!completionStatus.factors) pendingOps.push('factors');
          if (!completionStatus.washouts) pendingOps.push('washouts');
          console.warn(`Incomplete operations: ${pendingOps.join(', ')}`);
        }

        // Force complete the refresh
        updateProgress(100);
        setTimeout(() => {
          completeRefresh();
          isFetchingRef.current = false;
        }, 300);
      }
    }, 8000); // 8 second safety timeout

    // Refresh test results - this is handled differently because it returns a cleanup function
    isFetchingRef.current = true;
    let testCleanup;

    try {
      testCleanup = fetchTestResults(forceRefresh);
    } catch (error) {
      console.error("Error fetching test results:", error);
      completionStatus.tests = true;
      checkAllComplete();
    }

    // We need to manually track when test results are done since it doesn't return a promise
    // Set a shorter timeout just for test results
    const testTimeout = setTimeout(() => {
      if (!completionStatus.tests) {
        completionStatus.tests = true;
        checkAllComplete();
      }
    }, 5000); // Assume test results complete within 5 seconds

    // Add event listener to detect when test results are loaded
    const handleTestResultsLoaded = () => {
      if (!completionStatus.tests && !hasTimedOut && !isCleanedUp) {
        if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
          console.log("Test results loaded event received");
        }
        completionStatus.tests = true;
        updateProgress(25); // Update progress indicator
        checkAllComplete();
      }
    };

    // Listen for a custom event that could be dispatched when test results are loaded
    // Use { once: true } to ensure the event listener is automatically removed after it's triggered once
    window.addEventListener('test-results-loaded', handleTestResultsLoaded, { once: true });

    // Refresh supplements with error handling
    fetchSupplements()
      .then(() => {
        if (!isCleanedUp) {
          completionStatus.supplements = true;
          updateProgress(50); // Update progress indicator
          checkAllComplete();
        }
      })
      .catch((error) => {
        console.error("Error fetching supplements:", error);
        if (!isCleanedUp) {
          completionStatus.supplements = true; // Mark as complete even on error
          updateProgress(50); // Update progress indicator
          checkAllComplete();
        }
      });

    // Refresh confounding factors with error handling
    fetchConfoundingFactors()
      .then(() => {
        if (!isCleanedUp) {
          completionStatus.factors = true;
          updateProgress(75); // Update progress indicator
          checkAllComplete();
        }
      })
      .catch((error) => {
        console.error("Error fetching confounding factors:", error);
        if (!isCleanedUp) {
          completionStatus.factors = true; // Mark as complete even on error
          updateProgress(75); // Update progress indicator
          checkAllComplete();
        }
      });

    // Refresh washout periods with error handling
    fetchWashoutPeriods()
      .then(() => {
        if (!isCleanedUp) {
          completionStatus.washouts = true;
          updateProgress(90); // Update progress indicator
          checkAllComplete();
        }
      })
      .catch((error) => {
        console.error("Error fetching washout periods:", error);
        if (!isCleanedUp) {
          completionStatus.washouts = true; // Mark as complete even on error
          updateProgress(90); // Update progress indicator
          checkAllComplete();
        }
      });

    // Return cleanup function
    return () => {
      // Mark as cleaned up to prevent further state updates
      isCleanedUp = true;

      // Clear all timeouts
      clearTimeout(refreshTimeout);
      clearTimeout(testTimeout);

      // Remove event listener
      window.removeEventListener('test-results-loaded', handleTestResultsLoaded);

      // Call the cleanup function from fetchTestResults if it exists
      if (testCleanup) testCleanup();

      // Ensure we reset loading states on cleanup
      if (isRefreshing && !hasTimedOut) {
        // Complete the refresh with a smooth transition
        updateProgress(100);
        setTimeout(() => {
          completeRefresh();
          isFetchingRef.current = false;
        }, 300);
      } else {
        isFetchingRef.current = false;
      }
    };
  }, [
    fetchTestResults,
    fetchSupplements,
    fetchConfoundingFactors,
    fetchWashoutPeriods,
    isRefreshing,
    updateProgress,
    completeRefresh
  ]);

  // Create a memoized handler for user-initiated refresh
  const handleRefresh = useCallback(() => {
    // Use our new refresh state hook to manage the refresh state
    if (startRefresh()) {
      // Only proceed with data fetching if startRefresh returns true
      // (it will return false if a refresh is already in progress or if it's too soon)

      // Start by updating progress to indicate the refresh has started
      updateProgress(10);

      // When user explicitly clicks refresh, we should force refresh
      refreshAllData(true);
    }
  }, [startRefresh, updateProgress, refreshAllData]);

  // Main data fetching effect - only runs once on mount and when user changes
  useEffect(() => {
    // Skip if we're still loading auth state
    if (loading) {
      return;
    }

    // Create a ref to track if this effect has already initiated a fetch
    // This prevents multiple fetches from the same effect instance
    const effectRef = {
      hasFetched: false
    };

    // Only fetch data once on initial mount or when user changes
    if (isFirstMount.current || user?.id) {
      isFirstMount.current = false;

      // Set a small delay to prevent double rendering
      const fetchTimer = setTimeout(() => {
        // Skip if this effect instance has already fetched or component unmounted
        if (effectRef.hasFetched) return;
        effectRef.hasFetched = true;

        // Reset loading flags to ensure we start from a clean state
        isFetchingRef.current = false;

        // Check if we're already in a refreshing state before initiating a new refresh
        if (!isRefreshing) {
          // Use our consolidated refresh function with regular (non-forced) refresh
          // to allow caching and prevent duplicate calls
          refreshAllData(false);

          // Only log in development and only when debugging is needed
          if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
            console.log("Dashboard data fetching initiated for user:", user?.id);
          }
        } else {
          console.warn("Skipping initial data fetch because a refresh is already in progress");
        }

        // Add a global safety timeout to reset loading state if something goes wrong
        const globalSafetyTimeout = setTimeout(() => {
          if (isFetchingRef.current || isRefreshing) {
            console.warn("Global safety timeout triggered - resetting all loading states");
            isFetchingRef.current = false;
            completeRefresh(); // Use completeRefresh instead of setIsRefreshing
          }
        }, 8000); // 8 second global safety timeout

        return () => clearTimeout(globalSafetyTimeout);
      }, 200); // Increased to 200ms to ensure React has time to stabilize

      return () => {
        clearTimeout(fetchTimer);
        // Ensure we clean up loading states when the component unmounts
        isFetchingRef.current = false;
        if (isRefreshing) {
          completeRefresh(); // Use completeRefresh instead of setIsRefreshing
        }
      };
    }
  // Include completeRefresh in the dependency array
  }, [loading, user?.id, refreshAllData, completeRefresh]);

  // Add a global safety timeout to ensure we never get stuck in a loading state
  useEffect(() => {
    // Set a global safety timeout that will reset all loading states after a maximum time
    const absoluteMaxTimeout = setTimeout(() => {
      const anyLoadingState = isLoadingTests ||
                             isLoadingSupplements ||
                             isLoadingFactors ||
                             isLoadingWashoutPeriods ||
                             isRefreshing ||
                             isFetchingRef.current;

      if (anyLoadingState) {
        console.warn("ABSOLUTE MAXIMUM TIMEOUT REACHED - Forcing reset of all loading states");

        // Reset all loading states
        setIsLoadingTests(false);
        setIsLoadingSupplements(false);
        setIsLoadingFactors(false);
        setIsLoadingWashoutPeriods(false);
        completeRefresh(); // Use completeRefresh instead of setIsRefreshing
        isFetchingRef.current = false;

        // Force a refresh of the page as a last resort
        if (process.env.NODE_ENV === 'production') {
          window.location.reload();
        }
      }
    }, 20000); // 20 second absolute maximum timeout

    return () => clearTimeout(absoluteMaxTimeout);
  }, [isLoadingTests, isLoadingSupplements, isLoadingFactors, isLoadingWashoutPeriods, isRefreshing, completeRefresh]);

  // Check if we're coming from an authentication flow
  useEffect(() => {
    // Only run this once
    if (hasHandledAuthCallback.current) {
      return;
    }

    const referrer = document.referrer;
    if (referrer?.includes('/auth/callback')) {
      // Mark as handled to prevent multiple refreshes
      hasHandledAuthCallback.current = true;

      // Only log in development and only when debugging is needed
      const shouldLog = process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true';

      if (shouldLog) {
        console.log("Detected navigation from auth callback, ensuring fresh state (one-time)");
      }

      // Clear any cached data to ensure we have fresh state
      if (user?.id) {
        // Using dynamic import instead of require
        import('@/lib/cache').then(cacheModule => {
          const cache = cacheModule.cache;
          if (cache) {
            if (shouldLog) {
              console.log("Clearing cache after authentication for user:", user.id);
            }
            cache.clear();

            // Force refresh all data after clearing cache
            refreshAllData(true);
          }
        }).catch(error => {
          console.error("Error importing cache module after authentication:", error);
        });
      }
    } else {
      // Mark as handled even if not from auth callback to prevent future checks
      hasHandledAuthCallback.current = true;
    }
  }, [user?.id, refreshAllData]);

  // Render loading state for auth with a timeout to prevent getting stuck
  useEffect(() => {
    let authTimeoutId: number | null = null;

    if (loading) {
      // Set a timeout to prevent getting stuck in the loading state
      authTimeoutId = window.setTimeout(() => {
        // Always log this warning as it's a critical issue
        console.warn("Authentication check timed out after 10 seconds");
        // Force refresh the page if we're stuck in loading state for too long
        window.location.reload();
      }, 10000); // 10 seconds timeout
    }

    return () => {
      if (authTimeoutId !== null) {
        window.clearTimeout(authTimeoutId);
      }
    };
  }, [loading]);

  // We no longer need the effect to reset refreshing state
  // as it's now handled by the useRefreshState hook

  // Add an effect to check if all data is loaded and complete the refresh
  useEffect(() => {
    // If we're not refreshing, nothing to do
    if (!isRefreshing) {
      return;
    }

    // Check if all data is loaded
    if (!isLoadingTests &&
        !isLoadingSupplements &&
        !isLoadingFactors &&
        !isLoadingWashoutPeriods &&
        !isFetchingRef.current) {
      // Only log in development and only when debugging is needed
      if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
        console.log("All data loaded, completing refresh");
      }

      // Set progress to 100% and complete the refresh
      updateProgress(100);
      setTimeout(() => {
        completeRefresh();
      }, 300); // Small delay for visual feedback
    }
  }, [
    isRefreshing,
    isLoadingTests,
    isLoadingSupplements,
    isLoadingFactors,
    isLoadingWashoutPeriods,
    updateProgress,
    completeRefresh
  ]);

  // Render loading state for auth
  if (loading) {
    return <LoadingState message="Checking authentication..." />;
  }



  // Show loading state if we're still fetching initial data
  // Only show loading state if we have no test results yet
  if ((isLoadingTests || isFetchingRef.current) && testHistory.length === 0) {
    return <LoadingState message="Loading your data..." />;
  }

  // We'll show the loading indicator inline when refreshing, so we don't need this block anymore

  // Log the current state for debugging in development only when debug_logging is enabled
  if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
    console.log("Dashboard state:", {
      hasBaseline: !!baselineResult,
      testCount: testHistory.length,
      isLoading: currentLoadingState
    });
  }

  // Render baseline prompt ONLY if we have no test results at all and we're not loading
  if (testHistory.length === 0) {
    return <BaselinePrompt />;
  }

  // If we have test results but no explicit baseline, use the first test as baseline
  // This ensures we don't keep prompting for baseline tests if the user has already taken tests
  if (!baselineResult && hasAnyTestResults) {
    // Only refresh if we're not already fetching
    if (!isFetchingRef.current) {
      // Only log in development and only when debugging is needed
      if (process.env.NODE_ENV === 'development' && localStorage.getItem('debug_logging') === 'true') {
        console.log("No baseline found but tests exist, refreshing data...");
      }

      // Don't force refresh here - let the caching mechanism work
      // This prevents unnecessary double fetching
      refreshTestResults(false);

      return (
        <DashboardLayout
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onRefresh={handleRefresh}
          isLoading={true}
        >
          <LoadingState message="Preparing your dashboard..." />
        </DashboardLayout>
      );
    }
  }



  // Render the dashboard content
  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onRefresh={handleRefresh}
      isLoading={currentLoadingState}
    >
      {/* Use our new RefreshIndicator component for a non-disruptive loading indicator */}
      <RefreshIndicator
        isRefreshing={isRefreshing}
        position="top-center"
        size="medium"
        showLabel={true}
        className="mb-4"
      />

      {/* Dashboard Content */}
      {activeTab === "overview" && (
        <ModernDashboardOverview
          baselineResult={baselineResult}
          latestResult={latestResult}
          recentSupplements={recentSupplements}
          recentFactors={recentFactors}
          activeWashoutPeriods={activeWashoutPeriods}
          testHistory={testHistory}
          isLoadingTests={isLoadingTests}
          isLoadingSupplements={isLoadingSupplements}
          isLoadingFactors={isLoadingFactors}
          isLoadingWashoutPeriods={isLoadingWashoutPeriods}
        />
      )}
      {activeTab === "performance" && (
        <CognitivePerformanceDashboard
          testResults={testHistory}
          supplements={recentSupplements}
          factors={recentFactors}
          washoutPeriods={activeWashoutPeriods}
          baselineResult={baselineResult}
          isLoading={isLoadingTests || isLoadingSupplements || isLoadingWashoutPeriods}
          isLoadingFactors={isLoadingFactors}
        />
      )}
      {/* Supplements tab removed to simplify navigation */}
      {/* Factors tab removed to simplify navigation */}
    </DashboardLayout>
  );
}
