// apps/game-server/src/auth.ts
import { pool } from './db.js';

export interface BattleInfo {
  id: string;
  leftAddress: string;
  leftToken: number;
  rightAddress: string;
  rightToken: number;
  roomId: string;
  roomTokenLeft: string;
  roomTokenRight: string;
  status: string;
}

export async function verifyRoomToken(
  roomId: string,
  roomToken: string
): Promise<{ battle: BattleInfo; playerIndex: 0 | 1 } | null> {
  if (!pool) return null;

  const result = await pool.query<{
    id: string;
    left_address: string;
    left_token: number;
    right_address: string;
    right_token: number;
    room_id: string;
    room_token_left: string;
    room_token_right: string;
    status: string;
  }>(
    `SELECT id, left_address, left_token, right_address, right_token,
            room_id, room_token_left, room_token_right, status
     FROM s2_battles
     WHERE room_id = $1
       AND status IN ('pending', 'active')
     LIMIT 1`,
    [roomId]
  );

  const row = result.rows[0];
  if (!row) return null;

  let playerIndex: 0 | 1;
  if (row.room_token_left === roomToken) {
    playerIndex = 0;
  } else if (row.room_token_right === roomToken) {
    playerIndex = 1;
  } else {
    return null;
  }

  const battle: BattleInfo = {
    id: row.id,
    leftAddress: row.left_address,
    leftToken: row.left_token,
    rightAddress: row.right_address,
    rightToken: row.right_token,
    roomId: row.room_id,
    roomTokenLeft: row.room_token_left,
    roomTokenRight: row.room_token_right,
    status: row.status,
  };

  return { battle, playerIndex };
}

export async function markBattleActive(battleId: string): Promise<void> {
  if (!pool) return;
  await pool.query(
    `UPDATE s2_battles SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
    [battleId]
  );
}
