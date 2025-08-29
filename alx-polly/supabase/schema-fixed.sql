-- Polly Database Schema for Supabase (Fixed Version)
-- This file contains the complete database schema for the polling application
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls table
CREATE TABLE public.polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    allow_multiple_votes BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT true,
    qr_code_url TEXT,
    total_votes INTEGER DEFAULT 0,
    
    -- Constraints
    CONSTRAINT polls_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    CONSTRAINT polls_description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT polls_expires_at_future CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Poll options table
CREATE TABLE public.poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    text VARCHAR(500) NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT poll_options_text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
    CONSTRAINT poll_options_votes_count_positive CHECK (votes_count >= 0)
);

-- Votes table
CREATE TABLE public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate votes (when not allowing multiple votes)
    UNIQUE(poll_id, user_id, option_id)
);

-- Poll views/analytics table (optional - for tracking poll views)
CREATE TABLE public.poll_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_polls_created_by ON public.polls(created_by);
CREATE INDEX idx_polls_created_at ON public.polls(created_at DESC);
CREATE INDEX idx_polls_is_active ON public.polls(is_active);
CREATE INDEX idx_polls_expires_at ON public.polls(expires_at);

CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_poll_options_votes_count ON public.poll_options(votes_count DESC);

CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at DESC);

CREATE INDEX idx_poll_views_poll_id ON public.poll_views(poll_id);
CREATE INDEX idx_poll_views_viewed_at ON public.poll_views(viewed_at DESC);

-- Functions and triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for polls updated_at
CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON public.polls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update poll total_votes when votes are added/removed
CREATE OR REPLACE FUNCTION update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update option votes count
        UPDATE public.poll_options
        SET votes_count = votes_count + 1
        WHERE id = NEW.option_id;

        -- Update poll total votes
        UPDATE public.polls
        SET total_votes = (
            SELECT COUNT(*)
            FROM public.votes
            WHERE poll_id = NEW.poll_id
        )
        WHERE id = NEW.poll_id;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update option votes count
        UPDATE public.poll_options
        SET votes_count = votes_count - 1
        WHERE id = OLD.option_id;

        -- Update poll total votes
        UPDATE public.polls
        SET total_votes = (
            SELECT COUNT(*)
            FROM public.votes
            WHERE poll_id = OLD.poll_id
        )
        WHERE id = OLD.poll_id;

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for vote count updates
CREATE TRIGGER update_vote_counts
    AFTER INSERT OR DELETE ON public.votes
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_vote_counts();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_views ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Polls policies
CREATE POLICY "Anyone can view active polls" ON public.polls
    FOR SELECT USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Users can create polls" ON public.polls
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own polls" ON public.polls
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own polls" ON public.polls
    FOR DELETE USING (auth.uid() = created_by);

-- Poll options policies
CREATE POLICY "Anyone can view poll options" ON public.poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE polls.id = poll_options.poll_id
            AND (polls.is_active = true OR polls.created_by = auth.uid())
        )
    );

CREATE POLICY "Poll creators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE polls.id = poll_options.poll_id
            AND polls.created_by = auth.uid()
        )
    );

-- Votes policies
CREATE POLICY "Users can view votes for polls they created" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE polls.id = votes.poll_id
            AND polls.created_by = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can vote on active polls" ON public.votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE polls.id = poll_id
            AND polls.is_active = true
            AND (polls.expires_at IS NULL OR polls.expires_at > NOW())
        )
    );

CREATE POLICY "Users can delete own votes" ON public.votes
    FOR DELETE USING (auth.uid() = user_id);

-- Poll views policies
CREATE POLICY "Anyone can record poll views" ON public.poll_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Poll creators can view analytics" ON public.poll_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE polls.id = poll_views.poll_id
            AND polls.created_by = auth.uid()
        )
    );

-- Helper Functions

-- Function to get poll results with percentages
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE (
    option_id UUID,
    option_text VARCHAR(500),
    votes_count INTEGER,
    percentage NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        po.id,
        po.text,
        po.votes_count,
        CASE
            WHEN p.total_votes = 0 THEN 0
            ELSE ROUND((po.votes_count::NUMERIC / p.total_votes::NUMERIC) * 100, 2)
        END as percentage
    FROM public.poll_options po
    JOIN public.polls p ON po.poll_id = p.id
    WHERE po.poll_id = poll_uuid
    ORDER BY po.votes_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has voted on a poll
CREATE OR REPLACE FUNCTION user_has_voted(poll_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.votes
        WHERE poll_id = poll_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's votes for a poll
CREATE OR REPLACE FUNCTION get_user_votes(poll_uuid UUID, user_uuid UUID)
RETURNS TABLE (option_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT v.option_id
    FROM public.votes v
    WHERE v.poll_id = poll_uuid AND v.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
