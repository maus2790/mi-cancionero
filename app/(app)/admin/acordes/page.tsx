'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllChordsAdmin, deleteChordAdmin } from '@/app/actions/admin';
import { useTitle } from '@/lib/TitleContext';
import { Guitar, Trash2, RefreshCw, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AdminChordsPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [chords, setChords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setTitle('Administrar Acordes');
        setShowBack(true);
        loadData();
    }, [setTitle, setShowBack]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllChordsAdmin();
            setChords(data);
        } catch (err: any) {
            if (err.message === 'Acceso denegado: se requieren permisos de administrador') {
                router.push('/dashboard');
            } else {
                setError(err.message || 'Error al cargar acordes');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (chordId: number, chordName: string) => {
        if (confirm(`¿Eliminar el acorde "${chordName}" permanentemente?`)) {
            try {
                await deleteChordAdmin(chordId);
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
                    Acordes ({chords.length})
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Raíz</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {chords.map((chord) => (
                                <tr key={chord.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-gray-800 dark:text-white">{chord.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{chord.root}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{chord.type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{chord.userId || 'Global'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        {chord.createdAt ? new Date(chord.createdAt).toLocaleDateString('es-ES') : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(chord.id, chord.name)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-gray-500 hover:text-red-500"
                                            title="Eliminar acorde"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {chords.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay acordes registrados
                    </div>
                )}
            </div>
        </div>
    );
}