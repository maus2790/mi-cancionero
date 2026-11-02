'use client';

import { useEffect, useState } from 'react';
import { ImageDropCrop } from './ImageDropCrop';
import { uploadAvatar, removeAvatar } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { Camera, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
    currentAvatarUrl?: string | null;
    userName: string;
}

export function AvatarUpload({ currentAvatarUrl, userName }: AvatarUploadProps) {
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Refleja el avatar que llega después de cargar el perfil por primera vez.
    useEffect(() => {
        setAvatarUrl(currentAvatarUrl || null);
    }, [currentAvatarUrl]);

    const handleCroppedFile = async (file: File | null) => {
        if (!file) {
            // Si es null, el usuario quiere eliminar
            handleRemoveAvatar();
            return;
        }
        setLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const result = await uploadAvatar(formData);
            setAvatarUrl(result.avatarUrl);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('¿Eliminar tu foto de perfil?')) return;
        setLoading(true);
        try {
            await removeAvatar();
            setAvatarUrl(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Error al eliminar la imagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-xl">
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500 dark:text-gray-400">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                    <ImageDropCrop
                        type="profile"
                        variant="button"
                        savedImageUrl={avatarUrl}
                        onCroppedFile={handleCroppedFile}
                        onRemove={handleRemoveAvatar}
                    />
                </div>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Haz clic en el ícono de la cámara para subir o cambiar tu foto
            </p>
        </div>
    );
}
