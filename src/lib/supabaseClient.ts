import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. App will operate in local fallback mock mode.');
  
  // Safe mock client proxy to prevent runtime crashes if env vars are unset
  client = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'auth') {
        return {
          signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase is not configured') }),
          signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Supabase is not configured') }),
          signOut: () => Promise.resolve({ error: null }),
          updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
          verifyOtp: () => Promise.resolve({ data: { user: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        };
      }
      
      // Fallback for query builders: supabase.from().select()
      return () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: null })
        })
      });
    }
  });
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
export default supabase;
