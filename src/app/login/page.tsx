"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Listener: redireciona ao logar
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") router.push("/dashboard");
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  // ── Login com Google ────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
      // OAuth redireciona o usuário para o Google — não retorna aqui
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore con Google");
      setIsGoogleLoading(false);
    }
  };

  // ── Login/Registro com Email ────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) return;

    setIsEmailLoading(true);
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        setError("Controlla la tua email per confermare la registrazione!");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di autenticazione");
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-surface-900">
      {/* Logo / header */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-surface-700 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 shadow-lg">
          🛒
        </div>
        <h1 className="text-4xl font-bold text-zinc-100">Spesa Condivisa</h1>
        <p className="text-zinc-400 mt-2 text-base">
          La tua lista della spesa collaborativa
        </p>
      </div>

      {/* Conteúdo */}
      <div className="w-full max-w-sm space-y-4">
        {/* Botão Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 text-white font-medium transition-colors active:scale-[0.98]"
        >
          {isGoogleLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>{isGoogleLoading ? "Reindirizzamento..." : "Continua con Google"}</span>
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-xs text-zinc-600 font-medium">oppure</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Form Email/Senha */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#deff9a]/30 focus:border-[#deff9a]/40 transition-colors"
            autoComplete="email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-2xl px-4 py-3.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#deff9a]/30 focus:border-[#deff9a]/40 transition-colors"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />

          {error && (
            <p className={`text-sm px-1 ${error.includes("email") || error.includes("confermare") ? "text-blue-400" : "text-red-400"}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isEmailLoading || !email.trim() || !password.trim()}
            className="w-full py-3.5 rounded-2xl bg-[#deff9a] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isEmailLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isSignUp ? (
              "Registrati"
            ) : (
              "Accedi"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="w-full text-sm text-zinc-500 hover:text-[#deff9a] transition-colors py-1"
          >
            {isSignUp
              ? "Hai già un account? Accedi"
              : "Non hai un account? Registrati"}
          </button>
        </form>
      </div>
    </div>
  );
}