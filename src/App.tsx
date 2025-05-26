import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingStateProvider } from "@/contexts/LoadingStateContext";
import Index from "./pages/Index";
import OAuthCallbackHandler from "./pages/auth/OAuthCallbackHandler";
import NotFound from "./pages/NotFound";
import EnhancedSignIn from "./pages/auth/EnhancedSignIn";
import HowItWorks from "./pages/HowItWorks";
import FaqPage from "./pages/FAQ";
import Onboarding from "./pages/Onboarding";
import BaselineTest from "./pages/BaselineTest";
import BaselineAnalysis from "./pages/BaselineAnalysis";
import Dashboard from "@/pages/Dashboard";
import EnhancedProfile from "@/pages/EnhancedProfile";
import TakeTest from "./pages/TakeTest";
import ReactionTimeTestPage from "./pages/ReactionTimeTest";
import TestSelection from "./pages/TestSelection";
import { TestRouter } from "./components/tests/TestRouter";
import Achievements from "./pages/Achievements";
import LogSupplement from "./pages/LogSupplement";
import EditSupplement from "./pages/EditSupplement";
import Supplements from "./pages/Supplements";
import SupplementEffectivenessReports from "./pages/SupplementEffectivenessReports";
import LogWashoutPeriod from "./pages/LogWashoutPeriod";
import WashoutPeriods from "./pages/WashoutPeriods";
import WashoutPeriodGuide from "./pages/WashoutPeriodGuide";
import LogConfoundingFactor from "./pages/LogConfoundingFactor";
import ConfoundingFactors from "./pages/ConfoundingFactors";
import StatisticalSignificance from "./pages/StatisticalSignificance";
import TemporalAnalysis from "./pages/TemporalAnalysis";
import ComparativeVisualization from "./pages/ComparativeVisualization";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Disclaimer from "./pages/legal/Disclaimer";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import SharedTestResult from "./pages/SharedTestResult";
import { LineChartTest } from "./components/test/LineChartTest";
import { directGoogleAuth } from "@/services/directGoogleAuth";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Google OAuth on app start
  useEffect(() => {
    directGoogleAuth.initialize().catch((error) => {
      console.warn("Google OAuth initialization failed:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LoadingStateProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth callback route outside of Layout to prevent interference */}
              <Route path="/auth/callback" element={<OAuthCallbackHandler />} />

              {/* All other routes with Layout */}
              <Route
                element={
                  <SessionProvider>
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  </SessionProvider>
                }
              >
                {/* Public routes - accessible without authentication */}
                <Route path="/" element={<Index />} />
                <Route path="/signin" element={<EnhancedSignIn />} />
                <Route
                  path="/login"
                  element={<Navigate to="/signin" replace />}
                />
                <Route
                  path="/signup"
                  element={<Navigate to="/signin" replace />}
                />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/disclaimer" element={<Disclaimer />} />

                {/* Public shared test results - accessible without authentication */}
                <Route
                  path="/shared/:shareToken"
                  element={<SharedTestResult />}
                />

                {/* Protected routes - require authentication */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/baseline-test" element={<BaselineTest />} />
                <Route
                  path="/baseline-analysis"
                  element={<BaselineAnalysis />}
                />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<EnhancedProfile />} />
                <Route path="/tests" element={<TestSelection />} />
                <Route path="/test-router" element={<TestRouter />} />
                <Route path="/test-selection" element={<TestSelection />} />
                <Route path="/take-test" element={<TakeTest />} />
                <Route
                  path="/reaction-time-test"
                  element={<ReactionTimeTestPage />}
                />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/log-supplement" element={<LogSupplement />} />
                <Route path="/edit-supplement" element={<EditSupplement />} />
                <Route path="/supplements" element={<Supplements />} />
                <Route
                  path="/supplement-effectiveness"
                  element={<SupplementEffectivenessReports />}
                />
                <Route
                  path="/log-washout-period"
                  element={<LogWashoutPeriod />}
                />
                <Route path="/washout-periods" element={<WashoutPeriods />} />
                <Route
                  path="/washout-period-guide"
                  element={<WashoutPeriodGuide />}
                />
                <Route
                  path="/log-confounding-factor"
                  element={<LogConfoundingFactor />}
                />
                <Route
                  path="/confounding-factors"
                  element={<ConfoundingFactors />}
                />
                <Route
                  path="/statistical-significance"
                  element={<StatisticalSignificance />}
                />
                <Route path="/analysis" element={<TemporalAnalysis />} />
                <Route
                  path="/comparative-visualization"
                  element={<ComparativeVisualization />}
                />
                <Route path="/line-chart-test" element={<LineChartTest />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LoadingStateProvider>
    </QueryClientProvider>
  );
};

export default App;
