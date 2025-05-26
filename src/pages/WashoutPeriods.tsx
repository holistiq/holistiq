import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, formatDistance } from "date-fns";
import {
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Filter,
  Pill,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getWashoutPeriods } from "@/services/washoutPeriodService";
import { WashoutPeriod, WashoutPeriodStatus } from "@/types/washoutPeriod";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WashoutPeriodsSection } from "@/components/supplements/WashoutPeriodsSection";
import { Progress } from "@/components/ui/progress";

export default function WashoutPeriods() {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [washoutPeriods, setWashoutPeriods] = useState<WashoutPeriod[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Load washout periods on component mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadWashoutPeriods(user.id);
    }
  }, [user]);

  // Load washout periods from the API
  const loadWashoutPeriods = async (userId: string) => {
    setIsLoading(true);
    try {
      const result = await getWashoutPeriods(userId);
      if (result.success) {
        setWashoutPeriods(result.washoutPeriods);
      } else {
        console.error("Error loading washout periods:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error loading washout periods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter washout periods based on active tab
  const getFilteredWashoutPeriods = () => {
    if (activeTab === "all") {
      return washoutPeriods;
    }
    return washoutPeriods.filter((period) => period.status === activeTab);
  };

  // Get active washout periods
  const getActiveWashoutPeriods = () => {
    return washoutPeriods.filter(
      (period) => period.status === WashoutPeriodStatus.ACTIVE,
    );
  };

  // Calculate duration in days
  const calculateDuration = (period: WashoutPeriod) => {
    if (period.actual_duration_days) {
      return period.actual_duration_days;
    }

    const start = new Date(period.start_date);
    const end = period.end_date ? new Date(period.end_date) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status badge
  const getStatusBadge = (status: WashoutPeriodStatus) => {
    switch (status) {
      case WashoutPeriodStatus.ACTIVE:
        return <Badge variant="secondary">Active</Badge>;
      case WashoutPeriodStatus.COMPLETED:
        return (
          <Badge variant="success" className="bg-green-500">
            Completed
          </Badge>
        );
      case WashoutPeriodStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Render washout period list
  const renderWashoutPeriodsList = () => {
    const filteredPeriods = getFilteredWashoutPeriods();

    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }

    if (filteredPeriods.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex justify-center mb-3">
            <Clock className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
          <p className="text-muted-foreground mb-6">No washout periods found</p>
          <Link to="/log-washout-period">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Start Washout Period
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredPeriods.map((period) => (
          <Card key={period.id}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {period.supplement_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Started{" "}
                      {format(new Date(period.start_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(period.status as WashoutPeriodStatus)}
                  <div className="text-sm">
                    <span className="text-muted-foreground">Duration: </span>
                    {calculateDuration(period)} days
                    {period.expected_duration_days &&
                      ` / ${period.expected_duration_days} planned`}
                  </div>
                </div>
              </div>

              {period.status === WashoutPeriodStatus.ACTIVE &&
                period.expected_duration_days && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>
                        {Math.min(
                          100,
                          Math.round(
                            (calculateDuration(period) /
                              period.expected_duration_days) *
                              100,
                          ),
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        Math.round(
                          (calculateDuration(period) /
                            period.expected_duration_days) *
                            100,
                        ),
                      )}
                      className="h-2"
                    />
                  </div>
                )}

              {period.end_date && (
                <div className="text-sm mb-4">
                  <span className="text-muted-foreground">Ended: </span>
                  {format(new Date(period.end_date), "MMM d, yyyy")}
                  {period.status === WashoutPeriodStatus.COMPLETED && (
                    <span className="ml-2 text-green-500 flex items-center gap-1 inline-flex">
                      <CheckCircle className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                  {period.status === WashoutPeriodStatus.CANCELLED && (
                    <span className="ml-2 text-red-500 flex items-center gap-1 inline-flex">
                      <XCircle className="h-3 w-3" />
                      Cancelled
                    </span>
                  )}
                </div>
              )}

              {period.reason && (
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Reason: </span>
                  {period.reason}
                </div>
              )}

              {period.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  {period.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Washout Periods
            </h1>
            <p className="text-muted-foreground mt-1">
              Track supplement elimination periods to establish accurate
              baselines
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/washout-period-guide">
              <Button variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Guide
              </Button>
            </Link>
            <Link to="/supplements">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Link to="/log-washout-period">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Start Washout Period
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Washout Periods Section */}
        <WashoutPeriodsSection
          washoutPeriods={getActiveWashoutPeriods().map((p) => ({
            ...p,
            days_elapsed: calculateDuration(p),
            progress_percentage: p.expected_duration_days
              ? Math.min(
                  100,
                  Math.round(
                    (calculateDuration(p) / p.expected_duration_days) * 100,
                  ),
                )
              : 0,
          }))}
          isLoading={isLoading}
          onUpdate={() => user?.id && loadWashoutPeriods(user.id)}
        />

        {/* All Washout Periods */}
        <Card>
          <CardHeader>
            <CardTitle>Washout Period History</CardTitle>
            <CardDescription>
              View all your past and current washout periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={WashoutPeriodStatus.ACTIVE}>
                  Active
                </TabsTrigger>
                <TabsTrigger value={WashoutPeriodStatus.COMPLETED}>
                  Completed
                </TabsTrigger>
                <TabsTrigger value={WashoutPeriodStatus.CANCELLED}>
                  Cancelled
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {renderWashoutPeriodsList()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
