import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First verify member credentials using RPC
      const { data: memberData, error: rpcError } = await supabase.rpc('authenticate_member', {
        p_member_number: memberNumber,
        p_password: password
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error('Invalid credentials');
      }

      if (!memberData || memberData.length === 0) {
        throw new Error('Invalid credentials');
      }

      // Use member number as email (temporary solution)
      const email = `${memberNumber}@temp.com`;

      // Sign in with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: memberNumber // Using member number as password for now
      });

      if (signInError) {
        // If sign in fails, try to create the user
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: memberNumber,
          options: {
            data: {
              member_number: memberNumber,
              role: memberData[0].role,
            }
          }
        });

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          throw signUpError;
        }

        // Try signing in again after creation
        const { error: finalSignInError } = await supabase.auth.signInWithPassword({
          email,
          password: memberNumber,
        });

        if (finalSignInError) {
          console.error("Final sign in error:", finalSignInError);
          throw finalSignInError;
        }
      }

      // Update the member's auth_user_id if needed
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await supabase
          .from('members')
          .update({ auth_user_id: authData.user.id })
          .eq('member_number', memberNumber);
      }

      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 w-full max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="memberNumber">Member Number</Label>
        <Input
          id="memberNumber"
          type="text"
          value={memberNumber}
          onChange={(e) => setMemberNumber(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};