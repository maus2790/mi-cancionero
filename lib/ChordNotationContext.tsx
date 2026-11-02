'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ChordNotation, formatChord, formatChordPro, formatKey, toCanonicalAngloChord } from '@/lib/chords';
import { updateUserPreferences } from '@/app/actions/auth';
import toast from 'react-hot-toast';

interface ChordNotationContextType {
    notation: ChordNotation;
    setNotation: (newNotation: ChordNotation) => Promise<void>;
    formatChord: (chord: string) => string;
    formatChordPro: (content: string) => string;
    formatKey: (key: string) => string;
    toCanonicalAngloChord: (chord: string) => string;
}

const STORAGE_KEY = 'cancionero_chord_notation_style';

const ChordNotationContext = createContext<ChordNotationContextType | undefined>(undefined);

export function ChordNotationProvider({ children }: { children: ReactNode }) {
    const [notation, setNotationState] = useState<ChordNotation>('anglosaxon');

    // Cargar preferencia inicial desde localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'latin' || saved === 'anglosaxon') {
                setNotationState(saved);
            }
        } catch {
            // Ignorar en caso de restricciones de storage
        }
    }, []);

    const setNotation = useCallback(async (newNotation: ChordNotation) => {
        setNotationState(newNotation);
        try {
            localStorage.setItem(STORAGE_KEY, newNotation);
        } catch {}

        try {
            await updateUserPreferences({ chordNotation: newNotation });
        } catch {
            // Usuario no autenticado u offline
        }

        const label = newNotation === 'latin' ? 'Sistema Latino (Do, Re, Mi...)' : 'Sistema Anglosajón (C, D, E...)';
        toast.success(`Estilo de acordes: ${label}`, { id: 'chord-notation-toast' });
    }, []);

    const formatChordBound = useCallback((chord: string) => {
        return formatChord(chord, notation);
    }, [notation]);

    const formatChordProBound = useCallback((content: string) => {
        return formatChordPro(content, notation);
    }, [notation]);

    const formatKeyBound = useCallback((key: string) => {
        return formatKey(key, notation);
    }, [notation]);

    return (
        <ChordNotationContext.Provider
            value={{
                notation,
                setNotation,
                formatChord: formatChordBound,
                formatChordPro: formatChordProBound,
                formatKey: formatKeyBound,
                toCanonicalAngloChord,
            }}
        >
            {children}
        </ChordNotationContext.Provider>
    );
}

export function useChordNotation() {
    const context = useContext(ChordNotationContext);
    if (!context) {
        throw new Error('useChordNotation must be used within ChordNotationProvider');
    }
    return context;
}
