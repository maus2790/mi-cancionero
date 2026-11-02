'use client';

import { RefObject, useEffect } from 'react';

/** Detiene y libera un reproductor cuando se abandona la pantalla. */
export function useAudioCleanup(audioRef: RefObject<HTMLAudioElement | null>) {
    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
        };
    }, [audioRef]);
}
