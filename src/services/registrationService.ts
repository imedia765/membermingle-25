import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export const createOrUpdateMember = async (
  memberId: string | undefined,
  data: any,
  collectorId: string
) => {
  console.log("Creating/updating member with data:", { memberId, data, collectorId });
  
  const memberData: Partial<TablesInsert<'members'>> = {
    collector_id: collectorId,
    full_name: data.fullName, // Ensure this is included as it's required
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
      .eq('member_number', memberId)
      .select()
      .single();

    if (error) {
      console.error("Member update error:", error);
      throw error;
    }
    member = updatedMember;
  } else {
    const { data: newMember, error } = await supabase
      .from('members')
      .insert({
        ...memberData,
        verified: false,
      })
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

  // Create or update registration record
  const { error: registrationError } = await supabase
    .from('registrations')
    .upsert({
      member_id: member.id,
      status: memberId ? 'updated' : 'pending',
      updated_at: new Date().toISOString()
    });

  if (registrationError) {
    console.error("Error saving registration:", registrationError);
    throw registrationError;
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