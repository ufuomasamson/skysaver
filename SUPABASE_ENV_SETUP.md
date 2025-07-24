# Supabase Environment Variables Setup

This guide explains how to set up the necessary environment variables for the Supabase integration in the United Air application.

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Finding Your Supabase Keys

1. **Log in to your Supabase dashboard** at [https://app.supabase.io](https://app.supabase.io)
2. **Select your project** from the dashboard
3. **Go to Project Settings** in the sidebar
4. **Click on API** in the Project Settings menu

You'll find the following values:

- **Project URL**: Use this as your `NEXT_PUBLIC_SUPABASE_URL`
- **Project API Keys**:
  - **anon public**: Use this as your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role**: Use this as your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Important Security Notes

1. **NEVER expose the `service_role` key in client-side code**. It should only be used in:
   - API routes
   - Server-side components
   - Backend services

2. **Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser**. Only include the anon key and URL with this prefix.

3. **The `SUPABASE_SERVICE_ROLE_KEY` has full database access** and can bypass Row Level Security. It should be treated as a sensitive secret.

## Vercel Deployment

When deploying to Vercel:

1. Go to your project settings in Vercel
2. Navigate to the Environment Variables section
3. Add all three environment variables
4. Ensure proper scoping (set NEXT_PUBLIC_ variables as both Production and Preview)

## Testing Your Configuration

You can test if your environment variables are correctly configured by:

1. Running the application locally
2. Opening the console in your browser's developer tools
3. Check for any Supabase connection errors

If you see "Supabase key available: true" in the console without errors, your configuration is working correctly.

## Troubleshooting

- **"Service role key not found"**: Ensure the `SUPABASE_SERVICE_ROLE_KEY` is correctly set in your environment variables
- **Connection errors**: Verify your project URL is correct and the project is active
- **Permission errors**: This may indicate an issue with your RLS policies, not necessarily with your environment variables
