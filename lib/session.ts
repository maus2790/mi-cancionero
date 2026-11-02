import { cookies } from 'next/headers';

type SessionUser = { id: number; name: string };

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function createSession(user: SessionUser) {
    const cookieStore = await cookies();
    const options = {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: SESSION_MAX_AGE,
        path: '/',
    };

    cookieStore.set('session_id', crypto.randomUUID(), { ...options, httpOnly: true });
    cookieStore.set('user_id', String(user.id), { ...options, httpOnly: true });
    cookieStore.set('user_name', user.name, { ...options, httpOnly: false });
}
