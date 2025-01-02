import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

const Collectors = () => {
  const { data: collectors, isLoading } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, member_number")
        .eq("role", "collector")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Collectors</h1>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Collector Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Loading collectors...
                  </TableCell>
                </TableRow>
              ) : collectors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    No collectors found
                  </TableCell>
                </TableRow>
              ) : (
                collectors?.map((collector) => (
                  <TableRow key={collector.id}>
                    <TableCell>{collector.full_name}</TableCell>
                    <TableCell>{collector.member_number}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Collectors;