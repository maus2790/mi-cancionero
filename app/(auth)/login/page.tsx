'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { handleLogin, handleGuestLogin } from '@/app/actions/auth';
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    LogIn,
    Users,
    Sparkles,
    ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();

            formData.append('email', email);
            formData.append('password', password);

            const result = await handleLogin(formData);

            if (result?.error) {
                setError(result.error);
                setLoading(false);
                return;
            }

            router.push('/dashboard');
        } catch {
            setError('Ocurrió un error al iniciar sesión. Inténtalo nuevamente.');
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        if (loading) return;

        setLoading(true);
        setError('');

        try {
            await handleGuestLogin();
            router.push('/dashboard');
        } catch {
            setError('No fue posible iniciar como invitado.');
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        if (loading) return;

        setLoading(true);
        window.location.assign('/api/auth/google');
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


            {/* Contenido */}
            <div className="px-6 pb-7 sm:px-8 sm:pb-8 mt-2 pt-4">

                {/* Error */}
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
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-5">

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
                                autoComplete="current-password"
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
                                onClick={() => setShowPassword((value) => !value)}
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
                    </div>

                    {/* Iniciar sesión */}
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
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                <span>Iniciar sesión</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Separador */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>

                    <div className="relative flex justify-center">
                        <span
                            className="
                                px-3
                                bg-white
                                dark:bg-slate-900
                                text-xs
                                font-medium
                                text-slate-400
                                dark:text-slate-500
                            "
                        >
                            o continúa con
                        </span>
                    </div>
                </div>

                {/* Google */}
                <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="
                        w-full
                        h-12
                        rounded-xl
                        bg-white
                        dark:bg-slate-800
                        border
                        border-slate-200
                        dark:border-slate-700
                        text-slate-700
                        dark:text-white
                        font-semibold
                        hover:bg-slate-50
                        dark:hover:bg-slate-700
                        hover:border-slate-300
                        dark:hover:border-slate-600
                        transition-all
                        duration-200
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        flex
                        items-center
                        justify-center
                        gap-3
                    "
                >
                    <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>

                    Continuar con Google
                </button>

                {/* Invitado */}
                <button
                    type="button"
                    onClick={handleGuest}
                    disabled={loading}
                    className="
                        w-full
                        h-12
                        mt-3
                        rounded-xl
                        bg-cyan-50
                        dark:bg-cyan-400/10
                        border
                        border-cyan-200
                        dark:border-cyan-400/20
                        text-cyan-700
                        dark:text-cyan-300
                        font-semibold
                        hover:bg-cyan-100
                        dark:hover:bg-cyan-400/15
                        transition-all
                        duration-200
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        flex
                        items-center
                        justify-center
                        gap-2
                    "
                >
                    <Users className="w-5 h-5" />
                    Entrar como invitado
                </button>

                {/* Registro */}
                <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        ¿No tienes una cuenta?

                        <a
                            href="/register"
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
                            Regístrate aquí
                            <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </p>
                </div>

            </div>
        </div>
    );
}