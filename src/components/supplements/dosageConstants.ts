/**
 * Constants for dosage input component
 */

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
