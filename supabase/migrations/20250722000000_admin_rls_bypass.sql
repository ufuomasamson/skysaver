-- Grant admin users special access to tables through RLS policies
-- This allows admin users to bypass the default RLS restrictions

-- Create RLS policies that allow admin users to access flight data
CREATE POLICY admin_flights_all ON flights
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Create RLS policies that allow admin users to access location data
CREATE POLICY admin_locations_all ON locations
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Create RLS policies that allow admin users to access user data
CREATE POLICY admin_users_all ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin') OR auth.uid() = id);

-- Grant permissions for the service role (used by serverSupabaseClient)
-- This ensures that server-side operations can bypass RLS entirely when needed
GRANT ALL ON TABLE flights TO service_role;
GRANT ALL ON TABLE locations TO service_role;
GRANT ALL ON TABLE users TO service_role;
GRANT ALL ON TABLE airlines TO service_role;
