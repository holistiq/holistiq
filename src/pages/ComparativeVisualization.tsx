import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTestResults } from "@/contexts/TestResultsContext";
import { getSupplements } from "@/services/supplementService";
import { getWashoutPeriods } from "@/services/washoutPeriodService";
import { Supplement } from "@/types/supplement";
import { WashoutPeriod, ActiveWashoutPeriod } from "@/types/washoutPeriod";
import { ComparativeVisualization as ComparativeVisualizationComponent } from "@/components/analysis/ComparativeVisualization";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ComparativeVisualizationPage() {
  const { user } = useSupabaseAuth();
  const { testHistory, isLoadingTests } = useTestResults();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [washoutPeriods, setWashoutPeriods] = useState<
    (WashoutPeriod | ActiveWashoutPeriod)[]
  >([]);
  const [isLoadingSupplements, setIsLoadingSupplements] = useState(true);
  const [isLoadingWashoutPeriods, setIsLoadingWashoutPeriods] = useState(true);

  // Load supplements
  useEffect(() => {
    async function loadSupplements() {
      if (user?.id) {
        setIsLoadingSupplements(true);
        try {
          const result = await getSupplements(user.id);
          if (result.success) {
            setSupplements(result.supplements);
          }
        } catch (error) {
          console.error("Error loading supplements:", error);
        } finally {
          setIsLoadingSupplements(false);
        }
      }
    }

    loadSupplements();
  }, [user]);

  // Load washout periods
  useEffect(() => {
    async function loadWashoutPeriods() {
      if (user?.id) {
        setIsLoadingWashoutPeriods(true);
        try {
          const result = await getWashoutPeriods(user.id);
          if (result.success) {
            setWashoutPeriods([
              ...result.washoutPeriods,
              ...result.activeWashoutPeriods,
            ]);
          }
        } catch (error) {
          console.error("Error loading washout periods:", error);
        } finally {
          setIsLoadingWashoutPeriods(false);
        }
      }
    }

    loadWashoutPeriods();
  }, [user]);

  // Determine if any data is still loading
  const isLoading =
    Boolean(isLoadingTests) ||
    Boolean(isLoadingSupplements) ||
    Boolean(isLoadingWashoutPeriods);

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart2 className="h-7 w-7 text-primary" />
              Comparative Visualization
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Compare your cognitive performance during different
                      periods to see how supplements affect you. You can compare
                      on/off periods for a supplement, or compare two different
                      supplements.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h1>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        ) : (
          <ComparativeVisualizationComponent
            testResults={testHistory}
            supplements={supplements}
            washoutPeriods={washoutPeriods}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
