'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/ThemeProvider';
import { useTitle } from '@/lib/TitleContext';
import { getCurrentUser } from '@/app/actions/auth';
import { getUserSetlists } from '@/app/actions/setlists';
import { getDashboardStats } from '@/app/actions/songs';
import { getChordsCount } from '@/app/actions/chords';
import {
    Music,
    Guitar,
    ListMusic,
    Heart,
    ArrowRight,
    PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { InstallAppButton } from '@/components/InstallAppButton';
import { canCreateContent } from '@/lib/permissions';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

// Componente para tarjeta de estadística
function StatCard({
    icon: Icon,
    label,
    value,
    color
}: {
    icon: any;
    label: string;
    value: number | string;
    color: string;
}) {
    return (
        <div className="app-card p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-app">{value}</p>
                <p className="text-sm text-app-muted">{label}</p>
            </div>
        </div>
    );
}

// Componente para acceso rápido
function QuickAccessCard({
    href,
    icon: Icon,
    title,
    description,
    color
}: {
    href: string;
    icon: any;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <Link
            href={href}
            className="app-card p-4 flex items-start justify-between hover:app-glow-primary transition group"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-app">{title}</h3>
                    <p className="text-sm text-app-muted">{description}</p>
                </div>
            </div>
            <ArrowRight className="w-5 h-5 text-app-muted group-hover:text-[var(--color-primary)] transition" />
        </Link>
    );
}

export default function HomePage() {
    const router = useRouter();
    const { theme } = useTheme();
    const { setTitle, setShowBack } = useTitle();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        songs: 0,
        chords: 0,
        setlists: 0,
        favorites: 0,
    });
    const [recentSetlists, setRecentSetlists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOnline } = useNetworkStatus();

    useEffect(() => {
        setTitle('Tu Cancionero');
        setShowBack(false);
    }, [setTitle, setShowBack]);

    useEffect(() => {
        const loadData = async () => {
            if (!isOnline) {
                try {
                    const { getOfflineConfig, getOfflineSetlists } = await import('@/lib/offline-db');
                    const [config, setlistsOffline] = await Promise.all([
                        getOfflineConfig(),
                        getOfflineSetlists()
                    ]);
                    setUser({ name: 'Modo Offline' });
                    setRecentSetlists(setlistsOffline.slice(0, 3));
                    setStats({
                        songs: config.songCount,
                        chords: config.chordCount,
                        setlists: config.setlistCount,
                        favorites: config.favoriteCount,
                    });
                } catch (error) {
                    console.error('Error loading offline dashboard data:', error);
                } finally {
                    setLoading(false);
                }
                return;
            }

            try {
                const [userData, setlistsData, songStats, chordsTotal] = await Promise.all([
                    getCurrentUser(),
                    getUserSetlists(),
                    getDashboardStats(),
                    getChordsCount(),
                ]);

                setUser(userData);
                setRecentSetlists(setlistsData.slice(0, 3));
                setStats({
                    songs: songStats.songs,
                    chords: chordsTotal,
                    setlists: setlistsData.length,
                    favorites: songStats.favorites,
                });
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [isOnline]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
            {/* Saludo */}
            <div className="bg-app-primary-gradient rounded-2xl shadow-lg p-6 text-white app-glow-primary">
                <h2 className="text-2xl font-bold">
                    ¡Bienvenido{user?.name ? `, ${user.name}` : ''}! 👋
                </h2>
                <p className="text-white/80 mt-1">
                    Organiza tus canciones, acordes y listas desde un solo lugar.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        onClick={() => router.push('/canciones')}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                    >
                        <Music className="w-3.5 h-3.5" /> Explorar canciones
                    </button>
                    {canCreateContent(user) && (
                        <button
                            onClick={() => router.push('/canciones/nueva')}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                        >
                            <PlusCircle className="w-3.5 h-3.5" /> Agregar canción
                        </button>
                    )}
                    <InstallAppButton />
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    icon={Music}
                    label="Canciones"
                    value={stats.songs}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Guitar}
                    label="Acordes"
                    value={stats.chords}
                    color="bg-green-500"
                />
                <StatCard
                    icon={ListMusic}
                    label="Setlists"
                    value={stats.setlists}
                    color="bg-sky-500"
                />
                <StatCard
                    icon={Heart}
                    label="Favoritos"
                    value={stats.favorites}
                    color="bg-red-500"
                />
            </div>

            {/* Accesos rápidos */}
            <div>
                <h3 className="text-lg font-semibold text-app mb-3">
                    Accesos rápidos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <QuickAccessCard
                        href="/canciones"
                        icon={Music}
                        title="Canciones"
                        description="Explora tu cancionero"
                        color="bg-blue-500"
                    />
                    <QuickAccessCard
                        href="/acordes"
                        icon={Guitar}
                        title="Acordes"
                        description="Busca y aprende acordes"
                        color="bg-green-500"
                    />
                    <QuickAccessCard
                        href="/setlists"
                        icon={ListMusic}
                        title="Setlists"
                        description="Organiza tus listas"
                        color="bg-sky-500"
                    />
                    <QuickAccessCard
                        href="/favoritos"
                        icon={Heart}
                        title="Favoritos"
                        description="Tus canciones favoritas"
                        color="bg-red-500"
                    />
                </div>
            </div>

            {/* Setlists recientes */}
            {recentSetlists.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-app">
                            Setlists recientes
                        </h3>
                        <Link
                            href="/setlists"
                            className="text-sm text-[var(--color-primary)] hover:underline"
                        >
                            Ver todos
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {recentSetlists.map((setlist) => (
                            <Link
                                key={setlist.id}
                                href={`/setlists/${setlist.id}`}
                                className="app-card p-4 hover:app-glow-primary transition block"
                            >
                                <h4 className="font-semibold text-app">
                                    {setlist.name}
                                </h4>
                                {setlist.description && (
                                    <p className="text-sm text-app-muted mt-1 line-clamp-2">
                                        {setlist.description}
                                    </p>
                                )}
                                <p className="text-xs text-app-muted mt-2">
                                    {setlist.songCount || 0} canciones
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Tema actual */}
            <div className="app-card p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-app">
                            Tema actual: {theme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
                        </p>
                        <p className="text-xs text-app-muted mt-1">
                            Puedes cambiar el tema desde el menú de usuario
                        </p>
                    </div>
                    <div className="text-4xl">
                        {theme === 'dark' ? '🌙' : '☀️'}
                    </div>
                </div>
            </div>
        </div>
    );
}
