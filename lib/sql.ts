import mysql from "mysql2/promise";
import fs from "fs";

export const sqlPool = mysql.createPool({
  host: process.env.DATABASE_HOST || "mysql-24feda1b-cascade2412-40f9.c.aivencloud.com",
port: parseInt(process.env.DATABASE_PORT || "15560"),
  user: process.env.DATABASE_USER || "avnadmin",
  password: process.env.DATABASE_PASSWORD || "AVNS_YtM2KIdyL13UR7yv2dv",
  database: process.env.DATABASE_NAME || "hostelhive",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
 ssl: {
    rejectUnauthorized: false 
  }
});

export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<T> {
  try {
    const [rows] = await sqlPool.query(query, params);
    return rows as T;
  } catch (error) {
    console.error("SQL Execution Error:", error);
    throw error;
  }
}
export async function callProcedure(
  procedureName: string,
  params: any[]
): Promise<any> {
  const placeholders = params.map(() => "?").join(", ");
  const query = `CALL ${procedureName}(${placeholders})`;
  return executeQuery(query, params);
}

export default sqlPool;
