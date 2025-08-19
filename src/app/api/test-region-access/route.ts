import { NextRequest, NextResponse } from 'next/server';

// This API route is specifically designed to test Appwrite region access
// with detailed diagnostics and error reporting

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, projectId, endpoint = 'https://cloud.appwrite.io/v1' } = body;
    
    // Validate required inputs
    if (!apiKey || !projectId) {
      return NextResponse.json({
        success: false,
        message: 'API key and Project ID are required',
      }, { status: 400 });
    }
    
    console.log(`Testing Appwrite project access with custom key: ${projectId.substring(0, 4)}...`);
    
    // First test: Project access
    try {
      const projectUrl = `${endpoint}/projects/${projectId}`;
      const projectResponse = await fetch(projectUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Key': apiKey,
          'X-Appwrite-Project': projectId,
          'User-Agent': 'United-Air-Region-Test/1.0',
          // Add Origin header to help with CORS issues
          'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://united-air.vercel.app'
        }
      });
      
      const projectData = await projectResponse.json();
      
      if (!projectResponse.ok) {
        return NextResponse.json({
          success: false,
          message: 'Project access test failed',
          test: 'project_access',
          status: projectResponse.status,
          statusText: projectResponse.statusText,
          error: projectData,
          request: {
            endpoint: projectUrl,
            projectId: projectId.substring(0, 4) + '...',
            hasApiKey: !!apiKey
          }
        }, { status: 500 });
      }
      
      // If we have a database ID, let's test that too
      const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
      
      if (databaseId) {
        try {
          const databaseUrl = `${endpoint}/databases/${databaseId}`;
          const databaseResponse = await fetch(databaseUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Appwrite-Key': apiKey,
              'X-Appwrite-Project': projectId,
              'User-Agent': 'United-Air-Region-Test/1.0'
            }
          });
          
          const databaseData = await databaseResponse.json();
          
          if (!databaseResponse.ok) {
            return NextResponse.json({
              success: false,
              message: 'Project access successful but database access failed',
              test: 'database_access',
              project: {
                name: projectData.name,
                region: projectData.region,
                platformCount: Array.isArray(projectData.platforms) ? projectData.platforms.length : 0
              },
              status: databaseResponse.status,
              statusText: databaseResponse.statusText,
              error: databaseData
            }, { status: 500 });
          }
          
          // Both project and database access succeeded
          return NextResponse.json({
            success: true,
            message: 'Successfully accessed both project and database',
            project: {
              name: projectData.name,
              region: projectData.region,
              platformCount: Array.isArray(projectData.platforms) ? projectData.platforms.length : 0
            },
            database: {
              name: databaseData.name,
              id: databaseData.$id
            }
          });
        } catch (databaseError: any) {
          return NextResponse.json({
            success: false,
            message: 'Project access successful but database request failed',
            test: 'database_access',
            project: {
              name: projectData.name,
              region: projectData.region
            },
            error: databaseError.message
          }, { status: 500 });
        }
      } else {
        // Just return project access result
        return NextResponse.json({
          success: true,
          message: 'Successfully accessed project (no database ID provided)',
          project: {
            name: projectData.name,
            region: projectData.region,
            platformCount: Array.isArray(projectData.platforms) ? projectData.platforms.length : 0
          }
        });
      }
    } catch (projectError: any) {
      return NextResponse.json({
        success: false,
        message: 'Failed to make project request',
        test: 'project_access',
        error: projectError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in region access test API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error.message
    }, { status: 500 });
  }
}
