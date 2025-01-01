export interface SupportTicket {
  id: string;
  member_id: string | null;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TicketResponse {
  id: string;
  ticket_id: string | null;
  responder_id: string | null;
  response: string;
  created_at: string;
  updated_at: string;
}