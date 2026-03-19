import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POINTS } from '@warpath/shared';

type PlayerRow = {
  address: string;
  score: number;
  wins: number;
  losses: number;
  gunCount: number;
  updatedAt?: Date;
};

type QueueRow = {
  id: string;
  address: string;
  tokenId: number;
  country: string;
  status: 'waiting' | 'matched';
  battleId: string | null;
  createdAt: Date;
};

type BattleRow = {
  id: string;
  leftQueueId: string;
  rightQueueId: string;
  leftAddress: string;
  leftToken: number;
  rightAddress: string;
  rightToken: number;
  winner: 'left' | 'right';
  leftHp: number;
  rightHp: number;
  roundsJson: unknown[];
};

type TableRow = Record<string, unknown>;
type TestDb = {
  select: () => SelectBuilder;
  insert: <T extends { __table: keyof typeof state }>(table: T) => InsertBuilder<T>;
  update: <T extends { __table: keyof typeof state }>(table: T) => UpdateBuilder<T>;
  transaction: <T>(callback: (tx: TestDb) => Promise<T>) => Promise<T>;
};

const schema = {
  players: {
    __table: 'players',
    address: 'address',
    score: 'score',
    wins: 'wins',
    losses: 'losses',
    gunCount: 'gunCount',
    updatedAt: 'updatedAt',
  },
  queue: {
    __table: 'queue',
    id: 'id',
    address: 'address',
    tokenId: 'tokenId',
    country: 'country',
    status: 'status',
    battleId: 'battleId',
    createdAt: 'createdAt',
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
    winner: 'winner',
    leftHp: 'leftHp',
    rightHp: 'rightHp',
    roundsJson: 'roundsJson',
  },
} as const;

const state = {
  players: [] as PlayerRow[],
  queue: [] as QueueRow[],
  battles: [] as BattleRow[],
};

const globalLocks = new Set<string>();
const updateLog: Array<{
  table: keyof typeof state;
  set: Record<string, unknown>;
  updatedRows: TableRow[];
}> = [];
let battleSequence = 1;

function eq(column: string, value: unknown) {
  return (row: Record<string, unknown>) => row[column] === value;
}

function ne(column: string, value: unknown) {
  return (row: Record<string, unknown>) => row[column] !== value;
}

function and(
  ...conditions: Array<((row: Record<string, unknown>) => boolean) | undefined>
) {
  return (row: Record<string, unknown>) =>
    conditions.every((condition) => (condition ? condition(row) : true));
}

function isNull(column: string) {
  return (row: Record<string, unknown>) => row[column] === null;
}

function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return {
    __sql: true,
    strings: Array.from(strings),
    values,
  };
}

function tableRows(table: { __table: keyof typeof state }) {
  return state[table.__table] as TableRow[];
}

