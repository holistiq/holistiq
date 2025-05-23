/**
 * Utility functions for supplement-related operations
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format an expiration date for display
 * @param dateString ISO date string or any date string format
 * @returns Formatted date string or empty string if invalid
 */
export function formatExpirationDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    // Try to parse as ISO date first
    let date = parseISO(dateString);
    
    // If not valid, try as regular date
    if (!isValid(date)) {
      date = new Date(dateString);
    }
    
    // If still not valid, return original string
    if (!isValid(date)) {
      return dateString;
    }
    
    // Format the date
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting expiration date:', error);
    return dateString;
  }
}

/**
 * Convert a date to ISO string format for storage
 * @param date Date object or string
 * @returns ISO date string or undefined if invalid
 */
export function toISODateString(date?: Date | string): string | undefined {
  if (!date) return undefined;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!isValid(dateObj)) {
      return undefined;
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return undefined;
  }
}

/**
 * Get a list of common formulation types
 * @returns Array of formulation type objects with value and label
 */
export function getFormulationTypes() {
  return [
    { value: "standard", label: "Standard" },
    { value: "extended-release", label: "Extended Release" },
    { value: "liposomal", label: "Liposomal" },
    { value: "micronized", label: "Micronized" },
    { value: "enteric-coated", label: "Enteric Coated" },
    { value: "chelated", label: "Chelated" },
    { value: "time-release", label: "Time Release" },
  ];
}

/**
 * Get a list of common certification types
 * @returns Array of certification type objects with value and label
 */
export function getCertificationTypes() {
  return [
    { value: "usp", label: "USP Verified" },
    { value: "nsf", label: "NSF Certified" },
    { value: "gmp", label: "GMP Certified" },
    { value: "informed-choice", label: "Informed Choice" },
    { value: "non-gmo", label: "Non-GMO Project Verified" },
    { value: "organic", label: "Certified Organic" },
  ];
}

/**
 * Get the label for a formulation type
 * @param value Formulation type value
 * @returns Label for the formulation type or the value if not found
 */
export function getFormulationLabel(value?: string): string {
  if (!value) return '';
  
  const formulation = getFormulationTypes().find(f => f.value === value);
  return formulation ? formulation.label : value;
}

/**
 * Get the label for a certification type
 * @param value Certification type value
 * @returns Label for the certification type or the value if not found
 */
export function getCertificationLabel(value?: string): string {
  if (!value) return '';
  
  const certification = getCertificationTypes().find(c => c.value === value);
  return certification ? certification.label : value;
}
