# Database Setup Instructions

## Quick Setup

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to the **SQL Editor** (in the left sidebar)
3. Copy and paste the contents of `schema.sql` 
4. Click **Run** to execute the SQL

This will create:
- `user_profiles` table
- `decisions` table  
- `moods` table
- Row Level Security policies
- Indexes for performance

## Alternative: Direct Link

You can also run the schema directly by:
1. Going to: https://app.supabase.com/project/vnkekvwzlbxquprramco/sql
2. Pasting the schema.sql contents
3. Clicking Run

## Verify Tables Created

After running the schema, verify by running:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- user_profiles
- decisions
- moods
- user_stats (view)
EOF < /dev/null