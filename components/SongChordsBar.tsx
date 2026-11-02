'use client';

import { useState, useMemo } from 'react';
import { Guitar, ChevronRight, ChevronDown } from 'lucide-react';

interface SongChordsBarProps {
    content: string;
    onChordClick: (chordName: string) => void;
}

export function SongChordsBar({ content, onChordClick }: SongChordsBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Extraer acordes únicos del contenido
    const uniqueChords = useMemo(() => {
        if (!content) return [];
        const matches = content.match(/\[([A-G][#b]?[^\]\s]*)\]/g);
        if (!matches) return [];
        const chordSet = new Set<string>();
        matches.forEach(m => {
            const chord = m.slice(1, -1).trim();
            if (chord) chordSet.add(chord);
        });
        return Array.from(chordSet);
    }, [content]);

    if (uniqueChords.length === 0) return null;

    return (
        <div className="mb-4 app-card p-3 border border-[var(--color-border)] print:hidden">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(prev => !prev)}
                    className="flex items-center gap-2 text-xs font-semibold text-app hover:text-[var(--color-primary)] transition"
                >
                    <span className="p-1 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <Guitar className="w-3.5 h-3.5" />
                    </span>
                    <span>Acordes de la canción ({uniqueChords.length})</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <span className="text-[10px] text-app-muted">Toca para ver diagramas</span>
            </div>

            {/* Lista horizontal scrolleable o expandida */}
            <div className={`mt-2 flex gap-1.5 ${isExpanded ? 'flex-wrap' : 'overflow-x-auto pb-1 scrollbar-none'}`}>
                {uniqueChords.map((chord) => (
                    <button
                        key={chord}
                        onClick={() => onChordClick(chord)}
                        className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-[var(--color-border)]/40 hover:bg-[var(--color-primary)] hover:text-white border border-[var(--color-border)] text-xs font-bold text-app transition active:scale-95 shadow-sm"
                        title={`Ver diagrama de ${chord}`}
                    >
                        {chord}
                    </button>
                ))}
            </div>
        </div>
    );
}
