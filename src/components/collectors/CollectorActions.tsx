import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Trash2, UserCheck, Ban, ChevronDown, UserMinus, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface CollectorActionsProps {
  collector: {
    id: string;
    name: string;
    active?: boolean | null;
    members?: any[];
    prefix?: string;
    number?: string;
  };
  collectors: Array<{ id: string; name: string }>;
  onEdit: (collector: { id: string; name: string }) => void;
  onUpdate: () => void;
}

export function CollectorActions({ collector, collectors, onEdit, onUpdate }: CollectorActionsProps) {
  const { toast } = useToast();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>("");

  const handlePrintCollector = () => {
    const printContent = `
      <html>
        <head>
          <title>Collector Details - ${collector.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2 { color: #333; }
            .collector-info { margin-bottom: 20px; }
            .info-item { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .section { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="section">
            <h1>Collector Details</h1>
            <div class="collector-info">
              <div class="info-item"><strong>Name:</strong> ${collector.name}</div>
              <div class="info-item"><strong>ID:</strong> ${collector.prefix}${collector.number}</div>
              <div class="info-item"><strong>Status:</strong> ${collector.active ? 'Active' : 'Inactive'}</div>
              <div class="info-item"><strong>Total Members:</strong> ${collector.members?.length || 0}</div>
            </div>
          </div>

          <div class="section">
            <h2>Members List</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Member ID</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Town</th>
                  <th>Postcode</th>
                  <th>Status</th>
                  <th>Membership Type</th>
                </tr>
              </thead>
              <tbody>
                ${collector.members?.map(member => `
                  <tr>
                    <td>${member.full_name}</td>
                    <td>${member.member_number}</td>
                    <td>${member.email || '-'}</td>
                    <td>${member.phone || '-'}</td>
                    <td>${member.address || '-'}</td>
                    <td>${member.town || '-'}</td>
                    <td>${member.postcode || '-'}</td>
                    <td>${member.status || '-'}</td>
                    <td>${member.membership_type || '-'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="9">No members found</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="section">
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDeleteCollector = async () => {
    const { error } = await supabase
      .from('collectors')
      .delete()
      .eq('id', collector.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete collector",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Collector deleted",
        description: "The collector has been removed successfully.",
      });
      onUpdate();
    }
  };

  const handleActivateCollector = async () => {
    const { error } = await supabase
      .from('collectors')
      .update({ active: true })
      .eq('id', collector.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to activate collector",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Collector activated",
        description: "The collector has been activated successfully.",
      });
      onUpdate();
    }
  };

  const handleDeactivateCollector = async () => {
    const { error } = await supabase
      .from('collectors')
      .update({ active: false })
      .eq('id', collector.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate collector",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Collector deactivated",
        description: "The collector has been deactivated successfully.",
      });
      onUpdate();
    }
  };

  const handleMoveMembers = async () => {
    if (!selectedCollectorId) {
      toast({
        title: "Error",
        description: "Please select a collector",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('members')
      .update({ collector_id: selectedCollectorId })
      .eq('collector_id', collector.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to move members",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Members moved",
        description: "All members have been moved to the selected collector.",
      });
      setShowMoveDialog(false);
      onUpdate();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-4 shrink-0">
            Actions <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(collector)} className="gap-2">
            <Edit2 className="h-4 w-4" /> Edit Name
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowMoveDialog(true)} className="gap-2">
            <UserMinus className="h-4 w-4" /> Move Members
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrintCollector} className="gap-2">
            <Printer className="h-4 w-4" /> Print Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleActivateCollector} className="gap-2">
            <UserCheck className="h-4 w-4" /> Activate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeactivateCollector} className="gap-2">
            <Ban className="h-4 w-4" /> Deactivate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDeleteCollector} className="gap-2 text-red-600">
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Members to Another Collector</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={setSelectedCollectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collector" />
              </SelectTrigger>
              <SelectContent>
                {collectors
                  .filter(c => c.id !== collector.id)
                  .map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveMembers}>
              Move Members
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}