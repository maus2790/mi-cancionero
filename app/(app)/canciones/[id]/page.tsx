'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSongById, toggleFavorite, deleteSong, updateChordPositions } from '@/app/actions/songs';
import { getChordByNameExact } from '@/app/actions/chords';
import { getUserSetlists } from '@/app/actions/setlists';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import ChordModal from '@/components/ChordModal';
import { transposeChordPro } from '@/lib/chords';
import { Heart, Trash2, Edit, ListPlus, Type, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2, Gauge, Square, MoreHorizontal, Video, Loader2 } from 'lucide-react';
import { getCurrentUser } from '@/app/actions/auth';
import { useTitle } from '@/lib/TitleContext';
import { useAudioCleanup } from '@/hooks/useAudioCleanup';
import toast from 'react-hot-toast';
import { canCreateContent, canManageContent, type ContentUser } from '@/lib/permissions';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useOfflineMode } from '@/lib/hooks/useOfflineMode';
import { getOfflineSongById, getOfflineSetlists } from '@/lib/offline-db';

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

export default function SongDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack, setHeaderRight } = useTitle();
    const [song, setSong] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [transpose, setTranspose] = useState(0);
    const [fontSizeIndex, setFontSizeIndex] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<ContentUser | null>(null);

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
    const [showSongMenu, setShowSongMenu] = useState(false);
    const [isEditingChordPositions, setIsEditingChordPositions] = useState(false);
    const [chordOffsets, setChordOffsets] = useState<Record<string, number>>({});
    const [dragStart, setDragStart] = useState<{ key: string; clientX: number; offset: number } | null>(null);
    const [savingChordPositions, setSavingChordPositions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    useAudioCleanup(audioRef);
    const { isOnline } = useNetworkStatus();
    const { isSectionOffline } = useOfflineMode();

    const fontSize = FONT_SIZES[fontSizeIndex];
    const fontSizeClass = FONT_SIZE_CLASSES[fontSize];

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
                if (!isOnline && isSectionOffline('setlists')) {
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

    const handleHeaderPlayer = () => {
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
    };

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
    }, [song, isPlayerOpen, isBuffering, setHeaderRight]);

    const makeVisible = useCallback(() => {
        setIsVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!isHovering) {
                setIsVisible(false);
            }
        }, 10000);
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
        }, 10000);
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
        const rate = playbackRate === 1 ? 0.5 : 1;
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
        setSelectedChordName(baseChord);
        setSelectedChord(null);
        setIsChordModalOpen(true);
        try {
            const chordData = await getChordByNameExact(baseChord);
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

    const transposedContent = transpose !== 0 ? transposeChordPro(song.content, transpose) : song.content;
    const controlsOpacity = (isVisible || isHovering) ? 'opacity-100' : 'opacity-40';
    const canManageSong = canManageContent(currentUser, song.userId, song.isPublic ?? false);

    return (
        <div ref={containerRef} className="bg-app">

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
                <div className="sticky top-0 z-40 app-glass border-b px-2 sm:px-4 py-2 sm:py-3 flex flex-row items-center gap-2 sm:gap-4 shadow-sm">
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
                            className={`p-2 rounded-md transition ${playbackRate === 0.5 ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-border)] text-app hover:opacity-80'}`}
                            aria-label={playbackRate === 1 ? 'Cambiar velocidad a 0.5' : 'Cambiar velocidad a 1'}
                            title={playbackRate === 1 ? 'Velocidad 0.5' : 'Velocidad 1'}
                        >
                            <Gauge className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Banner edición de posición de notas */}
            {isEditingChordPositions && (
                <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/50">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Arrastra las notas con el cursor de mano y guarda los cambios.</span>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditingChordPositions(false)} disabled={savingChordPositions} className="rounded-lg px-3 py-1.5 text-app hover:bg-[var(--color-border)]">Cancelar</button>
                        <button onClick={saveChordPositionChanges} disabled={savingChordPositions} className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 font-medium text-white hover:opacity-90 disabled:opacity-50">{savingChordPositions ? 'Guardando...' : 'Guardar posiciones'}</button>
                    </div>
                </div>
            )}

            {/* Contenido de la canción */}
            <div className="min-h-screen overflow-x-auto p-4 sm:p-8">
                <div className={`mx-auto min-w-max max-w-none whitespace-pre ${fontSizeClass} text-app leading-relaxed pb-32`}>
                    {transposedContent.split('\n').map((line: string, i: number) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        return (
                            <div key={i} className="leading-relaxed">
                                {parts.map((part: string, j: number) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
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
                                                className={`inline-block text-left text-[var(--color-primary)] font-bold focus:outline-none ${isEditingChordPositions ? 'cursor-grab active:cursor-grabbing rounded bg-[var(--color-primary)]/10 px-0.5' : 'cursor-pointer hover:underline'}`}
                                                style={{ transform: `translateX(${chordOffsets[chordKey] || 0}px)` }}
                                            >
                                                {fullChord}
                                            </button>
                                        );
                                    }
                                    return <span key={j}>{part}</span>;
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Controles flotantes a la derecha */}
            <div
                className={`fixed right-3 sm:right-6 bottom-20 sm:bottom-8 flex flex-col items-center gap-2 transition-all duration-300 ${controlsOpacity} z-50`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={toggleFullscreen}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Pantalla completa"
                >
                    <div className="p-1.5 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </div>
                    <span className="text-[9px] text-app-muted">
                        {isFullscreen ? 'Salir' : 'Pantalla'}
                    </span>
                </button>

                <button
                    onClick={handleToggleFavorite}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Favorito"
                >
                    <div className={`p-1.5 rounded-full app-glass shadow-lg transition ${isFavorite ? 'text-red-500' : 'text-app-muted hover:text-red-500'}`}>
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                    </div>
                    <span className="text-[9px] text-app-muted">
                        {isFavorite ? 'Favorita' : 'Me gusta'}
                    </span>
                </button>

                {isAuthenticated && (
                    <button
                        onClick={handleAddToList}
                        className="flex flex-col items-center gap-0.5 group"
                        aria-label="Agregar a lista"
                    >
                        <div className="p-1.5 rounded-full app-glass shadow-lg text-app-muted hover:text-green-500 transition">
                            <ListPlus className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] text-app-muted">Lista</span>
                    </button>
                )}

                <div className="flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-1.5 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-app min-w-[16px] text-center">
                        {transpose === 0 ? '0' : `${transpose > 0 ? '+' : ''}${transpose}`}
                    </span>
                    <button
                        onClick={() => handleTranspose(1)}
                        className="p-1.5 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] text-app-muted">Tono</span>
                </div>

                <button
                    onClick={handleFontSizeCycle}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-1.5 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition">
                        <Type className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-app-muted">
                        {FONT_SIZE_LABELS[fontSize]}
                    </span>
                </button>

                <div className="relative flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => setShowSongMenu(prev => !prev)}
                        className="p-1.5 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition"
                        aria-label="Más acciones"
                        aria-expanded={showSongMenu}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] text-app-muted">Más</span>

                    {showSongMenu && (
                        <div className="absolute right-10 bottom-0 w-52 overflow-hidden rounded-lg app-card shadow-xl">
                            {canCreateContent(currentUser) && (
                                <button
                                    onClick={() => {
                                        setShowSongMenu(false);
                                        setIsEditingChordPositions(true);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-app hover:bg-[var(--color-border)] transition"
                                >
                                    Editar posición de notas
                                </button>
                            )}
                            {song.videoUrl && (
                                <button
                                    onClick={() => {
                                        setShowSongMenu(false);
                                        window.open(song.videoUrl, '_blank');
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-border)] transition"
                                >
                                    <Video className="w-4 h-4" /> Ver video
                                </button>
                            )}
                            {canManageSong && <>
                                <button
                                    onClick={() => {
                                        setShowSongMenu(false);
                                        router.push(`/canciones/${song.id}/editar`);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-app hover:bg-[var(--color-border)] transition"
                                >
                                    <Edit className="w-4 h-4" /> Editar canción
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSongMenu(false);
                                        handleDelete();
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-[var(--color-border)] transition"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar canción
                                </button>
                            </>}
                        </div>
                    )}
                </div>
            </div>

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

            {/* Modal para Acordes */}
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
        </div>
    );
}
