import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing MySQL database connection...');
    const startTime = Date.now();
    
    // Log environment variables (without passwords)
    console.log('MySQL Environment Variables:', {
      MYSQL_HOST: process.env.MYSQL_HOST || 'Not set',
      MYSQL_USER: process.env.MYSQL_USER || 'Not set',
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'Not set',
      // Not logging password
    });
    
    // Get the database connection
    const db = await getDB();
    
    // Try a simple query
    const [result] = await db.execute('SELECT 1 as test');
    
    // Try to list tables to verify database structure
    const [tables] = await db.execute('SHOW TABLES');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'MySQL connection test successful',
      data: {
        result,
        tables,
        duration: `${duration}ms`
      }
    });
  } catch (error: any) {
    console.error('MySQL connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'MySQL connection test failed',
      error: error.message,
      errorCode: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    }, { status: 500 });
  }
}
