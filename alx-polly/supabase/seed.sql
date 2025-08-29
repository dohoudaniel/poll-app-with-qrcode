-- Sample data for Polly application
-- Run this after creating the schema to populate with test data

-- Insert sample profiles (these would normally be created via Supabase Auth)
-- Note: In production, profiles are created automatically when users sign up
INSERT INTO public.profiles (id, username, first_name, last_name, bio) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'johndoe', 'John', 'Doe', 'Software developer and poll enthusiast'),
('550e8400-e29b-41d4-a716-446655440002', 'janesmit', 'Jane', 'Smith', 'Product manager who loves gathering feedback'),
('550e8400-e29b-41d4-a716-446655440003', 'mikejohn', 'Mike', 'Johnson', 'Designer focused on user experience');

-- Insert sample polls
INSERT INTO public.polls (id, title, description, created_by, expires_at, allow_multiple_votes, is_anonymous) VALUES
('650e8400-e29b-41d4-a716-446655440001', 
 'What''s your favorite programming language?', 
 'Help us understand the community preferences for our next project',
 '550e8400-e29b-41d4-a716-446655440001',
 '2024-12-31 23:59:59+00',
 false,
 true),

('650e8400-e29b-41d4-a716-446655440002',
 'Best time for team meetings?',
 'Let''s find a time that works for everyone on the team',
 '550e8400-e29b-41d4-a716-446655440002',
 NULL,
 true,
 false),

('650e8400-e29b-41d4-a716-446655440003',
 'Office lunch preferences',
 'What should we order for the team lunch this Friday?',
 '550e8400-e29b-41d4-a716-446655440001',
 '2024-02-01 12:00:00+00',
 false,
 true);

-- Insert poll options
INSERT INTO public.poll_options (id, poll_id, text) VALUES
-- Options for programming language poll
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'JavaScript'),
('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Python'),
('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'TypeScript'),
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', 'Go'),

-- Options for meeting time poll
('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002', '9:00 AM'),
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440002', '2:00 PM'),
('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440002', '4:00 PM'),

-- Options for lunch poll
('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440003', 'Pizza'),
('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440003', 'Sushi'),
('750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440003', 'Sandwiches'),
('750e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440003', 'Salads');

-- Insert sample votes
INSERT INTO public.votes (poll_id, option_id, user_id) VALUES
-- Votes for programming language poll
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'), -- John votes Python
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'), -- Jane votes JavaScript
('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003'), -- Mike votes TypeScript

-- Votes for meeting time poll (multiple votes allowed)
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001'), -- John votes 2:00 PM
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001'), -- John also votes 4:00 PM
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002'), -- Jane votes 2:00 PM
('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003'), -- Mike votes 9:00 AM

-- Votes for lunch poll
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002'), -- Jane votes Pizza
('650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003'); -- Mike votes Sushi

-- Insert some poll views for analytics
INSERT INTO public.poll_views (poll_id, user_id, ip_address) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '192.168.1.100'),
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '192.168.1.101'),
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '192.168.1.102'),
('650e8400-e29b-41d4-a716-446655440001', NULL, '203.0.113.1'), -- Anonymous view
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '192.168.1.100'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '192.168.1.101'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '192.168.1.101'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '192.168.1.102');
