import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionId = request.cookies.get('session_id')?.value;
    const isLoggedIn = !!sessionId;

    // Rutas públicas (auth)
    const authRoutes = ['/login', '/register'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Rutas protegidas (app)
    const isAppRoute = pathname.startsWith('/') && !isAuthRoute && pathname !== '/';

    // Si está en ruta pública y logueado -> redirigir a dashboard
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Si está en la raíz, redirigir según estado
    if (pathname === '/') {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Si está en ruta protegida y no logueado -> redirigir a login
    if (isAppRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|icons).*)'],
};