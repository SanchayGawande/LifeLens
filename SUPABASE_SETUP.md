# Supabase Setup Required

## Issue
The current Supabase URL `vnkekvwzlbxquprramco.supabase.co` cannot be resolved (DNS error). The project appears to be deleted or invalid.

## Solution Steps

### 1. Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Create new project
4. Choose region (US East recommended for development)
5. Set database password

### 2. Get Project Credentials
After project creation, get these values from Settings > API:

- **Project URL**: `https://[your-project-ref].supabase.co`
- **Anon Key**: `eyJ...` (public key for client-side)
- **Service Role Key**: `eyJ...` (secret key for server-side)

### 3. Update Configuration Files

**Frontend (.env)**:
```env
EXPO_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

**Backend (.env)**:
```env
SUPABASE_URL=https://[your-project-ref].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]
```

### 4. Set Up Database Schema
Run the SQL commands in `backend/database/schema.sql` in the Supabase SQL Editor to create tables.

### 5. Test Connection
After updating credentials, restart both frontend and backend servers.

## Current Status
- ❌ Supabase project invalid/deleted
- ❌ Authentication failing due to DNS errors
- ✅ Code structure ready for new Supabase project

## Quick Fix
If you have an existing working Supabase project, just update the URLs in:
- `frontend/.env`
- `backend/.env`