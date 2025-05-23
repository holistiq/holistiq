/**
 * Reaction Time Test Component
 *
 * A simple test that measures user reaction time to visual stimuli
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { calculateReactionTestResults } from '@/utils/test/reaction-time';

export interface ReactionTimeTestProps {
  readonly testDuration: number; // in milliseconds
  readonly onTestComplete: (results: ReactionTimeTestResult) => void;
  readonly onCancel?: () => void;
}

export interface ReactionTimeTestResult {
  score: number;
  accuracy: number;
  reactionTime: number; // in milliseconds
  rawData: {
    trials: {
      reactionTime: number | null;
      correct: boolean;
      tooEarly: boolean;
    }[];
    environmentalFactors: {
      windowSwitches: number;
      browserInfo: string;
      screenSize: string;
      deviceType: string;
    };
  };
}

export function ReactionTimeTest({
  testDuration,
  onTestComplete,
  onCancel
}: Readonly<ReactionTimeTestProps>) {
  // Test state
  const [testState, setTestState] = useState<'ready' | 'waiting' | 'react' | 'feedback' | 'completed'>('ready');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(testDuration);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | null>(null);

  // Trial data
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);

  // Refs for timing
  const testStartTimeRef = useRef<number>(0);
  const stimulusStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const trialsRef = useRef<{
    reactionTime: number | null;
    correct: boolean;
    tooEarly: boolean;
  }[]>([]);
  const windowSwitchesRef = useRef<number>(0);

  // Constants
  const minWaitTime = 1500; // Minimum wait time in ms
  const maxWaitTime = 4000; // Maximum wait time in ms
  const stimulusDuration = 1500; // How long the stimulus stays visible if no response
  const feedbackDuration = 1000; // How long to show feedback
  const targetColor = 'rgb(139, 92, 246)'; // Primary color

  // Calculate total trials based on test duration
  useEffect(() => {
    // Aim for a trial every ~6 seconds on average
    const estimatedTrials = Math.max(5, Math.floor(testDuration / 6000));
    setTotalTrials(estimatedTrials);

    // Initialize trials array
    trialsRef.current = Array(estimatedTrials).fill(null).map(() => ({
      reactionTime: null,
      correct: false,
      tooEarly: false
    }));
  }, [testDuration]);

  // Track window focus/blur for environmental factors
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testState !== 'ready' && testState !== 'completed') {
        windowSwitchesRef.current += 1;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testState]);

  // Handle user response
  const handleResponse = useCallback(() => {
    if (testState !== 'react') {
      // If they clicked during waiting period
      if (testState === 'waiting') {
        // Record as too early
        trialsRef.current[currentTrial] = {
          reactionTime: null,
          correct: false,
          tooEarly: true
        };

        // Show feedback
        setFeedbackMessage('Too early! Wait for the color change.');
        setFeedbackType('error');
        setTestState('feedback');
      }
      return;
    }

    // Calculate reaction time
    const reactionTime = performance.now() - stimulusStartTimeRef.current;

    // Record trial data
    trialsRef.current[currentTrial] = {
      reactionTime,
      correct: true,
      tooEarly: false
    };

    // Show feedback
    setFeedbackMessage(`${Math.round(reactionTime)}ms`);
    setFeedbackType('success');
    setTestState('feedback');
  }, [testState, currentTrial]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        handleResponse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleResponse]);

  // Start the test
  const startTest = useCallback(() => {
    testStartTimeRef.current = performance.now();
    setTestState('waiting');
    setCurrentTrial(0);

    // Start the test loop
    animationFrameRef.current = requestAnimationFrame(testLoop);
  }, [testLoop]);

  // Main test loop
  const testLoop = useCallback((timestamp: number) => {
    const elapsedTime = timestamp - testStartTimeRef.current;

    // Update progress
    const newProgress = Math.min(100, (elapsedTime / testDuration) * 100);
    setProgress(newProgress);
    setTimeRemaining(Math.max(0, testDuration - elapsedTime));

    // Check if test is complete
    if (elapsedTime >= testDuration || currentTrial >= totalTrials) {
      completeTest();
      return;
    }

    // Continue the animation loop
    animationFrameRef.current = requestAnimationFrame(testLoop);
  }, [testDuration, currentTrial, totalTrials, completeTest]);

  // Handle the waiting state
  useEffect(() => {
    if (testState !== 'waiting') return;

    // Random wait time between min and max
    const waitTime = Math.random() * (maxWaitTime - minWaitTime) + minWaitTime;

    const waitTimer = setTimeout(() => {
      // Record the stimulus start time
      stimulusStartTimeRef.current = performance.now();
      setTestState('react');

      // Set a timeout for if they don't react
      const stimulusTimer = setTimeout(() => {
        if (testState === 'react') {
          // Record as missed
          trialsRef.current[currentTrial] = {
            reactionTime: null,
            correct: false,
            tooEarly: false
          };

          // Show feedback
          setFeedbackMessage('Too slow! Try to react faster.');
          setFeedbackType('warning');
          setTestState('feedback');
        }
      }, stimulusDuration);

      return () => clearTimeout(stimulusTimer);
    }, waitTime);

    return () => clearTimeout(waitTimer);
  }, [testState, currentTrial]);

  // Handle the feedback state
  useEffect(() => {
    if (testState !== 'feedback') return;

    const feedbackTimer = setTimeout(() => {
      // Move to next trial
      if (currentTrial < totalTrials - 1) {
        setCurrentTrial(prev => prev + 1);
        setTestState('waiting');
      } else {
        completeTest();
      }
    }, feedbackDuration);

    return () => clearTimeout(feedbackTimer);
  }, [testState, currentTrial, totalTrials, completeTest]);

  // Helper function to get feedback color class
  const getFeedbackColorClass = (type: 'success' | 'error' | 'warning' | null): string => {
    if (type === 'success') return 'text-green-500';
    if (type === 'error') return 'text-red-500';
    return 'text-amber-500';
  };

  // Complete the test
  const completeTest = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setTestState('completed');

    // Calculate environmental factors
    const environmentalFactors = {
      windowSwitches: windowSwitchesRef.current,
      browserInfo: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };

    // Calculate test results
    const results = calculateReactionTestResults(
      trialsRef.current,
      environmentalFactors
    );

    // Call the onTestComplete callback
    onTestComplete(results);
  }, [onTestComplete]);

  // Render the test UI based on current state
  return (
    <div className="flex flex-col items-center w-full">
      {/* Progress bar */}
      {testState !== 'ready' && testState !== 'completed' && (
        <div className="w-full mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">
              Time remaining: {Math.ceil(timeRemaining / 1000)}s
            </div>
            <div className="text-sm font-medium">
              Trial {currentTrial + 1} of {totalTrials}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Test content */}
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {testState === 'ready' && (
            <div className="flex flex-col items-center gap-6">
              <p className="text-center">
                Click the button or press spacebar when the color changes to purple.
              </p>
              <Button onClick={startTest} size="lg">
                Start Test
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          )}

          {(testState === 'waiting' || testState === 'react') && (
            <div className="flex flex-col items-center py-12">
              <motion.div
                className="w-40 h-40 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: testState === 'react' ? targetColor : 'rgb(255, 255, 255)',
                  border: '2px solid #e2e8f0' // Light gray border color
                }}
                animate={{
                  scale: testState === 'react' ? 1.1 : 1,
                  backgroundColor: testState === 'react' ? targetColor : 'rgb(255, 255, 255)'
                }}
                transition={{ duration: 0.2 }}
                onClick={handleResponse}
              >
                <span className="text-lg font-medium">
                  {testState === 'waiting' ? 'Wait...' : 'Click Now!'}
                </span>
              </motion.div>
            </div>
          )}

          {testState === 'feedback' && (
            <div className="flex flex-col items-center py-12">
              <div
                className={`text-2xl font-bold ${getFeedbackColorClass(feedbackType)}`}
              >
                {feedbackMessage}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
