"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Wallet, Mail, Lock, Loader2, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/`,
                    }
                });
                if (error) throw error;
                alert("¡Registro exitoso! Por favor verifica tu email o intenta iniciar sesión.");
                setIsLogin(true);
                setLoading(false);
                return;
            }
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-blue-600 p-10 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30">
                            <Wallet className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">EcoFam</h1>
                        <p className="text-blue-100/70 font-bold uppercase tracking-[0.2em] text-[10px]">
                            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-10">
                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        type="email"
                                        placeholder="tu@email.com"
                                        className="w-full pl-12 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-12 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-900 font-bold transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black tracking-tight text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>{isLogin ? "Entrar" : "Empezar"}</span>
                                    {isLogin ? <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" /> : <UserPlus className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-gray-50 text-center">
                        <p className="text-gray-400 font-bold text-sm mb-4">
                            {isLogin ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}
                        </p>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 font-black text-sm hover:underline flex items-center gap-2 mx-auto"
                        >
                            {isLogin ? "Regístrate gratis" : "Inicia sesión aquí"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
