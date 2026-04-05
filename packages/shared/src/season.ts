const SECOND_MS = 1_000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const SEASON_ONE_START_ISO = '2026-03-24T20:00:00+08:00';
export const SEASON_ONE_DURATION_MS = 7 * DAY_MS;
export const SEASON_ONE_START_MS = Date.parse(SEASON_ONE_START_ISO);
export const SEASON_ONE_END_MS = SEASON_ONE_START_MS + SEASON_ONE_DURATION_MS;

export type SeasonTimerState = 'upcoming' | 'live' | 'ended';

export function getSeasonTimerState(nowMs: number): SeasonTimerState {
  if (nowMs < SEASON_ONE_START_MS) {
    return 'upcoming';
  }

  if (nowMs >= SEASON_ONE_END_MS) {
    return 'ended';
  }

  return 'live';
}

export function isSeasonOneLive(nowMs: number): boolean {
  return getSeasonTimerState(nowMs) === 'live';
}

export type ActiveSeason = 1 | 2;

export function getActiveSeason(nowMs: number): ActiveSeason {
  // Season 1 is over. Season 2 is live.
  // If Season 2 needs its own start/end gating, add it here.
  return nowMs >= SEASON_ONE_END_MS ? 2 : 1;
}
