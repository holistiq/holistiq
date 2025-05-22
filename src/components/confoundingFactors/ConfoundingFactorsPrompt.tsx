/**
 * Confounding Factors Prompt Component
 *
 * Prompts users to log confounding factors after completing a cognitive test
 */
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Moon,
  Activity,
  Coffee,
  Dumbbell,
  MapPin,
  Loader2,
  Thermometer,
  Smile,
  Battery,
  Volume2
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { saveConfoundingFactor } from "@/services/confoundingFactorService";
import {
  exerciseTypes,
  locationOptions,
  ConfoundingFactorInput
} from "@/types/confoundingFactor";

interface ConfoundingFactorsPromptProps {
  /** User ID for saving the factors */
  userId: string;
  /** Test ID to link with the factors */
  testId?: string;
  /** Callback when factors are completed */
  onComplete: (factorId: string) => void;
  /** Callback when factors are skipped */
  onSkip: () => void;
}

/**
 * Component that prompts users to log confounding factors after completing a test
 */
export function ConfoundingFactorsPrompt({
  userId,
  testId,
  onComplete,
  onSkip
}: ConfoundingFactorsPromptProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState("sleep");
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for form fields
  const [sleepDuration, setSleepDuration] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [exerciseDuration, setExerciseDuration] = useState<number | null>(null);
  const [exerciseIntensity, setExerciseIntensity] = useState<number | null>(null);
  const [exerciseType, setExerciseType] = useState<string | null>(null);
  const [caffeineIntake, setCaffeineIntake] = useState<number | null>(null);
  const [alcoholIntake, setAlcoholIntake] = useState<number | null>(null);
  const [waterIntake, setWaterIntake] = useState<number | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [illness, setIllness] = useState(false);
  const [illnessDetails, setIllnessDetails] = useState("");
  const [notes, setNotes] = useState("");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create factor input object
      const factorInput: ConfoundingFactorInput = {
        recorded_at: new Date().toISOString(),
        sleep_duration: sleepDuration,
        sleep_quality: sleepQuality,
        stress_level: stressLevel,
        exercise_duration: exerciseDuration,
        exercise_intensity: exerciseIntensity,
        exercise_type: exerciseType || undefined,
        caffeine_intake: caffeineIntake,
        alcohol_intake: alcoholIntake,
        water_intake: waterIntake,
        location: location || undefined,
        noise_level: noiseLevel,
        temperature: temperature,
        mood: mood,
        energy_level: energyLevel,
        illness: illness || undefined,
        illness_details: illness ? illnessDetails : undefined,
        notes: notes || undefined
      };
      
      // Save the factor
      const result = await saveConfoundingFactor(userId, factorInput);
      
      if (result.success && result.data) {
        toast({
          title: "Factors saved",
          description: "Your confounding factors have been recorded."
        });
        
        // Call the onComplete callback with the factor ID
        onComplete(result.data.id);
      } else {
        throw new Error(result.error || "Failed to save factors");
      }
    } catch (error) {
      console.error("Error saving confounding factors:", error);
      toast({
        title: "Error saving factors",
        description: "There was a problem saving your factors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle className="text-2xl">Log Confounding Factors</CardTitle>
        <CardDescription>
          Track variables that might have affected your cognitive performance during this test.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent>
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
            <TabsContent value="sleep" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sleep-duration">Sleep Duration (hours)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="sleep-duration"
                      min={0}
                      max={12}
                      step={0.5}
                      value={sleepDuration !== null ? [sleepDuration] : [7]}
                      onValueChange={(value) => setSleepDuration(value[0])}
                    />
                    <span className="w-12 text-center">{sleepDuration ?? 7}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="sleep-quality">Sleep Quality (1-10)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="sleep-quality"
                      min={1}
                      max={10}
                      step={1}
                      value={sleepQuality !== null ? [sleepQuality] : [5]}
                      onValueChange={(value) => setSleepQuality(value[0])}
                    />
                    <span className="w-12 text-center">{sleepQuality ?? 5}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Stress Tab */}
            <TabsContent value="stress" className="space-y-4">
              <div>
                <Label htmlFor="stress-level">Stress Level (1-10)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    id="stress-level"
                    min={1}
                    max={10}
                    step={1}
                    value={stressLevel !== null ? [stressLevel] : [5]}
                    onValueChange={(value) => setStressLevel(value[0])}
                  />
                  <span className="w-12 text-center">{stressLevel ?? 5}</span>
                </div>
              </div>
            </TabsContent>
            
            {/* Exercise Tab */}
            <TabsContent value="exercise" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exercise-duration">Exercise Duration (minutes)</Label>
                  <Input
                    id="exercise-duration"
                    type="number"
                    min={0}
                    max={300}
                    value={exerciseDuration !== null ? exerciseDuration : ""}
                    onChange={(e) => setExerciseDuration(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="exercise-type">Exercise Type</Label>
                  <Select value={exerciseType || ""} onValueChange={setExerciseType}>
                    <SelectTrigger id="exercise-type" className="mt-1">
                      <SelectValue placeholder="Select type" />
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
                
                <div className="md:col-span-2">
                  <Label htmlFor="exercise-intensity">Exercise Intensity (1-10)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="exercise-intensity"
                      min={1}
                      max={10}
                      step={1}
                      value={exerciseIntensity !== null ? [exerciseIntensity] : [5]}
                      onValueChange={(value) => setExerciseIntensity(value[0])}
                    />
                    <span className="w-12 text-center">{exerciseIntensity ?? 5}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Diet Tab */}
            <TabsContent value="diet" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="caffeine-intake">Caffeine (mg)</Label>
                  <Input
                    id="caffeine-intake"
                    type="number"
                    min={0}
                    max={1000}
                    value={caffeineIntake !== null ? caffeineIntake : ""}
                    onChange={(e) => setCaffeineIntake(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="alcohol-intake">Alcohol (drinks)</Label>
                  <Input
                    id="alcohol-intake"
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={alcoholIntake !== null ? alcoholIntake : ""}
                    onChange={(e) => setAlcoholIntake(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="water-intake">Water (glasses)</Label>
                  <Input
                    id="water-intake"
                    type="number"
                    min={0}
                    max={20}
                    value={waterIntake !== null ? waterIntake : ""}
                    onChange={(e) => setWaterIntake(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Environment Tab */}
            <TabsContent value="environment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select value={location || ""} onValueChange={setLocation}>
                    <SelectTrigger id="location" className="mt-1">
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
                
                <div>
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min={-10}
                    max={50}
                    value={temperature !== null ? temperature : ""}
                    onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="noise-level">Noise Level (1-10)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="noise-level"
                      min={1}
                      max={10}
                      step={1}
                      value={noiseLevel !== null ? [noiseLevel] : [3]}
                      onValueChange={(value) => setNoiseLevel(value[0])}
                    />
                    <span className="w-12 text-center">{noiseLevel ?? 3}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Health Tab */}
            <TabsContent value="health" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mood">Mood (1-10)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="mood"
                      min={1}
                      max={10}
                      step={1}
                      value={mood !== null ? [mood] : [5]}
                      onValueChange={(value) => setMood(value[0])}
                    />
                    <span className="w-12 text-center">{mood ?? 5}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="energy-level">Energy Level (1-10)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      id="energy-level"
                      min={1}
                      max={10}
                      step={1}
                      value={energyLevel !== null ? [energyLevel] : [5]}
                      onValueChange={(value) => setEnergyLevel(value[0])}
                    />
                    <span className="w-12 text-center">{energyLevel ?? 5}</span>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="illness"
                      checked={illness}
                      onCheckedChange={setIllness}
                    />
                    <Label htmlFor="illness">Currently experiencing illness or symptoms</Label>
                  </div>
                  
                  {illness && (
                    <div className="mt-2">
                      <Label htmlFor="illness-details">Illness Details</Label>
                      <Textarea
                        id="illness-details"
                        placeholder="Describe your symptoms..."
                        value={illnessDetails}
                        onChange={(e) => setIllnessDetails(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Notes (shown on all tabs) */}
            <div className="mt-6">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any other factors that might affect your cognitive performance..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onSkip}>
            Skip
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
  );
}
