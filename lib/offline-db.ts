// lib/offline-db.ts
// Base de datos local (IndexedDB) usando la librería idb
// Almacena canciones, acordes, setlists y favoritos para modo offline

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// =====================================================
// SCHEMA
// =====================================================

interface OfflineDBSchema extends DBSchema {
    songs: {
        key: number;
        value: any;
        indexes: { 'by-title': string };
    };
    chords: {
        key: number;
        value: any;
        indexes: { 'by-name': string };
    };
    setlists: {
        key: number;
        value: any;
    };
    favorites: {
        key: number;
        value: any;
    };
    config: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'cancionero-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Canciones
                if (!db.objectStoreNames.contains('songs')) {
                    const songStore = db.createObjectStore('songs', { keyPath: 'id' });
                    songStore.createIndex('by-title', 'title');
                }
                // Acordes
                if (!db.objectStoreNames.contains('chords')) {
                    const chordStore = db.createObjectStore('chords', { keyPath: 'id' });
                    chordStore.createIndex('by-name', 'name');
                }
                // Setlists
                if (!db.objectStoreNames.contains('setlists')) {
                    db.createObjectStore('setlists', { keyPath: 'id' });
                }
                // Favoritos
                if (!db.objectStoreNames.contains('favorites')) {
                    db.createObjectStore('favorites', { keyPath: 'id' });
                }
                // Config
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config');
                }
            },
        });
    }
    return dbPromise;
}

// =====================================================
// SONGS
// =====================================================

export async function saveSongsOffline(songsData: any[]) {
    const db = await getDB();
    const tx = db.transaction('songs', 'readwrite');
    await Promise.all([
        ...songsData.map((song) => tx.store.put(song)),
        tx.done,
    ]);
}

export async function getOfflineSongs(): Promise<any[]> {
    const db = await getDB();
    return db.getAll('songs');
}

export async function getOfflineSongById(id: number): Promise<any | null> {
    const db = await getDB();
    return (await db.get('songs', id)) || null;
}

export async function clearOfflineSongs() {
    const db = await getDB();
    await db.clear('songs');
}

// =====================================================
// CHORDS
// =====================================================

export async function saveChordsOffline(chordsData: any[]) {
    const db = await getDB();
    const tx = db.transaction('chords', 'readwrite');
    await Promise.all([
        ...chordsData.map((chord) => tx.store.put(chord)),
        tx.done,
    ]);
}

export async function getOfflineChords(): Promise<any[]> {
    const db = await getDB();
    return db.getAll('chords');
}

export async function clearOfflineChords() {
    const db = await getDB();
    await db.clear('chords');
}

// =====================================================
// SETLISTS
// =====================================================

export async function saveSetlistsOffline(setlistsData: any[]) {
    const db = await getDB();
    const tx = db.transaction('setlists', 'readwrite');
    await Promise.all([
        ...setlistsData.map((s) => tx.store.put(s)),
        tx.done,
    ]);
}

export async function getOfflineSetlists(): Promise<any[]> {
    const db = await getDB();
    return db.getAll('setlists');
}

export async function getOfflineSetlistById(id: number): Promise<any | null> {
    const db = await getDB();
    return (await db.get('setlists', id)) || null;
}

export async function clearOfflineSetlists() {
    const db = await getDB();
    await db.clear('setlists');
}

// =====================================================
// FAVORITES
// =====================================================

export async function saveFavoritesOffline(favsData: any[]) {
    const db = await getDB();
    const tx = db.transaction('favorites', 'readwrite');
    await Promise.all([
        ...favsData.map((f) => tx.store.put(f)),
        tx.done,
    ]);
}

export async function getOfflineFavorites(): Promise<any[]> {
    const db = await getDB();
    return db.getAll('favorites');
}

export async function clearOfflineFavorites() {
    const db = await getDB();
    await db.clear('favorites');
}

// =====================================================
// CONFIG
// =====================================================

export interface OfflineConfig {
    isEnabled: boolean;
    sections: string[];          // ['songs','chords','setlists','favorites']
    lastSyncAt: number | null;   // timestamp
    songCount: number;
    chordCount: number;
    setlistCount: number;
    favoriteCount: number;
}

const DEFAULT_CONFIG: OfflineConfig = {
    isEnabled: false,
    sections: [],
    lastSyncAt: null,
    songCount: 0,
    chordCount: 0,
    setlistCount: 0,
    favoriteCount: 0,
};

export async function getOfflineConfig(): Promise<OfflineConfig> {
    const db = await getDB();
    return (await db.get('config', 'main')) || DEFAULT_CONFIG;
}

export async function saveOfflineConfig(config: Partial<OfflineConfig>) {
    const db = await getDB();
    const current = await getOfflineConfig();
    await db.put('config', { ...current, ...config }, 'main');
}

export async function clearAllOfflineData() {
    const db = await getDB();
    await Promise.all([
        db.clear('songs'),
        db.clear('chords'),
        db.clear('setlists'),
        db.clear('favorites'),
        db.delete('config', 'main'),
    ]);
}
