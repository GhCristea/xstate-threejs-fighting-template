import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: integer('id').primaryKey(),
  username: text('username').notNull().default('Player 1'),
  totalMatches: integer('total_matches').default(0),
  wins: integer('wins').default(0),
});

export const fighterMastery = sqliteTable('fighter_mastery', {
  id: integer('id').primaryKey(),
  profileId: integer('profile_id').references(() => profiles.id),
  fighterId: text('fighter_id').notNull(),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  isUnlocked: integer('is_unlocked', { mode: 'boolean' }).default(true)
});