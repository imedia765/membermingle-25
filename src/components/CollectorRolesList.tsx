import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody } from '@/components/ui/table';
import { CollectorRolesHeader } from './collectors/roles/CollectorRolesHeader';
import { CollectorRolesRow } from './collectors/roles/CollectorRolesRow';
import { CollectorInfo, UserRole } from '@/types/collector-roles';

const CollectorRolesList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading, error, refetch } = useQuery({
    queryKey: ['collectors-roles'],
    queryFn: async () => {
      try {
        console.log('Fetching collectors data...');
        // First, get all active collectors
        const { data: collectorsData, error: collectorsError } = await supabase
          .from('members_collectors')
          .select('*, members(full_name, auth_user_id)')
          .eq('active', true);

        if (collectorsError) throw collectorsError;

        // Then fetch roles and enhanced roles for each collector
        const transformedData: CollectorInfo[] = await Promise.all(
          (collectorsData || []).map(async (collector) => {
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role, created_at')
              .eq('user_id', collector.members?.[0]?.auth_user_id);

            const { data: enhancedRoles } = await supabase
              .from('enhanced_roles')
              .select('role_name, is_active')
              .eq('user_id', collector.members?.[0]?.auth_user_id);

            const { data: syncStatus } = await supabase
              .from('sync_status')
              .select('*')
              .eq('user_id', collector.members?.[0]?.auth_user_id)
              .maybeSingle();

            return {
              full_name: collector.members?.[0]?.full_name || collector.name || 'N/A',
              member_number: collector.member_number || '',
              roles: (userRoles || []).map(ur => ur.role as UserRole),
              auth_user_id: collector.members?.[0]?.auth_user_id || '',
              role_details: (userRoles || []).map(ur => ({
                role: ur.role as UserRole,
                created_at: ur.created_at
              })),
              email: collector.email || '',
              phone: collector.phone || '',
              prefix: collector.prefix || '',
              number: collector.number || '',
              enhanced_roles: (enhancedRoles || []).map(er => ({
                role_name: er.role_name,
                is_active: er.is_active || false
              })),
              sync_status: syncStatus || undefined
            };
          })
        );

        return transformedData;
      } catch (err) {
        console.error('Error in collectors query:', err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      console.log('Updating role for user:', userId, 'to:', role);
      
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ 
          user_id: userId, 
          role: role 
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collectors-roles'] }),
        queryClient.invalidateQueries({ queryKey: ['user-roles'] })
      ]);

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${role}`,
      });
    } catch (error) {
      console.error('Role change error:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (userId: string) => {
    try {
      // Update sync status to indicate sync is in progress
      await supabase
        .from('sync_status')
        .upsert({
          user_id: userId,
          sync_started_at: new Date().toISOString(),
          status: 'in_progress'
        });

      // Trigger roles sync
      await supabase.rpc('perform_user_roles_sync');

      // Update sync status to completed
      await supabase
        .from('sync_status')
        .upsert({
          user_id: userId,
          last_attempted_sync_at: new Date().toISOString(),
          status: 'completed'
        });

      await queryClient.invalidateQueries({ queryKey: ['collectors-roles'] });

      toast({
        title: "Sync Complete",
        description: "User roles have been synchronized",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Error",
        description: "Failed to sync user roles",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-dashboard-error">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span>Error loading collectors</span>
        <button 
          onClick={() => refetch()} 
          className="ml-4 text-dashboard-accent1 hover:text-dashboard-accent2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 bg-gradient-to-br from-dashboard-dark to-dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-dashboard-accent1 to-dashboard-accent2 bg-clip-text text-transparent">
          Active Collectors and Roles
        </h2>
        <Badge variant="outline" className="text-dashboard-accent1 border-dashboard-accent1">
          {collectors?.length || 0} Collectors
        </Badge>
      </div>

      <Card className="p-6 bg-dashboard-card border-dashboard-cardBorder hover:border-dashboard-cardBorderHover transition-all duration-300">
        <Table>
          <CollectorRolesHeader />
          <TableBody>
            {collectors?.map(collector => (
              <CollectorRolesRow
                key={collector.member_number}
                collector={collector}
                onRoleChange={handleRoleChange}
                onSync={handleSync}
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CollectorRolesList;