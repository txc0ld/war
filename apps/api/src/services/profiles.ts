import { eq, inArray } from 'drizzle-orm';
import { getAddress } from 'viem';
import type { Profile } from '@warpath/shared';
import { db } from '../db/client';
import { profiles } from '../db/schema';
import { getEnsNamesByAddress } from './ens';

const SAFE_INLINE_AVATAR_PATTERN =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/;

interface ProfileInput {
  displayName: string | null;
  avatarUrl: string | null;
  statusMessage: string | null;
  showBattleResults: boolean;
  showChatPresence: boolean;
}

function normalizeProfileField(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function isSafeAvatarUrl(value: string): boolean {
  return SAFE_INLINE_AVATAR_PATTERN.test(value.trim());
}

function normalizeAvatarUrl(value: string | null): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return isSafeAvatarUrl(trimmed) ? trimmed : null;
}

function mapProfileRow(
  address: string,
  row: typeof profiles.$inferSelect | undefined,
  ensName: string | null
): Profile {
  const normalizedAddress = getAddress(address);

  return {
    address: normalizedAddress,
    displayName: row?.displayName ?? null,
    ensName,
    avatarUrl: normalizeAvatarUrl(row?.avatarUrl ?? null),
    statusMessage: row?.statusMessage ?? null,
    showBattleResults: row?.showBattleResults ?? true,
    showChatPresence: row?.showChatPresence ?? true,
    createdAt: row?.createdAt?.toISOString() ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

export async function getProfile(address: string): Promise<Profile> {
  const normalizedAddress = getAddress(address);
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.address, normalizedAddress))
    .limit(1);

  const ensNameMap =
    profile?.displayName?.trim()
      ? new Map<string, string | null>([[normalizedAddress, null]])
      : await getEnsNamesByAddress([normalizedAddress]);

  return mapProfileRow(
    normalizedAddress,
    profile,
    ensNameMap.get(normalizedAddress) ?? null
  );
}

export async function getProfilesByAddress(
  addresses: string[]
): Promise<Map<string, Profile>> {
  const normalizedAddresses = Array.from(
    new Set(addresses.map((address) => getAddress(address)))
  );

  if (normalizedAddresses.length === 0) {
    return new Map();
  }

  const rows = await db
    .select()
    .from(profiles)
    .where(inArray(profiles.address, normalizedAddresses));

  const rowMap = new Map(rows.map((row) => [row.address, row]));
  const addressesNeedingEns = normalizedAddresses.filter((address) => {
    const displayName = rowMap.get(address)?.displayName?.trim();
    return !displayName;
  });
  const ensNameMap = await getEnsNamesByAddress(addressesNeedingEns);

  return new Map(
    normalizedAddresses.map((address) => [
      address,
      mapProfileRow(address, rowMap.get(address), ensNameMap.get(address) ?? null),
    ])
  );
}

export async function getBattleResultsVisibilityByAddress(
  addresses: string[]
): Promise<Map<string, boolean>> {
  const normalizedAddresses = Array.from(
    new Set(addresses.map((address) => getAddress(address)))
  );

  if (normalizedAddresses.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      address: profiles.address,
      showBattleResults: profiles.showBattleResults,
    })
    .from(profiles)
    .where(inArray(profiles.address, normalizedAddresses));

  const visibility = new Map<string, boolean>(
    normalizedAddresses.map((address) => [address, true])
  );

  for (const row of rows) {
    visibility.set(row.address, row.showBattleResults);
  }

  return visibility;
}

export async function upsertProfile(
  address: string,
  input: ProfileInput
): Promise<Profile> {
  const normalizedAddress = getAddress(address);
  const now = new Date();

  await db
    .insert(profiles)
    .values({
      address: normalizedAddress,
      displayName: normalizeProfileField(input.displayName),
      avatarUrl: normalizeAvatarUrl(input.avatarUrl),
      statusMessage: normalizeProfileField(input.statusMessage),
      showBattleResults: input.showBattleResults,
      showChatPresence: input.showChatPresence,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.address,
      set: {
        displayName: normalizeProfileField(input.displayName),
        avatarUrl: normalizeAvatarUrl(input.avatarUrl),
        statusMessage: normalizeProfileField(input.statusMessage),
        showBattleResults: input.showBattleResults,
        showChatPresence: input.showChatPresence,
        updatedAt: now,
      },
    });

  return getProfile(normalizedAddress);
}
