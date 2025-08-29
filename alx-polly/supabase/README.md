# Polly Database Schema for Supabase

This directory contains the database schema and setup files for the Polly polling application using Supabase.

## Files

- `schema.sql` - Complete database schema with tables, indexes, triggers, and RLS policies
- `seed.sql` - Sample data for testing and development
- `README.md` - This file with setup instructions

## Database Schema Overview

### Tables

1. **profiles** - User profiles (extends Supabase auth.users)
   - Stores additional user information like username, name, bio, avatar
   - Links to Supabase authentication system

2. **polls** - Main polls table
   - Contains poll metadata, settings, and configuration
   - Tracks total votes, expiration, and activity status

3. **poll_options** - Individual options for each poll
   - Stores option text and vote counts
   - Linked to polls via foreign key

4. **votes** - Individual vote records
   - Tracks who voted for what option
   - Supports both authenticated and anonymous voting
   - Prevents duplicate votes with unique constraints

5. **poll_views** - Analytics table for tracking poll views
   - Records when polls are viewed for analytics
   - Tracks both authenticated and anonymous views

### Key Features

- **Row Level Security (RLS)** - Comprehensive security policies
- **Automatic vote counting** - Triggers update vote counts automatically
- **Flexible voting** - Supports single/multiple choice and anonymous voting
- **Analytics tracking** - Built-in view tracking for poll analytics
- **Helper functions** - Utility functions for common operations

## Setup Instructions

### 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### 2. Run the Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `schema.sql`
3. Click "Run" to execute the schema

### 3. Add Sample Data (Optional)

1. In the SQL Editor, copy and paste the contents of `seed.sql`
2. Click "Run" to insert sample data

### 4. Configure Environment Variables

Add these environment variables to your Next.js application:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Enable Authentication (Optional)

If you want user authentication:

1. Go to Authentication > Settings in Supabase dashboard
2. Configure your preferred auth providers
3. Set up email templates if using email auth

## Row Level Security Policies

The schema includes comprehensive RLS policies:

### Profiles
- Users can view all profiles
- Users can only update their own profile
- Users can only insert their own profile

### Polls
- Anyone can view active polls
- Poll creators can view their own inactive polls
- Users can create, update, and delete their own polls

### Poll Options
- Anyone can view options for active polls
- Poll creators can manage options for their polls

### Votes
- Users can vote on active, non-expired polls
- Users can view votes for polls they created
- Users can delete their own votes
- Anonymous voting is supported

### Poll Views
- Anyone can record poll views
- Poll creators can view analytics for their polls

## Helper Functions

The schema includes several utility functions:

### `get_poll_results(poll_uuid)`
Returns poll results with vote counts and percentages for each option.

### `user_has_voted(poll_uuid, user_uuid)`
Checks if a specific user has voted on a poll.

### `get_user_votes(poll_uuid, user_uuid)`
Returns the option IDs that a user voted for in a specific poll.

## Usage Examples

### Get poll results with percentages:
```sql
SELECT * FROM get_poll_results('your-poll-id');
```

### Check if user has voted:
```sql
SELECT user_has_voted('your-poll-id', 'your-user-id');
```

### Get user's votes for a poll:
```sql
SELECT * FROM get_user_votes('your-poll-id', 'your-user-id');
```

## Security Considerations

- All tables have RLS enabled
- Policies prevent unauthorized access to data
- Anonymous voting is supported while maintaining data integrity
- User data is protected and only accessible by authorized users
- Poll creators have full control over their polls

## Maintenance

The schema includes automatic triggers for:
- Updating vote counts when votes are added/removed
- Updating timestamps when records are modified
- Maintaining data consistency across related tables

## Troubleshooting

If you encounter issues:

1. **Permission errors**: Check that RLS policies are correctly applied
2. **Vote count mismatches**: The triggers should handle this automatically, but you can manually refresh counts if needed
3. **Authentication issues**: Ensure Supabase auth is properly configured
4. **Performance issues**: The schema includes indexes on commonly queried columns

For more help, refer to the [Supabase documentation](https://supabase.com/docs).
