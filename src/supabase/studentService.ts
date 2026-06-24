import { supabase } from './client';

export async function verifyStudentExists(
  studentId: string
): Promise<{ exists: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('student_id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('verifyStudentExists error:', error);
      return { exists: false, error: error.message };
    }
    return { exists: !!data, error: null };
  } catch (err) {
    console.error('Unexpected error in verifyStudentExists:', err);
    return { exists: false, error: 'Failed to verify student ID.' };
  }
}