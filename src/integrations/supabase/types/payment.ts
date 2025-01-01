export interface Payment {
  id: string;
  member_id: string | null;
  collector_id: string | null;
  amount: number;
  payment_date: string;
  payment_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}