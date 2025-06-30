// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Log configuration status for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration:', {
    url: supabaseUrl ? 'Configured' : 'Missing',
    key: supabaseAnonKey ? 'Configured' : 'Missing'
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables are not configured. Please set up your .env.local file.');
  }
}

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Only create client if variables are available
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  : null

// Helper function to check if user is authenticated
export const checkAuth = async () => {
  if (!supabase) return { user: null, session: null, error: new Error('Supabase not configured') };
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { user: session?.user || null, session, error };
  } catch (error) {
    return { user: null, session: null, error };
  }
};

// Helper function to wait for auth to be ready
export const waitForAuth = async (maxWaitTime = 5000): Promise<{ user: any; session: any; error?: any }> => {
  if (!supabase) return { user: null, session: null, error: new Error('Supabase not configured') };
  
  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ user: null, session: null, error: new Error('Auth timeout') });
      }
    }, maxWaitTime);

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ user: session?.user || null, session, error });
        }
      } catch (error) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve({ user: null, session: null, error });
        }
      }
    };

    checkSession();
  });
};