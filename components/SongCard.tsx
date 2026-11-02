'use client';

import Link from 'next/link';
import { Heart, ListPlus, Play, Pause, Video } from 'lucide-react';

interface SongCardProps {
    song: {
        id: number;
        title: string;
        artist?: string | null;
        key?: string | null;
        style?: string | null;
        enganchado?: string | null;
        isPublic?: boolean | null;
        audioUrl?: string | null;
        videoUrl?: string | null;
    };
    playingId: number | null;
    onPlayPause: (song: any) => void;
    isFavorite?: boolean;
    onToggleFavorite?: (songId: number) => void;
    onAddToList: (songId: number, songTitle: string) => void;
}

export function SongCard({ song, playingId, onPlayPause, isFavorite, onToggleFavorite, onAddToList }: SongCardProps) {
    const hasVideo = Boolean(song.videoUrl && song.videoUrl.trim() !== '');
    return (
        <div className={`app-card p-4 hover:shadow-lg transition ${!song.isPublic ? 'border-yellow-400 dark:border-yellow-600 ring-1 ring-yellow-200 dark:ring-yellow-900/50' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <Link href={`/canciones/${song.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg text-app truncate">
                        {song.title}
                    </h3>
                    {song.artist && (
                        <p className="text-sm text-app-muted truncate">
                            {song.artist}
                        </p>
                    )}
                    <div className="flex gap-2 mt-1 flex-wrap items-center">
                        {song.key && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {song.key}
                            </span>
                        )}
                        {song.style && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                {song.style}
                            </span>
                        )}
                        {song.enganchado && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                🔗 {song.enganchado}
                            </span>
                        )}
                        {!song.isPublic && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                                Privada
                            </span>
                        )}
                    </div>
                </Link>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {song.audioUrl && (
                        <button
                            onClick={() => onPlayPause(song)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition"
                            title={playingId === song.id ? 'Pausar' : 'Reproducir'}
                            aria-label={playingId === song.id ? 'Pausar' : 'Reproducir'}
                        >
                            {playingId === song.id ? (
                                <Pause className="w-5 h-5 text-[var(--color-primary)]" />
                            ) : (
                                <Play className="w-5 h-5 text-app-muted hover:text-[var(--color-primary)] transition" />
                            )}
                        </button>
                    )}
                    {hasVideo && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(song.videoUrl!, '_blank', 'noopener,noreferrer');
                            }}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition text-app-muted hover:text-[var(--color-primary)]"
                            title="Ver video"
                            aria-label="Ver video"
                        >
                            <Video className="w-5 h-5" />
                        </button>
                    )}
                    {onToggleFavorite && (
                        <button
                            onClick={() => onToggleFavorite(song.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition"
                            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                            <Heart className={`w-5 h-5 transition ${isFavorite ? 'fill-red-500 text-red-500' : 'text-app-muted hover:text-red-500'}`} />
                        </button>
                    )}
                    <button
                        onClick={() => onAddToList(song.id, song.title)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-border)] transition"
                        title="Agregar a lista"
                    >
                        <ListPlus className="w-5 h-5 text-app-muted hover:text-[var(--color-primary)] transition" />
                    </button>
                </div>
            </div>
        </div>
    );
}
