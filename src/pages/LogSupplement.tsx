
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { CalendarIcon, Pill, Loader2, Brain, InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toISODateString } from "@/utils/supplementUtils";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementTrigger } from "@/types/achievement";
import { toast } from "@/components/ui/use-toast";
import { saveSupplement } from "@/services/supplementService";
import {
  searchSupplements,
  getSupplementDetails,
  SupplementSearchResult,
  convertToSupplement,
  commonSupplements,
  allSupplements,
  SupplementCategory
} from "@/services/supplementSearchService";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { DosageInput } from "@/components/supplements/DosageInput";
import { FrequencyInput } from "@/components/supplements/FrequencyInput";
import { BrandDetailsInput } from "@/components/supplements/BrandDetailsInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";

export default function LogSupplement() {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [intakeDate, setIntakeDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [dosageError, setDosageError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SupplementSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementSearchResult | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SupplementCategory>(SupplementCategory.COGNITIVE);

  // New state for structured dosage
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [amountError, setAmountError] = useState("");

  // New state for timing and frequency
  const [frequency, setFrequency] = useState("daily");
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [withFood, setWithFood] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [customSchedule, setCustomSchedule] = useState("");
  const [specificTime, setSpecificTime] = useState("");
  const [scheduleDaysError, setScheduleDaysError] = useState("");
  const [frequencyError, setFrequencyError] = useState("");

  // New state for brand and formulation details
  const [manufacturer, setManufacturer] = useState("");
  const [brand, setBrand] = useState("");
  const [brandReputation, setBrandReputation] = useState(0);
  const [formulationType, setFormulationType] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [thirdPartyTested, setThirdPartyTested] = useState(false);
  const [certification, setCertification] = useState("");
  const [isBrandDetailsOpen, setIsBrandDetailsOpen] = useState(false);

  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();
  const { triggerAchievement } = useAchievements();

  // We've replaced this with the new AuthenticationRequired component
  // The redirect logic is now handled in that component

  // Convert search results to combobox options
  const searchOptions: ComboboxOption[] = [
    ...commonSupplements.map(supplement => ({
      value: supplement.id,
      label: `${supplement.name} (${supplement.dosage})`
    })),
    ...searchResults.map(result => ({
      value: result.id,
      label: result.brand
        ? `${result.name} - ${result.brand}${result.dosage ? ` (${result.dosage})` : ''}`
        : `${result.name}${result.dosage ? ` (${result.dosage})` : ''}`
    }))
  ];

  // Handle supplement search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        // Even with short/empty query, show cognitive supplements as suggestions
        if (categoryFilter === SupplementCategory.COGNITIVE) {
          const cognitiveSupplements = commonSupplements.filter(
            s => s.category === SupplementCategory.COGNITIVE
          ).slice(0, 10);
          setSearchResults(cognitiveSupplements);
        } else {
          setSearchResults([]);
        }
        return;
      }

      setIsSearching(true);
      try {
        // Search with category filter
        const results = await searchSupplements(searchQuery, 15, categoryFilter);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching supplements:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, categoryFilter]);

  // Helper function to find and select a supplement by name
  const findAndSelectSupplementByName = (name: string) => {
    // Find the supplement in allSupplements by name (case-insensitive)
    const supplement = allSupplements.find(
      s => s.name.toLowerCase() === name.toLowerCase() ||
           s.name.toLowerCase().includes(name.toLowerCase())
    );

    if (supplement) {
      // Call handleSupplementSelect with the supplement's ID
      handleSupplementSelect(supplement.id);
      return true;
    }
    return false;
  };

  // Handle supplement selection
  const handleSupplementSelect = async (value: string) => {
    // Check if it's a common supplement
    const commonSupplement = commonSupplements.find(s => s.id === value);
    if (commonSupplement) {
      setName(commonSupplement.name);

      // Try to parse the dosage string (e.g., "500mg", "1000 IU")
      if (commonSupplement.dosage) {
        const dosageMatch = commonSupplement.dosage.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
        if (dosageMatch) {
          setAmount(dosageMatch[1]);
          setUnit(dosageMatch[2].toLowerCase());
          setDosage(''); // Clear legacy dosage
        } else {
          setDosage(commonSupplement.dosage);
          setAmount(''); // Clear structured amount
        }
      }

      // Set brand and formulation details if available
      if (commonSupplement.brand) {
        setBrand(commonSupplement.brand);
        setIsBrandDetailsOpen(true);
      }

      // Set notes with benefits if available for cognitive supplements
      if (commonSupplement.category === SupplementCategory.COGNITIVE && commonSupplement.benefits) {
        setNotes(`Cognitive Benefits: ${commonSupplement.benefits}\n\nResearch Level: ${commonSupplement.researchLevel || 'Preliminary'}`);
      }

      setSelectedSupplement(commonSupplement);
      return;
    }

    // Otherwise, get details from API
    try {
      const details = await getSupplementDetails(value);
      if (details) {
        setSelectedSupplement(details);
        setName(details.name);

        // Try to parse the dosage string
        if (details.dosage) {
          const dosageMatch = details.dosage.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
          if (dosageMatch) {
            setAmount(dosageMatch[1]);
            setUnit(dosageMatch[2].toLowerCase());
            setDosage(''); // Clear legacy dosage
          } else {
            setDosage(details.dosage || '');
            setAmount(''); // Clear structured amount
          }
        }

        // Set brand and formulation details if available
        if (details.brand) {
          setBrand(details.brand);
          setIsBrandDetailsOpen(true);
        }

        if (details.manufacturer) {
          setManufacturer(details.manufacturer);
          setIsBrandDetailsOpen(true);
        }

        if (details.formulation_type) {
          setFormulationType(details.formulation_type);
          setIsBrandDetailsOpen(true);
        }

        if (details.certification) {
          setCertification(details.certification);
          setThirdPartyTested(true);
          setIsBrandDetailsOpen(true);
        }

        // Set notes with ingredients and cognitive benefits if available
        let notesText = '';

        if (details.category === SupplementCategory.COGNITIVE) {
          notesText += `Cognitive Supplement\n\n`;
        }

        if (details.ingredients) {
          notesText += `Ingredients: ${details.ingredients}\n\n`;
        }

        if (details.benefits) {
          notesText += `Benefits: ${details.benefits}`;
        }

        setNotes(notesText.trim());
      }
    } catch (error) {
      console.error('Error getting supplement details:', error);
    }
  };

  // Validate form fields
  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setNameError("");
    setDosageError("");
    setAmountError("");
    setScheduleDaysError("");
    setFrequencyError("");

    // Validate name
    if (!name.trim()) {
      setNameError("Supplement name is required");
      isValid = false;
    } else if (name.length > 100) {
      setNameError("Name must be less than 100 characters");
      isValid = false;
    }

    // Validate structured dosage (amount and unit)
    if (amount) {
      if (isNaN(parseFloat(amount))) {
        setAmountError("Amount must be a number");
        isValid = false;
      } else if (parseFloat(amount) <= 0) {
        setAmountError("Amount must be greater than zero");
        isValid = false;
      }
    }

    // If no structured amount/unit is provided, validate the legacy dosage field
    if (!amount && !dosage.trim()) {
      setDosageError("Please enter either a structured dosage or free-text dosage");
      isValid = false;
    } else if (!amount && dosage.length > 50) {
      setDosageError("Dosage must be less than 50 characters");
      isValid = false;
    }

    // Validate frequency
    if (!frequency) {
      setFrequencyError("Please select a frequency");
      isValid = false;
    }

    // Validate custom schedule - ensure at least one day is selected
    if (frequency === "custom" && scheduleDays.length === 0) {
      setScheduleDaysError("Please select at least one day for your custom schedule");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to log supplements",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the intake time
      let intake_time = intakeDate ? new Date(intakeDate) : new Date();

      // If specific time is provided, update the intake time
      if (specificTime) {
        const [hours, minutes] = specificTime.split(':').map(Number);
        intake_time.setHours(hours, minutes);
      }

      // Convert to ISO string using our utility function
      const intake_time_iso = toISODateString(intake_time) || new Date().toISOString();

      // Prepare schedule data if using custom frequency
      const scheduleData = frequency === "custom" ? {
        days: scheduleDays.length > 0 ? scheduleDays : undefined,
        custom: customSchedule || undefined
      } : undefined;

      // Prepare supplement data with new fields
      let supplementData = {
        name,
        dosage: amount && unit ? `${amount} ${unit}` : dosage, // For backward compatibility
        notes,
        intake_time: intake_time_iso,

        // New structured dosage fields
        amount: amount ? parseFloat(amount) : undefined,
        unit: amount ? unit : undefined,

        // New timing and frequency fields
        frequency,
        time_of_day: timeOfDay,
        with_food: withFood,
        schedule: scheduleData,
        specific_time: specificTime || undefined,

        // New brand and formulation fields
        manufacturer: manufacturer || undefined,
        brand: brand || undefined,
        brand_reputation: brandReputation > 0 ? brandReputation : undefined,
        formulation_type: formulationType || undefined,
        batch_number: batchNumber || undefined,
        expiration_date: toISODateString(expirationDate),
        third_party_tested: thirdPartyTested,
        certification: certification || undefined
      };

      // If we have a selected supplement from the API, use its data
      if (selectedSupplement) {
        const baseData = convertToSupplement(selectedSupplement);

        // Merge with our structured data
        supplementData = {
          ...baseData,
          ...supplementData,
          // Override with user-provided values if they've been changed
          name: name !== selectedSupplement.name ? name : baseData.name,
          notes: notes || baseData.notes,
          intake_time: intake_time_iso
        };
      }

      // Save supplement using the service
      const result = await saveSupplement(user.id, supplementData);

      if (!result.success) throw new Error(result.error);

      // Trigger achievements
      if (user) {
        // First supplement achievement
        triggerAchievement(AchievementTrigger.SUPPLEMENT_LOGGED);

        // Supplement variety achievement (pass supplement ID for uniqueness check)
        if (selectedSupplement) {
          triggerAchievement(AchievementTrigger.SUPPLEMENT_LOGGED, {
            supplementId: selectedSupplement.id
          });
        }
      }

      toast({
        title: "Success",
        description: "Supplement logged successfully"
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error logging supplement:", error);
      toast({
        title: "Error",
        description: "Failed to log supplement",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Authentication handling is now done via conditional rendering
  // The AuthenticationRequired component handles the notification and redirect

  // Render loading state
  if (loading) {
    return (
      <div className="container py-8 md:py-12 max-w-screen-xl">
        <Card className="mx-auto">
          <CardHeader className="pb-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not authenticated, show authentication notification instead of the form
  if (!user) {
    return (
      <AuthenticationRequired
        message="You need to be logged in to track supplements and monitor their effects on your cognitive performance."
      />
    );
  }

  // Only render the actual form if user is authenticated
  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <Card className="mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl md:text-3xl">Log Supplement</CardTitle>
          <CardDescription className="text-base">
            Record a supplement you're taking to track its effects.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Search and Basic Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                {/* Supplement Search */}
                <div className="space-y-4 bg-secondary/10 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <Label className="text-base font-medium">Search Supplements</Label>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <Brain className="h-3 w-3 mr-1" />
                          Cognitive Focus
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Prioritizing supplements with cognitive effects
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label htmlFor="category-filter" className="whitespace-nowrap">Filter by:</Label>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => setCategoryFilter(value as SupplementCategory)}
                      >
                        <SelectTrigger id="category-filter" className="w-[180px]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={SupplementCategory.COGNITIVE}>Cognitive</SelectItem>
                          <SelectItem value={SupplementCategory.GENERAL_HEALTH}>General Health</SelectItem>
                          <SelectItem value={SupplementCategory.ENERGY}>Energy</SelectItem>
                          <SelectItem value={SupplementCategory.MOOD}>Mood</SelectItem>
                          <SelectItem value={SupplementCategory.IMMUNE}>Immune</SelectItem>
                          <SelectItem value={SupplementCategory.FITNESS}>Fitness</SelectItem>
                          <SelectItem value={SupplementCategory.SLEEP}>Sleep</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="relative">
                    <Combobox
                      options={searchOptions}
                      onValueChange={handleSupplementSelect}
                      placeholder="Search for a supplement..."
                      emptyMessage={isSearching ? "Searching..." : "No supplements found. Try a different search term or enter manually."}
                      disabled={isSubmitting}
                      loading={isSearching}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Informational notice for non-cognitive supplement categories */}
                  {categoryFilter !== SupplementCategory.COGNITIVE && (
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                      <InfoIcon className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        HolistiQ currently focuses on measuring cognitive performance effects. While you can log supplements from other categories, our analytics and tracking tools are optimized for cognitive supplements. Support for measuring effects of other supplement categories will be added in future updates as our assessment tools expand.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {categoryFilter === SupplementCategory.COGNITIVE && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-blue-50 border-blue-200 hover:bg-blue-100"
                          onClick={() => {
                            setSearchQuery("bacopa");
                            findAndSelectSupplementByName("Bacopa Monnieri");
                          }}
                        >
                          Bacopa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-blue-50 border-blue-200 hover:bg-blue-100"
                          onClick={() => {
                            setSearchQuery("ginkgo");
                            findAndSelectSupplementByName("Ginkgo Biloba");
                          }}
                        >
                          Ginkgo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-blue-50 border-blue-200 hover:bg-blue-100"
                          onClick={() => {
                            setSearchQuery("lion's mane");
                            findAndSelectSupplementByName("Lion's Mane Mushroom");
                          }}
                        >
                          Lion's Mane
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-blue-50 border-blue-200 hover:bg-blue-100"
                          onClick={() => {
                            setSearchQuery("alpha gpc");
                            findAndSelectSupplementByName("Alpha GPC");
                          }}
                        >
                          Alpha GPC
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 bg-blue-50 border-blue-200 hover:bg-blue-100"
                          onClick={() => {
                            setSearchQuery("l-theanine");
                            findAndSelectSupplementByName("L-Theanine");
                          }}
                        >
                          L-Theanine
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Left Column - Basic Info */}
              <div className="space-y-6 lg:col-span-1">
                {/* Supplement Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">Supplement Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alpha GPC, Lion's Mane, etc."
                    className={nameError ? "border-red-500" : ""}
                  />
                  {nameError && <p className="text-sm text-red-500">{nameError}</p>}
                </div>

                {/* Structured Dosage */}
                <DosageInput
                  amount={amount}
                  setAmount={setAmount}
                  unit={unit}
                  setUnit={setUnit}
                  amountError={amountError}
                  className="space-y-2"
                />

                {/* Legacy Dosage (for backward compatibility) */}
                <div className="space-y-2">
                  <Label htmlFor="dosage" className="text-base font-medium">Alternative Dosage Format</Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 300mg, 1000mg, etc."
                    className={dosageError && !amount ? "border-red-500" : ""}
                  />
                  {dosageError && !amount && <p className="text-sm text-red-500">{dosageError}</p>}
                  <p className="text-xs text-muted-foreground">
                    Use this field if you prefer to enter dosage as free text
                  </p>
                </div>
              </div>

              {/* Middle Column - Timing & Frequency */}
              <div className="space-y-6 lg:col-span-1">
                {/* Frequency and Timing */}
                <div className="bg-secondary/5 p-4 rounded-lg">
                  <h3 className="text-base font-medium mb-4">Timing & Frequency</h3>
                  <FrequencyInput
                    frequency={frequency}
                    setFrequency={setFrequency}
                    timeOfDay={timeOfDay}
                    setTimeOfDay={setTimeOfDay}
                    withFood={withFood}
                    setWithFood={setWithFood}
                    scheduleDays={scheduleDays}
                    setScheduleDays={setScheduleDays}
                    customSchedule={customSchedule}
                    setCustomSchedule={setCustomSchedule}
                    specificTime={specificTime}
                    setSpecificTime={setSpecificTime}
                    scheduleDaysError={scheduleDaysError}
                    frequencyError={frequencyError}
                  />
                </div>

                {/* Intake Date & Time */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Intake Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {intakeDate ? format(intakeDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={intakeDate}
                        onSelect={setIntakeDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Select when you took this supplement. Defaults to current date and time.
                  </p>
                </div>
              </div>

              {/* Right Column - Brand Details & Notes */}
              <div className="space-y-6 lg:col-span-1">
                {/* Brand and Formulation Details */}
                <BrandDetailsInput
                  manufacturer={manufacturer}
                  setManufacturer={setManufacturer}
                  brand={brand}
                  setBrand={setBrand}
                  brandReputation={brandReputation}
                  setBrandReputation={setBrandReputation}
                  formulationType={formulationType}
                  setFormulationType={setFormulationType}
                  batchNumber={batchNumber}
                  setBatchNumber={setBatchNumber}
                  expirationDate={expirationDate}
                  setExpirationDate={setExpirationDate}
                  thirdPartyTested={thirdPartyTested}
                  setThirdPartyTested={setThirdPartyTested}
                  certification={certification}
                  setCertification={setCertification}
                  isOpen={isBrandDetailsOpen}
                  setIsOpen={setIsBrandDetailsOpen}
                />

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional details about brand, effects, etc."
                    rows={5}
                    className="resize-y"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 w-full sm:w-auto order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Pill className="h-4 w-4" />
                  Save Supplement
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
