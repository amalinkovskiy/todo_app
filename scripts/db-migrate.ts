#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'db', 'migrations');
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

function getSslConfig(): false | { rejectUnauthorized: boolean } {
  return process.env.DISABLE_DB_SSL === 'true' ? false : { rejectUnauthorized: false };
}

async function main(): Promise<void> {
  if (!connectionString) {
    throw new Error('Database URL is required. Set POSTGRES_URL or DATABASE_URL before running migrations.');
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No SQL migration files found.');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: getSslConfig(),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
      const sql = fs.readFileSync(migrationPath, 'utf-8');
      console.log(`Applying migration: ${migrationFile}`);
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log(`Applied ${migrationFiles.length} migration(s) successfully.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Database migration failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
