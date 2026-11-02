'use client';

import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { createEnganchadoTag, updateEnganchadoTag, deleteEnganchadoTag } from '@/app/actions/songs';
import toast from 'react-hot-toast';

interface EnganchadosModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: string[];
    onTagsChanged: () => void;
}

export function EnganchadosModal({
    isOpen,
    onClose,
    tags,
    onTagsChanged,
}: EnganchadosModalProps) {
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingTag, setEditingTag] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    if (!isOpen) return null;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newTag.trim();
        if (!trimmed) return;

        setLoading(true);
        try {
            const res = await createEnganchadoTag(trimmed);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Etiqueta creada');
                setNewTag('');
                onTagsChanged();
            }
        } catch {
            toast.error('Error al crear la etiqueta');
        } finally {
            setLoading(false);
        }
    };

    const handleStartEdit = (tag: string) => {
        setEditingTag(tag);
        setEditValue(tag);
    };

    const handleSaveEdit = async (oldTag: string) => {
        const trimmed = editValue.trim();
        if (!trimmed || trimmed === oldTag) {
            setEditingTag(null);
            return;
        }

        setLoading(true);
        try {
            const res = await updateEnganchadoTag(oldTag, trimmed);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Etiqueta actualizada en todas las canciones');
                setEditingTag(null);
                onTagsChanged();
            }
        } catch {
            toast.error('Error al actualizar la etiqueta');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (tag: string) => {
        if (!window.confirm(`¿Seguro que deseas eliminar la etiqueta "${tag}"? Se quitará de todas las canciones que la tengan.`)) {
            return;
        }

        setLoading(true);
        try {
            const res = await deleteEnganchadoTag(tag);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Etiqueta eliminada');
                onTagsChanged();
            }
        } catch {
            toast.error('Error al eliminar la etiqueta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="app-card w-full max-w-md p-5 rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
                {/* Cabecera */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                    <div>
                        <h3 className="text-base font-semibold text-app flex items-center gap-2">
                            <span>🔗</span> Etiquetas de Enganchados
                        </h3>
                        <p className="text-xs text-app-muted mt-0.5">
                            Crea, renombra o elimina etiquetas de popurrís y mezclas.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                        aria-label="Cerrar modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario para crear nueva etiqueta */}
                <form onSubmit={handleCreate} className="flex gap-2 my-4">
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Nueva etiqueta (ej. Fuego I)..."
                        className="app-input flex-1 px-3 py-2 text-sm rounded-lg"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !newTag.trim()}
                        className="app-button px-3 py-2 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir
                    </button>
                </form>

                {/* Lista de etiquetas */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {tags.length === 0 ? (
                        <div className="text-center py-8 text-sm text-app-muted">
                            No hay etiquetas de enganchados aún. Crea la primera arriba.
                        </div>
                    ) : (
                        tags.map((tag) => (
                            <div
                                key={tag}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] gap-2"
                            >
                                {editingTag === tag ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="app-input flex-1 px-2.5 py-1 text-sm rounded"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(tag);
                                                if (e.key === 'Escape') setEditingTag(null);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSaveEdit(tag)}
                                            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-950/40 rounded transition"
                                            title="Guardar cambio"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTag(null)}
                                            className="p-1.5 text-app-muted hover:bg-[var(--color-border)] rounded transition"
                                            title="Cancelar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-medium text-sm text-app flex items-center gap-1.5 truncate">
                                            <span className="text-amber-500">🔗</span>
                                            {tag}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(tag)}
                                                className="p-1.5 rounded text-app-muted hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition"
                                                title="Renombrar etiqueta"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(tag)}
                                                className="p-1.5 rounded text-app-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                                title="Eliminar etiqueta"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Pie del modal */}
                <div className="pt-3 mt-3 border-t border-[var(--color-border)] flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-lg app-card hover:bg-[var(--color-border)] text-app transition"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}
