import { supabase } from '@/integrations/supabase/client';

/**
 * Debug utility to directly query the test_results table
 * This bypasses all caching and processing logic
 */
export async function queryAllTestResults(userId: string) {
  try {
    console.log(`Direct query for all test results for user ${userId}`);

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error in direct query:', error);
      return { success: false, error: error.message, data: null };
    }

    console.log(`Direct query found ${data?.length || 0} test results`);

    if (data && data.length > 0) {
      // Log all results with their full details
      console.log('All test results from direct query:');
      data.forEach((result, index) => {
        console.log(`Result ${index + 1}:`, {
          id: result.id,
          user_id: result.user_id,
          timestamp: result.timestamp,
          test_type: result.test_type,
          score: result.score,
          reaction_time: result.reaction_time,
          accuracy: result.accuracy,
          raw_data: result.raw_data
        });
      });

      // Check for duplicate timestamps
      const timestamps = data.map(result => result.timestamp);
      const uniqueTimestamps = new Set(timestamps);

      if (timestamps.length !== uniqueTimestamps.size) {
        console.warn(`Found ${timestamps.length - uniqueTimestamps.size} duplicate timestamps in direct query results`);

        // Identify the duplicates
        const counts = {};
        const duplicates = [];

        timestamps.forEach(timestamp => {
          counts[timestamp] = (counts[timestamp] ?? 0) + 1;
          if (counts[timestamp] > 1 && !duplicates.includes(timestamp)) {
            duplicates.push(timestamp);
          }
        });

        console.warn('Duplicate timestamps:', duplicates);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error in direct query:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Debug utility to add a test result with a unique timestamp
 */
export async function addTestResultWithUniqueTimestamp(userId: string) {
  try {
    // Generate a unique timestamp by using the current time plus a random offset
    const now = new Date();
    const randomOffset = Math.floor(Math.random() * 1000); // Random milliseconds
    now.setMilliseconds(now.getMilliseconds() + randomOffset);

    const timestamp = now.toISOString();

    const testResult = {
      user_id: userId,
      timestamp,
      test_type: 'reaction',
      score: 75 + Math.floor(Math.random() * 20), // Random score between 75-94
      reaction_time: 300 + Math.floor(Math.random() * 200), // Random reaction time between 300-499
      accuracy: 0.8 + (Math.random() * 0.15), // Random accuracy between 0.8-0.95
      raw_data: JSON.stringify({
        trials: [
          { reaction_time: 350, correct: true },
          { reaction_time: 400, correct: true },
          { reaction_time: 320, correct: false }
        ]
      })
    };

    console.log('Adding test result with unique timestamp:', timestamp);

    const { data, error } = await supabase
      .from('test_results')
      .insert([testResult])
      .select();

    if (error) {
      console.error('Error adding test result:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully added test result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error adding test result:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
