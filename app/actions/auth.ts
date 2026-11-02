'use server';

import { db } from '@/db';
import { users, songs, setlists, favorites } from '@/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { uploadImage, deleteImage } from '@/lib/r2';

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
function generateSessionId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 15);
}

// ============================================================
// REGISTRO CON EMAIL
// ============================================================
export async function handleRegister(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password || !name) {
        return { error: 'Todos los campos son requeridos' };
    }

    // Verificar si el email ya existe
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
        return { error: 'El email ya está registrado' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(users).values({
        email,
        password: hashedPassword,
        name,
        provider: 'email',
    });

    redirect('/login');
}

// ============================================================
// LOGIN CON EMAIL
// ============================================================
export async function handleLogin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Todos los campos son requeridos' };
    }

    const user = await db.select().from(users).where(eq(users.email, email));
    if (user.length === 0) {
        return { error: 'Credenciales inválidas' };
    }

    // Si el usuario es de Google o invitado, no tiene contraseña
    if (user[0].provider === 'google' || user[0].provider === 'guest') {
        return { error: 'Esta cuenta usa otro método de inicio de sesión' };
    }

    const isValid = await bcrypt.compare(password, user[0].password || '');
    if (!isValid) {
        return { error: 'Credenciales inválidas' };
    }

    // Crear sesión
    await createSession(user[0]);
    redirect('/dashboard');
}

// ============================================================
// LOGIN COMO INVITADO
// ============================================================
export async function handleGuestLogin() {
    // Buscar o crear un usuario invitado
    let guestUser = await db.select().from(users).where(eq(users.email, 'guest@invitado.com'));

    if (guestUser.length === 0) {
        // Crear usuario invitado
        await db.insert(users).values({
            email: 'guest@invitado.com',
            name: 'Invitado',
            password: null,
            provider: 'guest',
            providerId: null,
            preferences: null,
        });
        guestUser = await db.select().from(users).where(eq(users.email, 'guest@invitado.com'));
    }

    await createSession(guestUser[0]);
    redirect('/dashboard');
}

// ============================================================
// CREAR SESIÓN (cookies)
// ============================================================
async function createSession(user: any) {
    const cookieStore = await cookies();
    const sessionId = generateSessionId();

    cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
    });

    cookieStore.set('user_id', user.id.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    cookieStore.set('user_name', user.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
}

// ============================================================
// OBTENER USUARIO ACTUAL (actualizado con avatar)
// ============================================================
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const userName = cookieStore.get('user_name')?.value;

    if (!userId) return null;

    try {
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                role: users.role,
                provider: users.provider,
                avatarUrl: users.avatarUrl,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, parseInt(userId)));

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            name: userName || user.name,
            role: user.role || 'user',
            provider: user.provider,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
        };
    } catch (error) {
        console.warn('⚠️ [Offline Fallback] No se pudo conectar a la DB en getCurrentUser:', error);
        return {
            id: parseInt(userId),
            email: 'offline@cancionero',
            name: userName || 'Usuario Offline',
            role: 'user',
            provider: 'credentials',
            avatarUrl: null,
            createdAt: new Date(),
        };
    }
}

// ============================================================
// CERRAR SESIÓN
// ============================================================
export async function handleLogout() {
    const cookieStore = await cookies();
    cookieStore.set('session_id', '', { maxAge: 0, path: '/' });
    cookieStore.set('user_id', '', { maxAge: 0, path: '/' });
    cookieStore.set('user_name', '', { maxAge: 0, path: '/' });
    redirect('/login');
}

// app/actions/auth.ts (añadir al final)

// ============================================================
// ACTUALIZAR PERFIL (sin imagen, solo datos)
// ============================================================
export async function updateProfile(data: {
    name: string;
    email: string;
    password?: string;
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    if (data.email !== user.email) {
        const [existing] = await db
            .select()
            .from(users)
            .where(and(eq(users.email, data.email), sql`${users.id} != ${user.id}`));
        if (existing) throw new Error('El email ya está en uso');
    }

    const updateData: any = {
        name: data.name,
        email: data.email,
    };

    if (data.password) {
        if (data.password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id))
        .returning();

    const cookieStore = await cookies();
    cookieStore.set('user_name', updated.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    revalidatePath('/perfil');
    return updated;
}

// ============================================================
// OBTENER ESTADÍSTICAS DEL USUARIO
// ============================================================
export async function getUserStats() {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [totalSongs] = await db
        .select({ count: count() })
        .from(songs)
        .where(eq(songs.userId, user.id));

    const [totalSetlists] = await db
        .select({ count: count() })
        .from(setlists)
        .where(eq(setlists.userId, user.id));

    const [totalFavorites] = await db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.userId, user.id));

    return {
        songs: totalSongs?.count || 0,
        setlists: totalSetlists?.count || 0,
        favorites: totalFavorites?.count || 0,
    };
}

// ============================================================
// SUBIR/ACTUALIZAR AVATAR
// ============================================================
export async function uploadAvatar(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const file = formData.get('avatar') as File | null;
    if (!file || file.size === 0) {
        throw new Error('No se seleccionó ninguna imagen');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5MB');
    }

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    const oldAvatarUrl = dbUser?.avatarUrl;

    const ext = file.name.split('.').pop() || 'png';
    const key = `perfiles/${user.id}-${Date.now()}.${ext}`;
    const newAvatarUrl = await uploadImage(file, key);

    await db.update(users)
        .set({ avatarUrl: newAvatarUrl })
        .where(eq(users.id, user.id));

    if (oldAvatarUrl) {
        try {
            const publicUrl = process.env.R2_PUBLIC_URL!;
            const extractKey = (url: string) =>
                url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url.split('/').slice(-2).join('/');
            await deleteImage(extractKey(oldAvatarUrl));
        } catch (e) {
            console.warn('No se pudo eliminar avatar antiguo:', e);
        }
    }

    // Actualizar cookie del nombre (por si cambia)
    const cookieStore = await cookies();
    cookieStore.set('user_name', dbUser?.name || user.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    revalidatePath('/perfil');
    return { avatarUrl: newAvatarUrl };
}

// ============================================================
// ELIMINAR AVATAR
// ============================================================
export async function removeAvatar() {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    const oldAvatarUrl = dbUser?.avatarUrl;

    if (oldAvatarUrl) {
        const publicUrl = process.env.R2_PUBLIC_URL!;
        const extractKey = (url: string) =>
            url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url.split('/').slice(-2).join('/');
        await deleteImage(extractKey(oldAvatarUrl));
    }

    await db.update(users)
        .set({ avatarUrl: null })
        .where(eq(users.id, user.id));

    revalidatePath('/perfil');
    return { success: true };
}




