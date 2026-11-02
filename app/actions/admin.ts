'use server';

import { db } from '@/db';
import { users, songs, setlists, chords, favorites } from '@/db/schema';
import { eq, count, desc, or, like, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import bcrypt from 'bcryptjs';

const VALID_ROLES = new Set(['user', 'creator', 'admin']);

// ============================================================
// VERIFICAR SI EL USUARIO ES ADMIN
// ============================================================
async function requireAdmin() {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');
    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (dbUser?.role !== 'admin') throw new Error('Acceso denegado: se requieren permisos de administrador');
    return dbUser;
}

// ============================================================
// OBTENER TODOS LOS USUARIOS (con búsqueda y paginación) - CORREGIDO
// ============================================================
export async function getAllUsers(search?: string, page = 1, limit = 20) {
    await requireAdmin();
    const offset = (page - 1) * limit;

    let conditions: any[] = [];
    if (search && search.trim()) {
        conditions.push(
            or(
                like(users.name, `%${search.trim()}%`),
                like(users.email, `%${search.trim()}%`)
            )
        );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [total] = await db
        .select({ count: count() })
        .from(users)
        .where(whereClause);

    const items = await db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

    return {
        items,
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / limit),
        page,
        limit,
    };
}

// ============================================================
// OBTENER UN USUARIO POR ID
// ============================================================
export async function getUserById(userId: number) {
    await requireAdmin();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || null;
}

// ============================================================
// CREAR USUARIO (con timestamp correcto)
// ============================================================
export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
}) {
    const admin = await requireAdmin();

    if (data.role && !VALID_ROLES.has(data.role)) throw new Error('Rol no válido');

    if (!data.name || !data.email || !data.password) {
        throw new Error('Todos los campos son obligatorios');
    }

    if (data.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email));

    if (existing) {
        throw new Error('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Asegurar timestamp en milisegundos
    const now = Date.now();

    const [newUser] = await db
        .insert(users)
        .values({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role || 'user',
            provider: 'email',
            createdAt: new Date(now),
        })
        .returning();

    revalidatePath('/admin/usuarios');
    return newUser;
}

// ============================================================
// ACTUALIZAR USUARIO
// ============================================================
export async function updateUser(
    userId: number,
    data: {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
    }
) {
    const admin = await requireAdmin();

    if (data.role !== undefined && !VALID_ROLES.has(data.role)) throw new Error('Rol no válido');

    if (admin.id === userId && data.role && data.role !== admin.role) {
        throw new Error('No puedes cambiar tu propio rol');
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('Usuario no encontrado');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) {
        if (data.email !== user.email) {
            const [existing] = await db
                .select()
                .from(users)
                .where(and(eq(users.email, data.email), sql`${users.id} != ${userId}`));
            if (existing) throw new Error('El email ya está en uso por otro usuario');
            updateData.email = data.email;
        }
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.password) {
        if (data.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

    revalidatePath('/admin/usuarios');
    return updated;
}

// ============================================================
// CAMBIAR ROL DE USUARIO
// ============================================================
export async function updateUserRole(userId: number, role: string) {
    const admin = await requireAdmin();
    if (admin.id === userId) {
        throw new Error('No puedes cambiar tu propio rol');
    }
    return updateUser(userId, { role });
}

// ============================================================
// ELIMINAR USUARIO
// ============================================================
export async function deleteUser(userId: number) {
    const admin = await requireAdmin();
    if (admin.id === userId) {
        throw new Error('No puedes eliminar tu propia cuenta');
    }

    await db.delete(favorites).where(eq(favorites.userId, userId));
    await db.delete(setlists).where(eq(setlists.userId, userId));
    await db.delete(songs).where(eq(songs.userId, userId));
    await db.delete(chords).where(eq(chords.userId, userId));
    await db.delete(users).where(eq(users.id, userId));

    revalidatePath('/admin/usuarios');
    return { success: true };
}

// ============================================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD
// ============================================================
export async function getAdminStats() {
    await requireAdmin();

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalSongs] = await db.select({ count: count() }).from(songs);
    const [totalSetlists] = await db.select({ count: count() }).from(setlists);
    const [totalChords] = await db.select({ count: count() }).from(chords);
    const [totalFavorites] = await db.select({ count: count() }).from(favorites);

    const recentUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(5);

    const recentSongs = await db
        .select()
        .from(songs)
        .orderBy(desc(songs.createdAt))
        .limit(5);

    return {
        stats: {
            users: totalUsers.count,
            songs: totalSongs.count,
            setlists: totalSetlists.count,
            chords: totalChords.count,
            favorites: totalFavorites.count,
        },
        recentUsers,
        recentSongs,
    };
}

// ============================================================
// OBTENER TODOS LOS SETLISTS (para admin)
// ============================================================
export async function getAllSetlists() {
    await requireAdmin();
    return await db
        .select()
        .from(setlists)
        .orderBy(desc(setlists.createdAt));
}

// ============================================================
// ELIMINAR SETLIST (admin)
// ============================================================
export async function deleteSetlistAdmin(setlistId: number) {
    await requireAdmin();
    await db.delete(setlists).where(eq(setlists.id, setlistId));
    revalidatePath('/admin/setlists');
}

// ============================================================
// OBTENER TODOS LOS ACORDES (para admin)
// ============================================================
export async function getAllChordsAdmin() {
    await requireAdmin();
    return await db
        .select()
        .from(chords)
        .orderBy(desc(chords.createdAt));
}

// ============================================================
// ELIMINAR ACORDE (admin)
// ============================================================
export async function deleteChordAdmin(chordId: number) {
    await requireAdmin();
    await db.delete(chords).where(eq(chords.id, chordId));
    revalidatePath('/admin/acordes');
}

// ============================================================
// OBTENER TODAS LAS CANCIONES (para admin)
// ============================================================
export async function getAllSongs() {
    await requireAdmin();
    return await db
        .select()
        .from(songs)
        .orderBy(desc(songs.createdAt));
}

// ============================================================
// ELIMINAR CANCIÓN (admin)
// ============================================================
export async function deleteSongAdmin(songId: number) {
    await requireAdmin();
    await db.delete(songs).where(eq(songs.id, songId));
    revalidatePath('/admin/canciones');
}
