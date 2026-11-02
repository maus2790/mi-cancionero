'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllUsers, createUser, updateUser, deleteUser } from '@/app/actions/admin';
import { getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';
import { User, Shield, ShieldOff, Trash2, RefreshCw, Plus, Edit, X, Search } from 'lucide-react';

// Función para formatear fecha de forma segura
const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Modal para crear/editar usuario (igual que antes, sin cambios)
function UserFormModal({
    isOpen,
    onClose,
    onSuccess,
    user,
    title,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: any;
    title: string;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || 'user',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                role: user.role || 'user',
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'user',
            });
        }
    }, [user]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (user) {
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await updateUser(user.id, updateData);
            } else {
                if (!formData.password) {
                    setError('La contraseña es obligatoria');
                    setLoading(false);
                    return;
                }
                await createUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar el usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre completo *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre del usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="usuario@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {user ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                            minLength={6}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder={user ? 'Dejar vacío para mantener' : 'Mínimo 6 caracteres'}
                        />
                        {user && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Dejar vacío para mantener la contraseña actual
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rol
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="user">Usuario</option>
                            <option value="creator">Creador</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const limit = 10;

    // Debounce para búsqueda (300ms)
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        setTitle('Administrar Usuarios');
        setShowBack(true);
    }, [setTitle, setShowBack]);

    useEffect(() => {
        loadData();
    }, [debouncedSearch, page]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const user = await getCurrentUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUserId(user.id);

            const data = await getAllUsers(debouncedSearch || undefined, page, limit);
            setUsers(data.items);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            if (err.message === 'Acceso denegado: se requieren permisos de administrador') {
                router.push('/dashboard');
            } else {
                setError(err.message || 'Error al cargar usuarios');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (confirm(`¿Cambiar rol de usuario a ${newRole}?`)) {
            try {
                await updateUser(userId, { role: newRole });
                await loadData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleDelete = async (userId: number, userName: string) => {
        if (confirm(`¿Eliminar permanentemente a "${userName}" y todos sus datos?`)) {
            try {
                await deleteUser(userId);
                await loadData();
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        loadData();
    };

    const handleEditSuccess = () => {
        setEditingUser(null);
        loadData();
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
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Encabezado con buscador y botón crear */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Usuarios ({users.length})
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Usuario
                    </button>
                    <button
                        onClick={loadData}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Fecha registro</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-800 dark:text-white truncate max-w-[120px] sm:max-w-none">
                                                {user.name}
                                            </span>
                                            <span className="text-xs text-gray-400 sm:hidden">
                                                {user.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                                        {user.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                                            {user.id !== currentUserId && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 hover:text-blue-600"
                                                        title="Editar usuario"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRoleChange(user.id, user.role || 'user')}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 hover:text-blue-600"
                                                        title="Cambiar rol"
                                                    >
                                                        {user.role === 'admin' ? (
                                                            <ShieldOff className="w-4 h-4" />
                                                        ) : (
                                                            <Shield className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.name)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-gray-500 hover:text-red-500"
                                                        title="Eliminar usuario"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {user.id === currentUserId && (
                                                <span className="text-xs text-gray-400">(tú)</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {debouncedSearch ? 'No se encontraron usuarios con esa búsqueda' : 'No hay usuarios registrados'}
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 text-sm"
                    >
                        Anterior
                    </button>
                    <span className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border text-sm">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50 text-sm"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* Modal crear usuario */}
            <UserFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
                title="Crear Usuario"
            />

            {/* Modal editar usuario */}
            {editingUser && (
                <UserFormModal
                    isOpen={true}
                    onClose={() => setEditingUser(null)}
                    onSuccess={handleEditSuccess}
                    user={editingUser}
                    title={`Editar Usuario: ${editingUser.name}`}
                />
            )}
        </div>
    );
}
