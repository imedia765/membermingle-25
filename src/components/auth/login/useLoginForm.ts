import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember, getAuthCredentials } from './utils/authUtils';

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
      console.log('Starting login process for member:', memberNumber);

      // Clear any existing sessions first
      await clearAuthState();
      console.log('Auth state cleared');

      // Verify member with retries
      const member = await verifyMember(memberNumber);
      console.log('Member verified:', member);

      const { email, password } = getAuthCredentials(memberNumber);
      console.log('Attempting sign in for:', email);

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('Invalid credentials, attempting signup');
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                member_number: memberNumber,
              }
            }
          });

          if (signUpError) {
            console.error('Signup error:', signUpError);
            throw signUpError;
          }

          if (!signUpData.user) {
            throw new Error('Failed to create user account');
          }

          console.log('Signup successful, updating member:', signUpData.user);
          
          const { error: updateError } = await supabase
            .from('members')
            .update({ auth_user_id: signUpData.user.id })
            .eq('id', member.id);

          if (updateError) {
            console.error('Error updating member:', updateError);
            throw updateError;
          }

          // Add member role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{ user_id: signUpData.user.id, role: 'member' }]);

          if (roleError) {
            console.error('Error adding member role:', roleError);
            throw roleError;
          }

          console.log('Member updated and role assigned');
        } else {
          throw signInError;
        }
      }

      // Verify session is established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('No session established');
        throw new Error('Failed to establish session');
      }

      console.log('Session established:', session);

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