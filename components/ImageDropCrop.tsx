//components/ImageDropCrop.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Upload, X, ImageIcon, Scissors, RotateCw, ZoomIn, ZoomOut, Check, Camera } from 'lucide-react';

export type ChordType = 'guitar' | 'piano' | 'profile';

interface ImageDropCropProps {
    type: ChordType;
    variant?: 'dropzone' | 'button';
    savedImageUrl?: string | null;
    onCroppedFile: (file: File | null) => void;
    onRemove?: () => void;
}

// Para guitarra, el usuario puede querer algo libre o cuadrado. 
// Para piano, horizontal. Ya que el usuario pidió flexibilidad:
// "mejor que no esten restringidos en tamaño, ademas que puedan sobrepasar la imagen"
// Usaremos free aspect ratio si deciden, o sugerimos uno inicial pero sin bloquear (aspectRatio={NaN}).
const SUGGESTED_RATIOS: Record<ChordType, number> = {
    guitar: 485 / 466,
    piano: 7 / 4.5,
    profile: 1,
};

export function ImageDropCrop({ type, variant = 'dropzone', savedImageUrl, onCroppedFile, onRemove }: ImageDropCropProps) {
    const suggestedAspect = SUGGESTED_RATIOS[type];

    const [rawSrc, setRawSrc] = useState<string | null>(null);
    const [cropOpen, setCropOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(savedImageUrl ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const [fillColor, setFillColor] = useState<'transparent' | '#ffffff'>('transparent');
    const [mounted, setMounted] = useState(false);

    const cropperRef = useRef<ReactCropperElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        if (!preview && savedImageUrl) setPreview(savedImageUrl);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedImageUrl]);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const url = URL.createObjectURL(file);
        setRawSrc(url);
        setCropOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const confirmCrop = () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;

        // Exportamos el canvas con el color de fondo elegido
        const canvas = cropper.getCroppedCanvas({
            fillColor: fillColor,
        });

        if (!canvas) return;

        // Si es transparente usaremos PNG, de lo contrario JPG
        const mimeType = fillColor === 'transparent' ? 'image/png' : 'image/jpeg';
        const ext = fillColor === 'transparent' ? 'png' : 'jpg';

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `chord-image.${ext}`, { type: mimeType });
            const previewUrl = URL.createObjectURL(blob);
            setPreview(previewUrl);
            onCroppedFile(file);
            setCropOpen(false);
            if (rawSrc) URL.revokeObjectURL(rawSrc);
            setRawSrc(null);
        }, mimeType, 0.95);
    };

    const cancelCrop = () => {
        setCropOpen(false);
        if (rawSrc) URL.revokeObjectURL(rawSrc);
        setRawSrc(null);
    };

    const handleRemove = () => {
        setPreview(null);
        onCroppedFile(null);
        onRemove?.();
    };

    // Funciones extra del editor
    const rotate = () => cropperRef.current?.cropper.rotate(90);
    const zoomIn = () => cropperRef.current?.cropper.zoom(0.1);
    const zoomOut = () => cropperRef.current?.cropper.zoom(-0.1);

    const paddingTop = `${(1 / suggestedAspect) * 100}%`;

    return (
        <>
            {variant === 'button' ? (
                <div className="w-full h-full relative z-10">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 sm:p-2.5 shadow-lg transition-colors flex items-center justify-center border-2 border-white dark:border-gray-800"
                        aria-label="Cambiar imagen"
                    >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                </div>
            ) : (
                <div className="w-full">
                    <div
                        className={`relative w-full overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer
                            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
                                : preview ? 'border-gray-200 dark:border-gray-700'
                                    : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'}`}
                        style={{ paddingTop }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => !preview && inputRef.current?.click()}
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-checkered">
                            {preview ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt="Vista previa" className="w-full h-full object-contain bg-white dark:bg-gray-800" />
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                                        <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                                            <Scissors className="w-3.5 h-3.5" /> Cambiar
                                        </button>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleRemove(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg">
                                            <X className="w-3.5 h-3.5" /> Quitar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 px-4 text-center select-none">
                                    <div className={`p-3 rounded-full transition-colors ${isDragging ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                        {isDragging ? <Upload className="w-6 h-6 text-blue-500" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {isDragging ? 'Suelta la imagen' : 'Arrastra o haz clic'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                </div>
            )}

            {cropOpen && rawSrc && mounted && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm"
                    onClick={cancelCrop}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <h2 className="font-semibold text-gray-800 dark:text-white text-base flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-blue-500" />
                                Editor de imagen ({type})
                            </h2>
                            <button type="button" onClick={cancelCrop} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Herramientas (toolbar) */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={zoomIn} className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm" title="Acercar">
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={zoomOut} className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm" title="Alejar">
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={rotate} className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm ml-2" title="Girar 90°">
                                    <RotateCw className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Fondo:</span>
                                <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => setFillColor('transparent')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${fillColor === 'transparent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                    >
                                        Transparente
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFillColor('#ffffff')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${fillColor === '#ffffff' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                    >
                                        Blanco
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`flex-1 overflow-hidden min-h-[300px] ${fillColor === 'transparent' ? 'bg-gray-200 dark:bg-black/50' : 'bg-white'}`}>
                            {type === 'profile' && (
                                <style>{`
                                    .cropper-view-box,
                                    .cropper-face {
                                        border-radius: 50%;
                                    }
                                `}</style>
                            )}
                            <Cropper
                                ref={cropperRef}
                                src={rawSrc}
                                style={{ height: '100%', width: '100%' }}
                                // Permitir hacer zoom hacia afuera y que el cropbox salga de la imagen real
                                viewMode={0}
                                // No restringir el aspecto fijo rígidamente, permitir que el usuario decida,
                                // pero arrancar con el aspecto sugerido
                                initialAspectRatio={suggestedAspect}
                                aspectRatio={type === 'profile' ? 1 : NaN}
                                dragMode="move"
                                guides={true}
                                center={true}
                                background={fillColor === 'transparent'}
                                autoCropArea={0.8}
                                zoomable={true}
                                toggleDragModeOnDblclick={false}
                                wheelZoomRatio={0.1}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                            <button type="button" onClick={cancelCrop} className="px-4 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors">
                                Cancelar
                            </button>
                            <button type="button" onClick={confirmCrop} className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors shadow-md">
                                <Check className="w-4 h-4" /> Finalizar Recorte
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
