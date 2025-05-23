/**
 * Re-export loading state hooks
 */
import { useLoadingStateContext } from '../contexts/LoadingStateContext/useLoadingStateContext';
import { useRegisterLoadingState } from '../contexts/LoadingStateContext/useRegisterLoadingState';
import { useTrackLoadingStates } from '../contexts/LoadingStateContext/useTrackLoadingStates';

export {
  useLoadingStateContext,
  useRegisterLoadingState,
  useTrackLoadingStates
};
