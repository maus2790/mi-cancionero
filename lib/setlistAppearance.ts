export const SETLIST_APPEARANCES = [
    { icon: 'music', color: 'sky' },
    { icon: 'guitar', color: 'violet' },
    { icon: 'headphones', color: 'rose' },
    { icon: 'mic', color: 'amber' },
    { icon: 'disc', color: 'emerald' },
    { icon: 'radio', color: 'indigo' },
] as const;

export function getSetlistAppearance(id?: number | null, icon?: string | null, color?: string | null) {
    if (icon && color) return { icon, color };
    return SETLIST_APPEARANCES[Math.abs(id ?? 0) % SETLIST_APPEARANCES.length];
}
