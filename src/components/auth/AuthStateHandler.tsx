import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAuthStateHandler = (setIsLoggedIn: (value: boolean) => void) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up auth state handler");
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Initial session check:", { session, error });
        
        if (error) {
          console.error("Session check error:", error);
          // Clear any stale session data
          await supabase.auth.signOut();
          setIsLoggedIn(false);
          return;
        }
        
        if (session) {
          console.log("Active session found");
          setIsLoggedIn(true);
          
          // Check if user needs to complete profile
          const { data: member } = await supabase
            .from('members')
            .select('first_time_login, profile_completed')
            .eq('email', session.user.email)
            .single();
            
          if (member?.first_time_login || !member?.profile_completed) {
            console.log("Redirecting to profile for completion");
            navigate("/admin/profile");
            toast({
              title: "Welcome!",
              description: "Please complete your profile information.",
            });
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        // Clear any stale session data on error
        await supabase.auth.signOut();
        setIsLoggedIn(false);
      }
    };

    // Initial session check
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      switch (event) {
        case "SIGNED_IN":
          if (session) {
            console.log("Sign in event detected");
            setIsLoggedIn(true);
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
            handleSuccessfulLogin(session, navigate);
          }
          break;
          
        case "SIGNED_OUT":
          console.log("User signed out");
          setIsLoggedIn(false);
          navigate("/");
          break;
          
        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully");
          if (session) {
            setIsLoggedIn(true);
          }
          break;
          
        case "USER_UPDATED":
          console.log("User data updated");
          break;

        case "INITIAL_SESSION":
          console.log("Initial session:", session);
          setIsLoggedIn(!!session);
          break;
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, setIsLoggedIn, toast]);
};

const handleSuccessfulLogin = async (session: any, navigate: (path: string) => void) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { data: member, error } = await supabase
      .from('members')
      .select('first_time_login, profile_completed, email_verified')
      .eq('email', user.email)
      .maybeSingle();

    if (error) {
      console.error("Error checking member status:", error);
      navigate("/admin/profile");
      return;
    }

    // Check if profile needs to be completed
    if (member && (member.first_time_login || !member.profile_completed)) {
      navigate("/admin/profile");
      return;
    }

    // If all checks pass, redirect to profile
    navigate("/admin/profile");
  } catch (error) {
    console.error("Error in handleSuccessfulLogin:", error);
    navigate("/admin/profile");
  }
};