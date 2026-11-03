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
    ArrowLeft,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { getCurrentUser } from '@/app/actions/auth';

interface SidebarProps {
    isOpen: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function Sidebar({ isOpen, isCollapsed = false, onToggleCollapse }: SidebarProps) {
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
                z-30 transition-all duration-300
                ${isOpen ? (isCollapsed ? 'w-16' : 'w-64') : 'w-0 pointer-events-none'}
            `}
        >
            {/* Contenedor del contenido con borde derecho */}
            <div className="h-full w-full bg-app-surface border-r border-[var(--color-border)] flex flex-col justify-between overflow-y-auto overflow-x-hidden">
                <nav
                    className={`p-2 space-y-1 flex-1 ${isOpen ? 'opacity-100' : 'opacity-0'
                        } transition-opacity duration-200`}
                >
                    {currentNavItems.map(({ href, label, icon: Icon, isSpecial, isBack }: any) => {
                        const isActive = href === '/'
                            ? pathname === '/' || pathname === '/dashboard'
                            : pathname === href;

                        let baseClasses = 'flex items-center gap-3 rounded-xl transition group relative ';
                        baseClasses += isCollapsed ? 'justify-center p-3 ' : 'px-3.5 py-2.5 ';

                        if (isSpecial) {
                            baseClasses += 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5';
                        } else if (isBack) {
                            baseClasses += 'text-app-muted hover:bg-black/5 dark:hover:bg-white/5 mt-4 border-t pt-3';
                        } else if (isActive) {
                            baseClasses += 'bg-cyan-50 dark:bg-cyan-900/25 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm';
                        } else {
                            baseClasses += 'text-app-muted hover:text-app hover:bg-black/5 dark:hover:bg-white/5';
                        }

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={baseClasses}
                                title={isCollapsed ? label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium text-sm truncate">
                                        {label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Pequeño icono de <> al lado del sidebar para colapsar y retraerse */}
            {onToggleCollapse && (
                <button
                    onClick={onToggleCollapse}
                    className="absolute -right-3 top-13 z-40 w-6 h-6 rounded-full bg-app-surface border border-[var(--color-border)] shadow-md flex items-center justify-center text-app-muted hover:text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-200 active:scale-90"
                    title={isCollapsed ? "Expandir menú lateral (>)" : "Colapsar menú lateral (<)"}
                    aria-label={isCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                        <ChevronLeft className="w-3.5 h-3.5" />
                    )}
                </button>
            )}
        </aside>
    );
}
