-- Migration: Add Public Sharing (Safe Version)
-- Description: Safely adds public sharing functionality without conflicts
-- Dependencies: test_results table

-- Create public_test_shares table for secure public sharing
CREATE TABLE IF NOT EXISTS public.public_test_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.test_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_views INTEGER DEFAULT NULL,
    current_views INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to explain the table
COMMENT ON TABLE public.public_test_shares IS 'Secure public sharing tokens for test results';
COMMENT ON COLUMN public.public_test_shares.share_token IS 'Cryptographically secure token for public access';
COMMENT ON COLUMN public.public_test_shares.expires_at IS 'When the share link expires (NULL = never expires)';
COMMENT ON COLUMN public.public_test_shares.max_views IS 'Maximum number of views allowed (NULL = unlimited)';
COMMENT ON COLUMN public.public_test_shares.current_views IS 'Current number of times the share has been viewed';

-- Indexes for public_test_shares
CREATE INDEX IF NOT EXISTS idx_public_test_shares_token ON public.public_test_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_public_test_shares_test_id ON public.public_test_shares(test_id);
CREATE INDEX IF NOT EXISTS idx_public_test_shares_user_id ON public.public_test_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_public_test_shares_expires_at ON public.public_test_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_public_test_shares_active ON public.public_test_shares(is_active);

-- Enable Row Level Security
ALTER TABLE public.public_test_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe approach)
DO $$
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can manage their own public shares" ON public.public_test_shares;
    DROP POLICY IF EXISTS "Anonymous users can view active public shares" ON public.public_test_shares;
EXCEPTION
    WHEN undefined_object THEN
        -- Policy doesn't exist, continue
        NULL;
END $$;

-- RLS policies for public_test_shares
CREATE POLICY "Users can manage their own public shares"
    ON public.public_test_shares
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow anonymous access to active, non-expired public shares for viewing
CREATE POLICY "Anonymous users can view active public shares"
    ON public.public_test_shares
    FOR SELECT
    TO anon
    USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_views IS NULL OR current_views < max_views)
    );

-- Function to generate a secure sharing token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    token TEXT;
    exists_check BOOLEAN;
BEGIN
    -- Generate a cryptographically secure token
    LOOP
        -- Generate a 32-character random string using base64url encoding
        token := encode(gen_random_bytes(24), 'base64');
        -- Replace URL-unsafe characters
        token := replace(replace(replace(token, '+', '-'), '/', '_'), '=', '');

        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM public.public_test_shares WHERE share_token = token) INTO exists_check;

        -- Exit loop if token is unique
        EXIT WHEN NOT exists_check;
    END LOOP;

    RETURN token;
END;
$$;

-- Function to create a public share
CREATE OR REPLACE FUNCTION create_public_share(
    p_test_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_expires_in_hours INTEGER DEFAULT NULL,
    p_max_views INTEGER DEFAULT NULL
)
RETURNS TABLE(
    share_id UUID,
    share_token TEXT,
    share_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_share_id UUID;
    v_share_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();

    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Verify the user owns the test result
    IF NOT EXISTS(
        SELECT 1 FROM public.test_results
        WHERE id = p_test_id AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Test result not found or access denied';
    END IF;

    -- Calculate expiration time
    IF p_expires_in_hours IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_hours || ' hours')::INTERVAL;
    END IF;

    -- Generate unique token
    v_share_token := generate_share_token();

    -- Create the share record
    INSERT INTO public.public_test_shares (
        test_id,
        user_id,
        share_token,
        title,
        description,
        expires_at,
        max_views
    ) VALUES (
        p_test_id,
        v_user_id,
        v_share_token,
        p_title,
        p_description,
        v_expires_at,
        p_max_views
    ) RETURNING id INTO v_share_id;

    -- Return the share details
    RETURN QUERY SELECT
        v_share_id,
        v_share_token,
        '/shared/' || v_share_token AS share_url;
END;
$$;

-- Function to get public share data (for anonymous access)
CREATE OR REPLACE FUNCTION get_public_share_data(p_share_token TEXT)
RETURNS TABLE(
    test_type TEXT,
    score INTEGER,
    reaction_time INTEGER,
    accuracy INTEGER,
    test_timestamp TIMESTAMP WITH TIME ZONE,
    title TEXT,
    description TEXT,
    share_id UUID,
    current_views INTEGER,
    max_views INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_share_record RECORD;
BEGIN
    -- Get the share record with validation
    SELECT
        pts.id,
        pts.test_id,
        pts.title,
        pts.description,
        pts.current_views,
        pts.max_views,
        pts.expires_at,
        pts.is_active
    INTO v_share_record
    FROM public.public_test_shares pts
    WHERE pts.share_token = p_share_token;

    -- Check if share exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Share not found';
    END IF;

    -- Check if share is active
    IF NOT v_share_record.is_active THEN
        RAISE EXCEPTION 'Share is no longer active';
    END IF;

    -- Check if share has expired
    IF v_share_record.expires_at IS NOT NULL AND v_share_record.expires_at <= NOW() THEN
        RAISE EXCEPTION 'Share has expired';
    END IF;

    -- Check if view limit has been reached
    IF v_share_record.max_views IS NOT NULL AND v_share_record.current_views >= v_share_record.max_views THEN
        RAISE EXCEPTION 'Share view limit reached';
    END IF;

    -- Increment view count
    UPDATE public.public_test_shares
    SET
        current_views = current_views + 1,
        updated_at = NOW()
    WHERE id = v_share_record.id;

    -- Return the test result data (limited fields for privacy)
    RETURN QUERY
    SELECT
        tr.test_type,
        tr.score,
        tr.reaction_time,
        tr.accuracy,
        tr.timestamp AS test_timestamp,
        v_share_record.title,
        v_share_record.description,
        v_share_record.id,
        v_share_record.current_views + 1, -- Return updated count
        v_share_record.max_views,
        v_share_record.expires_at
    FROM public.test_results tr
    WHERE tr.id = v_share_record.test_id;
END;
$$;

-- Function to revoke a public share
CREATE OR REPLACE FUNCTION revoke_public_share(p_share_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();

    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Deactivate the share if it belongs to the user
    UPDATE public.public_test_shares
    SET
        is_active = FALSE,
        updated_at = NOW()
    WHERE share_token = p_share_token AND user_id = v_user_id;

    -- Return whether any rows were affected
    RETURN FOUND;
END;
$$;

-- Function to clean up expired shares (to be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired shares
    DELETE FROM public.public_test_shares
    WHERE expires_at IS NOT NULL AND expires_at <= NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_share_token() TO authenticated;
GRANT EXECUTE ON FUNCTION create_public_share(UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_share_data(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION revoke_public_share(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_shares() TO authenticated;

-- Add comments
COMMENT ON FUNCTION generate_share_token() IS 'Generates a cryptographically secure sharing token';
COMMENT ON FUNCTION create_public_share(UUID, TEXT, TEXT, INTEGER, INTEGER) IS 'Creates a public share for a test result';
COMMENT ON FUNCTION get_public_share_data(TEXT) IS 'Retrieves public share data for anonymous viewing';
COMMENT ON FUNCTION revoke_public_share(TEXT) IS 'Revokes/deactivates a public share';
COMMENT ON FUNCTION cleanup_expired_shares() IS 'Removes expired shares from the database';
