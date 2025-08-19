-- Create a function to list all tables in the database
-- This will help with debugging and testing the database structure

CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (table_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text
  FROM 
    information_schema.tables t
  WHERE 
    t.table_schema = 'public'
  ORDER BY 
    t.table_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables() TO anon;
