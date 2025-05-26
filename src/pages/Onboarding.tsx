import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const navigate = useNavigate();

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      navigate("/baseline-test");
    }
  };

  return (
    <div className="container max-w-md py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle>Get Started with NooTrack</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
          <CardDescription className="pt-4">
            {step === 1 && "Welcome to NooTrack! Let's set up your account."}
            {step === 2 && "Learn how cognitive testing works."}
            {step === 3 && "Almost done! A few final tips before you start."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Welcome to NooTrack</h3>
              <p>
                Here's how NooTrack helps you track the effectiveness of your
                cognitive supplements:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Establish your cognitive baseline with a standardized
                  assessment
                </li>
                <li>Track your supplement intake</li>
                <li>Take follow-up assessments</li>
                <li>View changes in your performance over time</li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">About the N-Back Test</h3>
              <p>
                The N-Back test is a scientifically validated assessment of
                working memory. Here's how it works:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  You'll see a sequence of squares appearing on the screen
                </li>
                <li>
                  You need to press a button when the current position matches
                  the position from N steps earlier
                </li>
                <li>
                  For this test, we'll use a 2-back version, meaning you need to
                  remember positions from 2 steps back
                </li>
                <li>The test takes about 5 minutes to complete</li>
              </ul>
              <p className="text-muted-foreground text-sm">
                For best results, take the test in a quiet environment with
                minimal distractions.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Tips for Accurate Results</h3>
              <p>
                To get the most reliable measurements of your cognitive
                performance:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Test at consistent times of day (ideally same time each day)
                </li>
                <li>Take tests in a quiet, distraction-free environment</li>
                <li>Use the same device for all your tests</li>
                <li>Track your supplement intake accurately</li>
                <li>Take tests regularly to build up your data</li>
              </ul>
              <p>
                Your next step is to take your first baseline assessment. This
                will establish your starting point.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={nextStep} className="w-full">
            {step < totalSteps ? "Continue" : "Start Baseline Test"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
