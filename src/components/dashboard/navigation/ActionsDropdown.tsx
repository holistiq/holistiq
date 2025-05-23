import { memo } from 'react';
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  Pill,
  Activity,
  Calculator,
  LineChart,
  BarChart2,
  Clock,
  ChevronDown,
  Trophy
} from "lucide-react";

/**
 * Actions dropdown component that provides quick access to common actions
 * Used in the dashboard navigation to consolidate action buttons
 */
export const ActionsDropdown = memo(function ActionsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          Actions
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Testing</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/test-router" className="flex items-center gap-2 w-full">
              <Brain className="h-4 w-4" />
              <span>Take Test</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/baseline-analysis" className="flex items-center gap-2 w-full">
              <Target className="h-4 w-4" />
              <span>Baseline Analysis</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Progress</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/achievements" className="flex items-center gap-2 w-full">
              <Trophy className="h-4 w-4" />
              <span>Achievements</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Tracking</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/log-supplement" className="flex items-center gap-2 w-full">
              <Pill className="h-4 w-4" />
              <span>Log Supplement</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/log-confounding-factor" className="flex items-center gap-2 w-full">
              <Activity className="h-4 w-4" />
              <span>Log Factors</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/log-washout-period" className="flex items-center gap-2 w-full">
              <Clock className="h-4 w-4" />
              <span>Log Washout Period</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Analysis</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/supplement-effectiveness" className="flex items-center gap-2 w-full">
              <BarChart2 className="h-4 w-4" />
              <span>Effectiveness</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/statistical-significance" className="flex items-center gap-2 w-full">
              <Calculator className="h-4 w-4" />
              <span>Significance</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/comparative-visualization" className="flex items-center gap-2 w-full">
              <BarChart2 className="h-4 w-4" />
              <span>Compare</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/analysis" className="flex items-center gap-2 w-full">
              <LineChart className="h-4 w-4" />
              <span>Analysis</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
