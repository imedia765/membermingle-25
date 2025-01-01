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
          await handleAuthError(error);
          return;
        }
        
        if (session?.access_token && session?.refresh_token) {
          console.log("Active session found");
          setIsLoggedIn(true);
          
          // Verify member record exists and is properly linked
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .single();
            
          if (memberError || !memberData) {
            console.error("Member record verification failed:", memberError);
            await handleAuthError(new Error("Member record not found"));
            return;
          }
          
          if (window.location.pathname === "/login") {
            navigate("/admin");
          }
        } else {
          console.log("No active session");
          await handleNoSession();
        }
      } catch (error) {
        console.error("Session check failed:", error);
        await handleAuthError(error);
      }
    };

    const handleAuthError = async (error: any) => {
      console.error("Auth error:", error);
      
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      
      toast({
        title: "Session error",
        description: "Please log in again",
        variant: "destructive",
      });
      
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        navigate("/login");
      }
    };

    const handleNoSession = async () => {
      setIsLoggedIn(false);
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        navigate("/login");
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      if (event === "SIGNED_IN" && session) {
        setIsLoggedIn(true);
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
        navigate("/admin");
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        navigate("/login");
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, setIsLoggedIn, toast]);
};