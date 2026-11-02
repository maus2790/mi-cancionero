'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createChord, updateChord } from '@/app/actions/chords';
import { ChordEditor, type ChordEditorData } from '@/components/ChordEditor';
import { ChordEditorPiano, type PianoData } from '@/components/ChordEditorPiano';
import { CHORD_TYPES, NOTE_OPTIONS, getChordName, normalizeNote } from '@/lib/constants';
import { ImageDropCrop } from '@/components/ImageDropCrop';

type Instrument = 'guitar' | 'piano';

const emptyGuitar = (): ChordEditorData => ({ barre: null, fingers: Array(6).fill(-1), baseFret: 1 });
const emptyPiano = (): PianoData => ({ startingNote: 'C', notes: [] });

interface ChordFormModalProps {
    isOpen: boolean;
    chord?: any | null;
    initialInstrument: Instrument;
    onClose: () => void;
    onSaved: (chord: any) => void;
}

export function ChordFormModal(props: ChordFormModalProps) {
    if (!props.isOpen) return null;

    // Usamos una key única para forzar el desmontaje/montaje al cambiar de acorde o al cerrar/abrir
    const key = props.chord?.id ? `edit-${props.chord.id}` : 'new-chord';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={props.onClose}>
            <ChordFormContent key={key} {...props} />
        </div>
    );
}

function ChordFormContent({ chord, initialInstrument, onClose, onSaved }: ChordFormModalProps) {
    const [instrument, setInstrument] = useState<Instrument>(initialInstrument);
    
    // Inicialización síncrona y única del estado
    const [note, setNote] = useState(() => normalizeNote(chord?.root || chord?.name?.charAt(0) || 'C'));
    const [type, setType] = useState(() => chord?.type || 'major');
    
    const [guitar, setGuitar] = useState<ChordEditorData>(() => {
        try {
            const value = chord?.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
            return value ? { barre: value.barre ?? null, fingers: value.fingers || Array(6).fill(-1), baseFret: value.baseFret ?? 1 } : emptyGuitar();
        } catch { return emptyGuitar(); }
    });
    
    const [piano, setPiano] = useState<PianoData>(() => {
        try {
            const value = chord?.pianoPositions ? JSON.parse(chord.pianoPositions) : null;
            return Array.isArray(value) ? { startingNote: 'C', notes: value } : value?.notes ? value : emptyPiano();
        } catch { return emptyPiano(); }
    });

    const [guitarImageFile, setGuitarImageFile] = useState<File | null>(null);
    const [pianoImageFile, setPianoImageFile] = useState<File | null>(null);
    const [removeGuitarImage, setRemoveGuitarImage] = useState(false);
    const [removePianoImage, setRemovePianoImage] = useState(false);

    const [saving, setSaving] = useState(false);

    const name = getChordName(note, type);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        const data = new FormData();
        data.append('name', name);
        data.append('root', note);
        data.append('type', type);

        const imageFile = instrument === 'guitar' ? guitarImageFile : pianoImageFile;
        const removeImageFlag = instrument === 'guitar' ? removeGuitarImage : removePianoImage;

        if (instrument === 'guitar') data.append('guitarPositions', JSON.stringify(guitar));
        else data.append('pianoPositions', JSON.stringify(piano));

        data.append('imageFolder', instrument === 'piano' ? 'piano' : 'chords');
        if (imageFile) data.append('image', imageFile);
        if (removeImageFlag) data.append('removeImage', 'true');

        try {
            const saved = chord ? await updateChord(chord.id, data) : await createChord(data);
            onSaved(saved);
            toast.success(chord ? 'Acorde actualizado' : 'Acorde creado');
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'No se pudo guardar el acorde');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl app-card p-5 md:p-6 shadow-2xl flex flex-col md:flex-row gap-6">
            
            {/* Editor Principal */}
            <div className="flex-1">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-app">{chord ? 'Editar' : 'Nuevo'} acorde</h2>
                    <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-[var(--color-border)] transition md:hidden">
                        <X className="w-5 h-5 text-app-muted" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">Nota *</label>
                        <select value={note} onChange={(event) => setNote(event.target.value)} className="app-input w-full rounded-lg p-2">
                            {NOTE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-app mb-1">Tipo *</label>
                        <select value={type} onChange={(event) => setType(event.target.value)} className="app-input w-full rounded-lg p-2">
                            {CHORD_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex bg-[var(--color-border)] p-1 rounded-lg mb-4 w-fit">
                    {(['guitar', 'piano'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setInstrument(value)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${instrument === value
                                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow'
                                : 'text-app-muted hover:text-app'
                                }`}
                        >
                            {value === 'guitar' ? 'Guitarra' : 'Teclado'}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center">
                    {instrument === 'guitar'
                        ? <ChordEditor initialPositions={guitar} onChange={setGuitar} width={400} />
                        : <ChordEditorPiano initialData={piano} onChange={setPiano} width={460} />
                    }
                </div>
            </div>

            {/* Subida de Imagen (Barra Lateral) */}
            <div className="w-full md:w-80 shrink-0 flex flex-col">
                <div className="hidden md:flex justify-end mb-4">
                    <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-[var(--color-border)] transition">
                        <X className="w-5 h-5 text-app-muted" />
                    </button>
                </div>

                <label className="block text-sm font-medium text-app mb-2">Imagen (opcional)</label>
                <div className={instrument === 'guitar' ? 'block' : 'hidden'}>
                    <ImageDropCrop
                        key={`guitar-img-${chord?.id}`}
                        type="guitar"
                        savedImageUrl={chord?.imageUrl}
                        onCroppedFile={(file) => {
                            setGuitarImageFile(file);
                            if (!file) setRemoveGuitarImage(true);
                        }}
                        onRemove={() => setRemoveGuitarImage(true)}
                    />
                </div>
                <div className={instrument === 'piano' ? 'block' : 'hidden'}>
                    <ImageDropCrop
                        key={`piano-img-${chord?.id}`}
                        type="piano"
                        savedImageUrl={chord?.pianoImageUrl}
                        onCroppedFile={(file) => {
                            setPianoImageFile(file);
                            if (!file) setRemovePianoImage(true);
                        }}
                        onRemove={() => setRemovePianoImage(true)}
                    />
                </div>

                <div className="mt-auto pt-6">
                    <button disabled={saving} className="w-full app-button rounded-lg py-2.5 font-medium disabled:opacity-50">
                        {saving ? 'Guardando…' : `Guardar ${name}`}
                    </button>
                </div>
            </div>
        </form>
    );
}
