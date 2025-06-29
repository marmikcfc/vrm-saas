import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, getCurrentUser, onAuthStateChange } from '../lib/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  initialized: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  initializeAuth: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      sessionExpiry: null,
      initialized: false,
      error: null,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          sessionExpiry: user ? Date.now() + (24 * 60 * 60 * 1000) : null, // 24 hours
          initialized: true,
          error: null,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          sessionExpiry: null,
          initialized: true,
          error: null,
        });
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true, error: null });

          // Check current session first
          const user = await getCurrentUser();
          
          if (user) {
            get().setUser(user);
          } else {
            get().clearAuth();
          }

          // Set up auth state listener for future changes
          onAuthStateChange(async (user) => {
            if (user) {
              const fullUser = await getCurrentUser();
              get().setUser(fullUser);
            } else {
              get().clearAuth();
            }
          });

        } catch (error) {
          console.error('Auth initialization error:', error);
          get().setError(error instanceof Error ? error.message : 'Authentication failed');
          get().clearAuth();
        }
      },

      checkSession: async () => {
        const { sessionExpiry } = get();
        
        // Check if session is expired
        if (sessionExpiry && Date.now() > sessionExpiry) {
          get().clearAuth();
          return false;
        }

        try {
          // Verify current user
          const user = await getCurrentUser();
          if (user) {
            get().setUser(user);
            return true;
          } else {
            get().clearAuth();
            return false;
          }
        } catch (error) {
          console.error('Session check error:', error);
          get().clearAuth();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);