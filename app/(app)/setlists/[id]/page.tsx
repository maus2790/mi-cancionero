'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSetlistById, updateSongInSetlist } from '@/app/actions/setlists';
import { transposeChordPro } from '@/lib/chords';
import { useTitle } from '@/lib/TitleContext';
import { Type, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useOfflineMode } from '@/lib/hooks/useOfflineMode';
import { getOfflineSetlistById } from '@/lib/offline-db';

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

export default function SetlistDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { setTitle, setShowBack, setOnBack } = useTitle();
    const [setlist, setSetlist] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [error, setError] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef<number | null>(null);
    const { isOnline } = useNetworkStatus();
    const { isSectionOffline } = useOfflineMode();

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

    const handleTranspose = async (delta: number) => {
        if (!setlist) return;
        const currentSong = setlist.songs[currentSongIndex];
        const newTranspose = currentSong.transposition + delta;

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
        const currentIndex = fontSizesArray.indexOf(currentSong.fontSize);
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
            } catch (err) {
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
                <p className="text-lg">Esta lista está vacía</p>
                <p className="text-sm">Agrega canciones desde la página de cada canción</p>
                <button
                    onClick={() => router.push('/canciones')}
                    className="mt-4 app-button px-4 py-2 rounded-lg"
                >
                    Ir a canciones
                </button>
            </div>
        );
    }

    const currentSong = songs[currentSongIndex];
    const transposedContent =
        currentSong.transposition !== 0
            ? transposeChordPro(currentSong.song.content, currentSong.transposition)
            : currentSong.song.content;
    const fontSizeClass =
        FONT_SIZES[currentSong.fontSize as keyof typeof FONT_SIZES] || 'text-base';

    return (
        <div className={`transition-all overflow-y-auto scroll-smooth ${isFullscreen ? 'fixed inset-0 z-50 bg-app' : 'min-h-screen flex flex-col'}`}>
            {/* Barra de números */}
            <div className={`fixed ${isFullscreen ? 'top-0 left-0 right-0' : 'top-16 left-0 right-0 min-[769px]:left-64'} z-40 app-glass border-b py-1 px-1 overflow-x-auto backdrop-blur shadow-sm`}>
                <div className="flex gap-0.5 justify-center min-w-max">
                    {songs.map((item: any, index: number) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentSongIndex(index)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${index === currentSongIndex
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-[var(--color-border)] text-app hover:opacity-80'
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido de la canción */}
            <div
                className="flex-1 overflow-y-auto px-4 pt-14 pb-20"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className={`max-w-4xl mx-auto whitespace-pre-wrap ${fontSizeClass} text-app`}>
                    {transposedContent.split('\n').map((line: string, i: number) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        return (
                            <div key={i} className="leading-relaxed">
                                {parts.map((part: string, j: number) => {
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                        return (
                                            <span key={j} className="text-[var(--color-primary)] font-bold">
                                                {part.slice(1, -1)}
                                            </span>
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
                className={`fixed right-3 sm:right-6 bottom-20 sm:bottom-8 flex flex-col items-center gap-3 transition-all duration-300 ${(isVisible || isHovering) ? 'opacity-100' : 'opacity-40'} z-50`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button
                    onClick={toggleFullscreen}
                    className="flex flex-col items-center gap-0.5 group"
                    aria-label="Pantalla completa"
                >
                    <div className="p-2 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition">
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] text-app-muted">
                        {isFullscreen ? 'Salir' : 'Pantalla'}
                    </span>
                </button>

                <div className="flex flex-col items-center gap-0.5">
                    <button
                        onClick={() => handleTranspose(-1)}
                        className="p-2 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-app min-w-[16px] text-center">
                        {currentSong.transposition === 0 ? '0' : `${currentSong.transposition > 0 ? '+' : ''}${currentSong.transposition}`}
                    </span>
                    <button
                        onClick={() => handleTranspose(1)}
                        className="p-2 rounded-full app-glass shadow-lg text-app-muted hover:text-[var(--color-primary)] transition"
                    >
                        <ChevronRight className="w-5 h-5" />
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
            </div>
        </div>
    );
}
