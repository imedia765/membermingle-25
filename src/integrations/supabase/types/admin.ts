export interface AdminNote {
  id: string;
  member_id: string | null;
  admin_id: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}