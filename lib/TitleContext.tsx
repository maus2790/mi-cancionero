// lib/TitleContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type TitleContextType = {
    title: string;
    setTitle: (title: string) => void;
    showBack: boolean;
    setShowBack: (show: boolean) => void;
    onBack: () => void;
    // Recibe la función directamente (no un updater)
    setOnBack: (callback: () => void) => void;
    headerRight: ReactNode | null;
    setHeaderRight: (node: ReactNode | null) => void;
};

const TitleContext = createContext<TitleContextType | undefined>(undefined);

export function TitleProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('Tu Cancionero');
    const [showBack, setShowBack] = useState(false);
    // Guardamos la callback dentro de un objeto para que React
    // no la interprete como un "lazy updater" al llamar setOnBack.
    const [onBackRef, setOnBackRef] = useState<{ fn: () => void }>({ fn: () => {} });
    const [headerRight, setHeaderRight] = useState<ReactNode | null>(null);

    // setOnBack envuelve la función en un objeto antes de guardarla
    const setOnBack = useCallback((callback: () => void) => {
        setOnBackRef({ fn: callback });
    }, []);

    return (
        <TitleContext.Provider
            value={{
                title,
                setTitle,
                showBack,
                setShowBack,
                onBack: onBackRef.fn,
                setOnBack,
                headerRight,
                setHeaderRight,
            }}
        >
            {children}
        </TitleContext.Provider>
    );
}

export function useTitle() {
    const context = useContext(TitleContext);
    if (!context) {
        throw new Error('useTitle must be used within TitleProvider');
    }
    return context;
}
