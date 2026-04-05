// apps/game-server/src/resultReporter.ts
import { S2_GAME_SERVER_SECRET_HEADER } from '@warpath/shared';
import type { S2MatchResult } from '@warpath/shared';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';
const SERVER_SECRET = process.env['S2_GAME_SERVER_SECRET'] ?? '';

export async function reportMatchResult(
  battleId: string,
  result: S2MatchResult
): Promise<boolean> {
  if (!SERVER_SECRET) {
    console.error('S2_GAME_SERVER_SECRET not set — cannot report result');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/s2/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [S2_GAME_SERVER_SECRET_HEADER]: SERVER_SECRET,
      },
      body: JSON.stringify({ battleId, result }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Result report failed: ${response.status} ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Result report error:', error);
    return false;
  }
}
