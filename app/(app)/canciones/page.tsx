'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSongs, getArtists, getStyles, getEnganchados, toggleFavorite, hasUserSongs } from '@/app/actions/songs';
import { Search, Plus, Filter, X } from 'lucide-react';
import { AddToSetlistModal } from '@/components/AddToSetlistModal';
import { EnganchadosModal } from '@/components/EnganchadosModal';
import { getUserSetlists } from '@/app/actions/setlists';
import { SongCard } from '@/components/SongCard';
import { useTitle } from '@/lib/TitleContext';
import { useAudioCleanup } from '@/hooks/useAudioCleanup';
import toast from 'react-hot-toast';
import { getCurrentUser } from '@/app/actions/auth';
import { canCreateContent, type ContentUser } from '@/lib/permissions';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useOfflineMode } from '@/lib/hooks/useOfflineMode';
import { getOfflineSongs } from '@/lib/offline-db';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STYLES = ['Adoración', 'Gozo', 'Contemporánea', 'Balada', 'Ritmo', 'Tradicional', 'Otro'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FILTER_STORAGE_KEY = 'canciones_filters';

function getSavedFilters() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(FILTER_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export default function SongsPage() {
    const router = useRouter();
    const { setTitle, setShowBack } = useTitle();
    const [songs, setSongs] = useState<any[]>([]);
    const [search, setSearch] = useState<string>(() => getSavedFilters().search ?? '');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<number>(() => getSavedFilters().page ?? 1);
    const [totalPages, setTotalPages] = useState(1);
    const [artists, setArtists] = useState<string[]>([]);
    const [styles, setStyles] = useState<string[]>([]);
    const [enganchadosList, setEnganchadosList] = useState<string[]>([]);
    const [selectedArtist, setSelectedArtist] = useState<string>(() => getSavedFilters().selectedArtist ?? '');
    const [selectedKey, setSelectedKey] = useState<string>(() => getSavedFilters().selectedKey ?? '');
    const [selectedStyle, setSelectedStyle] = useState<string>(() => getSavedFilters().selectedStyle ?? '');
    const [selectedEnganchado, setSelectedEnganchado] = useState<string>(() => getSavedFilters().selectedEnganchado ?? '');
    const [showEnganchadosModal, setShowEnganchadosModal] = useState(false);
    const [onlyMySongs, setOnlyMySongs] = useState<boolean>(() => getSavedFilters().onlyMySongs ?? false);
    const [showFilters, setShowFilters] = useState<boolean>(() => getSavedFilters().showFilters ?? false);
    const [showAlphabet, setShowAlphabet] = useState<boolean>(() => getSavedFilters().showAlphabet ?? false);
    const [selectedLetter, setSelectedLetter] = useState<string>(() => getSavedFilters().selectedLetter ?? '');
    const [userSetlists, setUserSetlists] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
    const [selectedSongTitle, setSelectedSongTitle] = useState('');
    const filterRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const touchStartYRef = useRef<number | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [currentUser, setCurrentUser] = useState<ContentUser | null>(null);
    const [userHasSongs, setUserHasSongs] = useState(false);
    useAudioCleanup(audioRef);
    const { isOnline } = useNetworkStatus();
    const { isSectionOffline } = useOfflineMode();
    const limit = 10;

    // Persistir filtros en localStorage cada vez que cambian
    useEffect(() => {
        try {
            localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
                search, page, selectedArtist, selectedKey, selectedStyle,
                selectedEnganchado, onlyMySongs, showFilters, showAlphabet, selectedLetter,
            }));
        } catch { }
    }, [search, page, selectedArtist, selectedKey, selectedStyle, selectedEnganchado, onlyMySongs, showFilters, showAlphabet, selectedLetter]);

    useEffect(() => {
        setTitle('Canciones');
        setShowBack(false);
    }, [setTitle, setShowBack]);

    useEffect(() => {
        const loadSetlists = async () => {
            if (!isOnline) {
                try {
                    const { getOfflineSetlists } = await import('@/lib/offline-db');
                    const offlineLists = await getOfflineSetlists();
                    setUserSetlists(offlineLists);
                } catch (e) { }
                return;
            }
            try {
                const lists = await getUserSetlists();
                setUserSetlists(lists);
            } catch (e) {
                // Usuario no autenticado o error
            }
        };
        loadSetlists();
        if (isOnline) {
            getCurrentUser().then(setCurrentUser).catch(() => { });
            hasUserSongs().then(setUserHasSongs).catch(() => { });
        } else {
            setCurrentUser({
                id: 0,
                role: 'user',
                provider: 'guest',
            });
        }
    }, [isOnline]);

    useEffect(() => {
        const loadFilters = async () => {
            if (!isOnline) return;
            try {
                const [artistsData, stylesData, enganchadosData] = await Promise.all([
                    getArtists(),
                    getStyles(),
                    getEnganchados(),
                ]);
                setArtists(artistsData.filter(a => a !== null));
                setStyles(stylesData.filter(s => s !== null));
                setEnganchadosList(enganchadosData || []);
            } catch (e) { }
        };
        loadFilters();
    }, [isOnline]);

    useEffect(() => {
        loadSongs();
    }, [search, page, selectedArtist, selectedKey, selectedStyle, selectedEnganchado, selectedLetter, onlyMySongs, isOnline]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilters(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadSongs = async () => {
        setLoading(true);
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        const filters: any = {};
        if (selectedArtist) filters.artist = selectedArtist;
        if (selectedKey) filters.key = selectedKey;
        if (selectedStyle) filters.style = selectedStyle;
        if (selectedEnganchado) filters.enganchado = selectedEnganchado;
        if (onlyMySongs) filters.mine = true;

        const trimmedSearch = search.trim();

        if (!isOnline) {
            const offlineSongs = await getOfflineSongs();
            let filtered = offlineSongs;

            if (trimmedSearch) {
                const s = trimmedSearch.toLowerCase();
                filtered = filtered.filter(item =>
                    item.title?.toLowerCase().includes(s) ||
                    item.artist?.toLowerCase().includes(s)
                );
            }
            if (selectedArtist) filtered = filtered.filter(s => s.artist === selectedArtist);
            if (selectedKey) filtered = filtered.filter(s => s.key === selectedKey);
            if (selectedStyle) filtered = filtered.filter(s => s.style === selectedStyle);
            if (selectedEnganchado) filtered = filtered.filter(s => s.enganchado === selectedEnganchado);
            if (selectedLetter) filtered = filtered.filter(s => s.title.toUpperCase().startsWith(selectedLetter));

            const total = Math.ceil(filtered.length / limit) || 1;
            const validPage = Math.min(Math.max(1, page), total);
            const offset = (validPage - 1) * limit;
            const paginated = filtered.slice(offset, offset + limit);

            setSongs(paginated);
            setTotalPages(total);
            if (page > total) {
                setPage(1);
            }
            setLoading(false);
            return;
        }

        if (selectedLetter) filters.letter = selectedLetter;

        const data = await getSongs(trimmedSearch, page, limit, filters);
        setSongs(data.items);
        setTotalPages(data.totalPages || 1);
        if (data.totalPages > 0 && page > data.totalPages) {
            setPage(1);
        }
        setLoading(false);
    };

    const clearFilter = (filterType: string) => {
        if (filterType === 'artist') setSelectedArtist('');
        if (filterType === 'key') setSelectedKey('');
        if (filterType === 'style') setSelectedStyle('');
        if (filterType === 'enganchado') setSelectedEnganchado('');
        if (filterType === 'letter') {
            setSelectedLetter('');
            setShowAlphabet(false);
        }
        if (filterType === 'search') setSearch('');
        if (filterType === 'mine') setOnlyMySongs(false);
        if (filterType === 'alphabet') {
            setShowAlphabet(false);
            setSelectedLetter('');
        }
        setPage(1);
    };

    const clearAllFilters = () => {
        setSelectedArtist('');
        setSelectedKey('');
        setSelectedStyle('');
        setSelectedEnganchado('');
        setSelectedLetter('');
        setShowAlphabet(false);
        setSearch('');
        setOnlyMySongs(false);
        setPage(1);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartXRef.current = e.touches[0].clientX;
        touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartXRef.current === null || touchStartYRef.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartXRef.current;
        const deltaY = touchEndY - touchStartYRef.current;

        touchStartXRef.current = null;
        touchStartYRef.current = null;

        if (loading || totalPages <= 1) return;

        // Umbral horizontal de 50px y predominio horizontal para no bloquear scroll vertical
        const minSwipeDistance = 50;
        if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
            if (deltaX < 0) {
                // Swipe hacia la izquierda -> siguiente página
                setPage(p => (p < totalPages ? p + 1 : p));
            } else {
                // Swipe hacia la derecha -> página anterior
                setPage(p => (p > 1 ? p - 1 : p));
            }
        }
    };

    const handleLetterClick = (letter: string) => {
        if (selectedLetter === letter) {
            setSelectedLetter('');
        } else {
            setSelectedLetter(letter);
        }
        setPage(1);
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    const handlePlayPause = (song: any) => {
        if (!song.audioUrl) return;

        if (playingId === song.id) {
            if (audioRef.current) {
                if (audioRef.current.paused) {
                    audioRef.current.play();
                } else {
                    audioRef.current.pause();
                    setPlayingId(null);
                }
            }
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        const audio = new Audio(song.audioUrl);
        audioRef.current = audio;
        audio.play();
        setPlayingId(song.id);
        audio.onended = () => setPlayingId(null);
    };

    const handleToggleFavorite = async (songId: number) => {
        const wasFavorite = songs.find(song => song.id === songId)?.isFavorite;
        try {
            await toggleFavorite(songId);
            toast.success(wasFavorite ? 'Eliminada de favoritos' : 'Añadida a favoritos');
        } catch {
            toast.error('No se pudo actualizar favoritos');
            return;
        }
        setSongs(prev => prev.map(s =>
            s.id === songId ? { ...s, isFavorite: !s.isFavorite } : s
        ));
    };

    const hasActiveFilters = selectedArtist || selectedKey || selectedStyle || selectedLetter || search || onlyMySongs || showAlphabet;

    return (
        <div className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-6">
            {/* Fila: buscador + filtro */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={toggleFilters}
                    className={`p-2 rounded-lg border transition flex-shrink-0 ${hasActiveFilters
                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                        : 'app-card text-app-muted'
                        }`}
                    aria-label="Toggle filters"
                >
                    <Filter className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted" />
                    <input
                        type="text"
                        placeholder="Buscar canción..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="app-input w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                    />
                    {search && (
                        <button
                            onClick={() => clearFilter('search')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Etiquetas de filtros activos */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {search && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                            Buscar: {search}
                            <button onClick={() => clearFilter('search')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedArtist && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                            Artista: {selectedArtist}
                            <button onClick={() => clearFilter('artist')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedKey && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                            Tono: {selectedKey}
                            <button onClick={() => clearFilter('key')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedStyle && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                            Estilo: {selectedStyle}
                            <button onClick={() => clearFilter('style')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedEnganchado && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm">
                            Enganchado: {selectedEnganchado}
                            <button onClick={() => clearFilter('enganchado')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {selectedLetter && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                            Letra: {selectedLetter}
                            <button onClick={() => clearFilter('letter')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {showAlphabet && !selectedLetter && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                            Abecedario
                            <button onClick={() => clearFilter('alphabet')} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {onlyMySongs && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                            Mis canciones
                            <button onClick={() => clearFilter('mine')} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-500 hover:text-red-700 px-2 py-1"
                    >
                        Limpiar todos
                    </button>
                </div>
            )}

            {/* Panel de filtros desplegable */}
            {showFilters && (
                <div
                    ref={filterRef}
                    className="relative app-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end"
                >
                    <button
                        onClick={() => setShowFilters(false)}
                        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-[var(--color-border)] transition text-app-muted"
                        aria-label="Cerrar filtros"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Artista
                        </label>
                        <select
                            value={selectedArtist}
                            onChange={(e) => {
                                setSelectedArtist(e.target.value);
                                setPage(1);
                            }}
                            className="app-input w-full px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="">Todos</option>
                            {artists.map((artist) => (
                                <option key={artist} value={artist}>
                                    {artist}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Tonalidad
                        </label>
                        <select
                            value={selectedKey}
                            onChange={(e) => {
                                setSelectedKey(e.target.value);
                                setPage(1);
                            }}
                            className="app-input w-full px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="">Todas</option>
                            {NOTES.map((note) => (
                                <option key={note} value={note}>{note}</option>
                            ))}
                            {NOTES.map((note) => <option key={`${note}m`} value={`${note}m`}>{note}m</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Estilo
                        </label>
                        <select
                            value={selectedStyle}
                            onChange={(e) => {
                                setSelectedStyle(e.target.value);
                                setPage(1);
                            }}
                            className="app-input w-full px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="">Todos</option>
                            {styles.map((style) => (
                                <option key={style} value={style}>
                                    {style}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Enganchados (después del filtro de estilo) */}
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">
                            Enganchados
                        </label>
                        <select
                            value={selectedEnganchado}
                            onChange={(e) => {
                                setSelectedEnganchado(e.target.value);
                                setPage(1);
                            }}
                            className="app-input w-full px-3 py-2 rounded-lg text-sm"
                        >
                            <option value="">Todos</option>
                            {enganchadosList.map((tag) => (
                                <option key={tag} value={tag}>
                                    {tag}
                                </option>
                            ))}
                        </select>
                    </div>

                    {userHasSongs && (
                        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-app cursor-pointer">
                            <input
                                type="checkbox"
                                checked={onlyMySongs}
                                onChange={(e) => { setOnlyMySongs(e.target.checked); setPage(1); }}
                                className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                            />
                            Solo mis canciones
                        </label>
                    )}
                    <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-app cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showAlphabet}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setShowAlphabet(checked);
                                if (!checked && selectedLetter) {
                                    setSelectedLetter('');
                                    setPage(1);
                                }
                            }}
                            className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                        />
                        Filtro por abecedario
                    </label>
                </div>
            )}

            {/* Contenido principal */}
            <div className="flex gap-4">
                {/* Índice alfabético (solo visible si showAlphabet está activado) */}
                {showAlphabet && (
                    <div className="flex flex-col gap-1 flex-shrink-0 w-8 sm:w-8 select-none transition-all duration-200">
                        {ALPHABET.map((letter) => (
                            <button
                                key={letter}
                                onClick={() => handleLetterClick(letter)}
                                className={`text-center py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium transition ${selectedLetter === letter
                                    ? 'bg-[var(--color-primary)] text-white font-bold'
                                    : 'text-app-muted hover:bg-[var(--color-border)]'
                                    }`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                )}

                <div
                    className="flex-1 min-w-0"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between text-xs text-app-muted px-1 mb-2">
                            <span>Página {page} de {totalPages}</span>
                            <span className="text-[11px] opacity-75 hidden sm:inline">Desliza en pantalla para cambiar de página</span>
                        </div>
                    )}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
                        </div>
                    ) : songs.length === 0 ? (
                        <div className="text-center py-12 text-app-muted">
                            <p>No hay canciones con estos filtros</p>
                            <button
                                onClick={clearAllFilters}
                                className="mt-2 text-[var(--color-primary)] hover:underline text-sm"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {songs.map((song) => (
                                <SongCard
                                    key={song.id}
                                    song={song}
                                    playingId={playingId}
                                    onPlayPause={handlePlayPause}
                                    isFavorite={song.isFavorite}
                                    onToggleFavorite={handleToggleFavorite}
                                    onAddToList={(songId, songTitle) => {
                                        setSelectedSongId(songId);
                                        setSelectedSongTitle(songTitle);
                                        setShowAddModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 app-card rounded-lg disabled:opacity-50 text-sm text-app"
                            >
                                Anterior
                            </button>
                            <span className="px-4 py-2 app-card rounded-lg text-sm text-app">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 app-card rounded-lg disabled:opacity-50 text-sm text-app"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Botón flotante para nueva canción */}
            {canCreateContent(currentUser) && <button
                onClick={() => router.push('/canciones/nueva')}
                className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 app-button p-3 rounded-full shadow-lg z-40"
            >
                <Plus className="w-6 h-6" />
            </button>}

            {/* Modal para agregar a setlist */}
            <AddToSetlistModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                songId={selectedSongId || 0}
                songTitle={selectedSongTitle}
                existingSetlists={userSetlists}
                currentTransposition={0}
                currentFontSize="medium"
                onSuccess={() => {
                    setShowAddModal(false);
                }}
            />

            {/* Modal para gestionar etiquetas de enganchados */}
            <EnganchadosModal
                isOpen={showEnganchadosModal}
                onClose={() => setShowEnganchadosModal(false)}
                tags={enganchadosList}
                onTagsChanged={async () => {
                    const tags = await getEnganchados();
                    setEnganchadosList(tags);
                    loadSongs();
                }}
            />
        </div>
    );
}
