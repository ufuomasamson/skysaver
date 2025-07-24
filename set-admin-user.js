// Script to set a user as admin
// To run this script: node set-admin-user.js your-admin-email@example.com

// Import the Supabase client
const { createClient } = require('@supabase/supabase-js');

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.error("Please provide an email address as an argument");
  console.error("Usage: node set-admin-user.js your-admin-email@example.com");
  process.exit(1);
}

// Configure Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dderjvlsbmjpuptiqlhx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'; // Add your service role key here

const supabase = createClient(supabaseUrl, supabaseKey);

async function setUserAsAdmin(email) {
  try {
    console.log(`Setting user ${email} as admin...`);
    
    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !userData) {
      console.error("Error finding user:", userError || "User not found");
      
      // Try an alternative approach using auth API
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error("Error listing users:", authError);
        process.exit(1);
      }
      
      const foundUser = authUser.users.find(u => u.email === email);
      if (!foundUser) {
        console.error(`User with email ${email} not found`);
        process.exit(1);
      }
      
      userData = { id: foundUser.id };
      console.log(`Found user with ID: ${foundUser.id}`);
    }
    
    // Update the users table
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: userData.id,
        email: email,
        role: 'admin',
        updated_at: new Date().toISOString()
      });
    
    if (updateError) {
      console.error("Error updating user role:", updateError);
    } else {
      console.log(`Successfully set ${email} as admin in users table`);
    }
    
    // Also update the user_roles table if it exists
    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userData.id,
          role: 'admin',
          updated_at: new Date().toISOString()
        });
      
      if (roleError) {
        console.error("Error updating user_roles table:", roleError);
      } else {
        console.log(`Successfully set ${email} as admin in user_roles table`);
      }
    } catch (err) {
      console.log("user_roles table may not exist, skipping...");
    }
    
    console.log("Admin role set successfully!");
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

setUserAsAdmin(email);
