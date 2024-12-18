import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { Enums } from "@/integrations/supabase/types";

type UserRole = Enums<"user_role">;

export const signUpUser = async (email: string, password: string) => {
  console.log("Attempting to sign up user with email:", email);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      console.error("Sign up error:", error);
      
      // Parse error body if it exists
      let errorBody;
      try {
        errorBody = error.message && JSON.parse(error.message);
      } catch {
        // If parsing fails, errorBody will remain undefined
      }

      // Check for rate limit in both error status and parsed body
      if (error.status === 429 || errorBody?.code === "over_email_send_rate_limit") {
        throw new Error("You've reached the maximum number of registration attempts. Please wait a few minutes before trying again.");
      }

      // Handle already registered users
      if (error.message?.includes('already registered')) {
        throw new Error("This email is already registered. Please try logging in instead.");
      }

      // For other errors, throw a generic message
      throw new Error("Registration failed. Please try again later.");
    }

    console.log("Sign up successful:", data);
    return data;
  } catch (error: any) {
    console.error("Sign up error:", error);
    
    // Re-throw specific error messages we created
    if (error.message?.includes('maximum number of registration attempts') ||
        error.message?.includes('already registered')) {
      throw error;
    }
    
    // For unexpected errors, throw a generic message
    throw new Error("Registration failed. Please try again later.");
  }
};

export const createUserProfile = async (userId: string, email: string) => {
  console.log("Creating user profile for:", userId);
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    console.error("Session error:", sessionError);
    throw new Error("No valid session found");
  }

  const profileData: TablesInsert<'profiles'> = {
    id: userId,
    user_id: userId,
    email,
    role: 'member' as UserRole,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error("Profile creation error:", error);
    throw error;
  }

  console.log("Profile created successfully:", data);
  return data;
};

export const createMember = async (memberData: any, collectorId: string) => {
  console.log("Creating member with data:", { memberData, collectorId });
  
  const memberObject: TablesInsert<'members'> = {
    collector_id: collectorId,
    full_name: memberData.fullName,
    email: memberData.email,
    phone: memberData.mobile,
    address: memberData.address,
    town: memberData.town,
    postcode: memberData.postCode,
    date_of_birth: memberData.dob,
    gender: memberData.gender,
    marital_status: memberData.maritalStatus,
    status: 'pending',
    profile_updated: true,
    member_number: '', // This will be auto-generated by the database trigger
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('members')
    .insert(memberObject)
    .select()
    .single();

  if (error) {
    console.error("Member creation error:", error);
    throw error;
  }

  console.log("Member created successfully:", data);
  return data;
};

export const createRegistration = async (memberId: string) => {
  console.log("Creating registration for member:", memberId);
  
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      member_id: memberId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Registration creation error:", error);
    throw error;
  }

  console.log("Registration created successfully:", data);
  return data;
};
