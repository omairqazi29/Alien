import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  gitHubToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_TOKEN_KEY = 'alien_github_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedGitHubToken, setStoredGitHubToken] = useState<string | null>(() => {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Capture GitHub token from OAuth callback
      if (session?.provider_token) {
        localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token);
        setStoredGitHubToken(session.provider_token);
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Capture GitHub token on sign in
        if (event === 'SIGNED_IN' && session?.provider_token) {
          localStorage.setItem(GITHUB_TOKEN_KEY, session.provider_token);
          setStoredGitHubToken(session.provider_token);
        }

        // Clear token on sign out
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem(GITHUB_TOKEN_KEY);
          setStoredGitHubToken(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'read:user repo',
        redirectTo: `${window.location.origin}/settings`,
      },
    });
    if (error) throw error;
  };

  // Use stored GitHub token (provider_token is only available immediately after OAuth)
  const gitHubToken = session?.provider_token || storedGitHubToken;

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, signInWithGitHub, gitHubToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
