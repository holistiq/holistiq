import { getAnalytics, calculateAnalytics, convertAnalyticsToStatisticalAnalyses } from '../services/analyticsService';
import { getStatisticalAnalyses } from '../services/statisticalSignificanceService';
import { ContextType } from '../types/statisticalSignificance';

/**
 * Test script for the analytics service
 * This script tests the integration between the analytics service and the statistical significance service
 */
async function testAnalyticsService() {
  try {
    // Replace with a valid user ID for testing
    const userId = 'test-user-id';
    
    // Test calculating analytics
    console.log('Testing calculateAnalytics...');
    const analyticsResult = await calculateAnalytics(userId, {
      testType: 'n-back-2',
      periodStart: '2025-01-01T00:00:00Z',
      periodEnd: '2025-12-31T23:59:59Z'
    });
    
    console.log('calculateAnalytics result:', analyticsResult);
    
    // Test getting analytics
    console.log('\nTesting getAnalytics...');
    const getAnalyticsResult = await getAnalytics(userId);
    
    console.log('getAnalytics result:', getAnalyticsResult);
    
    if (getAnalyticsResult.success && getAnalyticsResult.data.length > 0) {
      // Test converting analytics to statistical analyses
      console.log('\nTesting convertAnalyticsToStatisticalAnalyses...');
      const convertResult = await convertAnalyticsToStatisticalAnalyses(
        getAnalyticsResult.data,
        ContextType.GENERAL
      );
      
      console.log('convertAnalyticsToStatisticalAnalyses result:', convertResult);
    }
    
    // Test getting statistical analyses (should now use analytics data as fallback)
    console.log('\nTesting getStatisticalAnalyses...');
    const statisticalAnalysesResult = await getStatisticalAnalyses(userId);
    
    console.log('getStatisticalAnalyses result:', statisticalAnalysesResult);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error testing analytics service:', error);
  }
}

// Run the test
testAnalyticsService();
