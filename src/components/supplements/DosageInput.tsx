import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common units for supplements with conversion information
export const commonUnits = [
  { value: "mg", label: "Milligrams (mg)", conversion: "1000 mg = 1 g" },
  { value: "g", label: "Grams (g)", conversion: "1 g = 1000 mg" },
  { value: "mcg", label: "Micrograms (mcg)", conversion: "1000 mcg = 1 mg" },
  { value: "IU", label: "International Units (IU)", conversion: "Varies by substance" },
  { value: "mL", label: "Milliliters (mL)", conversion: "1000 mL = 1 L" },
  { value: "capsule", label: "Capsules", conversion: "Check mg per capsule on label" },
  { value: "tablet", label: "Tablets", conversion: "Check mg per tablet on label" },
  { value: "drop", label: "Drops", conversion: "~20 drops = 1 mL (varies)" },
  { value: "scoop", label: "Scoops", conversion: "Check g per scoop on label" },
];

interface DosageInputProps {
  readonly amount: string;
  readonly setAmount: (value: string) => void;
  readonly unit: string;
  readonly setUnit: (value: string) => void;
  readonly amountError?: string;
  readonly className?: string;
}

export function DosageInput({
  amount,
  setAmount,
  unit,
  setUnit,
  amountError,
  className
}: DosageInputProps) {
  // Find the current unit's conversion information
  const currentUnit = commonUnits.find(u => u.value === unit);

  return (
    <div className={className}>
      <div className="bg-secondary/5 p-4 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Dosage</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-xs">
                <div className="space-y-2 p-1">
                  <p className="font-medium">Unit Conversions:</p>
                  <ul className="text-xs space-y-1">
                    {commonUnits.map(unit => (
                      <li key={unit.value}>
                        <span className="font-medium">{unit.label}:</span> {unit.conversion}
                      </li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className={amountError ? "border-red-500" : ""}
            />
            {amountError && <p className="text-sm text-red-500 mt-1">{amountError}</p>}
          </div>
          <div className="w-2/5">
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {commonUnits.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            Enter the amount and select a unit (e.g., 500 mg)
          </p>
          {currentUnit && (
            <p className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md inline-block">
              <span className="font-medium">{currentUnit.value}:</span> {currentUnit.conversion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
