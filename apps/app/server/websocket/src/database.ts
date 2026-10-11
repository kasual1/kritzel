import { Pool } from "pg";

const dbUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@postgres:5432/kritzel";

export const pool = new Pool({ connectionString: dbUrl });

export async function initializeDatabase(
  maxAttempts = 5,
  delayMs = 1000,
): Promise<Pool> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      console.log("Database connection ready");
      return pool;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `Database initialization attempt ${attempt}/${maxAttempts} failed: ${message}`,
      );

      if (attempt === maxAttempts) {
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Database initialization failed");
}
