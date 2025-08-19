import mysql from "mysql2/promise";

export async function getConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "united_airline",
    password: process.env.MYSQL_PASSWORD || "Samson@enzo1995",
    database: process.env.MYSQL_DATABASE || "united_airline",
  });
}
