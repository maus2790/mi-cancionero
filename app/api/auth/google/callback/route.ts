import { db } from '@/db';
import { users } from '@/db/schema';
import { createSession } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

type GoogleProfile = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string };

function loginRedirect(request: NextRequest, error: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get('error');
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('google_oauth_state')?.value;

  if (providerError || !code || !state || !expectedState || state !== expectedState) {
    const response = loginRedirect(request, providerError ? 'google_cancelled' : 'google_invalid_state');
    response.cookies.delete('google_oauth_state');
    return response;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return loginRedirect(request, 'google_not_configured');

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: new URL('/api/auth/google/callback', request.url).toString(), grant_type: 'authorization_code' }),
    });
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token) throw new Error('Token exchange failed');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` }, cache: 'no-store' });
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) throw new Error('Invalid Google profile');

    let [user] = await db.select().from(users).where(eq(users.providerId, profile.sub));
    if (!user) [user] = await db.select().from(users).where(eq(users.email, profile.email));
    if (!user) {
      const [createdUser] = await db.insert(users).values({ email: profile.email, name: profile.name?.trim() || profile.email.split('@')[0], provider: 'google', providerId: profile.sub, avatarUrl: profile.picture || null }).returning();
      user = createdUser;
    } else if (user.providerId && user.providerId !== profile.sub) {
      throw new Error('Google account does not match the linked user');
    } else if (!user.providerId || (!user.avatarUrl && profile.picture)) {
      const [updatedUser] = await db.update(users).set({
        ...(user.providerId ? {} : { providerId: profile.sub }),
        ...(user.avatarUrl || !profile.picture ? {} : { avatarUrl: profile.picture }),
      }).where(eq(users.id, user.id)).returning();
      user = updatedUser;
    }

    await createSession(user);
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.delete('google_oauth_state');
    return response;
  } catch (cause) {
    console.error('Google OAuth error:', cause);
    const response = loginRedirect(request, 'google_failed');
    response.cookies.delete('google_oauth_state');
    return response;
  }
}
