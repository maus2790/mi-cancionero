'use client';

import { useState, useEffect, ReactNode } from 'react';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

export interface PianoData {
    startingNote: string;
    notes: string[];
}

interface ChordEditorPianoProps {
    initialData?: PianoData;
    onChange: (data: PianoData) => void;
    width?: number;
}

export function ChordEditorPiano({ initialData, onChange, width = 460 }: ChordEditorPianoProps) {
    const defaultData: PianoData = { startingNote: 'C', notes: [] };
    const currentData = initialData || defaultData;
    
    const [startingNote, setStartingNote] = useState<string>(currentData.startingNote || 'C');
    const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set(currentData.notes || []));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (initialData) {
            setStartingNote(initialData.startingNote || 'C');
            setActiveNotes(new Set(initialData.notes || []));
        }
    }, [initialData?.startingNote, (initialData?.notes || []).join(',')]);

    const handleStartingNoteChange = (newStart: string) => {
        setStartingNote(newStart);
        // Opcional: limpiar las notas activas si el usuario cambia la octava, o mantenerlas.
        // Las mantendremos para no borrar su trabajo accidentalmente.
        onChange({ startingNote: newStart, notes: Array.from(activeNotes) });
    };

    const toggleNote = (note: string) => {
        const next = new Set(activeNotes);
        if (next.has(note)) {
            next.delete(note);
        } else {
            next.add(note);
        }
        setActiveNotes(next);
        onChange({ startingNote, notes: Array.from(next) });
    };

    const startIndex = NOTES.indexOf(startingNote);
    const octaveNotes: { note: string; isWhite: boolean; isBlack: boolean }[] = [];
    
    for (let i = 0; i < 12; i++) {
        const noteIndex = (startIndex + i) % 12;
        const note = NOTES[noteIndex];
        octaveNotes.push({
            note,
            isWhite: WHITE_KEYS.includes(note),
            isBlack: BLACK_KEYS.includes(note)
        });
    }

    const whiteKeysCount = 7; // Una octava de 12 semitonos siempre tiene 7 teclas blancas
    const whiteKeyWidthPct = 100 / whiteKeysCount;
    const blackKeyWidthPct = whiteKeyWidthPct * 0.62;

    let xPct = 0;
    const whiteKeyElements: ReactNode[] = [];
    const blackKeyElements: ReactNode[] = [];

    octaveNotes.forEach(({ note, isWhite, isBlack }, i) => {
        const isActive = activeNotes.has(note);

        if (isWhite) {
            whiteKeyElements.push(
                <div
                    key={`white-${note}-${i}`}
                    onClick={() => toggleNote(note)}
                    className="absolute bottom-0 border border-gray-300 dark:border-gray-500 rounded-b cursor-pointer select-none transition-colors"
                    style={{
                        left: `${xPct}%`,
                        width: `${whiteKeyWidthPct}%`,
                        height: '100%',
                        backgroundColor: isActive ? '#3b82f6' : 'white',
                        zIndex: 1,
                    }}
                    title={note}
                >
                    {isActive && (
                        <span
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 font-bold text-white text-xs sm:text-sm"
                        >
                            {note}
                        </span>
                    )}
                </div>
            );
            xPct += whiteKeyWidthPct;
        } else if (isBlack) {
            const blackXPct = xPct - blackKeyWidthPct / 2;
            blackKeyElements.push(
                <div
                    key={`black-${note}-${i}`}
                    onClick={() => toggleNote(note)}
                    className="absolute top-0 rounded-b cursor-pointer select-none transition-colors"
                    style={{
                        left: `${blackXPct}%`,
                        width: `${blackKeyWidthPct}%`,
                        height: '60%',
                        backgroundColor: isActive ? '#2563eb' : '#1f2937',
                        zIndex: 2,
                    }}
                    title={note}
                >
                    {isActive && (
                        <span
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 font-bold text-white text-[10px] sm:text-xs"
                        >
                            {note.replace('#', String.fromCharCode(9839))}
                        </span>
                    )}
                </div>
            );
        }
    });

    const noteList = Array.from(activeNotes);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Nota inicial del teclado:</label>
                <select
                    value={startingNote}
                    onChange={(e) => handleStartingNoteChange(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                >
                    {NOTES.map(note => (
                        <option key={`start-${note}`} value={note}>{note}</option>
                    ))}
                </select>
            </div>

            <div
                className="relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 w-full max-w-full"
                style={{ maxWidth: width, aspectRatio: '7 / 4.5' }}
            >
                {whiteKeyElements}
                {blackKeyElements}
            </div>

            <div className="flex flex-wrap gap-2 min-h-[28px] items-center">
                {noteList.length === 0 ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Toca las teclas para marcar las notas del acorde
                    </span>
                ) : (
                    noteList.map(note => (
                        <span
                            key={note}
                            onClick={() => toggleNote(note)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            title="Clic para quitar"
                        >
                            {note}
                            <span className="opacity-60">x</span>
                        </span>
                    ))
                )}
                {noteList.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setActiveNotes(new Set()); onChange({ startingNote, notes: [] }); }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
                    >
                        Limpiar todo
                    </button>
                )}
            </div>
        </div>
    );
}