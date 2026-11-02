'use client';

import { useEffect } from 'react';

export function PwaServiceWorker() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // El modo offline se prueba en la compilación de producción. En desarrollo
            // un worker puede interceptar las rutas de Next.js y bloquear Fast Refresh.
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => registration.unregister());
                });
                return;
            }

            navigator.serviceWorker.register('/sw.js').catch((error) => {
                console.error('No se pudo registrar el modo offline:', error);
            });
        }
    }, []);

    return null;
}
