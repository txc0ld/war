import {
  boolean,
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const players = pgTable(
  'players',
  {
    address: text('address').primaryKey(),
    score: integer('score').notNull().default(0),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    gunCount: integer('gun_count').notNull().default(0),
    cooldownUntil: timestamp('cooldown_until'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_leaderboard').on(table.score)]
);

export const queue = pgTable(
  'queue',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    address: text('address').notNull(),
    tokenId: integer('token_id').notNull(),
    country: text('country').notNull(),
    statusToken: text('status_token').notNull(),
    status: text('status').notNull().default('waiting'),
    battleId: uuid('battle_id'),
    expiresAt: timestamp('expires_at').notNull(),
    matchedAt: timestamp('matched_at'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_queue_waiting').on(table.status),
    index('idx_queue_active_lookup').on(table.address, table.status, table.expiresAt),
    uniqueIndex('queue_status_token_unique').on(table.statusToken),
  ]
);

export const battles = pgTable(
  'battles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leftQueueId: uuid('left_queue_id')
      .notNull()
      .references(() => queue.id),
    rightQueueId: uuid('right_queue_id')
      .notNull()
      .references(() => queue.id),
    leftAddress: text('left_address')
      .notNull()
      .references(() => players.address),
    leftToken: integer('left_token').notNull(),
    rightAddress: text('right_address')
      .notNull()
      .references(() => players.address),
    rightToken: integer('right_token').notNull(),
    status: text('status').notNull().default('resolved'),
    winner: text('winner'),
    leftHp: integer('left_hp'),
    rightHp: integer('right_hp'),
    roundsJson: jsonb('rounds_json'),
    commitHash: text('commit_hash'),
    commitPreimageJson: jsonb('commit_preimage_json'),
    drandRound: integer('drand_round'),
    drandRandomness: text('drand_randomness'),
    drandSignature: text('drand_signature'),
    battleSeed: text('battle_seed'),
    engineVersion: text('engine_version').notNull().default('v1-hourly-seed'),
    resolutionError: text('resolution_error'),
    committedAt: timestamp('committed_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('battles_left_queue_id_unique').on(table.leftQueueId),
    uniqueIndex('battles_right_queue_id_unique').on(table.rightQueueId),
    index('idx_battles_status').on(table.status),
    index('idx_battles_drand_round').on(table.drandRound),
  ]
);

export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    scope: text('scope').notNull(),
    identifier: text('identifier').notNull(),
    bucketStart: timestamp('bucket_start').notNull(),
    count: integer('count').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('rate_limit_bucket_unique').on(
      table.scope,
      table.identifier,
      table.bucketStart
    ),
    index('idx_rate_limit_bucket_start').on(table.bucketStart),
  ]
);

export const ownershipSnapshots = pgTable('ownership_snapshots', {
  address: text('address').primaryKey(),
  tokenIds: jsonb('token_ids').notNull(),
  gunCount: integer('gun_count').notNull().default(0),
  source: text('source').notNull(),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const profiles = pgTable(
  'profiles',
  {
    address: text('address').primaryKey(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    statusMessage: text('status_message'),
    showBattleResults: boolean('show_battle_results').notNull().default(true),
    showChatPresence: boolean('show_chat_presence').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_profiles_updated_at').on(table.updatedAt)]
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    address: text('address').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_chat_messages_created_at').on(table.createdAt),
    index('idx_chat_messages_address').on(table.address),
  ]
);

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    address: text('address').notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    lastUsedAt: timestamp('last_used_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('chat_sessions_token_hash_unique').on(table.tokenHash),
    index('idx_chat_sessions_address').on(table.address),
    index('idx_chat_sessions_expires_at').on(table.expiresAt),
  ]
);

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    expirationTime: timestamp('expiration_time'),
    address: text('address'),
    userAgent: text('user_agent'),
    failureCount: integer('failure_count').notNull().default(0),
    lastNotifiedAt: timestamp('last_notified_at'),
    disabledAt: timestamp('disabled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('push_subscriptions_endpoint_unique').on(table.endpoint),
    index('idx_push_subscriptions_address').on(table.address),
    index('idx_push_subscriptions_active').on(table.disabledAt, table.updatedAt),
  ]
);

// ── Season 2: Deadshot ──────────────────────────────────────────────

export const s2Players = pgTable(
  's2_players',
  {
    address: text('address').primaryKey(),
    score: integer('score').notNull().default(0),
    elo: integer('elo').notNull().default(1000),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    headshotKills: integer('headshot_kills').notNull().default(0),
    totalKills: integer('total_kills').notNull().default(0),
    sniperCount: integer('sniper_count').notNull().default(0),
    winStreak: integer('win_streak').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_s2_leaderboard').on(table.score)]
);

export const s2Queue = pgTable(
  's2_queue',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    address: text('address').notNull(),
    tokenId: integer('token_id').notNull(),
    statusToken: text('status_token').notNull(),
    status: text('status').notNull().default('waiting'),
    battleId: uuid('battle_id'),
    expiresAt: timestamp('expires_at').notNull(),
    matchedAt: timestamp('matched_at'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_s2_queue_waiting').on(table.status),
    index('idx_s2_queue_active_lookup').on(
      table.address,
      table.status,
      table.expiresAt
    ),
    uniqueIndex('s2_queue_status_token_unique').on(table.statusToken),
  ]
);

export const s2Battles = pgTable(
  's2_battles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leftAddress: text('left_address')
      .notNull()
      .references(() => s2Players.address),
    leftToken: integer('left_token').notNull(),
    rightAddress: text('right_address')
      .notNull()
      .references(() => s2Players.address),
    rightToken: integer('right_token').notNull(),
    status: text('status').notNull().default('pending'),
    winner: text('winner'),
    leftScore: integer('left_score'),
    rightScore: integer('right_score'),
    roundsWonLeft: integer('rounds_won_left'),
    roundsWonRight: integer('rounds_won_right'),
    roundsJson: jsonb('rounds_json'),
    roomId: text('room_id'),
    roomTokenLeft: text('room_token_left'),
    roomTokenRight: text('room_token_right'),
    createdAt: timestamp('created_at').defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_s2_battles_status').on(table.status),
    index('idx_s2_battles_resolved').on(table.resolvedAt),
  ]
);

export const s2Snipers = pgTable('s2_snipers', {
  tokenId: integer('token_id').primaryKey(),
  name: text('name'),
  image: text('image'),
  skin: text('skin'),
  scopeReticle: text('scope_reticle'),
  killEffect: text('kill_effect'),
  tracerColor: text('tracer_color'),
  inspectAnim: text('inspect_anim'),
  owner: text('owner'),
  cachedAt: timestamp('cached_at').defaultNow(),
});
