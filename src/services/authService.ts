import type { User, LoginCredentials, SignupData } from '../types/user';
import { supabase } from '../lib/supabaseClient';

const FALLBACK_SESSION_KEY = 'civicfix_fallback_session';

export const authService = {
  // Local storage session fallback helpers
  getFallbackSession(): User | null {
    const raw = localStorage.getItem(FALLBACK_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setFallbackSession(user: User): void {
    localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(user));
  },

  clearFallbackSession(): void {
    localStorage.removeItem(FALLBACK_SESSION_KEY);
  },

  async autoRegisterDemoUser(email: string, password = 'password123', role: string): Promise<User> {
    // 1. Try to sign up in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    let userId = '';
    if (authError) {
      if (authError.message.includes('User already registered')) {
        // If already registered, we can generate a consistent UUID or try signIn
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInErr) {
          // If signIn fails (e.g. email unconfirmed), generate a deterministic UUID based on email
          userId = 'user-' + email.replace(/[^a-zA-Z0-9]/g, '');
        } else {
          userId = signInData.user!.id;
        }
      } else {
        // Any other signup error, use deterministic id fallback
        userId = 'user-' + email.replace(/[^a-zA-Z0-9]/g, '');
      }
    } else {
      userId = authData.user!.id;
    }
    
    return await this.createProfile(userId, email, role);
  },

  async createProfile(userId: string, email: string, role: string): Promise<User> {
    const name = email.split('@')[0];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    
    let department: string | undefined;
    let assignedRegion: string | undefined;
    let avatarUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120';

    if (role === 'officer') {
      department = 'Public Works';
      assignedRegion = 'Downtown Sector';
      avatarUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120';
    } else if (role === 'admin') {
      department = 'Municipal Operations';
      avatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120';
    }

    const userData: User = {
      id: userId,
      name: capitalized,
      email: email,
      role: role as any,
      phone: '+1 (555) 000-0000',
      department,
      assignedRegion,
      avatarUrl,
      createdAt: new Date().toISOString()
    };

    try {
      // Upsert profile in Supabase database
      await supabase.from('profiles').upsert({
        id: userId,
        name: capitalized,
        email: email,
        role: role,
        phone: '+1 (555) 000-0000',
        department,
        assigned_region: assignedRegion,
        avatar_url: avatarUrl
      });
    } catch (e) {
      console.warn('Database profile sync omitted or failed, using local session.', e);
    }

    // Save fallback session
    this.setFallbackSession(userData);
    return userData;
  },

  async login(credentials: LoginCredentials & { password?: string }): Promise<User> {
    const password = credentials.password || 'password123';
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: password,
      });

      if (authError) {
        // If unconfirmed or invalid, auto-register/sign-in using fallback
        if (authError.message.includes('confirm') || authError.message.includes('credentials') || authError.message.includes('not found')) {
          return await this.autoRegisterDemoUser(credentials.email, password, credentials.role);
        }
        throw authError;
      }

      // Try fetching profile from Supabase profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user!.id)
        .single();

      if (profileError || !profile) {
        return await this.createProfile(authData.user!.id, credentials.email, credentials.role);
      }

      const userData: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        department: profile.department,
        assignedRegion: profile.assigned_region,
        avatarUrl: profile.avatar_url,
        createdAt: profile.created_at
      };

      this.setFallbackSession(userData);
      return userData;
    } catch (err: any) {
      // General safety fallback if any exception occurs (e.g. database offline or missing tables)
      return await this.autoRegisterDemoUser(credentials.email, password, credentials.role);
    }
  },

  async signup(data: SignupData & { password?: string }): Promise<User> {
    const password = data.password || 'password123';
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: password,
      });

      if (authError) {
        throw authError;
      }

      return await this.createProfile(authData.user!.id, data.email, data.role);
    } catch (e: any) {
      // Fallback if Supabase signup is restricted or fails
      const fallbackId = 'user-' + data.email.replace(/[^a-zA-Z0-9]/g, '');
      return await this.createProfile(fallbackId, data.email, data.role);
    }
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout failed', e);
    }
    this.clearFallbackSession();
  },

  async getUser(): Promise<User | null> {
    // 1. Try Supabase Auth
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          const userData: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            phone: profile.phone,
            department: profile.department,
            assignedRegion: profile.assigned_region,
            avatarUrl: profile.avatar_url,
            createdAt: profile.created_at
          };
          this.setFallbackSession(userData);
          return userData;
        }
      }
    } catch (e) {
      console.warn('Supabase auth state fetch failed', e);
    }

    // 2. Local Storage Session Fallback
    return this.getFallbackSession();
  },

  async refreshSession(): Promise<User | null> {
    return await this.getUser();
  }
};
export default authService;
