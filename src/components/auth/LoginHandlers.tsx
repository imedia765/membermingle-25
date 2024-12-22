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
        throw new Error("Invalid Member ID. Please check your credentials.");
      }

      console.log("Found member:", member);

      // Generate temp email for auth
      const tempEmail = `${memberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with:", tempEmail);

      // Ensure password meets minimum length requirement
      const minPasswordLength = 6;
      const actualPassword = password.length < minPasswordLength ? password.padEnd(minPasswordLength, password) : password;

      try {
        // Try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: actualPassword,
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
          throw signInError;
        }

        if (!signInData.user) {
          throw new Error("Login failed. Please try again.");
        }

        // Update auth_user_id if not set
        if (!member.auth_user_id) {
          const { error: updateError } = await supabase
            .from('members')
            .update({ 
              auth_user_id: signInData.user.id,
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
      } catch (authError: any) {
        console.error("Authentication error:", authError);
        
        // If login fails and it's a new user, try to sign up
        if (authError.message?.includes('Invalid login credentials')) {
          console.log("Attempting signup for new user");
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: tempEmail,
            password: actualPassword,
          });

          if (signUpError) {
            console.error('Sign up error:', signUpError);
            throw new Error("Failed to create account. Please try again.");
          }

          if (!signUpData.user) {
            throw new Error("Failed to create account. Please try again.");
          }

          // Try signing in again after signup
          const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
            email: tempEmail,
            password: actualPassword,
          });

          if (finalSignInError || !finalSignInData.user) {
            throw new Error("Login failed after account creation. Please try again.");
          }

          toast({
            title: "Account created and logged in",
            description: "Welcome!",
          });
          
          setIsLoggedIn(true);
          navigate("/admin/profile");
        } else {
          throw new Error("Authentication failed. Please check your credentials and try again.");
        }
      }
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