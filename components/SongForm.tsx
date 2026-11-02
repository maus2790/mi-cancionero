'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSong } from '@/app/actions/songs';
import toast from 'react-hot-toast';

interface SongFormProps {
  initialData?: {
    id?: number;
    title: string;
    artist: string;
    key: string;
    content: string;
    isPublic: boolean;
  };
}

export function SongForm({ initialData }: SongFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');
    const result = await saveSong(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      toast.success(initialData?.id ? 'Canción actualizada correctamente' : 'Canción creada correctamente');
      router.push('/canciones');
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título *</label>
        <input
          type="text"
          name="title"
          required
          defaultValue={initialData?.title || ''}
          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          placeholder="Nombre de la canción"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Artista</label>
        <input
          type="text"
          name="artist"
          defaultValue={initialData?.artist || ''}
          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          placeholder="Nombre del artista"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tonalidad</label>
        <input
          type="text"
          name="key"
          defaultValue={initialData?.key || ''}
          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          placeholder="Ej: C, G, Am"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido (formato ChordPro) *</label>
        <textarea
          name="content"
          required
          rows={12}
          defaultValue={initialData?.content || ''}
          className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-mono text-sm"
          placeholder="[C]Estrofa...&#10;[G]Coro..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Usa [Acorde] para marcar los acordes. Ej: [C]Estrofa
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isPublic"
          value="true"
          defaultChecked={initialData?.isPublic !== undefined ? initialData.isPublic : true}
          className="w-4 h-4 text-blue-600"
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">Pública (visible para todos)</label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 flex-1"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-2 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
