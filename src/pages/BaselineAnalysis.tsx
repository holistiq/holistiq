import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, ArrowLeft, LineChart, Calendar, Info } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/components/ui/use-toast";
import { BaselineCalibration } from '@/components/baseline/BaselineCalibration';
import { useTestResults } from '@/contexts/TestResultsContext';
import { UserBaseline } from '@/types/baseline';

export default function BaselineAnalysis() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { testHistory, isLoadingTests } = useTestResults();
  const [showInsufficientDataMessage, setShowInsufficientDataMessage] = useState(false);

  // Check if we have enough data for analysis
  useEffect(() => {
    if (!isLoadingTests) {
      setShowInsufficientDataMessage(testHistory.length < 2);
    }
  }, [testHistory, isLoadingTests]);

  // Handle baseline calculation completion
  const handleBaselineCalculated = (baseline: UserBaseline) => {
    toast({
      title: "Baseline Calculated",
      description: `Your cognitive baseline has been established with a confidence level of ${(baseline.confidenceLevel! * 100).toFixed(0)}%.`,
    });
  };

  // Handle navigation back to dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Handle taking a test
  const handleTakeTest = () => {
    navigate('/take-test');
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Baseline Analysis</h1>
        </div>
      </div>

      {isLoadingTests ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : showInsufficientDataMessage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Insufficient Data
            </CardTitle>
            <CardDescription>
              You need at least 2 cognitive tests to establish a baseline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-secondary/10 p-6 rounded-lg text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Take More Tests</h3>
              <p className="text-muted-foreground mb-4">
                Complete at least 2 cognitive tests to establish your baseline. More tests will provide a more accurate baseline.
              </p>
              <Button onClick={handleTakeTest}>Take Cognitive Test</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <BaselineCalibration onBaselineCalculated={handleBaselineCalculated} />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                About Baseline Calibration
              </CardTitle>
              <CardDescription>
                Understanding the importance of establishing an accurate cognitive baseline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">What is a Cognitive Baseline?</h3>
                <p className="text-muted-foreground">
                  A cognitive baseline is a reference point that represents your typical cognitive performance before starting any supplements. It serves as the foundation for measuring changes in your cognitive abilities over time.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Why is it Important?</h3>
                <p className="text-muted-foreground">
                  An accurate baseline allows you to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Measure the true impact of supplements on your cognitive performance</li>
                  <li>Distinguish between normal variations and supplement-induced changes</li>
                  <li>Make data-driven decisions about which supplements are effective for you</li>
                  <li>Track your cognitive performance over time with a reliable reference point</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">How to Establish a Good Baseline</h3>
                <p className="text-muted-foreground">
                  For the most accurate baseline:
                </p>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>Take at least 3-5 cognitive tests before starting any supplements</li>
                  <li>Maintain consistent testing conditions (time of day, environment, etc.)</li>
                  <li>Avoid testing when unusually tired, stressed, or under the influence of substances</li>
                  <li>Recalibrate your baseline periodically or when life circumstances change significantly</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
