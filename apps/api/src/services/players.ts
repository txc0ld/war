import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { players } from '../db/schema';
import { getGunCountForAddress } from './guns';

export const WALLET_COOLDOWNS_ENABLED = false;
export const SHORT_COOLDOWN_MS = 15 * 60 * 1000;
export const STANDARD_COOLDOWN_MS = 30 * 60 * 1000;

export function getCooldownDurationMs(gunCount: number): number {
  if (!WALLET_COOLDOWNS_ENABLED) {
    return 0;
  }

  return gunCount >= 3 ? SHORT_COOLDOWN_MS : STANDARD_COOLDOWN_MS;
}

export interface WalletCooldownState {
  expiresAt: Date | null;
  remainingMs: number;
  gunCount: number;
}

type PlayerUpdater = Pick<typeof db, 'update'>;

export async function ensurePlayer(address: string): Promise<void> {
  await db.insert(players).values({ address }).onConflictDoNothing();
}

export async function syncPlayerGunCount(address: `0x${string}`): Promise<number> {
  const gunCount = await getGunCountForAddress(address);
  await updatePlayerGunCount(address, gunCount);
  return gunCount;
}

export async function updatePlayerGunCount(
  address: string,
  gunCount: number
): Promise<void> {
  await ensurePlayer(address);
  await db
    .update(players)
    .set({
      gunCount,
      updatedAt: new Date(),
    })
    .where(eq(players.address, address));
}

export async function getWalletCooldownState(
  address: string
): Promise<WalletCooldownState> {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.address, address))
    .limit(1);

  if (!WALLET_COOLDOWNS_ENABLED) {
    return {
      expiresAt: null,
      remainingMs: 0,
      gunCount: player?.gunCount ?? 0,
    };
  }

  const expiresAt = player?.cooldownUntil ?? null;
  const remainingMs = expiresAt
    ? Math.max(0, expiresAt.getTime() - Date.now())
    : 0;

  return {
    expiresAt: remainingMs > 0 ? expiresAt : null,
    remainingMs,
    gunCount: player?.gunCount ?? 0,
  };
}

export async function applyWalletCooldown(
  tx: PlayerUpdater,
  address: string,
  gunCount: number
): Promise<Date> {
  if (!WALLET_COOLDOWNS_ENABLED) {
    const disabledAt = new Date();

    await tx
      .update(players)
      .set({
        gunCount,
        cooldownUntil: null,
        updatedAt: disabledAt,
      })
      .where(eq(players.address, address));

    return disabledAt;
  }

  const expiresAt = new Date(Date.now() + getCooldownDurationMs(gunCount));

  await tx
    .update(players)
    .set({
      gunCount,
      cooldownUntil: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(players.address, address));

  return expiresAt;
}
