export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          settings: Json | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          settings?: Json | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          settings?: Json | null;
        };
      };
      test_results: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          timestamp: string;
          score: number;
          reaction_time: number | null;
          accuracy: number | null;
          raw_data: Json | null;
          environmental_factors: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          timestamp?: string;
          score: number;
          reaction_time?: number | null;
          accuracy?: number | null;
          raw_data?: Json | null;
          environmental_factors?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_type?: string;
          timestamp?: string;
          score?: number;
          reaction_time?: number | null;
          accuracy?: number | null;
          raw_data?: Json | null;
          environmental_factors?: Json | null;
        };
      };
      analytics: {
        Row: {
          id: string;
          user_id: string;
          baseline_test_id: string | null;
          test_type: string;
          period_start: string;
          period_end: string;
          avg_score: number | null;
          avg_reaction_time: number | null;
          avg_accuracy: number | null;
          score_delta: number | null;
          reaction_time_delta: number | null;
          accuracy_delta: number | null;
          score_percent_change: number | null;
          reaction_time_percent_change: number | null;
          accuracy_percent_change: number | null;
          sample_size: number;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          baseline_test_id?: string | null;
          test_type: string;
          period_start: string;
          period_end: string;
          avg_score?: number | null;
          avg_reaction_time?: number | null;
          avg_accuracy?: number | null;
          score_delta?: number | null;
          reaction_time_delta?: number | null;
          accuracy_delta?: number | null;
          score_percent_change?: number | null;
          reaction_time_percent_change?: number | null;
          accuracy_percent_change?: number | null;
          sample_size?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          baseline_test_id?: string | null;
          test_type?: string;
          period_start?: string;
          period_end?: string;
          avg_score?: number | null;
          avg_reaction_time?: number | null;
          avg_accuracy?: number | null;
          score_delta?: number | null;
          reaction_time_delta?: number | null;
          accuracy_delta?: number | null;
          score_percent_change?: number | null;
          reaction_time_percent_change?: number | null;
          accuracy_percent_change?: number | null;
          sample_size?: number;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      supplements: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string;
          intake_time: string;
          notes: string | null;
          created_at: string;
          // Structured dosage fields
          amount?: number | null;
          unit?: string | null;
          // Timing and frequency fields
          frequency?: string | null;
          time_of_day?: string | null;
          with_food?: boolean | null;
          schedule?: object | null;
          specific_time?: string | null;
          // Brand and formulation fields
          manufacturer?: string | null;
          brand?: string | null;
          brand_reputation?: number | null;
          formulation_type?: string | null;
          batch_number?: string | null;
          expiration_date?: string | null;
          third_party_tested?: boolean | null;
          certification?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage: string;
          intake_time?: string;
          notes?: string | null;
          created_at?: string;
          // Structured dosage fields
          amount?: number | null;
          unit?: string | null;
          // Timing and frequency fields
          frequency?: string | null;
          time_of_day?: string | null;
          with_food?: boolean | null;
          schedule?: object | null;
          specific_time?: string | null;
          // Brand and formulation fields
          manufacturer?: string | null;
          brand?: string | null;
          brand_reputation?: number | null;
          formulation_type?: string | null;
          batch_number?: string | null;
          expiration_date?: string | null;
          third_party_tested?: boolean | null;
          certification?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          dosage?: string;
          intake_time?: string;
          notes?: string | null;
          created_at?: string;
          // Structured dosage fields
          amount?: number | null;
          unit?: string | null;
          // Timing and frequency fields
          frequency?: string | null;
          time_of_day?: string | null;
          with_food?: boolean | null;
          schedule?: object | null;
          specific_time?: string | null;
          // Brand and formulation fields
          manufacturer?: string | null;
          brand?: string | null;
          brand_reputation?: number | null;
          formulation_type?: string | null;
          batch_number?: string | null;
          expiration_date?: string | null;
          third_party_tested?: boolean | null;
          certification?: string | null;
        };
      };
      confounding_factors: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          sleep_duration: number | null;
          sleep_quality: number | null;
          stress_level: number | null;
          exercise_duration: number | null;
          exercise_intensity: number | null;
          exercise_type: string | null;
          meal_timing: Json | null;
          caffeine_intake: number | null;
          alcohol_intake: number | null;
          water_intake: number | null;
          location: string | null;
          noise_level: number | null;
          temperature: number | null;
          mood: number | null;
          energy_level: number | null;
          illness: boolean | null;
          illness_details: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recorded_at?: string;
          sleep_duration?: number | null;
          sleep_quality?: number | null;
          stress_level?: number | null;
          exercise_duration?: number | null;
          exercise_intensity?: number | null;
          exercise_type?: string | null;
          meal_timing?: Json | null;
          caffeine_intake?: number | null;
          alcohol_intake?: number | null;
          water_intake?: number | null;
          location?: string | null;
          noise_level?: number | null;
          temperature?: number | null;
          mood?: number | null;
          energy_level?: number | null;
          illness?: boolean | null;
          illness_details?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recorded_at?: string;
          sleep_duration?: number | null;
          sleep_quality?: number | null;
          stress_level?: number | null;
          exercise_duration?: number | null;
          exercise_intensity?: number | null;
          exercise_type?: string | null;
          meal_timing?: Json | null;
          caffeine_intake?: number | null;
          alcohol_intake?: number | null;
          water_intake?: number | null;
          location?: string | null;
          noise_level?: number | null;
          temperature?: number | null;
          mood?: number | null;
          energy_level?: number | null;
          illness?: boolean | null;
          illness_details?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      washout_periods: {
        Row: {
          id: string;
          user_id: string;
          supplement_id: string | null;
          supplement_name: string;
          start_date: string;
          end_date: string | null;
          expected_duration_days: number | null;
          actual_duration_days: number | null;
          status: string;
          reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          supplement_id?: string | null;
          supplement_name: string;
          start_date: string;
          end_date?: string | null;
          expected_duration_days?: number | null;
          actual_duration_days?: number | null;
          status?: string;
          reason?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          supplement_id?: string | null;
          supplement_name?: string;
          start_date?: string;
          end_date?: string | null;
          expected_duration_days?: number | null;
          actual_duration_days?: number | null;
          status?: string;
          reason?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      statistical_analyses: {
        Row: {
          id: string;
          user_id: string;
          test_type: string;
          baseline_period_start: string;
          baseline_period_end: string;
          comparison_period_start: string;
          comparison_period_end: string;
          alpha: number;
          context_type: string;
          context_id: string | null;
          context_name: string | null;
          results: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_type: string;
          baseline_period_start: string;
          baseline_period_end: string;
          comparison_period_start: string;
          comparison_period_end: string;
          alpha?: number;
          context_type: string;
          context_id?: string | null;
          context_name?: string | null;
          results: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_type?: string;
          baseline_period_start?: string;
          baseline_period_end?: string;
          comparison_period_start?: string;
          comparison_period_end?: string;
          alpha?: number;
          context_type?: string;
          context_id?: string | null;
          context_name?: string | null;
          results?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
