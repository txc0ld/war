import type { ClientMessage, ServerMessage } from '@warpath/shared';

export function parseClientMessage(raw: string): ClientMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  switch (obj['type']) {
    case 'auth': {
      if (typeof obj['roomId'] === 'string' && typeof obj['roomToken'] === 'string') {
        return { type: 'auth', roomId: obj['roomId'], roomToken: obj['roomToken'] };
      }
      return null;
    }
    case 'input': {
      const input = obj['input'];
      if (typeof input === 'object' && input !== null) {
        const inp = input as Record<string, unknown>;
        if (
          typeof inp['aimYaw'] === 'number' &&
          typeof inp['aimPitch'] === 'number' &&
          typeof inp['fire'] === 'boolean' &&
          typeof inp['scope'] === 'boolean' &&
          (inp['scopeZoom'] === 1 || inp['scopeZoom'] === 2) &&
          typeof inp['crouch'] === 'boolean' &&
          typeof inp['reload'] === 'boolean' &&
          typeof inp['timestamp'] === 'number'
        ) {
          return {
            type: 'input',
            input: {
              aimYaw: inp['aimYaw'],
              aimPitch: inp['aimPitch'],
              fire: inp['fire'],
              scope: inp['scope'],
              scopeZoom: inp['scopeZoom'],
              crouch: inp['crouch'],
              reload: inp['reload'],
              // WASD intent — default to false for back-compat with older clients
              moveForward: inp['moveForward'] === true,
              moveBackward: inp['moveBackward'] === true,
              moveLeft: inp['moveLeft'] === true,
              moveRight: inp['moveRight'] === true,
              timestamp: inp['timestamp'],
            },
          };
        }
      }
      return null;
    }
    case 'ping':
      return { type: 'ping' };
    default:
      return null;
  }
}

export function serializeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
