// lib/chords.ts
export function transposeChordPro(content: string, semitones: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const regex = /\[([A-G][#b]?)(m|maj|min|sus|dim|aug|7|9|11|13)?([^\]\s]*)\]/g;

    return content.replace(regex, (match, root, suffix, extra) => {
        const idx = notes.indexOf(root);
        if (idx === -1) return match;
        const newIdx = (idx + semitones + 12) % 12;
        const newRoot = notes[newIdx];
        return `[${newRoot}${suffix || ''}${extra || ''}]`;
    });
}