-- Initial schema for JH Knowledge Base
-- Run this for both prod and dev schemas, replacing [SCHEMA] with the actual schema name

-- Create schema (replace [SCHEMA] with App_jhknowledgebase__prod or App_jhknowledgebase__dev)
-- CREATE SCHEMA IF NOT EXISTS "[SCHEMA]";

-- Grant permissions
-- GRANT USAGE ON SCHEMA "[SCHEMA]" TO anon, authenticated;

-- Articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    publication_name TEXT,
    source_url TEXT NOT NULL,
    full_text TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    summary_prompt TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings defaults table
CREATE TABLE settings_defaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    default_prompt TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant table permissions
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "[SCHEMA]" TO anon, authenticated;

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_defaults ENABLE ROW LEVEL SECURITY;

-- RLS policies for articles
CREATE POLICY "Users can view own articles" ON articles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own articles" ON articles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own articles" ON articles FOR DELETE USING (user_id = auth.uid());

-- RLS policies for settings
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for settings_defaults
CREATE POLICY "Users can view own settings_defaults" ON settings_defaults FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own settings_defaults" ON settings_defaults FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own settings_defaults" ON settings_defaults FOR UPDATE USING (user_id = auth.uid());
