import { useState, useEffect } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Brain,
  Calculator,
  Pill,
  Activity,
  Plus,
  Trash2,
  Loader2
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  StatisticalAnalysis,
  StatisticalAnalysisOptions,
  ContextType
} from '@/types/statisticalSignificance';
import {
  runStatisticalAnalysis,
  getStatisticalAnalyses,
  deleteStatisticalAnalysis
} from '@/services/statisticalSignificanceService';
import { getSupplements } from '@/services/supplementService';
import { getConfoundingFactors } from '@/services/confoundingFactorService';
import { Supplement } from '@/types/supplement';
import { ConfoundingFactor } from '@/types/confoundingFactor';
import { StatisticalSignificanceForm } from '@/components/analysis/StatisticalSignificanceForm';
import { StatisticalSignificanceCard } from '@/components/analysis/StatisticalSignificanceCard';

export default function StatisticalSignificance() {
  const { user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [analyses, setAnalyses] = useState<StatisticalAnalysis[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [confoundingFactors, setConfoundingFactors] = useState<ConfoundingFactor[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showNewAnalysisForm, setShowNewAnalysisForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadAnalyses();
      loadSupplements();
      loadConfoundingFactors();
    }
  }, [user, activeTab]);

  const loadAnalyses = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let contextType: ContextType | undefined;
      if (activeTab === "supplements") {
        contextType = ContextType.SUPPLEMENT;
      } else if (activeTab === "factors") {
        contextType = ContextType.CONFOUNDING_FACTOR;
      } else if (activeTab === "general") {
        contextType = ContextType.GENERAL;
      }

      console.log(`Loading analyses for tab: ${activeTab}, contextType: ${contextType}`);

      const result = await getStatisticalAnalyses(user.id, contextType);
      if (result.success) {
        setAnalyses(result.analyses);
        console.log(`Loaded ${result.analyses.length} analyses`);
      } else {
        // Only show error toast if it's not an empty result
        // Empty results are normal and expected when no analyses exist yet
        if (result.error && !result.error.includes("no rows")) {
          console.error("Error loading analyses:", result.error);
          toast({
            title: "Error",
            description: "Failed to load statistical analyses. Please try again.",
            variant: "destructive"
          });
        } else {
          // Set empty array for analyses when none exist
          setAnalyses([]);
          console.log("No analyses found");
        }
      }
    } catch (error) {
      console.error("Unexpected error loading analyses:", error);
      // Don't show error toast for expected errors like no data
      if (error instanceof Error && !error.message?.includes("no rows")) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupplements = async () => {
    if (!user) return;

    try {
      const result = await getSupplements(user.id);
      if (result.success) {
        setSupplements(result.supplements);
      }
    } catch (error) {
      console.error("Error loading supplements:", error);
    }
  };

  const loadConfoundingFactors = async () => {
    if (!user) return;

    try {
      const result = await getConfoundingFactors(user.id);
      if (result.success) {
        setConfoundingFactors(result.factors);
      }
    } catch (error) {
      console.error("Error loading confounding factors:", error);
    }
  };

  const handleTabChange = (value: string) => {
    console.log(`Tab changed to: ${value}`);
    // Clear analyses when changing tabs to avoid showing stale data
    setAnalyses([]);
    setActiveTab(value);
    // The useEffect hook will automatically call loadAnalyses when activeTab changes
  };

  const handleRunAnalysis = async (options: StatisticalAnalysisOptions) => {
    if (!user) return;

    setIsRunningAnalysis(true);
    try {
      const result = await runStatisticalAnalysis(user.id, options);
      if (result.success && result.analysis) {
        toast({
          title: "Analysis Complete",
          description: "Statistical significance analysis has been completed successfully."
        });

        // Add the new analysis to the list
        setAnalyses(prev => [result.analysis, ...prev]);
        setShowNewAnalysisForm(false);
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to run statistical analysis. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Unexpected error running analysis:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!user) return;

    setDeleteId(analysisId);
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;

    try {
      const result = await deleteStatisticalAnalysis(user.id, deleteId);
      if (result.success) {
        toast({
          title: "Analysis Deleted",
          description: "The statistical analysis has been deleted successfully."
        });

        // Remove the deleted analysis from the list
        setAnalyses(prev => prev.filter(a => a.id !== deleteId));
      } else {
        toast({
          title: "Deletion Failed",
          description: result.error || "Failed to delete the analysis. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Unexpected error deleting analysis:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteId(null);
    }
  };

  // Helper function to get the appropriate empty state message based on the active tab
  const getEmptyStateMessage = () => {
    if (activeTab === "all") {
      return "You haven't run any statistical analyses yet.";
    }

    let analysisType = "";
    switch (activeTab) {
      case "general":
        analysisType = "general";
        break;
      case "supplements":
        analysisType = "supplement";
        break;
      case "factors":
        analysisType = "confounding factor";
        break;
    }

    return `You haven't run any ${analysisType} analyses yet.`;
  };

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistical Significance</h1>
          <p className="text-muted-foreground mt-1">
            Determine if observed cognitive changes are statistically significant
          </p>
        </div>
        <Button
          onClick={() => setShowNewAnalysisForm(!showNewAnalysisForm)}
          className="gap-2"
        >
          {showNewAnalysisForm ? (
            <>Hide Form</>
          ) : (
            <>
              <Calculator className="h-4 w-4" />
              New Analysis
            </>
          )}
        </Button>
      </div>

      {showNewAnalysisForm && (
        <div className="mb-8">
          <StatisticalSignificanceForm
            onSubmit={handleRunAnalysis}
            isLoading={isRunningAnalysis}
            supplements={supplements}
            confoundingFactors={confoundingFactors}
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="all">All Analyses</TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center gap-1">
            <Pill className="h-4 w-4" />
            <span className="hidden md:inline">Supplements</span>
          </TabsTrigger>
          <TabsTrigger value="factors" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Confounding Factors</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      ) : (
        <>
          {analyses.length === 0 ? (
            <div className="text-center py-12 bg-secondary/20 rounded-lg">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No analyses found</h2>
              <p className="text-muted-foreground mb-6">
                {getEmptyStateMessage()}
              </p>
              <Button onClick={() => setShowNewAnalysisForm(true)}>Run Your First Analysis</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {analyses.map(analysis => (
                <StatisticalSignificanceCard
                  key={analysis.id}
                  analysis={analysis}
                  onDelete={handleDeleteAnalysis}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this statistical analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
