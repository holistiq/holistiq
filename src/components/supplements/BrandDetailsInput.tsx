import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formulationTypes, certificationTypes } from './brandDetailsConstants';

interface BrandDetailsInputProps {
  readonly manufacturer: string;
  readonly setManufacturer: (value: string) => void;
  readonly brand: string;
  readonly setBrand: (value: string) => void;
  readonly brandReputation: number;
  readonly setBrandReputation: (value: number) => void;
  readonly formulationType: string;
  readonly setFormulationType: (value: string) => void;
  readonly batchNumber: string;
  readonly setBatchNumber: (value: string) => void;
  readonly expirationDate: Date | undefined;
  readonly setExpirationDate: (value: Date | undefined) => void;
  readonly thirdPartyTested: boolean;
  readonly setThirdPartyTested: (value: boolean) => void;
  readonly certification: string;
  readonly setCertification: (value: string) => void;
  readonly isOpen: boolean;
  readonly setIsOpen: (value: boolean) => void;
  readonly className?: string;
}

export function BrandDetailsInput({
  manufacturer,
  setManufacturer,
  brand,
  setBrand,
  brandReputation,
  setBrandReputation,
  formulationType,
  setFormulationType,
  batchNumber,
  setBatchNumber,
  expirationDate,
  setExpirationDate,
  thirdPartyTested,
  setThirdPartyTested,
  certification,
  setCertification,
  isOpen,
  setIsOpen,
  className
}: BrandDetailsInputProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`bg-secondary/5 rounded-lg ${className}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-secondary/20">
        <CollapsibleTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-background rounded-full p-1">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <h3 className="text-base font-medium">Brand & Formulation Details (Optional)</h3>
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="p-4 space-y-6">
        {/* Brand & Manufacturer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand" className="font-medium">Brand Name</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., NOW Foods, Jarrow, etc."
              className="bg-background/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manufacturer" className="font-medium">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g., Glanbia, Nestlé, etc."
              className="bg-background/80"
            />
          </div>
        </div>

        {/* Brand Reputation */}
        <div className="space-y-2 bg-background/80 p-3 rounded-md">
          <Label className="font-medium">Brand Reputation</Label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant={brandReputation === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setBrandReputation(rating)}
                className="w-8 h-8 p-0"
              >
                {rating}
              </Button>
            ))}
            {brandReputation > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBrandReputation(0)}
                className="text-xs ml-2"
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rate the brand's reputation from 1 (poor) to 5 (excellent)
          </p>
        </div>

        {/* Formulation Type */}
        <div className="space-y-2">
          <Label className="font-medium">Formulation Type</Label>
          <Select value={formulationType} onValueChange={setFormulationType}>
            <SelectTrigger className="bg-background/80">
              <SelectValue placeholder="Select formulation type" />
            </SelectTrigger>
            <SelectContent>
              {formulationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Different formulations can affect absorption and effectiveness
          </p>
        </div>

        {/* Batch & Expiration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batch" className="font-medium">Batch/Lot Number</Label>
            <Input
              id="batch"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., L12345A"
              className="bg-background/80"
            />
            <p className="text-xs text-muted-foreground">
              Found on the supplement container
            </p>
          </div>
          <div className="space-y-2">
            <Label className="font-medium">Expiration Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-background/80"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-background/80 p-3 rounded-md">
            <div className="space-y-0.5">
              <Label className="font-medium">Third-Party Tested</Label>
              <p className="text-xs text-muted-foreground">
                Indicates independent verification of supplement quality
              </p>
            </div>
            <Switch
              checked={thirdPartyTested}
              onCheckedChange={setThirdPartyTested}
            />
          </div>

          {thirdPartyTested && (
            <div className="space-y-2 mt-2">
              <Label className="font-medium">Certification</Label>
              <Select value={certification} onValueChange={setCertification}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Select certification type" />
                </SelectTrigger>
                <SelectContent>
                  {certificationTypes.map((cert) => (
                    <SelectItem key={cert.value} value={cert.value}>
                      {cert.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
