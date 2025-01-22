import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CollectorInfo, UserRole } from '@/types/collector-roles';

export const useCollectorRoles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collectors, isLoading, error, refetch } = useQuery({
    queryKey: ['collectors-roles'],
    queryFn: async () => {
      try {
        const { data: collectorsData, error: collectorsError } = await supabase
          .from('members_collectors')
          .select(`
            *,
            members!inner (
              full_name,
              auth_user_id,
              member_number
            )
          `)
          .eq('active', true);

        if (collectorsError) throw collectorsError;

        const transformedData: CollectorInfo[] = await Promise.all(
          (collectorsData || []).map(async (collector) => {
            const authUserId = collector.members?.[0]?.auth_user_id;
            
            if (!authUserId) {
              console.log(`No auth_user_id found for collector: ${collector.name}`);
              return {
                full_name: collector.name || 'N/A',
                member_number: collector.member_number || '',
                roles: [],
                auth_user_id: null,
                role_details: [],
                email: collector.email || '',
                phone: collector.phone || '',
                prefix: collector.prefix || '',
                number: collector.number || '',
                enhanced_roles: [],
                sync_status: {
                  id: '',
                  user_id: '',
                  sync_started_at: null,
                  last_attempted_sync_at: null,
                  status: 'pending',
                  error_message: 'No auth user ID associated',
                  store_status: 'pending',
                  store_error: 'No auth user ID associated'
                }
              };
            }

            const [userRoles, syncStatus] = await Promise.all([
              supabase
                .from('user_roles')
                .select('role, created_at')
                .eq('user_id', authUserId),
              supabase
                .from('sync_status')
                .select('*')
                .eq('user_id', authUserId)
                .maybeSingle()
            ]);

            return {
              full_name: collector.name || 'N/A',
              member_number: collector.member_number || '',
              roles: userRoles.data?.map(ur => ur.role as UserRole) || [],
              auth_user_id: authUserId,
              role_details: userRoles.data?.map(ur => ({
                role: ur.role as UserRole,
                created_at: ur.created_at
              })) || [],
              email: collector.email || '',
              phone: collector.phone || '',
              prefix: collector.prefix || '',
              number: collector.number || '',
              enhanced_roles: [],
              sync_status: syncStatus.data || {
                id: '',
                user_id: authUserId,
                sync_started_at: null,
                last_attempted_sync_at: null,
                status: 'pending',
                error_message: null,
                store_status: 'pending',
                store_error: null
              }
            };
          })
        );

        return transformedData;
      } catch (err) {
        console.error('Error in collector roles query:', err);
        throw err;
      }
    }
  });

  const handleRoleChange = async (userId: string, role: UserRole) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Invalid user ID provided",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ 
          user_id: userId, 
          role: role 
        });

      if (error) throw error;

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
    if (!userId) {
      toast({
        title: "Error",
        description: "Invalid user ID for sync",
        variant: "destructive",
      });
      return;
    }

    try {
      await supabase.rpc('perform_user_roles_sync');
      
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