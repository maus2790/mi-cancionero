'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    getUserSetlists,
    deleteSetlist,
    updateSetlist,
    getSetlistById,
    addSongToSetlist,
    removeSongFromSetlist,
    reorderSetlistSongs,
    getPublicSetlists,
} from '@/app/actions/setlists';
import { getSongs } from '@/app/actions/songs';
import { getCurrentUser } from '@/app/actions/auth';
import {
    Edit, Trash2, Plus, Music, X, Guitar, Headphones,
    MicVocal, Disc3, Radio, GripVertical, Loader2, Globe, Lock, MoreVertical,
} from 'lucide-react';
import { useTitle } from '@/lib/TitleContext';
import toast from 'react-hot-toast';
import { getSetlistAppearance } from '@/lib/setlistAppearance';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useOfflineMode } from '@/lib/hooks/useOfflineMode';
import { getOfflineSetlists, getOfflineSongs } from '@/lib/offline-db';

const setlistIcons = {
    music: Music, guitar: Guitar, headphones: Headphones,
    mic: MicVocal, disc: Disc3, radio: Radio,
};
const setlistColors: Record<string, string> = {
    sky: 'from-sky-400 to-blue-600',
    violet: 'from-violet-400 to-indigo-600',
    rose: 'from-rose-400 to-pink-600',
    amber: 'from-amber-400 to-orange-600',
    emerald: 'from-emerald-400 to-teal-600',
    indigo: 'from-indigo-400 to-blue-700',
};

type SetlistEntry = { id: number; songId: number; order: number; song: any };

