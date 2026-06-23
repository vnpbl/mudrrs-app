// src/supabase/authService.ts
import { supabase } from './client';

export type UserRow = {
  user_id: number;
  email: string;
  role: 'Student' | 'Library Staff';
  id: string;
};

export type StudentRow = {
  student_id: string;
  user_id: number;
  first_name: string;
  last_name: string;
  program?: string | null;
};

export type LibraryStaffRow = {
  staff_id: string;
  user_id: number;
  first_name: string;
  last_name: string;
  assigned_campus?: string | null;
};

export type UserProfile = {
  user: UserRow;
  profile: StudentRow | LibraryStaffRow | null;
};

// ---------- SIGN UP (STUDENT) ----------
export async function signUpStudent(
  email: string,
  password: string,
  studentId: string,
  firstName: string,
  lastName: string,
  program?: string
): Promise<{ user: UserRow | null; error: string | null }> {
  console.log('📝 [signUpStudent] Attempting to create account for:', email);
  console.log('📝 [signUpStudent] Metadata to send:', { studentId, firstName, lastName, program });

  try {
    // 1. Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          student_id: studentId,
          first_name: firstName,
          last_name: lastName,
          program: program || null,
        },
      },
    });

    if (authError) {
      console.error('❌ [signUpStudent] Auth creation failed:', authError.message, authError);
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      console.error('❌ [signUpStudent] No user returned from auth');
      return { user: null, error: 'Failed to create user. Please try again.' };
    }

    console.log('✅ [signUpStudent] Auth user created:', authData.user.id, authData.user.email);
    console.log('   Raw metadata:', authData.user.user_metadata);

    // 2. 🔥 TRIGGER SHOULD HAVE INSERTED INTO USERS & STUDENTS AUTOMATICALLY!
    // We wait a moment and then fetch the public user record.

    // Optional small delay to allow trigger to run (often immediate)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Fetch the newly created user from public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authData.user.email!)
      .single();

    if (userError || !userData) {
      console.error('❌ [signUpStudent] Failed to retrieve public user record:', userError);
      return { user: null, error: 'User created but profile retrieval failed. Please contact support.' };
    }

    console.log('✅ [signUpStudent] Public user record found:', userData);

    const userRow: UserRow = {
      user_id: userData.user_id,
      email: userData.email,
      role: userData.role,
      id: String(userData.user_id),
    };

    // 4. (Optional) Verify student record was also created
    const { data: studentData, error: studentCheckError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userData.user_id)
      .single();

    if (studentCheckError) {
      console.warn('⚠️ [signUpStudent] Student record not found yet (might be trigger delay):', studentCheckError);
    } else {
      console.log('✅ [signUpStudent] Student record confirmed:', studentData);
    }

    console.log('🎉 [signUpStudent] Signup completed successfully for:', email);
    return { user: userRow, error: null };

  } catch (err) {
    console.error('💥 [signUpStudent] Unexpected error:', err);
    return { user: null, error: 'An unexpected error occurred during registration.' };
  }
}

// ---------- SIGN IN ----------
export async function signIn(
  email: string,
  password: string
): Promise<{ profile: UserProfile | null; error: string | null }> {
  console.log('🔑 [signIn] Attempting sign in for:', email);
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ [signIn] Auth failed:', authError.message);
      return { profile: null, error: authError.message };
    }
    if (!authData.user) {
      console.error('❌ [signIn] No user returned');
      return { profile: null, error: 'Invalid credentials.' };
    }

    console.log('✅ [signIn] Auth successful for:', authData.user.email);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authData.user.email)
      .single();

    if (userError || !userData) {
      console.error('❌ [signIn] Failed to fetch public user record:', userError);
      await supabase.auth.signOut();
      return { profile: null, error: 'Account not fully configured.' };
    }

    const userRow: UserRow = {
      user_id: userData.user_id,
      email: userData.email,
      role: userData.role,
      id: String(userData.user_id),
    };

    let profile: StudentRow | LibraryStaffRow | null = null;
    if (userRow.role === 'Student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();
      if (studentData) {
        profile = {
          student_id: studentData.student_id,
          user_id: studentData.user_id,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          program: studentData.program,
        };
      }
    } else if (userRow.role === 'Library Staff') {
      const { data: staffData } = await supabase
        .from('library_staff')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();
      if (staffData) {
        profile = {
          staff_id: staffData.staff_id,
          user_id: staffData.user_id,
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          assigned_campus: staffData.assigned_campus,
        };
      }
    }

    console.log('✅ [signIn] Profile loaded:', profile);
    return { profile: { user: userRow, profile }, error: null };
  } catch (err) {
    console.error('💥 [signIn] Unexpected error:', err);
    return { profile: null, error: 'An unexpected error occurred during sign in.' };
  }
}

// ---------- SIGN OUT ----------
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [signOut] Error:', error.message);
      return { error: error.message };
    }
    console.log('✅ [signOut] Signed out successfully');
    return { error: null };
  } catch (err) {
    console.error('💥 [signOut] Unexpected error:', err);
    return { error: 'An unexpected error occurred during sign out.' };
  }
}

// ---------- GET CURRENT SESSION ----------
export async function getCurrentSession(): Promise<{
  profile: UserProfile | null;
  error: string | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      console.log('ℹ️ [getCurrentSession] No active session');
      return { profile: null, error: null };
    }

    const email = sessionData.session.user.email;
    if (!email) return { profile: null, error: null };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      await supabase.auth.signOut();
      return { profile: null, error: null };
    }

    const userRow: UserRow = {
      user_id: userData.user_id,
      email: userData.email,
      role: userData.role,
      id: String(userData.user_id),
    };

    let profile: StudentRow | LibraryStaffRow | null = null;
    if (userRow.role === 'Student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();
      if (studentData) {
        profile = {
          student_id: studentData.student_id,
          user_id: studentData.user_id,
          first_name: studentData.first_name,
          last_name: studentData.last_name,
          program: studentData.program,
        };
      }
    } else if (userRow.role === 'Library Staff') {
      const { data: staffData } = await supabase
        .from('library_staff')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();
      if (staffData) {
        profile = {
          staff_id: staffData.staff_id,
          user_id: staffData.user_id,
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          assigned_campus: staffData.assigned_campus,
        };
      }
    }

    console.log('✅ [getCurrentSession] Session restored for:', email);
    return { profile: { user: userRow, profile }, error: null };
  } catch (err) {
    console.error('💥 [getCurrentSession] Unexpected error:', err);
    return { profile: null, error: null };
  }
}