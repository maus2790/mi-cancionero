'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { addSongToSetlist, createSetlist } from '@/app/actions/setlists';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AddToSetlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    songId: number;
    songTitle: string;
    existingSetlists: any[];
    currentTransposition: number;
    currentFontSize: 'small' | 'medium' | 'large' | 'xlarge';
    onSuccess?: () => void;
}

export function AddToSetlistModal({
    isOpen,
    onClose,
    songId,
    songTitle,
    existingSetlists,
    currentTransposition,
    currentFontSize,
    onSuccess,
}: AddToSetlistModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSetlistId, setSelectedSetlistId] = useState<number | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let setlistId = selectedSetlistId;

            if (isCreatingNew) {
                if (!newListName.trim()) {
                    setError('El nombre de la lista es obligatorio');
                    setLoading(false);
                    return;
                }
                const newSetlist = await createSetlist({
                    name: newListName.trim(),
                    description: newListDescription.trim() || undefined,
                });
                setlistId = newSetlist.id;
            }

            if (!setlistId) {
                setError('Selecciona una lista o crea una nueva');
                setLoading(false);
                return;
            }

            await addSongToSetlist({
                setlistId,
                songId,
                transposition: currentTransposition,
                fontSize: currentFontSize,
            });

            router.refresh();
            toast.success('Canción agregada a la lista');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al agregar la canción');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="app-card rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                    <h2 className="text-xl font-bold text-app">
                        Agregar a lista
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-[var(--color-border)] transition"
                    >
                        <X className="w-6 h-6 text-app-muted" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <p className="text-sm text-app-muted">
                        Agregando <span className="font-semibold text-app">"{songTitle}"</span> a una lista
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Selector de lista */}
                    <div>
                        <label className="block text-sm font-medium text-app mb-2">
                            Seleccionar lista
                        </label>
                        <div className="space-y-2">
                            {existingSetlists.length > 0 && (
                                <div className="space-y-2">
                                    {existingSetlists.map((list) => (
                                        <label
                                            key={list.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${!isCreatingNew && selectedSetlistId === list.id
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                                : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="setlist"
                                                checked={!isCreatingNew && selectedSetlistId === list.id}
                                                onChange={() => {
                                                    setIsCreatingNew(false);
                                                    setSelectedSetlistId(list.id);
                                                }}
                                                className="w-4 h-4 text-[var(--color-primary)]"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-app">
                                                    {list.name}
                                                </p>
                                                {list.description && (
                                                    <p className="text-sm text-app-muted">
                                                        {list.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-app-muted">
                                                    {list.songCount || 0} canciones
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Opción: crear nueva */}
                            <label
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition ${isCreatingNew
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="setlist"
                                    checked={isCreatingNew}
                                    onChange={() => {
                                        setIsCreatingNew(true);
                                        setSelectedSetlistId(null);
                                    }}
                                    className="w-4 h-4 text-[var(--color-primary)]"
                                />
                                <div className="flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-[var(--color-primary)]" />
                                    <span className="font-medium text-[var(--color-primary)]">Crear nueva lista</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Campos para nueva lista */}
                    {isCreatingNew && (
                        <div className="space-y-3 p-3 bg-[var(--color-border)]/20 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-app mb-1">
                                    Nombre de la lista *
                                </label>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="app-input w-full px-3 py-2 rounded-lg"
                                    placeholder="Ej: Culto de adoración"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-app mb-1">
                                    Descripción (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={newListDescription}
                                    onChange={(e) => setNewListDescription(e.target.value)}
                                    className="app-input w-full px-3 py-2 rounded-lg"
                                    placeholder="Descripción de la lista"
                                />
                            </div>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-[var(--color-border)] text-app rounded-lg hover:opacity-80 transition font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 app-button px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
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
