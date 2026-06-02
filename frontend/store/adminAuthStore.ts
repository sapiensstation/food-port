'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setToken, clearToken } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
}

interface AdminAuthStore {
  user: AdminUser | null;
  token: string | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (token, user) => {
        setToken(token);
        set({ token, user });
      },
      logout: () => {
        clearToken();
        set({ token: null, user: null });
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'fv-admin-auth' },
  ),
);
