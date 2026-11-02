'use client';

import { ReactNode } from 'react';
import {
    Guitar,
    Music,
    List,
    Heart,
    Repeat,
    Download,
    Sparkles,
    Award,
    Users,
    CheckCircle2,
} from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    const currentYear = new Date().getFullYear();

    const features = [
        {
            icon: Music,
            title: 'Catálogo musical',
            text: 'Accede a tus canciones en cualquier momento.',
        },
        {
            icon: Guitar,
            title: 'Diagramas integrados',
            text: 'Guitarra y piano directamente en cada canción.',
        },
        {
            icon: List,
            title: 'Listas personalizadas',
            text: 'Organiza tu repertorio como prefieras.',
        },
        {
            icon: Repeat,
            title: 'Transposición',
            text: 'Cambia la tonalidad con un solo clic.',
        },
        {
            icon: Heart,
            title: 'Favoritos',
            text: 'Guarda las canciones que más utilizas.',
        },
        {
            icon: Download,
            title: 'Modo offline',
            text: 'Utiliza Tu Cancionero incluso sin conexión.',
        },
    ];

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-slate-950">

            {/* =========================================================
                FONDO GENERAL
            ========================================================== */}

            <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(6,182,212,0.18),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(37,99,235,0.22),transparent_35%),linear-gradient(135deg,#07121e_0%,#0a1929_50%,#081625_100%)]"
            />

            {/* Luces decorativas */}
            <div
                aria-hidden="true"
                className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl"
            />

            <div
                aria-hidden="true"
                className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl"
            />

            {/* =========================================================
                NOTAS MUSICALES DECORATIVAS
            ========================================================== */}

            <div
                aria-hidden="true"
                className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden"
            >
                <span className="absolute top-[12%] left-[7%] text-7xl text-cyan-300/10 rotate-[-12deg]">
                    ♪
                </span>

                <span className="absolute top-[22%] right-[9%] text-8xl text-white/5 rotate-12">
                    ♫
                </span>

                <span className="absolute bottom-[18%] left-[12%] text-9xl text-blue-300/5 rotate-[-8deg]">
                    ♬
                </span>

                <span className="absolute bottom-[10%] right-[18%] text-7xl text-cyan-300/5 rotate-12">
                    ♩
                </span>
            </div>

            {/* =========================================================
                PANEL IZQUIERDO
            ========================================================== */}

            <section className="hidden lg:flex lg:w-[52%] relative z-10 text-white px-12 xl:px-16 py-12 items-center">

                <div className="w-full max-w-xl mx-auto">

                    {/* Logo */}
                    <div className="flex items-center gap-4 mb-12">

                        <div className="relative">
                            <div className="absolute inset-0 bg-cyan-400/30 blur-xl rounded-2xl" />

                            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl">
                                <Guitar className="w-8 h-8 text-cyan-200" />
                            </div>
                        </div>

                        <div>
                            <div className="text-2xl xl:text-3xl font-bold tracking-tight">
                                Tu Cancionero
                            </div>

                            <div className="flex items-center gap-1.5 mt-1">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />

                                <span className="text-xs font-medium text-cyan-100/70">
                                    Tu música, a tu manera
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hero */}
                    <div className="space-y-5">

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-300/10 text-xs font-medium text-cyan-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                            Tu repertorio siempre contigo
                        </div>

                        <h1 className="text-5xl xl:text-6xl font-bold leading-[1.05] tracking-tight">
                            Tu música,
                            <br />

                            <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-300 bg-clip-text text-transparent">
                                en un solo lugar.
                            </span>
                        </h1>

                        <p className="max-w-lg text-lg leading-relaxed text-slate-300">
                            Organiza, interpreta y disfruta tu repertorio
                            musical con todas las herramientas que necesitas.
                        </p>
                    </div>

                    {/* =====================================================
                        CARACTERÍSTICAS
                    ====================================================== */}

                    <div className="grid grid-cols-2 gap-3 mt-10">

                        {features.map(
                            ({ icon: Icon, title, text }, index) => (
                                <div
                                    key={index}
                                    className="
                                        group
                                        relative
                                        p-4
                                        rounded-2xl
                                        bg-white/[0.045]
                                        hover:bg-white/[0.08]
                                        border
                                        border-white/[0.07]
                                        hover:border-cyan-300/20
                                        backdrop-blur-sm
                                        transition-all
                                        duration-300
                                    "
                                >

                                    <div className="flex items-start gap-3">

                                        <div
                                            className="
                                                flex-shrink-0
                                                flex
                                                items-center
                                                justify-center
                                                w-9
                                                h-9
                                                rounded-xl
                                                bg-cyan-400/10
                                                text-cyan-200
                                                group-hover:bg-cyan-400/15
                                                group-hover:scale-105
                                                transition-all
                                            "
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        <div className="min-w-0">

                                            <h3 className="text-sm font-semibold text-white">
                                                {title}
                                            </h3>

                                            <p className="mt-1 text-xs leading-relaxed text-slate-400">
                                                {text}
                                            </p>

                                        </div>

                                    </div>
                                </div>
                            )
                        )}

                    </div>

                    {/* =====================================================
                        ESTADÍSTICAS
                    ====================================================== */}

                    <div className="flex items-center gap-8 mt-8">

                        <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-cyan-300" />

                            <div>
                                <div className="text-sm font-semibold text-white">
                                    1000+
                                </div>

                                <div className="text-[11px] text-slate-500">
                                    canciones
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-7 bg-white/10" />

                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-300" />

                            <div>
                                <div className="text-sm font-semibold text-white">
                                    Comunidad
                                </div>

                                <div className="text-[11px] text-slate-500">
                                    siempre creciendo
                                </div>
                            </div>
                        </div>

                        <div className="w-px h-7 bg-white/10" />

                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />

                            <div>
                                <div className="text-sm font-semibold text-white">
                                    Gratis
                                </div>

                                <div className="text-[11px] text-slate-500">
                                    para comenzar
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="mt-10 pt-6 border-t border-white/[0.07]">
                        <p className="text-xs text-slate-500">
                            © {currentYear} Tu Cancionero
                            <span className="mx-2 text-slate-700">·</span>
                            Música a tu manera
                        </p>
                    </div>

                </div>
            </section>

            {/* =========================================================
                PANEL DERECHO / FORMULARIO
            ========================================================== */}


            <section
                className="
        flex-1
        relative
        z-20
        min-h-screen
        flex
        items-start
        justify-center
        px-4
        py-6
        sm:px-6
        sm:py-8
        lg:py-10
        bg-slate-50
        dark:bg-slate-950
        overflow-y-auto
    "
            >
                {/* Fondo decorativo */}

                <div
                    aria-hidden="true"
                    className="
            absolute
            inset-0
            pointer-events-none
            bg-[radial-gradient(circle_at_80%_15%,rgba(6,182,212,0.10),transparent_30%),radial-gradient(circle_at_15%_90%,rgba(37,99,235,0.08),transparent_30%)]
        "
                />

                {/* Brillo superior */}

                <div
                    aria-hidden="true"
                    className="
            absolute
            -top-32
            -right-32
            w-80
            h-80
            rounded-full
            bg-cyan-400/10
            dark:bg-cyan-500/5
            blur-3xl
            pointer-events-none
        "
                />

                {/* Brillo inferior */}

                <div
                    aria-hidden="true"
                    className="
            absolute
            -bottom-32
            -left-32
            w-80
            h-80
            rounded-full
            bg-blue-500/10
            dark:bg-blue-500/5
            blur-3xl
            pointer-events-none
        "
                />

                {/* Contenedor del formulario */}

                <div className="relative w-full max-w-md">

                    {/* =====================================================
            LOGO MÓVIL
        ====================================================== */}

                    <div className="lg:hidden flex flex-col items-center mb-6">

                        <div
                            className="
                    relative
                    flex
                    items-center
                    justify-center
                    w-14
                    h-14
                    rounded-2xl
                    bg-gradient-to-br
                    from-cyan-500
                    to-blue-600
                    shadow-lg
                    shadow-cyan-500/20
                "
                        >
                            <Guitar className="relative w-7 h-7 text-white" />
                        </div>

                        <h1
                            className="
                    mt-4
                    text-2xl
                    font-bold
                    text-slate-900
                    dark:text-white
                "
                        >
                            Tu Cancionero
                        </h1>

                        <div className="flex items-center gap-1.5 mt-1">

                            <Sparkles
                                className="
                        w-3.5
                        h-3.5
                        text-cyan-500
                        dark:text-cyan-400
                    "
                            />

                            <p
                                className="
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                    "
                            >
                                Tu música, a tu manera
                            </p>

                        </div>

                    </div>

                    {/* Formulario */}

                    {children}

                </div>

            </section>

        </div>
    );
}