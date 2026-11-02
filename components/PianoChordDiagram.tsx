'use client';

import { useMemo, ReactNode } from 'react';

interface PianoChordDiagramProps {
    chordName: string;
    width?: number;
    notes?: string[];
    startingNote?: string;
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_KEYS = ['C#', 'D#', 'F#', 'G#', 'A#'];

export function PianoChordDiagram({ chordName, width = 200, notes, startingNote = 'C' }: PianoChordDiagramProps) {
    const chordNotes = useMemo(() => {
        if (notes && notes.length > 0) return Array.from(new Set(notes));
        return [];
    }, [notes]);

    const noteSet = new Set(chordNotes);

    const startIndex = NOTES.indexOf(startingNote) !== -1 ? NOTES.indexOf(startingNote) : 0;
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

    const whiteKeysCount = 7;
    const whiteKeyWidth = width / whiteKeysCount;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    const height = Math.round(width * 0.5);

    let x = 0;
    const keys: ReactNode[] = [];

    octaveNotes.forEach(({ note, isWhite, isBlack }, i) => {
        const isActive = noteSet.has(note);

        if (isWhite) {
            keys.push(
                <div
                    key={`white-${note}-${i}`}
                    className="absolute bottom-0 border border-gray-300 dark:border-gray-600 rounded-b"
                    style={{
                        left: x,
                        width: whiteKeyWidth,
                        height: '100%',
                        backgroundColor: isActive ? '#3b82f6' : 'white',
                        zIndex: 1,
                    }}
                >
                    {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] text-white font-bold">
                            {note}
                        </span>
                    )}
                </div>
            );
            x += whiteKeyWidth;
        } else if (isBlack) {
            const blackX = x - blackKeyWidth / 2;
            keys.push(
                <div
                    key={`black-${note}-${i}`}
                    className="absolute top-0 rounded-b"
                    style={{
                        left: blackX,
                        width: blackKeyWidth,
                        height: '62%',
                        backgroundColor: isActive ? '#2563eb' : '#1f2937',
                        zIndex: 2,
                    }}
                >
                    {isActive && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[5px] text-white font-bold">
                            {note}
                        </span>
                    )}
                </div>
            );
        }
    });

    return (
        <div className="relative inline-block overflow-hidden" style={{ width, height }}>
            {keys}
        </div>
    );
}