'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSetlistById, updateSongInSetlist } from '@/app/actions/setlists';
import { transposeChordPro } from '@/lib/chords';
import { useTitle } from '@/lib/TitleContext';
import {
    Type, ChevronLeft, ChevronRight, Maximize2, Minimize2,
    Radio, ArrowDown, SkipBack, SkipForward, Music, MoreVertical,
    SlidersHorizontal, FileDown, Columns
} from 'lucide-react';
import { SongSettingsModal } from '@/components/SongSettingsModal';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { getOfflineSetlistById } from '@/lib/offline-db';
import { Metronome } from '@/components/Metronome';
import { AutoScrollController } from '@/components/AutoScrollController';
import { useChordNotation } from '@/lib/ChordNotationContext';
import ChordModal from '@/components/ChordModal';
import { getChordByNameExact } from '@/app/actions/chords';

const FONT_SIZES = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
};

const FONT_SIZE_LABELS = {
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

export default function SetlistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const { formatChordPro, toCanonicalAngloChord } = useChordNotation();
    const [setlist, setSetlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isMetronomeOpen, setIsMetronomeOpen] = useState(false);
    const [showAutoScroll, setShowAutoScroll] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hideChords, setHideChords] = useState(false);
    const [columns, setColumns] = useState<1 | 2>(1);
    const [chordColor, setChordColor] = useState('cyan');

    const [selectedChord, setSelectedChord] = useState<any>(null);
    const [selectedChordName, setSelectedChordName] = useState<string>('');
    const [isChordModalOpen, setIsChordModalOpen] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number | null>(null);
    const { isOnline } = useNetworkStatus();

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

    const handleTranspose = async (delta: number) => {
        if (!setlist) return;
        const currentSong = setlist.songs[currentSongIndex];
        const newTranspose = (currentSong.transposition || 0) + delta;

        const updatedSongs = [...setlist.songs];
        updatedSongs[currentSongIndex].transposition = newTranspose;
        setSetlist({ ...setlist, songs: updatedSongs });
        makeVisible();

        try {
            await updateSongInSetlist(currentSong.id, { transposition: newTranspose });
        } catch (e) {
            console.error("Error transposing", e);
        }
    };

    const handleFontSizeCycle = async () => {
        if (!setlist) return;
        const currentSong = setlist.songs[currentSongIndex];
        const fontSizesArray = Object.keys(FONT_SIZES);
        const currentIndex = fontSizesArray.indexOf(currentSong.fontSize || 'medium');
        const newFontSize = fontSizesArray[(currentIndex + 1) % fontSizesArray.length];

        const updatedSongs = [...setlist.songs];
        updatedSongs[currentSongIndex].fontSize = newFontSize;
        setSetlist({ ...setlist, songs: updatedSongs });
        makeVisible();

        try {
            await updateSongInSetlist(currentSong.id, { fontSize: newFontSize });
        } catch (e) {
            console.error("Error font size", e);
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

    const handlePrintPdf = () => {
        const prevTitle = document.title;
        if (setlist?.title) document.title = setlist.title;
        const resetTitle = () => {
            document.title = prevTitle;
            window.removeEventListener('afterprint', resetTitle);
        };
        window.addEventListener('afterprint', resetTitle);
        setTimeout(() => {
            window.print();
            setTimeout(resetTitle, 2000);
        }, 150);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || !setlist) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSongIndex < setlist.songs.length - 1) {
                setCurrentSongIndex(i => i + 1);
            } else if (diff < 0 && currentSongIndex > 0) {
                setCurrentSongIndex(i => i - 1);
            }
        }
        touchStartX.current = null;
    };

    // Navegación con teclado (Flechas izquierda/derecha)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
            if (e.key === 'ArrowRight' && setlist && currentSongIndex < setlist.songs.length - 1) {
                setCurrentSongIndex(i => i + 1);
            } else if (e.key === 'ArrowLeft' && currentSongIndex > 0) {
                setCurrentSongIndex(i => i - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setlist, currentSongIndex]);

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

    useEffect(() => {
        const loadSetlist = async () => {
            try {
                if (!isOnline) {
                    const data = await getOfflineSetlistById(Number(id));
                    if (!data) throw new Error("No encontrada");
                    setSetlist(data);
                    if (data.songs && data.songs.length > 0) {
                        setCurrentSongIndex(0);
                        setTitle(data.songs[0].song.title);
                    } else {
                        setTitle('Lista vacía');
                    }
                    setLoading(false);
                    return;
                }

                const data = await getSetlistById(Number(id));
                setSetlist(data);
                if (data.songs.length > 0) {
                    setCurrentSongIndex(0);
                    setTitle(data.songs[0].song.title);
                } else {
                    setTitle('Lista vacía');
                }
                setLoading(false);
            } catch {
                setError('No se pudo cargar la lista');
                setLoading(false);
            }
        };
        loadSetlist();
    }, [id, setTitle, isOnline]);

    useEffect(() => {
        setShowBack(true);
        setOnBack(() => router.push('/setlists'));
        return () => {
            setShowBack(false);
            setTitle('Tu Cancionero');
        };
    }, [setShowBack, setOnBack, router, setTitle]);

    useEffect(() => {
        if (setlist && setlist.songs.length > 0 && setlist.songs[currentSongIndex]) {
            setTitle(setlist.songs[currentSongIndex].song.title);
        }
    }, [currentSongIndex, setlist, setTitle]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    if (error || !setlist) {
        return (
            <div className="text-center py-12 text-red-500">{error || 'Lista no encontrada'}</div>
        );
    }

    const songs = setlist.songs;
    if (songs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-app-muted">
                <Music className="w-12 h-12 mb-3 text-app-muted opacity-50" />
                <p className="text-lg font-semibold">Esta lista está vacía</p>
                <p className="text-sm">Agrega canciones desde el catálogo</p>
                <button
                    onClick={() => router.push('/canciones')}
                    className="mt-4 app-button px-4 py-2 rounded-lg"
                >
                    Explorar canciones
                </button>
            </div>
        );
    }

    const currentSong = songs[currentSongIndex];
    const rawTransposed =
        (currentSong.transposition || 0) !== 0
            ? transposeChordPro(currentSong.song.content, currentSong.transposition)
            : currentSong.song.content;
    const transposedContent = formatChordPro(rawTransposed);
    const fontSizeClass =
        FONT_SIZES[currentSong.fontSize as keyof typeof FONT_SIZES] || 'text-base';
    const chordColorClass = CHORD_COLOR_CLASSES[chordColor] || 'text-[var(--color-primary)]';

    const currentSongBpm = (() => {
        if (!currentSong?.song?.content) return 100;
        const match = currentSong.song.content.match(/\{(?:tempo|bpm):\s*(\d+)\}/i);
        return match ? parseInt(match[1], 10) : 100;
    })();

    return (
        <div className={`transition-all overflow-y-auto overflow-x-hidden scroll-smooth print:h-auto print:min-h-0 print:overflow-visible print:static print:block ${isFullscreen ? 'fixed inset-0 z-[100] bg-app' : 'min-h-screen flex flex-col'}`}>
            {/* Vista exclusiva para IMPRESIÓN / PDF de TODO EL SETLIST */}
            <div className="hidden print:block w-full text-black px-2 print:overflow-visible print:static">
                {/* Portada / Encabezado general del Setlist */}
                <div className="mb-6 pb-3 border-b-2 border-black flex items-baseline justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-black">{setlist.title}</h1>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Repertorio completo • {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
                        </p>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                        Mi Cancionero
                    </span>
                </div>

                {/* Lista de todas las canciones del Setlist en flujo continuo */}
                {songs.map((item: any, songIdx: number) => {
                    const itemTransposed = (item.transposition || 0) !== 0
                        ? transposeChordPro(item.song.content, item.transposition)
                        : item.song.content;
                    const itemContent = formatChordPro(itemTransposed);

                    return (
                        <div
                            key={item.id || songIdx}
                            className="mb-8 pb-4 border-b border-gray-200 last:border-b-0"
                        >
                            {/* Cabecera individual de cada canción enumerada */}
                            <div
                                className="mb-3 pb-1 border-b border-gray-400 flex items-baseline justify-between"
                                style={{ breakAfter: 'avoid', pageBreakAfter: 'avoid' }}
                            >
                                <div>
                                    <h2 className="text-xl font-bold text-black">
                                        <span className="text-gray-500 mr-2">{songIdx + 1}.</span>
                                        {item.song.title}
                                    </h2>
                                    {item.song.artist && (
                                        <p className="text-xs text-gray-700 mt-0.5">
                                            Artista: {item.song.artist}
                                        </p>
                                    )}
                                </div>
                                {item.transposition !== 0 && (
                                    <span className="text-xs font-mono font-bold text-gray-700">
                                        Tono: {item.transposition > 0 ? `+${item.transposition}` : item.transposition}
                                    </span>
                                )}
                            </div>

                            {/* Letra y acordes de esta canción */}
                            <div className={`overflow-x-hidden ${columns === 2 ? 'columns-2 gap-10' : ''}`}>
                                <div className={`whitespace-pre-wrap break-words font-mono ${fontSizeClass} text-black leading-relaxed`}>
                                    {itemContent.split('\n').map((line: string, lineIdx: number) => {
                                        const parts = line.split(/(\[[^\]]+\])/g);
                                        return (
                                            <div key={lineIdx} className="leading-relaxed">
                                                {parts.map((part: string, partIdx: number) => {
                                                    if (part.startsWith('[') && part.endsWith(']')) {
                                                        if (hideChords) return null; // Modo solo letra
                                                        const fullChord = part.slice(1, -1);
                                                        return (
                                                            <span
                                                                key={partIdx}
                                                                className={`inline-block font-bold print-chord ${chordColorClass}`}
                                                            >
                                                                {fullChord}
                                                            </span>
                                                        );
                                                    }
                                                    return <span key={partIdx} className="print-readable">{part}</span>;
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Barra de navegación de canciones del setlist */}
            <div className={`sticky ${isFullscreen ? 'top-0' : 'top-0'} z-40 app-glass border-b py-1 px-3 overflow-x-auto backdrop-blur shadow-sm print:hidden`}>
                <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
                    {/* Botón Canción Anterior */}
                    <button
                        onClick={() => setCurrentSongIndex(i => Math.max(0, i - 1))}
                        disabled={currentSongIndex === 0}
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-app hover:bg-[var(--color-border)] disabled:opacity-30 transition flex items-center gap-1 text-xs"
                        title="Canción anterior (Flecha Izq)"
                    >
                        <SkipBack className="w-4 h-4" />
                        <span className="hidden sm:inline">Anterior</span>
                    </button>

                    {/* Chips de canciones numeradas */}
                    <div className="flex gap-1.5 justify-center overflow-x-auto scrollbar-none py-0.5">
                        {songs.map((item: any, index: number) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentSongIndex(index)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition flex-shrink-0 ${index === currentSongIndex
                                    ? 'bg-[var(--color-primary)] text-white shadow-md scale-105'
                                    : 'bg-[var(--color-border)] text-app hover:opacity-80'
                                    }`}
                                title={item.song?.title}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {/* Botón Siguiente Canción */}
                    <button
                        onClick={() => setCurrentSongIndex(i => Math.min(songs.length - 1, i + 1))}
                        disabled={currentSongIndex === songs.length - 1}
                        className="p-1.5 rounded-lg border border-[var(--color-border)] text-app hover:bg-[var(--color-border)] disabled:opacity-30 transition flex items-center gap-1 text-xs"
                        title="Siguiente canción (Flecha Der)"
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <SkipForward className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Contenido interactivo de la canción en pantalla (se oculta al imprimir para dar paso a todo el setlist) */}
            <div
                className={`flex-1 overflow-y-auto px-2 sm:px-6 pt-2 ${isFullscreen ? 'pb-12' : 'pb-28'} print:hidden`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-full">
                    {/* Barra compacta de acciones sin título redundante */}
                    <div className="mb-2 pb-1.5 border-b border-[var(--color-border)]/50 flex items-center justify-between gap-2 print:hidden">
                        <div className="flex items-center gap-2">
                            {currentSong.song.artist && (
                                <span className="text-xs font-medium text-app-muted truncate max-w-[240px]">
                                    {currentSong.song.artist}
                                </span>
                            )}
                        </div>

                        {/* Grupo derecho: botones rápidos + menú de tres puntos */}
                        <div className="flex items-center gap-1.5">
                            {/* AutoScroll Toggle */}
                            <button
                                onClick={() => setShowAutoScroll(s => !s)}
                                className={`hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition ${showAutoScroll ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'border border-[var(--color-border)] text-app hover:bg-[var(--color-border)]'
                                    }`}
                            >
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span>Auto-Scroll</span>
                            </button>

                            {/* Metrónomo */}
                            <button
                                onClick={() => setIsMetronomeOpen(m => !m)}
                                className={`hidden sm:flex p-2 rounded-xl border transition items-center gap-1 text-xs font-medium ${isMetronomeOpen
                                    ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm'
                                    : 'border border-[var(--color-border)] hover:bg-[var(--color-border)] text-app'
                                    }`}
                                title={isMetronomeOpen ? "Detener metrónomo" : "Iniciar metrónomo"}
                            >
                                <Radio className={`w-4 h-4 ${isMetronomeOpen ? 'text-white animate-pulse' : 'text-[var(--color-primary)]'}`} />
                                <span>Metrónomo</span>
                            </button>

                            {/* Ajustes de visualización */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="hidden sm:flex p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] text-app transition items-center gap-1 text-xs font-medium"
                                title="Ajustes de visualización (color, modo letra, columnas)"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                <span>Ajustes</span>
                            </button>

                            {/* Tres puntos: siempre visible */}
                            <div className="relative flex items-center">
                                <button
                                    onClick={() => setShowMobileMenu(m => !m)}
                                    className={`p-2 rounded-xl border border-[var(--color-border)] text-app transition ${showMobileMenu
                                        ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'hover:bg-[var(--color-border)]'
                                        }`}
                                    aria-label="Más opciones"
                                    title="Más opciones"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {showMobileMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-black/20"
                                            onClick={() => setShowMobileMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl app-card shadow-2xl border border-[var(--color-border)] z-50 divide-y divide-[var(--color-border)]">
                                            {/* Opciones solo mobile */}
                                            <div className="p-1 sm:hidden">
                                                <button
                                                    onClick={() => {
                                                        setShowAutoScroll(s => !s);
                                                        setShowMobileMenu(false);
                                                    }}
                                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium rounded-xl transition ${showAutoScroll
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

                                                <button
                                                    onClick={() => {
                                                        setIsMetronomeOpen(m => !m);
                                                        setShowMobileMenu(false);
                                                    }}
                                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium rounded-xl transition ${isMetronomeOpen
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

                                                <button
                                                    onClick={() => {
                                                        setIsSettingsOpen(true);
                                                        setShowMobileMenu(false);
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-app hover:bg-[var(--color-border)] rounded-xl transition"
                                                >
                                                    <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
                                                    Ajustes del visor
                                                </button>
                                            </div>

                                            {/* Exportar PDF */}
                                            <div className="p-1">
                                                <button
                                                    onClick={() => {
                                                        setShowMobileMenu(false);
                                                        handlePrintPdf();
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-app hover:bg-[var(--color-border)] rounded-xl transition"
                                                >
                                                    <FileDown className="w-4 h-4 text-emerald-500" />
                                                    Exportar Setlist en PDF
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Letra y acordes con soporte para 2 columnas */}
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
                                                return (
                                                    <button
                                                        key={j}
                                                        onClick={() => handleChordClick(fullChord)}
                                                        className={`inline-block text-left ${chordColorClass} font-bold hover:underline cursor-pointer focus:outline-none print-chord`}
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
            </div>

            {/* Widget flotante de Auto-Scroll */}
            {showAutoScroll && (
                <AutoScrollController
                    scrollContainerId="main-scroll-container"
                    onClose={() => setShowAutoScroll(false)}
                />
            )}

            {/* Controles flotantes a la derecha */}
            <div
                className={`fixed right-4 sm:right-8 bottom-24 sm:bottom-12 flex flex-col items-center gap-2.5 transition-all duration-300 ${(isVisible || isHovering) ? 'opacity-100' : 'opacity-40'} z-50 print:hidden`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={toggleFullscreen}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Pantalla completa"
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                    <div className="p-2 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition">
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] text-app-muted">
                        {isFullscreen ? 'Salir' : 'Pantalla'}
                    </span>
                </button>

                <div className="flex flex-col items-center gap-0.5 bg-app-surface/80 p-1 rounded-2xl border border-[var(--color-border)] shadow-lg backdrop-blur-md">
                    <button
                        onClick={() => handleTranspose(1)}
                        className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-app-muted hover:text-[var(--color-primary)] transition"
                        title="Subir tono (+1)"
                    >
                        <ChevronRight className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-app min-w-[16px] text-center">
                        {(currentSong.transposition || 0) === 0 ? '0' : `${(currentSong.transposition || 0) > 0 ? '+' : ''}${currentSong.transposition}`}
                    </span>
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-1.5 rounded-full hover:bg-[var(--color-border)] text-app-muted hover:text-[var(--color-primary)] transition"
                        title="Bajar tono (-1)"
                    >
                        <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </button>
                    <span className="text-[9px] text-app-muted">Tono</span>
                </div>

                <button
                    onClick={handleFontSizeCycle}
                    className="flex flex-col items-center gap-0.5 group"
                >
                    <div className="p-2 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition">
                        <Type className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-app-muted">
                        {FONT_SIZE_LABELS[currentSong.fontSize as keyof typeof FONT_SIZE_LABELS] || 'M'}
                    </span>
                </button>

                {/* Distribución de Columnas (1 o 2 columnas) */}
                <button
                    onClick={() => setColumns(c => c === 1 ? 2 : 1)}
                    className="flex flex-col items-center gap-0.5 group"
                    title={columns === 2 ? 'Cambiar a 1 columna' : 'Cambiar a 2 columnas'}
                    aria-label="Distribución en columnas"
                >
                    <div className={`p-2 rounded-full app-glass shadow-lg transition ${columns === 2 ? 'bg-[var(--color-primary)] text-white shadow-[var(--color-primary)]/20' : 'text-app-muted hover:text-[var(--color-primary)]'}`}>
                        <Columns className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] ${columns === 2 ? 'text-[var(--color-primary)] font-bold' : 'text-app-muted'}`}>
                        {columns === 2 ? '2 Col' : '1 Col'}
                    </span>
                </button>
            </div>

            {/* Metrónomo flotante interactivo y no bloqueante */}
            <Metronome
                isOpen={isMetronomeOpen}
                onClose={() => setIsMetronomeOpen(false)}
                initialBpm={currentSongBpm}
                autoPlayOnOpen={true}
            />

            {/* Modal para Acordes */}
            <ChordModal
                chord={selectedChord}
                chordName={selectedChordName}
                isOpen={isChordModalOpen}
                onClose={() => setIsChordModalOpen(false)}
                allowToggle={true}
                initialView="guitar"
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
