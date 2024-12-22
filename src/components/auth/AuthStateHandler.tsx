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
          await supabase.auth.signOut();
          setIsLoggedIn(false);
          return;
        }
        
        if (session) {
          console.log("Active session found");
          setIsLoggedIn(true);
          
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
        await supabase.auth.signOut();
        setIsLoggedIn(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      if (event === "SIGNED_IN" && session) {
        console.log("Sign in event detected");
        setIsLoggedIn(true);
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user?.email) return;

          const { data: member, error } = await supabase
            .from('members')
            .select('first_time_login, profile_completed')
            .eq('email', user.email)
            .maybeSingle();

          if (error) {
            console.error("Error checking member status:", error);
            navigate("/admin/profile");
            return;
          }

          if (member && (member.first_time_login || !member.profile_completed)) {
            navigate("/admin/profile");
          } else {
            navigate("/admin/profile");
          }
        } catch (error) {
          console.error("Error handling successful login:", error);
          navigate("/admin/profile");
        }
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setIsLoggedIn(false);
        navigate("/");
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("Token refreshed successfully");
        setIsLoggedIn(true);
      } else if (event === "USER_UPDATED") {
        console.log("User data updated");
      } else if (event === "INITIAL_SESSION") {
        console.log("Initial session:", session);
        setIsLoggedIn(!!session);
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, setIsLoggedIn, toast]);
};