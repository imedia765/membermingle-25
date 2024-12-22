import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleMemberIdSubmit = async (memberId: string, password: string) => {
    try {
      console.log("Looking up member:", memberId);
      
      // First, get the member details
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, email, default_password_hash, password_changed, auth_user_id')
        .eq('member_number', memberId)
        .maybeSingle();

      if (memberError) {
        console.error('Member lookup error:', memberError);
        throw new Error("Error checking member status. Please try again later.");
      }

      if (!member) {
        throw new Error("Invalid Member ID. Please check your credentials and try again.");
      }

      // Generate temp email for auth
      const tempEmail = `${memberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with:", tempEmail);

      // First try to sign in
      let authResponse = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password,
      });

      // If sign in fails, try to sign up
      if (authResponse.error && authResponse.error.message.includes('Invalid login credentials')) {
        console.log("Sign in failed, attempting signup");
        authResponse = await supabase.auth.signUp({
          email: tempEmail,
          password: password,
          options: {
            data: {
              member_id: member.id,
            },
          },
        });

        if (authResponse.error) {
          console.error('Sign up error:', authResponse.error);
          throw new Error("Failed to create account. Please try again.");
        }

        // Try signing in again after signup
        authResponse = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: password,
        });
      }

      if (authResponse.error || !authResponse.data?.user) {
        console.error('Final auth error:', authResponse.error);
        throw new Error("Authentication failed. Please check your credentials and try again.");
      }

      // Update auth_user_id if not set
      if (!member.auth_user_id) {
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: authResponse.data.user.id,
            email_verified: true,
            profile_updated: true
          })
          .eq('id', member.id);

        if (updateError) {
          console.error('Error updating auth_user_id:', updateError);
        }
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      setIsLoggedIn(true);

      // Check if password needs to be changed
      if (!member.password_changed) {
        navigate("/change-password");
        return;
      }

      navigate("/admin/profile");
    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    handleMemberIdSubmit,
  };
};