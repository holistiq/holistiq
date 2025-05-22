import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Plus, Calendar, ArrowLeft, BarChart, Edit } from "lucide-react";
import { formatDate } from '@/utils/formatUtils';
import { Supplement } from '@/types/supplement';
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getSupplements, loadSupplementsFromLocalStorage } from "@/services/supplementService";
import { BrandDetailsDisplay } from "@/components/supplements/BrandDetailsDisplay";
import { SupplementEvaluationStatus } from "@/components/supplements/SupplementEvaluationStatus";

export default function Supplements() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Function to load supplements
  const loadSupplements = async () => {
    setIsLoading(true);

    try {
        // First try to load from local storage for immediate display
        const localSupplements = loadSupplementsFromLocalStorage();
        if (localSupplements.length > 0) {
          console.log(`Loaded ${localSupplements.length} supplements from local storage`);
          setSupplements(localSupplements);
        }

        // If user is logged in, fetch from Supabase for the most up-to-date data
        if (user) {
          console.log("User is logged in, fetching supplements from Supabase...");
          const result = await getSupplements(user.id);

          if (result.success) {
            console.log(`Loaded ${result.supplements.length} supplements from Supabase`);
            setSupplements(result.supplements);
          }
        } else {
          console.log("User not logged in, using local storage supplements only");
        }
      } catch (error) {
        console.error('Error fetching supplements:', error);
      } finally {
        setIsLoading(false);
      }
    };

  // Load supplements on component mount
  useEffect(() => {
    loadSupplements();
  }, [user]);

  // Render loading state
  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Handle editing a supplement
  const handleEditSupplement = (supplement: Supplement) => {
    navigate('/edit-supplement', { state: { supplement } });
  };

  // Render the content of the card based on loading state and data
  const renderCardContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      );
    }

    if (supplements.length > 0) {
      return (
        <div className="space-y-3">
          {supplements.map((supplement) => (
            <div key={supplement.id} className="flex flex-col p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${supplement.color}20`, color: supplement.color }}>
                    <Pill className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{supplement.name}</p>
                    <p className="text-sm">
                      {supplement.amount && supplement.unit
                        ? `${supplement.amount} ${supplement.unit}`
                        : supplement.dosage}
                    </p>
                    {(supplement.frequency || supplement.time_of_day || supplement.with_food) && (
                      <p className="text-xs text-muted-foreground">
                        {supplement.frequency === "custom"
                          ? "Custom schedule"
                          : supplement.frequency || ''}{' '}
                        {supplement.time_of_day && `• ${supplement.time_of_day}`}
                        {supplement.with_food && " • with food"}
                      </p>
                    )}

                    {/* Brand and Formulation Details (Compact) */}
                    <BrandDetailsDisplay supplement={supplement} compact={true} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditSupplement(supplement)}
                      title="Edit supplement"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(supplement.intake_time)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className="mt-3 pl-15">
                {/* Notes */}
                {supplement.notes && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Notes:</p>
                    <p className="text-sm">{supplement.notes}</p>
                  </div>
                )}

                {/* Brand and Formulation Details (Full) */}
                {(supplement.brand || supplement.manufacturer || supplement.formulation_type ||
                  supplement.batch_number || supplement.expiration_date ||
                  supplement.third_party_tested || supplement.certification) && (
                  <div className="mt-3 border-t pt-3">
                    <BrandDetailsDisplay supplement={supplement} />
                  </div>
                )}

                {/* Supplement Evaluation Status */}
                <div className="mt-3 border-t pt-3">
                  <SupplementEvaluationStatus
                    supplement={supplement}
                    onStatusChange={() => loadSupplements()}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="bg-secondary/30 p-6 rounded-lg">
          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-lg">No supplements logged yet</p>
          <p className="text-muted-foreground mb-6">
            Start tracking your supplements to see their effects on your cognitive performance.
          </p>
          <Link to="/log-supplement">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Your First Supplement
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Supplements</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/supplement-effectiveness">
              <Button variant="outline" className="gap-2">
                <BarChart className="h-4 w-4" />
                Effectiveness Reports
              </Button>
            </Link>
            <Link to="/log-supplement">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Log Supplement
              </Button>
            </Link>
          </div>
        </div>

        {/* Supplements List */}
        <Card>
          <CardHeader>
            <CardTitle>Supplement History</CardTitle>
            <CardDescription>
              Track your supplement intake over time to identify patterns and effects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCardContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
