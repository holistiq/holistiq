import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Zap } from "lucide-react";

/**
 * Component that prompts users to take a baseline test
 * Displayed when a user has no baseline test results
 */
export function BaselinePrompt() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Container with max-width and centered content */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Holistiq</CardTitle>
            <CardDescription className="text-lg">
              You need to establish your baseline before using the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  To get started, you'll need to take an initial cognitive
                  assessment to establish your baseline.
                </p>
                <p className="text-muted-foreground mt-1">
                  This will be used as the reference point for measuring changes
                  in your cognitive performance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  The baseline test takes about 5 minutes to complete.
                </p>
                <p className="text-muted-foreground mt-1">
                  Find a quiet place without distractions for the most accurate
                  results.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/tests" className="w-full">
              <Button size="lg" className="w-full gap-2">
                <Zap className="h-5 w-5" />
                Take Baseline Test
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
