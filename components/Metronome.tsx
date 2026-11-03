'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, VolumeX, X, Radio, Minimize2, Maximize2, GripVertical } from 'lucide-react';

interface MetronomeProps {
    isOpen: boolean;
    onClose: () => void;
    initialBpm?: number;
    onBpmChange?: (bpm: number) => void;
    autoPlayOnOpen?: boolean;
}

export function Metronome({
    isOpen,
    onClose,
    initialBpm = 100,
    onBpmChange,
    autoPlayOnOpen = true
}: MetronomeProps) {
    const [bpm, setBpm] = useState(initialBpm);
    const [isPlaying, setIsPlaying] = useState(false);
    const [beatsPerBar, setBeatsPerBar] = useState(4);
    const [currentBeat, setCurrentBeat] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isMinimized, setIsMinimized] = useState(true);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

    // Audio context refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextNoteTimeRef = useRef(0);
    const timerIdRef = useRef<number | null>(null);
    const currentBeatRef = useRef(0);
    const tapTimesRef = useRef<number[]>([]);
    const isPlayingRef = useRef(isPlaying);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // Actualizar bpm si cambia initialBpm y no está en medio de reproducción
    useEffect(() => {
        if (initialBpm && initialBpm > 30) {
            setBpm(initialBpm);
        }
    }, [initialBpm]);

    // Inicializar o reanudar AudioContext
    const initAudio = () => {
        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    // Reproducir un click sintetizado
    const playClick = useCallback((time: number, isFirstBeat: boolean) => {
        if (isMuted || !audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Tono más agudo para el primer tiempo del compás (campanilla/accent)
        osc.frequency.setValueAtTime(isFirstBeat ? 1400 : 900, time);
        osc.type = 'sine';

        gain.gain.setValueAtTime(isFirstBeat ? 0.95 : 0.65, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.045);
    }, [isMuted]);

    // Scheduler para Web Audio API
    const scheduler = useCallback(() => {
        if (!audioContextRef.current) return;
        const lookahead = 0.05; // 50ms
        const currentTime = audioContextRef.current.currentTime;

        while (nextNoteTimeRef.current < currentTime + lookahead) {
            const beat = currentBeatRef.current;
            const isFirst = beat === 0;

            playClick(nextNoteTimeRef.current, isFirst);

            // Programar actualización visual precisa
            const delayMs = Math.max(0, (nextNoteTimeRef.current - currentTime) * 1000);
            window.setTimeout(() => {
                setCurrentBeat(beat);
            }, delayMs);

            // Siguiente pulso
            const secondsPerBeat = 60.0 / bpm;
            nextNoteTimeRef.current += secondsPerBeat;
            currentBeatRef.current = (beat + 1) % beatsPerBar;
        }

        timerIdRef.current = window.setTimeout(scheduler, 25);
    }, [bpm, beatsPerBar, playClick]);

    const startMetronome = useCallback(() => {
        initAudio();
        if (!audioContextRef.current) return;

        currentBeatRef.current = 0;
        nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
        setIsPlaying(true);
        isPlayingRef.current = true;
        scheduler();
    }, [scheduler]);

    const stopMetronome = useCallback(() => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (timerIdRef.current) {
            window.clearTimeout(timerIdRef.current);
            timerIdRef.current = null;
        }
        setCurrentBeat(0);
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            stopMetronome();
        } else {
            startMetronome();
        }
    };

    // Al abrir el componente, asegurar aspecto contraído y sonar de inmediato
    useEffect(() => {
        if (isOpen) {
            setIsMinimized(true);
            if (autoPlayOnOpen && !isPlayingRef.current) {
                startMetronome();
            }
        } else if (!isOpen && isPlayingRef.current) {
            stopMetronome();
        }
    }, [isOpen, autoPlayOnOpen, startMetronome, stopMetronome]);

    // Inicializar posición por defecto en la parte superior derecha
    useEffect(() => {
        if (typeof window !== 'undefined' && position === null) {
            const defaultX = Math.max(10, window.innerWidth - 270);
            const defaultY = 75;
            setPosition({ x: defaultX, y: defaultY });
        }
    }, [position]);

    // Ajustar si la ventana cambia de tamaño o al alternar modo minimizado/expandido
    useEffect(() => {
        if (position && typeof window !== 'undefined') {
            const width = isMinimized ? 260 : 340;
            const height = isMinimized ? 50 : 300;
            const maxX = Math.max(10, window.innerWidth - width - 10);
            const maxY = Math.max(10, window.innerHeight - height - 10);
            if (position.x > maxX || position.y > maxY) {
                setPosition(prev => prev ? {
                    x: Math.min(maxX, Math.max(10, prev.x)),
                    y: Math.min(maxY, Math.max(10, prev.y))
                } : null);
            }
        }
    }, [isMinimized]);

    // Controladores de arrastre por pantalla
    const handlePointerDown = (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, input, [role="button"], input[type="range"]')) {
            return;
        }

        e.preventDefault();
        const currentX = position ? position.x : (window.innerWidth - (isMinimized ? 260 : 340));
        const currentY = position ? position.y : 75;

        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: currentX,
            initialY: currentY,
        };

        try {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;

        const width = containerRef.current?.offsetWidth || (isMinimized ? 240 : 320);
        const height = containerRef.current?.offsetHeight || (isMinimized ? 50 : 280);

        const maxX = Math.max(10, window.innerWidth - width - 10);
        const maxY = Math.max(10, window.innerHeight - height - 10);

        const newX = Math.max(10, Math.min(maxX, dragRef.current.initialX + deltaX));
        const newY = Math.max(10, Math.min(maxY, dragRef.current.initialY + deltaY));

        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (dragRef.current) {
            dragRef.current = null;
            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {}
        }
    };

    useEffect(() => {
        if (isPlaying) {
            if (timerIdRef.current) window.clearTimeout(timerIdRef.current);
            scheduler();
        }
    }, [bpm, beatsPerBar, isPlaying, scheduler]);

    useEffect(() => {
        return () => {
            if (timerIdRef.current) window.clearTimeout(timerIdRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);

    // Tap Tempo
    const handleTapTempo = () => {
        const now = Date.now();
        const taps = tapTimesRef.current.filter(t => now - t < 3000);
        taps.push(now);
        tapTimesRef.current = taps;

        if (taps.length >= 2) {
            const diffs: number[] = [];
            for (let i = 1; i < taps.length; i++) {
                diffs.push(taps[i] - taps[i - 1]);
            }
            const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            const calculatedBpm = Math.round(60000 / avgDiff);
            const clamped = Math.min(240, Math.max(40, calculatedBpm));
            setBpm(clamped);
            if (onBpmChange) onBpmChange(clamped);
        }
    };

    const handleBpmUpdate = (newBpm: number) => {
        const clamped = Math.min(240, Math.max(40, newBpm));
        setBpm(clamped);
        if (onBpmChange) onBpmChange(clamped);
    };

    if (!isOpen) return null;

    // Vista compacta / minimizada (Píldora flotante desplazable por toda la pantalla)
    if (isMinimized) {
        return (
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={position ? { left: `${position.x}px`, top: `${position.y}px` } : { right: '16px', top: '75px' }}
                className="fixed z-40 animate-in fade-in slide-in-from-top-2 pointer-events-auto print:hidden cursor-grab active:cursor-grabbing select-none touch-none"
            >
                <div className="app-glass border border-[var(--color-border)] rounded-full shadow-2xl p-1.5 px-2.5 flex items-center gap-1.5 sm:gap-2 text-app backdrop-blur-xl">
                    {/* Agarradera de arrastre */}
                    <div className="text-app-muted hover:text-app p-0.5 cursor-grab active:cursor-grabbing" title="Arrastrar para mover">
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    <button
                        onClick={togglePlay}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                            isPlaying
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-[var(--color-primary)] text-white'
                        }`}
                        title={isPlaying ? 'Pausar metrónomo' : 'Reanudar metrónomo'}
                    >
                        {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-1 font-mono font-bold text-xs text-app">
                        <span>{bpm}</span>
                        <span className="text-[10px] text-app-muted">BPM</span>
                    </div>

                    {/* Beat pulso visual en modo mini */}
                    <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: beatsPerBar }).map((_, idx) => (
                            <span
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-100 ${
                                    isPlaying && currentBeat === idx
                                        ? idx === 0
                                            ? 'bg-[var(--color-primary)] scale-125'
                                            : 'bg-amber-400 scale-110'
                                        : 'bg-[var(--color-border)]'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setIsMinimized(false)}
                        className="p-1 rounded-full text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                        title="Expandir controles de metrónomo"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={() => {
                            stopMetronome();
                            onClose();
                        }}
                        className="p-1 rounded-full text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                        title="Cerrar metrónomo"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    // Modal Flotante Desplazable por toda la pantalla
    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={position ? { left: `${position.x}px`, top: `${position.y}px` } : { right: '16px', top: '75px' }}
            className="fixed z-40 max-w-[340px] w-[calc(100vw-1rem)] sm:w-80 pointer-events-auto animate-in fade-in slide-in-from-top-3 print:hidden shadow-2xl select-none touch-none"
        >
            <div className="app-card border border-[var(--color-border)] rounded-2xl shadow-2xl p-3.5 text-app backdrop-blur-xl bg-app-surface/95">
                {/* Header no bloqueante con controles y zona de arrastre */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)] mb-2.5 cursor-grab active:cursor-grabbing" title="Arrastrar para mover">
                    <div className="flex items-center gap-1.5">
                        <GripVertical className="w-4 h-4 text-app-muted" />
                        <div className={`p-1.5 rounded-lg ${isPlaying ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-border)] text-app-muted'}`}>
                            <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                        </div>
                        <h4 className="font-bold text-sm text-app">Metrónomo</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono font-semibold">
                            {beatsPerBar}/4
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-1 rounded-lg text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                            title="Minimizar a píldora flotante"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                stopMetronome();
                                onClose();
                            }}
                            className="p-1 rounded-lg text-app-muted hover:text-app hover:bg-[var(--color-border)] transition"
                            title="Cerrar metrónomo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Pulsos visuales de compás */}
                <div className="flex justify-center items-center gap-1.5 mb-3">
                    {Array.from({ length: beatsPerBar }).map((_, idx) => {
                        const isActive = isPlaying && currentBeat === idx;
                        const isFirst = idx === 0;
                        return (
                            <div
                                key={idx}
                                className={`h-3 rounded-full transition-all duration-100 ${
                                    isActive
                                        ? isFirst
                                            ? 'w-8 bg-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/50 scale-110'
                                            : 'w-6 bg-amber-400 shadow-sm scale-105'
                                        : 'w-3 bg-[var(--color-border)]'
                                }`}
                            />
                        );
                    })}
                </div>

                {/* BPM Display y controles rápidos */}
                <div className="flex items-center justify-between gap-2 mb-2 bg-[var(--color-border)]/30 rounded-xl p-2 px-3">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold font-mono text-app tracking-tight">
                            {bpm}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-app-muted">
                            BPM
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleBpmUpdate(bpm - 5)}
                            className="px-2 py-1 rounded text-xs font-bold border border-[var(--color-border)] hover:bg-[var(--color-border)] transition"
                            title="-5 BPM"
                        >
                            -5
                        </button>
                        <button
                            onClick={() => handleBpmUpdate(bpm - 1)}
                            className="p-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-border)] transition"
                            title="-1 BPM"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleBpmUpdate(bpm + 1)}
                            className="p-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-border)] transition"
                            title="+1 BPM"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleBpmUpdate(bpm + 5)}
                            className="px-2 py-1 rounded text-xs font-bold border border-[var(--color-border)] hover:bg-[var(--color-border)] transition"
                            title="+5 BPM"
                        >
                            +5
                        </button>
                    </div>
                </div>

                {/* Slider de Tempo */}
                <div className="mb-3 px-1">
                    <input
                        type="range"
                        min="40"
                        max="240"
                        value={bpm}
                        onChange={(e) => handleBpmUpdate(Number(e.target.value))}
                        className="w-full h-1.5 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                    />
                    <div className="flex justify-between text-[9px] text-app-muted mt-0.5 font-mono">
                        <span>40 Lento</span>
                        <span>100 Moderato</span>
                        <span>140 Vivo</span>
                        <span>240 Rápido</span>
                    </div>
                </div>

                {/* Compás y Tap Tempo */}
                <div className="flex items-center justify-between gap-1.5 mb-3">
                    <div className="flex items-center gap-1">
                        {[2, 3, 4, 6].map((beats) => (
                            <button
                                key={beats}
                                onClick={() => setBeatsPerBar(beats)}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition ${
                                    beatsPerBar === beats
                                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                        : 'border-[var(--color-border)] text-app hover:bg-[var(--color-border)]'
                                }`}
                            >
                                {beats}/4
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleTapTempo}
                        className="px-2.5 py-1 rounded-lg bg-[var(--color-border)] hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] text-[11px] font-bold uppercase transition active:scale-95"
                    >
                        Tap
                    </button>
                </div>

                {/* Acciones principales: Mute y Play/Pausa */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMuted(m => !m)}
                        className={`p-2 rounded-xl border border-[var(--color-border)] text-app transition ${
                            isMuted ? 'text-red-500 bg-red-500/10' : 'hover:bg-[var(--color-border)]'
                        }`}
                        title={isMuted ? 'Sonido silenciado' : 'Sonido activo'}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={togglePlay}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition active:scale-95 ${
                            isPlaying
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-[var(--color-primary)] hover:opacity-90 shadow-[var(--color-primary)]/20'
                        }`}
                    >
                        {isPlaying ? (
                            <>
                                <Square className="w-3.5 h-3.5 fill-white" />
                                <span>Detener</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>Iniciar</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
