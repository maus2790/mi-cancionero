import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL('/login?error=google_not_configured', request.url));

  const state = randomBytes(32).toString('hex');
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: new URL('/api/auth/google/callback', request.url).toString(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    maxAge: 60 * 10, path: '/',
  });
  return response;
}
