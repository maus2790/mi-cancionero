'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallAppButton() {
    const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
    const [isIos, setIsIos] = useState(false);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
        setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
        const onBeforeInstall = (event: Event) => {
            event.preventDefault();
            setPromptEvent(event as InstallPromptEvent);
        };
        const onInstalled = () => setInstalled(true);
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = async () => {
        if (promptEvent) {
            await promptEvent.prompt();
            const choice = await promptEvent.userChoice;
            if (choice.outcome === 'accepted') setInstalled(true);
            setPromptEvent(null);
        } else if (isIos) {
            window.alert('En Safari, toca Compartir y después “Agregar a pantalla de inicio”.');
        } else {
            window.alert('Para instalar Tu Cancionero, abre el menú de tu navegador y elige “Instalar aplicación” o “Agregar a pantalla de inicio”.');
        }
    };

    if (installed) return null;

    return (
        <button
            type="button"
            onClick={install}
            className="px-3 py-1.5 bg-cyan-400/25 hover:bg-cyan-300/35 border border-cyan-100/40 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
        >
            <Download className="w-3.5 h-3.5" /> Instalar app
        </button>
    );
}
