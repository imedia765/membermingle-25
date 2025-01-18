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
      console.log('Fetching collector info for:', member.collector);
      if (!member.collector) return null;
      
      const { data, error } = await supabase
        .from('members_collectors')
        .select('*')
        .eq('name', member.collector)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching collector:', error);
        throw error;
      }
      
      console.log('Fetched collector info:', data);
      return data;
    },
    enabled: !!member.collector
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
        <div className="space-y-4 py-4">
          <p className="text-sm">Address: {member.address}</p>
          <p className="text-sm">Email: {member.email}</p>
          <p className="text-sm">Phone: {member.phone}</p>

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
