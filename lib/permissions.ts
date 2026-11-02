export type ContentUser = { id: number; role?: string | null; provider?: string | null };

export function canCreateContent(user: ContentUser | null | undefined) {
    return !!user && user.provider !== 'guest' && (user.role === 'admin' || user.role === 'creator');
}

export function canManageContent(user: ContentUser | null | undefined, ownerId: number | null, isPublic?: boolean) {
    if (!user || user.provider === 'guest') return false;
    if (user.role === 'admin') return true;
    
    // Si el usuario es el dueño del contenido, puede gestionarlo
    if (user.id === ownerId) return true;
    
    // Creadores pueden gestionar cualquier contenido (público o privado)
    if (user.role === 'creator') return true;
    
    return false;
}
