# MySQL to Supabase Migration Guide

This document outlines the key steps and considerations when migrating from MySQL to Supabase in the United Air application.

## 1. Database Migration

### Schema Changes
- Foreign key constraints must be explicitly defined in Supabase
- Table names should follow Postgres conventions (usually lowercase with underscores)

### Migration Steps
1. Create tables with proper foreign key constraints
2. Migrate data using appropriate transformations
3. Set up sequences for auto-incrementing IDs
4. Apply Row Level Security (RLS) policies

## 2. API Changes

### Query Syntax Changes
- Replace MySQL queries with Supabase client calls
- Use Supabase's relationship syntax for joined queries:
  ```typescript
  .select(`
    *,
    departure_location:locations!flights_departure_location_id_fkey(id, city, country),
    arrival_location:locations!flights_arrival_location_id_fkey(id, city, country),
    airline:airlines(id, name, logo_url)
  `)
  ```

### Authentication Integration
- Replace any custom auth with Supabase Auth
- Update user session handling to work with Supabase's JWT tokens

## 3. Row Level Security (RLS)

### Understanding RLS
Row Level Security is a Postgres feature that restricts which rows users can access in database tables.

### Common Issues
1. **Permission denied errors**: Occur when RLS blocks access to a table
2. **Missing relationships**: Happen when foreign keys aren't properly defined

### Solutions
1. Use `serverSupabaseClient` for admin operations
   ```typescript
   // In route handlers
   const serverSupabase = createServerSupabaseClient();
   // Use serverSupabase instead of supabase for queries
   ```

2. Create appropriate RLS policies for admin users
   ```sql
   CREATE POLICY admin_tablename_all ON tablename
       FOR ALL
       TO authenticated
       USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
   ```

3. Grant service role permissions to bypass RLS
   ```sql
   GRANT ALL ON TABLE tablename TO service_role;
   ```

## 4. Troubleshooting

### RLS Permission Errors
If you see "permission denied for table" errors:
1. Check that the user has the appropriate role
2. Verify RLS policies allow the operation
3. Consider using serverSupabaseClient for admin operations

### Relationship Errors
If you see "could not find a relationship" errors:
1. Ensure foreign keys are properly defined in your schema
2. Use explicit relationship naming in select queries
3. Check for typos in table or column names

### Debug Mode
To diagnose issues, you can temporarily enable debug mode:
```typescript
// In supabaseClient.ts
debug: true // Enable for troubleshooting, disable in production
```

## 5. Best Practices

1. Always use explicit foreign key constraints
2. Use serverSupabaseClient for admin operations
3. Set up RLS policies early in development
4. Keep sensitive operations server-side
5. Test with different user roles to ensure RLS works correctly

## 6. Environment Variables

Make sure to set these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)
