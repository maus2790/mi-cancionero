'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Music,
    Guitar,
    List,
    Heart,
    Shield,
    Users,
    ArrowLeft
} from 'lucide-react';

import { getCurrentUser } from '@/app/actions/auth';

interface SidebarProps {
    isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
    const pathname = usePathname();

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const user = await getCurrentUser();
            if (user) {
                setIsAdmin(user.role === 'admin');
            }
        };

        checkAdmin();
    }, []);

    const isAdminRoute = pathname.startsWith('/admin');

    const adminNavItems = [
        { href: '/admin', label: 'Panel', icon: Shield },
        { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
        { href: '/admin/canciones', label: 'Canciones', icon: Music },
        { href: '/admin/acordes', label: 'Acordes', icon: Guitar },
        { href: '/admin/setlists', label: 'Setlists', icon: List },
        { href: '/', label: 'Volver a la App', icon: ArrowLeft, isBack: true },
    ];

    const mainNavItems = [
        ...(isAdmin ? [{ href: '/admin', label: 'Panel Admin', icon: Shield, isSpecial: true }] : []),
        { href: '/', label: 'Inicio', icon: Home },
        { href: '/canciones', label: 'Canciones', icon: Music },
        { href: '/acordes', label: 'Acordes', icon: Guitar },
        { href: '/setlists', label: 'Setlists', icon: List },
        { href: '/favoritos', label: 'Favoritos', icon: Heart },
    ];

    const currentNavItems = isAdminRoute ? adminNavItems : mainNavItems;

    return (
        <aside
            className={`
                fixed left-0 top-16 bottom-0
                bg-app-surface
                border-r
                overflow-y-auto transition-all duration-300
                ${isOpen ? 'w-64' : 'w-0'}
            `}
        >
            <nav
                className={`p-4 space-y-1 ${isOpen ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-200`}
            >
                {currentNavItems.map(({ href, label, icon: Icon, isSpecial, isBack }: any) => {
                    const isActive = href === '/'
                        ? pathname === '/' || pathname === '/dashboard'
                        : pathname === href;

                    let baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg transition ';
                    if (isSpecial) {
                        baseClasses += 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
                    } else if (isBack) {
                        baseClasses += 'text-app-muted hover:bg-black/5 dark:hover:bg-white/5 mt-4 border-t pt-3';
                    } else if (isActive) {
                        baseClasses += 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400';
                    } else {
                        baseClasses += 'text-app-muted hover:bg-black/5 dark:hover:bg-white/5';
                    }

                    return (
                        <Link key={href} href={href} className={baseClasses}>
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className={isOpen ? 'inline font-medium' : 'hidden'}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
