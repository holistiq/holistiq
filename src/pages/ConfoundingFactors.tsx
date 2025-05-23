import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Moon,
  Activity,
  Coffee,
  Dumbbell,
  MapPin,
  Plus,
  Calendar,
  Thermometer,
  Smile,
  Battery,
  Volume2,
  Droplets,
  Wine
} from "lucide-react";
import { format } from "date-fns";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getConfoundingFactors, analyzeConfoundingFactors } from "@/services/confoundingFactorService";
import { ConfoundingFactor, FactorAnalysisResult } from "@/types/confoundingFactor";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ConfoundingFactors() {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [factors, setFactors] = useState<ConfoundingFactor[]>([]);
  const [analysis, setAnalysis] = useState<FactorAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const loadFactors = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await getConfoundingFactors(user.id);
      if (result.success) {
        setFactors(result.factors);
      } else {
        console.error("Error loading confounding factors:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error loading confounding factors:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFactors();
    }
  }, [user, loadFactors]);

  const runAnalysis = async () => {
    if (!user || factors.length < 5) return;

    setIsAnalyzing(true);
    try {
      // Use last 30 days for analysis
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const result = await analyzeConfoundingFactors(
        user.id,
        "n-back-2", // Default test type
        startDate,
        endDate
      );

      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        console.error("Error analyzing confounding factors:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error analyzing confounding factors:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFilteredFactors = () => {
    if (activeTab === "all") return factors;

    return factors.filter(factor => {
      switch (activeTab) {
        case "sleep":
          return factor.sleep_duration !== null || factor.sleep_quality !== null;
        case "stress":
          return factor.stress_level !== null;
        case "exercise":
          return factor.exercise_duration !== null || factor.exercise_intensity !== null;
        case "diet":
          return factor.caffeine_intake !== null || factor.alcohol_intake !== null ||
                 factor.water_intake !== null || (factor.meal_timing && factor.meal_timing.length > 0);
        case "environment":
          return factor.location !== null || factor.noise_level !== null || factor.temperature !== null;
        case "health":
          return factor.mood !== null || factor.energy_level !== null || factor.illness === true;
        default:
          return true;
      }
    });
  };

  const renderFactorDetail = (factor: ConfoundingFactor) => {
    return (
      <Card key={factor.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {format(new Date(factor.recorded_at), "EEEE, MMMM d, yyyy")}
            </CardTitle>
            <Badge variant="outline">
              {format(new Date(factor.recorded_at), "h:mm a")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sleep Section */}
            {(factor.sleep_duration !== null || factor.sleep_quality !== null) && (
              <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <Moon className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Sleep</p>
                  <div className="space-y-1 mt-1">
                    {factor.sleep_duration !== null && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        {Math.floor(factor.sleep_duration / 60)}h {factor.sleep_duration % 60}m
                      </p>
                    )}
                    {factor.sleep_quality !== null && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Quality:</span>{" "}
                        {factor.sleep_quality}/10
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stress Section */}
            {factor.stress_level !== null && (
              <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <Activity className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Stress</p>
                  <div className="space-y-1 mt-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Level:</span>{" "}
                      {factor.stress_level}/10
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Exercise Section */}
            {(factor.exercise_duration !== null || factor.exercise_intensity !== null) && (
              <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <Dumbbell className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Exercise</p>
                  <div className="space-y-1 mt-1">
                    {factor.exercise_type && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Type:</span>{" "}
                        {factor.exercise_type.charAt(0).toUpperCase() + factor.exercise_type.slice(1)}
                      </p>
                    )}
                    {factor.exercise_duration !== null && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Duration:</span>{" "}
                        {factor.exercise_duration} minutes
                      </p>
                    )}
                    {factor.exercise_intensity !== null && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Intensity:</span>{" "}
                        {factor.exercise_intensity}/10
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Diet Section */}
            {(factor.caffeine_intake !== null || factor.alcohol_intake !== null || factor.water_intake !== null) && (
              <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <Coffee className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Diet & Hydration</p>
                  <div className="space-y-1 mt-1">
                    {factor.caffeine_intake !== null && (
                      <div className="flex items-center gap-1">
                        <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{factor.caffeine_intake}mg caffeine</p>
                      </div>
                    )}
                    {factor.alcohol_intake !== null && (
                      <div className="flex items-center gap-1">
                        <Wine className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{factor.alcohol_intake} drinks</p>
                      </div>
                    )}
                    {factor.water_intake !== null && (
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{factor.water_intake}ml water</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Environment Section */}
            {(factor.location !== null || factor.noise_level !== null || factor.temperature !== null) && (
              <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Environment</p>
                  <div className="space-y-1 mt-1">
                    {factor.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{factor.location}</p>
                      </div>
                    )}
                    {factor.noise_level !== null && (
                      <div className="flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">Noise: {factor.noise_level}/10</p>
                      </div>
                    )}
                    {factor.temperature !== null && (
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{factor.temperature}°C</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Health Section */}
            {(factor.mood !== null || factor.energy_level !== null || factor.illness === true) && (
              <div className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg">
                <Smile className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Health & Mood</p>
                  <div className="space-y-1 mt-1">
                    {factor.mood !== null && (
                      <div className="flex items-center gap-1">
                        <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">Mood: {factor.mood}/10</p>
                      </div>
                    )}
                    {factor.energy_level !== null && (
                      <div className="flex items-center gap-1">
                        <Battery className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">Energy: {factor.energy_level}/10</p>
                      </div>
                    )}
                    {factor.illness === true && (
                      <div>
                        <Badge variant="destructive" className="mt-1">Illness</Badge>
                        {factor.illness_details && (
                          <p className="text-sm mt-1">{factor.illness_details}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {factor.notes && (
              <div className="md:col-span-2 p-3 bg-secondary/20 rounded-lg">
                <p className="font-medium text-sm mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{factor.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Confounding Factors</h1>
          <p className="text-muted-foreground mt-1">
            Track variables that might affect your cognitive performance
          </p>
        </div>
        <Link to="/log-confounding-factor">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log New Factors
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="sleep" className="flex items-center gap-1">
            <Moon className="h-4 w-4" />
            <span className="hidden md:inline">Sleep</span>
          </TabsTrigger>
          <TabsTrigger value="stress" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Stress</span>
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden md:inline">Exercise</span>
          </TabsTrigger>
          <TabsTrigger value="diet" className="flex items-center gap-1">
            <Coffee className="h-4 w-4" />
            <span className="hidden md:inline">Diet</span>
          </TabsTrigger>
          <TabsTrigger value="environment" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="hidden md:inline">Environment</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-1">
            <Smile className="h-4 w-4" />
            <span className="hidden md:inline">Health</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {getFilteredFactors().length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-lg">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No factors found</h2>
              <p className="text-muted-foreground mb-6">
                {activeTab === "all"
                  ? "You haven't logged any confounding factors yet."
                  : `You haven't logged any ${activeTab} factors yet.`}
              </p>
              <Link to="/log-confounding-factor">
                <Button>Log Your First Factors</Button>
              </Link>
            </div>
          ) : (
            <div>
              {getFilteredFactors().map(renderFactorDetail)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
