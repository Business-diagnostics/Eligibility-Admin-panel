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
      eligibility_assessments: {
        Row: {
          business_age: string
          business_name: string | null
          business_size: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          employee_count: number | null
          gdpr_consent: boolean | null
          id: string
          primary_activity: string | null
          primary_nace_code: string | null
          project_costs: Json
          project_location: string
          registration_status: string
          sub_activity: string | null
          total_capex: number | null
          total_opex: number | null
          total_project_value: number | null
          updated_at: string
        }
        Insert: {
          business_age: string
          business_name?: string | null
          business_size: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          employee_count?: number | null
          gdpr_consent?: boolean | null
          id?: string
          primary_activity?: string | null
          primary_nace_code?: string | null
          project_costs?: Json
          project_location?: string
          registration_status?: string
          sub_activity?: string | null
          total_capex?: number | null
          total_opex?: number | null
          total_project_value?: number | null
          updated_at?: string
        }
        Update: {
          business_age?: string
          business_name?: string | null
          business_size?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          employee_count?: number | null
          gdpr_consent?: boolean | null
          id?: string
          primary_activity?: string | null
          primary_nace_code?: string | null
          project_costs?: Json
          project_location?: string
          registration_status?: string
          sub_activity?: string | null
          total_capex?: number | null
          total_opex?: number | null
          total_project_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      eligibility_results: {
        Row: {
          applicable_aid_intensity: number | null
          assessment_id: string
          created_at: string
          estimated_max_grant: number | null
          grant_scheme_id: string
          id: string
          is_eligible: boolean
          match_score: number | null
          matched_costs: string[] | null
          notes: string[] | null
        }
        Insert: {
          applicable_aid_intensity?: number | null
          assessment_id: string
          created_at?: string
          estimated_max_grant?: number | null
          grant_scheme_id: string
          id?: string
          is_eligible?: boolean
          match_score?: number | null
          matched_costs?: string[] | null
          notes?: string[] | null
        }
        Update: {
          applicable_aid_intensity?: number | null
          assessment_id?: string
          created_at?: string
          estimated_max_grant?: number | null
          grant_scheme_id?: string
          id?: string
          is_eligible?: boolean
          match_score?: number | null
          matched_costs?: string[] | null
          notes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "eligibility_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_results_grant_scheme_id_fkey"
            columns: ["grant_scheme_id"]
            isOneToOne: false
            referencedRelation: "grant_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_schemes: {
        Row: {
          aid_framework: string | null
          allowed_legal_structures: string[] | null
          allowed_registration_statuses: string[] | null
          created_at: string
          description: string | null
          eligible_activities: string[] | null
          eligible_costs: Json | null
          eligible_nace_codes: string[] | null
          hospitality_aid_intensity: number | null
          id: string
          is_active: boolean | null
          is_cash_grant: boolean | null
          is_refundable_grant: boolean | null
          is_tax_credit: boolean | null
          large_entity_aid_intensity: number | null
          large_entity_gozo_aid_intensity: number | null
          max_grant_amount: number | null
          max_investment_allowed: number | null
          micro_only: boolean | null
          min_investment_required: number | null
          scheme_code: string | null
          scheme_name: string
          sme_aid_intensity: number | null
          sme_gozo_aid_intensity: number | null
          sme_only: boolean | null
          standard_aid_intensity: number | null
          startup_aid_intensity: number | null
          startup_required: boolean | null
          supported_sub_activities: string[] | null
          updated_at: string
        }
        Insert: {
          aid_framework?: string | null
          allowed_legal_structures?: string[] | null
          allowed_registration_statuses?: string[] | null
          created_at?: string
          description?: string | null
          eligible_activities?: string[] | null
          eligible_costs?: Json | null
          eligible_nace_codes?: string[] | null
          hospitality_aid_intensity?: number | null
          id?: string
          is_active?: boolean | null
          is_cash_grant?: boolean | null
          is_refundable_grant?: boolean | null
          is_tax_credit?: boolean | null
          large_entity_aid_intensity?: number | null
          large_entity_gozo_aid_intensity?: number | null
          max_grant_amount?: number | null
          max_investment_allowed?: number | null
          micro_only?: boolean | null
          min_investment_required?: number | null
          scheme_code?: string | null
          scheme_name: string
          sme_aid_intensity?: number | null
          sme_gozo_aid_intensity?: number | null
          sme_only?: boolean | null
          standard_aid_intensity?: number | null
          startup_aid_intensity?: number | null
          startup_required?: boolean | null
          supported_sub_activities?: string[] | null
          updated_at?: string
        }
        Update: {
          aid_framework?: string | null
          allowed_legal_structures?: string[] | null
          allowed_registration_statuses?: string[] | null
          created_at?: string
          description?: string | null
          eligible_activities?: string[] | null
          eligible_costs?: Json | null
          eligible_nace_codes?: string[] | null
          hospitality_aid_intensity?: number | null
          id?: string
          is_active?: boolean | null
          is_cash_grant?: boolean | null
          is_refundable_grant?: boolean | null
          is_tax_credit?: boolean | null
          large_entity_aid_intensity?: number | null
          large_entity_gozo_aid_intensity?: number | null
          max_grant_amount?: number | null
          max_investment_allowed?: number | null
          micro_only?: boolean | null
          min_investment_required?: number | null
          scheme_code?: string | null
          scheme_name?: string
          sme_aid_intensity?: number | null
          sme_gozo_aid_intensity?: number | null
          sme_only?: boolean | null
          standard_aid_intensity?: number | null
          startup_aid_intensity?: number | null
          startup_required?: boolean | null
          supported_sub_activities?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          annual_turnover: number | null
          best_aid_intensity: number | null
          best_grant_amount: number | null
          best_grant_name: string | null
          business_age: string
          business_name: string | null
          business_size: string
          created_at: string
          eligible_grants: Json | null
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          employee_count: number | null
          full_name: string
          has_exceeded_de_minimis: boolean | null
          id: string
          legal_structure: string | null
          primary_activity: string | null
          primary_nace_code: string | null
          project_costs: Json
          project_location: string | null
          registration_status: string | null
          sub_activity: string | null
          suggested_options: Json | null
          total_capex: number | null
          total_opex: number | null
          total_project_value: number | null
        }
        Insert: {
          annual_turnover?: number | null
          best_aid_intensity?: number | null
          best_grant_amount?: number | null
          best_grant_name?: string | null
          business_age: string
          business_name?: string | null
          business_size: string
          created_at?: string
          eligible_grants?: Json | null
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          employee_count?: number | null
          full_name: string
          has_exceeded_de_minimis?: boolean | null
          id?: string
          legal_structure?: string | null
          primary_activity?: string | null
          primary_nace_code?: string | null
          project_costs?: Json
          project_location?: string | null
          registration_status?: string | null
          sub_activity?: string | null
          suggested_options?: Json | null
          total_capex?: number | null
          total_opex?: number | null
          total_project_value?: number | null
        }
        Update: {
          annual_turnover?: number | null
          best_aid_intensity?: number | null
          best_grant_amount?: number | null
          best_grant_name?: string | null
          business_age?: string
          business_name?: string | null
          business_size?: string
          created_at?: string
          eligible_grants?: Json | null
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          employee_count?: number | null
          full_name?: string
          has_exceeded_de_minimis?: boolean | null
          id?: string
          legal_structure?: string | null
          primary_activity?: string | null
          primary_nace_code?: string | null
          project_costs?: Json
          project_location?: string | null
          registration_status?: string | null
          sub_activity?: string | null
          suggested_options?: Json | null
          total_capex?: number | null
          total_opex?: number | null
          total_project_value?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
