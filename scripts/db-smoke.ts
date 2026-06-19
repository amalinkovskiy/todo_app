#!/usr/bin/env node

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

function getSslConfig(): false | { rejectUnauthorized: boolean } {
  return process.env.DISABLE_DB_SSL === 'true' ? false : { rejectUnauthorized: false };
}

async function main(): Promise<void> {
  if (!connectionString) {
    throw new Error('Database URL is required. Set POSTGRES_URL or DATABASE_URL before running DB smoke checks.');
  }

  const pool = new Pool({
    connectionString,
    ssl: getSslConfig(),
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  const client = await pool.connect();
  const uuid = uuidv4();
  const text = `db-smoke-${Date.now()}`;

  try {
    await client.query('SELECT 1');

    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'todos'
      ) AS exists
    `);

    if (!tableCheck.rows[0]?.exists) {
      throw new Error('Expected table "todos" to exist. Run npm run db:migrate first.');
    }

    await client.query(
      'INSERT INTO todos (uuid, text, completed) VALUES ($1, $2, false)',
      [uuid, text]
    );

    const readResult = await client.query(
      'SELECT uuid, text, completed FROM todos WHERE uuid = $1',
      [uuid]
    );

    if (readResult.rowCount !== 1 || readResult.rows[0].text !== text) {
      throw new Error('Failed to read inserted smoke TODO from database.');
    }

    await client.query('UPDATE todos SET completed = true WHERE uuid = $1', [uuid]);

    const updateResult = await client.query(
      'SELECT completed FROM todos WHERE uuid = $1',
      [uuid]
    );

    if (updateResult.rows[0]?.completed !== true) {
      throw new Error('Failed to update smoke TODO in database.');
    }

    await client.query('DELETE FROM todos WHERE uuid = $1', [uuid]);

    console.log('Database smoke check passed.');
  } finally {
    await client.query('DELETE FROM todos WHERE uuid = $1', [uuid]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Database smoke check failed:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
