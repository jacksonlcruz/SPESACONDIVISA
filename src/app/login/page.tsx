"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [oauthBannerDismissed, setOauthBannerDismissed] = useState(false);

  // ── Tratamento de erros OAuth via query params ─────────────
  const oauthError = useMemo(() => {
    const code = searchParams.get("error_code");
    const desc = searchParams.get("error_description");
    if (!code && !desc) return null;
    // Mapeia códigos conhecidos para mensagens em italiano
    if (code === "validation_failed" || desc?.includes("provider is not enabled")) {
      return {
        title: "Provider non configurato",
        message:
          "Il provider di accesso selezionato non è stato ancora abilitato. " +
          "Contatta l'amministratore o utilizza un altro metodo di accesso.",
      };
    }
    if (desc?.includes("bad_verification_code") || desc?.includes("invalid_grant")) {
      return {
        title: "Sessione scaduta",
        message: "La tua sessione è scaduta. Per favore, riprova ad accedere.",
      };
    }
    if (desc?.includes("expired") || desc?.includes("timeout")) {
      return {
        title: "Tempo scaduto",
        message: "Il tempo per completare l'accesso è scaduto. Riprova.",
      };
    }
    return {
      title: "Errore di autenticazione",
      message: desc || code || "Si è verificato un errore durante l'accesso. Riprova.",
    };
  }, [searchParams]);

  // Sincroniza erro OAuth com o estado (evita flicker no SSR)
  useEffect(() => {
    if (oauthError && !oauthBannerDismissed) {
      setError(oauthError.message);
    }
  }, [oauthError, oauthBannerDismissed]);

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

  // ── Login com Apple ─────────────────────────────────────
  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
      // OAuth redireciona o usuário para a Apple — não retorna aqui
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore con Apple");
      setIsAppleLoading(false);
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

      {/* Banner de erro OAuth (exibido quando redirect traz erro na URL) */}
      {oauthError && !oauthBannerDismissed && (
        <div className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle size={16} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-400">
                {oauthError.title}
              </p>
              <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                {oauthError.message}
              </p>
            </div>
            <button
              onClick={() => {
                setOauthBannerDismissed(true);
                setError(null);
              }}
              className="p-1 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
              aria-label="Chiudi avviso"
            >
              <X size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      )}

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

        {/* Botão Apple */}
        <button
          onClick={handleAppleSignIn}
          disabled={isAppleLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-black hover:bg-zinc-900 border border-zinc-800 disabled:opacity-50 text-white font-medium transition-colors active:scale-[0.98]"
        >
          {isAppleLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <svg width="20" height="24" viewBox="0 0 814 1000" fill="currentColor">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
            </svg>
          )}
          <span>{isAppleLoading ? "Reindirizzamento..." : "Continua con Apple"}</span>
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