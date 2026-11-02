'use client';

import { FontSize } from '@/types/index';

interface ConfigControlsProps {
    transposition: number;
    fontSize: FontSize;
    onTranspositionChange: (value: number) => void;
    onFontSizeChange: (value: FontSize) => void;
    label?: string;
}

const fontSizeOptions: FontSize[] = ['small', 'medium', 'large', 'xlarge'];
const fontSizeLabels: Record<FontSize, string> = {
    small: 'S',
    medium: 'M',
    large: 'L',
    xlarge: 'XL',
};

export function ConfigControls({
    transposition,
    fontSize,
    onTranspositionChange,
    onFontSizeChange,
    label = 'Configuración',
}: ConfigControlsProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}:
                </span>
            </div>

            {/* Control de transposición */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tono:</span>
                <button
                    onClick={() => onTranspositionChange(transposition - 1)}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                >
                    −
                </button>
                <span className="w-12 text-center font-mono text-sm">
                    {transposition > 0 ? `+${transposition}` : transposition === 0 ? '0' : transposition}
                </span>
                <button
                    onClick={() => onTranspositionChange(transposition + 1)}
                    className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                >
                    +
                </button>
            </div>

            {/* Control de tamaño de letra */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Tamaño:</span>
                {fontSizeOptions.map((size) => (
                    <button
                        key={size}
                        onClick={() => onFontSizeChange(size)}
                        className={`px-2 py-1 text-xs rounded transition ${fontSize === size
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {fontSizeLabels[size]}
                    </button>
                ))}
            </div>
        </div>
    );
}