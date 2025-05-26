import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  Clock,
  Target,
  Eye,
  Calendar,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  getPublicShareData,
  PublicShareData,
  isValidShareToken,
} from "@/services/publicShareService";
import { formatDistanceToNow } from "date-fns";

/**
 * Page for viewing publicly shared test results
 */
export default function SharedTestResult() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [shareData, setShareData] = useState<PublicShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShareData = async () => {
      if (!shareToken) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      // Validate token format
      if (!isValidShareToken(shareToken)) {
        setError("Invalid share token format");
        setLoading(false);
        return;
      }

      try {
        const response = await getPublicShareData(shareToken);

        if (response.success && response.data) {
          setShareData(response.data);
        } else {
          setError(response.error || "Failed to load shared test result");
        }
      } catch (err) {
        console.error("Error loading share data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadShareData();
  }, [shareToken]);

  // Format test type for display
  const formatTestType = (testType: string): string => {
    switch (testType) {
      case "n-back-2":
        return "N-Back Test";
      case "reaction-time":
        return "Reaction Time Test";
      default:
        return testType
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  // Get performance indicator
  const getPerformanceIndicator = (score: number, testType: string) => {
    // These are rough benchmarks - in a real app you'd have more sophisticated scoring
    let threshold = 70; // Default threshold

    if (testType === "reaction-time") {
      threshold = 300; // Lower is better for reaction time
      return score <= threshold
        ? "excellent"
        : score <= 400
          ? "good"
          : "average";
    }

    // For other tests, higher is better
    return score >= threshold ? "excellent" : score >= 50 ? "good" : "average";
  };

  const getPerformanceColor = (indicator: string) => {
    switch (indicator) {
      case "excellent":
        return "text-green-600 bg-green-50";
      case "good":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-orange-600 bg-orange-50";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground mb-4">
            This shared test result may have expired, been revoked, or doesn't
            exist.
          </p>
          <Button asChild>
            <Link to="/">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit HolistiQ
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No data available for this shared test result.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const performanceIndicator = getPerformanceIndicator(
    shareData.score,
    shareData.testType,
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {shareData.title || `${formatTestType(shareData.testType)} Result`}
          </h1>
        </div>

        {shareData.description && (
          <p className="text-muted-foreground">{shareData.description}</p>
        )}

        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(shareData.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>
              {shareData.currentViews} view
              {shareData.currentViews !== 1 ? "s" : ""}
              {shareData.maxViews && ` of ${shareData.maxViews}`}
            </span>
          </div>

          {shareData.expiresAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                Expires{" "}
                {formatDistanceToNow(new Date(shareData.expiresAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Test Results Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {formatTestType(shareData.testType)} Results
          </CardTitle>
          <CardDescription>
            Cognitive performance metrics from this test session
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Score */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              <p className="text-3xl font-bold">{shareData.score}</p>
              <Badge
                className={`mt-2 ${getPerformanceColor(performanceIndicator)}`}
              >
                {performanceIndicator}
              </Badge>
            </div>

            {/* Reaction Time */}
            {shareData.reactionTime && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Reaction Time
                </p>
                <p className="text-3xl font-bold">{shareData.reactionTime}</p>
                <p className="text-sm text-muted-foreground">milliseconds</p>
              </div>
            )}

            {/* Accuracy */}
            {shareData.accuracy && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                <p className="text-3xl font-bold">{shareData.accuracy}%</p>
                <div className="mt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Test Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">About This Test</h3>
            <p className="text-sm text-muted-foreground">
              This {formatTestType(shareData.testType).toLowerCase()} was
              completed on{" "}
              {new Date(shareData.timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              using HolistiQ's cognitive assessment platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Track Your Own Cognitive Performance
            </h3>
            <p className="text-muted-foreground mb-4">
              Start your journey with HolistiQ to monitor and improve your
              cognitive health with scientifically-backed assessments and
              personalized insights.
            </p>
            <Button asChild size="lg">
              <Link to="/">
                <Brain className="mr-2 h-4 w-4" />
                Get Started with HolistiQ
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
