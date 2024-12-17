import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PersonalInfoSection } from "@/components/registration/PersonalInfoSection";
import { NextOfKinSection } from "@/components/registration/NextOfKinSection";
import { SpousesSection } from "@/components/registration/SpousesSection";
import { DependantsSection } from "@/components/registration/DependantsSection";
import { MembershipSection } from "@/components/registration/MembershipSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { signUpUser, createUserProfile, createMember, createRegistration } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch } = useForm();
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log("Starting registration process with data:", { ...data, collectorId: selectedCollectorId });

      if (!selectedCollectorId) {
        toast({
          title: "Registration failed",
          description: "Please select a collector",
          variant: "destructive",
        });
        return;
      }

      // Step 1: Create auth user and wait for session
      const authData = await signUpUser(data.email, data.password);
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Wait for session to be established (max 10 seconds)
      let session = null;
      let attempts = 0;
      while (!session && attempts < 10) {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData.session;
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (!session) {
        throw new Error("Failed to establish session after multiple attempts");
      }

      // Step 2: Create user profile
      await createUserProfile(authData.user.id, data.email);

      // Step 3: Create member record
      const member = await createMember(data, selectedCollectorId);

      // Step 4: Create registration record
      await createRegistration(member.id);

      toast({
        title: "Registration successful",
        description: "Your registration has been submitted and is pending approval.",
      });

      // Redirect to login page
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Show a user-friendly error message
      let errorMessage = "An error occurred during registration. Please try again.";
      
      if (error.message) {
        if (error.message.includes('rate limit')) {
          errorMessage = error.message;
        } else if (error.message.includes('already registered')) {
          errorMessage = "This email is already registered. Please try logging in instead.";
        }
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-2xl text-center text-primary">
            PWA Burton On Trent Registration Form
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700">
              Your personal information will be processed in accordance with our Privacy Policy and the GDPR.
              We collect this information to manage your membership and provide our services.
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-8 divide-y divide-gray-200">
              <PersonalInfoSection register={register} setValue={setValue} watch={watch} />
              <NextOfKinSection />
              <SpousesSection />
              <DependantsSection />
              <MembershipSection onCollectorChange={setSelectedCollectorId} />
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Registration"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}