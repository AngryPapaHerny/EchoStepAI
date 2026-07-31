/**
 * Supabase 스키마에서 자동 생성된 타입.
 * 스키마를 바꿨다면 다시 생성할 것:
 *   npx supabase gen types typescript --project-id vkwrinqsjuchiulrgtxh > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      exit_tickets: {
        Row: {
          accuracy_level: Database["public"]["Enums"]["accuracy_level"]
          caf_accuracy: number
          caf_complexity: number
          caf_fluency: number
          created_at: string
          encouragement: string
          fluency_level: Database["public"]["Enums"]["fluency_level"]
          id: string
          overall_score: number
          scenario_id: string
          scenario_title: string
          self_reflection: string
          top_mistakes: Json
          user_id: string
        }
        Insert: {
          accuracy_level?: Database["public"]["Enums"]["accuracy_level"]
          caf_accuracy?: number
          caf_complexity?: number
          caf_fluency?: number
          created_at?: string
          encouragement?: string
          fluency_level?: Database["public"]["Enums"]["fluency_level"]
          id?: string
          overall_score: number
          scenario_id: string
          scenario_title: string
          self_reflection?: string
          top_mistakes?: Json
          user_id: string
        }
        Update: {
          accuracy_level?: Database["public"]["Enums"]["accuracy_level"]
          caf_accuracy?: number
          caf_complexity?: number
          caf_fluency?: number
          created_at?: string
          encouragement?: string
          fluency_level?: Database["public"]["Enums"]["fluency_level"]
          id?: string
          overall_score?: number
          scenario_id?: string
          scenario_title?: string
          self_reflection?: string
          top_mistakes?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badges: string[]
          cefr_level: Database["public"]["Enums"]["cefr_level"]
          coins: number
          completed_sessions_count: number
          created_at: string
          id: string
          last_session_date: string | null
          major_or_job: Database["public"]["Enums"]["esp_category"]
          name: string
          preferred_mode: Database["public"]["Enums"]["mode_type"]
          streak_days: number
          total_study_minutes: number
          updated_at: string
        }
        Insert: {
          badges?: string[]
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          coins?: number
          completed_sessions_count?: number
          created_at?: string
          id: string
          last_session_date?: string | null
          major_or_job?: Database["public"]["Enums"]["esp_category"]
          name?: string
          preferred_mode?: Database["public"]["Enums"]["mode_type"]
          streak_days?: number
          total_study_minutes?: number
          updated_at?: string
        }
        Update: {
          badges?: string[]
          cefr_level?: Database["public"]["Enums"]["cefr_level"]
          coins?: number
          completed_sessions_count?: number
          created_at?: string
          id?: string
          last_session_date?: string | null
          major_or_job?: Database["public"]["Enums"]["esp_category"]
          name?: string
          preferred_mode?: Database["public"]["Enums"]["mode_type"]
          streak_days?: number
          total_study_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          created_at: string
          esp_category: Database["public"]["Enums"]["esp_category"]
          example_sentence: string
          exit_ticket_id: string | null
          expression: string
          id: string
          mastered: boolean
          meaning: string
          user_id: string
        }
        Insert: {
          created_at?: string
          esp_category?: Database["public"]["Enums"]["esp_category"]
          example_sentence?: string
          exit_ticket_id?: string | null
          expression: string
          id?: string
          mastered?: boolean
          meaning?: string
          user_id: string
        }
        Update: {
          created_at?: string
          esp_category?: Database["public"]["Enums"]["esp_category"]
          example_sentence?: string
          exit_ticket_id?: string | null
          expression?: string
          id?: string
          mastered?: boolean
          meaning?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_exit_ticket_id_fkey"
            columns: ["exit_ticket_id"]
            isOneToOne: false
            referencedRelation: "exit_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      caf_daily: {
        Row: {
          accuracy: number | null
          complexity: number | null
          day: string | null
          fluency: number | null
          sessions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      save_exit_ticket: {
        Args: {
          p_accuracy_level: string
          p_caf: Json
          p_encouragement: string
          p_fluency_level: string
          p_new_expressions: Json
          p_overall_score: number
          p_scenario_id: string
          p_scenario_title: string
          p_self_reflection: string
          p_top_mistakes: Json
        }
        Returns: {
          accuracy_level: Database["public"]["Enums"]["accuracy_level"]
          caf_accuracy: number
          caf_complexity: number
          caf_fluency: number
          created_at: string
          encouragement: string
          fluency_level: Database["public"]["Enums"]["fluency_level"]
          id: string
          overall_score: number
          scenario_id: string
          scenario_title: string
          self_reflection: string
          top_mistakes: Json
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "exit_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      accuracy_level: "Needs Work" | "Good" | "Excellent"
      cefr_level: "A2" | "B1" | "B2" | "C1"
      esp_category:
        | "Engineering"
        | "Business"
        | "Healthcare"
        | "Hospitality"
        | "General"
      fluency_level: "Beginner" | "Intermediate" | "Advanced"
      mode_type: "voice" | "text"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accuracy_level: ["Needs Work", "Good", "Excellent"],
      cefr_level: ["A2", "B1", "B2", "C1"],
      esp_category: [
        "Engineering",
        "Business",
        "Healthcare",
        "Hospitality",
        "General",
      ],
      fluency_level: ["Beginner", "Intermediate", "Advanced"],
      mode_type: ["voice", "text"],
    },
  },
} as const
