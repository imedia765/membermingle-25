export interface Member {
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
  status: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  membership_type: string;
  collector: string | null;
  cors_enabled: boolean;
  password_changed: boolean;
  default_password_hash: string | null;
  email_verified: boolean;
  profile_updated: boolean;
  first_time_login: boolean;
  profile_completed: boolean;
  registration_completed: boolean;
  auth_user_id: string | null;
  role: 'member' | 'collector' | 'admin';
}

export interface FamilyMember {
  id: string;
  member_id: string | null;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}