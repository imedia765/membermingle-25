import { supabase } from "@/integrations/supabase/client";

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

export const clearAuthState = async () => {
  try {
    console.log('Clearing auth state...');
    await supabase.auth.signOut({ scope: 'local' });
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
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
  
  let lastError: Error | null = null;
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      if (attempt > 1) {
        // Exponential backoff with jitter
        const delay = Math.min(BASE_DELAY * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.random() * 300;
        const waitTime = delay + jitter;
        console.log(`Waiting ${waitTime}ms before attempt ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      console.log(`Attempt ${attempt} to verify member ${memberNumber}`);

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, status')
        .eq('member_number', memberNumber)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        console.error(`Member verification error (attempt ${attempt}):`, {
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
        throw new Error('Member not found or inactive');
      }

      console.log('Member verified:', member);
      return member;

    } catch (error: any) {
      lastError = error;
      
      if (error.message === 'Member not found or inactive') {
        throw error;
      }
      
      if (error.message?.includes('Failed to fetch') || 
          error.code === '502' ||
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('NetworkError')) {
        console.error(`Network error during verification (attempt ${attempt}):`, error);
        if (attempt === MAX_RETRIES) {
          throw new Error('Network connection error. Please check your connection and try again.');
        }
        attempt++;
        continue;
      }
      
      console.error(`Error during verification (attempt ${attempt}):`, error);
      
      if (attempt === MAX_RETRIES) {
        throw new Error(lastError?.message || 'Unable to verify member. Please try again later.');
      }
      attempt++;
    }
  }

  throw new Error('Failed to verify member after multiple attempts');
};

export const getAuthCredentials = (memberNumber: string) => ({
  email: `${memberNumber.toLowerCase()}@temp.com`,
  password: memberNumber,
});