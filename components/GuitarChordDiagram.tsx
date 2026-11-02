'use client';

import { useMemo } from 'react';

export interface ChordPosition {
    barre: number | null;
    fingers: (number | -1)[];
    baseFret: number;
}

interface GuitarChordDiagramProps {
    chordName: string;
    width?: number;
    positions?: ChordPosition | null;
}

export function GuitarChordDiagram({ chordName, width = 160, positions }: GuitarChordDiagramProps) {
    const position = useMemo(() => {
        if (positions) {
            const fingers = [...positions.fingers];
            while (fingers.length < 6) fingers.push(-1);
            return {
                barre: positions.barre,
                fingers,
                baseFret: positions.baseFret ?? 1,
            };
        }
        return null;
    }, [positions]);

    if (!position) {
        return <div className="text-sm text-gray-500">Sin posición</div>;
    }

    const { barre, fingers, baseFret } = position;
    const strings = 6;
    const frets = 5;
    const boxWidth = width / (strings + 1);
    const boxHeight = boxWidth * 1.4; // Aumentado para que no se vea achatado

    const leftMargin = boxWidth * 1.5;
    const topMargin = boxHeight * 1.2;
    const svgWidth = width + leftMargin;
    const svgHeight = boxHeight * frets + topMargin * 1.2;

    return (
        <div className="inline-block bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700" style={{ width: svgWidth }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                <g transform={`translate(${leftMargin}, ${topMargin})`}>
                    {/* Fondo del diapasón */}
                    <rect
                        x={boxWidth * 0.5}
                        y={0}
                        width={boxWidth * (strings - 1)}
                        height={boxHeight * frets}
                        fill="#f8fafc"
                        className="dark:fill-gray-900/50"
                    />
                    {/* Trastes */}
                    {Array.from({ length: frets + 1 }, (_, i) => (
                        <line
                            key={`fret-${i}`}
                            x1={boxWidth * 0.5}
                            y1={boxHeight * i}
                            x2={boxWidth * (strings - 0.5)}
                            y2={boxHeight * i}
                            stroke="#475569"
                            strokeWidth={i === 0 ? 4 : 1.5}
                            className="dark:stroke-gray-500"
                        />
                    ))}
                    {/* Cuerdas */}
                    {Array.from({ length: strings }, (_, i) => (
                        <line
                            key={`string-${i}`}
                            x1={boxWidth * (i + 0.5)}
                            y1={0}
                            x2={boxWidth * (i + 0.5)}
                            y2={boxHeight * frets}
                            stroke="#64748b"
                            strokeWidth={1.5}
                            className="dark:stroke-gray-400"
                        />
                    ))}
                    {/* Puntos guía */}
                    {[3, 5].map(relativeFret => {
                        if (relativeFret >= 1 && relativeFret <= frets) {
                            const x = boxWidth * (strings / 2);
                            const y = boxHeight * (relativeFret - 0.5);
                            return <circle key={`dot-${relativeFret}`} cx={x} cy={y} r={boxWidth * 0.15} fill="#cbd5e1" className="dark:fill-gray-700" />;
                        }
                        return null;
                    })}
                    {/* Cejilla */}
                    {barre !== null && (() => {
                        const relativeBarre = barre - baseFret + 1;
                        if (relativeBarre >= 1 && relativeBarre <= frets) {
                            const y = boxHeight * (relativeBarre - 0.5);
                            return (
                                <rect
                                    x={boxWidth * 0.2}
                                    y={y - boxHeight * 0.35}
                                    width={boxWidth * (strings - 0.4)}
                                    height={boxHeight * 0.7}
                                    rx={4}
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                    stroke="#1e40af"
                                    strokeWidth={2}
                                />
                            );
                        }
                        return null;
                    })()}
                    {/* Dedos y cuerdas al aire/muteadas */}
                    {fingers.map((absoluteFret, stringIndex) => {
                        const x = boxWidth * (stringIndex + 0.5);
                        
                        if (absoluteFret === -1) {
                            // Cuerda muteada (X)
                            const s = boxWidth * 0.15;
                            const cy = -boxHeight * 0.35;
                            return (
                                <path
                                    key={`muted-${stringIndex}`}
                                    d={`M ${x - s} ${cy - s} L ${x + s} ${cy + s} M ${x + s} ${cy - s} L ${x - s} ${cy + s}`}
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                />
                            );
                        }
                        if (absoluteFret === 0) {
                            // Cuerda al aire (O)
                            return (
                                <circle
                                    key={`open-${stringIndex}`}
                                    cx={x}
                                    cy={-boxHeight * 0.35}
                                    r={boxWidth * 0.22}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                />
                            );
                        }
                        const relativeFret = absoluteFret - baseFret + 1;
                        if (relativeFret >= 1 && relativeFret <= frets) {
                            const y = boxHeight * (relativeFret - 0.5);
                            return (
                                <circle
                                    key={`finger-${stringIndex}`}
                                    cx={x}
                                    cy={y}
                                    r={boxWidth * 0.35}
                                    fill="#2563eb"
                                    className="dark:fill-blue-500"
                                    stroke="#1e3a8a"
                                    strokeWidth={1.5}
                                />
                            );
                        }
                        return null;
                    })}
                </g>
                {/* Número de traste base: centrado exactamente entre primer y segundo traste */}
                {baseFret > 1 && (
                    <text
                        x={leftMargin * 0.35}
                        y={boxHeight * 0.5 + topMargin}
                        fontSize={boxWidth * 0.95}
                        fontWeight="bold"
                        fill="#64748b"
                        className="dark:fill-gray-400"
                        textAnchor="middle"
                        dominantBaseline="central"
                    >
                        {baseFret}
                    </text>
                )}
            </svg>
        </div>
    );
}