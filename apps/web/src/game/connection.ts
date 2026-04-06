// apps/web/src/game/connection.ts
// WebSocket game client for the Deadshot sniper duel.
//
// Pure functions (buildAuthMessage, buildInputMessage, buildPingMessage,
// parseServerMessage) are exported for unit testing without a real WebSocket.
//
// GameConnection manages the WebSocket lifecycle, auth handshake, and periodic
// ping — but does NOT know about PlayCanvas or React.

import type { ClientInput, ServerMessage } from '@warpath/shared';

// ── Pure message builders ────────────────────────────────────────────────────

/**
 * Build a JSON auth message for the server handshake.
 */
export function buildAuthMessage(roomId: string, roomToken: string): string {
  return JSON.stringify({ type: 'auth', roomId, roomToken });
}

/**
 * Wrap a ClientInput into a server-bound JSON message.
 */
export function buildInputMessage(input: ClientInput): string {
  return JSON.stringify({ type: 'input', input });
}

/**
 * Build a keep-alive ping message.
 */
export function buildPingMessage(): string {
  return JSON.stringify({ type: 'ping' });
}

/**
 * Parse a raw WebSocket text frame into a ServerMessage.
 * Returns null when the frame is not valid JSON or has no `type` field.
 */
export function parseServerMessage(raw: string): ServerMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !('type' in parsed) ||
    typeof (parsed as Record<string, unknown>)['type'] !== 'string'
  ) {
    return null;
  }

  return parsed as ServerMessage;
}

// ── ConnectionHandlers ───────────────────────────────────────────────────────

export interface ConnectionHandlers {
  onAuth: (msg: Extract<ServerMessage, { type: 'auth_ok' }>) => void;
  onAuthError: (msg: Extract<ServerMessage, { type: 'auth_error' }>) => void;
  onWaiting: (msg: Extract<ServerMessage, { type: 'waiting' }>) => void;
  onCountdown: (msg: Extract<ServerMessage, { type: 'countdown' }>) => void;
  onState: (msg: Extract<ServerMessage, { type: 'state' }>) => void;
  onMatchResult: (msg: Extract<ServerMessage, { type: 'match_result' }>) => void;
  onError: (msg: Extract<ServerMessage, { type: 'error' }> | Error) => void;
  onDisconnect: () => void;
}

// ── GameConnection ───────────────────────────────────────────────────────────

const PING_INTERVAL_MS = 5_000;

export class GameConnection {
  readonly #handlers: ConnectionHandlers;
  #ws: WebSocket | null = null;
  #pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(handlers: ConnectionHandlers) {
    this.#handlers = handlers;
  }

  /**
   * Open a WebSocket connection to `wsUrl`, then immediately send an auth
   * message. The connection is ready to accept inputs once `onAuth` fires.
   */
  connect(wsUrl: string, roomId: string, roomToken: string): void {
    if (this.#ws !== null) {
      throw new Error('GameConnection is already connected. Call disconnect() first.');
    }

    const ws = new WebSocket(wsUrl);
    this.#ws = ws;

    ws.onopen = () => {
      ws.send(buildAuthMessage(roomId, roomToken));
      this.#startPing();
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      const msg = parseServerMessage(event.data);
      if (msg === null) return;
      this.#dispatch(msg);
    };

    ws.onclose = () => {
      this.#stopPing();
      this.#ws = null;
      this.#handlers.onDisconnect();
    };

    ws.onerror = () => {
      // The WebSocket error event carries no useful detail; report a generic
      // Error and let the close event handle cleanup.
      this.#handlers.onError(new Error('WebSocket error'));
    };
  }

  /**
   * Send a ClientInput frame if the socket is open.
   */
  sendInput(input: ClientInput): void {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(buildInputMessage(input));
    }
  }

  /**
   * Gracefully close the connection and stop the ping timer.
   */
  disconnect(): void {
    this.#stopPing();

    if (this.#ws !== null) {
      // Null out onclose first so it does not fire our handler on intentional close.
      this.#ws.onclose = null;
      this.#ws.close();
      this.#ws = null;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  #dispatch(msg: ServerMessage): void {
    switch (msg.type) {
      case 'auth_ok':
        this.#handlers.onAuth(msg);
        break;
      case 'auth_error':
        this.#handlers.onAuthError(msg);
        break;
      case 'waiting':
        this.#handlers.onWaiting(msg);
        break;
      case 'countdown':
        this.#handlers.onCountdown(msg);
        break;
      case 'state':
        this.#handlers.onState(msg);
        break;
      case 'match_result':
        this.#handlers.onMatchResult(msg);
        break;
      case 'error':
        this.#handlers.onError(msg);
        break;
      case 'pong':
        // Pong is handled silently — it just confirms the connection is alive.
        break;
      default: {
        // Exhaustiveness guard — TypeScript will error if a new ServerMessage
        // variant is added without a corresponding case above.
        const _exhaustive: never = msg;
        void _exhaustive;
        break;
      }
    }
  }

  #startPing(): void {
    this.#pingTimer = setInterval(() => {
      if (this.#ws?.readyState === WebSocket.OPEN) {
        this.#ws.send(buildPingMessage());
      }
    }, PING_INTERVAL_MS);
  }

  #stopPing(): void {
    if (this.#pingTimer !== null) {
      clearInterval(this.#pingTimer);
      this.#pingTimer = null;
    }
  }
}
