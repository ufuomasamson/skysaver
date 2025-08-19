// Simple MySQL connection utility for API routes
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getDB() {
  if (!pool) {
    // Use environment variables with fallbacks from vercel.json
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'flightsdbuser',
      password: process.env.MYSQL_PASSWORD || 'password123',
      database: process.env.MYSQL_DATABASE || 'flights_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('MySQL pool created with credentials:', {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'flightsdbuser',
      database: process.env.MYSQL_DATABASE || 'flights_db',
      // Not logging password for security reasons
    });
  }
  return pool;
}
