'use client';

import { useState } from 'react';
import { X, Printer, Eye, EyeOff, Columns, Smartphone, Palette, Check, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChordNotation } from '@/lib/ChordNotationContext';

export const CHORD_COLORS = [
    { id: 'cyan', name: 'Cyan Eléctrico', class: 'text-cyan-500', hex: '#06b6d4' },
    { id: 'amber', name: 'Ámbar Cálido', class: 'text-amber-500', hex: '#f59e0b' },
    { id: 'emerald', name: 'Verde Esmeralda', class: 'text-emerald-500', hex: '#10b981' },
    { id: 'violet', name: 'Violeta Neón', class: 'text-violet-500', hex: '#8b5cf6' },
    { id: 'rose', name: 'Rosa Coral', class: 'text-rose-500', hex: '#f43f5e' },
    { id: 'blue', name: 'Azul Clásico', class: 'text-blue-500', hex: '#3b82f6' },
];

interface SongSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    hideChords: boolean;
    onToggleHideChords: (hide: boolean) => void;
    columns: 1 | 2;
    onColumnsChange: (cols: 1 | 2) => void;
    chordColor: string;
    onChordColorChange: (colorId: string) => void;
}

export function SongSettingsModal({
    isOpen,
    onClose,
    hideChords,
    onToggleHideChords,
    columns,
    onColumnsChange,
    chordColor,
    onChordColorChange,
}: SongSettingsModalProps) {
    const { notation, setNotation } = useChordNotation();
    const [wakeLockActive, setWakeLockActive] = useState(false);
    const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);

    // Activar / desactivar Wake Lock
    const toggleWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                if (wakeLockActive && wakeLockSentinel) {
                    await wakeLockSentinel.release();
                    setWakeLockSentinel(null);
                    setWakeLockActive(false);
                    toast('Bloqueo de pantalla desactivado');
                } else {
                    const sentinel = await (navigator as any).wakeLock.request('screen');
                    setWakeLockSentinel(sentinel);
                    setWakeLockActive(true);
                    toast.success('Pantalla siempre encendida activada');

                    sentinel.addEventListener('release', () => {
                        setWakeLockActive(false);
                    });
                }
            } catch {
                toast.error('No se pudo activar mantener la pantalla encendida');
            }
        } else {
            toast.error('Tu navegador no soporta mantener la pantalla encendida');
        }
    };

    const handlePrint = () => {
        onClose();
        setTimeout(() => {
            window.print();
        }, 200);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-app-surface border border-[var(--color-border)] rounded-2xl shadow-2xl max-w-sm w-full p-5 text-app">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
                    <h3 className="font-bold text-lg text-app">Ajustes de visualización</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Estilo de Notación de acordes */}
                    <div>
                        <label className="block text-xs font-semibold text-app-muted mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Languages className="w-3.5 h-3.5" /> Notación de acordes
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setNotation('anglosaxon')}
                                className={`px-3 py-2 rounded-xl text-left border transition text-xs font-medium flex flex-col gap-0.5 ${
                                    notation === 'anglosaxon'
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-app ring-1 ring-[var(--color-primary)]'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-border)]/50 text-app-muted'
                                }`}
                            >
                                <span className="font-bold flex items-center justify-between">
                                    Anglosajón
                                    {notation === 'anglosaxon' && <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                                </span>
                                <span className="text-[10px] opacity-75 font-mono">C, D, E, F, G, A, B</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setNotation('latin')}
                                className={`px-3 py-2 rounded-xl text-left border transition text-xs font-medium flex flex-col gap-0.5 ${
                                    notation === 'latin'
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-app ring-1 ring-[var(--color-primary)]'
                                        : 'border-[var(--color-border)] hover:bg-[var(--color-border)]/50 text-app-muted'
                                }`}
                            >
                                <span className="font-bold flex items-center justify-between">
                                    Latino / Solfeo
                                    {notation === 'latin' && <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                                </span>
                                <span className="text-[10px] opacity-75 font-mono">Do, Re, Mi, Fa...</span>
                            </button>
                        </div>
                    </div>

                    {/* Color de los acordes */}
                    <div>
                        <label className="block text-xs font-semibold text-app-muted mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5" /> Color de los acordes
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {CHORD_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => onChordColorChange(c.id)}
                                    className={`h-9 rounded-xl flex items-center justify-center transition ${
                                        chordColor === c.id ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[var(--color-primary)] scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                    }`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                >
                                    {chordColor === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Modo solo letra (ocultar acordes) */}
                    <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                        <div>
                            <span className="text-sm font-semibold text-app flex items-center gap-1.5">
                                {hideChords ? <EyeOff className="w-4 h-4 text-amber-500" /> : <Eye className="w-4 h-4 text-[var(--color-primary)]" />}
                                Modo solo letra
                            </span>
                            <p className="text-xs text-app-muted">Oculta los acordes para vocalistas y coros</p>
                        </div>
                        <button
                            onClick={() => onToggleHideChords(!hideChords)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${hideChords ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                        >
                            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${hideChords ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Disposición en columnas */}
                    <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                        <div>
                            <span className="text-sm font-semibold text-app flex items-center gap-1.5">
                                <Columns className="w-4 h-4" /> Distribución en 2 columnas
                            </span>
                            <p className="text-xs text-app-muted">Ideal para tablets o pantallas amplias</p>
                        </div>
                        <button
                            onClick={() => onColumnsChange(columns === 1 ? 2 : 1)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${columns === 2 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`}
                        >
                            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${columns === 2 ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Mantener pantalla encendida (Wake Lock) */}
                    <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
                        <div>
                            <span className="text-sm font-semibold text-app flex items-center gap-1.5">
                                <Smartphone className="w-4 h-4" /> Pantalla activa en vivo
                            </span>
                            <p className="text-xs text-app-muted">Evita que la pantalla se apague mientras tocas</p>
                        </div>
                        <button
                            onClick={toggleWakeLock}
                            className={`w-11 h-6 rounded-full transition-colors relative ${wakeLockActive ? 'bg-green-500' : 'bg-[var(--color-border)]'}`}
                        >
                            <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${wakeLockActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Botón Imprimir / PDF */}
                    <div className="pt-3 border-t border-[var(--color-border)]">
                        <button
                            onClick={handlePrint}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] text-app text-sm font-bold transition shadow-sm"
                        >
                            <Printer className="w-4 h-4" /> Imprimir o guardar en PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
