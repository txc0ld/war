import { useCallback, useEffect, useRef } from 'react';
import type { SniperMetadata } from '@warpath/shared';
import { DeadshotGame } from '@/game/DeadshotGame';
import type { GameErrorEvent, MatchResultEvent } from '@/game/DeadshotGame';
import { useStore } from '@/store';

export function DeadshotCanvas(): React.ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<DeadshotGame | null>(null);

  const { s2Match, s2SelectedSniper, setS2Phase, setS2Result } = useStore();

  // ── Event handlers (stable references via useCallback) ───────────────────

  const handleResult = useCallback(
    (data: MatchResultEvent) => {
      setS2Result({
        winner: data.winner,
        finalScore: data.finalScore,
        // We always initialise as playerIndex 0 in the config below;
        // the server corrects this via auth_ok before rounds start.
        playerIndex: 0,
      });
      setS2Phase('result');
    },
    [setS2Result, setS2Phase]
  );

  const handleError = useCallback(
    (_data: GameErrorEvent) => {
      setS2Phase('idle');
    },
    [setS2Phase]
  );

  const handleDisconnect = useCallback(() => {
    setS2Phase('idle');
  }, [setS2Phase]);

  const handleConnected = useCallback(() => {
    setS2Phase('playing');
  }, [setS2Phase]);

  // ── Mount / unmount game ─────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || s2Match === null || s2SelectedSniper === null) return;

    // Build a minimal SniperMetadata stub for the opponent.
    const opponentSniper: SniperMetadata = {
      tokenId: s2Match.opponentTokenId,
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
      sniper: s2SelectedSniper,
      opponentSniper,
      wsUrl: s2Match.gameServerUrl,
      roomId: s2Match.roomId,
      roomToken: s2Match.roomToken,
      // playerIndex 0 is the default; the server sends the authoritative index
      // via the auth_ok message before the first round begins.
      playerIndex: 0,
    });

    return () => {
      game.off('match_result', handleResult);
      game.off('error', handleError);
      game.off('disconnected', handleDisconnect);
      game.off('connected', handleConnected);
      game.destroy();
      gameRef.current = null;
    };
  }, [s2Match, s2SelectedSniper, handleResult, handleError, handleDisconnect, handleConnected]);

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
    </div>
  );
}
