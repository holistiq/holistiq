/**
 * Test Preferences Component
 *
 * Allows users to set their preferences for cognitive tests
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";

// Test type options
const TEST_TYPES = [
  {
    id: "selection",
    name: "Test Selection Screen",
    description: "Show the test selection screen when taking a test",
    icon: <Settings className="h-5 w-5 text-primary" />
  },
  {
    id: "n-back",
    name: "N-Back Test",
    description: "Directly start the N-Back test (working memory)",
    icon: <Brain className="h-5 w-5 text-primary" />
  },
  {
    id: "reaction-time",
    name: "Reaction Time Test",
    description: "Directly start the Reaction Time test",
    icon: <Zap className="h-5 w-5 text-primary" />
  }
];

// Local storage key for test preferences
const TEST_PREFERENCES_KEY = "holistiq_test_preferences";

// Default preferences
const DEFAULT_PREFERENCES = {
  defaultTestType: "selection",
  showFullScreenPrompt: true
};

/**
 * Interface for test preferences
 */
interface TestPreferences {
  defaultTestType: string;
  showFullScreenPrompt: boolean;
}

/**
 * Props for the TestPreferences component
 */
interface TestPreferencesProps {
  onSave?: () => void;
}

/**
 * Component for managing test preferences
 */
export function TestPreferences({ onSave }: TestPreferencesProps) {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [preferences, setPreferences] = useState<TestPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from local storage or user profile
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Try to load from user profile if logged in
        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('test_preferences')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            setPreferences(data.test_preferences || DEFAULT_PREFERENCES);
            return;
          }
        }

        // Fall back to local storage
        const storedPreferences = localStorage.getItem(TEST_PREFERENCES_KEY);
        if (storedPreferences) {
          setPreferences(JSON.parse(storedPreferences));
        }
      } catch (error) {
        console.error('Error loading test preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // Save to local storage
      localStorage.setItem(TEST_PREFERENCES_KEY, JSON.stringify(preferences));

      // Save to user profile if logged in
      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            test_preferences: preferences,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Preferences saved",
        description: "Your test preferences have been updated."
      });

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving test preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Preferences</CardTitle>
        <CardDescription>
          Customize your cognitive test experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default Test Type */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Default Test Type</h3>
            <p className="text-sm text-muted-foreground">
              Choose what happens when you click "Take Test"
            </p>
          </div>

          <RadioGroup
            value={preferences.defaultTestType}
            onValueChange={(value) => setPreferences({ ...preferences, defaultTestType: value })}
            className="space-y-3"
          >
            {TEST_TYPES.map((type) => (
              <div
                key={type.id}
                className="flex items-start space-x-3 border rounded-md p-3 hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={type.id} id={`test-type-${type.id}`} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <Label
                      htmlFor={`test-type-${type.id}`}
                      className="text-base font-medium cursor-pointer"
                    >
                      {type.name}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Fullscreen Prompt */}
        <div className="flex items-center justify-between border rounded-md p-3">
          <div>
            <Label htmlFor="fullscreen-prompt" className="text-base font-medium">
              Fullscreen Prompt
            </Label>
            <p className="text-sm text-muted-foreground">
              Show a prompt to enter fullscreen mode before starting a test
            </p>
          </div>
          <Switch
            id="fullscreen-prompt"
            checked={preferences.showFullScreenPrompt}
            onCheckedChange={(checked) => setPreferences({ ...preferences, showFullScreenPrompt: checked })}
          />
        </div>

        {/* Save Button */}
        <Button
          onClick={savePreferences}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
