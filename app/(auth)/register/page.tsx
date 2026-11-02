'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleRegister } from '@/app/actions/auth';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    UserPlus,
    Sparkles,
    ArrowRight,
} from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();

            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            const result = await handleRegister(formData);

            if (result?.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            router.push('/login');
        } catch {
            setError(
                'Ocurrió un error al crear la cuenta. Inténtalo nuevamente.'
            );
            setLoading(false);
        }
    };

    return (
        <div
            className="
                w-full
                bg-white
                dark:bg-slate-900/95
                rounded-3xl
                border
                border-slate-200/80
                dark:border-slate-800
                shadow-[0_20px_70px_rgba(15,23,42,0.12)]
                dark:shadow-[0_20px_70px_rgba(0,0,0,0.35)]
                overflow-hidden
                backdrop-blur-xl
            "
        >

            {/* =========================================================
                CONTENIDO
            ========================================================== */}

            <div className="px-6 pb-7 sm:px-8 sm:pb-8 mt-2 pt-4">

                {/* =====================================================
                    ERROR
                ====================================================== */}

                {error && (
                    <div
                        role="alert"
                        className="
                            mb-5
                            flex
                            items-start
                            gap-3
                            p-3.5
                            rounded-xl
                            bg-red-50
                            dark:bg-red-950/30
                            border
                            border-red-200
                            dark:border-red-900/60
                            text-sm
                            text-red-700
                            dark:text-red-300
                        "
                    >
                        <div
                            className="
                                mt-1
                                w-1.5
                                h-1.5
                                rounded-full
                                bg-red-500
                                flex-shrink-0
                            "
                        />

                        <span>{error}</span>
                    </div>
                )}

                {/* =====================================================
                    FORMULARIO
                ====================================================== */}

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Nombre */}

                    <div>

                        <label
                            htmlFor="name"
                            className="
                                block
                                mb-2
                                text-sm
                                font-semibold
                                text-slate-700
                                dark:text-slate-300
                            "
                        >
                            Nombre completo
                        </label>

                        <div className="relative group">

                            <User
                                aria-hidden="true"
                                className="
                                    absolute
                                    left-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    w-5
                                    h-5
                                    text-slate-400
                                    group-focus-within:text-cyan-500
                                    dark:group-focus-within:text-cyan-400
                                    transition-colors
                                "
                            />

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Juan Pérez"
                                className="
                                    w-full
                                    h-12
                                    pl-11
                                    pr-4
                                    rounded-xl
                                    border
                                    border-slate-200
                                    dark:border-slate-700
                                    bg-slate-50
                                    dark:bg-slate-800/80
                                    text-slate-900
                                    dark:text-white
                                    placeholder:text-slate-400
                                    dark:placeholder:text-slate-500
                                    outline-none
                                    transition-all
                                    duration-200
                                    focus:border-cyan-400
                                    dark:focus:border-cyan-500
                                    focus:ring-4
                                    focus:ring-cyan-500/10
                                "
                            />

                        </div>

                    </div>

                    {/* Email */}

                    <div>

                        <label
                            htmlFor="email"
                            className="
                                block
                                mb-2
                                text-sm
                                font-semibold
                                text-slate-700
                                dark:text-slate-300
                            "
                        >
                            Correo electrónico
                        </label>

                        <div className="relative group">

                            <Mail
                                aria-hidden="true"
                                className="
                                    absolute
                                    left-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    w-5
                                    h-5
                                    text-slate-400
                                    group-focus-within:text-cyan-500
                                    dark:group-focus-within:text-cyan-400
                                    transition-colors
                                "
                            />

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="usuario@email.com"
                                className="
                                    w-full
                                    h-12
                                    pl-11
                                    pr-4
                                    rounded-xl
                                    border
                                    border-slate-200
                                    dark:border-slate-700
                                    bg-slate-50
                                    dark:bg-slate-800/80
                                    text-slate-900
                                    dark:text-white
                                    placeholder:text-slate-400
                                    dark:placeholder:text-slate-500
                                    outline-none
                                    transition-all
                                    duration-200
                                    focus:border-cyan-400
                                    dark:focus:border-cyan-500
                                    focus:ring-4
                                    focus:ring-cyan-500/10
                                "
                            />

                        </div>

                    </div>

                    {/* Contraseña */}

                    <div>

                        <label
                            htmlFor="password"
                            className="
                                block
                                mb-2
                                text-sm
                                font-semibold
                                text-slate-700
                                dark:text-slate-300
                            "
                        >
                            Contraseña
                        </label>

                        <div className="relative group">

                            <Lock
                                aria-hidden="true"
                                className="
                                    absolute
                                    left-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    w-5
                                    h-5
                                    text-slate-400
                                    group-focus-within:text-cyan-500
                                    dark:group-focus-within:text-cyan-400
                                    transition-colors
                                "
                            />

                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="
                                    w-full
                                    h-12
                                    pl-11
                                    pr-12
                                    rounded-xl
                                    border
                                    border-slate-200
                                    dark:border-slate-700
                                    bg-slate-50
                                    dark:bg-slate-800/80
                                    text-slate-900
                                    dark:text-white
                                    placeholder:text-slate-400
                                    dark:placeholder:text-slate-500
                                    outline-none
                                    transition-all
                                    duration-200
                                    focus:border-cyan-400
                                    dark:focus:border-cyan-500
                                    focus:ring-4
                                    focus:ring-cyan-500/10
                                "
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword((value) => !value)
                                }
                                aria-label={
                                    showPassword
                                        ? 'Ocultar contraseña'
                                        : 'Mostrar contraseña'
                                }
                                className="
                                    absolute
                                    right-3
                                    top-1/2
                                    -translate-y-1/2
                                    flex
                                    items-center
                                    justify-center
                                    w-8
                                    h-8
                                    rounded-lg
                                    text-slate-400
                                    hover:text-slate-600
                                    dark:hover:text-slate-200
                                    hover:bg-slate-200/70
                                    dark:hover:bg-slate-700
                                    transition
                                "
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>

                        </div>

                        <p
                            className="
                                mt-2
                                text-xs
                                text-slate-400
                                dark:text-slate-500
                            "
                        >
                            Utiliza una contraseña segura para proteger tu cuenta.
                        </p>

                    </div>

                    {/* =================================================
                        REGISTRARSE
                    ================================================== */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            relative
                            w-full
                            h-12
                            rounded-xl
                            overflow-hidden
                            bg-gradient-to-r
                            from-cyan-500
                            to-blue-600
                            hover:from-cyan-400
                            hover:to-blue-500
                            text-white
                            font-semibold
                            shadow-lg
                            shadow-blue-500/20
                            hover:shadow-blue-500/30
                            transition-all
                            duration-200
                            disabled:opacity-60
                            disabled:cursor-not-allowed
                            flex
                            items-center
                            justify-center
                            gap-2
                            active:scale-[0.99]
                        "
                    >
                        {loading ? (
                            <>
                                <span
                                    className="
                                        w-5
                                        h-5
                                        rounded-full
                                        border-2
                                        border-white/30
                                        border-t-white
                                        animate-spin
                                    "
                                />

                                <span>Creando cuenta...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />

                                <span>Crear mi cuenta</span>
                            </>
                        )}
                    </button>

                </form>

                {/* =====================================================
                    LOGIN
                ====================================================== */}

                <div
                    className="
                        mt-7
                        pt-5
                        border-t
                        border-slate-100
                        dark:border-slate-800
                    "
                >

                    <p
                        className="
                            text-center
                            text-sm
                            text-slate-500
                            dark:text-slate-400
                        "
                    >
                        ¿Ya tienes una cuenta?

                        <a
                            href="/login"
                            className="
                                inline-flex
                                items-center
                                gap-1
                                ml-1
                                font-semibold
                                text-cyan-600
                                dark:text-cyan-400
                                hover:text-blue-600
                                dark:hover:text-blue-300
                                transition-colors
                            "
                        >
                            Inicia sesión

                            <ArrowRight className="w-3.5 h-3.5" />
                        </a>

                    </p>

                </div>

            </div>

        </div>
    );
}