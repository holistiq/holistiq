import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Star, Factory, Calendar, CheckCircle, Info } from "lucide-react";
import { Supplement } from '@/types/supplement';
import {
  formatExpirationDate,
  getFormulationLabel,
  getCertificationLabel
} from '@/utils/supplementUtils';

interface BrandDetailsDisplayProps {
  readonly supplement: Supplement;
  readonly compact?: boolean;
  readonly className?: string;
}

export function BrandDetailsDisplay({ supplement, compact = false, className = '' }: BrandDetailsDisplayProps) {
  // Check if we have any brand or formulation details to display
  const hasBrandDetails = supplement.brand ||
                          supplement.manufacturer ||
                          supplement.brand_reputation ||
                          supplement.formulation_type ||
                          supplement.batch_number ||
                          supplement.expiration_date ||
                          supplement.third_party_tested ||
                          supplement.certification;

  if (!hasBrandDetails) {
    return null;
  }

  // Render brand reputation stars
  const renderBrandReputation = () => {
    if (!supplement.brand_reputation) return null;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={`star-${i}-${supplement.id}`}
            className={`h-3 w-3 ${i < (supplement.brand_reputation || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Compact view for dashboard and list views
  if (compact) {
    return (
      <div className={`flex flex-wrap gap-1 mt-1 ${className}`}>
        {supplement.brand && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 gap-0.5">
            <Info className="h-3 w-3" />
            {supplement.brand}
          </Badge>
        )}

        {supplement.formulation_type && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
            {getFormulationLabel(supplement.formulation_type)}
          </Badge>
        )}

        {supplement.third_party_tested && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 gap-0.5 bg-green-50">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Verified
          </Badge>
        )}
      </div>
    );
  }

  // Full detailed view
  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium">Brand & Formulation Details</h4>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {/* Brand & Manufacturer */}
        {(supplement.brand || supplement.manufacturer) && (
          <>
            {supplement.brand && (
              <div>
                <span className="text-muted-foreground text-xs">Brand:</span>
                <div className="flex items-center gap-1">
                  <span>{supplement.brand}</span>
                  {renderBrandReputation()}
                </div>
              </div>
            )}

            {supplement.manufacturer && (
              <div>
                <span className="text-muted-foreground text-xs">Manufacturer:</span>
                <div className="flex items-center gap-1">
                  <Factory className="h-3 w-3" />
                  <span>{supplement.manufacturer}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Formulation Type */}
        {supplement.formulation_type && (
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">Formulation:</span>
            <div>
              <Badge variant="outline" className="mt-0.5">
                {getFormulationLabel(supplement.formulation_type)}
              </Badge>
            </div>
          </div>
        )}

        {/* Batch & Expiration */}
        {(supplement.batch_number || supplement.expiration_date) && (
          <>
            {supplement.batch_number && (
              <div>
                <span className="text-muted-foreground text-xs">Batch/Lot #:</span>
                <div>{supplement.batch_number}</div>
              </div>
            )}

            {supplement.expiration_date && (
              <div>
                <span className="text-muted-foreground text-xs">Expires:</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatExpirationDate(supplement.expiration_date)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Certification */}
        {supplement.third_party_tested && (
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">Certification:</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Award className="h-4 w-4 text-green-500" />
              <span>
                {supplement.certification
                  ? getCertificationLabel(supplement.certification)
                  : "Third-Party Tested"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
