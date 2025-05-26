/**
 * Reaction Time Test Instructions Component
 *
 * Displays instructions for the reaction time test
 */
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MousePointer, Zap } from "lucide-react";

interface ReactionTimeInstructionsProps {
  readonly onReady: () => void;
  readonly onCancel?: () => void;
}

export function ReactionTimeInstructions({
  onReady,
  onCancel,
}: Readonly<ReactionTimeInstructionsProps>) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Reaction Time Test Instructions
        </CardTitle>
        <CardDescription>
          This test measures how quickly you can respond to visual stimuli.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            How it works:
          </h3>

          <div className="space-y-2">
            <p>
              You'll see a circle on the screen. When the circle changes from
              gray to purple, click it as quickly as possible.
            </p>

            <div className="bg-secondary/30 p-4 rounded-md space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-background border-2 border-border rounded-full h-8 w-8 flex-shrink-0 mt-1"></div>
                <div>
                  <p className="font-medium">Wait for the color change</p>
                  <p className="text-sm text-muted-foreground">
                    When you see this gray circle, wait patiently. Don't click
                    yet!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary rounded-full h-8 w-8 flex-shrink-0 mt-1"></div>
                <div>
                  <p className="font-medium">Click as fast as you can</p>
                  <p className="text-sm text-muted-foreground">
                    As soon as the circle turns purple, click it immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <MousePointer className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Mouse or keyboard</p>
                  <p className="text-sm text-muted-foreground">
                    You can click with your mouse or press the spacebar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-md space-y-2">
          <h3 className="font-medium">Tips for best results:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Find a quiet place where you won't be interrupted</li>
            <li>Keep your finger ready on the mouse or spacebar</li>
            <li>Don't click too early - wait for the color change</li>
            <li>Try to maintain consistent focus throughout the test</li>
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={onReady} className={onCancel ? "" : "w-full"}>
          I'm Ready
        </Button>
      </CardFooter>
    </Card>
  );
}
