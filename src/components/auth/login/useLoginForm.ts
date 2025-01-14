import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember } from './utils/authUtils';

export const useLoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !memberNumber.trim()) return;
    
    try {
      setLoading(true);
      console.log('Starting login process...');

      // Clear any existing sessions first
      await clearAuthState();
      console.log('Auth state cleared');

      // Verify member exists and is active
      const member = await verifyMember(memberNumber);
      console.log('Member verified:', member);

      if (!member.auth_user_id) {
        throw new Error('Member not configured for login. Please contact support.');
      }

      // Attempt to sign in with member number
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: memberNumber,
        password: memberNumber,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }

      if (!signInData.session) {
        console.error('No session established');
        throw new Error('Failed to establish session');
      }

      console.log('Session established:', signInData.session);

      // Clear any cached data
      await queryClient.cancelQueries();
      await queryClient.clear();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      setLoading(false);
      navigate('/', { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message.includes('Member not found')) {
        errorMessage = 'Member number not found or inactive';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid member number';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('Member not configured')) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };

  return {
    memberNumber,
    setMemberNumber,
    loading,
    handleLogin,
  };
};