// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '../supabase/authService';
import {
  getCurrentSession,
  signIn as supabaseSignIn,
  signUpStudent as supabaseSignUp,
  signOut as supabaseSignOut,
} from '../supabase/authService';

interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    studentId: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { profile: sessionProfile } = await getCurrentSession();
      setProfile(sessionProfile);
      if (sessionProfile) {
        console.log('✅ [AuthProvider] Session loaded for:', sessionProfile.user.email);
      } else {
        console.log('ℹ️ [AuthProvider] No session found');
      }
    } catch (err) {
      console.error('❌ [AuthProvider] Failed to load session:', err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      console.log('🔑 [AuthProvider] signIn called for:', email);
      const { profile: userProfile, error } = await supabaseSignIn(email, password);
      if (error) {
        console.error('❌ [AuthProvider] signIn failed:', error);
        return { error };
      }
      setProfile(userProfile);
      console.log('✅ [AuthProvider] signIn successful, profile set');
      return { error: null };
    },
    []
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      studentId: string,
      firstName: string,
      lastName: string
    ): Promise<{ error: string | null }> => {
      console.log('📝 [AuthProvider] signUp called for:', email);
      const { user, error } = await supabaseSignUp(email, password, studentId, firstName, lastName);
      if (error) {
        console.error('❌ [AuthProvider] signUp failed:', error);
        return { error };
      }
      if (user) {
        console.log('✅ [AuthProvider] signUp successful, user:', user);
      } else {
        console.warn('⚠️ [AuthProvider] signUp returned user=null but no error');
      }
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    console.log('🚪 [AuthProvider] signOut called');
    await supabaseSignOut();
    setProfile(null);
    console.log('✅ [AuthProvider] signOut complete');
  }, []);

  const refreshSession = useCallback(async () => {
    console.log('🔄 [AuthProvider] Refreshing session');
    await loadSession();
  }, [loadSession]);

  const value: AuthContextType = {
    profile,
    isLoading,
    isAuthenticated: profile !== null,
    isStaff: profile?.user.role === 'Library Staff',
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({
  children,
  requireStaff = false,
}: {
  children: React.ReactNode;
  requireStaff?: boolean;
}) {
  const { isAuthenticated, isStaff, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireStaff && !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#991b1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3.5 19.5a7 7 0 0114 0" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500">This area is only accessible to Library Staff.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}