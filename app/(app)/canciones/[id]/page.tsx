'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSongById, toggleFavorite, deleteSong, updateChordPositions } from '@/app/actions/songs';
import { getChordByNameExact } from '@/app/actions/chords';
import { getUserSetlists } from '@/app/actions/setlists';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import ChordModal from '@/components/ChordModal';
import { transposeChordPro } from '@/lib/chords';
import {
    Heart, Trash2, Edit, ListPlus, Type, ChevronLeft, ChevronRight,
    Play, Pause, Maximize2, Minimize2, Square, MoreVertical,
    Video, Loader2, Radio, SlidersHorizontal, ArrowDown, Music2, FileDown, MoveHorizontal, Columns
} from 'lucide-react';
import { getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';
import { useAudioCleanup } from '@/hooks/useAudioCleanup';
import toast from 'react-hot-toast';
import { canCreateContent, canManageContent, type ContentUser } from '@/lib/permissions';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { getOfflineSongById, getOfflineSetlists } from '@/lib/offline-db';
import { useChordNotation } from '@/lib/ChordNotationContext';
import { Metronome } from '@/components/Metronome';
import { AutoScrollController } from '@/components/AutoScrollController';
import { SongSettingsModal } from '@/components/SongSettingsModal';
import { NOTES, normalizeNote } from '@/lib/constants';

const FONT_SIZES = ['small', 'medium', 'large', 'xlarge'] as const;
type FontSize = typeof FONT_SIZES[number];

const FONT_SIZE_CLASSES: Record<FontSize, string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

const FONT_SIZE_LABELS: Record<FontSize, string> = {
    small: 'S',
    medium: 'M',
    large: 'L',
    xlarge: 'XL',
};

const CHORD_COLOR_CLASSES: Record<string, string> = {
    cyan: 'text-[var(--color-primary)]',
    amber: 'text-amber-500 dark:text-amber-400',
    emerald: 'text-emerald-500 dark:text-emerald-400',
    violet: 'text-violet-500 dark:text-violet-400',
    rose: 'text-rose-500 dark:text-rose-400',
    blue: 'text-blue-500 dark:text-blue-400',
};

export default function SongDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack, setHeaderRight } = useTitle();
    const { formatChordPro, formatKey, toCanonicalAngloChord } = useChordNotation();
    const [song, setSong] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [transpose, setTranspose] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<ContentUser | null>(null);

    // Nuevas funcionalidades avanzadas
    const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showAutoScroll, setShowAutoScroll] = useState(false);
    const [showMobileToolbarMenu, setShowMobileToolbarMenu] = useState(false);
    const [hideChords, setHideChords] = useState(false);
    const [columns, setColumns] = useState<1 | 2>(1);
    const [chordColor, setChordColor] = useState('cyan');

    const [selectedChord, setSelectedChord] = useState<any>(null);
    const [selectedChordName, setSelectedChordName] = useState<string>('');
    const [isChordModalOpen, setIsChordModalOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userSetlists, setUserSetlists] = useState<any[]>([]);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isEditingChordPositions, setIsEditingChordPositions] = useState(false);
    const [chordOffsets, setChordOffsets] = useState<Record<string, number>>({});
    const [dragStart, setDragStart] = useState<{ key: string; clientX: number; offset: number } | null>(null);
    const [savingChordPositions, setSavingChordPositions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useAudioCleanup(audioRef);
    const { isOnline } = useNetworkStatus();

    const fontSize = FONT_SIZES[fontSizeIndex];
    const fontSizeClass = FONT_SIZE_CLASSES[fontSize];

    const songBpm = (() => {
        if (!song?.content) return 100;
        const match = song.content.match(/\{(?:tempo|bpm):\s*(\d+)\}/i);
        return match ? parseInt(match[1], 10) : 100;
    })();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            if (!isOnline) {
                const songData = await getOfflineSongById(Number(id));
                setSong(songData);
                try {
                    setChordOffsets(songData?.chordPositions ? JSON.parse(songData.chordPositions) : {});
                } catch {
                    setChordOffsets({});
                }
                setIsAuthenticated(true);
                setLoading(false);
                return;
            }

            const [songData, user] = await Promise.all([
                getSongById(Number(id)),
                getCurrentUser()
            ]);
            setSong(songData);
            try {
                setChordOffsets(songData?.chordPositions ? JSON.parse(songData.chordPositions) : {});
            } catch {
                setChordOffsets({});
            }
            setIsAuthenticated(!!user);
            setCurrentUser(user);
            setLoading(false);
        };
        loadData();
    }, [id, isOnline]);

    useEffect(() => {
        if (isAuthenticated) {
            const loadSetlists = async () => {
                if (!isOnline) {
                    const lists = await getOfflineSetlists();
                    setUserSetlists(lists);
                    return;
                }
                const lists = await getUserSetlists();
                setUserSetlists(lists);
            };
            loadSetlists();
        }
    }, [isAuthenticated, isOnline]);

    useEffect(() => {
        if (song) {
            setTitle(song.title);
            setShowBack(true);
            setOnBack(() => router.push('/canciones'));
        }
        return () => {
            setTitle('Tu Cancionero');
            setShowBack(false);
            setHeaderRight(null);
        };
    }, [song, setTitle, setShowBack, setOnBack, setHeaderRight, router]);

    const handleHeaderPlayer = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlayerOpen) {
            audio.pause();
            audio.currentTime = 0;
            setCurrentTime(0);
            setIsPlayerOpen(false);
            return;
        }

        setIsPlayerOpen(true);
        setIsBuffering(true);
        audio.play().catch(() => setIsBuffering(false));
    }, [isPlayerOpen]);

    const handleBarPlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            setIsBuffering(true);
            audio.play().catch(() => setIsBuffering(false));
        } else {
            audio.pause();
        }
    };

    useEffect(() => {
        if (song && song.audioUrl) {
            setHeaderRight(
                <button
                    onClick={handleHeaderPlayer}
                    className="p-2 text-app-muted hover:text-[var(--color-primary)] transition flex items-center justify-center"
                    aria-label={isPlayerOpen ? 'Detener reproducción' : 'Reproducir'}
                    disabled={isBuffering}
                >
                    {isBuffering ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
                    ) : isPlayerOpen ? (
                        <Square className="w-5 h-5" />
                    ) : (
                        <Play className="w-6 h-6" />
                    )}
                </button>
            );
        } else {
            setHeaderRight(null);
        }
    }, [song, isPlayerOpen, isBuffering, setHeaderRight, handleHeaderPlayer]);

    const makeVisible = useCallback(() => {
        setIsVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!isHovering) {
                setIsVisible(false);
            }
        }, 12000);
    }, [isHovering]);

    const handleMouseEnter = () => {
        setIsHovering(true);
        setIsVisible(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 12000);
    };

    useEffect(() => {
        makeVisible();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [makeVisible]);

    const handleToggleFavorite = async () => {
        try {
            await toggleFavorite(Number(id));
            setIsFavorite(!isFavorite);
            toast.success(isFavorite ? 'Eliminada de favoritos' : 'Añadida a favoritos');
        } catch {
            toast.error('No se pudo actualizar favoritos');
        }
        makeVisible();
    };

    const handleDelete = async () => {
        if (confirm('¿Estás seguro de eliminar esta canción?')) {
            try {
                await deleteSong(Number(id));
                toast.success('Canción eliminada');
                router.push('/canciones');
            } catch {
                toast.error('No se pudo eliminar la canción');
            }
        }
    };

    const handlePrintPdf = () => {
        const prevTitle = document.title;
        if (song?.title) document.title = song.title;
        setTimeout(() => {
            window.print();
            // Restaurar el titulo despues de que el dialogo de impresion se cierre
            setTimeout(() => { document.title = prevTitle; }, 1000);
        }, 200);
    };

    const handleAddToList = () => {
        setShowAddModal(true);
        makeVisible();
    };

    const handleTranspose = (delta: number) => {
        setTranspose(t => t + delta);
        makeVisible();
    };

    const handleFontSizeCycle = () => {
        setFontSizeIndex((prev) => (prev + 1) % FONT_SIZES.length);
        makeVisible();
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const togglePlaybackRate = () => {
        const rate = playbackRate === 1 ? 0.75 : playbackRate === 0.75 ? 0.5 : 1;
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                console.error('Fullscreen error:', e);
            }
        } else {
            await document.exitFullscreen();
        }
        makeVisible();
    };

    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const handleChordClick = async (fullChord: string) => {
        const baseChord = fullChord.split('/')[0];
        const canonicalAnglo = toCanonicalAngloChord(baseChord);
        setSelectedChordName(baseChord);
        setSelectedChord(null);
        setIsChordModalOpen(true);
        try {
            const chordData = await getChordByNameExact(canonicalAnglo);
            setSelectedChord(chordData);
        } catch (error) {
            console.error('Error fetching chord:', error);
        }
    };

    const saveChordPositionChanges = async () => {
        setSavingChordPositions(true);
        try {
            await updateChordPositions(Number(id), JSON.stringify(chordOffsets));
            setIsEditingChordPositions(false);
            toast.success('Posiciones de notas guardadas para todos');
        } catch {
            toast.error('No se pudieron guardar las posiciones');
        } finally {
            setSavingChordPositions(false);
        }
    };

    // Calcular la tonalidad actual transpuesta
    const currentTransposedKey = (() => {
        if (!song?.key) return '';
        const root = normalizeNote(song.key);
        const idx = NOTES.indexOf(root as any);
        if (idx === -1) return formatKey(song.key);
        const newIdx = (idx + transpose + 120) % 12;
        return formatKey(NOTES[newIdx]);
    })();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (!song) {
        return (
            <div className="flex justify-center items-center h-screen text-app-muted">
                Canción no encontrada
            </div>
        );
    }

    const rawTransposed = transpose !== 0 ? transposeChordPro(song.content, transpose) : song.content;
    const transposedContent = formatChordPro(rawTransposed);
    const controlsOpacity = (isVisible || isHovering) ? 'opacity-100' : 'opacity-40 hover:opacity-100';
    const canManageSong = canManageContent(currentUser, song.userId, song.isPublic ?? false);
    const chordColorClass = CHORD_COLOR_CLASSES[chordColor] || 'text-[var(--color-primary)]';

    return (
        <div ref={containerRef} className="bg-app min-h-screen overflow-x-hidden">

            {/* Cabecera exclusiva para impresión */}
            <div className="hidden print:block mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-black">{song.title}</h1>
                <div className="text-sm text-gray-700 mt-1 flex gap-4">
                    {song.artist && <span><strong>Artista:</strong> {song.artist}</span>}
                    {currentTransposedKey && <span><strong>Tono:</strong> {currentTransposedKey}</span>}
                    {song.style && <span><strong>Estilo:</strong> {song.style}</span>}
                </div>
            </div>

            {song.audioUrl && (
                <audio
                    ref={audioRef}
                    src={song.audioUrl}
                    preload="none"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onWaiting={() => setIsBuffering(true)}
                    onCanPlay={() => setIsBuffering(false)}
                    onPlaying={() => setIsBuffering(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />
            )}

            {/* Reproductor sticky */}
            {song.audioUrl && isPlayerOpen && (
                <div className="sticky top-0 z-40 app-glass border-b px-2 sm:px-4 py-1 sm:py-1 flex flex-row items-center gap-2 sm:gap-4 shadow-sm print:hidden">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] sm:text-xs text-app-muted font-mono w-8 sm:w-10 text-right shrink-0">
                            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
                        </span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 min-w-0 h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                        <span className="text-[10px] sm:text-xs text-app-muted font-mono w-8 sm:w-10 shrink-0">
                            {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                            onClick={handleBarPlayPause}
                            className="p-2 rounded-md bg-[var(--color-border)] text-app hover:opacity-80 transition"
                            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                            title={isPlaying ? 'Pausar' : 'Reproducir'}
                            disabled={isBuffering}
                        >
                            {isBuffering ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                            ) : isPlaying ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={togglePlaybackRate}
                            className={`px-2 py-1.5 rounded-md text-xs font-mono font-bold transition ${playbackRate !== 1 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-app hover:opacity-80'}`}
                            title="Cambiar velocidad de reproducción"
                        >
                            {playbackRate}x
                        </button>
                    </div>
                </div>
            )}

            {/* Banner edición de posición de notas */}
            {isEditingChordPositions && (
                <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/50 print:hidden">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Arrastra las notas con el cursor de mano y guarda los cambios.</span>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditingChordPositions(false)} disabled={savingChordPositions} className="rounded-lg px-3 py-1.5 text-app hover:bg-[var(--color-border)]">Cancelar</button>
                        <button onClick={saveChordPositionChanges} disabled={savingChordPositions} className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-50">{savingChordPositions ? 'Guardando...' : 'Guardar posiciones'}</button>
                    </div>
                </div>
            )}

            {/* Barra de herramientas superior rápida (en pantalla) */}
            <div className="max-w-6xl mx-auto px-2 py-1.5 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 py-1 rounded-2xl app-card border border-[var(--color-border)]">
                    {/* Info Tonalidad y Artista */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {currentTransposedKey && (
                            <span className="px-2.5 py-1 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <Music2 className="w-3.5 h-3.5" />
                                Tono: {currentTransposedKey} {transpose !== 0 && `(${transpose > 0 ? '+' : ''}${transpose})`}
                            </span>
                        )}
                        {song.artist && (
                            <span className="text-xs font-medium text-app-muted truncate max-w-[180px]">
                                {song.artist}
                            </span>
                        )}
                        {song.style && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--color-border)] text-app-muted text-[11px]">
                                {song.style}
                            </span>
                        )}
                    </div>

                    {/* Grupo derecho: botones inline (sm+) + tres puntos siempre juntos */}
                    <div className="flex items-center gap-1">

                        {/* Auto-Scroll: visible como botón en sm+ */}
                        <button
                            onClick={() => setShowAutoScroll(s => !s)}
                            className={`hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition ${showAutoScroll
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'hover:bg-[var(--color-border)] text-app'
                                }`}
                            title="Alternar barra de auto-scroll"
                        >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span>Auto-Scroll</span>
                        </button>

                        {/* Metrónomo: visible como botón en sm+ */}
                        <button
                            onClick={() => setIsMetronomeOpen(m => !m)}
                            className={`hidden sm:flex p-2 rounded-xl transition items-center gap-1 text-xs font-medium ${isMetronomeOpen
                                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                                : 'hover:bg-[var(--color-border)] text-app'
                                }`}
                            title={isMetronomeOpen ? "Detener metrónomo" : "Iniciar metrónomo"}
                        >
                            <Radio className={`w-4 h-4 ${isMetronomeOpen ? 'text-white animate-pulse' : 'text-[var(--color-primary)]'}`} />
                            <span>Metrónomo</span>
                        </button>


                        {/* Ajustes: visible como botón en sm+ */}
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="hidden sm:flex p-2 rounded-xl hover:bg-[var(--color-border)] text-app transition items-center gap-1 text-xs font-medium"
                            title="Ajustes de visualización"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>Ajustes</span>
                        </button>

                        {/* Tres puntos: siempre visible, pegado a los botones anteriores */}
                        <div className="relative flex items-center">
                            <button
                                onClick={() => setShowMobileToolbarMenu(m => !m)}
                                className={`p-2 rounded-xl border border-[var(--color-border)] text-app transition ${showMobileToolbarMenu
                                    ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'hover:bg-[var(--color-border)]'
                                    }`}
                                aria-label="Más opciones"
                                aria-expanded={showMobileToolbarMenu}
                                title="Más opciones"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {showMobileToolbarMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40 bg-black/20"
                                        onClick={() => setShowMobileToolbarMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl app-card shadow-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] z-50">
                                        {/* Sección de herramientas: solo se muestran en el dropdown cuando NO son visibles como botones (< sm) */}
                                        <div className="p-1 sm:hidden">
                                            {/* Auto-Scroll (solo mobile) */}
                                            <button
                                                onClick={() => {
                                                    setShowAutoScroll(s => !s);
                                                    setShowMobileToolbarMenu(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium rounded-xl transition ${showAutoScroll
                                                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold'
                                                    : 'text-app hover:bg-[var(--color-border)]'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <ArrowDown className="w-4 h-4 text-[var(--color-primary)]" />
                                                    Auto-Scroll
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-border)] font-mono">
                                                    {showAutoScroll ? 'On' : 'Off'}
                                                </span>
                                            </button>

                                            {/* Metrónomo (solo mobile) */}
                                            <button
                                                onClick={() => {
                                                    setIsMetronomeOpen(m => !m);
                                                    setShowMobileToolbarMenu(false);
                                                }}
                                                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium rounded-xl transition ${isMetronomeOpen
                                                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold'
                                                    : 'text-app hover:bg-[var(--color-border)]'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Radio className={`w-4 h-4 ${isMetronomeOpen ? 'text-[var(--color-primary)] animate-pulse' : 'text-purple-500'}`} />
                                                    Metrónomo
                                                </span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-border)] font-mono">
                                                    {isMetronomeOpen ? 'Sonando' : 'Off'}
                                                </span>
                                            </button>


                                            {/* Ajustes (solo mobile) */}
                                            <button
                                                onClick={() => {
                                                    setIsSettingsOpen(true);
                                                    setShowMobileToolbarMenu(false);
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-app hover:bg-[var(--color-border)] rounded-xl transition"
                                            >
                                                <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
                                                Ajustes del visor
                                            </button>
                                        </div>

                                        {/* Exportar PDF: siempre en el dropdown */}
                                        <div className="p-1">
                                            <button
                                                onClick={() => {
                                                    setShowMobileToolbarMenu(false);
                                                    handlePrintPdf();
                                                }}
                                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-app hover:bg-[var(--color-border)] rounded-xl transition"
                                            >
                                                <FileDown className="w-4 h-4 text-emerald-500" />
                                                Exportar PDF
                                            </button>
                                        </div>

                                        {/* Gestión de canción: siempre en el dropdown */}
                                        {(canCreateContent(currentUser) || song.videoUrl || canManageSong) && (
                                            <div className="p-1">
                                                {canCreateContent(currentUser) && (
                                                    <button
                                                        onClick={() => {
                                                            setShowMobileToolbarMenu(false);
                                                            setIsEditingChordPositions(true);
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-app hover:bg-[var(--color-border)] rounded-lg transition"
                                                    >
                                                        <MoveHorizontal className="w-4 h-4 text-cyan-500" />
                                                        <span>Ajustar posición de notas</span>
                                                    </button>
                                                )}
                                                {song.videoUrl && (
                                                    <button
                                                        onClick={() => {
                                                            setShowMobileToolbarMenu(false);
                                                            window.open(song.videoUrl, '_blank');
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-border)] rounded-lg transition"
                                                    >
                                                        <Video className="w-4 h-4" /> Ver video de referencia
                                                    </button>
                                                )}
                                                {canManageSong && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setShowMobileToolbarMenu(false);
                                                                router.push(`/canciones/${song.id}/editar`);
                                                            }}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-app hover:bg-[var(--color-border)] rounded-lg transition"
                                                        >
                                                            <Edit className="w-4 h-4" /> Editar canción
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowMobileToolbarMenu(false);
                                                                handleDelete();
                                                            }}
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Eliminar canción
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido de la canción */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 pb-36">
                {/* Hoja de letra y acordes */}
                <div className={`overflow-x-hidden ${columns === 2 ? 'md:columns-2 md:gap-12 md:divide-x md:divide-[var(--color-border)]/40' : ''}`}>
                    <div className={`whitespace-pre-wrap break-words font-mono ${fontSizeClass} text-app leading-relaxed`}>
                        {transposedContent.split('\n').map((line: string, i: number) => {
                            const parts = line.split(/(\[[^\]]+\])/g);
                            return (
                                <div key={i} className="leading-relaxed hover:bg-[var(--color-border)]/10 rounded px-1 transition-colors">
                                    {parts.map((part: string, j: number) => {
                                        if (part.startsWith('[') && part.endsWith(']')) {
                                            if (hideChords) return null; // Modo solo letra
                                            const fullChord = part.slice(1, -1);
                                            const chordKey = `${i}-${j}`;
                                            return (
                                                <button
                                                    key={j}
                                                    onClick={() => !isEditingChordPositions && handleChordClick(fullChord)}
                                                    onPointerDown={(event) => {
                                                        if (!isEditingChordPositions) return;
                                                        event.currentTarget.setPointerCapture(event.pointerId);
                                                        setDragStart({ key: chordKey, clientX: event.clientX, offset: chordOffsets[chordKey] || 0 });
                                                    }}
                                                    onPointerMove={(event) => {
                                                        if (!dragStart || dragStart.key !== chordKey) return;
                                                        setChordOffsets(current => ({ ...current, [chordKey]: Math.round(dragStart.offset + event.clientX - dragStart.clientX) }));
                                                    }}
                                                    onPointerUp={() => setDragStart(null)}
                                                    className={`inline-block text-left ${chordColorClass} font-bold focus:outline-none print-chord ${isEditingChordPositions
                                                        ? 'cursor-grab active:cursor-grabbing rounded bg-[var(--color-primary)]/10 px-0.5'
                                                        : 'cursor-pointer hover:underline'
                                                        }`}
                                                    style={{ transform: `translateX(${chordOffsets[chordKey] || 0}px)` }}
                                                    title={`Ver acorde ${fullChord}`}
                                                >
                                                    {fullChord}
                                                </button>
                                            );
                                        }
                                        return <span key={j} className="print-readable">{part}</span>;
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Widget flotante de Auto-Scroll */}
            {showAutoScroll && (
                <div className="print:hidden">
                    <AutoScrollController
                        scrollContainerId="main-scroll-container"
                        onClose={() => setShowAutoScroll(false)}
                    />
                </div>
            )}

            {/* Controles flotantes a la derecha (Performance Dock) */}
            <div
                className={`fixed right-6 sm:right-6 bottom-15 sm:bottom-8 flex flex-col items-center gap-2 transition-all duration-300 ${controlsOpacity} z-40 print:hidden`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Pantalla completa / Modo escenario */}
                <button
                    onClick={toggleFullscreen}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Pantalla completa"
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Modo Escenario (Pantalla completa)'}
                >
                    <div className="p-2 rounded-full app-glass shadow-lg text-app-muted group-hover:text-[var(--color-primary)] transition">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </div>
                    <span className="text-[9px] text-app-muted">
                        {isFullscreen ? 'Salir' : 'Escenario'}
                    </span>
                </button>

                {/* Favorito */}
                <button
                    onClick={handleToggleFavorite}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Favorito"
                >
                    <div className={`p-2 rounded-full app-glass shadow-lg transition ${isFavorite ? 'text-red-500' : 'text-app-muted group-hover:text-red-500'}`}>
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                    </div>
                    <span className="text-[9px] text-app-muted">
                        {isFavorite ? 'Favorita' : 'Me gusta'}
                    </span>
                </button>

                {/* Agregar a lista */}
                {isAuthenticated && (
                    <button
                        onClick={handleAddToList}
                        className="flex flex-col items-center gap-0.5 group"
                        aria-label="Agregar a lista"
                        title="Agregar a un Setlist"
                    >
                        <div className="p-2 rounded-full app-glass shadow-lg text-app-muted group-hover:text-green-500 transition">
                            <ListPlus className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] text-app-muted">Lista</span>
                    </button>
                )}

                {/* Transposición de Tono */}
                <div className="flex flex-col items-center gap-0.5 bg-app-surface/80 p-1 rounded-2xl border border-[var(--color-border)] shadow-lg backdrop-blur-md">
                    <button
                        onClick={() => handleTranspose(1)}
                        className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-app-muted hover:text-[var(--color-primary)] transition"
                        title="Subir 1 semitono (+1)"
                    >
                        <ChevronRight className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-app min-w-[20px] text-center">
                        {transpose === 0 ? '0' : `${transpose > 0 ? '+' : ''}${transpose}`}
                    </span>
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-app-muted hover:text-[var(--color-primary)] transition"
                        title="Bajar 1 semitono (-1)"
                    >
                        <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-[9px] text-app-muted">Tono</span>
                </div>

                {/* Tamaño de fuente */}
                <button
                    onClick={handleFontSizeCycle}
                    className="flex flex-col items-center gap-0.5 group"
                    title={`Tamaño actual: ${FONT_SIZE_LABELS[fontSize]} (toca para cambiar)`}
                >
                    <div className="p-2 rounded-full app-glass shadow-lg text-app-muted group-hover:text-[var(--color-primary)] transition">
                        <Type className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-app-muted">
                        {FONT_SIZE_LABELS[fontSize]}
                    </span>
                </button>

                {/* Distribución de Columnas (1 o 2 columnas) */}
                <button
                    onClick={() => setColumns(c => c === 1 ? 2 : 1)}
                    className="flex flex-col items-center gap-0.5 group"
                    title={columns === 2 ? 'Cambiar a 1 columna' : 'Cambiar a 2 columnas'}
                    aria-label="Distribución en columnas"
                >
                    <div className={`p-2 rounded-full app-glass shadow-lg transition ${columns === 2 ? 'bg-[var(--color-primary)] text-white shadow-[var(--color-primary)]/20' : 'text-app-muted group-hover:text-[var(--color-primary)]'}`}>
                        <Columns className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] ${columns === 2 ? 'text-[var(--color-primary)] font-bold' : 'text-app-muted'}`}>
                        {columns === 2 ? '2 Col' : '1 Col'}
                    </span>
                </button>

            </div>

            {/* Modal para Agregar a Setlist */}
            <AddToSetlistModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                songId={Number(id)}
                songTitle={song.title}
                existingSetlists={userSetlists}
                currentTransposition={transpose}
                currentFontSize={fontSize}
                onSuccess={() => {
                    setShowAddModal(false);
                }}
            />

            {/* Modal para Diagramas de Acordes */}
            <ChordModal
                chord={selectedChord}
                chordName={selectedChordName}
                isOpen={isChordModalOpen}
                onClose={() => setIsChordModalOpen(false)}
                allowToggle={true}
                initialView="guitar"
                canCreate={canCreateContent(currentUser)}
                canManage={canManageContent(currentUser, selectedChord?.userId ?? null)}
            />

            {/* Metrónomo flotante interactivo y no bloqueante */}
            <Metronome
                isOpen={isMetronomeOpen}
                onClose={() => setIsMetronomeOpen(false)}
                initialBpm={songBpm}
                autoPlayOnOpen={true}
            />


            {/* Modal Ajustes del Visor */}
            <SongSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                hideChords={hideChords}
                onToggleHideChords={setHideChords}
                columns={columns}
                onColumnsChange={setColumns}
                chordColor={chordColor}
                onChordColorChange={setChordColor}
                onPrint={handlePrintPdf}
            />
        </div>
    );
}
