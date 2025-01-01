export interface Member {
  id: string;
  member_number: string;
  collector_id?: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  email?: string;
  phone?: string;
  address?: string;
  postcode?: string;
  town?: string;
  status?: string;
  verified?: boolean;
  created_at: string;
  updated_at: string;
  membership_type?: string;
  collector?: string;
  cors_enabled?: boolean;
  password_changed?: boolean;
  default_password_hash?: string;
  email_verified?: boolean;
  profile_updated?: boolean;
  first_time_login?: boolean;
  profile_completed?: boolean;
  registration_completed?: boolean;
  auth_user_id?: string;
  role: 'member' | 'collector' | 'admin';
  payment_amount?: number;
  payment_type?: string;
  payment_date?: string;
  payment_notes?: string;
  family_member_name?: string;
  family_member_relationship?: string;
  family_member_dob?: string;
  family_member_gender?: string;
  registration_status?: string;
  ticket_subject?: string;
  ticket_description?: string;
  ticket_status?: string;
  ticket_priority?: string;
  admin_note?: string;
  created_by?: string;
}

export interface CollectorMember extends Member {
  prefix?: string;
  number?: string;
  active?: boolean;
}