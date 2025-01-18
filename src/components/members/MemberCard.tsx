import { useState } from 'react';
import { Member } from '@/types/member';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { differenceInDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import PaymentDialog from './PaymentDialog';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface MemberCardProps {
  member: Member;
  userRole: string;
  onPaymentClick: () => void;
  onEditClick: () => void;
}

const MemberCard = ({ member, userRole, onPaymentClick, onEditClick }: MemberCardProps) => {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [note, setNote] = useState(member.admin_note || '');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const { hasRole } = useRoleAccess();
  const isCollector = hasRole('collector');

  // Fetch collector info
  const { data: collectorInfo } = useQuery({
    queryKey: ['collector', member.collector],
    queryFn: async () => {
      if (!member.collector) return null;
      
      const { data, error } = await supabase
        .from('members_collectors')
        .select('*')
        .eq('name', member.collector)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!member.collector
  });

  // Fetch payment history
  const { data: paymentHistory } = useQuery({
    queryKey: ['payment-history', member.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleSaveNote = async () => {
    // Save note logic here
  };

  const handlePaymentClick = () => {
    if (!isCollector) {
      toast({
        title: "Not Authorized",
        description: "Only collectors can record payments",
        variant: "destructive"
      });
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  return (
    <AccordionItem value={member.id} className="border-b border-white/10">
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full text-left px-1">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{member.full_name}</h3>
            <p className="text-sm text-gray-500">Member Number: {member.member_number}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onEditClick}>Edit</Button>
            <Button onClick={handlePaymentClick}>Pay</Button>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent>
        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 p-3 rounded-lg">
              <p className="text-sm">Email: {member.email || 'Not provided'}</p>
              <p className="text-sm">Phone: {member.phone || 'Not provided'}</p>
              <p className="text-sm">Date of Birth: {member.date_of_birth ? format(new Date(member.date_of_birth), 'dd/MM/yyyy') : 'Not provided'}</p>
              <p className="text-sm">Gender: {member.gender || 'Not provided'}</p>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">Address Details</h4>
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-sm">Street: {member.address || 'Not provided'}</p>
              <p className="text-sm">Town: {member.town || 'Not provided'}</p>
              <p className="text-sm">Postcode: {member.postcode || 'Not provided'}</p>
            </div>
          </div>

          {/* Payment History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-500">Payment History</h4>
            <div className="bg-white/5 p-3 rounded-lg">
              {paymentHistory && paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="border-b border-white/10 pb-2">
                      <p className="text-sm">Amount: £{payment.amount}</p>
                      <p className="text-sm">Date: {format(new Date(payment.created_at), 'dd/MM/yyyy')}</p>
                      <p className="text-sm">Status: {payment.status}</p>
                      <p className="text-sm">Type: {payment.payment_type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No payment history available</p>
              )}
            </div>
          </div>

          {userRole === 'admin' && (
            <div>
              <Button onClick={() => setIsNoteDialogOpen(true)}>Add Note</Button>
              <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Admin Note</DialogTitle>
                  </DialogHeader>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full h-24"
                  />
                  <Button onClick={handleSaveNote}>Save Note</Button>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onClose={() => setIsPaymentDialogOpen(false)}
            memberId={member.id}
            memberNumber={member.member_number}
            memberName={member.full_name}
            collectorInfo={collectorInfo}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default MemberCard;