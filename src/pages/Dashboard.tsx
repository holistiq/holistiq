
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  BarChart, 
  Plus, 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle,
  Pill,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  User
} from "lucide-react";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  date: string;
  score: number;
  reactionTime: number;
  accuracy: number;
}

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  intake_time: string;
  notes: string | null;
  color?: string;
}

export default function Dashboard() {
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [baselineResult, setBaselineResult] = useState<TestResult | null>(null);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [recentSupplements, setRecentSupplements] = useState<Supplement[]>([]);
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(true);
  const [isLoadingTests, setIsLoadingTests] = useState(true);

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
    
    // If user has baseline, set test history
    let allTests: TestResult[] = [];
    if (parsedBaseline) {
      if (testResults.length > 0) {
        allTests = [parsedBaseline, ...testResults];
      } else {
        allTests = [parsedBaseline];
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
    
    setIsLoadingTests(false);
    
    // Load real supplements data from Supabase
    const fetchSupplements = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('supplements')
          .select('*')
          .eq('user_id', user.id)
          .order('intake_time', { ascending: false });
          
        if (error) throw error;
        
        // Generate colors for supplements (in a real app, these would be stored in the database)
        const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const supplementsWithColors = data.map((supplement, index) => ({
          ...supplement,
          color: colors[index % colors.length]
        }));
        
        setSupplements(supplementsWithColors);
        setRecentSupplements(supplementsWithColors.slice(0, 3));
      } catch (error) {
        console.error('Error fetching supplements:', error);
      } finally {
        setIsLoadingSupplements(false);
      }
    };
    
    fetchSupplements();
    
  }, [location.pathname, user]);

  // Calculate percentage change from baseline
  const calculateChange = (current: number, baseline: number) => {
    if (typeof baseline !== "number" || baseline === 0 || isNaN(baseline)) return 0;
    return ((current - baseline) / baseline) * 100;
  };

  // Helper function to determine if a change is positive (improvement)
  const isPositiveChange = (metric: string, change: number) => {
    // For reaction time, lower is better (negative change is good)
    if (metric === 'reactionTime') return change < 0;
    // For other metrics, higher is better (positive change is good)
    return change > 0;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Brain className="h-12 w-12 text-primary animate-pulse" />
          <div className="text-lg font-semibold">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!baselineResult) {
    return (
      <div className="container py-12">
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
                  To get started, you'll need to take an initial cognitive assessment to establish your baseline.
                </p>
                <p className="text-muted-foreground mt-1">
                  This will be used as the reference point for measuring changes in your cognitive performance.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">The baseline test takes about 5 minutes to complete.</p>
                <p className="text-muted-foreground mt-1">
                  Find a quiet place without distractions for the most accurate results.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/baseline-test" className="w-full">
              <Button size="lg" className="w-full gap-2">
                <Zap className="h-5 w-5" />
                Take Baseline Test
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <Link to="/take-test">
              <Button className="gap-2">
                <Brain className="h-4 w-4" />
                Take Test
              </Button>
            </Link>
            <Link to="/log-supplement">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Log Supplement
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Actions Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">Track your progress and supplements</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/take-test">
                  <Button size="sm" variant="secondary" className="gap-1">
                    <Brain className="h-3.5 w-3.5" />
                    Take Test
                  </Button>
                </Link>
                <Link to="/log-supplement">
                  <Button size="sm" variant="secondary" className="gap-1">
                    <Pill className="h-3.5 w-3.5" />
                    Log Supplement
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button size="sm" variant="secondary" className="gap-1">
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TooltipProvider>
            {/* Score Change Card */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="overflow-hidden">
                  <div className={`h-1 w-full ${latestResult && calculateChange(latestResult.score, baselineResult.score) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Overall Score
                      </CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTests ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold">
                          {latestResult && (
                            <>
                              {calculateChange(latestResult.score, baselineResult.score).toFixed(1)}%
                              <span className={calculateChange(latestResult.score, baselineResult.score) >= 0 ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1"}>
                                {calculateChange(latestResult.score, baselineResult.score) >= 0 ? (
                                  <TrendingUp className="h-4 w-4 inline" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 inline" />
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">vs. baseline</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Overall cognitive performance score compared to your baseline.</p>
                <p className="text-xs text-muted-foreground mt-1">Higher is better.</p>
              </TooltipContent>
            </Tooltip>

            {/* Reaction Time Card */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="overflow-hidden">
                  <div className={`h-1 w-full ${latestResult && baselineResult && calculateChange(baselineResult.reactionTime, latestResult.reactionTime) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Reaction Time
                      </CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTests ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold">
                          {latestResult && baselineResult && (
                            <>
                              {(() => {
                                const change = calculateChange(baselineResult.reactionTime, latestResult.reactionTime);
                                const iconUp = change > 0; // More ms is slower
                                const color = iconUp ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1";
                                return (
                                  <>
                                    {Math.abs(change).toFixed(1)}%
                                    <span className={color}>
                                      {iconUp ? (
                                        <TrendingDown className="h-4 w-4 inline" />
                                      ) : (
                                        <TrendingUp className="h-4 w-4 inline" />
                                      )}
                                    </span>
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">faster</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>How quickly you respond to stimuli compared to your baseline.</p>
                <p className="text-xs text-muted-foreground mt-1">Lower reaction time is better.</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Accuracy Card */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="overflow-hidden">
                  <div className={`h-1 w-full ${latestResult && calculateChange(latestResult.accuracy, baselineResult.accuracy) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        Accuracy
                      </CardTitle>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTests ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <div className="text-3xl font-bold">
                          {latestResult && (
                            <>
                              {calculateChange(latestResult.accuracy, baselineResult.accuracy).toFixed(1)}%
                              <span className={calculateChange(latestResult.accuracy, baselineResult.accuracy) >= 0 ? "text-green-500 text-sm ml-1" : "text-red-500 text-sm ml-1"}>
                                {calculateChange(latestResult.accuracy, baselineResult.accuracy) >= 0 ? (
                                  <TrendingUp className="h-4 w-4 inline" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 inline" />
                                )}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">vs. baseline</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>How accurately you respond to test stimuli compared to your baseline.</p>
                <p className="text-xs text-muted-foreground mt-1">Higher accuracy is better.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Recent Supplements Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Recent Supplements
              </CardTitle>
              <Link to="/log-supplement">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSupplements ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentSupplements.length > 0 ? (
              <div className="space-y-3">
                {recentSupplements.map((supplement) => (
                  <div key={supplement.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${supplement.color}20`, color: supplement.color }}>
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{supplement.name}</p>
                        <p className="text-sm text-muted-foreground">{supplement.dosage} · {formatDate(supplement.intake_time)}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{supplement.notes}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium">No supplements logged yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start tracking your supplements to see them here</p>
                  <Link to="/log-supplement">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Log Supplement
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                            {supplement.dosage} · Last taken: {new Date(supplement.intake_time).toLocaleDateString()}
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
