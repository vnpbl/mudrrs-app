import { supabase } from './client';

export type UserRow = {
  user_id: number;
  email: string;
  role: 'student' | 'library_staff';
  // frontend alias
  id: string; // user_id as string
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

export async function signIn(
  email: string,
  password: string
): Promise<{ profile: UserProfile | null; error: string | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) return { profile: null, error: authError.message };
    if (!authData.user) return { profile: null, error: 'Invalid credentials.' };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authData.user.email)
      .single();

    if (userError || !userData) {
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
    if (userRow.role === 'student') {
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
    } else if (userRow.role === 'library_staff') {
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

    return { profile: { user: userRow, profile }, error: null };
  } catch {
    return { profile: null, error: 'An unexpected error occurred during sign in.' };
  }
}

export async function signUpStudent(
  email: string,
  password: string,
  studentId: string,
  firstName: string,
  lastName: string
): Promise<{ user: UserRow | null; error: string | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: 'Failed to create user.' };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        email: authData.user.email!,
        password: '', // managed by Supabase Auth
        role: 'Student',
      })
      .select()
      .single();

    if (userError) {
      await supabase.auth.signOut();
      return { user: null, error: `Failed to create profile: ${userError.message}` };
    }

    const { error: studentError } = await supabase.from('students').insert({
      user_id: userData.user_id,
      student_id: studentId,
      first_name: firstName,
      last_name: lastName,
    });

    if (studentError) {
      await supabase.from('users').delete().eq('user_id', userData.user_id);
      await supabase.auth.signOut();
      return { user: null, error: `Failed to create student record: ${studentError.message}` };
    }

    const userRow: UserRow = {
      user_id: userData.user_id,
      email: userData.email,
      role: userData.role,
      id: String(userData.user_id),
    };

    return { user: userRow, error: null };
  } catch {
    return { user: null, error: 'An unexpected error occurred during registration.' };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch {
    return { error: 'An unexpected error occurred during sign out.' };
  }
}

export async function getCurrentSession(): Promise<{
  profile: UserProfile | null;
  error: string | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user) return { profile: null, error: null };

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
    if (userRow.role === 'student') {
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
    } else if (userRow.role === 'library_staff') {
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

    return { profile: { user: userRow, profile }, error: null };
  } catch {
    return { profile: null, error: null };
  }
}