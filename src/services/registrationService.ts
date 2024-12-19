import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

// Define the member insert type from Supabase
type MemberData = {
  full_name: string;
  collector_id: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  town?: string | null;
  postcode?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  profile_updated?: boolean;
  email_verified?: boolean;
};

export const createOrUpdateMember = async (
  memberId: string | undefined,
  data: any,
  collectorId: string
) => {
  console.log("Creating/updating member with data:", { memberId, data, collectorId });
  
  // For new registrations only
  if (!memberId && !data.fullName) {
    throw new Error('Full name is required for new registrations');
  }

  // If this is a member login (has memberId), return early
  if (memberId) {
    const { data: existingMember, error: fetchError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (fetchError) {
      console.error("Error fetching existing member:", fetchError);
      throw fetchError;
    }

    return existingMember;
  }

  // Continue with new registration
  const memberData: MemberData = {
    full_name: data.fullName,
    collector_id: collectorId,
    email: data.email,
    phone: data.mobile,
    address: data.address,
    town: data.town,
    postcode: data.postCode,
    date_of_birth: data.dob,
    gender: data.gender,
    marital_status: data.maritalStatus,
    profile_updated: true,
    email_verified: false,
  };

  let member;
  if (memberId) {
    const { data: updatedMember, error } = await supabase
      .from('members')
      .update(memberData)
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error("Member update error:", error);
      throw error;
    }
    member = updatedMember;
  } else {
    // For new registrations, let the database trigger handle member_number generation
    const { data: newMember, error } = await supabase
      .from('members')
      .insert(memberData as TablesInsert<'members'>)
      .select()
      .single();

    if (error) {
      console.error("Member creation error:", error);
      throw error;
    }
    member = newMember;
  }

  // Save spouses and dependants as family members
  if (data.spouses?.length > 0) {
    const spousesData = data.spouses.map((spouse: any) => ({
      member_id: member.id,
      name: spouse.name,
      date_of_birth: spouse.dateOfBirth,
      relationship: 'spouse',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: spousesError } = await supabase
      .from('family_members')
      .insert(spousesData);

    if (spousesError) {
      console.error("Error saving spouses:", spousesError);
      throw spousesError;
    }
  }

  if (data.dependants?.length > 0) {
    const dependantsData = data.dependants.map((dependant: any) => ({
      member_id: member.id,
      name: dependant.name,
      date_of_birth: dependant.dateOfBirth,
      gender: dependant.gender,
      relationship: dependant.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: dependantsError } = await supabase
      .from('family_members')
      .insert(dependantsData);

    if (dependantsError) {
      console.error("Error saving dependants:", dependantsError);
      throw dependantsError;
    }
  }

  return member;
};

export const createOrUpdateProfile = async (userId: string, email: string) => {
  console.log("Creating/updating profile for user:", userId);
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      updated_at: new Date().toISOString(),
      role: 'member'
    });

  if (error) throw error;
};

export const createOrUpdateRegistration = async (memberId: string, isNew: boolean) => {
  console.log("Creating/updating registration for member:", memberId);
  const { error } = await supabase
    .from('registrations')
    .upsert({
      member_id: memberId,
      status: isNew ? 'pending' : 'updated',
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
};