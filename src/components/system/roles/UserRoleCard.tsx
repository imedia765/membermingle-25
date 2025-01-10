import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import RoleSelect from './RoleSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

interface UserRoleCardProps {
  user: {
    id: string;
    user_id: string;
    full_name: string;
    member_number: string;
    role: UserRole;
    auth_user_id: string;
    user_roles: { role: UserRole }[];
  };
  onRoleChange: (userId: string, newRole: UserRole) => void;
}

interface AuthDebugInfo {
  lastSignIn?: string;
  lastFailedAttempt?: string;
  sessionStatus: 'active' | 'expired' | 'none';
  authErrors: string[];
}

const UserRoleCard = ({ user, onRoleChange }: UserRoleCardProps) => {
  const [showDebug, setShowDebug] = useState(false);

  // Fetch auth debug information
  const { data: debugInfo } = useQuery({
    queryKey: ['auth-debug', user.id],
    queryFn: async (): Promise<AuthDebugInfo> => {
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('table_name', 'auth')
        .order('timestamp', { ascending: false })
        .limit(5);

      const { data: { session } } = await supabase.auth.getSession();
      
      const authErrors = auditLogs
        ?.filter(log => log.severity === 'error')
        .map(log => log.new_values as string || 'Unknown error') || [];

      const lastSignIn = auditLogs
        ?.find(log => log.operation === 'create' && !log.severity)
        ?.timestamp;

      const lastFailedAttempt = auditLogs
        ?.find(log => log.severity === 'error')
        ?.timestamp;

      return {
        lastSignIn: lastSignIn ? new Date(lastSignIn).toLocaleString() : undefined,
        lastFailedAttempt: lastFailedAttempt ? new Date(lastFailedAttempt).toLocaleString() : undefined,
        sessionStatus: session ? 'active' : 'none',
        authErrors
      };
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-5 bg-dashboard-card/50 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-dashboard-text font-medium">{user.full_name}</p>
            <p className="text-dashboard-muted text-sm">ID: {user.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <RoleSelect 
            currentRole={user.role} 
            userId={user.user_id} 
            onRoleChange={(newRole) => onRoleChange(user.user_id, newRole)} 
          />
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 hover:bg-dashboard-hover rounded-full transition-colors"
          >
            {showDebug ? (
              <ChevronUp className="h-5 w-5 text-dashboard-muted" />
            ) : (
              <ChevronDown className="h-5 w-5 text-dashboard-muted" />
            )}
          </button>
        </div>
      </div>

      {showDebug && debugInfo && (
        <div className="px-5 py-4 bg-dashboard-card/30 rounded-lg border border-dashboard-border">
          <h4 className="text-sm font-medium text-dashboard-accent2 mb-3">Debug Information</h4>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-dashboard-muted">Last Sign In</TableCell>
                <TableCell>{debugInfo.lastSignIn || 'Never'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-dashboard-muted">Session Status</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    debugInfo.sessionStatus === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {debugInfo.sessionStatus}
                  </span>
                </TableCell>
              </TableRow>
              {debugInfo.lastFailedAttempt && (
                <TableRow>
                  <TableCell className="text-dashboard-muted">Last Failed Attempt</TableCell>
                  <TableCell className="text-red-400">{debugInfo.lastFailedAttempt}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {debugInfo.authErrors.length > 0 && (
            <div className="mt-4">
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-sm font-medium mb-2">Recent Auth Errors</div>
                  <ul className="list-disc list-inside space-y-1">
                    {debugInfo.authErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRoleCard;