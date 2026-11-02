//app/(app)/page.tsx
'use client';

import { useTheme } from '@/lib/ThemeProvider';
import { useTitle } from '@/lib/TitleContext';
import { useEffect } from 'react';

export default function HomePage() {
    const { theme } = useTheme();
    const { setTitle, setShowBack } = useTitle();

    useEffect(() => {
        setTitle('Tu Cancionero');
        setShowBack(false);
    }, [setTitle, setShowBack]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Bienvenido a Tu Cancionero. Aquí encontrarás canciones, acordes y listas para organizar tu música.
                </p>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Tema actual: {theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                    </p>
                </div>
            </div>
        </div>
    );
}
