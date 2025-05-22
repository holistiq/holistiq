/**
 * Test Frequency Service
 * 
 * Manages test frequency, cooldown periods, and multiple tests per day
 */
import { supabase } from '@/integrations/supabase/client';
import { TestResult } from '@/lib/testResultUtils';
import { differenceInHours, differenceInDays, parseISO, startOfDay } from 'date-fns';

// Constants for test frequency settings
export const TEST_FREQUENCY = {
  // Minimum hours between tests (cooldown period)
  MIN_HOURS_BETWEEN_TESTS: 4,
  
  // Recommended days between tests for optimal tracking
  RECOMMENDED_DAYS_BETWEEN_TESTS: 2,
  
  // Maximum tests allowed per day
  MAX_TESTS_PER_DAY: 3,
  
  // Maximum tests allowed per week
  MAX_TESTS_PER_WEEK: 10
};

export interface TestFrequencyStatus {
  canTakeTest: boolean;
  cooldownRemaining: number; // in minutes
  testsRemainingToday: number;
  testsRemainingThisWeek: number;
  nextRecommendedTestTime: Date | null;
  lastTestTime: Date | null;
  message: string;
}

/**
 * Check if a user can take a test based on frequency rules
 */
export async function checkTestFrequency(userId: string): Promise<TestFrequencyStatus> {
  try {
    // Default response
    const defaultResponse: TestFrequencyStatus = {
      canTakeTest: true,
      cooldownRemaining: 0,
      testsRemainingToday: TEST_FREQUENCY.MAX_TESTS_PER_DAY,
      testsRemainingThisWeek: TEST_FREQUENCY.MAX_TESTS_PER_WEEK,
      nextRecommendedTestTime: null,
      lastTestTime: null,
      message: "You can take a test now."
    };

    // If no user ID, return default response
    if (!userId) {
      return {
        ...defaultResponse,
        message: "Please sign in to track your test frequency."
      };
    }

    // Get recent test results
    const { data: testResults, error } = await supabase
      .from('test_results')
      .select('timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching test results for frequency check:', error);
      return defaultResponse;
    }

    // If no test results, user can take a test
    if (!testResults || testResults.length === 0) {
      return {
        ...defaultResponse,
        message: "This will be your first test. Good luck!"
      };
    }

    const now = new Date();
    const today = startOfDay(now);
    
    // Parse test timestamps
    const testDates = testResults.map(result => parseISO(result.timestamp));
    
    // Get the most recent test
    const lastTestTime = testDates[0];
    
    // Calculate hours since last test
    const hoursSinceLastTest = differenceInHours(now, lastTestTime);
    
    // Check if in cooldown period
    const inCooldown = hoursSinceLastTest < TEST_FREQUENCY.MIN_HOURS_BETWEEN_TESTS;
    const cooldownRemaining = inCooldown 
      ? (TEST_FREQUENCY.MIN_HOURS_BETWEEN_TESTS - hoursSinceLastTest) * 60 
      : 0;
    
    // Calculate tests taken today
    const testsToday = testDates.filter(date => 
      differenceInDays(date, today) === 0
    ).length;
    
    // Calculate tests taken this week
    const testsThisWeek = testDates.filter(date => 
      differenceInDays(now, date) < 7
    ).length;
    
    // Calculate remaining tests
    const testsRemainingToday = Math.max(0, TEST_FREQUENCY.MAX_TESTS_PER_DAY - testsToday);
    const testsRemainingThisWeek = Math.max(0, TEST_FREQUENCY.MAX_TESTS_PER_WEEK - testsThisWeek);
    
    // Calculate next recommended test time
    const nextRecommendedTestTime = new Date(lastTestTime);
    nextRecommendedTestTime.setHours(
      nextRecommendedTestTime.getHours() + TEST_FREQUENCY.RECOMMENDED_DAYS_BETWEEN_TESTS * 24
    );
    
    // Determine if user can take a test
    const canTakeTest = !inCooldown && testsRemainingToday > 0 && testsRemainingThisWeek > 0;
    
    // Create appropriate message
    let message = "You can take a test now.";
    
    if (inCooldown) {
      const hours = Math.floor(cooldownRemaining / 60);
      const minutes = Math.round(cooldownRemaining % 60);
      message = `Please wait ${hours}h ${minutes}m before taking another test.`;
    } else if (testsRemainingToday === 0) {
      message = "You've reached the maximum number of tests for today.";
    } else if (testsRemainingThisWeek === 0) {
      message = "You've reached the maximum number of tests for this week.";
    } else if (hoursSinceLastTest < TEST_FREQUENCY.RECOMMENDED_DAYS_BETWEEN_TESTS * 24) {
      message = "You can take a test now, but waiting longer between tests provides more meaningful results.";
    }
    
    return {
      canTakeTest,
      cooldownRemaining,
      testsRemainingToday,
      testsRemainingThisWeek,
      nextRecommendedTestTime,
      lastTestTime,
      message
    };
  } catch (error) {
    console.error('Error checking test frequency:', error);
    return {
      canTakeTest: true,
      cooldownRemaining: 0,
      testsRemainingToday: TEST_FREQUENCY.MAX_TESTS_PER_DAY,
      testsRemainingThisWeek: TEST_FREQUENCY.MAX_TESTS_PER_WEEK,
      nextRecommendedTestTime: null,
      lastTestTime: null,
      message: "Error checking test frequency. You can take a test now."
    };
  }
}

/**
 * Handle multiple tests taken on the same day
 * 
 * This function determines how to process multiple test results from the same day:
 * - By default, we keep all tests but mark them as part of the same session
 * - We calculate a daily average that can be used for trend analysis
 */
export async function processDailyTests(
  userId: string, 
  date: Date
): Promise<{ success: boolean; averageResult?: TestResult; error?: string }> {
  try {
    const startDate = startOfDay(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    // Get all tests for the specified day
    const { data: testsForDay, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .lt('timestamp', endDate.toISOString());
    
    if (error) {
      console.error('Error fetching daily tests:', error);
      return { success: false, error: error.message };
    }
    
    // If no tests or only one test, no processing needed
    if (!testsForDay || testsForDay.length <= 1) {
      return { success: true };
    }
    
    // Calculate average scores
    const totalScore = testsForDay.reduce((sum, test) => sum + test.score, 0);
    const totalReactionTime = testsForDay.reduce((sum, test) => sum + test.reaction_time, 0);
    const totalAccuracy = testsForDay.reduce((sum, test) => sum + test.accuracy, 0);
    
    const averageResult: TestResult = {
      date: startDate.toISOString(),
      score: Math.round(totalScore / testsForDay.length),
      reactionTime: Math.round(totalReactionTime / testsForDay.length),
      accuracy: Math.round(totalAccuracy / testsForDay.length),
      test_type: testsForDay[0].test_type
    };
    
    return { success: true, averageResult };
  } catch (error) {
    console.error('Error processing daily tests:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
