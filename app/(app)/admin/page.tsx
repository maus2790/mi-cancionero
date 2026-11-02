'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminStats } from '@/app/actions/admin';
import { getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';
import { Users, Music, List, Guitar, Heart, TrendingUp, Calendar } from 'lucide-react';

// Componente de tarjeta de estadísticas
function StatsCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [recentSongs, setRecentSongs] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        setTitle('Panel de Administración');
        setShowBack(false);
        loadData();
    }, [setTitle, setShowBack]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Verificar autenticación y rol
            const user = await getCurrentUser();
            if (!user) {
                router.push('/login');
                return;
            }
            // Obtener estadísticas
            const data = await getAdminStats();
            setStats(data.stats);
            setRecentUsers(data.recentUsers);
            setRecentSongs(data.recentSongs);
        } catch (err: any) {
            if (err.message === 'Acceso denegado: se requieren permisos de administrador') {
                router.push('/dashboard');
            } else {
                setError(err.message || 'Error al cargar los datos');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p>{error}</p>
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        { title: 'Usuarios', value: stats.users, icon: Users, color: 'bg-blue-500' },
        { title: 'Canciones', value: stats.songs, icon: Music, color: 'bg-green-500' },
        { title: 'Setlists', value: stats.setlists, icon: List, color: 'bg-purple-500' },
        { title: 'Acordes', value: stats.chords, icon: Guitar, color: 'bg-orange-500' },
        { title: 'Favoritos', value: stats.favorites, icon: Heart, color: 'bg-red-500' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Dashboard
            </h1>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {statCards.map((card) => (
                    <StatsCard key={card.title} {...card} />
                ))}
            </div>

            {/* Actividad reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usuarios recientes */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Usuarios recientes</h3>
                    </div>
                    {recentUsers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay usuarios</p>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recentUsers.map((user: any) => (
                                <li key={user.id} className="py-2 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-white">{user.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {user.role || 'user'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Canciones recientes */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Music className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Canciones recientes</h3>
                    </div>
                    {recentSongs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay canciones</p>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {recentSongs.map((song: any) => (
                                <li key={song.id} className="py-2">
                                    <p className="font-medium text-gray-800 dark:text-white">{song.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{song.artist || 'Sin artista'}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}