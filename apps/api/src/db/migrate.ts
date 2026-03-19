import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './client';

async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: './drizzle' });
}

runMigrations().catch((err: unknown) => {
  if (err instanceof Error) {
    process.stderr.write(`Migration failed: ${err.message}\n`);
  }
  process.exit(1);
});
