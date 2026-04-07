import { useCallback, useEffect, useRef, useState } from 'react';
import type { SniperMetadata } from '@warpath/shared';
import { DeadshotGame } from '@/game/DeadshotGame';
import type { GameErrorEvent, MatchResultEvent } from '@/game/DeadshotGame';
import { useStore } from '@/store';

type ConnectionState = 'loading' | 'connecting' | 'connected' | 'error';

interface DeadshotCanvasProps {
  /** Solo preview mode — bypass matchmaking and just render the arena. */
  preview?: boolean;
}

const PREVIEW_SNIPER: SniperMetadata = {
  tokenId: 0,
  name: 'Preview',
  image: '',
  skin: '',
  scopeReticle: '',
  killEffect: '',
  tracerColor: '#00f0ff',
  inspectAnimation: '',
};

export function DeadshotCanvas({ preview = false }: DeadshotCanvasProps): React.ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DeadshotGame | null>(null);

  const { s2Match, s2SelectedSniper, setS2Phase, setS2Result } = useStore();

  const [connectionState, setConnectionState] = useState<ConnectionState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Event handlers (stable references via useCallback) ───────────────────

  const handleResult = useCallback(
    (data: MatchResultEvent) => {
      setS2Result({
        winner: data.winner,
        finalScore: data.finalScore,
        playerIndex: 0,
      });
      setS2Phase('result');
    },
    [setS2Result, setS2Phase]
  );

  const handleError = useCallback(
    (data: GameErrorEvent) => {
      setConnectionState('error');
      setErrorMessage(data.reason);
      setTimeout(() => setS2Phase('idle'), 3000);
    },
    [setS2Phase]
  );

  const handleDisconnect = useCallback(() => {
    setConnectionState('error');
    setErrorMessage('Connection lost');
    setTimeout(() => setS2Phase('idle'), 2000);
  }, [setS2Phase]);

  const handleConnected = useCallback(() => {
    setConnectionState('connected');
    setS2Phase('playing');
  }, [setS2Phase]);

  // ── Mount / unmount game ─────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    // In preview mode we mount with stub data and bypass matchmaking entirely.
    // In normal mode we wait for s2Match + s2SelectedSniper to be populated.
    if (!preview && (s2Match === null || s2SelectedSniper === null)) return;

    // Build SniperMetadata for the opponent (stub for preview).
    const opponentSniper: SniperMetadata = preview
      ? PREVIEW_SNIPER
      : {
          tokenId: s2Match!.opponentTokenId,
          name: 'Opponent',
          image: '',
          skin: '',
          scopeReticle: '',
          killEffect: '',
          tracerColor: '',
          inspectAnimation: '',
        };

    const game = new DeadshotGame();
    gameRef.current = game;

    // Register handlers before init so no events are missed.
    game.on('match_result', handleResult);
    game.on('error', handleError);
    game.on('disconnected', handleDisconnect);
    game.on('connected', handleConnected);

    game.init(canvas, {
      sniper: preview ? PREVIEW_SNIPER : s2SelectedSniper!,
      opponentSniper,
      wsUrl: preview ? '' : s2Match!.gameServerUrl,
      roomId: preview ? 'preview' : s2Match!.roomId,
      roomToken: preview ? 'preview' : s2Match!.roomToken,
      playerIndex: 0,
      previewMode: preview,
    });

    setConnectionState('connecting');

    return () => {
      game.off('match_result', handleResult);
      game.off('error', handleError);
      game.off('disconnected', handleDisconnect);
      game.off('connected', handleConnected);
      game.destroy();
      gameRef.current = null;
    };
  }, [preview, s2Match, s2SelectedSniper, handleResult, handleError, handleDisconnect, handleConnected]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: '#000',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Connection state overlay */}
      {connectionState !== 'connected' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)',
            zIndex: 50,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {connectionState === 'loading' || connectionState === 'connecting' ? (
            <div
              style={{
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#00f0ff',
                opacity: 0.8,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              {connectionState === 'loading' ? 'Initializing...' : 'Connecting to server...'}
            </div>
          ) : null}

          {connectionState === 'error' && errorMessage !== null ? (
            <div
              style={{
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#f87171',
              }}
            >
              {errorMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
