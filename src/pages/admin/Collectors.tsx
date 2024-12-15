import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { importDataFromJson } from "@/utils/importData";
import { EditCollectorDialog } from "@/components/collectors/EditCollectorDialog";
import { CollectorList } from "@/components/collectors/CollectorList";

export default function Collectors() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);
  const [editingCollector, setEditingCollector] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const { data: collectors, isLoading, refetch } = useQuery({
    queryKey: ['collectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collectors')
        .select(`
          *,
          members:members(*)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const toggleCollector = (collectorId: string) => {
    setExpandedCollector(expandedCollector === collectorId ? null : collectorId);
  };

  const handleImportData = async () => {
    const result = await importDataFromJson();
    if (result.success) {
      toast({
        title: "Data imported successfully",
        description: "The collectors and members data has been imported.",
      });
    } else {
      toast({
        title: "Import failed",
        description: "There was an error importing the data.",
        variant: "destructive",
      });
    }
  };

  const handlePrintAll = () => {
    const printContent = `
      <html>
        <head>
          <title>All Collectors Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2, h3 { color: #333; }
            .collector-info { margin-bottom: 20px; }
            .info-item { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0 40px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .collector-section { margin-bottom: 40px; page-break-inside: avoid; }
            .section { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <h1>All Collectors Report</h1>
          ${collectors?.map(collector => `
            <div class="collector-section">
              <div class="section">
                <h2>Collector: ${collector.name}</h2>
                <div class="collector-info">
                  <div class="info-item"><strong>ID:</strong> ${collector.prefix}${collector.number}</div>
                  <div class="info-item"><strong>Status:</strong> ${collector.active ? 'Active' : 'Inactive'}</div>
                  <div class="info-item"><strong>Total Members:</strong> ${collector.members?.length || 0}</div>
                </div>
              </div>

              <div class="section">
                <h3>Members List</h3>
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
            </div>
          `).join('') || '<p>No collectors found</p>'}
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-4xl font-bold text-white">
          Collectors Management
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleImportData()}
          >
            <UserPlus className="h-4 w-4" />
            Import Data
          </Button>
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="h-4 w-4" />
            Add New Collector
          </Button>
          <Button 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handlePrintAll}
          >
            <Printer className="h-4 w-4" />
            Print All Collectors
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by collector name or number..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <CollectorList
        collectors={collectors || []}
        expandedCollector={expandedCollector}
        onToggleCollector={toggleCollector}
        onEditCollector={setEditingCollector}
        onUpdate={refetch}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />

      {editingCollector && (
        <EditCollectorDialog
          isOpen={true}
          onClose={() => setEditingCollector(null)}
          collector={editingCollector}
          onUpdate={refetch}
        />
      )}
    </div>
  );
}
