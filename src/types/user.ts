export type UserRole = 'citizen' | 'officer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  department?: string; // For officers/admins
  assignedRegion?: string; // For officers
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  role?: UserRole; // Optional role for quick switcher fallbacks
  password?: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
}
