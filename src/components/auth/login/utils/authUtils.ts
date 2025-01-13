import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from '@tanstack/react-query';

export const clearAuthState = async () => {
  console.log('Clearing existing session...');
  try {
    await supabase.auth.signOut({ scope: 'local' });
    await new QueryClient().clear();
    localStorage.clear();
    sessionStorage.clear();
    
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('Auth state cleared successfully');
  } catch (error) {
    console.error('Error clearing auth state:', error);
    throw error;
  }
};

export const verifyMember = async (memberNumber: string) => {
  console.log('Verifying member:', memberNumber);
  
  const maxRetries = 3;
  const retryDelay = 3000; // 3 seconds between retries

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`Waiting ${retryDelay}ms before attempt ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      console.log(`Attempt ${attempt} to verify member ${memberNumber}`);
      
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, status')
        .eq('member_number', memberNumber)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        console.error(`Member verification error (attempt ${attempt}):`, memberError);
        
        if (memberError.message?.includes('JWT') || memberError.message?.includes('token')) {
          console.log('JWT/token error detected, clearing session...');
          await clearAuthState();
        }
        
        if (attempt === maxRetries) {
          console.error('Max retries reached, throwing error');
          throw memberError;
        }
        continue;
      }

      if (!member) {
        console.log('No member found or inactive status');
        throw new Error('Member not found or inactive');
      }

      console.log('Member verified successfully:', member);
      return member;
    } catch (error: any) {
      if (error.message === 'Member not found or inactive') {
        console.error('Member verification failed: Not found or inactive');
        throw error;
      }
      
      if (error.message?.includes('Failed to fetch')) {
        console.error(`Network error during verification (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          throw new Error('Network connection error. Please check your connection and try again.');
        }
        continue;
      }
      
      console.error(`Error during verification (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        console.error('Max retries reached after errors');
        throw new Error('Unable to verify member. Please try again later.');
      }
    }
  }

  throw new Error('Failed to verify member after multiple attempts');
};

export const getAuthCredentials = (memberNumber: string) => ({
  email: `${memberNumber.toLowerCase()}@temp.com`,
  password: memberNumber,
});

export const handleSignInError = async (error: any, email: string, password: string) => {
  console.error('Sign in error:', error);
  
  if (error.message?.includes('refresh_token_not_found') || 
      error.message?.includes('token') || 
      error.message?.includes('JWT')) {
    console.log('Token error detected, clearing session and retrying...');
    await clearAuthState();
    
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (retryError) {
      console.error('Retry sign in failed:', retryError);
      throw retryError;
    }
  } else {
    throw error;
  }
};