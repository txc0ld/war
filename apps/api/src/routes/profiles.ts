import { Hono } from 'hono';
import type { ProfileUpdateRequest } from '@warpath/shared';
import { z } from 'zod';
import { getAddress, isAddress } from 'viem';
import { AppError } from '../lib/errors';
import { verifyProfileUpdateAuth } from '../middleware/auth';
import { validateJson, validateParams } from '../middleware/validate';
import { getProfile, isSafeAvatarUrl, upsertProfile } from '../services/profiles';

const app = new Hono();
const profileParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});
function isAllowedAvatarValue(value: string): boolean {
  return isSafeAvatarUrl(value);
}
const optionalString = z
  .string()
  .trim()
  .max(280)
  .nullable();
const optionalAvatar = z
  .string()
  .trim()
  .max(200_000)
  .refine(
    (value) => isAllowedAvatarValue(value),
    'must be a safe inline avatar image'
  )
  .nullable();
const profileUpdateSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
  displayName: optionalString,
  avatarUrl: optionalAvatar,
  statusMessage: optionalString,
  showBattleResults: z.boolean(),
  showChatPresence: z.boolean(),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});

app.get('/:address', async (c) => {
  const { address } = validateParams(c, profileParamsSchema);
  return c.json(await getProfile(address));
});

app.post('/:address', async (c) => {
  const { address } = validateParams(c, profileParamsSchema);
  const body = (await validateJson(c, profileUpdateSchema)) as ProfileUpdateRequest;
  const normalizedRouteAddress = getAddress(address);

  if (getAddress(body.address) !== normalizedRouteAddress) {
    throw new AppError(
      400,
      'PROFILE_ADDRESS_MISMATCH',
      'Profile payload address does not match the route address'
    );
  }

  let verified;
  try {
    verified = await verifyProfileUpdateAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'PROFILE_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid profile authorization'
    );
  }

  if (verified.address !== normalizedRouteAddress) {
    throw new AppError(
      403,
      'PROFILE_SIGNER_MISMATCH',
      'Profile update signer does not match the target address'
    );
  }

  return c.json(
    await upsertProfile(normalizedRouteAddress, {
      displayName: body.displayName,
      avatarUrl: body.avatarUrl,
      statusMessage: body.statusMessage,
      showBattleResults: body.showBattleResults,
      showChatPresence: body.showChatPresence,
    })
  );
});

export default app;
