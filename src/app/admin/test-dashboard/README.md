# Admin Dashboard API Test

This dashboard allows you to test all API endpoints that have been converted to use the Direct API approach to bypass region access issues.

## How to Use

1. Navigate to `/admin/test-dashboard` in your application
2. Click "Test All Endpoints" to test all APIs at once
3. Or click individual "Test" buttons to test specific endpoints

## Available Endpoints

- **Locations**: `/api/locations` - Location management operations
- **Users**: `/api/users` - User management operations
- **Crypto Wallets**: `/api/crypto-wallets` - Crypto wallet operations
- **Payments**: `/api/payments?status=approved` - Payment processing operations
- **Direct API Test**: `/api/test-direct-api` - Direct API connection test
- **Database Query Test**: `/api/database?collection=flights&limit=5` - Generic database query API

## Checking for Region Access Issues

If you're still experiencing "Project is not accessible in this region" errors:

1. Visit `/test-region-access` for advanced diagnostics
2. Check that your API key has the correct permissions
3. Verify that your Appwrite project allows access from all regions
4. Check the API response details for specific error messages

## How to Convert Other API Routes

To convert other API routes to use the Direct API approach:

1. Import the `AppwriteServerAPI` from `@/lib/appwriteDirectAPI`
2. Replace Appwrite SDK operations with Direct API equivalents
3. Handle the different response format (look for `response.success` and `response.data`)
4. See `APPWRITE_DIRECT_API.md` for more details
