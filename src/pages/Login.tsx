import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with member ID:", memberId);
      
      // First, get the member's email using their member ID
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('email, auth_user_id')
        .eq('member_number', memberId.trim())
        .limit(1);

      if (memberError) {
        console.error("Member lookup error:", memberError);
        throw new Error("Error looking up member. Please try again.");
      }

      if (!memberData || memberData.length === 0 || !memberData[0].email) {
        console.error("No member found with ID:", memberId);
        throw new Error("No member found with this ID. Please check and try again.");
      }

      console.log("Found member:", memberData[0]);

      // Now sign in with email/password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: memberData[0].email,
        password: password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        throw signInError;
      }

      console.log("Login successful");
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error 
          ? error.message 
          : "Invalid member ID or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Member Login</CardTitle>
          <CardDescription>Sign in with your member ID and password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberId">Member ID</Label>
              <Input
                id="memberId"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Enter your member ID"
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
                placeholder="Enter your password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
