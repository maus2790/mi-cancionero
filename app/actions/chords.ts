//app/actions/chords.ts
'use server';

import { db } from '@/db';
import { chords } from '@/db/schema';
import { eq, and, like, asc, or, count } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './auth';
import { uploadImage, deleteImage } from '@/lib/r2';
import { canCreateContent, canManageContent } from '@/lib/permissions';

function hasGuitarPosition(serialized: string | null | undefined) {
    try {
        const value = serialized ? JSON.parse(serialized) : null;
        return !!value && (value.barre !== null || (Array.isArray(value.fingers) && value.fingers.some((finger: number) => finger >= 0)));
    } catch { return false; }
}

function hasPianoPosition(serialized: string | null | undefined) {
    try {
        const value = serialized ? JSON.parse(serialized) : null;
        return Array.isArray(value) ? value.length > 0 : Array.isArray(value?.notes) && value.notes.length > 0;
    } catch { return false; }
}

// Obtener todos los acordes (predefinidos + del usuario) - permite duplicados
export async function getAllChords() {
    // El banco es común: los acordes creados por cualquier usuario son visibles para todos.
    return await db.select().from(chords).orderBy(asc(chords.name));
}

// Obtener acorde por ID
export async function getChordById(id: number) {
    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));
    return chord || null;
}

// Crear un acorde (ahora acepta FormData)
export async function createChord(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');
    if (!canCreateContent(user)) throw new Error('No tienes permisos para crear acordes');

    const name = formData.get('name') as string;
    const root = (formData.get('root') as string) || name.charAt(0) || 'C';
    const type = (formData.get('type') as string) || 'major';
    const guitarPositions = formData.get('guitarPositions') as string;
    const pianoPositions = formData.get('pianoPositions') as string;
    const validGuitarPositions = hasGuitarPosition(guitarPositions) ? guitarPositions : null;
    const validPianoPositions = hasPianoPosition(pianoPositions) ? pianoPositions : null;
    const imageFile = formData.get('image') as File | null;
    const imageFolder = (formData.get('imageFolder') as string) || 'chords';
    const isPianoImage = imageFolder === 'piano';

    const now = Math.floor(Date.now() / 1000);

    // Verificar si ya existe un acorde con ese nombre
    const existingChords = await db
        .select()
        .from(chords)
        .where(and(
            eq(chords.name, name),
            or(eq(chords.userId, user.id), eq(chords.isPredefined, true))
        ));

    const ownChord = existingChords.find((chord) => chord.userId === user.id);
    if (ownChord) {
        const addGuitar = validGuitarPositions && !hasGuitarPosition(ownChord.guitarPositions);
        const addPiano = validPianoPositions && !hasPianoPosition(ownChord.pianoPositions);

        if (!addGuitar && !addPiano) {
            throw new Error('Ya tienes una posición para ese instrumento en este acorde. Edítala desde el banco de acordes.');
        }

        const [updatedChord] = await db.update(chords).set({
            ...(addGuitar ? { guitarPositions: validGuitarPositions } : {}),
            ...(addPiano ? { pianoPositions: validPianoPositions } : {}),
            updatedAt: now,
        }).where(eq(chords.id, ownChord.id)).returning();

        revalidatePath('/acordes');
        return updatedChord;
    }

    // Primero insertamos el acorde para obtener el ID
    const [newChord] = await db
        .insert(chords)
        .values({
            name,
            root,
            type,
            guitarPositions: validGuitarPositions,
            pianoPositions: validPianoPositions,
            userId: user.id,
            isPredefined: false,
            createdAt: now,
            updatedAt: now,
        })
        .returning();

    // Si hay imagen, la subimos al campo correcto
    if (imageFile && imageFile.size > 0) {
        const extension = imageFile.name.split('.').pop() || 'png';
        const key = `${imageFolder}/${newChord.id}-${Date.now()}.${extension}`;
        const uploadedUrl = await uploadImage(imageFile, key);
        const updateField = isPianoImage
            ? { pianoImageUrl: uploadedUrl, updatedAt: now }
            : { imageUrl: uploadedUrl, updatedAt: now };
        await db.update(chords).set(updateField).where(eq(chords.id, newChord.id));
        if (isPianoImage) newChord.pianoImageUrl = uploadedUrl;
        else newChord.imageUrl = uploadedUrl;
    }

    revalidatePath('/acordes');
    return newChord;
}

// Actualizar acorde (ahora acepta FormData)
export async function updateChord(id: number, formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));

    if (!chord) throw new Error('Acorde no encontrado');
    if (!canManageContent(user, chord.userId)) throw new Error('No autorizado');

    const name = formData.get('name') as string;
    const root = (formData.get('root') as string) || name?.charAt(0) || chord.root || 'C';
    const type = (formData.get('type') as string) || 'major';
    const guitarPositions = formData.get('guitarPositions') as string;
    const pianoPositions = formData.get('pianoPositions') as string;
    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('removeImage') === 'true';
    const imageFolder = (formData.get('imageFolder') as string) || 'chords';
    const isPianoImage = imageFolder === 'piano';

    const updateData: any = {};
    if (name) updateData.name = name;
    if (root) updateData.root = root;
    if (type) updateData.type = type;
    if (guitarPositions !== undefined) updateData.guitarPositions = guitarPositions || null;
    if (pianoPositions !== undefined) updateData.pianoPositions = pianoPositions || null;

    const publicUrl = process.env.R2_PUBLIC_URL!;
    const extractKey = (url: string) =>
        url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url.split('/').slice(-2).join('/');

    // Manejar imagen de guitarra
    if (!isPianoImage) {
        if (removeImage) {
            if (chord.imageUrl) await deleteImage(extractKey(chord.imageUrl));
            updateData.imageUrl = null;
        } else if (imageFile && imageFile.size > 0) {
            if (chord.imageUrl) await deleteImage(extractKey(chord.imageUrl));
            const ext = imageFile.name.split('.').pop() || 'png';
            const key = `chords/${id}-${Date.now()}.${ext}`;
            updateData.imageUrl = await uploadImage(imageFile, key);
        }
    }

    // Manejar imagen de piano
    if (isPianoImage) {
        if (removeImage) {
            if (chord.pianoImageUrl) await deleteImage(extractKey(chord.pianoImageUrl));
            updateData.pianoImageUrl = null;
        } else if (imageFile && imageFile.size > 0) {
            if (chord.pianoImageUrl) await deleteImage(extractKey(chord.pianoImageUrl));
            const ext = imageFile.name.split('.').pop() || 'png';
            const key = `piano/${id}-${Date.now()}.${ext}`;
            updateData.pianoImageUrl = await uploadImage(imageFile, key);
        }
    }

    updateData.updatedAt = Math.floor(Date.now() / 1000);

    const [updated] = await db
        .update(chords)
        .set(updateData)
        .where(eq(chords.id, id))
        .returning();

    revalidatePath('/acordes');
    return updated;
}

// Eliminar acorde (también eliminar imagen asociada)
export async function deleteChord(id: number) {
    const user = await getCurrentUser();
    if (!user) throw new Error('No autenticado');

    const [chord] = await db
        .select()
        .from(chords)
        .where(eq(chords.id, id));

    if (!chord) throw new Error('Acorde no encontrado');
    if (!canManageContent(user, chord.userId)) throw new Error('No autorizado');

    // Eliminar ambas imágenes si existen
    const publicUrl = process.env.R2_PUBLIC_URL!;
    const extractKey = (url: string) =>
        url.startsWith(publicUrl) ? url.slice(publicUrl.length + 1) : url.split('/').slice(-2).join('/');

    if (chord.imageUrl) await deleteImage(extractKey(chord.imageUrl));
    if (chord.pianoImageUrl) await deleteImage(extractKey(chord.pianoImageUrl));

    await db.delete(chords).where(eq(chords.id, id));
    revalidatePath('/acordes');
}

// Buscar acordes por nombre
export async function searchChords(query: string) {
    let conditions: any[] = [like(chords.name, `%${query}%`)];

    return await db
        .select()
        .from(chords)
        .where(and(...conditions))
        .orderBy(asc(chords.name))
        .limit(20);
}

// Buscar acorde exacto por nombre
export async function getChordByNameExact(name: string) {
    let conditions: any[] = [eq(chords.name, name)];

    const result = await db
        .select()
        .from(chords)
        .where(and(...conditions))
        .orderBy(asc(chords.name))
        .limit(1);

    return result[0] || null;
}

// ============================================================
// CONTAR ACORDES (para el dashboard)
// ============================================================
export async function getChordsCount() {
    const [result] = await db.select({ count: count() }).from(chords);
    return result?.count ?? 0;
}
