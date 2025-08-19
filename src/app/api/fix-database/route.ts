import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase client with admin rights to execute SQL
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dderjvlsbmjpuptiqlhx.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // First, check if the users table exists
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    // If users table doesn't exist, create it with direct SQL
    if (tableError || !tables || tables.length === 0) {
      const { error: createError } = await supabaseAdmin.rpc(
        'exec_sql',
        {
          sql_query: `
            CREATE TABLE IF NOT EXISTS public.users (
              id UUID PRIMARY KEY REFERENCES auth.users(id),
              email TEXT UNIQUE,
              full_name TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              role TEXT DEFAULT 'user'
            );
            
            CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
            
            ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Users can view their own data" 
              ON public.users FOR SELECT 
              USING (auth.uid() = id);
            
            CREATE POLICY "Users can update their own data" 
              ON public.users FOR UPDATE 
              USING (auth.uid() = id);
          `
        }
      );
      
      if (createError) {
        // Try alternative approach with simpler SQL
        const { error: simpleCreateError } = await supabaseAdmin.rpc(
          'exec_sql',
          {
            sql_query: `
              CREATE TABLE IF NOT EXISTS public.users (
                id UUID PRIMARY KEY,
                email TEXT,
                full_name TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                role TEXT DEFAULT 'user'
              );
            `
          }
        );
        
        if (simpleCreateError) {
          return NextResponse.json({
            success: false,
            message: "Failed to create users table",
            error: simpleCreateError.message,
            originalError: createError.message
          }, { status: 500 });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Created users table with required columns",
        tables: ["users table created successfully"]
      });
    }
    
    // Check for the email column in users table
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .eq('column_name', 'email');
    
    // If email column doesn't exist, add it with direct SQL
    if (columnError || !columns || columns.length === 0) {
      const { error: alterError } = await supabaseAdmin.rpc(
        'exec_sql',
        {
          sql_query: `
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
            
            CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
            
            UPDATE public.users
            SET email = auth.users.email
            FROM auth.users
            WHERE public.users.id = auth.users.id
            AND (public.users.email IS NULL OR public.users.email = '');
          `
        }
      );
      
      if (alterError) {
        return NextResponse.json({
          success: false,
          message: "Failed to add email column to users table",
          error: alterError.message
        }, { status: 500 });
      }
    }
    
    // Everything is already set up correctly
    return NextResponse.json({
      success: true,
      message: "Users table is properly configured with email column",
      tables,
      columns
    });
    
  } catch (error) {
    console.error("Database check error:", error);
    return NextResponse.json({
      success: false,
      message: "Error checking database structure",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
