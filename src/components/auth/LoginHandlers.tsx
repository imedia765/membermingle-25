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

    // Generate email for auth
    const email = `${cleanMemberId.toLowerCase()}@temp.pwaburton.org`;

    // Attempt to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: cleanMemberId
    });

    if (signInError) {
      console.error('Sign in failed:', signInError);
      throw new Error("Invalid credentials");
    }

    // Update the member record with the auth_user_id if not already set
    if (signInData.user && (!member.auth_user_id || member.auth_user_id !== signInData.user.id)) {
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          auth_user_id: signInData.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('member_number', cleanMemberId);

      if (updateError) {
        console.error('Failed to update member auth_user_id:', updateError);
      }
    }

    console.log("Login successful, redirecting to admin");
    navigate("/admin");

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}