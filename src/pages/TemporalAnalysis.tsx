import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Calendar,
  LineChart,
  Pill,
  ArrowLeft,
  Calculator,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/components/ui/use-toast";
import { CorrelationAnalysis } from "@/components/analysis/CorrelationAnalysis";
import { getTestResults } from "@/services/testResultService";
import { getSupplements } from "@/services/supplementService";
import { TestResult } from "@/lib/testResultUtils";
import { Supplement } from "@/types/supplement";

export default function TemporalAnalysis() {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      // Don't redirect immediately, let the auth system handle it
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // Load test results
        const testResultsResponse = await getTestResults(user.id);
        if (testResultsResponse.success && testResultsResponse.data) {
          const formattedResults = testResultsResponse.data.map((result) => ({
            date: result.timestamp,
            score: result.score,
            reactionTime: result.reaction_time,
            accuracy: result.accuracy,
          }));
          setTestResults(formattedResults);
        }

        // Load supplements
        const supplementsResponse = await getSupplements(user.id);
        if (supplementsResponse.success) {
          setSupplements(supplementsResponse.supplements);
        }

        // Check if we have enough data for analysis
        const hasTests =
          testResultsResponse.success &&
          testResultsResponse.data &&
          testResultsResponse.data.length >= 3;

        const hasSupplements =
          supplementsResponse.success &&
          supplementsResponse.supplements.length > 0;

        setHasEnoughData(hasTests && hasSupplements);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // Determine what content to render based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      );
    }

    if (!user) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription className="text-lg">
              Please log in to access the temporal analysis features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  The Temporal Analysis Engine requires authentication to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>Access your personal test results</li>
                  <li>Analyze your supplement intake data</li>
                  <li>Store correlation results securely</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/signin")} className="flex-1">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!hasEnoughData) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Insufficient Data</CardTitle>
            <CardDescription className="text-lg">
              You need more data before using the temporal analysis features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  To use the temporal analysis engine, you need:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>
                    At least 3 cognitive test results{" "}
                    {testResults.length >= 3 ? "✓" : "✗"}
                  </li>
                  <li>
                    At least 1 logged supplement{" "}
                    {supplements.length > 0 ? "✓" : "✗"}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/take-test")} className="flex-1">
                <Brain className="mr-2 h-4 w-4" />
                Take Cognitive Test
              </Button>
              <Button
                onClick={() => navigate("/log-supplement")}
                className="flex-1"
              >
                <Pill className="mr-2 h-4 w-4" />
                Log Supplement
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // User is authenticated and has enough data
    return (
      <div className="space-y-6">
        <Tabs defaultValue="correlation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="correlation">
              <Brain className="mr-2 h-4 w-4" />
              Correlation Analysis
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="mr-2 h-4 w-4" />
              Timeline View
            </TabsTrigger>
            <TabsTrigger value="trends">
              <LineChart className="mr-2 h-4 w-4" />
              Performance Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="correlation" className="space-y-6 mt-6">
            <CorrelationAnalysis userId={user!.id} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Supplement and Test Timeline
                </CardTitle>
                <CardDescription>
                  Visualize your supplement intake and test results over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 bg-secondary/10 rounded-lg">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    Timeline View Coming Soon
                  </h3>
                  <p className="text-muted-foreground">
                    This feature is under development and will be available
                    soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Track your cognitive performance trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 bg-secondary/10 rounded-lg">
                  <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    Trends View Coming Soon
                  </h3>
                  <p className="text-muted-foreground">
                    This feature is under development and will be available
                    soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              About Temporal Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                The Temporal Analysis Engine helps you understand how
                supplements affect your cognitive performance over time. It
                accounts for onset delays (how long it takes for a supplement to
                start working) and cumulative effects (how effects build up with
                consistent use).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-secondary/10 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How It Works</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Takes your supplement intake data and test results</li>
                    <li>
                      Analyzes performance before and after supplement use
                    </li>
                    <li>Accounts for onset delays and cumulative effects</li>
                    <li>Calculates statistical significance of changes</li>
                    <li>Provides insights on which supplements are working</li>
                  </ul>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/statistical-significance")}
                      className="w-full"
                    >
                      <Calculator className="mr-2 h-4 w-4" />
                      Statistical Significance Calculator
                    </Button>
                  </div>
                </div>

                <div className="bg-secondary/10 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Best Practices</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Take cognitive tests regularly (at least weekly)</li>
                    <li>Log all supplement intake consistently</li>
                    <li>Try to take tests at similar times of day</li>
                    <li>Introduce new supplements one at a time</li>
                    <li>Allow sufficient time to observe effects</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Temporal Analysis
          </h1>
          <p className="text-muted-foreground">
            Analyze how supplements affect your cognitive performance over time
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}
