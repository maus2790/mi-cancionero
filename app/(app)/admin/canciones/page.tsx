'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllSongs, deleteSongAdmin } from '@/app/actions/admin';
import { useTitle } from '@/lib/TitleContext';
import { Music, Trash2, RefreshCw, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AdminSongsPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setTitle('Administrar Canciones');
        setShowBack(true);
        loadData();
    }, [setTitle, setShowBack]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllSongs();
            setSongs(data);
        } catch (err: any) {
            if (err.message === 'Acceso denegado: se requieren permisos de administrador') {
                router.push('/dashboard');
            } else {
                setError(err.message || 'Error al cargar canciones');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (songId: number, songTitle: string) => {
        if (confirm(`¿Eliminar la canción "${songTitle}" permanentemente?`)) {
            try {
                await deleteSongAdmin(songId);
                await loadData();
            } catch (err: any) {
                alert(err.message);
            }
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
                <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Canciones ({songs.length})
                </h2>
                <button onClick={loadData} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <RefreshCw className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artista</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {songs.map((song) => (
                                <tr key={song.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-4 py-3">
                                        <Link href={`/canciones/${song.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                            {song.title}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{song.artist || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{song.userId || 'Anónimo'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {song.createdAt ? new Date(song.createdAt).toLocaleDateString('es-ES') : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(song.id, song.title)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-gray-500 hover:text-red-500"
                                            title="Eliminar canción"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {songs.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay canciones registradas
                    </div>
                )}
            </div>
        </div>
    );
}