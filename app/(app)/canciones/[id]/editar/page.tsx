'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getSongById, saveSong, getDirectUploadUrl, getEnganchados } from '@/app/actions/songs';
import { getCurrentUser } from '@/app/actions/auth';
import { Clipboard, ClipboardCheck, Music, Trash2, X, Tag } from 'lucide-react';
import { EnganchadosModal } from '@/components/EnganchadosModal';
import { useTitle } from '@/lib/TitleContext';
import { NOTES } from '@/lib/constants';
import toast from 'react-hot-toast';

const STYLE_OPTIONS = ['', 'Gozo', 'Adoración', 'Contemporánea', 'Alabanza', 'Balada', 'Ritmo', 'Tradicional', 'Otros'];

const EXAMPLE_CONTENT = `Intro: [Gmaj7]-[A9]-[Bm7]-[A9]

[D]                         [D/C#]
A quién iré en necesidad
[Bm]                        [A9/F#]
A quién iré en busca de paz`;

export default function EditSongPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setOnBack, setShowBack } = useTitle();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [song, setSong] = useState<any>(null);
    const [removeAudio, setRemoveAudio] = useState(false);
    const [content, setContent] = useState('');
    const [pasted, setPasted] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [newAudioFile, setNewAudioFile] = useState<File | null>(null);
    const [newAudioPreviewUrl, setNewAudioPreviewUrl] = useState<string | null>(null);
    const [enganchadosList, setEnganchadosList] = useState<string[]>([]);
    const [showEnganchadosModal, setShowEnganchadosModal] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadSong = async () => {
            const data = await getSongById(Number(id));
            if (!data) {
                router.push('/canciones');
                return;
            }
            const user = await getCurrentUser();
            setSong(data);
            setCurrentUser(user);
            setContent(data.content || '');
            setLoading(false);
        };
        loadSong();
        getEnganchados().then(setEnganchadosList).catch(() => {});
    }, [id, router]);

    useEffect(() => {
        if (song) {
            setTitle(`Editar: ${song.title}`);
            setShowBack(true);
            setOnBack(() => router.push(`/canciones/${id}`));
        }
    }, [song, setTitle, setOnBack, setShowBack, id, router]);

    useEffect(() => {
        return () => {
            if (newAudioPreviewUrl) URL.revokeObjectURL(newAudioPreviewUrl);
        };
    }, [newAudioPreviewUrl]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError('');

        if (newAudioFile && newAudioFile.size > 20 * 1024 * 1024) {
            setError('El archivo de audio es demasiado grande. El límite máximo es 20 MB.');
            setSaving(false);
            return;
        }

        if (newAudioFile && !newAudioFile.type.startsWith('audio/') && !newAudioFile.name.toLowerCase().endsWith('.mpeg')) {
            setError('Por favor, selecciona un archivo de audio válido (no se permiten videos).');
            setSaving(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        formData.append('id', String(id));
        if (removeAudio) formData.append('removeAudio', 'true');

        try {
            if (newAudioFile) {
                const ext = newAudioFile.name.split('.').pop() || 'mp3';
                const { uploadUrl, publicUrl } = await getDirectUploadUrl('music', ext, newAudioFile.type);

                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: newAudioFile,
                    headers: { 'Content-Type': newAudioFile.type },
                });

                if (!uploadResponse.ok) {
                    throw new Error('Error al subir el archivo de audio directamente a la nube.');
                }

                formData.set('audioUrl', publicUrl);
            }

            const result = await saveSong(formData);
            if (result?.error) {
                setError(result.error);
                setSaving(false);
            } else {
                toast.success('Canción actualizada correctamente');
                router.push(`/canciones/${id}`);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al guardar la canción.');
            setSaving(false);
        }
    }

    const handleNewAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (newAudioPreviewUrl) URL.revokeObjectURL(newAudioPreviewUrl);
        if (file) {
            setNewAudioFile(file);
            setNewAudioPreviewUrl(URL.createObjectURL(file));
        } else {
            setNewAudioFile(null);
            setNewAudioPreviewUrl(null);
        }
    };

    const handleRemoveNewAudio = () => {
        if (newAudioPreviewUrl) URL.revokeObjectURL(newAudioPreviewUrl);
        setNewAudioFile(null);
        setNewAudioPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setContent(text);
                setPasted(true);
                setTimeout(() => setPasted(false), 3000);
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(text.length, text.length);
                }
            }
        } catch {
            alert('No se pudo acceder al portapapeles. Asegúrate de permitir el permiso.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (!song) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24 sm:pb-8">
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 app-card p-6">
                {/* Título y Artista */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            defaultValue={song.title}
                            className="app-input w-full px-4 py-2 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Artista
                        </label>
                        <input
                            type="text"
                            name="artist"
                            defaultValue={song.artist || ''}
                            className="app-input w-full px-4 py-2 rounded-lg"
                        />
                    </div>
                </div>

                {/* Tonalidad y Estilo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Tonalidad
                        </label>
                        <select
                            name="key"
                            defaultValue={(song.key || '').replace(/m$/, '')}
                            className="app-input w-full px-4 py-2 rounded-lg"
                        >
                            <option value="">Seleccionar</option>
                            {NOTES.map(note => (
                                <option key={note} value={note}>{note}</option>
                            ))}
                        </select>
                        <div className="mt-2 flex items-center gap-4 text-sm text-app">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="keyMode" value="major" defaultChecked={!song.key?.endsWith('m')} className="text-[var(--color-primary)]" /> Mayor
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="radio" name="keyMode" value="minor" defaultChecked={song.key?.endsWith('m')} className="text-[var(--color-primary)]" /> Menor
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Estilo
                        </label>
                        <select
                            name="style"
                            defaultValue={song.style || ''}
                            className="app-input w-full px-4 py-2 rounded-lg"
                        >
                            {STYLE_OPTIONS.map(style => (
                                <option key={style} value={style}>{style || 'Sin estilo'}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Enganchado */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-app">
                            Enganchado <span className="text-app-muted font-normal">(Opcional)</span>
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowEnganchadosModal(true)}
                            className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-0.5"
                            title="Gestionar etiquetas de enganchados"
                        >
                            <Tag className="w-3 h-3" /> Gestionar
                        </button>
                    </div>
                    <select
                        name="enganchado"
                        defaultValue={song.enganchado || ''}
                        className="app-input w-full px-4 py-2 rounded-lg"
                    >
                        <option value="">Sin etiqueta (canción normal)</option>
                        {enganchadosList.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                        {/* Si el enganchado actual no está en la lista oficial, mostrarlo igualmente */}
                        {song.enganchado && !enganchadosList.includes(song.enganchado) && (
                            <option value={song.enganchado}>{song.enganchado}</option>
                        )}
                    </select>
                </div>

                {/* Audio */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-app mb-2">
                        <Music className="w-4 h-4" />
                        Archivo de Audio
                    </label>

                    {/* Audio guardado existente */}
                    {song.audioUrl && !removeAudio && !newAudioPreviewUrl && (
                        <div className="flex items-center gap-3 p-3 app-card mb-2">
                            <audio src={song.audioUrl} controls className="flex-1 h-10" />
                            <button
                                type="button"
                                onClick={() => setRemoveAudio(true)}
                                className="shrink-0 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title="Eliminar audio actual"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {removeAudio && !newAudioPreviewUrl && (
                        <p className="text-xs text-orange-500 mb-2">
                            El audio actual será eliminado al guardar.
                            <button type="button" onClick={() => setRemoveAudio(false)} className="ml-2 underline">Deshacer</button>
                        </p>
                    )}

                    {newAudioPreviewUrl ? (
                        <div className="flex items-center gap-3 p-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 rounded-lg">
                            <audio src={newAudioPreviewUrl} controls className="flex-1 h-10" />
                            <button
                                type="button"
                                onClick={handleRemoveNewAudio}
                                className="shrink-0 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                title="Quitar nuevo audio"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="audio"
                            accept="audio/*,.mpeg,.mp3,.wav,.ogg,.m4a"
                            onChange={handleNewAudioChange}
                            className="app-input w-full px-4 py-2 rounded-lg file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
                        />
                    )}
                </div>

                {/* Video */}
                <div>
                    <label className="block text-sm font-medium text-app mb-1">
                        URL del Video (YouTube, etc.)
                    </label>
                    <input
                        type="url"
                        name="videoUrl"
                        defaultValue={song.videoUrl || ''}
                        className="app-input w-full px-4 py-2 rounded-lg"
                        placeholder="https://www.youtube.com/watch?v=..."
                    />
                </div>

                {/* Contenido */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-app">
                            Contenido (formato ChordPro) *
                        </label>
                        <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:opacity-80 transition"
                        >
                            {pasted ? (
                                <>
                                    <ClipboardCheck className="w-4 h-4" />
                                    Pegado ✓
                                </>
                            ) : (
                                <>
                                    <Clipboard className="w-4 h-4" />
                                    Pegar desde portapapeles
                                </>
                            )}
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        name="content"
                        required
                        rows={15}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="app-input w-full px-4 py-2 rounded-lg font-mono text-sm"
                        placeholder={EXAMPLE_CONTENT}
                    />
                </div>

                {/* Visibilidad */}
                {(!currentUser || currentUser.id === song.userId || currentUser.role === 'admin') ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isPublic"
                            value="true"
                            defaultChecked={song.isPublic}
                            className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                        />
                        <label className="text-sm text-app">
                            Canción pública (visible para todos)
                        </label>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <input type="hidden" name="isPublic" value={song.isPublic ? "true" : "false"} />
                        <input type="checkbox" checked={song.isPublic} disabled className="w-4 h-4 text-app-muted rounded" />
                        <label className="text-sm text-app-muted">
                            Canción pública (sólo el propietario puede cambiar esto)
                        </label>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="app-button flex-1 py-2.5 px-4 rounded-lg"
                    >
                        {saving ? 'Guardando...' : 'Actualizar Canción'}
                    </button>
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => router.push(`/canciones/${id}`)}
                        className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--color-border)] text-app hover:bg-[var(--color-border)] transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </form>

            {/* Modal para gestionar etiquetas de enganchados */}
            <EnganchadosModal
                isOpen={showEnganchadosModal}
                onClose={() => setShowEnganchadosModal(false)}
                tags={enganchadosList}
                onTagsChanged={async () => {
                    const tags = await getEnganchados();
                    setEnganchadosList(tags);
                }}
            />
        </div>
    );
}
