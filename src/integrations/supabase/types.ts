export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          member_number: string;
          collector_id: string | null;
          full_name: string;
          date_of_birth: string | null;
          gender: string | null;
          marital_status: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          postcode: string | null;
          town: string | null;
          status: string | null;
          verified: boolean | null;
          created_at: string;
          updated_at: string;
          membership_type: string | null;
          collector: string | null;
          cors_enabled: boolean | null;
          password_changed: boolean | null;
          default_password_hash: string | null;
          email_verified: boolean | null;
          profile_updated: boolean | null;
          first_time_login: boolean | null;
          profile_completed: boolean | null;
          registration_completed: boolean | null;
          auth_user_id: string | null;
          role: 'member' | 'collector' | 'admin';
          payment_amount: number | null;
          payment_type: string | null;
          payment_date: string | null;
          payment_notes: string | null;
          family_member_name: string | null;
          family_member_relationship: string | null;
          family_member_dob: string | null;
          family_member_gender: string | null;
          registration_status: string | null;
          ticket_subject: string | null;
          ticket_description: string | null;
          ticket_status: string | null;
          ticket_priority: string | null;
          admin_note: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          member_number: string;
          collector_id?: string | null;
          full_name: string;
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          postcode?: string | null;
          town?: string | null;
          status?: string | null;
          verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
          membership_type?: string | null;
          collector?: string | null;
          cors_enabled?: boolean | null;
          password_changed?: boolean | null;
          default_password_hash?: string | null;
          email_verified?: boolean | null;
          profile_updated?: boolean | null;
          first_time_login?: boolean | null;
          profile_completed?: boolean | null;
          registration_completed?: boolean | null;
          auth_user_id?: string | null;
          role?: 'member' | 'collector' | 'admin';
          payment_amount?: number | null;
          payment_type?: string | null;
          payment_date?: string | null;
          payment_notes?: string | null;
          family_member_name?: string | null;
          family_member_relationship?: string | null;
          family_member_dob?: string | null;
          family_member_gender?: string | null;
          registration_status?: string | null;
          ticket_subject?: string | null;
          ticket_description?: string | null;
          ticket_status?: string | null;
          ticket_priority?: string | null;
          admin_note?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          member_number?: string;
          collector_id?: string | null;
          full_name?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          marital_status?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          postcode?: string | null;
          town?: string | null;
          status?: string | null;
          verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
          membership_type?: string | null;
          collector?: string | null;
          cors_enabled?: boolean | null;
          password_changed?: boolean | null;
          default_password_hash?: string | null;
          email_verified?: boolean | null;
          profile_updated?: boolean | null;
          first_time_login?: boolean | null;
          profile_completed?: boolean | null;
          registration_completed?: boolean | null;
          auth_user_id?: string | null;
          role?: 'member' | 'collector' | 'admin';
          payment_amount?: number | null;
          payment_type?: string | null;
          payment_date?: string | null;
          payment_notes?: string | null;
          family_member_name?: string | null;
          family_member_relationship?: string | null;
          family_member_dob?: string | null;
          family_member_gender?: string | null;
          registration_status?: string | null;
          ticket_subject?: string | null;
          ticket_description?: string | null;
          ticket_status?: string | null;
          ticket_priority?: string | null;
          admin_note?: string | null;
          created_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      authenticate_member: {
        Args: {
          p_member_number: string;
        };
        Returns: {
          id: string;
          member_number: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          role: string;
        }[];
      };
    };
    Enums: {
      user_role: "member" | "collector" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];