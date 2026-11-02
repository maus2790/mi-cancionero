// lib/chords.ts

export type ChordNotation = 'anglosaxon' | 'latin';

// Mapeos ordenados por longitud descendente para evitar colisiones
const ANGLO_TO_LATIN_TABLE: [string, string][] = [
    ['C#', 'Do#'],
    ['Db', 'Reb'],
    ['C', 'Do'],
    ['D#', 'Re#'],
    ['Eb', 'Mib'],
    ['D', 'Re'],
    ['E#', 'Mi#'],
    ['Fb', 'Fab'],
    ['E', 'Mi'],
    ['F#', 'Fa#'],
    ['Gb', 'Solb'],
    ['F', 'Fa'],
    ['G#', 'Sol#'],
    ['Ab', 'Lab'],
    ['G', 'Sol'],
    ['A#', 'La#'],
    ['Bb', 'Sib'],
    ['A', 'La'],
    ['B#', 'Si#'],
    ['Cb', 'Dob'],
    ['B', 'Si'],
];

const LATIN_TO_ANGLO_TABLE: [string, string][] = [
    ['Do#', 'C#'],
    ['Reb', 'Db'],
    ['Do', 'C'],
    ['Re#', 'D#'],
    ['Mib', 'Eb'],
    ['Re', 'D'],
    ['Mi#', 'E#'],
    ['Fab', 'Fb'],
    ['Mi', 'E'],
    ['Fa#', 'F#'],
    ['Sol#', 'G#'],
    ['Solb', 'Gb'],
    ['Sol', 'G'],
    ['Fa', 'F'],
    ['Lab', 'Ab'],
    ['La#', 'A#'],
    ['Sib', 'Bb'],
    ['La', 'A'],
    ['Si#', 'B#'],
    ['Dob', 'Cb'],
    ['Si', 'B'],
];

/**
 * Convierte un acorde individual al sistema anglosajón canónico (C, D, E...)
 */
export function toCanonicalAngloChord(chord: string): string {
    if (!chord) return '';
    return chord
        .split('/')
        .map((part) => {
            const trimmed = part.trim();
            for (const [lat, ang] of LATIN_TO_ANGLO_TABLE) {
                if (trimmed.startsWith(lat)) {
                    return ang + trimmed.slice(lat.length);
                }
            }
            return trimmed;
        })
        .join('/');
}

/**
 * Convierte un acorde individual al sistema latino (Do, Re, Mi...)
 */
export function toLatinChord(chord: string): string {
    if (!chord) return '';
    const angloChord = toCanonicalAngloChord(chord);
    return angloChord
        .split('/')
        .map((part) => {
            const trimmed = part.trim();
            for (const [ang, lat] of ANGLO_TO_LATIN_TABLE) {
                if (trimmed.startsWith(ang)) {
                    return lat + trimmed.slice(ang.length);
                }
            }
            return trimmed;
        })
        .join('/');
}

/**
 * Formatea un acorde según la preferencia de notación ('anglosaxon' | 'latin')
 */
export function formatChord(chord: string, notation: ChordNotation = 'anglosaxon'): string {
    if (!chord) return '';
    if (notation === 'latin') {
        return toLatinChord(chord);
    }
    return toCanonicalAngloChord(chord);
}

/**
 * Formatea una tonalidad (ej. 'G' -> 'Sol' o 'G' -> 'G')
 */
export function formatKey(key: string, notation: ChordNotation = 'anglosaxon'): string {
    if (!key) return '';
    return formatChord(key, notation);
}

/**
 * Formatea todo un texto en formato ChordPro ([G], [Cmaj7], etc.) a la notación deseada
 */
export function formatChordPro(content: string, notation: ChordNotation = 'anglosaxon'): string {
    if (!content) return '';
    return content.replace(/\[([^\]]+)\]/g, (match, chord) => {
        const formatted = formatChord(chord, notation);
        return `[${formatted}]`;
    });
}

/**
 * Transpone el contenido ChordPro un número determinado de semitonos
 */
export function transposeChordPro(content: string, semitones: number, targetNotation: ChordNotation = 'anglosaxon'): string {
    if (!content) return '';
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Primero convertimos temporalmente a formato anglosajón para transposición precisa
    const angloContent = content.replace(/\[([^\]]+)\]/g, (_, chord) => `[${toCanonicalAngloChord(chord)}]`);

    // Regex para capturar notas anglosajonas con posibles bajos
    const transposed = angloContent.replace(/\[([^\]]+)\]/g, (match, fullChord) => {
        const parts = fullChord.split('/');
        const transposedParts = parts.map((part: string) => {
            const trimmed = part.trim();
            const noteMatch = trimmed.match(/^([A-G][#b]?)(.*)$/);
            if (!noteMatch) return trimmed;
            const [, root, suffix] = noteMatch;
            const idx = notes.indexOf(root);
            if (idx === -1) return trimmed;
            const newIdx = (idx + semitones + 120) % 12;
            const newRoot = notes[newIdx];
            return `${newRoot}${suffix}`;
        });
        const finalAnglo = transposedParts.join('/');
        return `[${formatChord(finalAnglo, targetNotation)}]`;
    });

    return transposed;
}