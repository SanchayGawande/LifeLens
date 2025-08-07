// Temporary mock Supabase service for testing UI without real backend
// This allows testing the interface while setting up a new Supabase project

const mockUser = {
  id: 'mock-user-123',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockSession = {
  access_token: 'mock-jwt-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser
};

let currentSession = null;

const mockSupabase = {
  auth: {
    getSession: async () => {
      return { data: { session: currentSession }, error: null };
    },
    
    getUser: async (jwt) => {
      if (jwt === 'mock-jwt-token') {
        return { data: { user: mockUser }, error: null };
      }
      return { data: { user: null }, error: { message: 'Invalid token' } };
    },
    
    signInWithPassword: async ({ email, password }) => {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        currentSession = mockSession;
        return { 
          data: { 
            user: mockUser, 
            session: mockSession 
          }, 
          error: null 
        };
      }
      
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Invalid credentials' } 
      };
    },
    
    signUp: async ({ email, password, options = {} }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        const newUser = {
          ...mockUser,
          email,
          user_metadata: {
            name: options.data?.name || email.split('@')[0]
          }
        };
        
        return { 
          data: { 
            user: newUser, 
            session: null // Email confirmation required
          }, 
          error: null 
        };
      }
      
      return { 
        data: { user: null, session: null }, 
        error: { message: 'Invalid email or password' } 
      };
    },
    
    signOut: async () => {
      currentSession = null;
      return { error: null };
    },
    
    refreshSession: async () => {
      if (currentSession) {
        return { data: { session: currentSession }, error: null };
      }
      return { data: { session: null }, error: { message: 'No session' } };
    },
    
    onAuthStateChange: (callback) => {
      // Mock auth state listener
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  }
};

export const supabase = mockSupabase;