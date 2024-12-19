import { supabase } from "@/integrations/supabase/client";

export const signUpUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) {
    console.error("Error signing up:", error);
    throw error;
  }

  return data;
};

export const createMember = async (data: any, collectorId: string) => {
  console.log("Creating member with data:", { memberData: data, collectorId });

  try {
    // First check if a member with this email already exists
    const { data: existingMembers, error: lookupError } = await supabase
      .from('members')
      .select('*')
      .eq('email', data.email);

    if (lookupError) {
      console.error("Error checking existing member:", lookupError);
      throw lookupError;
    }

    if (existingMembers && existingMembers.length > 0) {
      throw new Error("A member with this email already exists");
    }

    // Create the member without specifying member_number (let the trigger handle it)
    const { data: member, error: createError } = await supabase
      .from('members')
      .insert({
        collector_id: collectorId,
        full_name: data.fullName,
        email: data.email,
        phone: data.mobile,
        address: data.address,
        town: data.town,
        postcode: data.postCode,
        date_of_birth: data.dob,
        gender: data.gender,
        marital_status: data.maritalStatus,
        status: 'pending',
        verified: false,
        membership_type: 'standard'
      })
      .select()
      .single();

    if (createError) {
      console.error("Member creation error:", createError);
      throw createError;
    }

    console.log("Member created successfully:", member);
    return member;
  } catch (error) {
    console.error("Error creating member:", error);
    throw error;
  }
};

export const createRegistration = async (memberId: string) => {
  const { error } = await supabase
    .from('registrations')
    .insert({
      member_id: memberId,
      status: 'pending'
    });

  if (error) {
    console.error("Error creating registration:", error);
    throw error;
  }
};