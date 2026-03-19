import {
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
    status: text('status').notNull().default('waiting'),
    battleId: uuid('battle_id'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('idx_queue_waiting').on(table.status)]
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
    winner: text('winner').notNull(),
    leftHp: integer('left_hp').notNull(),
    rightHp: integer('right_hp').notNull(),
    roundsJson: jsonb('rounds_json').notNull(),
    resolvedAt: timestamp('resolved_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('battles_left_queue_id_unique').on(table.leftQueueId),
    uniqueIndex('battles_right_queue_id_unique').on(table.rightQueueId),
  ]
);
