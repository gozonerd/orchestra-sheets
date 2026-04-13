-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificationToken ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see their own profile
CREATE POLICY users_self ON users FOR SELECT
  USING (auth.uid()::text = id);

-- API Keys: Users can only see their own keys
CREATE POLICY api_keys_user_isolation ON api_keys FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Folders: Users can only see their own folders
CREATE POLICY folders_user_isolation ON folders FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Tags: Users can only see their own tags
CREATE POLICY tags_user_isolation ON tags FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Prompts: Users can only see their own prompts
CREATE POLICY prompts_user_isolation ON prompts FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Prompt Versions: Users can only see versions of their own prompts
CREATE POLICY prompt_versions_user_isolation ON prompt_versions FOR ALL
  USING (
    prompt_id IN (
      SELECT id FROM prompts WHERE user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    prompt_id IN (
      SELECT id FROM prompts WHERE user_id = auth.uid()::text
    )
  );

-- Test Runs: Users can only see their own test runs
CREATE POLICY test_runs_user_isolation ON test_runs FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Audit Logs: Users can only see their own audit logs
CREATE POLICY audit_logs_user_isolation ON audit_logs FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Session: Users can only see their own sessions
CREATE POLICY session_user_isolation ON session FOR ALL
  USING (auth.uid()::text = userId)
  WITH CHECK (auth.uid()::text = userId);

-- Verification Tokens: Allow service role to manage tokens
CREATE POLICY verificationToken_service_role ON verificationToken
  USING (current_setting('request.jwt.claims')::jsonb->>'role' = 'service_role');
