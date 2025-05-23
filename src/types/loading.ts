// Define loading states for the state machine
export type LoadingState =
  | 'idle'           // No loading in progress
  | 'initializing'   // First-time data loading
  | 'fetching_local' // Fetching from localStorage
  | 'fetching_remote' // Fetching from Supabase
  | 'processing'     // Processing fetched data
  | 'refreshing'     // Refreshing existing data
  | 'error'          // Error state
  | 'complete';      // Loading complete

// Define loading progress for user feedback
export interface LoadingProgress {
  stage: LoadingState;
  message: string;
  progress: number; // 0-100
  error?: string;
  startTime: number;
  elapsedTime: number;
}
