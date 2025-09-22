import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/beiboot',
});

export const db = drizzle(pool);
export { pool };
