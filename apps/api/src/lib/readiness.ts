import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { publicClient } from './contract';

const EXPOSE_READINESS_DETAILS =
  process.env['EXPOSE_READINESS_DETAILS'] === 'true';

export interface ReadinessCheck {
  ok: boolean;
  latencyMs: number;
  detail?: string;
}

export interface ReadinessStatus {
  status: 'ready' | 'degraded';
  timestamp: string;
  checks: {
    database: ReadinessCheck;
    rpc: ReadinessCheck;
  };
}

async function withTiming<T>(operation: () => Promise<T>): Promise<ReadinessCheck> {
  const startedAt = Date.now();

  try {
    await operation();
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      detail: EXPOSE_READINESS_DETAILS
        ? (error instanceof Error ? error.message : 'unknown error')
        : undefined,
    };
  }
}

export async function getReadinessStatus(): Promise<ReadinessStatus> {
  const [database, rpc] = await Promise.all([
    withTiming(async () => {
      await db.execute(sql`select 1`);
    }),
    withTiming(async () => {
      await publicClient.getBlockNumber();
    }),
  ]);

  return {
    status: database.ok && rpc.ok ? 'ready' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database,
      rpc,
    },
  };
}
