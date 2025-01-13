import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember, getAuthCredentials, handleSignInError } from './utils/authUtils';

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
      const isMobile = window.innerWidth <= 768;
      console.log('Starting login process on device type:', isMobile ? 'mobile' : 'desktop');

      // Clear any existing sessions first
      await clearAuthState();
      console.log('Cleared existing auth state');

      const member = await verifyMember(memberNumber);
      const { email, password } = getAuthCredentials(memberNumber);
      
      console.log('Attempting sign in with:', { email });

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Failed to fetch')) {
          console.error('Network error during sign in:', signInError);
          throw new Error('Network connection error. Please check your connection and try again.');
        }

        if (signInError.message.includes('Invalid login credentials')) {
          console.log('Sign in failed, attempting signup');
          
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

          if (signUpData.user) {
            await updateMemberWithAuthId(member.id, signUpData.user.id);
            await addMemberRole(signUpData.user.id);

            console.log('Member updated and role assigned, attempting final sign in');
            
            const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (finalSignInError) {
              console.error('Final sign in error:', finalSignInError);
              throw finalSignInError;
            }

            if (!finalSignInData?.session) {
              throw new Error('Failed to establish session after signup');
            }
          }
        } else {
          await handleSignInError(signInError, email, password);
        }
      }

      // Verify session is established with retries
      let session = null;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second delay between retries

      while (!session && retryCount < maxRetries) {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error(`Session verification error (attempt ${retryCount + 1}):`, sessionError);
          retryCount++;
          if (retryCount === maxRetries) throw sessionError;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        if (currentSession) {
          session = currentSession;
          await queryClient.invalidateQueries({ queryKey: ['userRole', currentSession.user.id] });
          break;
        }

        retryCount++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      if (!session) {
        console.error('Failed to establish session after retries');
        throw new Error('Failed to establish session');
      }

      console.log('Session established successfully');
      
      await queryClient.cancelQueries();
      await queryClient.clear();
      await queryClient.invalidateQueries();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      setLoading(false);

      if (isMobile) {
        window.location.replace('/');
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.message.includes('Member not found')) {
        errorMessage = 'Member number not found or inactive';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid member number. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before logging in';
      } else if (error.message.includes('refresh_token_not_found')) {
        errorMessage = 'Session expired. Please try logging in again.';
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