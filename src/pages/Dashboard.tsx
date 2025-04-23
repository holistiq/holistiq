
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Note: @/ alias requires Vite/TS config.
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart, Plus } from "lucide-react";

// For a real app, this would be fetched from an API
const mockTestData = [
  { date: "2023-04-20", score: 78, reactionTime: 532, accuracy: 85 },
  { date: "2023-04-22", score: 80, reactionTime: 520, accuracy: 87 },
  { date: "2023-04-25", score: 83, reactionTime: 510, accuracy: 88 },
  { date: "2023-04-28", score: 82, reactionTime: 515, accuracy: 86 },
];

const mockSupplements = [
  { id: 1, name: "Alpha GPC", dosage: "300mg", lastTaken: "2023-04-28", notes: "Morning dose" },
];

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";

interface TestResult {
  date: string;
  score: number;
  reactionTime: number;
  accuracy: number;
}

export default function Dashboard() {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [baselineResult, setBaselineResult] = useState<TestResult | null>(null);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);
  const [supplements, setSupplements] = useState<any[]>(mockSupplements);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Load baseline result from localStorage (in a real app, would fetch from API)
    const storedBaselineResult = localStorage.getItem("baselineResult");
    let parsedBaseline: TestResult | null = null;
    if (storedBaselineResult) {
      try {
        parsedBaseline = JSON.parse(storedBaselineResult);
      } catch {
        parsedBaseline = null;
      }
    }
    setBaselineResult(parsedBaseline);

    // Load all test results (including baseline and user tests)
    const storedTestResults = localStorage.getItem("testResults");
    let testResults: TestResult[] = [];
    if (storedTestResults) {
      try {
        testResults = JSON.parse(storedTestResults);
      } catch {
        testResults = [];
      }
    }
    // If no user test results, show baseline + mock. If user has results, show baseline + user.
    let allTests: TestResult[] = [];
    if (parsedBaseline) {
      if (testResults.length > 0) {
        allTests = [parsedBaseline, ...testResults];
      } else {
        allTests = [parsedBaseline, ...mockTestData];
      }
    }
    setTestHistory(allTests);
    // Pick latest by date
    if (allTests.length > 0) {
      const sorted = [...allTests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setLatestResult(sorted[sorted.length - 1]);
    } else {
      setLatestResult(null);
    }
  }, [location.pathname]);

  // Calculate percentage change from baseline
  const calculateChange = (current: number, baseline: number) => {
    if (typeof baseline !== "number" || baseline === 0 || isNaN(baseline)) return 0;
    return ((current - baseline) / baseline) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!baselineResult) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to NooTrack</CardTitle>
            <CardDescription>
              You need to establish your baseline before using the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              To get started, you'll need to take an initial cognitive assessment to establish your baseline.
              This will be used as the reference point for measuring changes in your cognitive performance.
            </p>
          </CardContent>
          <CardFooter>
            <Link to="/baseline-test">
              <Button>Take Baseline Test</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/take-test">
              <Button>
                Take Test
              </Button>
            </Link>
            <Link to="/log-supplement">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Log Supplement
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Score Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">
                  {latestResult && (
                    <>
                      {calculateChange(latestResult.score, baselineResult.score).toFixed(1)}%
                      <span className={calculateChange(latestResult.score, baselineResult.score) >= 0 ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1"}>
                        {calculateChange(latestResult.score, baselineResult.score) >= 0 ? "↑" : "↓"}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">vs. baseline</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reaction Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">
                  {latestResult && baselineResult && (
                    <>
                      {(() => {
                        const change = calculateChange(baselineResult.reactionTime, latestResult.reactionTime);
                        const iconUp = change > 0; // More ms is slower
                        const color = iconUp ? "text-red-500 text-sm ml-1" : "text-green-500 text-sm ml-1";
                        return (
                          <>
                            {Math.abs(change).toFixed(1)}%
                            <span className={color}>{iconUp ? "↑" : "↓"}</span>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">ms faster</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold">
                  {latestResult && (
                    <>
                      {calculateChange(latestResult.accuracy, baselineResult.accuracy).toFixed(1)}%
                      <span className={calculateChange(latestResult.accuracy, baselineResult.accuracy) >= 0 ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1"}>
                        {calculateChange(latestResult.accuracy, baselineResult.accuracy) >= 0 ? "↑" : "↓"}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">vs. baseline</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">
              <BarChart className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="supplements">
              <Calendar className="h-4 w-4 mr-2" />
              Supplements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cognitive Performance</CardTitle>
                <CardDescription>
                  Your performance trend compared to baseline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    {/* In a real app, this would be a chart component */}
                    <p>Performance chart will be displayed here</p>
                    <p className="text-sm">Showing data from {testHistory.length} tests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Test History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {testHistory.map((test, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">
                          {index === 0 ? "Baseline Test" : `Test ${index}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.date || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Score: {test.score}</p>
                        <p className="text-sm text-muted-foreground">
                          RT: {test.reactionTime}ms | Acc: {test.accuracy}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="supplements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supplements</CardTitle>
                <CardDescription>
                  Track your supplement intake
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplements.length > 0 ? (
                  <div className="space-y-4">
                    {supplements.map((supplement) => (
                      <div key={supplement.id} className="flex justify-between items-center border-b pb-4">
                        <div>
                          <p className="font-medium">{supplement.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplement.dosage} · Last taken: {new Date(supplement.lastTaken).toLocaleDateString()}
                          </p>
                          {supplement.notes && (
                            <p className="text-sm mt-1">{supplement.notes}</p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">Log</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No supplements tracked yet</p>
                    <Link to="/log-supplement">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplement
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Intake Calendar</CardTitle>
                <CardDescription>
                  Your supplement intake over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    {/* In a real app, this would be a calendar component */}
                    <p>Supplement intake calendar will be displayed here</p>
                    <p className="text-sm">Tracking intake for {supplements.length} supplements</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
