'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, updateProfile, getUserStats, handleLogout } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';
import { User, Mail, Lock, Save, Music, List, Heart, Edit, X, LogOut } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';

export default function ProfilePage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({ songs: 0, setlists: 0, favorites: 0 });
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Formulario
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        setTitle('Mi Perfil');
        setShowBack(false);
        loadData();
    }, [setTitle, setShowBack]);

    const loadData = async () => {
        setLoading(true);
        try {
            const userData = await getCurrentUser();
            if (!userData) {
                router.push('/login');
                return;
            }
            setUser(userData);
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                password: '',
                confirmPassword: '',
            });

            const statsData = await getUserStats();
            setStats(statsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            setSaving(false);
            return;
        }

        if (formData.password && formData.password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setSaving(false);
            return;
        }

        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
            };
            if (formData.password) {
                updateData.password = formData.password;
            }

            await updateProfile(updateData);
            setSuccess('Perfil actualizado correctamente');
            await loadData();
            setEditing(false);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoutClick = async () => {
        await handleLogout();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) return null;

    const statCards = [
        { label: 'Canciones', value: stats.songs, icon: Music, color: 'text-blue-500' },
        { label: 'Setlists', value: stats.setlists, icon: List, color: 'text-sky-500' },
        { label: 'Favoritos', value: stats.favorites, icon: Heart, color: 'text-red-500' },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-20 sm:pb-6">
            {/* Tarjeta de perfil */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header con gradiente */}
                <div className="relative h-24 sm:h-32 bg-gradient-to-r from-sky-500 to-blue-700">
                    <div className="absolute -bottom-14 left-1/2 sm:left-6 transform -translate-x-1/2 sm:translate-x-0">
                        <AvatarUpload currentAvatarUrl={user.avatarUrl} userName={user.name} />
                    </div>
                    <div className="absolute top-3 right-4 flex gap-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full shadow-sm ${user.role === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                            {user.role === 'admin' ? 'Administrador' : user.role === 'creator' ? 'Creador' : 'Usuario'}
                        </span>
                    </div>
                </div>

                {/* Info del usuario */}
                <div className="pt-20 sm:pt-16 px-4 sm:pl-36 sm:pr-6 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-4 h-4" /> {user.email}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Miembro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : 'hace poco'}
                            </p>
                        </div>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                        >
                            {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                            {editing ? 'Cancelar' : 'Editar perfil'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-3 mt-6">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 text-center">
                        <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Formulario de edición */}
            {editing && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Editar perfil</h3>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tu nombre"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="usuario@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nueva contraseña (opcional)
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    minLength={6}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nueva contraseña (mínimo 6 caracteres)"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Confirmar nueva contraseña"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> Guardar cambios
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(false);
                                    setError('');
                                    setSuccess('');
                                    setFormData({
                                        name: user.name,
                                        email: user.email,
                                        password: '',
                                        confirmPassword: '',
                                    });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Acciones adicionales */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleLogoutClick}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition text-sm font-medium flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
            </div>
        </div>
    );
}
