import { createClient } from '@/lib/supabase/client';
import { MOCK_OTP } from '@/lib/constants';

export async function sendOTP(phone: string): Promise<{ success: boolean }> {
  console.log(`[MOCK] OTP sent to ${phone}: ${MOCK_OTP}`);
  return { success: true };
}

export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; userId?: string }> {
  if (code !== MOCK_OTP) {
    return { success: false };
  }

  const supabase = createClient();
  const email = `${phone.replace(/\D/g, '')}@dibs.mock`;
  const password = `mock-pw-${phone.replace(/\D/g, '')}`;

  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data.user) {
    return { success: true, userId: data.user.id };
  }

  // User doesn't exist — sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { phone, display_name: `User ${phone.slice(-4)}` },
    },
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return { success: false };
  }

  return { success: true, userId: signUpData.user?.id };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
