-- LifeLens Database Schema for Supabase PostgreSQL
-- Fixed version with proper PostgreSQL syntax

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name VARCHAR(100),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    decision TEXT,
    category VARCHAR(50),
    context JSONB DEFAULT '{}',
    ai_response TEXT,
    final_decision TEXT,
    auto_decided BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Moods table
CREATE TABLE IF NOT EXISTS moods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    input_text TEXT,
    input_type VARCHAR(20) DEFAULT 'text',
    sentiment_label VARCHAR(20),
    sentiment_score DECIMAL(4, 3),
    positive_score DECIMAL(4, 3),
    negative_score DECIMAL(4, 3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Decisions policies
CREATE POLICY "Users can view own decisions" ON decisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own decisions" ON decisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decisions" ON decisions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions" ON decisions
    FOR DELETE USING (auth.uid() = user_id);

-- Moods policies
CREATE POLICY "Users can view own moods" ON moods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own moods" ON moods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moods" ON moods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moods" ON moods
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);
CREATE INDEX idx_decisions_category ON decisions(category);
CREATE INDEX idx_decisions_user_created ON decisions(user_id, created_at DESC);

CREATE INDEX idx_moods_user_id ON moods(user_id);
CREATE INDEX idx_moods_created_at ON moods(created_at);
CREATE INDEX idx_moods_sentiment ON moods(sentiment_label);
CREATE INDEX idx_moods_user_created ON moods(user_id, created_at DESC);

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.email,
    up.name,
    COUNT(DISTINCT d.id) as total_decisions,
    COUNT(DISTINCT CASE WHEN d.auto_decided THEN d.id END) as auto_decisions,
    COUNT(DISTINCT m.id) as total_moods,
    AVG(m.positive_score) as avg_positivity
FROM 
    auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN decisions d ON u.id = d.user_id
    LEFT JOIN moods m ON u.id = m.user_id
GROUP BY 
    u.id, u.email, up.name;

-- Grant access to the view
GRANT SELECT ON user_stats TO authenticated;
EOF < /dev/null