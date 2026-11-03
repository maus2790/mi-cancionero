'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ChevronUp, ChevronDown, RotateCcw, X, Gauge } from 'lucide-react';

interface AutoScrollControllerProps {
    scrollContainerId?: string;
    onToggleActive?: (active: boolean) => void;
    onClose?: () => void;
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

const getPixelsPerSecond = (spd: number) => {
    if (spd <= 1) {
        return Math.max(3.5, spd * 16);
    }
    return 16 + Math.pow(spd - 1, 1.45) * 20;
};

export function AutoScrollController({
    scrollContainerId = 'main-scroll-container',
    onToggleActive,
    onClose
}: AutoScrollControllerProps) {
    const [isScrolling, setIsScrolling] = useState(false);
    const [speedIndex, setSpeedIndex] = useState(3); // 1x por defecto (SPEEDS[3] = 1)
    const currentSpeed = SPEEDS[speedIndex];
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [progress, setProgress] = useState(0);

    const isScrollingRef = useRef(isScrolling);
    const speedRef = useRef(currentSpeed);
    const animFrameIdRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const accumulatedScrollRef = useRef<number>(0);
    const isUserInteractingRef = useRef(false);
    const userPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isScrollingRef.current = isScrolling;
    }, [isScrolling]);

    useEffect(() => {
        speedRef.current = currentSpeed;
    }, [currentSpeed]);

    // Obtener elemento de scroll real con detección inteligente
    const getContainer = useCallback((): HTMLElement | null => {
        if (typeof document === 'undefined') return null;

        // 1. Probar el ID configurado
        const explicitContainer = document.getElementById(scrollContainerId);
        if (explicitContainer && explicitContainer.scrollHeight > explicitContainer.clientHeight) {
            return explicitContainer;
        }

        // 2. Probar contenedor principal de la app
        const main = document.getElementById('main-scroll-container');
        if (main && main.scrollHeight > main.clientHeight) {
            return main;
        }

        // 3. Probar si el document scrollingElement o documentElement tiene scroll
        if (document.scrollingElement && document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight) {
            return document.scrollingElement as HTMLElement;
        }

        if (document.documentElement && document.documentElement.scrollHeight > document.documentElement.clientHeight) {
            return document.documentElement;
        }

        // Fallback a explicitContainer o documentElement
        return explicitContainer || document.documentElement;
    }, [scrollContainerId]);

    // Calcular progreso de lectura
    const updateProgress = useCallback(() => {
        const container = getContainer();
        if (!container) return;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll <= 0) {
            setProgress(0);
            return;
        }
        const current = container.scrollTop;
        const pct = Math.min(100, Math.max(0, Math.round((current / maxScroll) * 100)));
        setProgress(pct);
    }, [getContainer]);

    // Bucle de animación por frame (requestAnimationFrame)
    const step = useCallback((timestamp: number) => {
        if (!isScrollingRef.current) return;

        // Si el usuario está tocando o haciendo scroll manual con rueda, esperamos
        if (isUserInteractingRef.current) {
            lastTimeRef.current = null;
            animFrameIdRef.current = requestAnimationFrame(step);
            return;
        }

        if (lastTimeRef.current === null) {
            lastTimeRef.current = timestamp;
        }

        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Evitar saltos si la pestaña estuvo en segundo plano
        if (delta > 200) {
            animFrameIdRef.current = requestAnimationFrame(step);
            return;
        }

        const container = getContainer();
        if (container) {
            // Escala de velocidad con soporte para lecturas muy lentas (desde 0.25x / ~4px/s)
            const pixelsPerSecond = getPixelsPerSecond(speedRef.current);
            const scrollDelta = (pixelsPerSecond * delta) / 1000;

            const maxScroll = container.scrollHeight - container.clientHeight;

            if (maxScroll > 5 && container.scrollTop >= maxScroll - 2) {
                // Llegó al final de la canción
                setIsScrolling(false);
                isScrollingRef.current = false;
                if (onToggleActive) onToggleActive(false);
                updateProgress();
                return;
            }

            accumulatedScrollRef.current += scrollDelta;
            container.scrollTop = accumulatedScrollRef.current;

            // En caso de que el scroll del documento no responda solo con container, intentar scrollBy
            if (container === document.documentElement || container === document.body) {
                window.scrollBy(0, scrollDelta);
            }

            updateProgress();
        }

        animFrameIdRef.current = requestAnimationFrame(step);
    }, [getContainer, onToggleActive, updateProgress]);

    const startScroll = () => {
        const container = getContainer();
        if (container) {
            accumulatedScrollRef.current = container.scrollTop;
        }
        setIsScrolling(true);
        isScrollingRef.current = true;
        isUserInteractingRef.current = false;
        if (onToggleActive) onToggleActive(true);
        lastTimeRef.current = null;
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = requestAnimationFrame(step);
    };

    const stopScroll = () => {
        setIsScrolling(false);
        isScrollingRef.current = false;
        if (onToggleActive) onToggleActive(false);
        if (animFrameIdRef.current) {
            cancelAnimationFrame(animFrameIdRef.current);
            animFrameIdRef.current = null;
        }
        lastTimeRef.current = null;
    };

    const toggleScroll = () => {
        if (isScrolling) {
            stopScroll();
        } else {
            startScroll();
        }
    };

    const scrollToTop = () => {
        const container = getContainer();
        if (container) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
            accumulatedScrollRef.current = 0;
            setProgress(0);
        }
    };

    // Detección de interacción manual del usuario (rueda de ratón, gestos táctiles, teclas)
    // CRÍTICO: NO escuchar evento 'scroll' general porque el auto-scroll programático dispara 'scroll'!
    useEffect(() => {
        const handleManualInteraction = () => {
            const container = getContainer();
            if (container) {
                accumulatedScrollRef.current = container.scrollTop;
            }
            updateProgress();

            if (isScrollingRef.current) {
                isUserInteractingRef.current = true;
                if (userPauseTimeoutRef.current) clearTimeout(userPauseTimeoutRef.current);
                userPauseTimeoutRef.current = setTimeout(() => {
                    const c = getContainer();
                    if (c) accumulatedScrollRef.current = c.scrollTop;
                    isUserInteractingRef.current = false;
                    lastTimeRef.current = null;
                }, 1200);
            }
        };

        const container = getContainer();
        const targets: (EventTarget | null)[] = [container, window, document];

        targets.forEach(target => {
            if (!target) return;
            target.addEventListener('wheel', handleManualInteraction, { passive: true });
            target.addEventListener('touchmove', handleManualInteraction, { passive: true });
            target.addEventListener('pointerdown', handleManualInteraction, { passive: true });
        });

        return () => {
            targets.forEach(target => {
                if (!target) return;
                target.removeEventListener('wheel', handleManualInteraction);
                target.removeEventListener('touchmove', handleManualInteraction);
                target.removeEventListener('pointerdown', handleManualInteraction);
            });
            if (userPauseTimeoutRef.current) clearTimeout(userPauseTimeoutRef.current);
        };
    }, [getContainer, updateProgress]);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
            if (userPauseTimeoutRef.current) clearTimeout(userPauseTimeoutRef.current);
        };
    }, []);

    // Atajo de teclado: Barra espaciadora para alternar auto-scroll
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
            if (e.code === 'Space' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (target.tagName !== 'BUTTON') {
                    e.preventDefault();
                    toggleScroll();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isScrolling]);

    return (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 pointer-events-auto max-w-[calc(100vw-1rem)]">
            <div className="app-glass border border-[var(--color-border)] rounded-2xl shadow-2xl p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2 text-app backdrop-blur-xl">
                {/* Botón Minimizar / Expandir */}
                <button
                    onClick={() => setIsCollapsed(c => !c)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-app-muted hover:text-app transition text-xs flex items-center"
                    title={isCollapsed ? 'Expandir control de scroll' : 'Minimizar'}
                >
                    {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Botón Play / Pause Principal */}
                <button
                    onClick={toggleScroll}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition active:scale-95 ${
                        isScrolling
                            ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 animate-pulse'
                            : 'bg-[var(--color-primary)] hover:opacity-90 shadow-[var(--color-primary)]/20'
                    }`}
                    title={isScrolling ? 'Pausar auto-scroll (Espacio)' : 'Iniciar auto-scroll (Espacio)'}
                >
                    {isScrolling ? (
                        <>
                            <Pause className="w-4 h-4 fill-white" />
                            <span>Pausar</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-white" />
                            <span>Scroll</span>
                        </>
                    )}
                </button>

                {!isCollapsed && (
                    <>
                        {/* Control de Velocidad */}
                        <div className="flex items-center gap-1 sm:gap-1.5 pl-1 pr-1 sm:pr-2 border-l border-[var(--color-border)]">
                            <button
                                onClick={() => setSpeedIndex(idx => Math.max(0, idx - 1))}
                                disabled={speedIndex <= 0}
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-[var(--color-border)] hover:bg-[var(--color-border)]/80 disabled:opacity-40 transition"
                                title="Más lento"
                            >
                                -
                            </button>
                            <span className="font-mono text-xs font-bold w-12 sm:w-14 text-center text-app flex items-center justify-center gap-0.5" title="Velocidad de desplazamiento">
                                <Gauge className="w-3 h-3 text-[var(--color-primary)] hidden sm:inline" />
                                {currentSpeed}x
                            </span>
                            <button
                                onClick={() => setSpeedIndex(idx => Math.min(SPEEDS.length - 1, idx + 1))}
                                disabled={speedIndex >= SPEEDS.length - 1}
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-[var(--color-border)] hover:bg-[var(--color-border)]/80 disabled:opacity-40 transition"
                                title="Más rápido"
                            >
                                +
                            </button>
                        </div>

                        {/* Progreso */}
                        <div className="flex items-center gap-1 px-1 sm:px-2 border-l border-[var(--color-border)]">
                            <div className="w-10 sm:w-14 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--color-primary)] transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-app-muted w-6 sm:w-7 text-right">
                                {progress}%
                            </span>
                        </div>

                        {/* Reset a arriba */}
                        <button
                            onClick={scrollToTop}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-app-muted hover:text-app transition text-xs"
                            title="Volver arriba"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Cerrar barra de auto-scroll */}
                        {onClose && (
                            <button
                                onClick={() => {
                                    stopScroll();
                                    onClose();
                                }}
                                className="p-1.5 rounded-lg hover:bg-[var(--color-border)] text-app-muted hover:text-app transition text-xs"
                                title="Cerrar auto-scroll"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
