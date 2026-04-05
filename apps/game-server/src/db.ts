// apps/game-server/src/db.ts
import pg from 'pg';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  console.warn('DATABASE_URL not set — room auth will fail. Set it for production.');
}

export const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl }) : null;
