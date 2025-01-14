import { supabase } from "@/integrations/supabase/client";

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

export const clearAuthState = async () => {
  try {
    console.log('[Auth Debug] Clearing auth state...');
    await supabase.auth.signOut({ scope: 'local' });
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('[Auth Debug] Auth state cleared successfully');
  } catch (error) {
    console.error('[Auth Debug] Error clearing auth state:', error);
    throw error;
  }
};

export const verifyMember = async (memberNumber: string) => {
  console.log('[Auth Debug] Starting member verification for:', memberNumber);
  
  let lastError: Error | null = null;
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      if (attempt > 1) {
        const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.random() * 300;
        const waitTime = delay + jitter;
        console.log(`[Auth Debug] Retry attempt ${attempt}, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      console.log(`[Auth Debug] Attempt ${attempt} to verify member ${memberNumber}`);

      // Check current session first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Auth Debug] Current session:', session);

      // Verify member exists and is active
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, status, auth_user_id')
        .eq('member_number', memberNumber)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        console.error(`[Auth Debug] Member verification error (attempt ${attempt}):`, {
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint,
          code: memberError.code
        });
        
        if (memberError.message?.includes('Failed to fetch') || 
            memberError.code === '502' ||
            memberError.code === 'ECONNREFUSED' ||
            memberError.message?.includes('NetworkError')) {
          lastError = new Error('Network connection error. Please check your connection and try again.');
          attempt++;
          continue;
        }

        throw memberError;
      }

      if (!member) {
        console.log('[Auth Debug] Member not found or inactive:', memberNumber);
        throw new Error('Member not found or inactive');
      }

      console.log('[Auth Debug] Member verified successfully:', member);
      return member;

    } catch (error: any) {
      lastError = error;
      
      if (error.message === 'Member not found or inactive') {
        console.error('[Auth Debug] Member verification failed:', error.message);
        throw error;
      }
      
      if (error.message?.includes('Failed to fetch') || 
          error.code === '502' ||
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('NetworkError')) {
        console.error(`[Auth Debug] Network error during verification (attempt ${attempt}):`, error);
        if (attempt === MAX_RETRIES) {
          throw new Error('Network connection error. Please check your connection and try again.');
        }
        attempt++;
        continue;
      }
      
      console.error(`[Auth Debug] Error during verification (attempt ${attempt}):`, error);
      
      if (attempt === MAX_RETRIES) {
        throw new Error(lastError?.message || 'Unable to verify member. Please try again later.');
      }
      attempt++;
    }
  }

  throw new Error('Failed to verify member after multiple attempts');
};