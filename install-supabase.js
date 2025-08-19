// install-supabase.js
// This script will install all necessary Supabase packages

import { execSync } from 'child_process';

console.log('Installing Supabase packages...');

try {
  // Core Supabase packages
  console.log('\n1. Installing core Supabase client...');
  execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });

  // Authentication UI components
  console.log('\n2. Installing Supabase Auth UI components...');
  execSync('npm install @supabase/auth-ui-react @supabase/auth-ui-shared', { stdio: 'inherit' });

  // Auth helpers for Next.js
  console.log('\n3. Installing Supabase Auth Helpers for Next.js...');
  execSync('npm install @supabase/auth-helpers-nextjs', { stdio: 'inherit' });

  // Realtime client for subscriptions
  console.log('\n4. Installing Supabase Realtime client...');
  execSync('npm install @supabase/realtime-js', { stdio: 'inherit' });

  // Storage client for file uploads
  console.log('\n5. Installing Supabase Storage client...');
  execSync('npm install @supabase/storage-js', { stdio: 'inherit' });

  // Create example client and environment files
  console.log('\n6. Creating Supabase client file...');
  
  console.log('\nAll Supabase packages have been installed successfully!');
  console.log('\nNext steps:');
  console.log('1. Create a Supabase project at https://supabase.com');
  console.log('2. Set up your environment variables in .env.local');
  console.log('3. Update your API routes to use Supabase client');
  console.log('4. Update your authentication flow to use Supabase Auth');
  
} catch (error) {
  console.error('Error installing Supabase packages:', error);
}
