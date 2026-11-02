// lib/hooks/useOfflineMode.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOfflineConfig, saveOfflineConfig, type OfflineConfig } from '@/lib/offline-db';

const DEFAULT_CONFIG: OfflineConfig = {
    isEnabled: false,
    sections: [],
    lastSyncAt: null,
    songCount: 0,
    chordCount: 0,
    setlistCount: 0,
    favoriteCount: 0,
};

export function useOfflineMode() {
    const [config, setConfig] = useState<OfflineConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);

    const loadConfig = useCallback(async () => {
        try {
            const cfg = await getOfflineConfig();
            setConfig(cfg);
        } catch (e) {
            console.warn('No se pudo leer la configuración offline:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const updateConfig = useCallback(async (updates: Partial<OfflineConfig>) => {
        try {
            await saveOfflineConfig(updates);
            setConfig((prev) => ({ ...prev, ...updates }));
        } catch (e) {
            console.error('Error al guardar configuración offline:', e);
        }
    }, []);

    const isSectionOffline = useCallback(
        (section: string) => config.isEnabled && config.sections.includes(section),
        [config]
    );

    return {
        config,
        loading,
        isSectionOffline,
        updateConfig,
        reload: loadConfig,
    };
}
