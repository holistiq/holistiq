/**
 * Utilities for handling test result data transformations
 */

export interface TestResult {
  date: string;
  score: number;
  reactionTime: number;
  accuracy: number;
  test_type?: string; // Optional for backward compatibility
}

export interface SupabaseTestResult {
  id: string;
  user_id: string;
  test_type: string;
  score: number;
  reaction_time: number;
  accuracy: number;
  timestamp: string;
  raw_data?: Record<string, unknown>;
}

/**
 * Convert a Supabase test result to the standard TestResult format
 */
export function convertSupabaseToTestResult(result: SupabaseTestResult): TestResult {
  return {
    date: result.timestamp,
    score: result.score,
    reactionTime: result.reaction_time,
    accuracy: result.accuracy,
    test_type: result.test_type
  };
}

/**
 * Convert an array of Supabase test results to the standard TestResult format
 */
export function convertSupabaseArrayToTestResults(results: SupabaseTestResult[]): TestResult[] {
  return results.map(convertSupabaseToTestResult);
}

/**
 * Merge test results from multiple sources, removing duplicates
 * @param localResults Test results from local storage
 * @param supabaseResults Test results from Supabase
 * @returns Merged array of test results with duplicates removed
 */
export function mergeTestResults(localResults: TestResult[], supabaseResults: TestResult[]): TestResult[] {
  console.log("Merging test results:", {
    localCount: localResults.length,
    supabaseCount: supabaseResults.length
  });

  // Log all test results for debugging
  console.log("Local results:", localResults);
  console.log("Supabase results:", supabaseResults);

  // Create a Map to store unique test results
  // We'll use the full timestamp string as the key to preserve time information
  const uniqueTests = new Map<string, TestResult>();

  // Add local results to the map
  for (const result of localResults) {
    if (result?.date) {
      // Use a normalized date string as the key for consistent comparison
      const normalizedDate = normalizeDate(result.date);
      console.log(`Normalized local result date: ${result.date} -> ${normalizedDate}`);
      uniqueTests.set(normalizedDate, result);
    }
  }

  // Add Supabase results to the map, overwriting local results if they exist
  // Supabase results are considered more authoritative
  for (const result of supabaseResults) {
    if (result?.date) {
      // Use a normalized date string as the key for consistent comparison
      const normalizedDate = normalizeDate(result.date);
      console.log(`Normalized Supabase result date: ${result.date} -> ${normalizedDate}`);
      uniqueTests.set(normalizedDate, result);
    }
  }

  // Convert the map values to an array
  const mergedResults = Array.from(uniqueTests.values());

  console.log(`Merged ${localResults.length} local and ${supabaseResults.length} Supabase results into ${mergedResults.length} unique results`);
  console.log("Merged results:", mergedResults);

  // Sort by date (oldest first)
  return mergedResults.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Format a date string consistently
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculateChange(current: number, baseline: number): number {
  if (typeof baseline !== "number" || baseline === 0 || isNaN(baseline)) return 0;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Normalize a date string or timestamp to a consistent format for comparison
 * This helps with comparing dates that might be in different formats
 */
export function normalizeDate(dateInput: string | number): string {
  try {
    // Handle numeric timestamps (milliseconds since epoch)
    if (typeof dateInput === 'number') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('.')[0] + 'Z';
      }
      // If we can't convert the number to a valid date, return it as a string
      return String(dateInput);
    }

    // Now we know dateInput is a string
    const dateString = dateInput;

    // Handle Supabase timestamp format (e.g., "2025-05-12 01:10:55.979+00")
    // Convert to ISO format that JavaScript can parse reliably
    if (dateString.includes(' ') && dateString.includes('+00')) {
      // Replace space with 'T' and ensure proper timezone format
      const convertedString = dateString.replace(' ', 'T').replace('+00', 'Z');
      console.log(`Converted Supabase timestamp format: ${convertedString}`);
      dateInput = convertedString;
    }

    // Parse the date string to a Date object
    const date = new Date(dateInput);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string after normalization attempt: ${dateInput}`);
      return String(dateInput);
    }

    // Return a normalized ISO string without milliseconds
    // This helps with comparing dates that might have different precision
    return date.toISOString().split('.')[0] + 'Z';
  } catch (error) {
    console.error(`Error normalizing date: ${dateInput}`, error);
    return String(dateInput);
  }
}
