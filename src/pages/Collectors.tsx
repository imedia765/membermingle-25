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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Collectors = () => {
  // Query to fetch collectors
  const { data: collectors, isLoading: isLoadingCollectors } = useQuery({
    queryKey: ["collectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select(`
          id,
          full_name,
          member_number,
          email,
          phone,
          status,
          (
            assigned_members:members(
              id,
              full_name,
              member_number,
              email,
              phone,
              status
            )
          )
        `)
        .eq("role", "collector")
        .order("full_name");

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
            <h1 className="text-2xl font-bold">Collectors ({collectors?.length || 0})</h1>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Member Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCollectors ? (
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
                    <TableCell>
                      <Accordion type="single" collapsible>
                        <AccordionItem value={collector.id}>
                          <AccordionTrigger>{collector.full_name}</AccordionTrigger>
                          <AccordionContent>
                            <div className="rounded-md border mt-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Member Name</TableHead>
                                    <TableHead>Member Number</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {collector.assigned_members?.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center">
                                        No members assigned
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    collector.assigned_members?.map((member) => (
                                      <TableRow key={member.id}>
                                        <TableCell>{member.full_name}</TableCell>
                                        <TableCell>{member.member_number}</TableCell>
                                        <TableCell>{member.email || "—"}</TableCell>
                                        <TableCell>
                                          <Badge variant={member.status === "active" ? "success" : "secondary"}>
                                            {member.status || "Inactive"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TableCell>
                    <TableCell>{collector.member_number}</TableCell>
                    <TableCell>{collector.email || "—"}</TableCell>
                    <TableCell>{collector.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={collector.status === "active" ? "success" : "secondary"}>
                        {collector.status || "Inactive"}
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