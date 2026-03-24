import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BATTLE_ENGINE_VERSION } from '@warpath/shared';

type PlayerRow = {
  address: string;
  score: number;
  wins: number;
  losses: number;
  gunCount: number;
  cooldownUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type QueueRow = {
  id: string;
  address: string;
  tokenId: number;
  country: string;
  statusToken: string;
  status: 'waiting' | 'matched' | 'expired' | 'cancelled';
  battleId: string | null;
  expiresAt: Date;
  matchedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BattleRow = {
  id: string;
  leftQueueId: string;
  rightQueueId: string;
  leftAddress: string;
  leftToken: number;
  rightAddress: string;
  rightToken: number;
  status: 'committed' | 'resolving' | 'resolved' | 'failed';
  winner: 'left' | 'right' | null;
  leftHp: number | null;
  rightHp: number | null;
  roundsJson: unknown[] | null;
  commitHash: `0x${string}` | null;
  commitPreimageJson: Record<string, unknown> | null;
  drandRound: number | null;
  drandRandomness: string | null;
  drandSignature: string | null;
  battleSeed: `0x${string}` | null;
  engineVersion: string;
  resolutionError: string | null;
  committedAt: Date;
  resolvedAt: Date | null;
  updatedAt: Date;
};

type TableRow = Record<string, unknown>;
type TableName = 'players' | 'queue' | 'battles';
type TableShape = { __table: TableName };
type Predicate = (row: Record<string, unknown>) => boolean;
type TestDb = {
  select: (projection?: Record<string, string>) => SelectBuilder;
  insert: <T extends TableShape>(table: T) => InsertBuilder<T>;
  update: <T extends TableShape>(table: T) => UpdateBuilder<T>;
  transaction: <T>(callback: (tx: TestDb) => Promise<T>) => Promise<T>;
};

const state = {
  players: [] as PlayerRow[],
  queue: [] as QueueRow[],
  battles: [] as BattleRow[],
};
const updateLog: Array<{
  table: TableName;
  set: Record<string, unknown>;
  updatedRows: TableRow[];
}> = [];

const schema = {
  players: {
    __table: 'players',
    address: 'address',
    score: 'score',
    wins: 'wins',
    losses: 'losses',
    gunCount: 'gunCount',
    cooldownUntil: 'cooldownUntil',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  queue: {
    __table: 'queue',
    id: 'id',
    address: 'address',
    tokenId: 'tokenId',
    country: 'country',
    statusToken: 'statusToken',
    status: 'status',
    battleId: 'battleId',
    expiresAt: 'expiresAt',
    matchedAt: 'matchedAt',
    cancelledAt: 'cancelledAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  battles: {
    __table: 'battles',
    id: 'id',
    leftQueueId: 'leftQueueId',
    rightQueueId: 'rightQueueId',
    leftAddress: 'leftAddress',
    leftToken: 'leftToken',
    rightAddress: 'rightAddress',
    rightToken: 'rightToken',
    status: 'status',
    winner: 'winner',
    leftHp: 'leftHp',
    rightHp: 'rightHp',
    roundsJson: 'roundsJson',
    commitHash: 'commitHash',
    commitPreimageJson: 'commitPreimageJson',
    drandRound: 'drandRound',
    drandRandomness: 'drandRandomness',
    drandSignature: 'drandSignature',
    battleSeed: 'battleSeed',
    engineVersion: 'engineVersion',
    resolutionError: 'resolutionError',
    committedAt: 'committedAt',
    resolvedAt: 'resolvedAt',
    updatedAt: 'updatedAt',
  },
} as const;

const globalLocks = new Set<string>();
let queueSequence = 1;
let battleSequence = 1;

function tableRows(table: TableShape): TableRow[] {
  return state[table.__table] as TableRow[];
}

function eq(column: string, value: unknown): Predicate {
  return (row) => row[column] === value;
}

function ne(column: string, value: unknown): Predicate {
  return (row) => row[column] !== value;
}

function lt(column: string, value: Date): Predicate {
  return (row) => {
    const entry = row[column];
    return entry instanceof Date && entry.getTime() < value.getTime();
  };
}

function isNull(column: string): Predicate {
  return (row) => row[column] === null;
}

function and(...conditions: Array<Predicate | undefined>): Predicate {
  return (row) => conditions.every((condition) => (condition ? condition(row) : true));
}

function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const combined = strings.join('__value__').trim();

  if (combined === '__value__ > now()' && typeof values[0] === 'string') {
    const column = values[0];
    return ((row: Record<string, unknown>) => {
      const entry = row[column];
      return entry instanceof Date && entry.getTime() > Date.now();
    }) satisfies Predicate;
  }

  return {
    __sql: true,
    strings: Array.from(strings),
    values,
  };
}

function projectRow(
  row: Record<string, unknown>,
  projection?: Record<string, string>
): Record<string, unknown> {
  if (!projection) {
    return { ...row };
  }

  return Object.fromEntries(
    Object.entries(projection).map(([key, column]) => [key, row[column]])
  );
}

function applySqlUpdate(row: Record<string, unknown>, key: string, value: unknown) {
  if (
    typeof value === 'object' &&
    value !== null &&
    '__sql' in value &&
    Array.isArray((value as { values?: unknown[] }).values)
  ) {
    const sqlValue = value as unknown as { values: unknown[] };
    const increment = sqlValue.values.find((entry) => typeof entry === 'number');
    return Number(row[key] ?? 0) + Number(increment ?? 0);
  }

  return value;
}

function isSqlExpression(value: unknown): value is { __sql: true; values: unknown[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__sql' in value &&
    Array.isArray((value as { values?: unknown[] }).values)
  );
}

class SelectBuilder {
  private tableName: TableName | null = null;
  private predicate: Predicate = () => true;
  private limitValue: number | null = null;
  private orderColumn: string | null = null;
  private lockRows = false;
  private skipLocked = false;

  constructor(
    private readonly projection?: Record<string, string>,
    private readonly txLocks = new Set<string>()
  ) {}

  from(table: TableShape) {
    this.tableName = table.__table;
    return this;
  }

  where(predicate: Predicate) {
    this.predicate = predicate;
    return this;
  }

  orderBy(column: string) {
    this.orderColumn = column;
    return this;
  }

  for(_mode: string, options?: { skipLocked?: boolean }) {
    this.lockRows = true;
    this.skipLocked = options?.skipLocked ?? false;
    return this;
  }

  async limit(count: number) {
    this.limitValue = count;

    if (!this.tableName) {
      return [];
    }

    let rows = [...(state[this.tableName] as TableRow[])].filter((row) =>
      this.predicate(row)
    );

    if (this.lockRows && this.skipLocked) {
      rows = rows.filter((row) => !globalLocks.has(String(row['id'])));
    }

    if (this.orderColumn) {
      rows.sort((left, right) => {
        const leftValue = left[this.orderColumn!];
        const rightValue = right[this.orderColumn!];

        if (leftValue instanceof Date && rightValue instanceof Date) {
          return leftValue.getTime() - rightValue.getTime();
        }

        return 0;
      });
    }

    const selected = rows.slice(0, this.limitValue ?? rows.length);

    if (this.lockRows) {
      for (const row of selected) {
        const rowId = String(row['id']);
        globalLocks.add(rowId);
        this.txLocks.add(rowId);
      }
    }

    await Promise.resolve();
    return selected.map((row) => projectRow(row, this.projection));
  }
}

class InsertValuesBuilder<T extends TableShape> {
  constructor(
    private readonly table: T,
    private readonly valuesToInsert: Record<string, unknown>
  ) {}

  async onConflictDoNothing() {
    const rows = tableRows(this.table);

    if (this.table.__table === 'players') {
      const address = String(this.valuesToInsert.address);
      if (!rows.some((row) => row['address'] === address)) {
        rows.push({
          address,
          score: 0,
          wins: 0,
          losses: 0,
          gunCount: 0,
          cooldownUntil: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  async returning(returning: Record<string, string>) {
    const rows = tableRows(this.table);

    if (this.table.__table === 'queue') {
      const row: QueueRow = {
        id: `queue-${queueSequence++}`,
        address: String(this.valuesToInsert.address),
        tokenId: Number(this.valuesToInsert.tokenId),
        country: String(this.valuesToInsert.country),
        statusToken: String(this.valuesToInsert.statusToken ?? `status-${queueSequence}`),
        status:
          (this.valuesToInsert.status as QueueRow['status'] | undefined) ?? 'waiting',
        battleId: (this.valuesToInsert.battleId as string | null | undefined) ?? null,
        expiresAt: (this.valuesToInsert.expiresAt as Date) ?? new Date(),
        matchedAt: (this.valuesToInsert.matchedAt as Date | null | undefined) ?? null,
        cancelledAt:
          (this.valuesToInsert.cancelledAt as Date | null | undefined) ?? null,
        createdAt: (this.valuesToInsert.createdAt as Date | undefined) ?? new Date(),
        updatedAt: (this.valuesToInsert.updatedAt as Date | undefined) ?? new Date(),
      };
      rows.push(row);
      return [projectRow(row, returning)];
    }

    if (this.table.__table === 'battles') {
      const row: BattleRow = {
        id: `battle-${battleSequence++}`,
        leftQueueId: String(this.valuesToInsert.leftQueueId),
        rightQueueId: String(this.valuesToInsert.rightQueueId),
        leftAddress: String(this.valuesToInsert.leftAddress),
        leftToken: Number(this.valuesToInsert.leftToken),
        rightAddress: String(this.valuesToInsert.rightAddress),
        rightToken: Number(this.valuesToInsert.rightToken),
        status:
          (this.valuesToInsert.status as BattleRow['status'] | undefined) ??
          'committed',
        winner:
          (this.valuesToInsert.winner as BattleRow['winner'] | undefined) ?? null,
        leftHp:
          (this.valuesToInsert.leftHp as number | null | undefined) ?? null,
        rightHp:
          (this.valuesToInsert.rightHp as number | null | undefined) ?? null,
        roundsJson:
          (this.valuesToInsert.roundsJson as unknown[] | null | undefined) ?? null,
        commitHash:
          (this.valuesToInsert.commitHash as `0x${string}` | null | undefined) ??
          null,
        commitPreimageJson:
          (this.valuesToInsert.commitPreimageJson as
            | Record<string, unknown>
            | null
            | undefined) ?? null,
        drandRound:
          (this.valuesToInsert.drandRound as number | null | undefined) ?? null,
        drandRandomness:
          (this.valuesToInsert.drandRandomness as string | null | undefined) ??
          null,
        drandSignature:
          (this.valuesToInsert.drandSignature as string | null | undefined) ??
          null,
        battleSeed:
          (this.valuesToInsert.battleSeed as `0x${string}` | null | undefined) ??
          null,
        engineVersion:
          (this.valuesToInsert.engineVersion as string | undefined) ??
          BATTLE_ENGINE_VERSION,
        resolutionError:
          (this.valuesToInsert.resolutionError as string | null | undefined) ??
          null,
        committedAt:
          (this.valuesToInsert.committedAt as Date | undefined) ?? new Date(),
        resolvedAt:
          (this.valuesToInsert.resolvedAt as Date | null | undefined) ?? null,
        updatedAt:
          (this.valuesToInsert.updatedAt as Date | undefined) ?? new Date(),
      };
      rows.push(row);
      return [projectRow(row, returning)];
    }

    return [];
  }
}

class InsertBuilder<T extends TableShape> {
  constructor(private readonly table: T) {}

  values(valuesToInsert: Record<string, unknown>) {
    return new InsertValuesBuilder(this.table, valuesToInsert);
  }
}

class UpdateWhereBuilder<T extends TableShape> {
  constructor(
    private readonly table: T,
    private readonly valuesToSet: Record<string, unknown>,
    private readonly predicate: Predicate
  ) {}

  private execute() {
    const rows = tableRows(this.table);
    const updated = rows.filter((row) => this.predicate(row));

    for (const row of updated) {
      for (const [key, value] of Object.entries(this.valuesToSet)) {
        row[key] = applySqlUpdate(row, key, value);
      }
    }

    updateLog.push({
      table: this.table.__table,
      set: this.valuesToSet,
      updatedRows: updated.map((row) => ({ ...row })),
    });

    return updated.map((row) => ({ ...row }));
  }

  async returning(returning: Record<string, string>) {
    return this.execute().map((row) => projectRow(row, returning));
  }

  then<TResult1 = Array<Record<string, unknown>>, TResult2 = never>(
    onfulfilled?:
      | ((value: Array<Record<string, unknown>>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

class UpdateBuilder<T extends TableShape> {
  private valuesToSet: Record<string, unknown> = {};

  constructor(private readonly table: T) {}

  set(valuesToSet: Record<string, unknown>) {
    this.valuesToSet = valuesToSet;
    return this;
  }

  where(predicate: Predicate) {
    return new UpdateWhereBuilder(this.table, this.valuesToSet, predicate);
  }
}

function createDb(txLocks = new Set<string>()): TestDb {
  return {
    select: (projection?: Record<string, string>) =>
      new SelectBuilder(projection, txLocks),
    insert: <T extends TableShape>(table: T) => new InsertBuilder(table),
    update: <T extends TableShape>(table: T) => new UpdateBuilder(table),
    async transaction<T>(callback: (tx: ReturnType<typeof createDb>) => Promise<T>) {
      const snapshot = structuredClone(state);
      const localLocks = new Set<string>();

      try {
        return await callback(createDb(localLocks));
      } catch (error) {
        state.players = snapshot.players;
        state.queue = snapshot.queue;
        state.battles = snapshot.battles;
        throw error;
      } finally {
        for (const lockId of localLocks) {
          globalLocks.delete(lockId);
        }
      }
    },
  };
}

const db = createDb();

const mockGetGunCountForAddress = vi.fn();
const mockCreateBattleCommitmentForMatch = vi.fn();
const mockEnsureBattleResolved = vi.fn();

vi.mock('drizzle-orm', () => ({
  and,
  eq,
  isNull,
  lt,
  ne,
  sql,
}));

vi.mock('../db/schema', () => schema);

vi.mock('../db/client', () => ({
  db,
}));

vi.mock('../services/guns', () => ({
  getGunCountForAddress: mockGetGunCountForAddress,
}));

vi.mock('../services/battle', () => ({
  createBattleCommitmentForMatch: mockCreateBattleCommitmentForMatch,
  ensureBattleResolved: mockEnsureBattleResolved,
}));

function resetState() {
  state.players = [];
  state.queue = [];
  state.battles = [];
  globalLocks.clear();
  queueSequence = 1;
  battleSequence = 1;
  updateLog.length = 0;
}

describe('matchmaking service', () => {
  beforeEach(() => {
    resetState();
    mockGetGunCountForAddress.mockReset();
    mockCreateBattleCommitmentForMatch.mockReset();
    mockEnsureBattleResolved.mockReset();
    mockGetGunCountForAddress.mockResolvedValue(2);
    mockEnsureBattleResolved.mockResolvedValue(undefined);
    mockCreateBattleCommitmentForMatch.mockReturnValue({
      leftStats: { damage: 10, dodge: 20, speed: 30 },
      rightStats: { damage: 30, dodge: 20, speed: 10 },
      preimage: {
        engineVersion: BATTLE_ENGINE_VERSION,
        leftAddress: '0x111',
        leftTokenId: 1,
        leftStats: { damage: 10, dodge: 20, speed: 30 },
        leftArsenalBonus: true,
        rightAddress: '0x222',
        rightTokenId: 2,
        rightStats: { damage: 30, dodge: 20, speed: 10 },
        rightArsenalBonus: false,
        targetRound: 12345,
      },
      commitHash:
        '0x1111111111111111111111111111111111111111111111111111111111111111',
      targetRound: 12345,
      estimatedResolveTime: '2026-03-22T10:00:00.000Z',
    });
  });

  it('rejects queue joins while a wallet cooldown is active', async () => {
    const now = Date.now();
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 2,
        cooldownUntil: new Date(now + 5 * 60 * 1000),
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    ];

    const { joinQueue } = await import('../services/matchmaking');
    await expect(joinQueue('0x111', 1, 'AU')).rejects.toMatchObject({
      statusCode: 429,
      code: 'WALLET_COOLDOWN_ACTIVE',
    });
  });

  it('cancels an active queue entry for the owning wallet', async () => {
    const now = Date.now();
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
        cooldownUntil: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        statusToken: 'status-1',
        status: 'waiting',
        battleId: null,
        expiresAt: new Date(now + 10 * 60 * 1000),
        matchedAt: null,
        cancelledAt: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    ];

    const { cancelQueue } = await import('../services/matchmaking');
    const response = await cancelQueue('queue-1', '0x111');

    expect(response.status).toBe('cancelled');
    expect(response.queueId).toBe('queue-1');
    expect(state.queue[0]?.status).toBe('cancelled');
    expect(state.queue[0]?.cancelledAt).toBeInstanceOf(Date);
  });

  it('expires stale queue entries during status checks', async () => {
    const now = Date.now();
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
        cooldownUntil: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        statusToken: 'status-1',
        status: 'waiting',
        battleId: null,
        expiresAt: new Date(now - 60_000),
        matchedAt: null,
        cancelledAt: null,
        createdAt: new Date(now - 120_000),
        updatedAt: new Date(now - 120_000),
      },
    ];

    const { getQueueStatus } = await import('../services/matchmaking');
    const status = await getQueueStatus('queue-1', 'status-1');

    expect(status.status).toBe('expired');
    expect(state.queue[0]?.status).toBe('expired');
  });

  it('creates a committed battle and returns drand resolution metadata', async () => {
    const now = Date.now();
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 3,
        cooldownUntil: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      {
        address: '0x222',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
        cooldownUntil: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        statusToken: 'status-1',
        status: 'waiting',
        battleId: null,
        expiresAt: new Date(now + 10 * 60 * 1000),
        matchedAt: null,
        cancelledAt: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      {
        id: 'queue-2',
        address: '0x222',
        tokenId: 2,
        country: 'US',
        statusToken: 'status-2',
        status: 'waiting',
        battleId: null,
        expiresAt: new Date(now + 10 * 60 * 1000),
        matchedAt: null,
        cancelledAt: null,
        createdAt: new Date(now + 1000),
        updatedAt: new Date(now + 1000),
      },
    ];

    const { __testing } = await import('../services/matchmaking');
    await __testing.tryMatch('queue-1', '0x111');

    expect(state.battles).toHaveLength(1);
    expect(state.queue.map((entry) => entry.status)).toEqual(['matched', 'matched']);
    const battle = state.battles[0]!;
    expect(battle.status).toBe('committed');
    expect(battle.commitHash).toBe(
      '0x1111111111111111111111111111111111111111111111111111111111111111'
    );
    expect(battle.drandRound).toBe(12345);
    expect(battle.winner).toBeNull();

    const playerUpdates = updateLog.filter((entry) => entry.table === 'players');
    expect(
      playerUpdates.some(
        (entry) =>
          isSqlExpression(entry.set['score']) ||
          entry.set['cooldownUntil'] instanceof Date
      )
    ).toBe(false);

    const { getQueueStatus } = await import('../services/matchmaking');
    const status = await getQueueStatus('queue-1', 'status-1');

    expect(status.status).toBe('matched');
    if (status.status !== 'matched') {
      throw new Error('Expected matched queue status');
    }

    expect(status.battleStatus).toBe('committed');
    expect(status.commitHash).toBe(
      '0x1111111111111111111111111111111111111111111111111111111111111111'
    );
    expect(status.targetRound).toBe(12345);
    expect(status.opponent.address).toBe('0x222');
  });

  it('does not double-match the same queue entry concurrently', async () => {
    const now = Date.now();
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
        cooldownUntil: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      {
        address: '0x222',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
        cooldownUntil: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        statusToken: 'status-1',
        status: 'waiting',
        battleId: null,
        expiresAt: new Date(now + 10 * 60 * 1000),
        matchedAt: null,
        cancelledAt: null,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      },
      {
        id: 'queue-2',
        address: '0x222',
        tokenId: 2,
        country: 'US',
        statusToken: 'status-2',
        status: 'waiting',
        battleId: null,
        expiresAt: new Date(now + 10 * 60 * 1000),
        matchedAt: null,
        cancelledAt: null,
        createdAt: new Date(now + 1000),
        updatedAt: new Date(now + 1000),
      },
    ];

    const { __testing } = await import('../services/matchmaking');
    await Promise.all([
      __testing.tryMatch('queue-1', '0x111'),
      __testing.tryMatch('queue-1', '0x111'),
    ]);

    expect(state.battles).toHaveLength(1);
    expect(new Set(state.queue.map((entry) => entry.battleId))).toEqual(
      new Set(['battle-1'])
    );
  });
});
