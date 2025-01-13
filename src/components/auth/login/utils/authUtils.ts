import { supabase } from "@/integrations/supabase/client";

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
  
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second between retries
  let lastError = null;

  // Ensure we have a clean auth state before starting
  await clearAuthState();

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
        console.error(`Member verification error (attempt ${attempt}):`, {
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint,
          code: memberError.code
        });
        
        if (memberError.message?.includes('Failed to fetch') || 
            memberError.code === '502' ||
            memberError.code === 'ECONNREFUSED' ||
            memberError.message?.includes('NetworkError') ||
            memberError.message?.includes('Network Error')) {
          lastError = new Error('Network connection error. Please check your connection and try again.');
          if (attempt === maxRetries) {
            throw lastError;
          }
          // Add a small random delay to prevent thundering herd
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
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
          error.message?.includes('NetworkError') ||
          error.message?.includes('Network Error')) {
        console.error(`Network error during verification (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          throw new Error('Network connection error. Please check your connection and try again.');
        }
        continue;
      }
      
      console.error(`Error during verification (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        throw new Error(lastError?.message || 'Unable to verify member. Please try again later.');
      }
    }
  }

  throw new Error('Failed to verify member after multiple attempts');
};

export const getAuthCredentials = (memberNumber: string) => ({
  email: `${memberNumber.toLowerCase()}@temp.com`,
  password: memberNumber,
});