function projectRow<T extends Record<string, unknown>>(
  row: T,
  returning?: Record<string, string>
) {
  if (!returning) {
    return row;
  }

  return Object.fromEntries(
    Object.entries(returning).map(([key, column]) => [key, row[column]])
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

class SelectBuilder {
  private tableName: keyof typeof state | null = null;
  private predicate: (row: Record<string, unknown>) => boolean = () => true;
  private limitValue: number | null = null;
  private orderColumn: string | null = null;
  private skipLocked = false;
  private lockRows = false;

  constructor(private readonly txLocks: Set<string>) {}

  from(table: { __table: keyof typeof state }) {
    this.tableName = table.__table;
    return this;
  }

  where(predicate: (row: Record<string, unknown>) => boolean) {
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

    if (this.lockRows) {
      rows = rows.filter((row) => !globalLocks.has(String(row['id'])));
    }

    if (this.orderColumn) {
      rows.sort((left, right) => {
        const a = left[this.orderColumn!] as Date;
        const b = right[this.orderColumn!] as Date;
        return a.getTime() - b.getTime();
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
    return selected.map((row) => ({ ...row }));
  }
}

class InsertValuesBuilder<T extends { __table: keyof typeof state }> {
  constructor(
    private readonly table: T,
    private readonly valuesToInsert: Record<string, unknown>
  ) {}

  async onConflictDoNothing() {
    const rows = tableRows(this.table);
    if (this.table.__table === 'players') {
      const address = this.valuesToInsert.address as string;
      if (!rows.some((row) => row['address'] === address)) {
        rows.push({
          score: 0,
          wins: 0,
          losses: 0,
          gunCount: 0,
          ...this.valuesToInsert,
        } as never);
      }
    }
  }

  async returning(returning: Record<string, string>) {
    const rows = tableRows(this.table);
    if (this.table.__table === 'queue') {
      const row: QueueRow = {
        id: `queue-${rows.length + 1}`,
        address: this.valuesToInsert.address as string,
        tokenId: this.valuesToInsert.tokenId as number,
        country: this.valuesToInsert.country as string,
        status: (this.valuesToInsert.status as 'waiting' | 'matched') ?? 'waiting',
        battleId: null,
        createdAt: new Date(),
      };
      rows.push(row as never);
      return [projectRow(row as unknown as Record<string, unknown>, returning)];
    }

    if (this.table.__table === 'battles') {
      const row: BattleRow = {
        id: `battle-${battleSequence++}`,
        leftQueueId: this.valuesToInsert.leftQueueId as string,
        rightQueueId: this.valuesToInsert.rightQueueId as string,
        leftAddress: this.valuesToInsert.leftAddress as string,
        leftToken: this.valuesToInsert.leftToken as number,
        rightAddress: this.valuesToInsert.rightAddress as string,
        rightToken: this.valuesToInsert.rightToken as number,
        winner: this.valuesToInsert.winner as 'left' | 'right',
        leftHp: this.valuesToInsert.leftHp as number,
        rightHp: this.valuesToInsert.rightHp as number,
        roundsJson: (this.valuesToInsert.roundsJson as unknown[]) ?? [],
      };
      rows.push(row as never);
      return [projectRow(row as unknown as Record<string, unknown>, returning)];
    }

    return [];
  }
}

class InsertBuilder<T extends { __table: keyof typeof state }> {
  constructor(private readonly table: T) {}

  values(valuesToInsert: Record<string, unknown>) {
    return new InsertValuesBuilder(this.table, valuesToInsert);
  }
}

class UpdateWhereBuilder<T extends { __table: keyof typeof state }> {
  constructor(
    private readonly table: T,
    private readonly valuesToSet: Record<string, unknown>,
    private readonly predicate: (row: Record<string, unknown>) => boolean
  ) {}

  private execute() {
    const rows = tableRows(this.table);
    const updated = rows.filter((row) => this.predicate(row));

    for (const row of updated) {
      for (const [key, value] of Object.entries(this.valuesToSet)) {
        (row as Record<string, unknown>)[key] = applySqlUpdate(
          row as Record<string, unknown>,
          key,
          value
        );
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

class UpdateBuilder<T extends { __table: keyof typeof state }> {
  private valuesToSet: Record<string, unknown> = {};

  constructor(private readonly table: T) {}

  set(valuesToSet: Record<string, unknown>) {
    this.valuesToSet = valuesToSet;
    return this;
  }

  where(predicate: (row: Record<string, unknown>) => boolean) {
    return new UpdateWhereBuilder(this.table, this.valuesToSet, predicate);
  }
}

function createDb(txLocks = new Set<string>()): TestDb {
  return {
    select: () => new SelectBuilder(txLocks),
    insert: <T extends { __table: keyof typeof state }>(table: T) =>
      new InsertBuilder(table),
    update: <T extends { __table: keyof typeof state }>(table: T) =>
      new UpdateBuilder(table),
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

vi.mock('drizzle-orm', () => ({
  and,
  eq,
  isNull,
  ne,
  sql,
}));

vi.mock('../db/schema', () => schema);

vi.mock('../db/client', () => ({
  db,
}));

function resetState() {
  state.players = [];
  state.queue = [];
  state.battles = [];
  globalLocks.clear();
  updateLog.length = 0;
  battleSequence = 1;
}

describe('matchmaking service', () => {
  beforeEach(() => {
    resetState();
  });

  it('returns gracefully when no opponent is available', async () => {
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        status: 'waiting',
        battleId: null,
        createdAt: new Date('2026-03-19T00:00:00.000Z'),
      },
    ];

    const { __testing } = await import('../services/matchmaking');
    await __testing.tryMatch('queue-1', '0x111');

    expect(state.battles).toHaveLength(0);
    expect(state.queue[0]?.status).toBe('waiting');
    expect(state.queue[0]?.battleId).toBeNull();
  });

  it('creates a battle and updates queue state and scores atomically', async () => {
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 3,
      },
      {
        address: '0x222',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        status: 'waiting',
        battleId: null,
        createdAt: new Date('2026-03-19T00:00:00.000Z'),
      },
      {
        id: 'queue-2',
        address: '0x222',
        tokenId: 2,
        country: 'US',
        status: 'waiting',
        battleId: null,
        createdAt: new Date('2026-03-19T00:00:01.000Z'),
      },
    ];

    const { __testing } = await import('../services/matchmaking');
    await __testing.tryMatch('queue-1', '0x111');

    expect(state.battles).toHaveLength(1);
    expect(state.queue.map((entry) => entry.status)).toEqual(['matched', 'matched']);
    expect(state.queue[0]?.battleId).toBe('battle-1');
    expect(state.queue[1]?.battleId).toBe('battle-1');

    const battle = state.battles[0]!;
    const winnerAddress =
      battle.winner === 'left' ? battle.leftAddress : battle.rightAddress;
    const loserAddress =
      battle.winner === 'left' ? battle.rightAddress : battle.leftAddress;

    const winner = state.players.find((player) => player.address === winnerAddress);
    const loser = state.players.find((player) => player.address === loserAddress);
    const multiplier = winner?.gunCount && winner.gunCount >= 3
      ? POINTS.THREE_GUN_MULTIPLIER
      : 1;

    const playerUpdates = updateLog.filter((entry) => entry.table === 'players');
    expect(playerUpdates).toHaveLength(2);

    const winnerUpdate = playerUpdates.find(
      (entry) => entry.updatedRows[0]?.['address'] === winnerAddress
    );
    const loserUpdate = playerUpdates.find(
      (entry) => entry.updatedRows[0]?.['address'] === loserAddress
    );

    expect(winnerUpdate?.set['wins']).toMatchObject({ __sql: true });
    expect(winnerUpdate?.set['score']).toMatchObject({
      __sql: true,
      values: ['score', Math.round(POINTS.WIN * multiplier)],
    });
    expect(loserUpdate?.set['losses']).toMatchObject({ __sql: true });
    expect(loserUpdate?.set['score']).toMatchObject({
      __sql: true,
      values: ['score', POINTS.LOSS],
    });
  });

  it('does not double-match when the same queue entry is resolved concurrently', async () => {
    state.players = [
      {
        address: '0x111',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
      },
      {
        address: '0x222',
        score: 0,
        wins: 0,
        losses: 0,
        gunCount: 1,
      },
    ];
    state.queue = [
      {
        id: 'queue-1',
        address: '0x111',
        tokenId: 1,
        country: 'AU',
        status: 'waiting',
        battleId: null,
        createdAt: new Date('2026-03-19T00:00:00.000Z'),
      },
      {
        id: 'queue-2',
        address: '0x222',
        tokenId: 2,
        country: 'US',
        status: 'waiting',
        battleId: null,
        createdAt: new Date('2026-03-19T00:00:01.000Z'),
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
