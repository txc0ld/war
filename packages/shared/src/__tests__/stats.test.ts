import { describe, expect, it } from 'vitest';
import {
  buildBattleCommitPreimage,
  createBattleCommitmentHash,
  createBattleSeed,
  getBattleWinChance,
  getStatsForToken,
  resolveBattle,
  verifyBattleProof,
} from '../stats.js';
import { BATTLE_ENGINE_VERSION, DRAND_QUICKNET } from '../constants.js';

describe('stats', () => {
  it('returns deterministic stats for the same token', () => {
    const first = getStatsForToken(42);
    const second = getStatsForToken(42);

    expect(first).toEqual(second);
    expect(first.damage).toBeGreaterThanOrEqual(1);
    expect(first.damage).toBeLessThanOrEqual(100);
    expect(first.dodge).toBeGreaterThanOrEqual(1);
    expect(first.dodge).toBeLessThanOrEqual(100);
    expect(first.speed).toBeGreaterThanOrEqual(1);
    expect(first.speed).toBeLessThanOrEqual(100);
  });

  it('resolves the same seed and bonus inputs identically', () => {
    const left = getStatsForToken(7);
    const right = getStatsForToken(19);

    const first = resolveBattle(left, right, 'same-seed', {
      leftArsenalBonus: true,
      rightArsenalBonus: false,
    });
    const second = resolveBattle(left, right, 'same-seed', {
      leftArsenalBonus: true,
      rightArsenalBonus: false,
    });

    expect(first).toEqual(second);
  });

  it('does not use stat values to change the winner when seed and bonuses are identical', () => {
    const weakStats = { damage: 1, dodge: 1, speed: 1 };
    const strongStats = { damage: 100, dodge: 100, speed: 100 };

    const weakVsStrong = resolveBattle(weakStats, strongStats, 'rng-only-seed');
    const swappedStrength = resolveBattle(strongStats, weakStats, 'rng-only-seed');

    expect(weakVsStrong.winner).toBe(swappedStrength.winner);
    expect(weakVsStrong.leftHpRemaining).toBe(swappedStrength.leftHpRemaining);
    expect(weakVsStrong.rightHpRemaining).toBe(swappedStrength.rightHpRemaining);
    expect(
      weakVsStrong.rounds.map((round) => ({
        event: round.event,
        leftHp: round.leftHp,
        rightHp: round.rightHp,
      }))
    ).toEqual(
      swappedStrength.rounds.map((round) => ({
        event: round.event,
        leftHp: round.leftHp,
        rightHp: round.rightHp,
      }))
    );
  });

  it('gives the 3+ gun holder a 5 point win-chance edge', () => {
    expect(getBattleWinChance()).toBe(0.5);
    expect(
      getBattleWinChance({
        leftArsenalBonus: true,
        rightArsenalBonus: false,
      })
    ).toBe(0.55);
    expect(
      getBattleWinChance({
        leftArsenalBonus: false,
        rightArsenalBonus: true,
      })
    ).toBe(0.45);
    expect(
      getBattleWinChance({
        leftArsenalBonus: true,
        rightArsenalBonus: true,
      })
    ).toBe(0.5);
  });

  it('shifts win distribution toward the arsenal-bonus side over many seeds', () => {
    const left = getStatsForToken(11);
    const right = getStatsForToken(12);
    let neutralLeftWins = 0;
    let bonusLeftWins = 0;

    for (let index = 0; index < 1000; index += 1) {
      const seed = `distribution-seed-${index}`;
      if (resolveBattle(left, right, seed).winner === 'left') {
        neutralLeftWins += 1;
      }
      if (
        resolveBattle(left, right, seed, {
          leftArsenalBonus: true,
          rightArsenalBonus: false,
        }).winner === 'left'
      ) {
        bonusLeftWins += 1;
      }
    }

    expect(neutralLeftWins).toBeGreaterThan(430);
    expect(neutralLeftWins).toBeLessThan(570);
    expect(bonusLeftWins).toBeGreaterThan(neutralLeftWins + 20);
    expect(bonusLeftWins).toBeLessThan(640);
  });

  it('recomputes and verifies a drand-backed battle proof', () => {
    const leftStats = getStatsForToken(11);
    const rightStats = getStatsForToken(12);
    const preimage = buildBattleCommitPreimage({
      leftAddress: '0xleft',
      leftTokenId: 11,
      leftStats,
      leftArsenalBonus: true,
      rightAddress: '0xright',
      rightTokenId: 12,
      rightStats,
      rightArsenalBonus: false,
      targetRound: 12345,
    });
    const commitHash = createBattleCommitmentHash(preimage);
    const battleSeed = createBattleSeed(
      commitHash,
      'b7328ef6f6c7cf9d9d2305f4d1f6c8ef8f8b99795f6ecb4f6ecbeee0df63c7ab'
    );
    const result = resolveBattle(leftStats, rightStats, battleSeed, {
      leftArsenalBonus: true,
      rightArsenalBonus: false,
    });

    const verification = verifyBattleProof({
      engineVersion: BATTLE_ENGINE_VERSION,
      commitHash,
      preimage,
      drand: {
        chainHash: DRAND_QUICKNET.chainHash,
        publicKey: DRAND_QUICKNET.publicKey,
        round: 12345,
        randomness:
          'b7328ef6f6c7cf9d9d2305f4d1f6c8ef8f8b99795f6ecb4f6ecbeee0df63c7ab',
        signature: '0xsignature',
        relaysChecked: ['https://api.drand.sh'],
      },
      battleSeed,
      result,
    });

    expect(verification.verified).toBe(true);
    expect(verification.commitHashValid).toBe(true);
    expect(verification.battleSeedValid).toBe(true);
    expect(verification.resultValid).toBe(true);
  });
});
