// Improve the admin role script to make it easier to use

const { createClient } = require('@supabase/supabase-js');

// Default Supabase URL from the project
const SUPABASE_URL = 'https://pbapixvhgiawwslnoipx.supabase.co';

// Main function to set user as admin
async function setAdminRole(email, serviceRoleKey) {
  if (!email) {
    console.error("❌ Error: Email is required");
    console.log("Usage: node set-admin-role.js [email] [service-role-key]");
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error("⚠️ Warning: No service role key provided. Please provide your Supabase service role key:");
    console.log("You can find this in your Supabase dashboard under Project Settings > API");
    console.log("Usage: node set-admin-role.js [email] [service-role-key]");
    process.exit(1);
  }

  console.log(`🔑 Setting up Supabase client with URL: ${SUPABASE_URL}`);
  
  // Create Supabase admin client with service role key
  const supabase = createClient(SUPABASE_URL, serviceRoleKey);
  
  try {
    console.log(`🔍 Looking up user with email: ${email}`);
    
    // First get the user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      console.error("❌ Error listing users:", getUserError.message);
      process.exit(1);
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User with email ${email} not found in the auth system`);
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.email} with ID: ${user.id}`);
    
    // Update user metadata to include admin role
    console.log("📝 Updating user metadata with admin role...");
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { role: 'admin' } }
    );
    
    if (updateError) {
      console.error("❌ Error updating user metadata:", updateError.message);
    } else {
      console.log("✅ User metadata updated successfully!");
    }
    
    // Check if users table exists and update the role there
    console.log("📝 Updating users table...");
    const { error: usersUpdateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        role: 'admin',
        updated_at: new Date().toISOString()
      });
    
    if (usersUpdateError) {
      console.log(`⚠️ Note: Could not update users table: ${usersUpdateError.message}`);
      console.log("This might be normal if the table doesn't exist yet.");
    } else {
      console.log("✅ Updated role in users table");
    }
    
    // Also try to update the user_roles table if it exists
    console.log("📝 Updating user_roles table...");
    const { error: rolesUpdateError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      });
    
    if (rolesUpdateError) {
      console.log(`⚠️ Note: Could not update user_roles table: ${rolesUpdateError.message}`);
      console.log("This might be normal if the table doesn't exist yet.");
    } else {
      console.log("✅ Updated role in user_roles table");
    }
    
    console.log("\n🎉 SUCCESS! User has been granted admin privileges.");
    console.log("📋 Instructions:");
    console.log("1. Log out of your application");
    console.log("2. Log back in with email:", email);
    console.log("3. You should now have access to the admin dashboard");
    
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

// Get command line arguments
const email = process.argv[2];
const serviceRoleKey = process.argv[3];

// Run the function
setAdminRole(email, serviceRoleKey);
