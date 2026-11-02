'use client';

import { useState, useEffect } from 'react';

export interface ChordEditorData {
    barre: number | null;
    fingers: (number | -1)[];
    baseFret: number;
}

interface ChordEditorProps {
    initialPositions?: ChordEditorData;
    onChange?: (positions: ChordEditorData) => void;
    width?: number;
}

export function ChordEditor({ initialPositions, onChange, width = 400 }: ChordEditorProps) {
    const strings = 6;
    const frets = 5;
    const boxWidth = width / (strings + 1);
    const boxHeight = boxWidth * 1.4;

    const [baseFret, setBaseFret] = useState<number>(
        initialPositions?.baseFret ?? 1
    );
    const [fingers, setFingers] = useState<(number | -1)[]>(
        () => initialPositions?.fingers || Array(6).fill(-1)
    );
    const [barre, setBarre] = useState<number | null>(
        () => initialPositions?.barre ?? null
    );

    useEffect(() => {
        if (onChange) {
            onChange({ barre, fingers, baseFret });
        }
    }, [fingers, barre, baseFret, onChange]);

    const isFretVisible = (absoluteFret: number) => {
        return absoluteFret >= baseFret && absoluteFret <= baseFret + frets - 1;
    };

    const isBehindBarre = (absoluteFret: number) => {
        if (barre === null) return false;
        return absoluteFret < barre;
    };

    const toggleFinger = (stringIndex: number, absoluteFret: number) => {
        if (isBehindBarre(absoluteFret)) return;
        if (!isFretVisible(absoluteFret)) return;
        setFingers(prev => {
            const copy = [...prev];
            if (copy[stringIndex] === absoluteFret) {
                copy[stringIndex] = -1;
            } else {
                copy[stringIndex] = absoluteFret;
            }
            return copy;
        });
    };

    const setBarreFret = (absoluteFret: number | null) => {
        if (absoluteFret !== null && !isFretVisible(absoluteFret)) return;
        setBarre(absoluteFret);
    };

    const clearAll = () => {
        setFingers(Array(6).fill(-1));
        setBarre(null);
    };

    const barreOptions = Array.from({ length: frets }, (_, i) => baseFret + i);

    const leftMargin = boxWidth * 1.5;
    const topMargin = boxHeight * 0.75;
    const svgWidth = width + leftMargin;
    const svgHeight = boxHeight * frets + topMargin * 1.1;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 w-full max-w-[400px] mx-auto pb-0">
            <div className="flex flex-col items-center">
                {/* Contenedor de controles con margen inferior reducido */}
                <div className="flex flex-wrap gap-2 mb-0 pb-0 items-center w-full">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Traste base:</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={baseFret}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setBaseFret(Math.max(1, val));
                            }}
                            className="w-14 px-2 py-1 border rounded-lg text-sm bg-white dark:bg-gray-700"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Puente:</span>
                        <select
                            value={barre ?? ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    setBarreFret(null);
                                } else {
                                    setBarreFret(Number(val));
                                }
                            }}
                            className="px-2 py-1 border rounded-lg text-sm bg-white dark:bg-gray-700"
                        >
                            <option value="">Sin</option>
                            {barreOptions.map(f => (
                                <option key={f} value={f}>{f}º traste</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="relative w-full -mt-1">
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
                                        <>
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
                                                className="cursor-pointer"
                                                onClick={() => setBarreFret(null)}
                                            />
                                            <text
                                                x={boxWidth * (strings / 2)}
                                                y={y - boxHeight * 0.5 - 4}
                                                fontSize={12}
                                                fill="#1e40af"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                            >
                                                {barre}º
                                            </text>
                                        </>
                                    );
                                }
                                return null;
                            })()}
                            {/* Dedos y cuerdas al aire/muteadas */}
                            {fingers.map((absoluteFret, stringIndex) => {
                                const x = boxWidth * (stringIndex + 0.5);
                                if (absoluteFret === -1) {
                                    const s = boxWidth * 0.15;
                                    const cy = -boxHeight * 0.35;
                                    return (
                                        <path
                                            key={`muted-${stringIndex}`}
                                            d={`M ${x - s} ${cy - s} L ${x + s} ${cy + s} M ${x + s} ${cy - s} L ${x - s} ${cy + s}`}
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            className="cursor-pointer"
                                            onClick={() => toggleFinger(stringIndex, 0)}
                                        />
                                    );
                                }
                                if (absoluteFret === 0) {
                                    return (
                                        <circle
                                            key={`open-${stringIndex}`}
                                            cx={x}
                                            cy={-boxHeight * 0.35}
                                            r={boxWidth * 0.22}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            className="cursor-pointer"
                                            onClick={() => toggleFinger(stringIndex, 0)}
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
                                            className="cursor-pointer dark:fill-blue-500"
                                            stroke="#1e3a8a"
                                            strokeWidth={1.5}
                                            onClick={() => toggleFinger(stringIndex, absoluteFret)}
                                        />
                                    );
                                }
                                return null;
                            })}
                            {/* Áreas clickeables */}
                            {Array.from({ length: strings }, (_, s) =>
                                Array.from({ length: frets }, (_, f) => {
                                    const absoluteFret = baseFret + f;
                                    if (isBehindBarre(absoluteFret)) return null;
                                    const x = boxWidth * (s + 0.5);
                                    const y = boxHeight * (f + 0.5);
                                    return (
                                        <circle
                                            key={`click-${s}-${absoluteFret}`}
                                            cx={x}
                                            cy={y}
                                            r={boxHeight * 0.35}
                                            fill="transparent"
                                            className="cursor-pointer hover:fill-blue-200/30"
                                            onClick={() => toggleFinger(s, absoluteFret)}
                                        />
                                    );
                                })
                            )}
                        </g>
                        {/* Número de traste base */}
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

                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg w-full text-xs font-mono overflow-x-auto hidden">
                    {JSON.stringify({ barre, fingers, baseFret })}
                </div>
            </div>
        </div>
    );
}