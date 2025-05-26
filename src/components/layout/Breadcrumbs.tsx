import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";

interface BreadcrumbsProps {
  readonly className?: string;
  readonly maxDepth?: number;
}

export function Breadcrumbs({
  className = "",
  maxDepth = 4,
}: Readonly<BreadcrumbsProps>) {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Map of path segments to readable names
  const pathMap: Record<string, string> = {
    // Main navigation
    dashboard: "Dashboard",
    tests: "Tests",
    "test-selection": "Test Selection",
    "take-test": "Take Test",
    "reaction-time-test": "Reaction Time Test",
    supplements: "Supplements",
    "log-supplement": "Log Supplement",
    "edit-supplement": "Edit Supplement",
    "confounding-factors": "Factors",
    "log-confounding-factor": "Log Factor",
    achievements: "Achievements",
    profile: "Profile",

    // Washout periods
    "washout-periods": "Washout Periods",
    "log-washout-period": "Log Washout Period",
    "washout-period-guide": "Washout Guide",

    // Tests
    "baseline-test": "Baseline Test",
    "baseline-analysis": "Baseline Analysis",
    "test-router": "Test Router",
    "n-back": "N-Back Test",
    "reaction-time": "Reaction Time",
    stroop: "Stroop Test",
    memory: "Memory Test",

    // Analysis
    "supplement-effectiveness": "Effectiveness Reports",
    "statistical-significance": "Statistical Significance",
    "comparative-visualization": "Comparative Analysis",
    analysis: "Analysis",
    "temporal-analysis": "Temporal Analysis",

    // Authentication
    signin: "Sign In",
    login: "Sign In",
    signup: "Sign Up",
    onboarding: "Onboarding",

    // Auth folder
    auth: "Authentication",
    callback: "Authentication Callback",

    // Legal pages
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    disclaimer: "Disclaimer",

    // Public pages
    "how-it-works": "How It Works",
    faq: "FAQ",
    "about-us": "About Us",
    contact: "Contact Us",
  };

  // Define route mappings for each segment
  const routeMap: Record<string, string> = {
    dashboard: "/dashboard",
    supplements: "/supplements",
    "log-supplement": "/log-supplement",
    "edit-supplement": "/edit-supplement",
    "supplement-effectiveness": "/supplement-effectiveness",
    "confounding-factors": "/confounding-factors",
    "log-confounding-factor": "/log-confounding-factor",
    tests: "/tests",
    "test-selection": "/test-selection",
    "take-test": "/take-test",
    "reaction-time-test": "/reaction-time-test",
    "test-router": "/test-router",
    "baseline-test": "/baseline-test",
    "baseline-analysis": "/baseline-analysis",
    achievements: "/achievements",
    profile: "/profile",
    "washout-periods": "/washout-periods",
    "log-washout-period": "/log-washout-period",
    "washout-period-guide": "/washout-period-guide",
    analysis: "/analysis",
    "statistical-significance": "/statistical-significance",
    "comparative-visualization": "/comparative-visualization",
    "temporal-analysis": "/temporal-analysis",
    onboarding: "/onboarding",
  };

  // Custom breadcrumb hierarchies for specific routes
  const breadcrumbHierarchy: Record<string, string[]> = {
    // Supplements section
    supplements: ["dashboard", "supplements"],
    "log-supplement": ["dashboard", "supplements", "log-supplement"],
    "edit-supplement": ["dashboard", "supplements", "edit-supplement"],
    "supplement-effectiveness": [
      "dashboard",
      "supplements",
      "supplement-effectiveness",
    ],

    // Confounding factors section
    "confounding-factors": ["dashboard", "confounding-factors"],
    "log-confounding-factor": [
      "dashboard",
      "confounding-factors",
      "log-confounding-factor",
    ],

    // Tests section
    tests: ["dashboard", "tests"],
    "test-selection": ["dashboard", "tests", "test-selection"],
    "take-test": ["dashboard", "tests", "take-test"],
    "reaction-time-test": ["dashboard", "tests", "reaction-time-test"],
    "test-router": ["dashboard", "tests", "test-router"],
    "baseline-test": ["dashboard", "tests", "baseline-test"],
    "baseline-analysis": ["dashboard", "tests", "baseline-analysis"],

    // Achievements section
    achievements: ["dashboard", "achievements"],

    // Profile section
    profile: ["dashboard", "profile"],

    // Washout periods
    "washout-periods": ["dashboard", "supplements", "washout-periods"],
    "log-washout-period": [
      "dashboard",
      "supplements",
      "washout-periods",
      "log-washout-period",
    ],
    "washout-period-guide": [
      "dashboard",
      "supplements",
      "washout-periods",
      "washout-period-guide",
    ],

    // Analysis
    analysis: ["dashboard", "analysis"],
    "statistical-significance": [
      "dashboard",
      "analysis",
      "statistical-significance",
    ],
    "comparative-visualization": [
      "dashboard",
      "analysis",
      "comparative-visualization",
    ],
    "temporal-analysis": ["dashboard", "analysis", "temporal-analysis"],

    // Onboarding
    onboarding: ["dashboard", "onboarding"],
  };

  // Don't show breadcrumbs on homepage
  if (pathnames.length === 0) {
    return null;
  }

  // Check if we have a custom hierarchy for this path
  const lastPathSegment = pathnames[pathnames.length - 1];
  const customHierarchy = breadcrumbHierarchy[lastPathSegment];

  // Use custom hierarchy if available, otherwise use the actual path
  const breadcrumbSegments = customHierarchy || pathnames;

  // Handle depth control for long paths
  let displaySegments = [...breadcrumbSegments];
  if (displaySegments.length > maxDepth) {
    const start = Math.ceil(maxDepth / 2) - 1;
    const end = displaySegments.length - Math.floor(maxDepth / 2);
    displaySegments = [
      ...displaySegments.slice(0, start),
      "...", // Add ellipsis for truncated paths
      ...displaySegments.slice(end),
    ];
  }

  return (
    <div
      className={`flex items-center text-sm text-muted-foreground overflow-x-auto ${className}`}
    >
      <Link
        to="/"
        className="flex items-center hover:text-foreground min-w-fit"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {displaySegments.map((segment, index) => {
        // For ellipsis, render a special element
        if (segment === "...") {
          return (
            <div key="ellipsis" className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="flex items-center">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            </div>
          );
        }

        // Use the routeMap to get the correct route for this segment
        const routeTo = routeMap[segment] || `/${segment}`;
        const isLast = index === displaySegments.length - 1;

        // Format the segment name if not found in pathMap
        let displayName = pathMap[segment];
        if (!displayName) {
          // Convert kebab-case to Title Case (e.g., 'my-page' to 'My Page')
          displayName = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }

        return (
          <div key={segment + index} className="flex items-center min-w-fit">
            <ChevronRight className="h-4 w-4 mx-2" />
            {isLast ? (
              <span className="font-medium text-foreground">{displayName}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-foreground transition-colors"
              >
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
