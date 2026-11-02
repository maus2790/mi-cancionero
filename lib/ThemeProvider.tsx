'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const BROWSER_COLORS = { light: '#f0f9ff', dark: '#0f172a' } as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial = stored || (systemDark ? 'dark' : 'light');
        setTheme(initial);
        document.documentElement.classList.toggle('dark', initial === 'dark');
    }, []);

    useEffect(() => {
        const color = BROWSER_COLORS[theme];
        document.documentElement.style.colorScheme = theme;

        let themeColor = document.querySelector('meta[name="theme-color"]');
        if (!themeColor) {
            themeColor = document.createElement('meta');
            themeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(themeColor);
        }
        themeColor.setAttribute('content', color);

        let statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (!statusBar) {
            statusBar = document.createElement('meta');
            statusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
            document.head.appendChild(statusBar);
        }
        statusBar.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
