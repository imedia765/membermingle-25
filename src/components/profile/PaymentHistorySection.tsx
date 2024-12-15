import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Payment {
  date: string;
  amount: string;
  status: string;
  type: string;
}

interface PaymentHistorySectionProps {
  payments: Payment[];
  searchDate: string;
  searchAmount: string;
  onSearchDateChange: (value: string) => void;
  onSearchAmountChange: (value: string) => void;
}

export const PaymentHistorySection = ({
  payments,
  searchDate,
  searchAmount,
  onSearchDateChange,
  onSearchAmountChange,
}: PaymentHistorySectionProps) => {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="default"
          className="flex items-center gap-2 w-full justify-between bg-primary hover:bg-primary/90"
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span>Payment History</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Search by Date</label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => onSearchDateChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Search by Amount</label>
              <Input
                type="text"
                placeholder="e.g. £50.00"
                value={searchAmount}
                onChange={(e) => onSearchAmountChange(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>{payment.type}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>{payment.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};