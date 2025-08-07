-- Photo Decisions Migration for LifeLens
-- Adds support for photo-based decision making

-- Create photo_decisions table
CREATE TABLE IF NOT EXISTS photo_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    images JSONB NOT NULL, -- Array of image metadata with URLs, labels, captions
    ai_response JSONB NOT NULL, -- Complete AI ranking response with reasoning
    recommended_index INTEGER NOT NULL, -- Index of recommended image (0-based)
    mood VARCHAR(50),
    category VARCHAR(50),
    weather_context JSONB,
    user_feedback VARCHAR(20), -- 'love', 'like', 'neutral', 'dislike'
    processing_time INTEGER, -- Time taken for AI processing in ms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_photo_decisions_user_id ON photo_decisions(user_id);
CREATE INDEX idx_photo_decisions_created_at ON photo_decisions(created_at);
CREATE INDEX idx_photo_decisions_user_created ON photo_decisions(user_id, created_at DESC);
CREATE INDEX idx_photo_decisions_category ON photo_decisions(category);
CREATE INDEX idx_photo_decisions_mood ON photo_decisions(mood);

-- Enable Row Level Security
ALTER TABLE photo_decisions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own photo decisions" ON photo_decisions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own photo decisions" ON photo_decisions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photo decisions" ON photo_decisions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photo decisions" ON photo_decisions
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_photo_decisions_updated_at 
    BEFORE UPDATE ON photo_decisions
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create Supabase Storage bucket for decision photos (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('decision-photos', 'decision-photos', false);

-- Create storage policies for the bucket
-- These need to be run in Supabase dashboard as well:
-- CREATE POLICY "Users can upload own decision photos" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'decision-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- CREATE POLICY "Users can view own decision photos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'decision-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 
-- CREATE POLICY "Users can delete own decision photos" ON storage.objects
--     FOR DELETE USING (bucket_id = 'decision-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add photo decision stats to user_stats view
DROP VIEW IF EXISTS user_stats;
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.email,
    up.name,
    COUNT(DISTINCT d.id) as total_decisions,
    COUNT(DISTINCT CASE WHEN d.auto_decided THEN d.id END) as auto_decisions,
    COUNT(DISTINCT pd.id) as photo_decisions,
    COUNT(DISTINCT m.id) as total_moods,
    AVG(m.positive_score) as avg_positivity
FROM 
    auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN decisions d ON u.id = d.user_id
    LEFT JOIN photo_decisions pd ON u.id = pd.user_id
    LEFT JOIN moods m ON u.id = m.user_id
GROUP BY 
    u.id, u.email, up.name;

-- Grant access to the updated view
GRANT SELECT ON user_stats TO authenticated;