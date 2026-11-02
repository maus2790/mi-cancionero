// Notas musicales
export const NOTE_OPTIONS = [
    { value: 'C', label: 'C' },
    { value: 'C#', label: 'C# / Db' },
    { value: 'D', label: 'D' },
    { value: 'D#', label: 'D# / Eb' },
    { value: 'E', label: 'E' },
    { value: 'F', label: 'F' },
    { value: 'F#', label: 'F# / Gb' },
    { value: 'G', label: 'G' },
    { value: 'G#', label: 'G# / Ab' },
    { value: 'A', label: 'A' },
    { value: 'A#', label: 'A# / Bb' },
    { value: 'B', label: 'B' },
] as const;

export const NOTES = NOTE_OPTIONS.map(({ value }) => value);

const ENHARMONIC_NOTES: Record<string, string> = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
const FLAT_NOTES: Record<string, string> = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };

export const normalizeNote = (note: string) => ENHARMONIC_NOTES[note] || note;

export const getChordDisplayName = (root: string | null | undefined, type: string | null | undefined, fallback = '') => {
    const canonicalRoot = normalizeNote(root || fallback.charAt(0));
    const suffix = type && type !== 'major' ? type : '';
    const flat = FLAT_NOTES[canonicalRoot];
    return flat ? `${canonicalRoot}${suffix} / ${flat}${suffix}` : `${canonicalRoot}${suffix}`;
};

// Tipos de acordes
export const CHORD_TYPES = [
    { value: 'major', label: 'Mayor' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '6/9', label: '6/9' },
    { value: '7', label: '7' },
    { value: '7(#9)', label: '7(#9)' },
    { value: '7(b5)', label: '7(b5)' },
    { value: '7(b9)', label: '7(b9)' },
    { value: '7sus4', label: '7sus4' },
    { value: '9', label: '9' },
    { value: '11', label: '11' },
    { value: '13', label: '13' },
    { value: 'add9', label: 'add9' },
    { value: 'aug', label: 'aug' },
    { value: 'dim', label: 'dim' },
    { value: 'dim7', label: 'dim7' },
    { value: 'm', label: 'm' },
    { value: 'm6', label: 'm6' },
    { value: 'm7', label: 'm7' },
    { value: 'm7(b5)', label: 'm7(b5)' },
    { value: 'm9', label: 'm9' },
    { value: 'm11', label: 'm11' },
    { value: 'm13', label: 'm13' },
    { value: 'maj7', label: 'maj7' },
    { value: 'maj9', label: 'maj9' },
    { value: 'maj11', label: 'maj11' },
    { value: 'maj13', label: 'maj13' },
    { value: 'sus2', label: 'sus2' },
    { value: 'sus4', label: 'sus4' },
];

// Función para generar el nombre del acorde
export const getChordName = (note: string, type: string): string => {
    if (type === 'major') return note;
    return note + type;
};
