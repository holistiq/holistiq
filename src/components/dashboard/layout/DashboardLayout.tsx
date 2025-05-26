import React from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard, BarChart } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { UserNav } from "@/components/layout/UserNav";

export type DashboardTabValue = "overview" | "performance";

interface DashboardLayoutProps {
  /** Currently active tab */
  activeTab: DashboardTabValue;
  /** Callback for tab change */
  onTabChange: (tab: DashboardTabValue) => void;
  /** Callback for refresh action */
  onRefresh: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Children content for the active tab */
  children: React.ReactNode;
  /** Optional className for styling */
  className?: string;
}

/**
 * A modern, streamlined dashboard layout component that provides a consistent structure
 * for all dashboard pages with unified navigation and content areas.
 */
export function DashboardLayout({
  activeTab,
  onTabChange,
  onRefresh,
  isLoading,
  children,
  className,
}: DashboardLayoutProps) {
  const { user } = useSupabaseAuth();

  // Define tab configuration
  const tabs = [
    {
      value: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
    },
    {
      value: "performance",
      label: "Performance",
      icon: <BarChart className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <div className={cn("dashboard-container", className)}>
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9 gap-1"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {user && <UserNav user={user} />}
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as DashboardTabValue)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center justify-center"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
