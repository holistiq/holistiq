import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { NBackGrid } from "./NBackGrid";
import { calculateTestResults } from "@/utils/test/calculations";

// Helper function for development-only logging
const debugLog = (message: string) => {
  if (process.env.NODE_ENV === "development") {
    console.log(message);
  }
};

export interface NBackTestProps {
  nBackLevel: 2 | 3;
  testDuration: number; // in milliseconds
  onTestComplete: (results: NBackTestResult) => void;
  onCancel?: () => void;
}

export interface NBackTestResult {
  score: number;
  accuracy: number;
  reactionTime: number; // in milliseconds
  rawData: {
    stimuliSequence: number[];
    responses: {
      stimulusIndex: number;
      isTarget: boolean;
      responded: boolean;
      correct: boolean;
      reactionTime: number | null;
    }[];
    environmentalFactors: {
      windowSwitches: number;
      browserInfo: string;
      screenSize: string;
      deviceType: string;
    };
  };
}

interface Stimulus {
  position: number; // 0-8 for a 3x3 grid
  isTarget: boolean;
}

export function NBackTest({
  nBackLevel,
  testDuration,
  onTestComplete,
  onCancel,
}: Readonly<NBackTestProps>) {
  // Test state
  const [testState, setTestState] = useState<"ready" | "running" | "completed">(
    "ready",
  );
  const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(testDuration);
  const [countdownValue, setCountdownValue] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);

  // Test data
  const stimuliSequenceRef = useRef<number[]>([]);
  const responsesRef = useRef<
    {
      stimulusIndex: number;
      isTarget: boolean;
      responded: boolean;
      correct: boolean;
      reactionTime: number | null;
    }[]
  >([]);
  const currentStimulusIndexRef = useRef(0);
  const testStartTimeRef = useRef(0);
  const lastStimulusTimeRef = useRef(0);
  const windowSwitchesRef = useRef(0);

  // Animation frame and timing
  const animationFrameRef = useRef<number | null>(null);
  const testLoopRef = useRef<((timestamp: number) => void) | null>(null);
  const stimulusDuration = 500; // ms to show each stimulus
  const interStimulusInterval = 1500; // ms between stimuli (includes stimulusDuration)

  // Function to handle animation frame updates - defined outside of testLoop to avoid circular dependencies
  const handleAnimationFrame = useCallback(
    (timestamp: number) => {
      if (testState !== "running") {
        return;
      }

      const elapsedTime = timestamp - testStartTimeRef.current;

      // Update progress
      const newProgress = Math.min(100, (elapsedTime / testDuration) * 100);
      setProgress(newProgress);
      setTimeRemaining(Math.max(0, testDuration - elapsedTime));

      // Check if test is complete
      if (elapsedTime >= testDuration) {
        debugLog("Test duration reached, completing test");
        if (testLoopRef.current) {
          testLoopRef.current(timestamp);
        }
        return;
      }

      // Determine if we should show a new stimulus
      const stimulusIndex = Math.floor(elapsedTime / interStimulusInterval);

      // Force show a stimulus every 1.5 seconds
      const shouldShowStimulus =
        stimulusIndex !== currentStimulusIndexRef.current &&
        stimulusIndex < stimuliSequenceRef.current.length;

      if (shouldShowStimulus) {
        currentStimulusIndexRef.current = stimulusIndex;
        lastStimulusTimeRef.current = timestamp;

        // Show the new stimulus
        const position = stimuliSequenceRef.current[stimulusIndex];
        const isTarget =
          stimulusIndex >= nBackLevel &&
          position === stimuliSequenceRef.current[stimulusIndex - nBackLevel];

        // Directly update the state without setTimeout to ensure it happens
        setCurrentStimulus({ position, isTarget });

        // Schedule hiding the stimulus after stimulusDuration
        setTimeout(() => {
          if (testState === "running") {
            setCurrentStimulus(null);
          }
        }, stimulusDuration);
      }

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(handleAnimationFrame);
    },
    [
      testState,
      testDuration,
      nBackLevel,
      interStimulusInterval,
      stimulusDuration,
    ],
  );

  // Generate a sequence of stimuli positions
  const generateStimuliSequence = useCallback(() => {
    const sequence: number[] = [];
    const gridSize = 9; // 3x3 grid
    const sequenceLength =
      Math.ceil(testDuration / interStimulusInterval) + nBackLevel;

    // Generate initial n positions (these won't be targets since there's nothing to compare with yet)
    for (let i = 0; i < nBackLevel; i++) {
      sequence.push(Math.floor(Math.random() * gridSize));
    }

    // Generate the rest of the sequence with ~30% targets
    for (let i = nBackLevel; i < sequenceLength; i++) {
      const isTarget = Math.random() < 0.3;

      if (isTarget) {
        // Make this a target by using the same position as n steps back
        sequence.push(sequence[i - nBackLevel]);
      } else {
        // Generate a different position than n steps back
        let newPosition;
        do {
          newPosition = Math.floor(Math.random() * gridSize);
        } while (newPosition === sequence[i - nBackLevel]);

        sequence.push(newPosition);
      }
    }

    return sequence;
  }, [nBackLevel, testDuration]);

  // Handle user response
  const handleResponse = useCallback(() => {
    if (testState !== "running" || currentStimulusIndexRef.current < nBackLevel)
      return;

    const currentTime = performance.now();
    const currentIndex = currentStimulusIndexRef.current;
    const isTarget =
      stimuliSequenceRef.current[currentIndex] ===
      stimuliSequenceRef.current[currentIndex - nBackLevel];

    // Calculate reaction time
    const reactionTime = currentTime - lastStimulusTimeRef.current;

    // Only log in development mode
    if (process.env.NODE_ENV === "development") {
      console.log(
        `User response: index=${currentIndex}, isTarget=${isTarget}, reactionTime=${reactionTime}ms`,
      );
    }

    // Record response
    if (
      currentIndex - nBackLevel >= 0 &&
      currentIndex - nBackLevel < responsesRef.current.length
    ) {
      responsesRef.current[currentIndex - nBackLevel] = {
        stimulusIndex: currentIndex,
        isTarget,
        responded: true,
        correct: isTarget, // Correct if it's a target and user responded
        reactionTime,
      };
    } else if (process.env.NODE_ENV === "development") {
      console.warn(`Invalid response index: ${currentIndex - nBackLevel}`);
    }
  }, [nBackLevel, testState]);

  // Helper function to initialize test data - extracted to reduce nesting
  const initializeTestData = useCallback(() => {
    debugLog("Initializing test data...");

    // Generate stimulus sequence
    const sequence = generateStimuliSequence();
    stimuliSequenceRef.current = sequence;

    // Create responses array
    const responses = Array(sequence.length)
      .fill(null)
      .map((_, i) => {
        const isTarget =
          i >= nBackLevel && sequence[i] === sequence[i - nBackLevel];
        return {
          stimulusIndex: i,
          isTarget,
          responded: false,
          // Non-targets are correct by default (if not responded to)
          // Targets are incorrect by default (until responded to)
          correct: !isTarget,
          reactionTime: null,
        };
      });
    responsesRef.current = responses;

    // Reset state
    currentStimulusIndexRef.current = 0;
    const startTime = performance.now();
    testStartTimeRef.current = startTime;
    windowSwitchesRef.current = 0;

    debugLog(`Test starting at timestamp: ${startTime}`);

    // Start the test
    setTestState("running");

    // Start the animation frame with a slight delay to ensure state is updated
    setTimeout(() => {
      debugLog("Starting animation frame...");
      animationFrameRef.current = requestAnimationFrame(handleAnimationFrame);
    }, 50);
  }, [generateStimuliSequence, nBackLevel, handleAnimationFrame]);

  // Start the test
  const startTest = useCallback(() => {
    debugLog("Starting test...");

    // Show countdown first
    setShowCountdown(true);

    const countdownInterval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);

          // Initialize test data using the extracted function
          initializeTestData();

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [initializeTestData]);

  // Complete the test and calculate results
  const completeTest = useCallback(() => {
    debugLog("Completing test...");

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setTestState("completed");
    setCurrentStimulus(null);

    // Calculate environmental factors
    const environmentalFactors = {
      windowSwitches: windowSwitchesRef.current,
      browserInfo: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: /Mobi|Android/i.test(navigator.userAgent)
        ? "mobile"
        : "desktop",
    };

    try {
      // Calculate test results
      const results = calculateTestResults(
        nBackLevel,
        stimuliSequenceRef.current,
        responsesRef.current,
        environmentalFactors,
      );

      debugLog("Test results calculated successfully");

      // Call the onTestComplete callback with the results
      onTestComplete(results);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error calculating test results:", error);
      }

      // Provide fallback results in case of error
      const fallbackResults: NBackTestResult = {
        score: 50,
        accuracy: 50,
        reactionTime: 500,
        rawData: {
          stimuliSequence: stimuliSequenceRef.current,
          responses: responsesRef.current,
          environmentalFactors,
        },
      };

      onTestComplete(fallbackResults);
    }
  }, [nBackLevel, onTestComplete]);

  // Main test loop - now just handles test completion
  const testLoop = useCallback(
    (timestamp: number) => {
      debugLog(`Test loop called for completion: timestamp=${timestamp}`);
      completeTest();
    },
    [completeTest],
  );

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testState === "running") {
        windowSwitchesRef.current += 1;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [testState]);

  // Cleanup on unmount
  useEffect(() => {
    // Store active timeouts for cleanup
    const timeouts: number[] = [];

    // Override setTimeout to track timeouts
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function (callback, delay) {
      const id = originalSetTimeout(callback, delay);
      timeouts.push(id);
      return id;
    };

    return () => {
      // Cancel animation frame
      if (animationFrameRef.current) {
        console.log("Cleaning up animation frame");
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clear all timeouts
      timeouts.forEach((id) => {
        console.log(`Clearing timeout ${id}`);
        clearTimeout(id);
      });

      // Restore original setTimeout
      window.setTimeout = originalSetTimeout;
    };
  }, []);

  // Keep testLoopRef updated and ensure animation frame is running
  useEffect(() => {
    console.log("Updating testLoopRef");
    testLoopRef.current = testLoop;

    // If test is running but no animation frame is active, restart it
    if (testState === "running" && !animationFrameRef.current) {
      console.log("Restarting animation frame");
      animationFrameRef.current = requestAnimationFrame(handleAnimationFrame);
    }
  }, [testLoop, testState, handleAnimationFrame]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (testState === "running" && e.code === "Space") {
        e.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleResponse, testState]);

  return (
    <div className="flex flex-col items-center w-full">
      {testState === "ready" && (
        <div className="space-y-6 w-full">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium">{nBackLevel}-Back Test</h3>
                <p className="text-muted-foreground">
                  Press the spacebar when the current position matches the
                  position from {nBackLevel} steps earlier.
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <Button onClick={startTest}>Start Test</Button>
              </div>

              {onCancel && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showCountdown && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="text-6xl font-bold">{countdownValue}</div>
        </div>
      )}

      {testState === "running" && (
        <div className="space-y-4 w-full">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">
              Time remaining: {Math.ceil(timeRemaining / 1000)}s
            </div>
            <Progress value={progress} className="w-1/2" />
          </div>

          <div className="flex flex-col items-center justify-center py-8">
            <NBackGrid
              highlightedPosition={currentStimulus?.position}
              onClick={handleResponse}
            />

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Press spacebar when you see a match with {nBackLevel} positions
                ago
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="w-full max-w-xs"
                onClick={handleResponse}
              >
                Match
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
