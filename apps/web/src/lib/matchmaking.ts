import type { BattlePhase } from '@warpath/shared';
import { POINTS } from '@warpath/shared';

export function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const PHASE_STATUS_MAP: Record<BattlePhase, string> = {
  idle: 'Ready to fight',
  selecting: 'Select your weapon',
  matching: 'Searching for opponent\u2026',
  vs_reveal: 'Opponent found!',
  fighting: 'Battle in progress',
  result_win: 'Victory!',
  result_loss: 'Defeated',
  spectating: 'Spectating battle',
};

export function getMatchmakingStatus(phase: string): string {
  return PHASE_STATUS_MAP[phase as BattlePhase] ?? 'Unknown status';
}

export function calculateScore(wins: number, losses: number, gunCount: number): number {
  const base = wins * POINTS.WIN + losses * POINTS.LOSS;
  const multiplier = gunCount >= 3 ? POINTS.THREE_GUN_MULTIPLIER : 1;
  return Math.round(base * multiplier);
}
