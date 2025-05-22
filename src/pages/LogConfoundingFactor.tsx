import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthenticationRequired } from "@/components/auth/AuthenticationRequired";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Moon,
  Activity,
  Coffee,
  Dumbbell,
  MapPin,
  Volume2,
  Thermometer,
  Smile,
  Battery,
  CalendarIcon,
  Clock,
  Plus,
  Minus,
  Loader2
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { saveConfoundingFactor } from "@/services/confoundingFactorService";
import {
  exerciseTypes,
  locationOptions,
  mealTypes
} from "@/types/confoundingFactor";

export default function LogConfoundingFactor() {
  const navigate = useNavigate();
  const { user, loading } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("sleep");

  // Date and time
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(), "HH:mm"));

  // Sleep factors
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);

  // Stress factors
  const [stressLevel, setStressLevel] = useState<number | null>(null);

  // Exercise factors
  const [exerciseDuration, setExerciseDuration] = useState<number | null>(null);
  const [exerciseIntensity, setExerciseIntensity] = useState<number | null>(null);
  const [exerciseType, setExerciseType] = useState<string | null>(null);

  // Diet factors
  const [caffeineIntake, setCaffeineIntake] = useState<number | null>(null);
  const [alcoholIntake, setAlcoholIntake] = useState<number | null>(null);
  const [waterIntake, setWaterIntake] = useState<number | null>(null);
  const [meals, setMeals] = useState<{ time: string; type: string }[]>([]);

  // Environmental factors
  const [location, setLocation] = useState<string | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);

  // Health factors
  const [mood, setMood] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [illness, setIllness] = useState(false);
  const [illnessDetails, setIllnessDetails] = useState("");

  // Additional notes
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format the recorded_at timestamp
      const recordedAt = date ? new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        parseInt(time.split(":")[0]),
        parseInt(time.split(":")[1])
      ).toISOString() : new Date().toISOString();

      const result = await saveConfoundingFactor(user.id, {
        recorded_at: recordedAt,
        sleep_duration: sleepDuration,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
        exercise_duration: exerciseDuration,
        exercise_intensity: exerciseIntensity,
        exercise_type: exerciseType,
        meal_timing: meals.length > 0 ? meals : undefined,
        caffeine_intake: caffeineIntake,
        alcohol_intake: alcoholIntake,
        water_intake: waterIntake,
        location,
        noise_level: noiseLevel,
        temperature,
        mood,
        energy_level: energyLevel,
        illness,
        illness_details: illnessDetails,
        notes
      });

      if (result.success) {
        toast({
          title: "Factors logged successfully",
          description: "Your confounding factors have been saved.",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error saving factors",
          description: result.error || "An unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving confounding factors:", error);
      toast({
        title: "Error",
        description: "Failed to save confounding factors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMeal = () => {
    setMeals([...meals, { time: format(new Date(), "HH:mm"), type: "snack" }]);
  };

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const updateMeal = (index: number, field: "time" | "type", value: string) => {
    const updatedMeals = [...meals];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setMeals(updatedMeals);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container py-8 md:py-12 max-w-screen-xl">
        <Card className="mx-auto max-w-4xl">
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

  // If user is not authenticated, show authentication required component
  if (!user) {
    return (
      <AuthenticationRequired
        message="You need to be logged in to track confounding factors that may affect your cognitive performance."
      />
    );
  }

  return (
    <div className="container py-8 md:py-12 max-w-screen-xl">
      <Card className="mx-auto max-w-4xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl md:text-3xl">Log Confounding Factors</CardTitle>
          <CardDescription className="text-base">
            Track variables that might affect your cognitive performance beyond supplements.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tabs for different factor categories */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 md:grid-cols-6">
                <TabsTrigger value="sleep" className="flex items-center gap-1">
                  <Moon className="h-4 w-4" />
                  <span className="hidden md:inline">Sleep</span>
                </TabsTrigger>
                <TabsTrigger value="stress" className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  <span className="hidden md:inline">Stress</span>
                </TabsTrigger>
                <TabsTrigger value="exercise" className="flex items-center gap-1">
                  <Dumbbell className="h-4 w-4" />
                  <span className="hidden md:inline">Exercise</span>
                </TabsTrigger>
                <TabsTrigger value="diet" className="flex items-center gap-1">
                  <Coffee className="h-4 w-4" />
                  <span className="hidden md:inline">Diet</span>
                </TabsTrigger>
                <TabsTrigger value="environment" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden md:inline">Environment</span>
                </TabsTrigger>
                <TabsTrigger value="health" className="flex items-center gap-1">
                  <Smile className="h-4 w-4" />
                  <span className="hidden md:inline">Health</span>
                </TabsTrigger>
              </TabsList>

              {/* Sleep Tab */}
              <TabsContent value="sleep" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="sleep-duration">Sleep Duration (hours)</Label>
                      <span className="text-sm text-muted-foreground">
                        {sleepDuration ? (sleepDuration / 60).toFixed(1) : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        id="sleep-duration"
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        placeholder="Hours"
                        value={sleepDuration ? (sleepDuration / 60).toString() : ""}
                        onChange={(e) => setSleepDuration(e.target.value ? parseFloat(e.target.value) * 60 : null)}
                        className="w-24"
                      />
                      <Slider
                        value={sleepDuration ? [sleepDuration / 60] : [7]}
                        min={0}
                        max={12}
                        step={0.5}
                        onValueChange={(value) => setSleepDuration(value[0] * 60)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="sleep-quality">Sleep Quality</Label>
                      <span className="text-sm text-muted-foreground">
                        {sleepQuality ? `${sleepQuality}/10` : "Not set"}
                      </span>
                    </div>
                    <Slider
                      id="sleep-quality"
                      value={sleepQuality ? [sleepQuality] : [5]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => setSleepQuality(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Stress Tab */}
              <TabsContent value="stress" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="stress-level">Stress Level</Label>
                    <span className="text-sm text-muted-foreground">
                      {stressLevel ? `${stressLevel}/10` : "Not set"}
                    </span>
                  </div>
                  <Slider
                    id="stress-level"
                    value={stressLevel ? [stressLevel] : [5]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => setStressLevel(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very relaxed</span>
                    <span>Very stressed</span>
                  </div>
                </div>
              </TabsContent>

              {/* Exercise Tab */}
              <TabsContent value="exercise" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exercise-type">Exercise Type</Label>
                    <Select value={exerciseType || ""} onValueChange={setExerciseType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select exercise type" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="exercise-duration">Duration (minutes)</Label>
                      <span className="text-sm text-muted-foreground">
                        {exerciseDuration ? `${exerciseDuration} min` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        id="exercise-duration"
                        type="number"
                        min="0"
                        max="300"
                        step="5"
                        placeholder="Minutes"
                        value={exerciseDuration?.toString() || ""}
                        onChange={(e) => setExerciseDuration(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-24"
                      />
                      <Slider
                        value={exerciseDuration ? [exerciseDuration] : [30]}
                        min={0}
                        max={180}
                        step={5}
                        onValueChange={(value) => setExerciseDuration(value[0])}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="exercise-intensity">Intensity</Label>
                      <span className="text-sm text-muted-foreground">
                        {exerciseIntensity ? `${exerciseIntensity}/10` : "Not set"}
                      </span>
                    </div>
                    <Slider
                      id="exercise-intensity"
                      value={exerciseIntensity ? [exerciseIntensity] : [5]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => setExerciseIntensity(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Light</span>
                      <span>Intense</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Diet Tab */}
              <TabsContent value="diet" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="caffeine-intake">Caffeine Intake (mg)</Label>
                      <span className="text-sm text-muted-foreground">
                        {caffeineIntake ? `${caffeineIntake} mg` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        id="caffeine-intake"
                        type="number"
                        min="0"
                        max="1000"
                        step="10"
                        placeholder="mg"
                        value={caffeineIntake?.toString() || ""}
                        onChange={(e) => setCaffeineIntake(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-24"
                      />
                      <Slider
                        value={caffeineIntake ? [caffeineIntake] : [0]}
                        min={0}
                        max={500}
                        step={10}
                        onValueChange={(value) => setCaffeineIntake(value[0])}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reference: Coffee (95mg), Tea (40mg), Energy Drink (80mg)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="alcohol-intake">Alcohol Intake (drinks)</Label>
                      <span className="text-sm text-muted-foreground">
                        {alcoholIntake ? `${alcoholIntake} drinks` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        id="alcohol-intake"
                        type="number"
                        min="0"
                        max="20"
                        step="1"
                        placeholder="Drinks"
                        value={alcoholIntake?.toString() || ""}
                        onChange={(e) => setAlcoholIntake(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-24"
                      />
                      <Slider
                        value={alcoholIntake ? [alcoholIntake] : [0]}
                        min={0}
                        max={10}
                        step={1}
                        onValueChange={(value) => setAlcoholIntake(value[0])}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="water-intake">Water Intake (ml)</Label>
                      <span className="text-sm text-muted-foreground">
                        {waterIntake ? `${waterIntake} ml` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        id="water-intake"
                        type="number"
                        min="0"
                        max="5000"
                        step="100"
                        placeholder="ml"
                        value={waterIntake?.toString() || ""}
                        onChange={(e) => setWaterIntake(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-24"
                      />
                      <Slider
                        value={waterIntake ? [waterIntake] : [2000]}
                        min={0}
                        max={4000}
                        step={100}
                        onValueChange={(value) => setWaterIntake(value[0])}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Meals</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMeal}
                        className="h-8 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Meal
                      </Button>
                    </div>

                    {meals.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No meals logged</p>
                    ) : (
                      <div className="space-y-2">
                        {meals.map((meal, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={meal.time}
                              onChange={(e) => updateMeal(index, "time", e.target.value)}
                              className="w-32"
                            />
                            <Select
                              value={meal.type}
                              onValueChange={(value) => updateMeal(index, "type", value)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {mealTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMeal(index)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Environment Tab */}
              <TabsContent value="environment" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select value={location || ""} onValueChange={setLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="noise-level">Noise Level</Label>
                      <span className="text-sm text-muted-foreground">
                        {noiseLevel ? `${noiseLevel}/10` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        id="noise-level"
                        value={noiseLevel ? [noiseLevel] : [3]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setNoiseLevel(value[0])}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Silent</span>
                      <span>Very noisy</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="temperature">Temperature (°C)</Label>
                      <span className="text-sm text-muted-foreground">
                        {temperature ? `${temperature}°C` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        id="temperature"
                        value={temperature ? [temperature] : [22]}
                        min={10}
                        max={35}
                        step={1}
                        onValueChange={(value) => setTemperature(value[0])}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Cold</span>
                      <span>Hot</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Health Tab */}
              <TabsContent value="health" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="mood">Mood</Label>
                      <span className="text-sm text-muted-foreground">
                        {mood ? `${mood}/10` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smile className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        id="mood"
                        value={mood ? [mood] : [5]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setMood(value[0])}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="energy-level">Energy Level</Label>
                      <span className="text-sm text-muted-foreground">
                        {energyLevel ? `${energyLevel}/10` : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        id="energy-level"
                        value={energyLevel ? [energyLevel] : [5]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(value) => setEnergyLevel(value[0])}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="illness" className="flex-1">Feeling ill?</Label>
                      <Switch
                        id="illness"
                        checked={illness}
                        onCheckedChange={setIllness}
                      />
                    </div>
                  </div>

                  {illness && (
                    <div className="space-y-2">
                      <Label htmlFor="illness-details">Illness Details</Label>
                      <Textarea
                        id="illness-details"
                        placeholder="Describe your symptoms..."
                        value={illnessDetails}
                        onChange={(e) => setIllnessDetails(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any other factors that might affect your cognitive performance..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Factors"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
