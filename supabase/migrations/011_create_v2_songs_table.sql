-- Migration: 011_create_v2_songs_table.sql
-- Create global songs, artists, and song_artists tables for V2

-- Enable unaccent extension for fingerprint generation
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create an IMMUTABLE wrapper function for unaccent
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT unaccent($1)
$$;

-- Create new global songs table
CREATE TABLE IF NOT EXISTS songs_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  
  -- Deduplication
  fingerprint TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(immutable_unaccent(title), '[^a-zA-Z0-9]', '', 'g'))
  ) STORED,
  
  -- Verification (Phase 2)
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  popularity_score INTEGER DEFAULT 0,
  
  -- Merging (Phase 2)
  merged_into_id UUID REFERENCES songs_v2(id),
  merge_reason TEXT
);

-- Indexes
CREATE INDEX idx_songs_v2_fingerprint ON songs_v2(fingerprint);
CREATE INDEX idx_songs_v2_created_by ON songs_v2(created_by);
CREATE INDEX idx_songs_v2_popularity ON songs_v2(popularity_score DESC);
CREATE INDEX idx_songs_v2_title ON songs_v2(title);

-- Full-text search
CREATE INDEX idx_songs_v2_title_fts ON songs_v2 USING gin(to_tsvector('english', title));

-- Comments
COMMENT ON TABLE songs_v2 IS 'Global song catalog (V2) - app-level songs available to all users';
COMMENT ON COLUMN songs_v2.fingerprint IS 'Normalized title for deduplication (auto-generated)';
COMMENT ON COLUMN songs_v2.popularity_score IS 'Increments when added to libraries';

-- RLS Policies
ALTER TABLE songs_v2 ENABLE ROW LEVEL SECURITY;

-- Anyone can view songs
CREATE POLICY "Anyone can view songs"
  ON songs_v2 FOR SELECT
  USING (true);

-- Authenticated users can create songs
CREATE POLICY "Authenticated users can create songs"
  ON songs_v2 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Users can update their own songs within 5 minutes (typo fixes)
CREATE POLICY "Users can update their songs briefly"
  ON songs_v2 FOR UPDATE
  USING (
    created_by = auth.uid() 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Soft delete only (mark as merged)
CREATE POLICY "Users can merge their songs"
  ON songs_v2 FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (merged_into_id IS NOT NULL);

-- Create new global artists table
CREATE TABLE IF NOT EXISTS artists_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  
  -- Deduplication
  fingerprint TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(immutable_unaccent(name), '[^a-zA-Z0-9]', '', 'g'))
  ) STORED,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Metadata (Phase 2)
  bio TEXT,
  image_url TEXT,
  external_links JSONB,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Merging
  merged_into_id UUID REFERENCES artists_v2(id),
  merge_reason TEXT
);

-- Indexes
CREATE INDEX idx_artists_v2_fingerprint ON artists_v2(fingerprint);
CREATE INDEX idx_artists_v2_name ON artists_v2(name);
CREATE INDEX idx_artists_v2_created_by ON artists_v2(created_by);
CREATE INDEX idx_artists_v2_name_fts ON artists_v2 USING gin(to_tsvector('english', name));

-- Comments
COMMENT ON TABLE artists_v2 IS 'Global artist catalog (V2)';

-- RLS Policies
ALTER TABLE artists_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view artists"
  ON artists_v2 FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create artists"
  ON artists_v2 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their artists briefly"
  ON artists_v2 FOR UPDATE
  USING (
    created_by = auth.uid() 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );

-- Create new song-artist junction (references V2 tables)
CREATE TABLE IF NOT EXISTS song_artists_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs_v2(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists_v2(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_song_artist_v2 UNIQUE (song_id, artist_id),
  CONSTRAINT unique_song_position_v2 UNIQUE (song_id, position)
);

-- Indexes
CREATE INDEX idx_song_artists_v2_song ON song_artists_v2(song_id);
CREATE INDEX idx_song_artists_v2_artist ON song_artists_v2(artist_id);

-- RLS
ALTER TABLE song_artists_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view song-artist links"
  ON song_artists_v2 FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create links"
  ON song_artists_v2 FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
