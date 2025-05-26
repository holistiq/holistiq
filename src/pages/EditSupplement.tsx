import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Pill, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toISODateString } from "@/utils/supplementUtils";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { toast } from "@/components/ui/use-toast";
import { updateSupplement } from "@/services/supplementService";
import { Supplement } from "@/types/supplement";
import { DosageInput } from "@/components/supplements/DosageInput";
import { FrequencyInput } from "@/components/supplements/FrequencyInput";
import { BrandDetailsInput } from "@/components/supplements/BrandDetailsInput";
import { SupplementEvaluationStatus } from "@/components/supplements/SupplementEvaluationStatus";

export default function EditSupplement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplement, setSupplement] = useState<Supplement | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [intakeDate, setIntakeDate] = useState<Date | undefined>(new Date());
  const [nameError, setNameError] = useState("");
  const [dosageError, setDosageError] = useState("");

  // Structured dosage state
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [amountError, setAmountError] = useState("");

  // Timing and frequency state
  const [frequency, setFrequency] = useState("daily");
  const [timeOfDay, setTimeOfDay] = useState("morning");
  const [withFood, setWithFood] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [customSchedule, setCustomSchedule] = useState("");
  const [specificTime, setSpecificTime] = useState("");
  const [scheduleDaysError, setScheduleDaysError] = useState("");
  const [frequencyError, setFrequencyError] = useState("");

  // Brand and formulation details state
  const [manufacturer, setManufacturer] = useState("");
  const [brand, setBrand] = useState("");
  const [brandReputation, setBrandReputation] = useState(0);
  const [formulationType, setFormulationType] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    undefined,
  );
  const [thirdPartyTested, setThirdPartyTested] = useState(false);
  const [certification, setCertification] = useState("");
  const [isBrandDetailsOpen, setIsBrandDetailsOpen] = useState(false);

  // Load supplement data from location state
  useEffect(() => {
    if (location.state?.supplement) {
      const supplementData = location.state.supplement as Supplement;
      setSupplement(supplementData);

      // Set basic info
      setName(supplementData.name);
      setDosage(supplementData.dosage || "");
      setNotes(supplementData.notes || "");

      // Set intake date
      if (supplementData.intake_time) {
        try {
          setIntakeDate(parseISO(supplementData.intake_time));
        } catch (error) {
          console.error("Error parsing intake date:", error);
          setIntakeDate(new Date());
        }
      }

      // Set structured dosage
      if (supplementData.amount) {
        setAmount(supplementData.amount.toString());
        setUnit(supplementData.unit || "mg");
      }

      // Set timing and frequency
      if (supplementData.frequency) {
        setFrequency(supplementData.frequency);
      }
      if (supplementData.time_of_day) {
        setTimeOfDay(supplementData.time_of_day);
      }
      setWithFood(supplementData.with_food || false);
      if (supplementData.schedule?.days) {
        setScheduleDays(supplementData.schedule.days);
      }
      if (supplementData.schedule?.custom) {
        setCustomSchedule(supplementData.schedule.custom);
      }
      if (supplementData.specific_time) {
        setSpecificTime(supplementData.specific_time);
      }

      // Set brand and formulation details
      if (
        supplementData.manufacturer ||
        supplementData.brand ||
        supplementData.formulation_type ||
        supplementData.batch_number ||
        supplementData.expiration_date ||
        supplementData.third_party_tested ||
        supplementData.certification
      ) {
        setIsBrandDetailsOpen(true);

        if (supplementData.manufacturer) {
          setManufacturer(supplementData.manufacturer);
        }
        if (supplementData.brand) {
          setBrand(supplementData.brand);
        }
        if (supplementData.brand_reputation) {
          setBrandReputation(supplementData.brand_reputation);
        }
        if (supplementData.formulation_type) {
          setFormulationType(supplementData.formulation_type);
        }
        if (supplementData.batch_number) {
          setBatchNumber(supplementData.batch_number);
        }
        if (supplementData.expiration_date) {
          try {
            setExpirationDate(parseISO(supplementData.expiration_date));
          } catch (error) {
            console.error("Error parsing expiration date:", error);
          }
        }
        setThirdPartyTested(supplementData.third_party_tested || false);
        if (supplementData.certification) {
          setCertification(supplementData.certification);
        }
      }
    } else {
      // No supplement data provided, redirect back to supplements list
      toast({
        title: "Error",
        description: "No supplement selected for editing",
        variant: "destructive",
      });
      navigate("/supplements");
    }
  }, [location.state, navigate]);

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
      setDosageError(
        "Please enter either a structured dosage or free-text dosage",
      );
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
      setScheduleDaysError(
        "Please select at least one day for your custom schedule",
      );
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplement) {
      toast({
        title: "Error",
        description: "No supplement data available for update",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update supplements",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the intake time
      const intake_time = intakeDate ? new Date(intakeDate) : new Date();

      // If specific time is provided, update the intake time
      if (specificTime) {
        const [hours, minutes] = specificTime.split(":").map(Number);
        intake_time.setHours(hours, minutes);
      }

      // Convert to ISO string using our utility function
      const intake_time_iso =
        toISODateString(intake_time) || new Date().toISOString();

      // Prepare schedule data if using custom frequency
      const scheduleData =
        frequency === "custom"
          ? {
              days: scheduleDays.length > 0 ? scheduleDays : undefined,
              custom: customSchedule || undefined,
            }
          : undefined;

      // Prepare supplement data with updated fields
      const updatedSupplementData = {
        name,
        dosage: amount && unit ? `${amount} ${unit}` : dosage, // For backward compatibility
        notes,
        intake_time: intake_time_iso,

        // Structured dosage fields
        amount: amount ? parseFloat(amount) : undefined,
        unit: amount ? unit : undefined,

        // Timing and frequency fields
        frequency,
        time_of_day: timeOfDay,
        with_food: withFood,
        schedule: scheduleData,
        specific_time: specificTime || undefined,

        // Brand and formulation fields
        manufacturer: manufacturer || undefined,
        brand: brand || undefined,
        brand_reputation: brandReputation > 0 ? brandReputation : undefined,
        formulation_type: formulationType || undefined,
        batch_number: batchNumber || undefined,
        expiration_date: toISODateString(expirationDate),
        third_party_tested: thirdPartyTested,
        certification: certification || undefined,
      };

      // Update the supplement
      const result = await updateSupplement(
        user.id,
        supplement.id,
        updatedSupplementData,
      );

      if (!result.success) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Supplement updated successfully",
      });

      navigate("/supplements");
    } catch (error) {
      console.error("Error updating supplement:", error);
      toast({
        title: "Error",
        description: "Failed to update supplement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no supplement data is loaded yet, show loading state
  if (!supplement) {
    return (
      <div className="container py-8 md:py-12 max-w-screen-xl">
        <Card className="mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl md:text-3xl">
              Edit Supplement
            </CardTitle>
            <CardDescription className="text-base">
              Loading supplement data...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <Card className="mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/supplements")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl md:text-3xl">
              Edit Supplement
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            Update the details of your supplement.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-6 lg:col-span-1">
                {/* Supplement Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Supplement Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Alpha GPC, Lion's Mane, etc."
                    className={nameError ? "border-red-500" : ""}
                  />
                  {nameError && (
                    <p className="text-sm text-red-500">{nameError}</p>
                  )}
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
                  <Label htmlFor="dosage" className="text-base font-medium">
                    Alternative Dosage Format
                  </Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g., 300mg, 1000mg, etc."
                    className={dosageError && !amount ? "border-red-500" : ""}
                  />
                  {dosageError && !amount && (
                    <p className="text-sm text-red-500">{dosageError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Use this field if you prefer to enter dosage as free text
                  </p>
                </div>
              </div>

              {/* Middle Column - Timing & Frequency */}
              <div className="space-y-6 lg:col-span-1">
                {/* Frequency and Timing */}
                <div className="bg-secondary/5 p-4 rounded-lg">
                  <h3 className="text-base font-medium mb-4">
                    Timing & Frequency
                  </h3>
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
                  <Label className="text-base font-medium">
                    Intake Date & Time
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {intakeDate ? (
                          format(intakeDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
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
                    Select when you took this supplement.
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
                  <Label htmlFor="notes" className="text-base font-medium">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional details about brand, effects, etc."
                    rows={5}
                    className="resize-y"
                  />
                </div>

                {/* Supplement Evaluation Status */}
                {supplement && (
                  <div className="mt-6 space-y-2">
                    <Label className="text-base font-medium">
                      Evaluation Status
                    </Label>
                    <SupplementEvaluationStatus
                      supplement={supplement}
                      onStatusChange={() => {}}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Track your progress in evaluating this supplement's
                      effectiveness
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/supplements")}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pill className="h-4 w-4" />
                  Update Supplement
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
