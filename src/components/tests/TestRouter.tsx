/**
 * Test Router Component
 *
 * Routes users to the appropriate test based on their preferences
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTestPreferences } from "@/hooks/test/useTestPreferences";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Component that routes users to the appropriate test based on their preferences
 */
export function TestRouter() {
  const navigate = useNavigate();
  const { preferences, loading } = useTestPreferences();

  // Route to the appropriate test based on preferences
  useEffect(() => {
    if (!loading) {
      switch (preferences.defaultTestType) {
        case "n-back":
          navigate("/take-test");
          break;
        case "reaction-time":
          navigate("/reaction-time-test");
          break;
        case "selection":
        default:
          navigate("/test-selection");
          break;
      }
    }
  }, [navigate, preferences, loading]);

  // Show loading skeleton while preferences are loading
  if (loading) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-24 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This component doesn't render anything as it redirects
  return null;
}
