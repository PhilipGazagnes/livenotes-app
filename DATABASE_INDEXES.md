# Database Performance Indexes

This document outlines the recommended indexes for optimal query performance in the Livenotes application.

## Required Indexes

### Songs Table
```sql
-- Primary key (automatically indexed)
-- id (uuid)

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_songs_project_id ON songs(project_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);
```

### Tags Table
```sql
-- Primary key (automatically indexed)
-- id (uuid)

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_tags_project_id ON tags(project_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
```

### Lists Table
```sql
-- Primary key (automatically indexed)
-- id (uuid)

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_lists_project_id ON lists(project_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_lists_name ON lists(name);
```

### Song_Tags Table (Junction Table)
```sql
-- Foreign key indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_song_tags_song_id ON song_tags(song_id);
CREATE INDEX IF NOT EXISTS idx_song_tags_tag_id ON song_tags(tag_id);

-- Composite index for filtering operations
CREATE INDEX IF NOT EXISTS idx_song_tags_composite ON song_tags(song_id, tag_id);
```

### List_Items Table (Junction Table)
```sql
-- Foreign key indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_song_id ON list_items(song_id);

-- Position index for ordering operations
CREATE INDEX IF NOT EXISTS idx_list_items_position ON list_items(list_id, position);
```

### Projects Table
```sql
-- Primary key (automatically indexed)
-- id (uuid)

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
```

## Index Verification

To verify indexes are created in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Database → Tables
3. Select each table
4. Check the "Indexes" tab
5. Confirm all indexes listed above are present

## Performance Monitoring

Monitor query performance in Supabase Dashboard:
- Database → Query Performance
- Look for slow queries
- Check for missing indexes

## Notes

- Primary keys and unique constraints are automatically indexed
- Foreign keys should always be indexed
- Composite indexes help with multi-column WHERE clauses
- Keep indexes updated as query patterns evolve
- Too many indexes can slow down writes, balance is key

## Last Updated
March 31, 2026
