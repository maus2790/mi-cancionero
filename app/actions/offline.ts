'use server';

import { db } from '@/db';
import { songs, favorites, setlists, setlistSongs, chords } from '@/db/schema';
import { eq, or, asc, and } from 'drizzle-orm';
import { getCurrentUser } from './auth';

// OBTENER TODAS LAS CANCIONES PARA OFFLINE
export async function getAllSongsForOffline() {
    const user = await getCurrentUser();
    
    const conditions = [];
    if (user) {
        conditions.push(or(eq(songs.isPublic, true), eq(songs.userId, user.id)));
    } else {
        conditions.push(eq(songs.isPublic, true));
    }

    const items = await db
        .select()
        .from(songs)
        .where(conditions[0])
        .orderBy(asc(songs.title));

    // Si hay usuario, obtener IDs de favoritos para adjuntarlos
    let favoriteIds = new Set<number>();
    if (user) {
        const userFavs = await db
            .select({ songId: favorites.songId })
            .from(favorites)
            .where(eq(favorites.userId, user.id));
        userFavs.forEach(f => favoriteIds.add(f.songId));
    }

    return items.map(song => ({ ...song, isFavorite: favoriteIds.has(song.id) }));
}

export async function getAllSetlistsForOffline() {
    const user = await getCurrentUser();

    const conditions = [];
    if (user) {
        conditions.push(or(eq(setlists.userId, user.id), eq(setlists.isPublic, true)));
    } else {
        conditions.push(eq(setlists.isPublic, true));
    }

    const userSetlists = await db
        .select()
        .from(setlists)
        .where(conditions[0]);

    const result = [];
    for (const setlist of userSetlists) {
        const songsInSetlist = await db
            .select({
                id: setlistSongs.id,
                songId: setlistSongs.songId,
                order: setlistSongs.order,
                transposition: setlistSongs.transposition,
                fontSize: setlistSongs.fontSize,
                song: songs,
            })
            .from(setlistSongs)
            .innerJoin(songs, eq(setlistSongs.songId, songs.id))
            .where(eq(setlistSongs.setlistId, setlist.id))
            .orderBy(asc(setlistSongs.order));
        
        result.push({
            ...setlist,
            songs: songsInSetlist
        });
    }

    return result;
}

// OBTENER TODOS LOS FAVORITOS PARA OFFLINE
export async function getAllFavoritesForOffline() {
    const user = await getCurrentUser();
    if (!user) return [];

    const result = await db
        .select({
            id: favorites.id,
            songId: favorites.songId,
            song: songs
        })
        .from(favorites)
        .innerJoin(songs, eq(favorites.songId, songs.id))
        .where(eq(favorites.userId, user.id))
        .orderBy(asc(songs.title));

    return result.map(f => ({ ...f.song, favoriteId: f.id })); // Devolver las canciones marcadas como favoritos
}

// LOS ACORDES YA TIENEN getAllChords EN app/actions/chords.ts