export default function SetlistsPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();

    const [setlists, setSetlists] = useState<any[]>([]);
    const [publicSetlists, setPublicSetlists] = useState<any[]>([]);
    const [isGuest, setIsGuest] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [allSongs, setAllSongs] = useState<any[]>([]);

    const [showModal, setShowModal] = useState(false);
    const [editingList, setEditingList] = useState<any | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editSongs, setEditSongs] = useState<SetlistEntry[]>([]);
    const [loadingSongs, setLoadingSongs] = useState(false);
    const [saving, setSaving] = useState(false);

    const dragIndex = useRef<number | null>(null);
    const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const { isOnline } = useNetworkStatus();
    const { isSectionOffline } = useOfflineMode();

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const loadSetlists = async () => {
        if (!isOnline) {
            try {
                const user = await getCurrentUser();
                const { getOfflineSetlists } = await import('@/lib/offline-db');
                const offlineData = await getOfflineSetlists();
                
                const withCounts = offlineData.map(list => ({
                    ...list,
                    songCount: list.songs ? list.songs.length : 0
                }));

                setSetlists(withCounts.filter(list => list.userId === user?.id));
                setPublicSetlists(withCounts.filter(list => list.userId !== user?.id && list.isPublic));
            } catch (e) {}
            setPageLoading(false);
            return;
        }

        try {
            const user = await getCurrentUser();
            setIsGuest(user?.provider === 'guest');
            const [data, publicData] = await Promise.all([
                user?.provider === 'guest' ? [] : getUserSetlists(),
                getPublicSetlists()
            ]);
            setSetlists(data);
            setPublicSetlists(publicData);
        } catch (e) {
            console.error(e);
        }
        setPageLoading(false);
    };

    useEffect(() => {
        setTitle('Mis Setlists');
        setShowBack(false);
        loadSetlists();
        if (isOnline) {
            getSongs('', 1, 2000).then(d => setAllSongs(d.items)).catch(() => {});
        } else {
            getOfflineSongs().then(d => setAllSongs(d)).catch(() => {});
        }
    }, [setTitle, setShowBack, isOnline]);

    const handleEdit = async (list: any) => {
        setEditingList(list);
        setEditName(list.name);
        setEditDescription(list.description || '');
        setEditIsPublic(list.isPublic ?? true);
        setEditSongs([]);
        setShowModal(true);
        setLoadingSongs(true);
        try {
            const full = await getSetlistById(list.id);
            setEditSongs(full.songs as SetlistEntry[]);
            setEditIsPublic(full.isPublic ?? true);
        } catch {
            toast.error('Error al cargar las canciones de la lista');
        } finally {
            setLoadingSongs(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingList(null);
        setEditSongs([]);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        dragIndex.current = index;
        setDraggingIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndex.current === null || dragIndex.current === index) return;
        const next = [...editSongs];
        const [item] = next.splice(dragIndex.current, 1);
        next.splice(index, 0, item);
        dragIndex.current = index;
        setDraggingIdx(index);
        setEditSongs(next);
    };

    const handleDragEnd = () => {
        dragIndex.current = null;
        setDraggingIdx(null);
    };

    const handleRemoveSong = (setlistSongId: number) => {
        setEditSongs(prev => prev.filter(s => s.id !== setlistSongId));
    };

    const handleAddSong = async (songId: string) => {
        if (!songId || !editingList) return;
        const numId = Number(songId);
        if (editSongs.some(s => s.songId === numId)) return;
        try {
            const newEntry = await addSongToSetlist({ setlistId: editingList.id, songId: numId });
            const song = allSongs.find(s => s.id === numId);
            if (song) {
                setEditSongs(prev => [
                    ...prev,
                    { id: newEntry.id, songId: numId, order: prev.length, song },
                ]);
            }
        } catch (e: any) {
            toast.error(e.message || 'Error al añadir canción');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingList) return;
        setSaving(true);
        try {
            await updateSetlist(editingList.id, {
                name: editName,
                description: editDescription,
                isPublic: editIsPublic,
            });

            const current = await getSetlistById(editingList.id);
            const currentIds = new Set(current.songs.map((s: any) => s.id));
            const keepIds = new Set(editSongs.map(s => s.id));

            const toRemove = [...currentIds].filter(id => !keepIds.has(id));
            for (const id of toRemove) {
                await removeSongFromSetlist(id);
            }

            const remainingIds = editSongs.filter(s => keepIds.has(s.id)).map(s => s.id);
            if (remainingIds.length > 0) {
                await reorderSetlistSongs(editingList.id, remainingIds);
            }

            toast.success('Lista guardada correctamente');
            handleCloseModal();
            await loadSetlists();
        } catch (e: any) {
            toast.error(e.message || 'Error al guardar la lista');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta lista?')) return;
        try {
            await deleteSetlist(id);
            await loadSetlists();
            toast.success('Lista eliminada');
        } catch {
            toast.error('No se pudo eliminar la lista');
        }
    };

    const availableSongs = allSongs.filter(s => !editSongs.some(e => e.songId === s.id));

    if (pageLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
            </div>
        );
    }

    const renderSetlistGrid = (lists: any[], isPublicSection: boolean) => {
        if (lists.length === 0) {
            return (
                <div className="text-center py-12 text-app-muted">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>{isPublicSection ? 'No hay listas públicas aún.' : 'No tienes listas aún. Crea una nueva.'}</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list) => {
                    const appearance = getSetlistAppearance(list.id, list.icon, list.color);
                    const Icon = setlistIcons[appearance.icon as keyof typeof setlistIcons] || Music;
                    const colorClass = setlistColors[appearance.color] || setlistColors.sky;
                    return (
                        <div
                            key={list.id}
                            className="app-card rounded-2xl hover:shadow-xl hover:-translate-y-0.5 transition cursor-pointer group relative overflow-hidden"
                        >
                            <div onClick={() => router.push(`/setlists/${list.id}`)} className="flex gap-4 p-5">
                                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${colorClass} text-white shadow-lg`}>
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div className="min-w-0 flex-1 pr-10">
                                    <h3 className="font-semibold text-lg text-app truncate">{list.name}</h3>
                                    {list.description && (
                                        <p className="text-sm text-app-muted mt-1 line-clamp-2">{list.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <p className="text-xs font-medium text-[var(--color-primary)]">{list.songCount || 0} canciones</p>
                                        {!isPublicSection && list.isPublic === false && (
                                            <span className="inline-flex items-center gap-1 text-xs text-app-muted">
                                                <Lock className="w-3 h-3" /> Privada
                                            </span>
                                        )}
                                        {isPublicSection && list.userName && (
                                            <span className="inline-flex items-center gap-1 text-xs text-app-muted">
                                                • de {list.userName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isPublicSection && (
                                <div className="absolute top-2 right-2" ref={openMenuId === list.id ? menuRef : null}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === list.id ? null : list.id);
                                        }}
                                        className="p-1.5 rounded-lg app-glass text-app-muted hover:text-app shadow-sm transition"
                                        title="Opciones"
                                        aria-label="Opciones"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openMenuId === list.id && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 top-8 w-44 app-card rounded-xl shadow-xl overflow-hidden z-50"
                                        >
                                            <button
                                                onClick={() => { setOpenMenuId(null); handleEdit(list); }}
                                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-app hover:bg-[var(--color-border)] transition"
                                            >
                                                <Edit className="w-4 h-4 text-[var(--color-primary)]" /> Editar
                                            </button>
                                            <button
                                                onClick={() => { setOpenMenuId(null); handleDelete(list.id); }}
                                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            >
                                                <Trash2 className="w-4 h-4" /> Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 pb-24 sm:pb-6">

            {!isGuest && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-app mb-6">Mis Setlists</h2>
                    {renderSetlistGrid(setlists, false)}
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-app mb-6">Setlists Públicos</h2>
                {renderSetlistGrid(publicSetlists, true)}
            </div>

            {!isGuest && (
                <button
                    onClick={() => router.push('/setlists/nueva')}
                    className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 app-button p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
                    aria-label="Nueva lista"
                >
                    <Plus className="w-6 h-6" />
                </button>
            )}

            {/* Modal de edición */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="app-card rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                        {/* header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] flex-shrink-0">
                            <h3 className="text-xl font-bold text-app">Editar Setlist</h3>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition">
                                <X className="w-5 h-5 text-app-muted" />
                            </button>
                        </div>

                        {/* body */}
                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

                            {/* nombre */}
                            <div>
                                <label className="block text-sm font-medium text-app mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="app-input w-full px-3 py-2 rounded-lg"
                                />
                            </div>

                            {/* descripción */}
                            <div>
                                <label className="block text-sm font-medium text-app mb-1">Descripción (opcional)</label>
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="app-input w-full px-3 py-2 rounded-lg"
                                />
                            </div>

                            {/* visibilidad */}
                            <div
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${editIsPublic
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-[var(--color-border)] bg-[var(--color-border)]/30'
                                    }`}
                                onClick={() => setEditIsPublic(p => !p)}
                            >
                                <div className={`p-2 rounded-lg flex-shrink-0 ${editIsPublic ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-app-muted'}`}>
                                    {editIsPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-app">
                                        {editIsPublic ? 'Lista pública' : 'Lista privada'}
                                    </p>
                                    <p className="text-xs text-app-muted">
                                        {editIsPublic ? 'Visible para todos los usuarios' : 'Solo visible para ti'}
                                    </p>
                                </div>
                            </div>

                            {/* canciones */}
                            <div>
                                <h4 className="text-sm font-semibold text-app mb-2">Canciones de la Setlist</h4>

                                {loadingSongs ? (
                                    <div className="flex items-center justify-center py-6 gap-2 text-app-muted">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Cargando canciones…</span>
                                    </div>
                                ) : editSongs.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-[var(--color-border)] rounded-xl text-app-muted text-sm">
                                        <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        Esta lista no tiene canciones aún
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {editSongs.map((entry, index) => (
                                            <div
                                                key={entry.id}
                                                draggable
                                                onDragStart={e => handleDragStart(e, index)}
                                                onDragOver={e => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all select-none ${draggingIdx === index
                                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md scale-[1.01]'
                                                    : 'border-[var(--color-border)] bg-[var(--color-border)]/20 hover:bg-[var(--color-border)]/40'
                                                    }`}
                                            >
                                                <div className="cursor-grab active:cursor-grabbing text-app-muted hover:text-app flex-shrink-0">
                                                    <GripVertical className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-app truncate">
                                                        {entry.song?.title ?? '—'}
                                                    </p>
                                                    {entry.song?.artist && (
                                                        <p className="text-xs text-app-muted truncate">{entry.song.artist}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-app-muted font-mono flex-shrink-0 w-5 text-right">{index + 1}</span>
                                                <button
                                                    onClick={() => handleRemoveSong(entry.id)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex-shrink-0"
                                                    title="Quitar de la lista"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!loadingSongs && (
                                    <div className="mt-3">
                                        <label className="block text-xs font-medium text-app-muted mb-1">Agregar canción</label>
                                        <select
                                            value=""
                                            onChange={e => handleAddSong(e.target.value)}
                                            className="app-input w-full px-3 py-2 rounded-lg text-sm"
                                        >
                                            <option value="">
                                                {availableSongs.length === 0 ? 'No hay canciones disponibles' : '+ Seleccionar una canción…'}
                                            </option>
                                            {availableSongs.map(song => (
                                                <option key={song.id} value={song.id}>
                                                    {song.title}{song.artist ? ` — ${song.artist}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-[var(--color-border)] flex-shrink-0">
                            <button
                                onClick={handleCloseModal}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-[var(--color-border)] text-app rounded-lg hover:opacity-80 transition font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving || !editName.trim()}
                                className="flex-1 app-button px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
