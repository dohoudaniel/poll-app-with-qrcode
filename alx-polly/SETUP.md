# Polly App Setup Guide

This guide will help you set up your Polly polling application with Supabase integration.

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git (for version control)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to initialize

### 1.2 Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema-fixed.sql`
4. Click **"Run"** to create all tables and functions

### 1.3 Add Sample Data (Optional)
1. In the SQL Editor, copy and paste `supabase/seed.sql`
2. Click **"Run"** to insert sample data

### 1.4 Get API Keys
1. Go to **Settings** > **API**
2. Copy your **Project URL** and **anon public** key

## Step 2: Environment Configuration

### 2.1 Create Environment File
Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the values with your actual Supabase credentials.

### 2.2 Verify Environment Variables
Make sure your `.env.local` file is in the project root and not committed to git.

## Step 3: Install Dependencies

```bash
npm install
```

All required dependencies should already be installed, including:
- `@supabase/supabase-js` - Supabase client
- `react-hook-form` - Form handling
- `zod` - Schema validation
- All Shadcn UI components

## Step 4: Enable Authentication (Optional)

### 4.1 Configure Auth Providers
1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure any additional providers you want (Google, GitHub, etc.)

### 4.2 Set Auth Policies
The database schema already includes Row Level Security policies that:
- Allow users to create polls
- Restrict poll editing to creators
- Enable public viewing of active polls

## Step 5: Test the Application

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test Poll Creation
1. Open http://localhost:3000
2. Navigate to **Create Poll** (you may need to sign up first)
3. Fill out the poll form:
   - Title: "Test Poll"
   - Description: "This is a test"
   - Add 2+ options
   - Set preferences (multiple votes, anonymous, etc.)
4. Submit the form

### 5.3 Verify Database
1. Go to Supabase dashboard > **Table Editor**
2. Check the `polls` table for your new poll
3. Check the `poll_options` table for the options

## Step 6: Authentication Flow

### 6.1 Sign Up Process
1. Go to `/auth/register`
2. Create an account with email/password
3. A profile will be automatically created in the `profiles` table

### 6.2 Sign In Process
1. Go to `/auth/login`
2. Sign in with your credentials
3. You'll be redirected to the dashboard

## Troubleshooting

### Common Issues

#### 1. "Authentication required" error
- Make sure you're signed in before creating polls
- Check that your Supabase auth is working
- Verify environment variables are set correctly

#### 2. Database connection errors
- Verify your Supabase URL and API key
- Check that the database schema was created successfully
- Ensure RLS policies are enabled

#### 3. Poll creation fails
- Check browser console for detailed error messages
- Verify the user has a profile in the `profiles` table
- Make sure all required fields are filled

#### 4. TypeScript errors
- Run `npm run build` to check for type errors
- Ensure all imports are correct
- Check that database types match your schema

### Debug Steps

1. **Check Environment Variables**
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. **Test Supabase Connection**
   - Open browser console on any page
   - Check for Supabase connection errors

3. **Verify Database Schema**
   - Go to Supabase Table Editor
   - Ensure all tables exist: `profiles`, `polls`, `poll_options`, `votes`, `poll_views`

4. **Check Authentication**
   - Try signing up/in manually
   - Verify user appears in Supabase Auth dashboard

## Next Steps

Once poll creation is working:

1. **Add Voting Functionality** - Update voting API routes
2. **Implement Real-time Updates** - Use Supabase subscriptions
3. **Add QR Code Generation** - Integrate QR code library
4. **Enhance UI** - Add loading states, better error handling
5. **Deploy** - Deploy to Vercel or your preferred platform

## File Structure

```
alx-polly/
├── app/
│   ├── api/polls/          # Poll API routes (updated)
│   ├── auth/               # Auth pages
│   ├── polls/              # Poll pages
│   └── dashboard/          # User dashboard
├── lib/
│   ├── supabase.ts         # Supabase client (updated)
│   ├── auth-context.tsx    # Auth context (new)
│   └── services/
│       └── poll-service.ts # Poll operations (new)
├── types/
│   ├── database.ts         # Database types (new)
│   └── index.ts            # App types
├── supabase/
│   ├── schema-fixed.sql    # Database schema
│   ├── seed.sql            # Sample data
│   └── README.md           # Database docs
└── .env.local              # Environment variables
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Verify your database schema matches the provided SQL
4. Ensure environment variables are correctly set

Your Polly app is now ready for poll creation with Supabase! 🎉
