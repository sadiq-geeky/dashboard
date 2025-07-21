import mysql from "mysql2/promise";

// Database configuration matching your parameters
const dbConfig = {
  host: process.env.DB_HOST || "crm-setech.cloud",
  user: process.env.DB_USER || "setcrminternet",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "bafl_recorder",
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully to", dbConfig.database);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    console.error("   Host:", dbConfig.host);
    console.error("   Port:", dbConfig.port);
    console.error("   Database:", dbConfig.database);
    console.error("   User:", dbConfig.user);
    return false;
  }
}

// Helper function to execute queries
export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Initialize database connection on startup
export async function initializeDatabase() {
  console.log("🔄 Initializing database connection...");
  const connected = await testConnection();

  if (!connected) {
    console.error(
      "🚨 Failed to connect to database. Please check your database configuration.",
    );
    console.error(
      "💡 Make sure your .env file has the correct database credentials:",
    );
    console.error("   DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT");
    process.exit(1);
  }

  console.log("🚀 Database initialized successfully");
}
