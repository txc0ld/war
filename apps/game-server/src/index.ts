// apps/game-server/src/index.ts
import type { ServerWebSocket } from 'bun';
import { verifyRoomToken } from './auth.js';
import { parseClientMessage, serializeServerMessage } from './protocol.js';
import { Room } from './room.js';

interface WsData {
  roomId: string | null;
  playerIndex: 0 | 1 | null;
  authenticated: boolean;
  authInFlight: boolean;
}

const rooms = new Map<string, Room>();
const PORT = Number(process.env['PORT'] ?? 3002);

const server = Bun.serve<WsData>({
  port: PORT,

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({ status: 'ok', rooms: rooms.size, timestamp: new Date().toISOString() }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const upgraded = server.upgrade(req, {
      data: { roomId: null, playerIndex: null, authenticated: false, authInFlight: false },
    });

    if (upgraded) return undefined;
    return new Response('Expected WebSocket connection', { status: 426 });
  },

  websocket: {
    open(_ws) {
      // Wait for auth message
    },

    async message(ws: ServerWebSocket<WsData>, message) {
      const raw = typeof message === 'string' ? message : new TextDecoder().decode(message);

      // Drop messages that arrive while auth is still in flight. Bun's
      // async message handler does not serialise per-connection, so a
      // client's first input/ping can race the auth DB lookup and end up
      // being parsed as the "first" message.
      if (ws.data.authInFlight) {
        return;
      }

      if (!ws.data.authenticated) {
        ws.data.authInFlight = true;
        try {
          await handleAuth(ws, raw);
        } finally {
          ws.data.authInFlight = false;
        }
        return;
      }

      const roomId = ws.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      room.handleMessage(ws.data.playerIndex!, raw);
    },

    close(ws: ServerWebSocket<WsData>) {
      if (!ws.data.roomId || ws.data.playerIndex === null) return;
      const room = rooms.get(ws.data.roomId);
      if (room) room.handleDisconnect(ws.data.playerIndex);
    },
  },
});

async function handleAuth(ws: ServerWebSocket<WsData>, raw: string): Promise<void> {
  const msg = parseClientMessage(raw);

  if (msg?.type !== 'auth') {
    ws.send(serializeServerMessage({ type: 'auth_error', reason: 'Expected auth message as first message' }));
    ws.close();
    return;
  }

  const verified = await verifyRoomToken(msg.roomId, msg.roomToken);

  if (!verified) {
    ws.send(serializeServerMessage({ type: 'auth_error', reason: 'Invalid room ID or token' }));
    ws.close();
    return;
  }

  const { battle, playerIndex } = verified;

  ws.data.roomId = msg.roomId;
  ws.data.playerIndex = playerIndex;
  ws.data.authenticated = true;

  let room = rooms.get(msg.roomId);
  if (!room) {
    room = new Room(battle, () => { rooms.delete(msg.roomId); });
    rooms.set(msg.roomId, room);
  }

  ws.send(serializeServerMessage({
    type: 'auth_ok',
    playerIndex,
    battleId: battle.id,
    opponentAddress: playerIndex === 0 ? battle.rightAddress : battle.leftAddress,
    opponentTokenId: playerIndex === 0 ? battle.rightToken : battle.leftToken,
  }));

  const connection = {
    send: (data: string) => { try { ws.send(data); } catch { /* closing */ } },
    close: () => { try { ws.close(); } catch { /* already closed */ } },
  };

  room.addConnection(connection, playerIndex);
}

console.log(`Deadshot game server running on port ${PORT}`);
console.log(`Health check: http://localhost:${PORT}/health`);

export { server };
