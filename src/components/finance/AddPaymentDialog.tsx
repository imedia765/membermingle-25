import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

const paymentFormSchema = z.object({
  memberId: z.string().min(1, "Please select a member"),
  amount: z.string().min(1, "Amount is required"),
  paymentType: z.string().min(1, "Payment type is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function AddPaymentDialog({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Query for searching members
  const { data: members } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      
      const { data, error } = await supabase
        .from('members')
        .select('id, full_name, member_number, email')
        .or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length > 0,
  });

  // Mutation for adding payment
  const addPaymentMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            member_id: values.memberId,
            amount: parseFloat(values.amount),
            payment_type: values.paymentType,
            notes: values.notes,
            status: 'completed',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({
        title: "Payment recorded successfully",
        description: "The payment has been added to the system.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddPayment = (data: PaymentFormValues) => {
    addPaymentMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Add New Payment</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddPayment)} className="space-y-4">
          <div className="space-y-2">
            <Label>Search Member</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or member number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {members && members.length > 0 && (
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-4 space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => {
                        form.setValue('memberId', member.id);
                        setSearchTerm(member.full_name);
                      }}
                    >
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.member_number} • {member.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="membership">Membership Fee</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Add any additional notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={addPaymentMutation.isPending}
          >
            {addPaymentMutation.isPending ? "Recording payment..." : "Submit Payment"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}