'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/ThemeProvider';

// Matches the Header: bg-sky-50 (light) / bg-slate-900 (dark)
const LIGHT_COLOR = '#f0f9ff'; // sky-50
const DARK_COLOR  = '#0f172a'; // slate-900

export function ThemeColorUpdater() {
    const pathname = usePathname();
    const { theme } = useTheme();

    useEffect(() => {
        const color = theme === 'dark' ? DARK_COLOR : LIGHT_COLOR;

        let metaTag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = 'theme-color';
            document.head.appendChild(metaTag);
        }
        metaTag.content = color;
    }, [pathname, theme]);

    return null;
}
