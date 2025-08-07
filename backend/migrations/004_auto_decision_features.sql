-- Migration: Auto-Decision Features
-- Date: 2024-01-XX
-- Description: Add auto-decision tracking and gamification features

-- Add feedback column to decisions table
ALTER TABLE decisions 
ADD COLUMN feedback JSONB DEFAULT NULL;

-- Add comment on feedback column
COMMENT ON COLUMN decisions.feedback IS 'User feedback for decisions including reaction, rating, and timestamp';

-- Add gamification_stats column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN gamification_stats JSONB DEFAULT '{}';

-- Add comment on gamification_stats column
COMMENT ON COLUMN user_profiles.gamification_stats IS 'User gamification data including auto-decision count, achievements, streaks';

-- Create index on auto_decided column for better performance
CREATE INDEX IF NOT EXISTS idx_decisions_auto_decided ON decisions(auto_decided);

-- Create index on user_id and auto_decided for stats queries
CREATE INDEX IF NOT EXISTS idx_decisions_user_auto ON decisions(user_id, auto_decided);

-- Create index on feedback for analytics
CREATE INDEX IF NOT EXISTS idx_decisions_feedback ON decisions USING GIN(feedback);

-- Update existing user profiles to have default gamification stats
UPDATE user_profiles 
SET gamification_stats = '{
  "autoDecisionCount": 0,
  "lastAutoDecision": null,
  "streaks": {},
  "achievements": []
}'
WHERE gamification_stats IS NULL OR gamification_stats = '{}';

-- Create function to update auto-decision count
CREATE OR REPLACE FUNCTION update_auto_decision_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if this is an auto-decision
  IF NEW.auto_decided = true THEN
    INSERT INTO user_profiles (user_id, gamification_stats, updated_at)
    VALUES (
      NEW.user_id,
      jsonb_build_object(
        'autoDecisionCount', 1,
        'lastAutoDecision', NEW.created_at
      ),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      gamification_stats = jsonb_set(
        jsonb_set(
          COALESCE(user_profiles.gamification_stats, '{}'),
          '{autoDecisionCount}',
          to_jsonb(COALESCE((user_profiles.gamification_stats->>'autoDecisionCount')::int, 0) + 1)
        ),
        '{lastAutoDecision}',
        to_jsonb(NEW.created_at)
      ),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-decision count updates
DROP TRIGGER IF EXISTS trigger_update_auto_decision_count ON decisions;
CREATE TRIGGER trigger_update_auto_decision_count
  AFTER INSERT ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_auto_decision_count();

-- Add RLS policies for feedback data
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- Policy for users to update their own decision feedback
CREATE POLICY "Users can update their own decision feedback"
  ON decisions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to read their own gamification stats
CREATE POLICY "Users can read their own gamification stats"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to update their own gamification stats
CREATE POLICY "Users can update their own gamification stats"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add sample gamification achievements data
INSERT INTO achievements (id, name, description, category, points, criteria, created_at)
VALUES 
  ('auto_decision_1', 'First Surprise', 'Used auto-decision for the first time', 'auto_decision', 10, '{"autoDecisionCount": 1}', NOW()),
  ('auto_decision_5', 'Feeling Lucky', 'Used auto-decision 5 times', 'auto_decision', 25, '{"autoDecisionCount": 5}', NOW()),
  ('auto_decision_10', 'Surprise Expert', 'Used auto-decision 10 times', 'auto_decision', 50, '{"autoDecisionCount": 10}', NOW()),
  ('auto_decision_25', 'Trust the Process', 'Used auto-decision 25 times', 'auto_decision', 100, '{"autoDecisionCount": 25}', NOW()),
  ('auto_decision_50', 'Surprise Master', 'Used auto-decision 50 times', 'auto_decision', 200, '{"autoDecisionCount": 50}', NOW())
ON CONFLICT (id) DO NOTHING;

-- Add feedback tracking function
CREATE OR REPLACE FUNCTION get_feedback_stats(user_uuid UUID)
RETURNS TABLE (
  total_feedback INTEGER,
  positive_feedback INTEGER,
  negative_feedback INTEGER,
  average_satisfaction NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_feedback,
    COUNT(CASE WHEN feedback->>'reaction' IN ('love', 'like') THEN 1 END)::INTEGER as positive_feedback,
    COUNT(CASE WHEN feedback->>'reaction' IN ('dislike') THEN 1 END)::INTEGER as negative_feedback,
    AVG(CASE 
      WHEN feedback->>'reaction' = 'love' THEN 5
      WHEN feedback->>'reaction' = 'like' THEN 4
      WHEN feedback->>'reaction' = 'neutral' THEN 3
      WHEN feedback->>'reaction' = 'dislike' THEN 2
      ELSE NULL
    END) as average_satisfaction
  FROM decisions 
  WHERE user_id = user_uuid 
    AND feedback IS NOT NULL
    AND auto_decided = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_feedback_stats(UUID) TO authenticated;

-- Create view for auto-decision analytics
CREATE OR REPLACE VIEW auto_decision_analytics AS
SELECT 
  u.id as user_id,
  u.email,
  up.gamification_stats->>'autoDecisionCount' as auto_decision_count,
  up.gamification_stats->>'lastAutoDecision' as last_auto_decision,
  COUNT(d.id) as total_decisions,
  COUNT(CASE WHEN d.auto_decided = true THEN 1 END) as auto_decisions,
  ROUND(
    (COUNT(CASE WHEN d.auto_decided = true THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(d.id), 0)) * 100, 2
  ) as auto_decision_percentage,
  COUNT(CASE WHEN d.feedback IS NOT NULL THEN 1 END) as feedback_count
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN decisions d ON u.id = d.user_id
GROUP BY u.id, u.email, up.gamification_stats;

-- Grant access to the view
GRANT SELECT ON auto_decision_analytics TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gamification_stats_auto_count 
ON user_profiles USING GIN((gamification_stats->>'autoDecisionCount'));

CREATE INDEX IF NOT EXISTS idx_decisions_created_auto 
ON decisions(created_at, auto_decided) WHERE auto_decided = true;

-- Add constraint to ensure feedback has valid structure
ALTER TABLE decisions 
ADD CONSTRAINT valid_feedback_structure 
CHECK (
  feedback IS NULL OR (
    feedback ? 'reaction' AND 
    feedback->>'reaction' IN ('love', 'like', 'neutral', 'dislike') AND
    feedback ? 'submittedAt'
  )
);