import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserSearch } from "./UserSearch";
import { UserList } from "./UserList";
import { Member } from "@/types/member";
import { useToast } from "@/components/ui/use-toast";

export function UserManagementSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  // Initial update for TM10003
  const makeAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update({ role: 'admin' })
        .eq('member_number', 'TM10003')
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "User TM10003 has been made an admin",
      });

      // Refetch the data
      refetch();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const { data: users, refetch } = useQuery({
    queryKey: ['members', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        if (['member', 'collector', 'admin'].includes(searchTerm.toLowerCase())) {
          query = query.or(`email.ilike.%${searchTerm}%,role.eq.${searchTerm.toLowerCase()}`);
        } else {
          query = query.ilike('email', `%${searchTerm}%`);
        }
      }

      const { data: members, error } = await query;

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }

      return members as Member[];
    },
  });

  // Execute the update immediately when component mounts
  useEffect(() => {
    makeAdmin();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <UserSearch 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          
          {users?.length ? (
            <UserList 
              users={users}
              onUpdate={refetch}
              updating={updating}
              setUpdating={setUpdating}
            />
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}