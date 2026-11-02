'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Music, Guitar, List, Heart } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/canciones', label: 'Canciones', icon: Music },
    { href: '/acordes', label: 'Acordes', icon: Guitar },
    { href: '/setlists', label: 'Repertorio', icon: List },
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-app-surface border-t flex justify-around py-2 shadow-lg z-50">
            {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center gap-1 text-xs transition ${(href === '/' ? pathname === '/' || pathname === '/dashboard' : pathname === href)
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-app-muted'
                        }`}
                >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </Link>
            ))}
        </nav>
    );
}
