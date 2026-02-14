
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id),
    viewer_ip VARCHAR(45),
    user_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS text_position VARCHAR(10) DEFAULT 'bottom';

ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_author_like BOOLEAN DEFAULT FALSE;
