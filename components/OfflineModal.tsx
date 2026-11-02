'use client';

import { useState } from 'react';
import {
    Download,
    WifiOff,
    X,
    RefreshCw,
    LogOut,
} from 'lucide-react';

import { useOfflineMode } from '@/lib/hooks/useOfflineMode';

import {
    getAllSongsForOffline,
    getAllSetlistsForOffline,
    getAllFavoritesForOffline,
} from '@/app/actions/offline';

import { getAllChords } from '@/app/actions/chords';

import {
    saveSongsOffline,
    saveChordsOffline,
    saveSetlistsOffline,
    saveFavoritesOffline,
    clearAllOfflineData,
} from '@/lib/offline-db';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function OfflineModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const router = useRouter();

    const {
        config,
        updateConfig,
        reload,
        isSectionOffline,
    } = useOfflineMode();

    const [downloading, setDownloading] = useState(false);

    const [progress, setProgress] = useState({
        current: 0,
        total: 0,
        text: '',
    });

    /*
     * Opciones locales del modal antes de guardar.
     */
    const [selectedSections, setSelectedSections] = useState({
        songs: isSectionOffline('songs'),
        chords: isSectionOffline('chords'),
        setlists: isSectionOffline('setlists'),
        favorites: isSectionOffline('favorites'),
    });

    if (!isOpen) {
        return null;
    }

    const hasData =
        config.isEnabled && config.lastSyncAt;

    /*
     * Cambiar selección de una sección.
     */
    const handleToggle = (
        section: keyof typeof selectedSections
    ) => {
        setSelectedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    /*
     * Cerrar haciendo clic en el overlay.
     *
     * El evento solo se ejecutará cuando el target
     * sea exactamente el overlay.
     */
    const handleOverlayClick = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {
        if (downloading) return;

        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    /*
     * Descargar contenido para uso offline.
     */
    const handleDownload = async () => {
        const sectionsToDownload = Object.entries(
            selectedSections
        )
            .filter(([_, isSelected]) => isSelected)
            .map(([key]) => key);

        if (sectionsToDownload.length === 0) {
            toast.error(
                'Selecciona al menos una sección'
            );
            return;
        }

        setDownloading(true);

        try {
            let step = 0;

            const totalSteps =
                sectionsToDownload.length;

            let songCount = 0;
            let chordCount = 0;
            let setlistCount = 0;
            let favoriteCount = 0;

            /*
             * CANCIONES
             */
            if (selectedSections.songs) {
                step++;

                setProgress({
                    current: step,
                    total: totalSteps,
                    text: 'Descargando canciones...',
                });

                const songs =
                    await getAllSongsForOffline();

                await saveSongsOffline(songs);

                songCount = songs.length;

                try {
                    router.prefetch('/canciones');

                    await fetch('/canciones');

                    const chunkSize = 10;

                    for (
                        let i = 0;
                        i < songs.length;
                        i += chunkSize
                    ) {
                        const chunk = songs.slice(
                            i,
                            i + chunkSize
                        );

                        await Promise.all(
                            chunk.map(
                                (song: any) =>
                                    fetch(
                                        `/canciones/${song.id}`
                                    ).catch(() => { })
                            )
                        );
                    }
                } catch (e) {
                    console.warn(
                        'No se pudieron precargar algunas páginas de canciones',
                        e
                    );
                }
            }

            /*
             * ACORDES
             */
            if (selectedSections.chords) {
                step++;

                setProgress({
                    current: step,
                    total: totalSteps,
                    text: 'Descargando acordes...',
                });

                const chords =
                    await getAllChords();

                await saveChordsOffline(chords);

                chordCount = chords.length;

                try {
                    router.prefetch('/acordes');

                    await fetch('/acordes');
                } catch (e) {
                    console.warn(
                        'No se pudo precargar la página de acordes',
                        e
                    );
                }
            }

            /*
             * REPERTORIOS
             */
            if (selectedSections.setlists) {
                step++;

                setProgress({
                    current: step,
                    total: totalSteps,
                    text: 'Descargando repertorios...',
                });

                const setlists =
                    await getAllSetlistsForOffline();

                await saveSetlistsOffline(setlists);

                setlistCount = setlists.length;

                try {
                    router.prefetch('/setlists');

                    await fetch('/setlists');

                    const chunkSize = 5;

                    for (
                        let i = 0;
                        i < setlists.length;
                        i += chunkSize
                    ) {
                        const chunk = setlists.slice(
                            i,
                            i + chunkSize
                        );

                        await Promise.all(
                            chunk.map(
                                (list: any) =>
                                    fetch(
                                        `/setlists/${list.id}`
                                    ).catch(() => { })
                            )
                        );
                    }
                } catch (e) {
                    console.warn(
                        'No se pudieron precargar algunos repertorios',
                        e
                    );
                }
            }

            /*
             * FAVORITOS
             */
            if (selectedSections.favorites) {
                step++;

                setProgress({
                    current: step,
                    total: totalSteps,
                    text: 'Descargando favoritos...',
                });

                const favorites =
                    await getAllFavoritesForOffline();

                await saveFavoritesOffline(
                    favorites
                );

                favoriteCount =
                    favorites.length;

                try {
                    router.prefetch('/favoritos');

                    await fetch('/favoritos');
                } catch (e) {
                    console.warn(
                        'No se pudo precargar la página de favoritos',
                        e
                    );
                }
            }

            /*
             * Descarga terminada.
             */
            setProgress({
                current: totalSteps,
                total: totalSteps,
                text: '¡Descarga completada!',
            });

            /*
             * Guardar configuración.
             */
            await updateConfig({
                isEnabled: true,

                sections: sectionsToDownload,

                lastSyncAt: Date.now(),

                songCount: selectedSections.songs
                    ? songCount
                    : config.songCount,

                chordCount: selectedSections.chords
                    ? chordCount
                    : config.chordCount,

                setlistCount:
                    selectedSections.setlists
                        ? setlistCount
                        : config.setlistCount,

                favoriteCount:
                    selectedSections.favorites
                        ? favoriteCount
                        : config.favoriteCount,
            });

            toast.success(
                'Datos guardados para uso sin conexión'
            );

            /*
             * Pequeña pausa para mostrar
             * "Descarga completada".
             */
            setTimeout(() => {
                setDownloading(false);
                onClose();
            }, 1000);
        } catch (error) {
            console.error(
                'Error descargando datos offline:',
                error
            );

            toast.error(
                'Ocurrió un error en la descarga'
            );

            setDownloading(false);
        }
    };

    /*
     * Limpiar todos los datos offline.
     */
    const handleClear = async () => {
        if (
            !confirm(
                '¿Estás seguro de que quieres eliminar los datos descargados? (Esto deshabilitará el modo offline)'
            )
        ) {
            return;
        }

        await clearAllOfflineData();

        await reload();

        toast.success(
            'Modo offline desactivado y datos eliminados'
        );

        onClose();
    };

    /*
     * Porcentaje de progreso.
     */
    const progressPercentage =
        progress.total > 0
            ? Math.min(
                100,
                Math.round(
                    (progress.current /
                        progress.total) *
                    100
                )
            )
            : 0;

    return (
        /*
         * OVERLAY
         *
         * El modal puede cerrarse haciendo clic
         * directamente sobre este fondo.
         */
        <div
            className="
                fixed
                inset-0
                z-[100]
                flex
                items-start
                sm:items-center
                justify-center
                overflow-y-auto
                bg-black/55
                p-3
                sm:p-4
                backdrop-blur-sm
            "
            onMouseDown={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-modal-title"
        >
            {/*
             * CONTENEDOR PRINCIPAL
             *
             * max-h evita que el modal sea más alto
             * que la pantalla.
             */}
            <div
                className="
                    app-card
                    relative
                    w-full
                    max-w-md
                    max-h-[calc(100dvh-1.5rem)]
                    sm:max-h-[calc(100dvh-2rem)]
                    overflow-hidden
                    rounded-2xl
                    shadow-2xl
                    shadow-black/20
                    flex
                    flex-col
                "
                onMouseDown={(e) =>
                    e.stopPropagation()
                }
            >
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        px-4
                        py-3
                        sm:px-5
                        sm:py-3.5
                        border-b
                        border-black/5
                        dark:border-white/10
                        shrink-0
                    "
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className={`
                                flex
                                items-center
                                justify-center
                                w-9
                                h-9
                                shrink-0
                                rounded-xl
                                ${hasData
                                    ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }
                            `}
                        >
                            <WifiOff className="w-4.5 h-4.5" />
                        </div>

                        <div className="min-w-0">
                            <h2
                                id="offline-modal-title"
                                className="
                                    text-base
                                    sm:text-lg
                                    font-bold
                                    text-app
                                    truncate
                                "
                            >
                                Modo Offline
                            </h2>

                            <p className="text-[11px] sm:text-xs text-app-muted">
                                Contenido disponible sin conexión
                            </p>
                        </div>
                    </div>

                    {!downloading && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="
                                flex
                                items-center
                                justify-center
                                w-8
                                h-8
                                shrink-0
                                rounded-lg
                                text-app-muted
                                hover:text-app
                                hover:bg-black/5
                                dark:hover:bg-white/10
                                transition
                            "
                        >
                            <X className="w-4.5 h-4.5" />
                        </button>
                    )}
                </div>

                {/* =====================================================
                    CONTENIDO
                ====================================================== */}

                {downloading ? (
                    /*
                     * PROGRESO DE DESCARGA
                     */
                    <div
                        className="
                            flex
                            flex-col
                            items-center
                            justify-center
                            px-5
                            py-8
                            overflow-y-auto
                        "
                    >
                        <div
                            className="
                                flex
                                items-center
                                justify-center
                                w-14
                                h-14
                                mb-4
                                rounded-2xl
                                bg-cyan-50
                                dark:bg-cyan-900/20
                            "
                        >
                            <RefreshCw
                                className="
                                    w-7
                                    h-7
                                    text-cyan-500
                                    animate-spin
                                "
                            />
                        </div>

                        <h3
                            className="
                                text-base
                                font-semibold
                                text-app
                            "
                        >
                            Descargando datos...
                        </h3>

                        <p
                            className="
                                text-sm
                                text-app-muted
                                mt-1
                                mb-5
                                text-center
                            "
                        >
                            {progress.text}
                        </p>

                        <div className="w-full">
                            <div
                                className="
                                    w-full
                                    h-2
                                    overflow-hidden
                                    rounded-full
                                    bg-slate-200
                                    dark:bg-slate-800
                                "
                            >
                                <div
                                    className="
                                        h-full
                                        rounded-full
                                        bg-gradient-to-r
                                        from-cyan-500
                                        to-blue-500
                                        transition-all
                                        duration-300
                                    "
                                    style={{
                                        width: `${progressPercentage}%`,
                                    }}
                                />
                            </div>

                            <div className="flex justify-between mt-2">
                                <span className="text-[11px] text-app-muted">
                                    {progress.current} de{' '}
                                    {progress.total}
                                </span>

                                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                                    {progressPercentage}%
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* =================================================
                            DESCRIPCIÓN
                        ================================================== */}

                        <div className="px-4 pt-3.5 sm:px-5 sm:pt-4 shrink-0">
                            <p
                                className="
                                    text-xs
                                    sm:text-sm
                                    leading-relaxed
                                    text-app-muted
                                "
                            >
                                Descarga el contenido que
                                quieras utilizar sin
                                conexión. Los audios no se
                                descargan.
                            </p>
                        </div>

                        {/* =================================================
                            LISTA DE SECCIONES
                        ================================================== */}

                        <div
                            className="
                                px-4
                                sm:px-5
                                py-3
                                overflow-y-auto
                                min-h-0
                            "
                        >
                            <div className="space-y-2">
                                {/* CANCIONES */}

                                <label
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        dark:border-slate-700
                                        hover:bg-cyan-50/50
                                        dark:hover:bg-cyan-900/10
                                        cursor-pointer
                                        transition
                                    "
                                >
                                    <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-app">
                                            Canciones
                                        </span>

                                        {hasData &&
                                            config.sections.includes(
                                                'songs'
                                            ) && (
                                                <span className="block text-[11px] text-app-muted mt-0.5">
                                                    {
                                                        config.songCount
                                                    }{' '}
                                                    guardadas
                                                </span>
                                            )}
                                    </div>

                                    <input
                                        type="checkbox"
                                        className="
                                            w-4.5
                                            h-4.5
                                            shrink-0
                                            accent-cyan-600
                                        "
                                        checked={
                                            selectedSections.songs
                                        }
                                        onChange={() =>
                                            handleToggle(
                                                'songs'
                                            )
                                        }
                                    />
                                </label>

                                {/* ACORDES */}

                                <label
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        dark:border-slate-700
                                        hover:bg-cyan-50/50
                                        dark:hover:bg-cyan-900/10
                                        cursor-pointer
                                        transition
                                    "
                                >
                                    <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-app">
                                            Acordes
                                        </span>

                                        {hasData &&
                                            config.sections.includes(
                                                'chords'
                                            ) && (
                                                <span className="block text-[11px] text-app-muted mt-0.5">
                                                    {
                                                        config.chordCount
                                                    }{' '}
                                                    guardados
                                                </span>
                                            )}
                                    </div>

                                    <input
                                        type="checkbox"
                                        className="
                                            w-4.5
                                            h-4.5
                                            shrink-0
                                            accent-cyan-600
                                        "
                                        checked={
                                            selectedSections.chords
                                        }
                                        onChange={() =>
                                            handleToggle(
                                                'chords'
                                            )
                                        }
                                    />
                                </label>

                                {/* REPERTORIOS */}

                                <label
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        dark:border-slate-700
                                        hover:bg-cyan-50/50
                                        dark:hover:bg-cyan-900/10
                                        cursor-pointer
                                        transition
                                    "
                                >
                                    <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-app">
                                            Repertorios
                                        </span>

                                        {hasData &&
                                            config.sections.includes(
                                                'setlists'
                                            ) && (
                                                <span className="block text-[11px] text-app-muted mt-0.5">
                                                    {
                                                        config.setlistCount
                                                    }{' '}
                                                    guardados
                                                </span>
                                            )}
                                    </div>

                                    <input
                                        type="checkbox"
                                        className="
                                            w-4.5
                                            h-4.5
                                            shrink-0
                                            accent-cyan-600
                                        "
                                        checked={
                                            selectedSections.setlists
                                        }
                                        onChange={() =>
                                            handleToggle(
                                                'setlists'
                                            )
                                        }
                                    />
                                </label>

                                {/* FAVORITOS */}

                                <label
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-slate-200
                                        dark:border-slate-700
                                        hover:bg-cyan-50/50
                                        dark:hover:bg-cyan-900/10
                                        cursor-pointer
                                        transition
                                    "
                                >
                                    <div className="min-w-0">
                                        <span className="block text-sm font-semibold text-app">
                                            Favoritos
                                        </span>

                                        {hasData &&
                                            config.sections.includes(
                                                'favorites'
                                            ) && (
                                                <span className="block text-[11px] text-app-muted mt-0.5">
                                                    {
                                                        config.favoriteCount
                                                    }{' '}
                                                    guardados
                                                </span>
                                            )}
                                    </div>

                                    <input
                                        type="checkbox"
                                        className="
                                            w-4.5
                                            h-4.5
                                            shrink-0
                                            accent-cyan-600
                                        "
                                        checked={
                                            selectedSections.favorites
                                        }
                                        onChange={() =>
                                            handleToggle(
                                                'favorites'
                                            )
                                        }
                                    />
                                </label>
                            </div>
                        </div>

                        {/* =================================================
                            FOOTER / BOTONES
                        ================================================== */}

                        <div
                            className="
                                px-4
                                pb-4
                                pt-2
                                sm:px-5
                                sm:pb-5
                                shrink-0
                                border-t
                                border-black/5
                                dark:border-white/10
                            "
                        >
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="
                                        flex-1
                                        py-2.5
                                        px-3
                                        rounded-xl
                                        border
                                        border-slate-200
                                        dark:border-slate-700
                                        text-sm
                                        font-semibold
                                        text-app-muted
                                        hover:bg-black/5
                                        dark:hover:bg-white/5
                                        transition
                                    "
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="
                                        flex-[1.5]
                                        py-2.5
                                        px-3
                                        bg-gradient-to-r
                                        from-cyan-600
                                        to-blue-600
                                        text-white
                                        rounded-xl
                                        text-sm
                                        font-semibold
                                        shadow-md
                                        shadow-cyan-500/15
                                        hover:shadow-lg
                                        hover:shadow-cyan-500/25
                                        hover:opacity-95
                                        transition
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                    "
                                >
                                    <Download className="w-4 h-4" />

                                    {hasData
                                        ? 'Actualizar'
                                        : 'Descargar'}
                                </button>
                            </div>

                            {hasData && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="
                                        w-full
                                        mt-2
                                        py-2
                                        text-xs
                                        font-medium
                                        text-red-500
                                        hover:text-red-600
                                        hover:bg-red-50
                                        dark:hover:bg-red-900/20
                                        rounded-lg
                                        transition
                                        flex
                                        items-center
                                        justify-center
                                        gap-1.5
                                    "
                                >
                                    <LogOut className="w-3.5 h-3.5" />

                                    Salir del modo offline
                                </button>
                            )}

                            {hasData && (
                                <p
                                    className="
                                        text-center
                                        text-[10px]
                                        text-app-muted
                                        mt-2
                                    "
                                >
                                    Actualizado:{' '}
                                    {new Date(
                                        config.lastSyncAt!
                                    ).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}