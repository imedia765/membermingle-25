import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
        throw profileError;
      }

      // If no profile exists, create one with default role
      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: 'member',
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberId = formData.get("memberId") as string;
    const password = formData.get("password") as string;

    try {
      // First, check if member exists in members table
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('member_number', memberId.toUpperCase())
        .single();

      if (memberError) {
        throw new Error("Member ID not found");
      }

      // Use existing email if available, otherwise create a temporary one
      const email = member.email || `${memberId.toLowerCase()}@temp.pwaburton.org`;

      // Try to sign in first (in case they already have an account)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError && signInError.message.includes('Invalid login')) {
        // If login fails, this might be their first time, so create an account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              member_number: memberId,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Create or update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signUpData.user!.id,
            email,
            role: 'member',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) throw profileError;

        // Update member record with email if needed
        if (!member.email) {
          const { error: updateError } = await supabase
            .from('members')
            .update({ 
              email,
              updated_at: new Date().toISOString(),
            })
            .eq('member_number', memberId);

          if (updateError) throw updateError;
        }

        toast({
          title: "Account created",
          description: "Your account has been created successfully. You can now log in.",
        });
      } else {
        // Successful login
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid member ID or password",
        variant: "destructive",
      });
    }
  };

  return {
    handleEmailSubmit,
    handleGoogleLogin: async () => {
      console.log("Google login attempt started");
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + "/admin",
          },
        });

        console.log("Google login response:", { data, error });
        if (error) throw error;
        
        toast({
          title: "Redirecting to Google",
          description: "Please wait while we redirect you to Google sign-in...",
        });
      } catch (error) {
        console.error("Google login error:", error);
        toast({
          title: "Login failed",
          description: error instanceof Error ? error.message : "An error occurred during Google login",
          variant: "destructive",
        });
      }
    },
    handleMemberIdSubmit,
  };
};