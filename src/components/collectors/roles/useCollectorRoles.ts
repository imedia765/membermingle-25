import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CollectorInfo, UserRole, SyncStatus } from '@/types/collector-roles';

export const useCollectorRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading, error, refetch } = useQuery({
    queryKey: ['collectors-roles'],
    queryFn: async () => {
      try {
        console.log('Fetching collectors data...');
        const { data: collectorsData, error: collectorsError } = await supabase
          .from('members_collectors')
          .select('*, members(full_name, auth_user_id)')
          .eq('active', true);

        if (collectorsError) throw collectorsError;

        const transformedData: CollectorInfo[] = await Promise.all(
          (collectorsData || []).map(async (collector) => {
            const authUserId = collector.members?.[0]?.auth_user_id;
            
            if (!authUserId) {
              console.log(`No auth_user_id found for collector: ${collector.name}`);
              const defaultSyncStatus: SyncStatus = {
                id: '',
                user_id: '',
                sync_started_at: null,
                last_attempted_sync_at: null,
                status: 'pending',
                error_message: 'No auth user ID associated',
                store_status: 'pending',
                store_error: 'No auth user ID associated'
              };

              return {
                full_name: collector.members?.[0]?.full_name || collector.name || 'N/A',
                member_number: collector.member_number || '',
                roles: [],
                auth_user_id: '',
                role_details: [],
                email: collector.email || '',
                phone: collector.phone || '',
                prefix: collector.prefix || '',
                number: collector.number || '',
                enhanced_roles: [],
                sync_status: defaultSyncStatus
              };
            }

            try {
              const [userRolesResult, enhancedRolesResult, syncStatusResult] = await Promise.all([
                supabase
                  .from('user_roles')
                  .select('role, created_at')
                  .eq('user_id', authUserId),
                supabase
                  .from('enhanced_roles')
                  .select('role_name, is_active')
                  .eq('user_id', authUserId),
                supabase
                  .from('sync_status')
                  .select('*')
                  .eq('user_id', authUserId)
                  .maybeSingle()
              ]);

              if (userRolesResult.error) throw userRolesResult.error;
              if (enhancedRolesResult.error) throw enhancedRolesResult.error;
              if (syncStatusResult.error) throw syncStatusResult.error;

              const validRoles = (userRolesResult.data || [])
                .map(ur => ur.role)
                .filter((role): role is UserRole => 
                  ['admin', 'collector', 'member'].includes(role));

              return {
                full_name: collector.members?.[0]?.full_name || collector.name || 'N/A',
                member_number: collector.member_number || '',
                roles: validRoles,
                auth_user_id: authUserId,
                role_details: (userRolesResult.data || [])
                  .filter((ur): ur is { role: UserRole; created_at: string } => 
                    ['admin', 'collector', 'member'].includes(ur.role))
                  .map(ur => ({
                    role: ur.role,
                    created_at: ur.created_at
                  })),
                email: collector.email || '',
                phone: collector.phone || '',
                prefix: collector.prefix || '',
                number: collector.number || '',
                enhanced_roles: (enhancedRolesResult.data || []).map(er => ({
                  role_name: er.role_name,
                  is_active: er.is_active || false
                })),
                sync_status: syncStatusResult.data || {
                  id: '',
                  user_id: authUserId,
                  sync_started_at: null,
                  last_attempted_sync_at: null,
                  status: 'pending',
                  error_message: '',
                  store_status: 'pending',
                  store_error: null
                }
              };
            } catch (error) {
              console.error('Error fetching role data:', error);
              return {
                full_name: collector.members?.[0]?.full_name || collector.name || 'N/A',
                member_number: collector.member_number || '',
                roles: [],
                auth_user_id: authUserId,
                role_details: [],
                email: collector.email || '',
                phone: collector.phone || '',
                prefix: collector.prefix || '',
                number: collector.number || '',
                enhanced_roles: [],
                sync_status: {
                  id: '',
                  user_id: authUserId,
                  sync_started_at: null,
                  last_attempted_sync_at: null,
                  status: 'error',
                  error_message: error instanceof Error ? error.message : 'Unknown error occurred',
                  store_status: 'error',
                  store_error: error instanceof Error ? error.message : 'Unknown error occurred'
                }
              };
            }
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
      if (!userId || userId.trim() === '') {
        toast({
          title: "Error",
          description: "Invalid user ID provided",
          variant: "destructive",
        });
        return;
      }

      console.log('Updating role for user:', userId, 'to:', role);
      
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{ 
          user_id: userId, 
          role: role 
        }]);

      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ['collectors-roles'] });

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
      if (!userId || userId.trim() === '') {
        toast({
          title: "Error",
          description: "Invalid user ID for sync",
          variant: "destructive",
        });
        return;
      }

      await supabase
        .from('sync_status')
        .upsert({
          user_id: userId,
          sync_started_at: new Date().toISOString(),
          status: 'in_progress'
        });

      await supabase.rpc('perform_user_roles_sync');

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

  return {
    collectors,
    isLoading,
    error,
    refetch,
    handleRoleChange,
    handleSync
  };
};