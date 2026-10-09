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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          allowed_resources: string[]
          allowed_tools: string[]
          clearance: string
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string
          status: string
        }
        Insert: {
          allowed_resources?: string[]
          allowed_tools?: string[]
          clearance?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_id: string
          status?: string
        }
        Update: {
          allowed_resources?: string[]
          allowed_tools?: string[]
          clearance?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string
          status?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          agent_name: string
          created_at: string
          decision: string
          executed: boolean
          id: string
          owner_id: string
          reasons: string[]
          source: string
          target: string
          threat_level: string
        }
        Insert: {
          action: string
          agent_name: string
          created_at?: string
          decision: string
          executed?: boolean
          id?: string
          owner_id: string
          reasons?: string[]
          source?: string
          target?: string
          threat_level: string
        }
        Update: {
          action?: string
          agent_name?: string
          created_at?: string
          decision?: string
          executed?: boolean
          id?: string
          owner_id?: string
          reasons?: string[]
          source?: string
          target?: string
          threat_level?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          body: string
          id: string
          owner_id: string
          received_at: string
          scan: Json | null
          sender: string
          subject: string
        }
        Insert: {
          body: string
          id?: string
          owner_id: string
          received_at?: string
          scan?: Json | null
          sender: string
          subject: string
        }
        Update: {
          body?: string
          id?: string
          owner_id?: string
          received_at?: string
          scan?: Json | null
          sender?: string
          subject?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          approval_required_tools: string[]
          block_secrets: boolean
          owner_id: string
          prohibited_tools: string[]
          redact_pii: boolean
          review_confidential_external: boolean
          trusted_domains: string[]
          updated_at: string
        }
        Insert: {
          approval_required_tools?: string[]
          block_secrets?: boolean
          owner_id: string
          prohibited_tools?: string[]
          redact_pii?: boolean
          review_confidential_external?: boolean
          trusted_domains?: string[]
          updated_at?: string
        }
        Update: {
          approval_required_tools?: string[]
          block_secrets?: boolean
          owner_id?: string
          prohibited_tools?: string[]
          redact_pii?: boolean
          review_confidential_external?: boolean
          trusted_domains?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          classification: string
          created_at: string
          id: string
          owner_id: string
          path: string
        }
        Insert: {
          classification?: string
          created_at?: string
          id?: string
          owner_id: string
          path: string
        }
        Update: {
          classification?: string
          created_at?: string
          id?: string
          owner_id?: string
          path?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_demo_workspace: { Args: { _uid: string }; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
