import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  try {
    const cleanMemberId = memberId.toUpperCase().trim();
    console.log("Attempting login with member_number:", cleanMemberId);
    
    // First, authenticate the member using our secure function
    const { data: authData, error: authError } = await supabase
      .rpc('authenticate_member', {
        p_member_number: cleanMemberId
      });
    
    if (authError) {
      console.error("Member authentication failed:", authError);
      throw new Error("Invalid member ID");
    }

    if (!authData || authData.length === 0) {
      console.error("No member found with ID:", cleanMemberId);
      throw new Error("Invalid member ID");
    }

    const member = authData[0];
    console.log("Member authenticated:", member);

    // Verify the password matches the member number
    if (password !== cleanMemberId) {
      console.error("Password verification failed");
      throw new Error("Invalid credentials");
    }

    // If member already has an auth account, try to sign in
    if (member.auth_user_id) {
      console.log("Attempting login with existing account");
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: member.email || `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`,
        password: cleanMemberId
      });

      if (!signInError && signInData) {
        console.log("Login successful with existing account");
        navigate("/admin");
        return;
      }
      
      // If sign in failed, we'll try to create a new account
      console.log("Login failed, will try to create new account:", signInError);
    }

    // Generate a valid email for auth
    const email = member.email || `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;

    console.log("Creating new auth account for member");

    // Create new auth account with metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: cleanMemberId,
      options: {
        data: {
          member_number: cleanMemberId,
          full_name: member.full_name
        }
      }
    });

    if (signUpError) {
      console.error('Sign up failed:', signUpError);
      throw new Error("Account creation failed");
    }

    if (!signUpData.user) {
      console.error('Sign up succeeded but no user returned');
      throw new Error("Account creation failed");
    }

    // Wait for database trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Final sign in attempt
    const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: cleanMemberId
    });

    if (finalSignInError) {
      console.error('Final sign in attempt failed:', finalSignInError);
      throw new Error("Login failed after account creation");
    }

    console.log("Login successful, redirecting to admin");
    navigate("/admin");

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}