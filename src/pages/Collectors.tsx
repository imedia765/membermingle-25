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
import { Badge } from "@/components/ui/badge";

const Collectors = () => {
  const { data: collectors, isLoading } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collectors")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Collectors</h1>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Collector Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading collectors...
                  </TableCell>
                </TableRow>
              ) : collectors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No collectors found
                  </TableCell>
                </TableRow>
              ) : (
                collectors?.map((collector) => (
                  <TableRow key={collector.id}>
                    <TableCell>{collector.name}</TableCell>
                    <TableCell>
                      {collector.prefix}-{collector.number}
                    </TableCell>
                    <TableCell>{collector.email || "—"}</TableCell>
                    <TableCell>{collector.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={collector.active ? "success" : "secondary"}>
                        {collector.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
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