import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. App will operate in local fallback mock mode.');
  
  // Safe mock client proxy to prevent runtime crashes if env vars are unset
  const createChainableQuery = () => {
    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: null, error: null });
        }
        return (..._args: any[]) => new Proxy(() => {}, handler);
      }
    };
    return new Proxy(() => {}, handler);
  };

  client = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'auth') {
        return {
          signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
          verifyOtp: () => Promise.resolve({ data: { user: null }, error: null }),
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        };
      }
      if (prop === 'from') {
        return () => createChainableQuery();
      }
      return createChainableQuery();
    }
  });
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
export default supabase;
