/**
 * Service for searching and retrieving supplement data from external APIs
 * and local cache.
 */

import { Supplement } from "@/types/supplement";

// Define the structure of a supplement search result
export interface SupplementSearchResult {
  id: string;
  name: string;
  brand?: string;
  manufacturer?: string;
  image?: string;
  dosage?: string;
  ingredients?: string;
  nutrientLevels?: Record<string, unknown>;
  nutriments?: Record<string, unknown>;
  formulation_type?: string;
  certification?: string;
}

// Define the structure of the Open Food Facts API response
interface OpenFoodFactsResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: Array<{
    _id: string;
    product_name: string;
    brands?: string;
    manufacturer?: string;
    image_url?: string;
    quantity?: string;
    ingredients_text?: string;
    nutrient_levels?: Record<string, unknown>;
    nutriments?: Record<string, unknown>;
    packaging?: string;
    labels?: string;
    manufacturing_places?: string;
    origins?: string;
  }>;
}

// Cache for storing recent search results
const searchCache: Record<string, SupplementSearchResult[]> = {};

/**
 * Search for supplements using the Open Food Facts API and our local database
 * @param query The search query
 * @param limit Maximum number of results to return
 * @param category Optional category to filter results
 * @returns Promise with array of supplement search results
 */
export async function searchSupplements(
  query: string,
  limit: number = 10,
  category?: SupplementCategory,
): Promise<SupplementSearchResult[]> {
  // Check cache first
  const cacheKey = `${query}_${limit}_${category || "all"}`;
  if (searchCache[cacheKey]) {
    console.log("Returning cached results for:", query);
    return searchCache[cacheKey];
  }

  // First, search our local database of supplements
  const normalizedQuery = query.toLowerCase().trim();
  let localResults: SupplementSearchResult[] = [];

  if (normalizedQuery.length > 0) {
    // Filter supplements based on the query and optional category
    localResults = allSupplements
      .filter((supplement) => {
        // Apply category filter if provided
        if (category && supplement.category !== category) {
          return false;
        }

        // Match by name, benefits, or category
        return (
          supplement.name.toLowerCase().includes(normalizedQuery) ||
          supplement.benefits?.toLowerCase().includes(normalizedQuery) ||
          supplement.category.toString().includes(normalizedQuery)
        );
      })
      .slice(0, limit);
  }

  // If we have enough local results or the query is very short, return them
  if (localResults.length >= limit || normalizedQuery.length < 3) {
    // Cache the results
    searchCache[cacheKey] = localResults;
    return localResults;
  }

  // Otherwise, also search the external API
  try {
    // Construct the API URL for Open Food Facts
    // Filter for supplements and vitamins categories
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query,
    )}&search_simple=1&action=process&json=1&page_size=${limit}&tagtype_0=categories&tag_contains_0=contains&tag_0=supplements`;

    console.log("Searching supplements with URL:", url);

    // Make the API request
    const response = await fetch(url, {
      headers: {
        "User-Agent": "HolistiQ-App/1.0 (s.kaan.yildirim@gmail.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data: OpenFoodFactsResponse = await response.json();
    console.log("API response:", data);

    // Transform the API response into our format
    const apiResults = data.products.map((product) => {
      // Try to determine formulation type from product name or ingredients
      let formulation_type = "";
      const productNameLower = product.product_name?.toLowerCase() ?? "";
      const ingredientsLower = product.ingredients_text?.toLowerCase() ?? "";

      // Check for various formulation types in both product name and ingredients
      if (
        productNameLower.includes("extended release") ||
        productNameLower.includes("extended-release") ||
        productNameLower.includes("slow release") ||
        ingredientsLower.includes("extended release")
      ) {
        formulation_type = "extended-release";
      } else if (
        productNameLower.includes("liposomal") ||
        ingredientsLower.includes("liposomal")
      ) {
        formulation_type = "liposomal";
      } else if (
        productNameLower.includes("enteric") ||
        ingredientsLower.includes("enteric")
      ) {
        formulation_type = "enteric-coated";
      } else if (
        productNameLower.includes("chelated") ||
        ingredientsLower.includes("chelate") ||
        ingredientsLower.includes("bisglycinate")
      ) {
        formulation_type = "chelated";
      } else if (
        productNameLower.includes("micronized") ||
        ingredientsLower.includes("micronized")
      ) {
        formulation_type = "micronized";
      } else if (
        productNameLower.includes("time release") ||
        productNameLower.includes("time-release")
      ) {
        formulation_type = "time-release";
      }

      // Try to determine certification from labels and other product information
      let certification = "";
      const labelsLower = product.labels?.toLowerCase() ?? "";
      // Reuse the productNameLower variable from above

      // Check for various certifications in labels and product name
      if (
        labelsLower.includes("usb") ||
        productNameLower.includes("usb verified")
      ) {
        certification = "usp"; // Corrected from 'usb' to 'usp' (United States Pharmacopeia)
      } else if (
        labelsLower.includes("nsf") ||
        productNameLower.includes("nsf")
      ) {
        certification = "nsf";
      } else if (
        labelsLower.includes("gmp") ||
        productNameLower.includes("gmp")
      ) {
        certification = "gmp";
      } else if (
        labelsLower.includes("organic") ||
        productNameLower.includes("certified organic")
      ) {
        certification = "organic";
      } else if (
        labelsLower.includes("non-gmo") ||
        productNameLower.includes("non-gmo")
      ) {
        certification = "non-gmo";
      } else if (
        labelsLower.includes("informed choice") ||
        productNameLower.includes("informed choice")
      ) {
        certification = "informed-choice";
      }

      // Try to determine if it's a cognitive supplement
      let category: SupplementCategory | undefined = undefined;
      const cognitiveSuppKeywords = [
        "brain",
        "cognitive",
        "memory",
        "focus",
        "concentration",
        "mental",
        "nootropic",
        "bacopa",
        "ginkgo",
        "lion's mane",
        "alpha gpc",
        "choline",
        "phosphatidylserine",
        "huperzine",
        "rhodiola",
        "theanine",
        "ginseng",
      ];

      if (
        cognitiveSuppKeywords.some(
          (keyword) =>
            productNameLower.includes(keyword) ||
            ingredientsLower?.includes(keyword),
        )
      ) {
        category = SupplementCategory.COGNITIVE;
      }

      return {
        id: product._id,
        name: product.product_name,
        brand: product.brands,
        manufacturer: product.manufacturer ?? product.manufacturing_places,
        image: product.image_url,
        dosage: product.quantity,
        ingredients: product.ingredients_text,
        nutrientLevels: product.nutrient_levels,
        nutriments: product.nutriments,
        formulation_type,
        certification,
        category,
      };
    });

    // Filter API results by category if requested
    const filteredApiResults = category
      ? apiResults.filter((result) => result.category === category)
      : apiResults;

    // Combine local and API results, removing duplicates
    const localIds = new Set(localResults.map((item) => item.id));
    const combinedResults = [
      ...localResults,
      ...filteredApiResults.filter((item) => !localIds.has(item.id)),
    ].slice(0, limit);

    // Cache the results
    searchCache[cacheKey] = combinedResults;

    return combinedResults;
  } catch (error) {
    console.error("Error searching supplements from API:", error);

    // If API search fails, return local results as fallback
    searchCache[cacheKey] = localResults;
    return localResults;
  }
}

/**
 * Helper function to detect cognitive supplement category
 */
function detectCognitiveSupplementCategory(
  productName: string,
  ingredients?: string,
): SupplementCategory | undefined {
  const cognitiveSuppKeywords = [
    "brain",
    "cognitive",
    "memory",
    "focus",
    "concentration",
    "mental",
    "nootropic",
    "bacopa",
    "ginkgo",
    "lion's mane",
    "alpha gpc",
    "choline",
    "phosphatidylserine",
    "huperzine",
    "rhodiola",
    "theanine",
    "ginseng",
  ];

  if (
    cognitiveSuppKeywords.some(
      (keyword) =>
        productName.includes(keyword) || ingredients?.includes(keyword),
    )
  ) {
    return SupplementCategory.COGNITIVE;
  }

  return undefined;
}

/**
 * Helper function to determine formulation type
 */
function detectFormulationType(
  productName: string,
  ingredients?: string,
): string {
  if (
    productName.includes("extended release") ||
    productName.includes("extended-release") ||
    productName.includes("slow release") ||
    ingredients?.includes("extended release")
  ) {
    return "extended-release";
  }

  if (productName.includes("liposomal") || ingredients?.includes("liposomal")) {
    return "liposomal";
  }

  if (productName.includes("enteric") || ingredients?.includes("enteric")) {
    return "enteric-coated";
  }

  if (
    productName.includes("chelated") ||
    ingredients?.includes("chelate") ||
    ingredients?.includes("bisglycinate")
  ) {
    return "chelated";
  }

  if (
    productName.includes("micronized") ||
    ingredients?.includes("micronized")
  ) {
    return "micronized";
  }

  if (
    productName.includes("time release") ||
    productName.includes("time-release")
  ) {
    return "time-release";
  }

  return "";
}

/**
 * Helper function to determine certification
 */
function detectCertification(productName: string, labels?: string): string {
  if (labels?.includes("usb") || productName.includes("usb verified")) {
    return "usp"; // Corrected from 'usb' to 'usp' (United States Pharmacopeia)
  }

  if (labels?.includes("nsf") || productName.includes("nsf")) {
    return "nsf";
  }

  if (labels?.includes("gmp") || productName.includes("gmp")) {
    return "gmp";
  }

  if (
    labels?.includes("organic") ||
    productName.includes("certified organic")
  ) {
    return "organic";
  }

  if (labels?.includes("non-gmo") || productName.includes("non-gmo")) {
    return "non-gmo";
  }

  if (
    labels?.includes("informed choice") ||
    productName.includes("informed choice")
  ) {
    return "informed-choice";
  }

  return "";
}

/**
 * Get detailed information about a specific supplement
 * @param id The supplement ID
 * @returns Promise with supplement details
 */
export async function getSupplementDetails(
  id: string,
): Promise<SupplementSearchResult | null> {
  // First check if it's in our local database
  const localSupplement = allSupplements.find((s) => s.id === id);
  if (localSupplement) {
    console.log("Found supplement in local database:", localSupplement.name);
    return localSupplement;
  }

  // If it's not a local supplement, check if it's a standard ID format for Open Food Facts
  const idRegex = /^\d+$/;
  if (!idRegex.test(id)) {
    console.log("Invalid product ID format for API:", id);
    return null;
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${id}.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "HolistiQ-App/1.0 (s.kaan.yildirim@gmail.com)",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.product) {
      return null;
    }

    // Extract product data
    const productNameLower = data.product.product_name?.toLowerCase() ?? "";
    const ingredientsLower = data.product.ingredients_text?.toLowerCase() ?? "";
    const labelsLower = data.product.labels?.toLowerCase() ?? "";

    // Determine supplement properties
    const formulation_type = detectFormulationType(
      productNameLower,
      ingredientsLower,
    );
    const certification = detectCertification(productNameLower, labelsLower);
    const category = detectCognitiveSupplementCategory(
      productNameLower,
      ingredientsLower,
    );

    return {
      id: data.product._id,
      name: data.product.product_name,
      brand: data.product.brands,
      manufacturer:
        data.product.manufacturer ?? data.product.manufacturing_places,
      image: data.product.image_url,
      dosage: data.product.quantity,
      ingredients: data.product.ingredients_text,
      nutrientLevels: data.product.nutrient_levels,
      nutriments: data.product.nutriments,
      formulation_type,
      certification,
      category,
    };
  } catch (error) {
    console.error("Error getting supplement details:", error);
    return null;
  }
}

// Supplement categories
export enum SupplementCategory {
  COGNITIVE = "cognitive",
  GENERAL_HEALTH = "general_health",
  ENERGY = "energy",
  SLEEP = "sleep",
  MOOD = "mood",
  IMMUNE = "immune",
  FITNESS = "fitness",
}

// Extended supplement interface with category
export interface CommonSupplement extends SupplementSearchResult {
  category: SupplementCategory;
  benefits?: string;
  researchLevel?: "strong" | "moderate" | "preliminary";
}

// Comprehensive list of supplements with categories
export const allSupplements: CommonSupplement[] = [
  // Cognitive enhancers (nootropics)
  {
    id: "bacopa-monnieri",
    name: "Bacopa Monnieri",
    dosage: "300 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Memory enhancement, reduced anxiety",
    researchLevel: "strong",
  },
  {
    id: "lions-mane",
    name: "Lion's Mane Mushroom",
    dosage: "500-1000 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Nerve growth factor, cognitive function",
    researchLevel: "moderate",
  },
  {
    id: "ginkgo-biloba",
    name: "Ginkgo Biloba",
    dosage: "120-240 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Blood flow to brain, memory, focus",
    researchLevel: "moderate",
  },
  {
    id: "alpha-gpc",
    name: "Alpha GPC",
    dosage: "300-600 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Choline source, cognitive function",
    researchLevel: "moderate",
  },
  {
    id: "citicoline",
    name: "Citicoline (CDP-Choline)",
    dosage: "250-500 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Brain energy, memory, attention",
    researchLevel: "strong",
  },
  {
    id: "phosphatidylserine",
    name: "Phosphatidylserine",
    dosage: "100-300 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Memory, cognitive decline prevention",
    researchLevel: "strong",
  },
  {
    id: "huperzine-a",
    name: "Huperzine A",
    dosage: "50-200 mcg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Acetylcholine levels, memory",
    researchLevel: "moderate",
  },
  {
    id: "rhodiola-rosea",
    name: "Rhodiola Rosea",
    dosage: "250-500 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Mental fatigue, stress resistance",
    researchLevel: "moderate",
  },
  {
    id: "l-theanine",
    name: "L-Theanine",
    dosage: "100-200 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Focus, calm alertness",
    researchLevel: "strong",
  },
  {
    id: "panax-ginseng",
    name: "Panax Ginseng",
    dosage: "200-400 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Mental performance, energy",
    researchLevel: "moderate",
  },
  {
    id: "maritime-pine-bark",
    name: "Maritime Pine Bark Extract",
    dosage: "100-200 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Blood flow, attention, cognitive function",
    researchLevel: "moderate",
  },
  {
    id: "vinpocetine",
    name: "Vinpocetine",
    dosage: "15-30 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Cerebral blood flow, cognitive enhancement",
    researchLevel: "moderate",
  },
  {
    id: "acetyl-l-carnitine",
    name: "Acetyl-L-Carnitine",
    dosage: "500-1500 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Brain energy, memory, mental fatigue",
    researchLevel: "moderate",
  },
  {
    id: "n-acetyl-cysteine",
    name: "N-Acetyl Cysteine (NAC)",
    dosage: "600-1800 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Antioxidant, cognitive health",
    researchLevel: "moderate",
  },
  {
    id: "uridine",
    name: "Uridine Monophosphate",
    dosage: "250-500 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Synapse formation, cognitive function",
    researchLevel: "preliminary",
  },
  {
    id: "ashwagandha",
    name: "Ashwagandha",
    dosage: "300-600 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Stress reduction, cognitive function",
    researchLevel: "moderate",
  },
  {
    id: "b-vitamins",
    name: "B-Complex Vitamins",
    dosage: "1 tablet",
    category: SupplementCategory.COGNITIVE,
    benefits: "Brain energy, neurotransmitter production",
    researchLevel: "strong",
  },
  {
    id: "omega-3-dha",
    name: "Omega-3 DHA",
    dosage: "500-1000 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Brain structure, cognitive function",
    researchLevel: "strong",
  },
  {
    id: "curcumin",
    name: "Curcumin (Turmeric Extract)",
    dosage: "500-1000 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Anti-inflammatory, brain health",
    researchLevel: "moderate",
  },
  {
    id: "resveratrol",
    name: "Resveratrol",
    dosage: "100-200 mg",
    category: SupplementCategory.COGNITIVE,
    benefits: "Neuroprotection, cognitive function",
    researchLevel: "preliminary",
  },

  // General health supplements
  {
    id: "vitamin-d",
    name: "Vitamin D",
    dosage: "1000-5000 IU",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Immune function, bone health",
    researchLevel: "strong",
  },
  {
    id: "vitamin-c",
    name: "Vitamin C",
    dosage: "500-1000 mg",
    category: SupplementCategory.IMMUNE,
    benefits: "Immune support, antioxidant",
    researchLevel: "strong",
  },
  {
    id: "magnesium",
    name: "Magnesium",
    dosage: "200-400 mg",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Nervous system, muscle function",
    researchLevel: "strong",
  },
  {
    id: "zinc",
    name: "Zinc",
    dosage: "15-30 mg",
    category: SupplementCategory.IMMUNE,
    benefits: "Immune function, protein synthesis",
    researchLevel: "strong",
  },
  {
    id: "omega-3",
    name: "Omega-3 Fish Oil",
    dosage: "1000-2000 mg",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Heart health, inflammation",
    researchLevel: "strong",
  },
  {
    id: "probiotics",
    name: "Probiotics",
    dosage: "10-50 billion CFU",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Gut health, immune function",
    researchLevel: "strong",
  },
  {
    id: "multivitamin",
    name: "Multivitamin",
    dosage: "1 tablet",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Overall nutrient support",
    researchLevel: "moderate",
  },
  {
    id: "iron",
    name: "Iron",
    dosage: "15-65 mg",
    category: SupplementCategory.ENERGY,
    benefits: "Energy, oxygen transport",
    researchLevel: "strong",
  },
  {
    id: "calcium",
    name: "Calcium",
    dosage: "500-1000 mg",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Bone health, nerve function",
    researchLevel: "strong",
  },
  {
    id: "vitamin-b12",
    name: "Vitamin B12",
    dosage: "500-1000 mcg",
    category: SupplementCategory.ENERGY,
    benefits: "Energy, nerve function",
    researchLevel: "strong",
  },
  {
    id: "vitamin-d3",
    name: "Vitamin D3",
    dosage: "2000-5000 IU",
    category: SupplementCategory.GENERAL_HEALTH,
    benefits: "Immune function, bone health",
    researchLevel: "strong",
  },
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    dosage: "3-5 g",
    category: SupplementCategory.FITNESS,
    benefits: "Muscle energy, cognitive function",
    researchLevel: "strong",
  },
  {
    id: "melatonin",
    name: "Melatonin",
    dosage: "0.5-5 mg",
    category: SupplementCategory.SLEEP,
    benefits: "Sleep regulation",
    researchLevel: "strong",
  },
  {
    id: "coq10",
    name: "Coenzyme Q10",
    dosage: "100-300 mg",
    category: SupplementCategory.ENERGY,
    benefits: "Cellular energy, heart health",
    researchLevel: "moderate",
  },
];

// Common supplements for fallback/suggestions - prioritizing cognitive supplements
export const commonSupplements = allSupplements.filter(
  (supplement) =>
    supplement.category === SupplementCategory.COGNITIVE ||
    ["vitamin-d", "omega-3", "magnesium", "vitamin-b12"].includes(
      supplement.id,
    ),
);

/**
 * Convert a SupplementSearchResult to our internal Supplement type
 * Enhanced to better handle brand and formulation details
 */
export function convertToSupplement(
  result: SupplementSearchResult,
): Omit<Supplement, "id" | "color" | "user_id"> {
  // Extract dosage amount and unit if possible
  let amount: number | undefined = undefined;
  let unit: string | undefined = undefined;

  if (result.dosage) {
    // Try to parse dosage like "500 mg" into amount=500, unit="mg"
    const dosageRegex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)$/;
    const dosageMatch = dosageRegex.exec(result.dosage);
    if (dosageMatch) {
      amount = parseFloat(dosageMatch[1]);
      unit = dosageMatch[2].toLowerCase();
    }
  }

  // Build notes with available information
  let notes = "";
  if (result.ingredients) notes += `Ingredients: ${result.ingredients}\n`;

  // Determine if third-party tested based on certification
  const thirdPartyTested = result.certification ? true : undefined;

  // Estimate brand reputation based on available data (placeholder logic)
  // In a real implementation, this could be based on a database of brand ratings
  let brandReputation: number | undefined = undefined;
  if (result.brand) {
    // This is just a placeholder. In a real app, you'd use a more sophisticated approach
    const wellKnownBrands = [
      "now foods",
      "jarrow",
      "thorne",
      "life extension",
      "pure encapsulations",
    ];
    if (wellKnownBrands.some((b) => result.brand?.toLowerCase().includes(b))) {
      brandReputation = 4; // Well-known brands get a good default rating
    }
  }

  return {
    name: result.name,
    dosage: result.dosage || "",
    notes: notes.trim(),
    intake_time: new Date().toISOString(),

    // Structured dosage fields
    amount,
    unit,

    // Add enhanced brand and formulation details
    brand: result.brand,
    manufacturer: result.manufacturer,
    brand_reputation: brandReputation,
    formulation_type: result.formulation_type,
    certification: result.certification,
    third_party_tested: thirdPartyTested,

    // These fields can't be determined from the API and would need manual input
    batch_number: undefined,
    expiration_date: undefined,
  };
}
