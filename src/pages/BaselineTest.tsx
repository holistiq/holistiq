
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialogTitle, AlertDialogDescription, AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export default function BaselineTest() {
  const [testState, setTestState] = useState<"intro" | "ready" | "running" | "completed">("intro");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const navigate = useNavigate();
  
  const startTest = () => {
    setTestState("running");
    
    // Simulate test running for demo purposes
    // In a real implementation, this would run the actual n-back test
    setTimeout(() => {
      setTestState("completed");
      
      // Save baseline result to localStorage for the demo
      // In a real app, this would be saved to a database
      const baselineResult = {
        date: new Date().toISOString(),
        score: 78,
        reactionTime: 532,
        accuracy: 85,
      };
      
      localStorage.setItem("baselineResult", JSON.stringify(baselineResult));
    }, 10000); // Simulating a 10-second test for demo
  };

  const handleFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen()
        .then(() => {
          setShowFullScreen(false);
          setTestState("ready");
        })
        .catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
          // Allow proceeding anyway
          setTestState("ready");
        });
    } else {
      // Fullscreen not supported, proceed anyway
      setTestState("ready");
    }
  };
  
  const exitFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting full-screen mode:", err);
      });
    }
  };
  
  useEffect(() => {
    // Clean up fullscreen when component unmounts
    return () => {
      if (document.fullscreenElement) {
        exitFullScreen();
      }
    };
  }, []);
  
  const goToDashboard = () => {
    if (document.fullscreenElement) {
      exitFullScreen();
    }
    navigate("/dashboard");
  };

  return (
    <div className="container max-w-2xl py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Baseline Cognitive Assessment</CardTitle>
          <CardDescription>
            {testState === "intro" && "Establish your cognitive baseline with our n-back test."}
            {testState === "ready" && "Get ready to start the test."}
            {testState === "running" && "Test in progress..."}
            {testState === "completed" && "Baseline assessment completed!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testState === "intro" && (
            <div className="space-y-4">
              <p>
                This test will establish your baseline cognitive performance. You'll need about 5 minutes in a quiet,
                distraction-free environment.
              </p>
              <div className="bg-secondary p-4 rounded-md space-y-2">
                <h3 className="font-medium">Before you begin:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Find a quiet place where you won't be interrupted</li>
                  <li>Turn off notifications on your device</li>
                  <li>The test works best in fullscreen mode</li>
                  <li>You'll need to focus for about 5 minutes</li>
                </ul>
              </div>
              <Button onClick={() => setShowFullScreen(true)} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {testState === "ready" && (
            <div className="space-y-4">
              <div className="border p-6 rounded-md bg-secondary/30">
                <h3 className="text-lg font-medium mb-4 text-center">2-Back Test Instructions</h3>
                <div className="space-y-4">
                  <p>
                    You'll see squares appearing on a grid one at a time. Your task is to identify when the
                    <strong> current position matches the position from 2 steps earlier</strong>.
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square border ${i === 4 ? 'bg-primary' : ''} rounded`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Example: If squares appear at positions 1, 4, and then 1 again, you would respond to the
                    third square (since it matches the position from 2 steps earlier).
                  </p>
                </div>
              </div>
              <Button onClick={startTest} className="w-full">
                Start Test
              </Button>
            </div>
          )}

          {testState === "running" && (
            <div className="text-center p-8 space-y-6">
              <div className="animate-pulse">
                <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square border ${i === 2 ? 'bg-primary' : ''} rounded`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-lg">Focus on the pattern...</p>
              <p className="text-sm text-muted-foreground">
                Press the spacebar when the current position matches the position from 2 steps ago.
              </p>
            </div>
          )}

          {testState === "completed" && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-6 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Baseline Established!</h3>
                <p className="text-muted-foreground mt-2">
                  Your cognitive baseline has been recorded. You can now track your supplement intake
                  and take follow-up tests to measure changes.
                </p>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-md space-y-4">
                <h4 className="font-medium">Your Baseline Results:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-2xl font-bold">78</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold">85%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Reaction Time</p>
                    <p className="text-2xl font-bold">532ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Test Date</p>
                    <p className="text-lg font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        {testState === "completed" && (
          <CardFooter>
            <Button onClick={goToDashboard} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>
      
      <AlertDialog open={showFullScreen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Fullscreen Mode</AlertDialogTitle>
            <AlertDialogDescription>
              For the best testing experience, we recommend running the test in fullscreen mode.
              This helps minimize distractions and ensures accurate results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowFullScreen(false);
              setTestState("ready");
            }}>
              Skip
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFullScreen}>
              Enter Fullscreen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
