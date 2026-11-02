import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    password: text('password'),
    name: text('name').notNull(),
    role: text('role').default('user'),
    provider: text('provider'),
    providerId: text('provider_id'),
    preferences: text('preferences'),
    avatarUrl: text('avatarUrl'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

export const songs = sqliteTable('songs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    artist: text('artist'),
    key: text('key'),
    style: text('style'),
    enganchado: text('enganchado'),
    content: text('content').notNull(),
    createdAt: integer('created_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
    updatedAt: integer('updated_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
    userId: integer('user_id').references(() => users.id),
    isPublic: integer('is_public', { mode: 'boolean' }).default(true),
    audioUrl: text('audio_url'),
    videoUrl: text('video_url'),
    chordPositions: text('chord_positions'),
});

export const enganchados = sqliteTable('enganchados', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    createdAt: integer('created_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
});

export const setlists = sqliteTable('setlists', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    icon: text('icon'),
    color: text('color'),
    isPublic: integer('is_public', { mode: 'boolean' }).default(true),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: integer('created_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
});

export const setlistSongs = sqliteTable('setlist_songs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    setlistId: integer('setlist_id').references(() => setlists.id).notNull(),
    songId: integer('song_id').references(() => songs.id).notNull(),
    order: integer('order').default(0),
    transposition: integer('transposition').default(0),
    fontSize: text('font_size').default('medium'),
});

export const favorites = sqliteTable('favorites', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id).notNull(),
    songId: integer('song_id').references(() => songs.id).notNull(),
    createdAt: integer('created_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
});

export const chords = sqliteTable('chords', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    root: text('root').notNull(),
    type: text('type').notNull(),
    guitarPositions: text('guitar_positions'),
    pianoPositions: text('piano_positions'),
    imageUrl: text('image_url'),       // imagen de guitarra
    pianoImageUrl: text('piano_image_url'), // imagen de piano
    userId: integer('user_id').references(() => users.id),
    isPredefined: integer('is_predefined', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
    updatedAt: integer('updated_at').notNull().$default(() => Math.floor(Date.now() / 1000)),
});
