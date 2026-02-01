export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_metrics: {
        Row: {
          avg_attention_score: number | null
          avg_eye_contact_score: number | null
          avg_pitch_hz: number | null
          avg_posture_score: number | null
          avg_smile_score: number | null
          clarity_score: number | null
          content_relevance_score: number | null
          created_at: string
          expression_confidence: number | null
          filler_word_count: number | null
          head_position_stability: number | null
          id: string
          overall_confidence_score: number | null
          overall_nonverbal_score: number | null
          overall_verbal_score: number | null
          pitch_variability: number | null
          sentiment_score: number | null
          session_id: string
          shoulder_alignment: number | null
          speech_pace_wpm: number | null
          user_id: string
          vocabulary_diversity: number | null
        }
        Insert: {
          avg_attention_score?: number | null
          avg_eye_contact_score?: number | null
          avg_pitch_hz?: number | null
          avg_posture_score?: number | null
          avg_smile_score?: number | null
          clarity_score?: number | null
          content_relevance_score?: number | null
          created_at?: string
          expression_confidence?: number | null
          filler_word_count?: number | null
          head_position_stability?: number | null
          id?: string
          overall_confidence_score?: number | null
          overall_nonverbal_score?: number | null
          overall_verbal_score?: number | null
          pitch_variability?: number | null
          sentiment_score?: number | null
          session_id: string
          shoulder_alignment?: number | null
          speech_pace_wpm?: number | null
          user_id: string
          vocabulary_diversity?: number | null
        }
        Update: {
          avg_attention_score?: number | null
          avg_eye_contact_score?: number | null
          avg_pitch_hz?: number | null
          avg_posture_score?: number | null
          avg_smile_score?: number | null
          clarity_score?: number | null
          content_relevance_score?: number | null
          created_at?: string
          expression_confidence?: number | null
          filler_word_count?: number | null
          head_position_stability?: number | null
          id?: string
          overall_confidence_score?: number | null
          overall_nonverbal_score?: number | null
          overall_verbal_score?: number | null
          pitch_variability?: number | null
          sentiment_score?: number | null
          session_id?: string
          shoulder_alignment?: number | null
          speech_pace_wpm?: number | null
          user_id?: string
          vocabulary_diversity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          industry: string | null
          job_role: string | null
          session_type: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          industry?: string | null
          job_role?: string | null
          session_type?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          industry?: string | null
          job_role?: string | null
          session_type?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      phase_results: {
        Row: {
          analysis_data: Json | null
          created_at: string
          duration_seconds: number | null
          feedback: Json | null
          id: string
          passed: boolean | null
          phase: string
          score: number | null
          session_id: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: Json | null
          id?: string
          passed?: boolean | null
          phase: string
          score?: number | null
          session_id: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: Json | null
          id?: string
          passed?: boolean | null
          phase?: string
          score?: number | null
          session_id?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          experience_level: string | null
          full_name: string | null
          id: string
          industry: string | null
          target_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          target_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          experience_level?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          target_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          education: string | null
          experience_years: number | null
          filename: string
          id: string
          parsed_sections: Json | null
          raw_text: string
          skills: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: string | null
          experience_years?: number | null
          filename: string
          id?: string
          parsed_sections?: Json | null
          raw_text: string
          skills?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: string | null
          experience_years?: number | null
          filename?: string
          id?: string
          parsed_sections?: Json | null
          raw_text?: string
          skills?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          difficulty: string | null
          explanation: string | null
          id: string
          is_correct: boolean | null
          options: Json
          phase: string
          question_text: string
          session_id: string
          skill_area: string | null
          time_taken_seconds: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          options?: Json
          phase?: string
          question_text: string
          session_id: string
          skill_area?: string | null
          time_taken_seconds?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          difficulty?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          options?: Json
          phase?: string
          question_text?: string
          session_id?: string
          skill_area?: string | null
          time_taken_seconds?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_reports: {
        Row: {
          behavioral_score: number | null
          created_at: string
          detailed_feedback: Json | null
          emotion_timeline: Json | null
          id: string
          improvement_areas: string[] | null
          overall_score: number | null
          report_pdf_url: string | null
          resume_score: number | null
          session_id: string
          strengths: string[] | null
          tech_score: number | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          behavioral_score?: number | null
          created_at?: string
          detailed_feedback?: Json | null
          emotion_timeline?: Json | null
          id?: string
          improvement_areas?: string[] | null
          overall_score?: number | null
          report_pdf_url?: string | null
          resume_score?: number | null
          session_id: string
          strengths?: string[] | null
          tech_score?: number | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          behavioral_score?: number | null
          created_at?: string
          detailed_feedback?: Json | null
          emotion_timeline?: Json | null
          id?: string
          improvement_areas?: string[] | null
          overall_score?: number | null
          report_pdf_url?: string | null
          resume_score?: number | null
          session_id?: string
          strengths?: string[] | null
          tech_score?: number | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "session_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      interview_phase: "mcq" | "resume" | "behavioral"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      interview_phase: ["mcq", "resume", "behavioral"],
    },
  },
} as const
