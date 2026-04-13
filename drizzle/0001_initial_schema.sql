-- Create enums
CREATE TYPE prompt_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE test_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- API Keys table (encrypted storage)
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  encrypted_key TEXT NOT NULL,
  dek_hash VARCHAR(255),
  label VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX api_keys_user_id_idx ON api_keys(user_id);
CREATE UNIQUE INDEX api_keys_user_provider_unique ON api_keys(user_id, provider);

-- Folders table
CREATE TABLE folders (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX folders_user_id_idx ON folders(user_id);

-- Tags table
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX tags_user_id_idx ON tags(user_id);
CREATE UNIQUE INDEX tags_user_name_unique ON tags(user_id, name);

-- Prompts table
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  status prompt_status DEFAULT 'draft',
  variables JSONB,
  tags INTEGER[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX prompts_user_id_idx ON prompts(user_id);
CREATE INDEX prompts_folder_id_idx ON prompts(folder_id);

-- Prompt Versions table
CREATE TABLE prompt_versions (
  id SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version_number INTEGER,
  content TEXT NOT NULL,
  variables JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) REFERENCES users(id)
);

CREATE INDEX prompt_versions_prompt_id_idx ON prompt_versions(prompt_id);

-- Test Runs table
CREATE TABLE test_runs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  status test_status DEFAULT 'pending',
  models JSONB NOT NULL,
  test_inputs JSONB,
  results JSONB,
  total_cost DECIMAL(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TIMESTAMP
);

CREATE INDEX test_runs_user_id_idx ON test_runs(user_id);
CREATE INDEX test_runs_prompt_id_idx ON test_runs(prompt_id);

-- Audit Logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- Session table (for Auth.js)
CREATE TABLE session (
  sessionToken VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Verification tokens table (for Auth.js)
CREATE TABLE verificationToken (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX verificationToken_identifier_token_unique ON verificationToken(identifier, token);
