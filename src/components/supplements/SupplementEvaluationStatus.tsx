/**
 * Supplement Evaluation Status Component
 *
 * Checks and displays the evaluation status of a supplement
 */
import React, { useState, useEffect } from "react";
import { Supplement, SupplementCycleStatus } from "@/types/supplement";
import { TestResult } from "@/lib/testResultUtils";
import { SupplementCycleTracker } from "./SupplementCycleTracker";
import { getTestResults } from "@/services/testResultService";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { parseISO, isAfter, isBefore, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplementEvaluationStatusProps {
  readonly supplement: Supplement;
  readonly onStatusChange?: () => void;
  readonly className?: string;
  readonly compact?: boolean;
}

export function SupplementEvaluationStatus({
  supplement,
  onStatusChange,
  className,
  compact = false,
}: Readonly<SupplementEvaluationStatusProps>) {
  const { user } = useSupabaseAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasBeforeTests, setHasBeforeTests] = useState(false);
  const [hasAfterTests, setHasAfterTests] = useState(false);
  const [hasDetailedNotes, setHasDetailedNotes] = useState(false);

  // Fetch test results
  useEffect(() => {
    const fetchTestResults = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await getTestResults(user.id);

        if (response.success && response.testResults) {
          setTestResults(response.testResults);
        }
      } catch (error) {
        console.error("Error fetching test results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [user]);

  // Check if there are tests before supplement start
  useEffect(() => {
    if (!supplement.start_date || testResults.length === 0) {
      setHasBeforeTests(false);
      setHasAfterTests(false);
      return;
    }

    const startDate = parseISO(supplement.start_date);
    const beforeTests = testResults.filter(
      (test) =>
        isBefore(parseISO(test.timestamp), startDate) &&
        differenceInDays(startDate, parseISO(test.timestamp)) <= 14, // Within 14 days before start
    );

    const afterTests = testResults.filter(
      (test) =>
        isAfter(parseISO(test.timestamp), startDate) &&
        (!supplement.end_date ||
          isBefore(parseISO(test.timestamp), parseISO(supplement.end_date))),
    );

    setHasBeforeTests(beforeTests.length >= 2); // At least 2 tests before starting
    setHasAfterTests(afterTests.length >= 3); // At least 3 tests while taking
  }, [supplement, testResults]);

  // Check if supplement has detailed notes
  useEffect(() => {
    // Consider notes detailed if they're at least 50 characters
    setHasDetailedNotes(!!supplement.notes && supplement.notes.length >= 50);
  }, [supplement]);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-[150px] w-full" />
      </div>
    );
  }

  return (
    <SupplementCycleTracker
      supplement={supplement}
      hasBeforeTests={hasBeforeTests}
      hasAfterTests={hasAfterTests}
      hasDetailedNotes={hasDetailedNotes}
      onCycleCompleted={onStatusChange}
      className={className}
      compact={compact}
    />
  );
}
