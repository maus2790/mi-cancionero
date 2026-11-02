'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { NOTES, normalizeNote } from '@/lib/constants';

interface CapoCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentKey: string;
    onApplyTransposition: (delta: number) => void;
}

export function CapoCalculatorModal({
    isOpen,
    onClose,
    currentKey,
    onApplyTransposition
}: CapoCalculatorModalProps) {
    const [capoFret, setCapoFret] = useState(2);

    if (!isOpen) return null;

    const root = normalizeNote(currentKey || 'C');
    const rootIndex = NOTES.indexOf(root as any);
    const validRootIndex = rootIndex !== -1 ? rootIndex : 0;

    // Con cejilla en traste X, para que suene en `root`, debes tocar acordes con las formas de:
    // Shape = (root - capo) mod 12
    const shapeIndex = (validRootIndex - capoFret + 12) % 12;
    const shapeNote = NOTES[shapeIndex];

    // Transposición delta para convertir la canción a las formas de acordes con cejilla
    const transposeDelta = -capoFret;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-app-surface border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-sm w-full p-5 text-app">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-app">Cejilla / Capo</h3>
                        <p className="text-xs text-app-muted">Calcula las posiciones de acordes con cejilla</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Resumen dinámico */}
                <div className="p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 mb-5">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2.5 rounded-lg bg-app-surface/60">
                            <span className="text-[10px] uppercase font-bold text-app-muted block">Tono que suena</span>
                            <span className="text-2xl font-black text-app">{currentKey || 'C'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[var(--color-primary)]/20">
                            <span className="text-[10px] uppercase font-bold text-[var(--color-primary)] block">Formas a tocar</span>
                            <span className="text-2xl font-black text-[var(--color-primary)]">{shapeNote}</span>
                        </div>
                    </div>
                    <p className="text-xs text-center text-app-muted mt-3">
                        Coloca el capo en el <strong className="text-app">Traste {capoFret}</strong> y toca las posiciones de <strong className="text-[var(--color-primary)]">{shapeNote}</strong>. Sonará en la tonalidad real de <strong className="text-app">{currentKey || 'C'}</strong>.
                    </p>
                </div>

                {/* Selector de traste de capo */}
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-app-muted mb-2 uppercase tracking-wider">
                        Posición del Capo
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((fret) => (
                            <button
                                key={fret}
                                onClick={() => setCapoFret(fret)}
                                className={`py-2 text-xs font-bold rounded-xl border transition ${
                                    capoFret === fret
                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md'
                                        : 'border-[var(--color-border)] text-app hover:bg-[var(--color-border)]'
                                }`}
                            >
                                Traste {fret}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-app hover:bg-[var(--color-border)] transition"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onApplyTransposition(transposeDelta);
                            onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 shadow-md transition"
                    >
                        <Check className="w-4 h-4" />
                        Aplicar formas ({transposeDelta})
                    </button>
                </div>
            </div>
        </div>
    );
}
