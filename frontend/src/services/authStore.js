import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: false,
  error: null,
  
  setSession: (session) => set({ 
    session, 
    user: session?.user || null,
    error: null 
  }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  clearAuth: () => set({ 
    session: null, 
    user: null, 
    error: null 
  }),
}));