import { useContext } from 'react';
import { TestResultsContext } from './TestResultsContextDef';

export function useTestResults() {
  const context = useContext(TestResultsContext);
  if (context === undefined) {
    throw new Error('useTestResults must be used within a TestResultsProvider');
  }
  return context;
}
